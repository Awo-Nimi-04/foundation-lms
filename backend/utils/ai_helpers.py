import re
import requests, io
from PyPDF2 import PdfReader
from docx import Document

def clean_ai_json(text):
    # remove ``` json and ``` wrappers
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)
    return text.strip()

def serialize_question(question, include_answers=False):
    data = {
        "id": question.id,
        "question_text": question.question_text,
        "choices": question.choices,
        "material_id": question.material_id
    }

    if include_answers:
        data["correct_answer"] = question.correct_answer

    return data

def extract_text_from_material(material):
    response = requests.get(material.file_url)
    file_bytes = response.content
    name = material.file_name.lower()

    if name.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n".join([p.extract_text() or "" for p in reader.pages])

    elif name.endswith(".txt"):
        return file_bytes.decode("utf-8")

    elif name.endswith(".docx"):
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs])

    else:
        return ""
    
def extract_text_from_file(file, filename):
    try:
        name = filename.lower()
        file_bytes = file.read()

        if name.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            return "\n".join([p.extract_text() or "" for p in reader.pages])

        elif name.endswith(".txt"):
            return file_bytes.decode("utf-8")

        elif name.endswith(".docx"):
            doc = Document(io.BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs])

        return ""
    except Exception:
        return ""