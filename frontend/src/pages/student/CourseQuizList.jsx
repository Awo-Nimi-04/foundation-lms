import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function CourseQuizList() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get(`/quizzes/course/${courseId}`);
      setQuizzes(res.data.message || []);
    } catch (err) {
      console.error("Failed to fetch quizzes", err);
    } finally {
      setLoading(false);
    }
  };

  const isQuizExpired = (dueDate) => {
    if (!dueDate) return false;

    const now = new Date();
    const due = new Date(dueDate);

    return now > due;
  };

  if (loading) return <p>Loading quizzes...</p>;

  return (
    <div className="">
      <div className="">
        <h2>Course Quizzes</h2>
      </div>

      {quizzes.length === 0 && <p>No quizzes yet.</p>}

      {quizzes.map((quiz) => (
        <Card key={quiz.id} title={quiz.title}>
          <div className="">
            {!isQuizExpired(quiz.due_date) && (
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(`/student/quizzes/${quiz.id}/attempt_quiz`)
                }
              >
                {quiz.quiz_attempts.length > 0 ? "Retry" : "Start"}
              </Button>
            )}
            {isQuizExpired(quiz.due_date) && (
                <p className="text-red-500">Unavailable</p>
            )}
            {quiz.quiz_attempts.length > 0 && <Button variant="secondary" onClick={()=>{ navigate(`/student/quizzes/${quiz.id}/quiz_attempts`)}}>View Analytics</Button>}
          </div>
        </Card>
      ))}
    </div>
  );
}
