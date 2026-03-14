import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import api from "../../api/api";

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [quizId, setQuizId] = useState();
  const { courseId } = useParams();
  const [title, setTitle] = useState("");
  const [isCreated, setIsCreated] = useState(false);
  const [timeLimit, setTimeLimit] = useState(null);
  const [questionCount, setQuestionCount] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !dueDate) {
      setError("Title and due date are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        `/quizzes/courses/${courseId}/create_quiz`,
        {
          title: title,
          due_date: dueDate,
          time_limit: timeLimit,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      console.log("Quiz created", res.data);
      setQuizId(res.data.quiz_id);
      setIsCreated(true);
    } catch (err) {
      console.error(err);
      setError("Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  const generateAIQuizQuestions = async () => {
    try {
      const res = await api.post(
        `/quizzes/${quizId}/generate_questions`,
        { num_questions: questionCount },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      navigate(`/instructor/quizzes/${quizId}/quiz_editor`);
    } catch (err) {
      console.error(err);
      setError("Failed to generate quiz questions");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="">
        <div className="">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
          />
        </div>

        <div className="">
          <label>Number of Questions</label>
          <input
            value={questionCount || ""}
            type="number"
            onChange={(e) => setQuestionCount(e.target.value)}
            placeholder="Set the number of questions. (For AI question generation only)"
          />
        </div>

        <div className="">
          <label>Time Limit</label>
          <input
            value={timeLimit}
            type="number"
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder="Time limit (minutes)"
          />
        </div>

        <div className="">
          <label>Due Date</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {error && <p className="">{error}</p>}

        {!isCreated && (
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Creating..." : "Create Quiz"}
          </Button>
        )}
      </form>
      {isCreated && (
        <div className="flex">
          <Button variant="primary" onClick={generateAIQuizQuestions}>
            Generate Questions with AI
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              navigate(`/instructor/quizzes/${quizId}/quiz_editor`);
            }}
          >
            Create Questions Manually
          </Button>
        </div>
      )}
    </div>
  );
}
