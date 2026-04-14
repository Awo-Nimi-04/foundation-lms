from extensions import db
from datetime import datetime, timezone
from sqlalchemy import func

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    instructor_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    title = db.Column(db.String(255), nullable=False)
    is_published = db.Column(db.Boolean, default=False)
    max_score = db.Column(db.Float, default=10.0)
    created_with_ai = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default="draft")
    date_created = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    due_date = db.Column(db.DateTime(timezone=True), nullable=True)
    time_limit_minutes = db.Column(db.Integer, nullable=True)
    ####Questionsssss
    questions = db.relationship(
        "QuizQuestion",
        backref="quiz",
        lazy=True,
        cascade="all, delete-orphan"
    )
    course = db.relationship("Course", backref="quizzes")

    def get_max_score(self):
        return db.session.query(
            func.coalesce(func.sum(QuizQuestion.score_per_question), 0)
        ).filter(QuizQuestion.quiz_id == self.id).scalar()

    def update_max_score(self):
        self.max_score = sum(q.score_per_question or 0 for q in self.questions)

class QuizQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey("course_material.id"), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)
    choices = db.Column(db.JSON, nullable=True)
    correct_answer = db.Column(db.Text, nullable=False)
    score_per_question =db.Column(db.Integer, default=1)
    last_edited_by_instructor = db.Column(db.Boolean, default=False)