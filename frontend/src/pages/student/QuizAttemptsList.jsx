import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import InnerCard from "../../components/ui/InnerCard";
import ListCard from "../../components/ui/ListCard";
import PageHeading from "../../components/ui/PageHeading";
import Card from "../../components/ui/Card";
import StatItem from "../../components/ui/StatItem";
import Label from "../../components/ui/Label";

export default function QuizAttemptsList() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState();
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState();
  const [isLoading, setIsloading] = useState(false);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const res = await api.get(`/quiz_attempts/${quizId}/student`);
      setAttempts(res.data.quiz_attempts);
      setQuiz({
        title: res.data.quiz_title,
        maxScore: res.data.quiz_max_score,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getAttemptAnalytics = async (attemptId) => {
    setIsloading(true);
    try {
      const res = await api.get(
        `/quiz_attempts/${attemptId}/quiz_attempt_analytics`,
      );
      // console.log(res.data);
      setSelectedAttempt(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsloading(false);
    }
  };

  if (!quiz) return <p>Fetching Attempts...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <PageHeading>{quiz.title}</PageHeading>
      {attempts.length > 0 && (
        <div>
          {attempts.map((attempt, idx) => (
            <ListCard
              key={attempt.id}
              title={`Attempt ${idx + 1}`}
              customStyles={`w-100 my-3 ${selectedAttempt?.quiz_attempt_id === attempt.id ? "border border-stone-200" : ""}`}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  getAttemptAnalytics(attempt.id);
                }}
              >
                View
              </Button>
            </ListCard>
          ))}
        </div>
      )}
      {isLoading && <p>Analyzing...</p>}
      {!selectedAttempt && (
        <p className="text-stone-300">
          Select an attempt to analyze your performance.
        </p>
      )}
      {selectedAttempt && (
        <Card
          title={"Attempt Analytics"}
          customStyles={"text-center text-stone-200 py-4 my-8 w-100"}
        >
          <div className="px-4 space-y-1 mb-2">
            <StatItem
              stat={"Score"}
              value={`${selectedAttempt.total_score} / ${quiz.maxScore}`}
              color={
                selectedAttempt.total_percent < 50
                  ? "red"
                  : selectedAttempt.total_percent < 76
                    ? "yellow"
                    : "green"
              }
            />
            <StatItem
              stat={"Percentage"}
              value={`${selectedAttempt.total_percent}%`}
              color={
                selectedAttempt.total_percent < 50
                  ? "red"
                  : selectedAttempt.total_percent < 76
                    ? "yellow"
                    : "green"
              }
            />
          </div>
          <InnerCard title={"Analysis by Material"}>
            {selectedAttempt.analysis_per_material.map((material) => (
              <div  key={material.material_id} className="my-3">
                <div className="space-y-2">
                  <StatItem
                    stat={"Material"}
                    value={material.material_source_name}
                  />
                  <StatItem
                    stat={"Mastery %"}
                    value={material.mastery_percent}
                    color={
                      material.mastery_percent < 50
                        ? "red"
                        : material.mastery_percent < 76
                          ? "yellow"
                          : "green"
                    }
                  />
                  <StatItem
                    stat={"Concept Strength"}
                    value={material.strength_or_weakness}
                    color={
                      material.strength_or_weakness === "Strength"
                        ? "green"
                        : "red"
                    }
                  />
                </div>
                <div>
                  <h1 className="font-medium">Recommendation</h1>
                  <Label
                    color={
                      material.strength_or_weakness === "Strength"
                        ? "purple"
                        : "orange"
                    }
                  >
                    {material.recommendation}
                  </Label>
                </div>
              </div>
            ))}
          </InnerCard>
        </Card>
      )}
    </div>
  );
}
