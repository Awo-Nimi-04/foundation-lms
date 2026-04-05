import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import PageHeading from "../../components/ui/PageHeading";
import ListCard from "../../components/ui/ListCard";
import TabButton from "../../components/ui/TabButton";
import { useLoading } from "../../context/LoadingContext";

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
      fetchQuizzes()
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="text-center flex flex-col items-center justify-center min-h-screen space-y-2">
      <div className="">
        <PageHeading>Course Quizzes</PageHeading>
      </div>
      <TabButton
        options={["Published", "Draft"]}
        selectedOption={quizStatusFilter}
        onChange={handleQuizFilter}
      />
      {filteredQuizzes.length === 0 && (
        <p className="text-stone-400 text-center mt-6">
          No {quizStatusFilter.toLowerCase()} quizzes found . . .
        </p>
      )}
      {filteredQuizzes.length > 0 &&
        filteredQuizzes.map((quiz) => (
          <ListCard key={quiz.id} title={quiz.title} customStyles="w-[80%]">
            <div>
              {quizStatusFilter === "Draft" && (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(`/instructor/quizzes/${quiz.id}/quiz_editor`)
                    }
                  >
                    Edit
                  </Button>
                  <button
                    className="font-medium text-red-500 bg-transparent border-4 px-2 py-1 rounded-lg cursor-pointer hover:text-stone-300 hover:border-red-800 hover:bg-red-800"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                  >
                    Delete
                  </button>
                </div>
              )}

              {quizStatusFilter === "Published" && (
                <div className="flex space-x-1">
                  <Button
                    variant="tertiary"
                    onClick={() =>
                      navigate(`/instructor/quizzes/${quiz.id}/analytics`)
                    }
                  >
                    Analytics
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(`/instructor/quizzes/${quiz.id}/grade`)
                    }
                  >
                    Grade
                  </Button>
                </div>
              )}
            </div>
          </ListCard>
        ))}
      <Button
        variant="primary"
        onClick={() =>
          navigate(`/instructor/courses/${courseId}/quizzes/create`)
        }
        customStyles={"mt-4"}
      >
        Create Quiz
      </Button>
    </div>
  );
}
