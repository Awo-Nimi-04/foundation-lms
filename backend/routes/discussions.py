import cloudinary
import json
import os
from collections import defaultdict
from datetime import datetime, timezone
from extensions import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from models.course import Course
from models.discussion import DiscussionGrade, DiscussionPost, DiscussionThread, PostLike
from models.enrollment import Enrollment
from models.user import User
from utils.decorators import instructor_required

def is_enrolled(user_id, course_id):
    return Enrollment.query.filter_by(
        student_id=user_id,
        course_id=course_id
    ).first() is not None

def is_instructor(user_id, course):
    return course.instructor_id == user_id

def serialize_post(post, current_user_id, instructor_id, likes_map, user_map):
    like_user_ids = likes_map.get(post.id, set())

    return {
        "id": post.id,
        "content": post.content,
        "user_id": post.user_id,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "is_edited": post.is_edited,
        "creator_fname": user_map[post.user_id].f_name,
        "creator_lname": user_map[post.user_id].l_name,
        "creator_profile_url": user_map[post.user_id].profile_photo_url,

        "like_count": len(like_user_ids),
        "liked_by_user": current_user_id in like_user_ids,
        "liked_by_instructor": instructor_id in like_user_ids
    }

discussions_bp = Blueprint("discussions", __name__, url_prefix="/discussions")

@discussions_bp.route("/course/<int:course_id>/threads", methods=["POST"])
@instructor_required
def create_thread(course_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    course = Course.query.get_or_404(course_id)

    if not is_instructor(user_id, course):
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.form
    title = data.get("title")
    prompt = data.get("prompt")
    max_score = data.get("max_score")
    due_date = datetime.fromisoformat(data["due_date"]) if data.get("due_date") else None

    if not title and not prompt:
        return jsonify({"error": "Title and prompt required!"}), 401

    # get optional file
        
    thread = DiscussionThread(
        course_id = course_id,
        instructor_id = user_id,
        title = title,
        prompt = prompt,
        due_date = due_date,
        max_score = max_score if max_score else None,
    )

    db.session.add(thread)
    db.session.commit()

    return jsonify({
            "message": "Thread created",
            "assignment_id": thread.id,
            # "reference_file_url": file_url,
    }), 201

@discussions_bp.route("/course/<int:course_id>/threads", methods=["GET"])
@jwt_required()
def get_course_threads(course_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])    
    role = identity["role"]
    
    course = Course.query.get_or_404(course_id)

    if role == "instructor" and not is_instructor(user_id, course):
        return jsonify({"error": "Unauthorized. Instructor does not own this course."}), 403
    
    if role == "student" and not is_enrolled(user_id, course_id):
        return jsonify({"error": "Unauthorized. Student is not enrolled in this course."}), 403
    
    threads = DiscussionThread.query.filter_by(course_id=course_id).all()

    return jsonify([
        {
            "id": t.id,
            "title": t.title,
            "prompt": t.prompt,
            "due_date": t.due_date,
            "created_at": t.created_at
        } for t in threads
    ])

@discussions_bp.route("/threads/<int:thread_id>/posts", methods=["POST"])
@jwt_required()
def create_post(thread_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    thread = DiscussionThread.query.get_or_404(thread_id)

    if not is_enrolled(user_id, thread.course_id):
        return jsonify({"error": "Unauthorized. Student is not enrolled in this course."}), 403

    data = request.get_json()
    parent_post_id = data.get("parent_post_id")

    # Structure: Allow only one top-level answer
    if parent_post_id is None:
        existing = DiscussionPost.query.filter_by(
            thread_id=thread_id,
            user_id=user_id,
            parent_post_id=None
        ).first()

        if existing:
            return jsonify({"error": "Cannot post more than one reply to parent thread. Edit or Delete existing reply."}), 400

    # Structure: Allow only two levels of nesting i.e. Discussion Thread Question -> Student Reply -> Peer Reply to Student Reply (Lowest level)
    if parent_post_id:
        parent = DiscussionPost.query.get_or_404(parent_post_id)

        if parent.parent_post_id is not None:
            return jsonify({"error": "Max reply depth reached"}), 400

    content = data.get("content")

    if not content:
        return jsonify({"error": "Reply cannot be empty"}), 401

    post = DiscussionPost(
        thread_id=thread_id,
        user_id=user_id,
        parent_post_id=parent_post_id,
        content=content
    )

    db.session.add(post)
    db.session.commit()

    enrollments = Enrollment.query.filter_by(course_id=thread.course_id).all()
    student_ids = [e.student_id for e in enrollments]
    users = User.query.filter(User.id.in_(student_ids)).all()
    user_map = {u.id: u for u in users}

    likes = PostLike.query.join(DiscussionPost).filter(
        DiscussionPost.thread_id == thread_id
    ).all()

    likes_map = defaultdict(set)

    for like in likes:
        likes_map[like.post_id].add(like.user_id)

    return jsonify(
        serialize_post(post, user_id, thread.instructor_id, likes_map, user_map)
    ), 201

@discussions_bp.route("/threads/<int:thread_id>", methods=["GET"])
@jwt_required()
def get_thread(thread_id):

    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]

    thread = DiscussionThread.query.get_or_404(thread_id)
    course = Course.query.get_or_404(thread.course_id)

    if role == "instructor" and not is_instructor(user_id, course):
        return jsonify({"error": "Unauthorized. Instructor does not own this course."}), 403
    
    if role == "student" and not is_enrolled(user_id, thread.course_id):
        return jsonify({"error": "Unauthorized. Student is not enrolled in this course."}), 403
    
    posts = DiscussionPost.query.filter_by(thread_id=thread_id).all()

    enrollments = Enrollment.query.filter_by(course_id=course.id).all()
    student_ids = [e.student_id for e in enrollments]

    # Get student info for display
    users = User.query.filter(User.id.in_(student_ids)).all()
    user_map = {u.id: u for u in users}

    likes = PostLike.query.join(DiscussionPost).filter(
        DiscussionPost.thread_id == thread_id
    ).all()

    likes_map = defaultdict(set)

    for like in likes:
        likes_map[like.post_id].add(like.user_id)

    top_level = []
    replies_map = {}

    for post in posts:
        if post.parent_post_id is None:
            top_level.append(post)
        else:
            replies_map.setdefault(post.parent_post_id, []).append(post)

    replies = []

    for post in top_level:
        serialized_post = serialize_post(post, user_id, thread.instructor_id, likes_map, user_map)
        serialized_post["replies"] = [
            serialize_post(r, user_id, thread.instructor_id, likes_map, user_map)
            for r in replies_map.get(post.id, [])
        ]
        replies.append(serialized_post)


    return jsonify({
        "thread": {
            "id": thread.id,
            "title": thread.title,
            "prompt": thread.prompt,
            "due_date": thread.due_date,
            "max_score": thread.max_score if thread.max_score else None,
        },
        "posts": replies
    })

@discussions_bp.route("/posts/<int:post_id>", methods=["PATCH"])
@jwt_required()
def edit_post(post_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    edited_post = DiscussionPost.query.get_or_404(post_id)
    thread = DiscussionThread.query.get_or_404(edited_post.thread_id)

    if edited_post.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    content = data.get("content")
    if not content:
        return jsonify({"error": "Update date is required"}), 401

    edited_post.content = data.get("content")
    edited_post.is_edited = True

    db.session.commit()

    posts = DiscussionPost.query.filter_by(thread_id=thread.id).all()

    enrollments = Enrollment.query.filter_by(course_id=thread.course_id).all()
    student_ids = [e.student_id for e in enrollments]
    users = User.query.filter(User.id.in_(student_ids)).all()
    user_map = {u.id: u for u in users}

    likes = PostLike.query.join(DiscussionPost).filter(
        DiscussionPost.thread_id == thread.id
    ).all()

    likes_map = defaultdict(set)

    for like in likes:
        likes_map[like.post_id].add(like.user_id)
    
    top_level = []
    replies_map = {}

    for post in posts:
        if post.parent_post_id is None:
            top_level.append(post)
        else:
            replies_map.setdefault(post.parent_post_id, []).append(post)


    serialized_post = serialize_post(edited_post, user_id, thread.instructor_id, likes_map, user_map)
    serialized_post["replies"] = [
        serialize_post(r, user_id, thread.instructor_id, likes_map, user_map)
        for r in replies_map.get(edited_post.id, [])
    ]
    
    return jsonify(serialized_post)

@discussions_bp.route("posts/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    post = DiscussionPost.query.get_or_404(post_id)
    thread = DiscussionThread.query.get_or_404(post.thread_id)

    # Only enrolled users can interact
    if not is_enrolled(user_id, thread.course_id):
        return jsonify({"error": "Unauthorized"}), 403

    # Only replies can be deleted
    if post.parent_post_id is None:
        return jsonify({
            "error": "Top-level posts cannot be deleted"
        }), 403

    # Ownership check
    is_owner = post.user_id == user_id

    if not (is_owner):
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(post)
    db.session.commit()

    return jsonify({
        "message": "Post deleted",
        "post_id": post_id
    }), 200

@discussions_bp.route("/posts/<int:post_id>/like", methods=["POST"])
@jwt_required()
def like_post(post_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    post = DiscussionPost.query.get_or_404(post_id)

    existing =  PostLike.query.filter_by(
        post_id=post_id,
        user_id=user_id
    ).first()

    if existing:
        post.like_count -= 1
        db.session.delete(existing)
    else:
        like = PostLike(post_id=post_id, user_id=user_id)
        post.like_count += 1
        db.session.add(like)

    db.session.commit()

    return jsonify({"message": "Like updated"})

@discussions_bp.route("/threads/<int:thread_id>/grade/<int:student_id>", methods=["POST"])
@jwt_required()
def grade_student(thread_id, student_id):

    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    thread = DiscussionThread.query.get_or_404(thread_id)
    course = Course.query.get(thread.course_id)

    if not is_instructor(user_id, course):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    grade = DiscussionGrade.query.filter_by(
        thread_id=thread_id,
        student_id=student_id
    ).first()

    if not grade:
        grade = DiscussionGrade(
            thread_id=thread_id,
            student_id=student_id
        )
    
    score = data.get("score")

    if not score:
        return jsonify({"error": "Score is required"}), 401

    grade.score = score
    # grade.feedback = data.get("feedback")
    grade.graded_at =  datetime.now(timezone.utc)

    db.session.add(grade)
    db.session.commit()

    return jsonify({"message": "Grade saved"})

@discussions_bp.route("/threads/<int:thread_id>/participation", methods=["GET"])
@instructor_required
def get_thread_participation(thread_id):

    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    thread = DiscussionThread.query.get_or_404(thread_id)
    course = Course.query.get_or_404(thread.course_id)

    if not is_instructor(user_id, course):
        return jsonify({"error": "Unauthorized"}), 403

    # Get enrolled students
    enrollments = Enrollment.query.filter_by(course_id=course.id).all()
    student_ids = [e.student_id for e in enrollments]

    # Get all grades for this thread
    grades = DiscussionGrade.query.filter_by(thread_id=thread_id).all()

    grade_map = {
        g.student_id: g for g in grades
    }

    # Get student info for display
    users = User.query.filter(User.id.in_(student_ids)).all()
    user_map = {u.id: u for u in users}

    # Get all the posts in the thread
    posts = DiscussionPost.query.filter_by(thread_id=thread_id).all()

    post_map = {p.id: p for p in posts}

    # Group posts by student

    student_posts_map = defaultdict(list)

    for post in posts:
        student_posts_map[post.user_id].append(post)
    
    def is_late(post):
        if not thread.due_date:
            return False
        return post.created_at > thread.due_date

    def serialize(post):

        return {
            "id": post.id,
            "content": post.content,
            "created_at": post.created_at,
            "is_edited": post.is_edited,

            "is_late": is_late(post)
        }
    
    def serialize_with_context(post):
        parent = post_map.get(post.parent_post_id) if post.parent_post_id else None
        parent_user = user_map.get(parent.user_id) if parent else None

        return {
            "id": post.id,
            "content": post.content,
            "created_at": post.created_at,
            "is_edited": post.is_edited,

            "is_late": is_late(post),

            # 🔥 NEW CONTEXT FIELD
            "parent": {
                "id": parent.id if parent else None,
                "content": parent.content if parent else None,
                "author": {
                    "id": parent_user.id if parent_user else None,
                    "first_name": parent_user.f_name if parent_user else "Unknown",
                    "last_name": parent_user.l_name if parent_user else "Unknown",
                } if parent else None
            } if parent else None
        }
    
    results = []

    for student_id in student_ids:
        student_posts = student_posts_map.get(student_id, [])

        grade = grade_map.get(student_id)

        main_post = None
        comments = []

        for p in student_posts:
            if p.parent_post_id is None:
                main_post = p
            else:
                comments.append(p)

        results.append({
            "student": {
                "id": student_id,
                "first_name": user_map[student_id].f_name if student_id in user_map else "Unknown",
                "last_name": user_map[student_id].l_name if student_id in user_map else "Unknown"
            },

            "main_post": serialize(main_post) if main_post else None,

            "comments": [serialize_with_context(c) for c in comments],

            "grade": {
                "score": grade.score,
                "feedback": grade.feedback,
                "graded_at": grade.graded_at
            } if grade else None,

            "summary": {
                "total_posts": len(student_posts),
                "comment_count": len(comments),
                "has_main_post": main_post is not None,
                "late_main_post": is_late(main_post) if main_post else False
            }
        })

    return jsonify({
        "thread_id": thread.id,
        "prompt": thread.prompt,
        "max_score": thread.max_score if thread.max_score else None,
        "results": results
    })


