from extensions import db
from datetime import datetime, timezone

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    instructor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    enrollment_start = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )

    enrollment_end = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )

    enrollments = db.relationship(
        "Enrollment",
        back_populates="course",
        cascade="all, delete-orphan"
    )

    def is_enrollment_open(self):
        now = datetime.now(timezone.utc)

        start = self.enrollment_start
        end = self.enrollment_end

        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)

        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)

        return start <= now <= end

    def __repr__(self):
        return f"<Course {self.title}>"