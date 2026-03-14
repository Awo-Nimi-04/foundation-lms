import { useState, useEffect } from "react";
import api from "../../api/api";
import QuizQuestionEditor from "./QuizQuestionEditor";
import { useParams } from "react-router-dom";

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
      console.log(res.data.message)
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
    setQuestions(
      questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
    );
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;

    await api.delete(`/questions/${id}/delete_question`);
    setQuestions(questions.filter((q) => q.id !== id));
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
    <div className="">
      <h2>{quiz.title}</h2>
      {!quiz.is_published && (
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Question"}
        </button>
      )}

      {!quiz.is_published && showAddForm && (
        <QuizQuestionEditor
          onSave={handleAddQuestion}
          quizId={quizId}
          isNew={true}
        />
      )}

      <div className="">
        {questions.map((q) => {
          !quiz.is_published && (
            <QuizQuestionEditor
              key={q.id}
              question={q}
              onSave={handleUpdateQuestion}
              onDelete={() => handleDeleteQuestion(q.id)}
            />
          );
        })}
      </div>

      {!quiz.is_published && (
        <button className="" onClick={handlePublish}>
          Publish Quiz
        </button>
      )}
      {quiz.is_published && <p>Quiz is published.</p>}
    </div>
  );
}
