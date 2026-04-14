from extensions import db
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    f_name = db.Column(db.String(50), nullable=False)
    l_name = db.Column(db.String(75), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    profile_photo_url = db.Column(db.String(500), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(255), nullable=True)
    verification_token_expires = db.Column(db.DateTime(timezone=True), nullable=True)
    otp_hash = db.Column(db.String(128), nullable=True)
    otp_expires = db.Column(db.DateTime(timezone=True), nullable=True)

    enrollments = db.relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    courses = db.relationship(
        "Course",
        secondary="enrollments",
        primaryjoin="User.id == Enrollment.student_id",
        secondaryjoin="Course.id == Enrollment.course_id",
        viewonly=True
    )

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
        
    def __repr__(self):
        return f"<User {self.email}"