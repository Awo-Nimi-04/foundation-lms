from extensions import db
from datetime import datetime, timezone

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
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    submitted_at = db.Column(db.DateTime(timezone=True))
    score = db.Column(db.Float, default=0)
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
    max_score = db.Column(db.Float, nullable=False)
    auto_graded = db.Column(db.Boolean, default=True)
    manually_graded = db.Column(db.Boolean, default=False)
    date_taken = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    
    __table_args__ = (
    db.UniqueConstraint("attempt_id", "question_id", name="unique_question_attempt"),
    )