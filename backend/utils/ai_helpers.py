import re

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