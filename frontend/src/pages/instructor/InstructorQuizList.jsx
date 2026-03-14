import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function InstructorQuizList() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizStatusFilter, setQuizStatusFilter] = useState("published");

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

  return (
    <div className="">
      <div className="">
        <h2>Course Quizzes</h2>

        <Button
          variant="primary"
          onClick={() =>
            navigate(`/instructor/courses/${courseId}/quizzes/create`)
          }
        >
          Create Quiz
        </Button>
      </div>

      {quizzes.length === 0 && <p>No quizzes created yet.</p>}
      <div className="flex">
        <button
          onClick={() => {
            handleQuizFilter("published");
          }}
        >
          Published
        </button>
        <button
          onClick={() => {
            handleQuizFilter("draft");
          }}
        >
          Draft
        </button>
      </div>
      {quizzes.map((quiz) => {
        if (quiz.status === quizStatusFilter) {
          return (
            <Card key={quiz.id} title={quiz.title}>
              <div className="">
                {quizStatusFilter === "draft" && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(`/instructor/quizzes/${quiz.id}/quiz_editor`)
                    }
                  >
                    Edit
                  </Button>
                )}

                {quizStatusFilter === "published" && (
                  <div className="flex">
                    <Button
                      variant="secondary"
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
            </Card>
          );
        }
      })}
    </div>
  );
}
