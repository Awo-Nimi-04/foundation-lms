from extensions import db
from datetime import datetime

class CourseMaterial(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    folder_id = db.Column(db.Integer, db.ForeignKey('material_folder.id'), nullable=True)
    file_name = db.Column(db.String(255))
    file_url = db.Column(db.String(500))
    download_url = db.Column(db.String(500))
    extracted_text = db.Column(db.Text) 
    created_at = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f"<CourseMaterial {self.file_name}>"
    
class MaterialFolder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    materials = db.relationship("CourseMaterial", backref="folder", lazy=True)

