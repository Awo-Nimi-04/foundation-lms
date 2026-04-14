from datetime import datetime, timezone
from extensions import db

class DiscussionThread(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)

    instructor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    title = db.Column(db.String(255), nullable=False)
    prompt = db.Column(db.Text, nullable=False)
    reference_file_name = db.Column(db.String(255))
    reference_file_url = db.Column(db.String(500)) 
    max_score = db.Column(db.Float)

    due_date = db.Column(db.DateTime(timezone=True), nullable=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

class DiscussionPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    thread_id = db.Column(db.Integer, db.ForeignKey("discussion_thread.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    parent_post_id = db.Column(db.Integer, db.ForeignKey("discussion_post.id"), nullable=True)

    content = db.Column(db.Text, nullable=False)

    like_count = db.Column(db.Integer, default=0)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

    is_edited = db.Column(db.Boolean, default=False)

class PostLike(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    post_id = db.Column(db.Integer, db.ForeignKey("discussion_post.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("post_id", "user_id", name="unique_like"),
    )

class DiscussionGrade(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    thread_id = db.Column(db.Integer, db.ForeignKey("discussion_thread.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    score = db.Column(db.Float)
    feedback = db.Column(db.Text)

    graded_at = db.Column(db.DateTime(timezone=True))