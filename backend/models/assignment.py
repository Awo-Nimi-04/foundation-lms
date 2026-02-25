from extensions import db
from datetime import datetime

class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.now())
    submissions = db.relationship("AssignmentSubmission", backref="assignment", lazy=True)

class AssignmentSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("assignment.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    submission_text = db.Column(db.Text, nullable=True)
    submission_file = db.Column(db.String(500), nullable=True)
    score = db.Column(db.Float, nullable=True)
    date_submitted = db.Column(db.DateTime, default=datetime.now())