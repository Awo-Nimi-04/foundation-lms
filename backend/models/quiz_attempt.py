from extensions import db
from datetime import datetime

class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(
        db.Integer,
        db.ForeignKey("quiz.id"),
        nullable=False
    )
    student_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )
    started_at = db.Column(
        db.DateTime,
        default=datetime.now()
    )
    submitted_at = db.Column(db.DateTime)
    score = db.Column(db.Float)
    status = db.Column(
        db.String(20),
        default="in_progress"
    )

class QuestionAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(
        db.Integer,
        db.ForeignKey("quiz_attempt.id"),
        nullable=False
    )
    student_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("quiz_question.id"), nullable=False)
    submitted_answer = db.Column(db.Text)
    score = db.Column(db.Float)
    auto_graded = db.Column(db.Boolean, default=True)
    manually_graded = db.Column(db.Boolean, default=False)
    date_taken = db.Column(db.DateTime, default=datetime.now())