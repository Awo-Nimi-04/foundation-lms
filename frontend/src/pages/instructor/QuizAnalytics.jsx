import { useParams } from "react-router-dom";
import api from "../../api/api";
import { useEffect, useState } from "react";

export default function QuizAnalytics() {
  const { quizId } = useParams();
  const [performance, setPerformance] = useState();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = api.get(`/quiz_attempts/${quizId}/instructor_analytics`);
      setPerformance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!performance) return <p>No analytics yet.</p>

  return (
    <div>
      <h1>{performance.quiz_title}</h1>
      <p>
        Average Score:{" "}
        {Number(performance.average_score) * Number(performance.quiz_max_score)}{" "}
        / {Number(performance.quiz_max_score)}
      </p>
      <p>
        Highest Score:{" "}
        {Number(performance.highest_quiz_score) *
          Number(performance.quiz_max_score)}{" "}
        / {Number(performance.quiz_max_score)}
      </p>
      <p>
        Lowest Score:{" "}
        {Number(performance.lowest_quiz_score) *
          Number(performance.quiz_max_score)}{" "}
        / {Number(performance.quiz_max_score)}
      </p>
      <p>Total Attempts: {performance.total_attempts}</p>
      <p>Easiest Question: {performance.easiest_question.question_text}</p>
      <p>
        Easiest Accuracy %: {performance.easiest_question.accuracy_percent}%
      </p>
      <p>Hardest Question: {performance.hardest_question.question_text}</p>
      <p>
        Hardest Accuracy %: {performance.hardest_question.accuracy_percent}%
      </p>
      <p>Materials Analysis</p>
      {performance.material_analysis.map((material) => (
        <div>
          <p>Material Name: {material.material_source_name}</p>
          <p>Material Mastery %: {material.mastery_percent}%</p>
        </div>
      ))}
    </div>
  );
}