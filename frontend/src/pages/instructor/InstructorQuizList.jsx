import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import PageHeading from "../../components/ui/PageHeading";
import ListCard from "../../components/ui/ListCard";
import TabButton from "../../components/ui/TabButton";
import { useLoading } from "../../context/LoadingContext";
import BackButton from "../../components/ui/BackButton";

export default function InstructorQuizList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [quizzes, setQuizzes] = useState([]);
  const [quizStatusFilter, setQuizStatusFilter] = useState("Published");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    showLoading("Fetching Quizzes . . .");
    try {
      const res = await api.get(`/quizzes/course/${courseId}`);
      setQuizzes(res.data.message || []);
    } catch (err) {
      console.error("Failed to fetch quizzes", err);
    } finally {
      hideLoading();
    }
  };

  const handleQuizFilter = (status) => {
    setQuizStatusFilter(status);
  };

  const filteredQuizzes = quizzes.filter(
    (quiz) => quiz.status === quizStatusFilter.toLowerCase(),
  );

  const handleDeleteQuiz = async (quizId) => {
    try {
      await api.delete(`/quizzes/quiz/${quizId}`);
      fetchQuizzes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative flex flex-col items-center text-center min-h-screen p-3">
      <div className="absolute top-5 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full my-2">
        <PageHeading>Quizzes</PageHeading>
      </div>
      <div className="my-3">
        <TabButton
          options={["Published", "Draft"]}
          selectedOption={quizStatusFilter}
          onChange={handleQuizFilter}
        />
      </div>

      {filteredQuizzes.length === 0 && (
        <p className="text-stone-400 text-center mt-6">
          No {quizStatusFilter.toLowerCase()} quizzes found . . .
        </p>
      )}
      {filteredQuizzes.length > 0 &&
        filteredQuizzes.map((quiz) => (
          <ListCard
            key={quiz.id}
            title={quiz.title}
            customStyles="w-[100%] lg:w-[80%] my-2"
          >
            <div>
              {quizStatusFilter === "Draft" && (
                <div className="flex items-center space-x-2">
                  <Button
                    customStyles={"w-10 md:w-20"}
                    variant="secondary"
                    onClick={() =>
                      navigate(
                        `/instructor/course/${courseId}/quizzes/${quiz.id}/quiz_editor`,
                      )
                    }
                  >
                    <i className="md:hidden bi bi-pencil-fill"></i>
                    <p className="hidden md:block">Edit</p>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    customStyles={"w-10 md:w-20"}
                  >
                    <i className="md:hidden bi bi-trash3-fill"></i>
                    <p className="hidden md:block">Delete</p>
                  </Button>
                </div>
              )}

              {quizStatusFilter === "Published" && (
                <div className="flex space-x-1 md:space-x-2">
                  <Button
                    customStyles={"w-10 md:w-20"}
                    variant="tertiary"
                    onClick={() =>
                      navigate(
                        `/instructor/course/${courseId}/quizzes/${quiz.id}/analytics`,
                      )
                    }
                  >
                    <i className="md:hidden bi bi-bar-chart-fill"></i>
                    <p className="hidden md:block font-medium">Analytics</p>
                  </Button>
                  <Button
                    customStyles={"w-10 md:w-20"}
                    variant="secondary"
                    onClick={() =>
                      navigate(
                        `/instructor/course/${courseId}/quizzes/${quiz.id}/grade`,
                      )
                    }
                  >
                    <i className="md:hidden bi bi-check-square-fill"></i>
                    <p className="hidden md:block font-medium">Grade</p>
                  </Button>
                </div>
              )}
            </div>
          </ListCard>
        ))}
      <Button
        variant="primary"
        onClick={() =>
          navigate(`/instructor/course/${courseId}/quizzes/create`)
        }
        customStyles={"mt-4 w-40 md:w-60"}
      >
        Create Quiz
      </Button>
    </div>
  );
}
