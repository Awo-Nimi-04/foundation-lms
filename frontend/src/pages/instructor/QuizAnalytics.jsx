import { useParams } from "react-router-dom";
import api from "../../api/api";
import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import InnerCard from "../../components/ui/InnerCard";
import StatItem from "../../components/ui/StatItem";

export default function QuizAnalytics() {
  const { quizId } = useParams();
  const [performance, setPerformance] = useState();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(
        `/quiz_attempts/${quizId}/instructor_analytics`,
      );
      setPerformance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!performance) return <p>No analytics yet.</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Card
        title={performance.quiz_title}
        customStyles={"py-4"}
        headerStyles={"text-center"}
      >
        <div className="flex flex-col items-center p-3 space-y-3">
          <InnerCard title={"Performance Stats"} customStyles={"w-[50%]"}>
            <StatItem
              color={"yellow"}
              stat={"Average Score"}
              value={`${Number(performance.average_score) * Number(performance.quiz_max_score)} / ${Number(performance.quiz_max_score)}`}
            />
            <StatItem
              color={"green"}
              stat={"Highest Score"}
              value={`${
                Number(performance.highest_quiz_score) *
                Number(performance.quiz_max_score)
              } / ${Number(performance.quiz_max_score)}`}
            />
            <StatItem
              color={"red"}
              stat={"Lowest Score"}
              value={`${
                Number(performance.lowest_quiz_score) *
                Number(performance.quiz_max_score)
              } / ${Number(performance.quiz_max_score)}`}
            />
          </InnerCard>
          <InnerCard title={"Question Stats"} customStyles={"w-[50%]"}>
            <p>
              <p className="font-medium">Easiest Question:</p>{" "}
              {performance.easiest_question.question_text}
            </p>
            <StatItem
              color={"green"}
              stat={"Easiest Question Accuracy (%)"}
              value={`${performance.easiest_question.accuracy_percent}`}
            />
            <div className="flex w-full justify-between items-center">
              <p className="font-medium">Hardest Question</p>
              <p className="text-right">{performance.hardest_question.question_text}</p>
            </div>
            <StatItem
              color={"red"}
              stat={"Hardest Question Accuracy (%)"}
              value={`${performance.hardest_question.accuracy_percent}`}
            />
          </InnerCard>
          <InnerCard title={"Materials Analysis"} customStyles={"w-[50%]"}>
            {performance.material_analysis.map((material) => (
              <>
                <StatItem
                  stat={"Material"}
                  value={material.material_source_name}
                />
                <StatItem
                  color={"purple"}
                  stat={"Mastery (%)"}
                  value={material.mastery_percent}
                />
                <StatItem
                  color={"orange"}
                  stat={"Total Attempts On Material"}
                  value={material.attempts}
                />
              </>
            ))}
          </InnerCard>
        </div>
      </Card>
    </div>
  );
}
