import { useState, useEffect } from "react";
import api from "../../api/api";

export default function QuizQuestionEditor({ question, onSave, onDelete, quizId, isNew }) {
  const [text, setText] = useState(question?.question_text || "");
  const [type, setType] = useState(question?.question_type || "short_answer");
  const [choices, setChoices] = useState(question?.choices || ["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(question?.correct_answer || "");

  useEffect(() => {
    if (question) {
      setText(question.question_text);
      setType(question.question_type);
      setChoices(question.choices || ["", "", "", ""]);
      setCorrectAnswer(question.correct_answer);
    }
  }, [question]);

  const handleSave = async () => {
    try {
      const payload = {
        question_text: text,
        question_type: type,
        correct_answer: correctAnswer,
        choices: type === "multiple_choice" ? choices : null,
      };

      let res;
      if (isNew) {
        res = await api.post(`/questions/${quizId}/add_question`, payload);
        onSave(res.data);
      } else {
        res = await api.patch(`/questions/${question.id}/edit_question`, payload);
        onSave(res.data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save question.");
    }
  };

  return (
    <div className="">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Question text"
      />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="short_answer">Short Answer</option>
        <option value="multiple_choice">Multiple Choice</option>
      </select>

      {type === "multiple_choice" &&
        choices.map((c, i) => (
          <input
            key={i}
            value={c}
            placeholder={`Choice ${i + 1}`}
            onChange={(e) =>
              setChoices(choices.map((ch, idx) => (idx === i ? e.target.value : ch)))
            }
          />
        ))}

      <input
        value={correctAnswer}
        placeholder="Correct Answer"
        onChange={(e) => setCorrectAnswer(e.target.value)}
      />

      <button onClick={handleSave}>Save</button>
      {!isNew && <button onClick={onDelete}>Delete</button>}
    </div>
  );
}