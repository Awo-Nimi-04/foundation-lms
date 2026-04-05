from extensions import db
from datetime import datetime

class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    instructor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    reference_file_name = db.Column(db.String(255))
    reference_file_url = db.Column(db.String(500)) 
    due_date = db.Column(db.DateTime, nullable=True)
    max_score = db.Column(db.Float)
    allow_text_submission = db.Column(db.Boolean, default=True)
    allow_file_submission = db.Column(db.Boolean, default=True)
    date_created = db.Column(db.DateTime, default=datetime.now())
    submissions = db.relationship("AssignmentSubmission", backref="assignment", lazy=True)

class AssignmentSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("assignment.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    submission_text = db.Column(db.Text, nullable=True)
    submission_file = db.Column(db.String(500), nullable=True)
    submission_file_url = db.Column(db.String(500)) 
    score = db.Column(db.Float, nullable=True)
    feedback = db.Column(db.Text)
    graded_at = db.Column(db.DateTime)
    submitted_at = db.Column(db.DateTime, default=datetime.now())
    version = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default="submitted")