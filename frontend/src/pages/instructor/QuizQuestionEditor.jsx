import { useState, useEffect } from "react";
import api from "../../api/api";
import { useCourse } from "../../context/CoursecONTEXT.JSX";

export default function QuizQuestionEditor({
  question,
  onSave,
  onDelete,
  quizId,
  isNew,
}) {
  const { currentCourse } = useCourse();
  const [hasChanged, setHasChanged] = useState(false);
  const [text, setText] = useState(question?.question_text || "");
  const [type, setType] = useState(question?.question_type || "short_answer");
  const [choices, setChoices] = useState(question?.choices || ["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(
    question?.correct_answer || "",
  );
  const [currentMaterial, setCurrentMaterial] = useState(
    question?.material_id || "1",
  );
  const [courseMaterials, setCourseMaterials] = useState([]);

  useEffect(() => {
    if (question) {
      setText(question.question_text);
      setType(question.question_type);
      setChoices(question.choices || ["", "", "", ""]);
      setCorrectAnswer(question.correct_answer);
    }
    fetchCourseMaterials();
  }, [question]);

  const fetchCourseMaterials = async () => {
    try {
      const res = await api.get(
        `/courses/${currentCourse.id}/course_materials`,
      );
      setCourseMaterials(res.data.course_materials);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    console.log(question);
    try {
      const payload = {
        question_text: text,
        question_type: type,
        correct_answer: correctAnswer,
        choices: type === "multiple_choice" ? choices : null,
        material_id: currentMaterial,
      };

      let res;
      if (isNew) {
        res = await api.post(`/questions/${quizId}/add_question`, payload);
        onSave(res.data);
      } else {
        res = await api.patch(
          `/questions/${question.id}/edit_question`,
          payload,
        );
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
        onChange={(e) => {
          setText(e.target.value);
          setHasChanged(true);
        }}
        placeholder="Question text"
      />

      <select
        value={currentCourse}
        onChange={(e) => {
          setCurrentMaterial(e.target.value);
          setHasChanged(true);
        }}
      >
        {courseMaterials?.map((material) => (
          <option key={material.material_id} value={material.material_id}>
            {material.material_name}
          </option>
        ))}
      </select>

      <select
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          setHasChanged(true);
        }}
      >
        <option value="short_answer">Short Answer</option>
        <option value="multiple_choice">Multiple Choice</option>
      </select>

      {type === "multiple_choice" &&
        choices.map((c, i) => (
          <input
            key={i}
            value={c}
            placeholder={`Choice ${i + 1}`}
            onChange={(e) => {
              setChoices(
                choices.map((ch, idx) => (idx === i ? e.target.value : ch)),
              );
              setHasChanged(true);
            }}
          />
        ))}

      <input
        value={correctAnswer}
        placeholder="Correct Answer"
        onChange={(e) => {
          setCorrectAnswer(e.target.value);
          setHasChanged(true);
        }}
      />

      <button onClick={handleSave}>Save</button>
      {!isNew && <button onClick={onDelete}>Delete</button>}
      {hasChanged && (
        <button
          onClick={() => {
            setHasChanged(false);
            setCorrectAnswer(question?.correct_answer || "");
            setChoices(question?.choices || ["", "", "", ""]);
            setType(question?.question_type || "short_answer");
            setText(question?.question_text || "");
            setCurrentMaterial(question?.material_id || "1");
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
