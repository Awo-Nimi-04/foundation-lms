import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams } from "react-router-dom";
import Button from "../../components/ui/Button";

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
      const res = await api.get(`/quiz_attempts/quiz/${quizId}/student/${studentIndex}/responses`);
      setAttempt(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScoreChange = (event, questionId) => {
    setScores((prev) => {
      const existing = prev.find((q) => q.question_id === questionId);

      if (existing) {
        return prev.map((q) =>
          q.question_id === questionId
            ? { ...q, score: Number(event.target.value) }
            : q,
        );
      }

      return [
        ...prev,
        { question_id: questionId, score: Number(event.target.value) },
      ];
    });
  };

  const handleGradeQuiz = async () => {
    try {
      const res = api.patch(`/quiz_attempts/${attempt.attempt_id}/grade`, {
        questions: scores,
      });
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
    return <p>There is no attempt for this user.</p>;

  return (
    <div>
      <h1>{attempt.quiz_title}</h1>
      <div className="flex">
        <p>Student: {attempt.student_id}</p>
        <p>
          Total Score: {attempt.score * attempt.quiz_total_score}/
          {attempt.quiz_total_score}
        </p>
        <p>Attempt: {attempt.attempt_id}</p>
      </div>
      {attempt.responses?.map((response) => (
        <div>
          <h2>{response.question_text}</h2>
          <p>Student Response: {response.submitted_answer}</p>
          <p>Correct Response: {response.correct_answer}</p>
          <input
            type="number"
            value={
              scores.find((q) => q.question_id === response.question_id)
                ?.score ||
              response?.score ||
              ""
            }
            onChange={(e) => {
              handleScoreChange(e, response.question_id);
            }}
          />
        </div>
      ))}
      <div>
        <Button onClick={handlePreviousStudent} disabled={studentIndex === 2}>
          Previous
        </Button>
        <Button onClick={handleGradeQuiz}>Grade Quiz</Button>
        <Button onClick={handleNextStudent} disabled={studentIndex}>
          Next
        </Button>
      </div>
    </div>
  );
}

// <input
//   type="number"
//   placeholder="Score"
//   value={score}
//   onChange={(e) => setScore(e.target.value)}
// />

// RESPONSES
//     "question_id": q.id,
//     "question_text": q.question_text,
//     "question_type": q.question_type,
//     "correct_answer": q.correct_answer,
//     "submitted_answer": qa.submitted_answer if qa else None,
//     "score": qa.score if qa else None

// ATTEMPT
// "quiz_id": quiz_id,
// "quiz_total_score": quiz.max_score,
// "quiz_title": quiz.title,
// "student_id": student_id,
// "attempt_id": attempt.id,
// "submitted_at": attempt.submitted_at,
// "responses": responses
