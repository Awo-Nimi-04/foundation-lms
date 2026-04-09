from extensions import db

class StudentProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey("course_material.id"), nullable=False)

    mastery_score = db.Column(db.Float, default=0.0)
    last_accessed = db.Column(db.DateTime)

    def __repr__(self):
        return f"<Progress Student {self.student_id} Material {self.material_id}>"

class StudyMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey("course_material.id"), nullable=False)

    role = db.Column(db.String(10)) 
    content = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(10))

    created_at = db.Column(db.DateTime)