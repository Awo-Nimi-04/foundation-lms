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
    <div className="relative flex flex-col items-center text-center min-h-screen px-5">
      <div className="absolute top-0 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full">
        <PageHeading>Course Quizzes</PageHeading>
      </div>

      {quizzes.length === 0 && <p className="text-stone-300">No quizzes yet</p>}

      {quizzes.map((quiz) => (
        <ListCard
          key={quiz.id}
          title={quiz.title}
          subtitle={
            <>
              <p className="hidden md:block text-sm text-yellow-500 font-bold mb-2">
                Due: {dayjs(quiz.due_date).format("ddd D MMM, YYYY h:mm A")}
              </p>
              <p className="md:hidden text-sm text-yellow-500 font-bold mb-2">
                Due: {dayjs(quiz.due_date).format("ddd D MMM, YYYY")}
              </p>
            </>
          }
          customStyles={"w-[100%] mt-10"}
        >
          <div className="flex space-x-3">
            {quiz.quiz_attempts.length > 0 && (
              <Button
                variant="tertiary"
                onClick={() => {
                  navigate(
                    `/student/course/${courseId}/quizzes/${quiz.id}/quiz_attempts`,
                  );
                }}
                customStyles={"w-10 md:w-32"}
              >
                <p className="hidden md:block">View Analytics</p>
                <i className="md:hidden bi bi-bar-chart-fill"></i>
              </Button>
            )}
            {!isQuizExpired(quiz.due_date) && (
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    `/student/course/${courseId}/quizzes/${quiz.id}/attempt_quiz`,
                  )
                }
                customStyles={"w-10 md:w-20"}
              >
                <p className="hidden md:block">
                  {quiz.quiz_attempts.length === 0
                    ? "Start"
                    : quiz.quiz_attempts[0].status === "in_progress"
                      ? "Resume"
                      : "Retry"}
                </p>
                <svg
                className="md:hidden"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#ffffff"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path
                      d="M10 3V6H4L4 10H10L10 13L11 13L16 8L11 3L10 3Z"
                      fill="#ffffff"
                    ></path>{" "}
                    <path
                      d="M0 2L1.38281e-06 14H2L2 2L0 2Z"
                      fill="#ffffff"
                    ></path>{" "}
                  </g>
                </svg>
              </Button>
            )}
            {isQuizExpired(quiz.due_date) && <Label color="red">Expired</Label>}
          </div>
        </ListCard>
      ))}
    </div>
  );
}
