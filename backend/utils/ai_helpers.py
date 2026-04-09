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

def chunk_text(text, max_chars=2000, overlap=200):
    chunks = []
    start = 0

    while start < len(text):
        end = start + max_chars
        chunk = text[start:end]
        chunks.append(chunk)
        start += max_chars - overlap

    return chunks
    
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