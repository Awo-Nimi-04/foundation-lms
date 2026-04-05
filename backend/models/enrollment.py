from extensions import db

class Enrollment(db.Model):
    __tablename__ = "enrollments"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)

    enrolled_at = db.Column(db.DateTime, default=db.func.now())

    status = db.Column(db.String(20), default="active")
    final_grade = db.Column(db.Float, nullable=True)

    
    student = db.relationship("User", back_populates="enrollments")
    course = db.relationship("Course", back_populates="enrollments")

    # Prevent duplicate enrollments
    __table_args__ = (
        db.UniqueConstraint("student_id", "course_id", name="unique_enrollment"),
    )