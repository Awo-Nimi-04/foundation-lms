import { useState, useEffect } from "react";
import api from "../../api/api";
import QuizQuestionEditor from "./QuizQuestionEditor";
import { useNavigate, useParams } from "react-router-dom";
import PageHeading from "../../components/ui/PageHeading";
import Button from "../../components/ui/Button";
import { useLoading } from "../../context/LoadingContext";
import { useCourse } from "../../context/CourseContext";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

export default function QuizEditor() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { currentCourse } = useCourse();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [questionCount, setQuestionCount] = useState("");
  const [currentMaterial, setCurrentMaterial] = useState("");

  useEffect(() => {
    fetchQuiz();
    fetchCourseMaterials();
  }, []);

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

  const fetchQuiz = async () => {
    showLoading("Fetching Quiz. . .");
    try {
      const res = await api.get(`/questions/${quizId}`);
      setQuestions(res.data.message);

      const quizRes = await api.get(`/quizzes/${quizId}`);
      setQuiz(quizRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleAddQuestion = (newQuestion) => {
    setQuestions([...questions, newQuestion]);
    setShowAddForm(false);
  };

  const handleUpdateQuestion = (updatedQuestion) => {
    setQuestions((prevState) => {
      const existing = prevState.find((q) => q.id === updatedQuestion.id);

      if (existing) {
        return prevState.map((q) =>
          q.id === updatedQuestion.id ? updatedQuestion : q,
        );
      }

      return [...prevState, updatedQuestion];
    });
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    showLoading("Deleting Question. . .");
    try {
      await api.delete(`/questions/${id}/delete_question`);
      setQuestions(questions.filter((q) => q.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const generateAIQuizQuestions = async () => {
    showLoading("Generating Questions. . .");
    // console.log(currentMaterial, currentMaterial);
    try {
      const res = await api.post(
        `/quizzes/${quizId}/generate_questions`,
        { num_questions: questionCount, material_id: currentMaterial },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      setShowGenerateForm(false);
      setCurrentMaterial("");
      setQuestionCount("");
      fetchQuiz();
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handlePublish = async () => {
    showLoading("Publishing Quiz. . .");
    try {
      await api.post(`/quizzes/${quizId}/publish`);
      alert("Quiz published successfully!");
      setQuiz({ ...quiz, is_published: true });
      navigate(`/instructor/course/${currentCourse.id}/quizzes`);
    } catch (err) {
      console.error(err);
      alert("Failed to publish quiz.");
    } finally {
      hideLoading();
    }
  };

  if (!quiz) return <p>Loading...</p>;

  return (
    <div className="w-full flex flex-col space-y-5">
      <div className="text-center mt-5">
        <PageHeading>Edit {quiz.title}</PageHeading>
        <div className="mx-auto p-3">
          {!(quiz.status === "published") && (
            <div className="flex items-center justify-center space-x-5">
              <Button
                variant={!showAddForm ? "secondary" : "tertiary"}
                onClick={() => setShowAddForm((prev) => !prev)}
                customStyles={"w-40"}
                disabled={showGenerateForm}
              >
                {showAddForm ? "Cancel Question" : "Add Question"}
              </Button>
              <Button
                variant={!showGenerateForm ? "secondary" : "tertiary"}
                onClick={() => setShowGenerateForm((prev) => !prev)}
                customStyles={"w-60"}
                disabled={showAddForm}
              >
                {!showGenerateForm ? "Generate Questions" : "Cancel"}
              </Button>
            </div>
          )}
        </div>
        {showGenerateForm && (
          <Card
            title={"AI Question Generator"}
            customStyles={"w-100 mx-auto"}
            footer={
              <div className="p-2 mb-2">
                <Button variant="secondary" onClick={generateAIQuizQuestions}>
                  Generate
                </Button>
              </div>
            }
          >
            <div className="p-3 space-y-5">
              <Input
                label={"Number of Questions"}
                value={questionCount || ""}
                type={"number"}
                onChange={(e) => setQuestionCount(e.target.value)}
                placeholder={"Set the number of questions"}
              />
              <Select
                value={currentMaterial}
                label={"Material"}
                onChange={(e) => {
                  setCurrentMaterial(e.target.value);
                }}
              >
                <option value="">Select a file</option>
                {courseMaterials?.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.file_name}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        )}
      </div>
      {questions.length <= 0 && (
        <h2 className="text-lg text-stone-300 font-semibold text-center">
          This quiz has no questions
        </h2>
      )}
      <div className="w-full grid grid-cols-2 gap-8">
        {!(quiz.status === "published") && showAddForm && (
          <QuizQuestionEditor
            onSave={handleAddQuestion}
            quizId={quizId}
            isNew={true}
          />
        )}
        {!(quiz.status === "published") && (
          <>
            {questions.length > 0 &&
              questions.map((q, i) => {
                return (
                  <QuizQuestionEditor
                    index={i + 1}
                    key={q.id}
                    question={q}
                    onSave={handleUpdateQuestion}
                    onDelete={() => handleDeleteQuestion(q.id)}
                  />
                );
              })}
          </>
        )}
      </div>
      <div className="mx-auto p-4">
        {!(quiz.status === "published") && (
          <Button
            variant="primary"
            customStyles={"w-40"}
            onClick={handlePublish}
          >
            Publish
          </Button>
        )}
      </div>
      {quiz.status === "published" && (
        <p className="text-xl font-bold text-stone-200 text-center">
          Quiz is published.
        </p>
      )}
    </div>
  );
}

// {isCreated && (
//   <div className="flex px-2 pb-4 space-x-4">
//     <Button variant="secondary" onClick={generateAIQuizQuestions}>
//       Generate Questions with AI
//     </Button>
//     <Button
//       variant="secondary"
//       onClick={() => {
//         navigate(`/instructor/quizzes/${quizId}/quiz_editor`);
//       }}
//     >
//       Create Questions Manually
//     </Button>
//   </div>
// )}
