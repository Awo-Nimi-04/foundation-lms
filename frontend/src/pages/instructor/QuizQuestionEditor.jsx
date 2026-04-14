import { useState, useEffect } from "react";
import api from "../../api/api";
import { useCourse } from "../../context/CoursecONTEXT.JSX";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Select from "../../components/ui/Select";

export default function QuizQuestionEditor({
  index,
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
  const [questionPoints, setQuestionPoints] = useState(
    question?.score_per_question || 1,
  );
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
    // console.log(question);
    // console.log(questionPoints)
    try {
      const payload = {
        question_text: text,
        question_type: type,
        correct_answer: correctAnswer,
        choices: type === "multiple_choice" ? choices : null,
        material_id: currentMaterial,
        score_per_question: questionPoints,
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
      setHasChanged(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save question.");
    }
  };

  return (
    <Card
      title={`${!isNew ? `Question ${index}` : "New Question"}`}
      customStyles={"py-4 text-center w-80 md:w-100 lg:w-160 my-8"}
      footer={
        <div className="flex items-center space-x-2 justify-center">
          <Button
            variant="secondary"
            customStyles={"w-20 font-bold"}
            onClick={handleSave}
            disabled={!hasChanged}
          >
            Save
          </Button>
          {!isNew && (
            <Button variant="danger" customStyles={"w-20"} onClick={onDelete}>
              Delete
            </Button>
          )}
          {hasChanged && (
            <Button
              variant="tertiary"
              customStyles={"w-20 font-bold"}
              onClick={() => {
                setHasChanged(false);
                setCorrectAnswer(question?.correct_answer || "");
                setChoices(question?.choices || ["", "", "", ""]);
                setType(question?.question_type || "short_answer");
                setText(question?.question_text || "");
                setCurrentMaterial(question?.material_id || "1");
                setQuestionPoints(question?.score_per_question || 1);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3 py-1 px-2">
        <Input
          label={"Question Text"}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setHasChanged(true);
          }}
          placeholder={"Question text"}
        />

        <Select
          label={"Material"}
          value={currentMaterial}
          onChange={(e) => {
            setCurrentMaterial(e.target.value);
            setHasChanged(true);
          }}
        >
          <option value="">
            Select a file
          </option>
          {courseMaterials?.map((material) => (
            <option key={material.id} value={material.id}>
              {material.file_name}
            </option>
          ))}
        </Select>

        <Select
          label={"Question Type"}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setHasChanged(true);
          }}
        >
          <option value="short_answer">Short Answer</option>
          <option value="multiple_choice">Multiple Choice</option>
        </Select>
        <div className="flex flex-col space-y-3">
          {type === "multiple_choice" && (
            <>
              {choices?.map((c, i) => (
                <Input
                  label={`Choice ${i + 1}`}
                  key={i}
                  value={c}
                  placeholder={`Choice ${i + 1}`}
                  onChange={(e) => {
                    setChoices(
                      choices.map((ch, idx) =>
                        idx === i ? e.target.value : ch,
                      ),
                    );
                    setHasChanged(true);
                  }}
                />
              ))}
            </>
          )}

          <Input
            label={"Correct Answer"}
            value={correctAnswer}
            placeholder={"Correct Answer"}
            onChange={(e) => {
              setCorrectAnswer(e.target.value);
              setHasChanged(true);
            }}
          />

          <Input
            label={"Total Question Points"}
            type={"number"}
            value={questionPoints}
            placeholder={"Total points for this question"}
            onChange={(e) => {
              setQuestionPoints(e.target.value);
              setHasChanged(true);
            }}
          />
        </div>
      </div>
    </Card>
  );
}
