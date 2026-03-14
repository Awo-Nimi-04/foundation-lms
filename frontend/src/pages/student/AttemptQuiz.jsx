import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import Button from "../../components/ui/Button";

export default function AttemptQuiz() {
  const { quizId } = useParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptId, setAttemptId] = useState();
  const [answerList, setAnswerList] = useState([]);
  const [answer, setAnswer] = useState("");
  const [quiz, setQuiz] = useState();
  const [isExpiredQuiz, setIsExpiredQuiz] = useState(false);
  const [questions, setQuestions] = useState();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const isQuizExpired = (dueDate) => {
    if (!dueDate) return false;

    const now = new Date();
    const due = new Date(dueDate);

    return now > due;
  };

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setQuiz(res.data);
      setIsExpiredQuiz(isQuizExpired(quiz.due_date));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/questions/${quizId}`);
      setQuestions(res.data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBeginQuiz = async () => {
    const expired = isQuizExpired(quiz.due_date);
    if (expired) {
      setIsExpiredQuiz(expired);
      return;
    }
    try {
      const res = await api.post(`quizzes/${quizId}/start`);
      fetchQuestions();
      setHasStarted(true);
      setAttemptId(res.data.attempt_id);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreviousQuestion = () => {
    const currentIndex =
      currentQuestionIndex - 1 > 0 ? currentQuestionIndex : 0;
    setCurrentQuestionIndex(currentIndex);
  };

  const handleNextQuestion = () => {
    const currentIndex =
      currentQuestionIndex + 1 >= quiz.questions.length
        ? currentQuestionIndex
        : currentQuestionIndex + 1;
    setCurrentQuestionIndex(currentIndex);
  };

  const handleInputAnswer = (e, questionId) => {
    setAnswer(e.target.value);
    setAnswerList((prevState) => {
      const existing = prevState.find((ans) => ans.question_id === questionId);
      if (existing) {
        return prevState.map((ans) =>
          ans.question_id === questionId
            ? { ...ans, answer: e.target.value }
            : ans,
        );
      } else {
        return [
          ...prevState,
          { question_id: questionId, answer: e.target.value },
        ];
      }
    });
  };

  const handleSubmitQuiz = async () => {
    try {
      const res = await api.post(`/quiz_attempts/${attemptId}/submit`, {
        answers: answerList,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <div className="flex">
        <h1>{quiz.title}</h1>
        <h2>
          Time Limit: {quiz.time_limit ? `${quiz.time_limit} minutes` : "None"}
        </h2>
      </div>
      {!hasStarted && !isExpiredQuiz && (
        <Button variant="secondary" onClick={handleBeginQuiz}>
          Begin
        </Button>
      )}
      {isExpiredQuiz && <p>This quiz is no longer available.</p>}
      {hasStarted && (
        <div>
          <h3>Question {currentQuestionIndex + 1}</h3>
          <p>{questions[currentQuestionIndex].question_text}</p>
          {questions[currentQuestionIndex].question_type === "short_answer" && (
            <textarea
              value={answer}
              onChange={(event) =>
                handleInputAnswer(event, questions[currentQuestionIndex].id)
              }
              placeholder="Type your answer"
            />
          )}
          {questions[currentQuestionIndex].question_type ===
            "multiple_choice" && (
            <div>
              {questions[currentQuestionIndex].choices?.map((choice, index) => {
                const letter = String.fromCharCode(65 + index);

                return (
                  <label key={index} style={{ display: "block" }}>
                    <input
                      type="radio"
                      name={`question-${questions[currentQuestionIndex].id}`}
                      value={choice}
                      checked={answer === choice}
                      onChange={(event) =>
                        handleInputAnswer(
                          event,
                          questions[currentQuestionIndex].id,
                        )
                      }
                    />
                    {letter}. {choice}
                  </label>
                );
              })}
            </div>
          )}
          <div className="flex">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex + 1 === quiz.questions.length}
            >
              Next
            </button>
          </div>
          <Button variant="primary" onClick={handleSubmitQuiz}>
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );
}
