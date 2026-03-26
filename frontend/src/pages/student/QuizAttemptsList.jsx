import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams } from "react-router-dom";
import Button from "../../components/ui/Button";

export default function QuizAttemptsList() {
  const { quizId } = useParams();
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
      //   console.log(res.data)
      setSelectedAttempt(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsloading(false);
    }
  };

  return (
    <div>
      {attempts.length > 0 && (
        <div>
          {attempts.map((attempt) => (
            <div className="flex">
              {/* <p>Attempt {attempt.id}</p> */}
              <Button
                variant="secondary"
                onClick={() => {
                  getAttemptAnalytics(attempt.id);
                }}
              >
                View
              </Button>
            </div>
          ))}
        </div>
      )}
      {isLoading && <p>Analyzing...</p>}
      {!selectedAttempt && (
        <p>Select an attempt to analyze your performance.</p>
      )}
      {selectedAttempt && (
        <div>
          <p>Percentage: {selectedAttempt.total_percent}%</p>
          <p>Score: {selectedAttempt.total_score}</p>
          <div>
            <h3>Analysis by Material</h3>
            {selectedAttempt.analysis_per_material.map((material) => (
              <div key={material.material_id}>
                <p>Material: {material.material_source_name}</p>
                <p>Mastery %: {material.mastery_percent}</p>
                <p>
                  Recommendation: This material is currently a/an{" "}
                  {material.strength_or_weakness}{" "}
                </p>
                <p>{material.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
