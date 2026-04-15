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
import { useAuth } from "../../context/AuthContext";
import BackButton from "../../components/ui/BackButton";

export default function QuizAttemptsList() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState();
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState();
  const [responses, setResponses] = useState([]);
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
        isDue: res.data.is_due,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResponses = async (attemptId) => {
    try {
      const res = await api.get(`/quiz_attempts/${attemptId}/responses`);
      // console.log(res.data.responses);
      setResponses(res.data.responses);
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
      // console.log(res.data.attempt_status);
      setSelectedAttempt(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsloading(false);
    }
  };

  if (!quiz) return <p>Fetching Attempts...</p>;

  return (
    <div className="relative flex flex-col items-center text-center min-h-screen p-5 mb-5">
      <div className="absolute top-0 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full">
        <PageHeading>Attempt Analytics</PageHeading>
      </div>

      <p className="text-stone-200 mt-5 text-xl font-semibold">{quiz.title}</p>
      {attempts.length > 0 && (
        <div className="w-full">
          {attempts.map((attempt, idx) => (
            <ListCard
              key={attempt.id}
              title={`Attempt ${idx + 1}`}
              customStyles={`w-[100%] md:w-[80%] mx-auto my-3 ${selectedAttempt?.quiz_attempt_id === attempt.id ? "border border-stone-200" : ""}`}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  getAttemptAnalytics(attempt.id);
                  fetchResponses(attempt.id);
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
        <p className="text-stone-300 font-semibold mt-3">
          Select an attempt to analyze your performance
        </p>
      )}
      {attempts.length === 0 && (
        <p className="text-stone-400 mt-5">
          You have submitted no attempts for this quiz
        </p>
      )}
      {selectedAttempt && (
        <Card
          title={"Attempt Analytics"}
          customStyles={
            "text-center text-stone-200 py-4 my-8 w-[100%]  md:w-[80%]"
          }
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
            <StatItem
              stat={"Status"}
              value={
                selectedAttempt.attempt_status === "submitted"
                  ? "Auto-graded"
                  : "Graded"
              }
              color={
                selectedAttempt.attempt_status === "submitted"
                  ? "yellow"
                  : "green"
              }
            />
          </div>
          <InnerCard title={"Analysis by Material"}>
            {selectedAttempt.analysis_per_material.map((material) => (
              <div key={material.material_id} className="my-3">
                <div className="space-y-2">
                  <StatItem
                    stat={"Material"}
                    value={material.material_source_name}
                    labelStyling={"max-w-40 line-clamp-1 md:max-w-80"}
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
      {selectedAttempt && responses.length > 0 && quiz.isDue && (
        <Card
          title={`Your Answers`}
          customStyles={"text-center py-4 w-[80%] mx-auto w-[100%] md:w-[80%]"}
        >
          {responses?.map((response, idx) => (
            <InnerCard
              title={`Question ${idx + 1}`}
              key={response.question_id}
              customStyles={"my-4"}
            >
              <h2 className="font-semibold text-lg">
                {response.question_text}
              </h2>
              <div className="flex w-full items-center">
                <p className="mr-auto font-medium w-40">Student Response</p>

                <div className="ml-auto max-w-xs">
                  <p className="line-clamp-1 font-medium text-yellow-300">
                    {response.submitted_answer || "N/A"}
                  </p>
                </div>
              </div>
              <div className="mr-auto flex w-full items-center">
                <p className="font-medium w-40">Correct Response</p>

                <div className="ml-auto max-w-xs">
                  <p className="line-clamp-1 font-medium text-green-300">
                    {response.correct_answer}
                  </p>
                </div>
              </div>
            </InnerCard>
          ))}
        </Card>
      )}
    </div>
  );
}
