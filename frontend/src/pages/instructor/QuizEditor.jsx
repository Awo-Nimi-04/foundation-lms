import { useState, useEffect } from "react";
import api from "../../api/api";
import QuizQuestionEditor from "./QuizQuestionEditor";
import { useParams } from "react-router-dom";
import PageHeading from "../../components/ui/PageHeading";
import Button from "../../components/ui/Button";

export default function QuizEditor() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/questions/${quizId}`);
      setQuestions(res.data.message);

      const quizRes = await api.get(`/quizzes/${quizId}`);
      setQuiz(quizRes.data);
    } catch (err) {
      console.error(err);
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

    try {
      await api.delete(`/questions/${id}/delete_question`);
      setQuestions(questions.filter((q) => q.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async () => {
    try {
      await api.post(`/quizzes/${quizId}/publish`);
      alert("Quiz published successfully!");
      setQuiz({ ...quiz, is_published: true });
    } catch (err) {
      console.error(err);
      alert("Failed to publish quiz.");
    }
  };

  if (!quiz) return <p>Loading...</p>;

  return (
    <div className="w-full flex flex-col space-y-5">
      <div className="text-center mt-5">
        <PageHeading>Edit {quiz.title}</PageHeading>
        <div className="mx-auto p-3">
          {!(quiz.status === "published") && (
            <Button
              variant={!showAddForm ? "secondary" : "tertiary"}
              onClick={() => setShowAddForm(!showAddForm)}
              customStyles={"w-40"}
            >
              {showAddForm ? "Cancel Question" : "Add Question"}
            </Button>
          )}
        </div>
      </div>
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
            {questions.map((q, i) => {
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
            Publish Quiz
          </Button>
        )}
      </div>
      {quiz.status === "published" && <p className="text-xl font-bold text-stone-200">Quiz is published.</p>}
    </div>
  );
}
