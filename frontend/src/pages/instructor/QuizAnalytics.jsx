import { useParams } from "react-router-dom";
import api from "../../api/api";
import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import InnerCard from "../../components/ui/InnerCard";
import StatItem from "../../components/ui/StatItem";
import BackButton from "../../components/ui/BackButton";
import PageHeading from "../../components/ui/PageHeading";

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

  if (!performance)
    return (
      <div className="relative flex flex-col items-center text-center min-h-screen px-5">
        <div className="absolute top-0 left-5">
          <BackButton />
        </div>
        <div className="w-60 md:w-full">
          <PageHeading>Quiz Analytics</PageHeading>
        </div>
        <p className="text-stone-400 italic mt-10">No quiz attempts to analyze</p>
      </div>
    );

  return (
    <div className="relative flex flex-col items-center text-center min-h-screen px-5">
      <div className="absolute top-0 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full">
        <PageHeading>Quiz Analytics</PageHeading>
      </div>
      {/* {console.log(performance)} */}
      <Card
        title={`${performance.quiz_title} Analytics`}
        customStyles={"py-4 md:w-[70%] mt-10 hidden md:block"}
        headerStyles={"text-center"}
      >
        <div className="flex flex-col items-center p-3 space-y-3">
          <InnerCard title={"Performance Stats"} customStyles={"w-[100%]"}>
            <StatItem
              color={"yellow"}
              stat={"Average Score"}
              value={`${Number(performance.average_score)} / ${Number(performance.quiz_max_score)}`}
            />
            <StatItem
              color={"green"}
              stat={"Highest Score"}
              value={`${Number(
                performance.highest_quiz_score,
              )} / ${Number(performance.quiz_max_score)}`}
            />
            <StatItem
              color={"red"}
              stat={"Lowest Score"}
              value={`${Number(
                performance.lowest_quiz_score,
              )} / ${Number(performance.quiz_max_score)}`}
            />
          </InnerCard>
          <InnerCard
            title={"Question Stats"}
            customStyles={"w-[100%] text-stone-200"}
          >
            <StatItem
              stat={"Easiest"}
              value={performance.easiest_question.question_text}
              color={"green"}
              labelStyling={
                "line-clamp-1 font-medium text-green-300 max-w-40 lg:max-w-80"
              }
            />
            <StatItem
              color={"green"}
              stat={"Easiest Accuracy (%)"}
              value={`${performance.easiest_question.accuracy_percent}`}
            />
            <StatItem
              stat={"Hardest"}
              value={performance.hardest_question.question_text}
              color={"red"}
              labelStyling={
                "line-clamp-1 font-medium text-green-300 max-w-40 lg:max-w-80"
              }
            />
            <StatItem
              color={"red"}
              stat={"Hardest Accuracy (%)"}
              value={`${performance.hardest_question.accuracy_percent}`}
            />
          </InnerCard>
          <InnerCard title={"Materials Analysis"} customStyles={"w-[100%]"}>
            {performance.material_analysis.map((material) => (
              <div className="space-y-1" key={material.material_id}>
                <StatItem
                  stat={"Material"}
                  value={material.material_source_name}
                  labelStyling={"line-clamp-1 w-40 lg:w-60 text-center"}
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
              </div>
            ))}
          </InnerCard>
        </div>
      </Card>
      <div className="md:hidden w-80 flex flex-col items-center mt-10 space-y-3 pb-5">
        <div className="flex flex-col -space-y-1">
          <p className="text-yellow-600 font-semibold text-xs">Quiz</p>
          <p className="text-stone-200 text-lg font-bold">
            {performance.quiz_title}
          </p>
        </div>
        <InnerCard title={"Performance Stats"} customStyles={"w-[100%]"}>
          <StatItem
            color={"yellow"}
            stat={"Average Score"}
            value={`${Number(performance.average_score)} / ${Number(performance.quiz_max_score)}`}
          />
          <StatItem
            color={"green"}
            stat={"Highest Score"}
            value={`${Number(
              performance.highest_quiz_score,
            )} / ${Number(performance.quiz_max_score)}`}
          />
          <StatItem
            color={"red"}
            stat={"Lowest Score"}
            value={`${Number(
              performance.lowest_quiz_score,
            )} / ${Number(performance.quiz_max_score)}`}
          />
        </InnerCard>
        <InnerCard
          title={"Question Stats"}
          customStyles={"w-[100%] text-stone-200"}
        >
          <StatItem
            stat={"Easiest"}
            value={performance.easiest_question.question_text}
            color={"green"}
            labelStyling={"line-clamp-1 font-medium max-w-40 lg:max-w-80"}
          />
          <StatItem
            color={"green"}
            stat={"Easiest Accuracy (%)"}
            value={`${performance.easiest_question.accuracy_percent}`}
          />
          <StatItem
            stat={"Hardest"}
            value={performance.hardest_question.question_text}
            color={"red"}
            labelStyling={"line-clamp-1 font-medium max-w-40 lg:max-w-80"}
          />
          <StatItem
            color={"red"}
            stat={"Hardest Accuracy (%)"}
            value={`${performance.hardest_question.accuracy_percent}`}
          />
        </InnerCard>
        <InnerCard title={"Materials Analysis"} customStyles={"w-[100%]"}>
          {performance.material_analysis.map((material) => (
            <div className="space-y-2" key={material.material_id}>
              <StatItem
                stat={"Material"}
                value={material.material_source_name}
                labelStyling={"line-clamp-1 max-w-32 lg:max-w-60"}
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
            </div>
          ))}
        </InnerCard>
      </div>
    </div>
  );
}
