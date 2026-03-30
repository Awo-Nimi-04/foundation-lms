import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import api from "../../api/api";
import PageHeading from "../../components/ui/PageHeading";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

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
    <div className="text-center flex flex-col justify-center min-h-screen space-y-4">
      <PageHeading>Create A Quiz</PageHeading>
      <Card
        customStyles={"w-100 mx-auto"}
        footer={
          <>
            {isCreated && (
              <div className="flex px-2 pb-4 space-x-4">
                <Button variant="secondary" onClick={generateAIQuizQuestions}>
                  Generate Questions with AI
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigate(`/instructor/quizzes/${quizId}/quiz_editor`);
                  }}
                >
                  Create Questions Manually
                </Button>
              </div>
            )}
          </>
        }
      >
        <form
          onSubmit={handleSubmit}
          className="p-4 text-left flex flex-col space-y-3"
        >
          <Input
            label={"Title"}
            type={"text"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={"Quiz title"}
          />

          <Input
            label={"Number of Questions (AI Generation Only)"}
            value={questionCount || ""}
            type={"number"}
            onChange={(e) => setQuestionCount(e.target.value)}
            placeholder={"Set the number of questions"}
          />

          <Input
            label={"Time Limit (minutes)"}
            value={timeLimit}
            type={"number"}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder={"Time limit"}
            customStyles={""}
          />

          <Input
            label={"Due Date"}
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          {error && <p className="">{error}</p>}

          {!isCreated && (
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          )}
        </form>
      </Card>
    </div>
  );
}
