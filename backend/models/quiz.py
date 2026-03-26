from extensions import db
from datetime import datetime

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    instructor_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    title = db.Column(db.String(255), nullable=False)
    is_published = db.Column(db.Boolean, default=False)
    max_score = db.Column(db.Float, default=10.0)
    created_with_ai = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default="draft")
    date_created = db.Column(db.DateTime, default=datetime.now())
    due_date = db.Column(db.DateTime, nullable=True)
    time_limit_minutes = db.Column(db.Integer, nullable=True)
    ####Questionsssss
    questions = db.relationship("QuizQuestion", backref="quiz", lazy=True)
    course = db.relationship("Course", backref="quizzes")

class QuizQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey("course_material.id"), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)
    choices = db.Column(db.JSON, nullable=True)
    correct_answer = db.Column(db.Text, nullable=False)
    is_ai_generated = db.Column(db.Boolean, default=False)
    last_edited_by_instructor = db.Column(db.Boolean, default=False)