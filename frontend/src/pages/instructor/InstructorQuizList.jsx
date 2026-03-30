import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import PageHeading from "../../components/ui/PageHeading";
import ListCard from "../../components/ui/ListCard";
import TabButton from "../../components/ui/TabButton";

export default function InstructorQuizList() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizStatusFilter, setQuizStatusFilter] = useState("Published");

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

  const handleQuizFilter = (status) => {
    setQuizStatusFilter(status);
  };

  if (loading) return <p>Loading quizzes...</p>;

  const filteredQuizzes = quizzes.filter(
    (quiz) => quiz.status === quizStatusFilter.toLowerCase(),
  );

  return (
    <div className="text-center flex flex-col items-center justify-center min-h-screen space-y-2">
      <div className="">
        <PageHeading>Course Quizzes</PageHeading>
      </div>

      {quizzes.length === 0 && (
        <p className="text-stone-300 mt-4">No quizzes created yet.</p>
      )}
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
      {filteredQuizzes.length > 0 && filteredQuizzes.map((quiz) => (
        <ListCard key={quiz.id} title={quiz.title} customStyles="w-[80%]">
          <div>
            {quizStatusFilter === "Draft" && (
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(`/instructor/quizzes/${quiz.id}/quiz_editor`)
                }
              >
                Edit
              </Button>
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
