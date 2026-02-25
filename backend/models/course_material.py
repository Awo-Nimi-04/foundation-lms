from extensions import db
from datetime import datetime

class CourseMaterial(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    source_name = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f"<CourseMaterial {self.source_name}>"