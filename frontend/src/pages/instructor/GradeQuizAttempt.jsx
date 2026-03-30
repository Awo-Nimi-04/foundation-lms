import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import InnerCard from "../../components/ui/InnerCard";
import Label from "../../components/ui/Label";

export default function GradeQuizAttempt() {
  const { quizId } = useParams();
  const [studentIndex, setStudentIndex] = useState(2);
  const [attempt, setAttempt] = useState();
  const [scores, setScores] = useState([]);

  useEffect(() => {
    fetchQuizAttempt();
  }, [studentIndex]);

  const fetchQuizAttempt = async () => {
    try {
      const res = await api.get(
        `/quiz_attempts/quiz/${quizId}/student/${studentIndex}/responses`,
      );
      setAttempt(res.data);
      const ininitalScores = res.data.responses.map((response) => ({
        question_id: response.question_id,
        score: response.score,
      }));
      setScores(ininitalScores);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScoreChange = (score, questionId) => {
    setScores((prev) => {
      const existing = prev.find((q) => q.question_id === questionId);

      if (existing) {
        return prev.map((q) =>
          q.question_id === questionId ? { ...q, score: Number(score) } : q,
        );
      }

      return [...prev, { question_id: questionId, score: Number(score) }];
    });
  };

  const handleGradeQuiz = async () => {
    try {
      const res = await api.patch(
        `/quiz_attempts/${attempt.attempt_id}/grade`,
        {
          questions: scores,
        },
      );
      console.log(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handlePreviousStudent = () => {
    const index = studentIndex - 1 < 2 ? 2 : studentIndex - 1;
    setStudentIndex(index);
  };

  const handleNextStudent = () => {
    const index = studentIndex + 1 > 10 ? 10 : studentIndex + 1;
    setStudentIndex(index);
  };

  if (!attempt || attempt.responses.length <= 0)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-stone-300">There is no attempt to grade yet . . .</p>
      </div>
    );

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      {console.log(scores)}
      <Card
        title={`Grade ${attempt.quiz_title}`}
        footer={
          <div className="flex justify-center p-2 space-x-2">
            <Button
              onClick={handlePreviousStudent}
              disabled={studentIndex === 2}
            >
              Prev
            </Button>
            <Button onClick={handleGradeQuiz}>Grade</Button>
            <Button onClick={handleNextStudent} disabled={studentIndex === 10}>
              Next
            </Button>
          </div>
        }
        customStyles={"text-center py-4 w-[80%] mx-auto"}
      >
        {console.log(studentIndex)}
        <div className="flex justify-between px-6">
          <div className="flex space-x-2 items-center">
            <p className="text-lg font-semibold text-stone-200">Student: </p>
            <Label color="gray"> {attempt.student_id}</Label>
          </div>
          <div className="flex space-x-2 items-center">
            <p className="text-lg font-semibold text-stone-200">Score: </p>
            <Label color="orange" size="text-lg">
              {Number(attempt.attempt_score)} / {attempt.quiz_total_score}
            </Label>
          </div>
          {/* <p>Attempt: {attempt.attempt_id}</p> */}
        </div>
        {attempt.responses?.map((response, idx) => (
          <InnerCard
            title={`Question ${idx + 1}`}
            key={response.question_id}
            customStyles={"my-4"}
          >
            <h2 className="font-semibold text-lg">{response.question_text}</h2>
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
            <div className="flex justify-center items-end">
              <Input
                label={"Score"}
                type={"number"}
                value={
                  scores.find((q) => q.question_id === response.question_id)
                    ?.score ??
                  response?.score ??
                  ""
                }
                onChange={(e) => {
                  handleScoreChange(e.target.value, response.question_id);
                }}
                customStyles={"w-20 text-center"}
              />
              <p className="text-lg ml-2">/ {response.max_score}</p>
            </div>
          </InnerCard>
        ))}
      </Card>
    </div>
  );
}
