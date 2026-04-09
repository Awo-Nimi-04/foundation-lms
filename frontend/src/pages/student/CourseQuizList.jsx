import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import PageHeading from "../../components/ui/PageHeading";
import Label from "../../components/ui/Label";
import ListCard from "../../components/ui/ListCard";
import dayjs from "dayjs";
import BackButton from "../../components/ui/BackButton";

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
      // console.log(res.data.message);
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
    <div className="relative text-center flex flex-col items-center justify-center min-h-screen space-y-2">
      <div className="absolute top-10 left-5">
        <BackButton />
      </div>
      <PageHeading>Course Quizzes</PageHeading>

      {quizzes.length === 0 && <p className="text-stone-300">No quizzes yet</p>}

      {quizzes.map((quiz) => (
        <ListCard
          key={quiz.id}
          title={quiz.title}
          subtitle={
            <p className="text-sm text-yellow-500 font-bold mb-2">
              Due: {dayjs(quiz.due_date).format("ddd D MMM, YYYY h:mm A")}
            </p>
          }
          customStyles={"w-140"}
        >
          <div className="space-x-3">
            {quiz.quiz_attempts.length > 0 && (
              <Button
                variant="tertiary"
                onClick={() => {
                  navigate(`/student/quizzes/${quiz.id}/quiz_attempts`);
                }}
              >
                View Analytics
              </Button>
            )}
            {!isQuizExpired(quiz.due_date) && (
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(`/student/quizzes/${quiz.id}/attempt_quiz`)
                }
              >
                {quiz.quiz_attempts.length === 0
                  ? "Start"
                  : quiz.quiz_attempts[0].status === "in_progress"
                    ? "Resume"
                    : "Retry"}
              </Button>
            )}
            {isQuizExpired(quiz.due_date) && <Label color="red">Expired</Label>}
          </div>
        </ListCard>
      ))}
    </div>
  );
}
