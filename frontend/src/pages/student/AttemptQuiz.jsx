import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import dayjs from "dayjs";
import InnerCard from "../../components/ui/InnerCard";
import Textarea from "../../components/ui/Textarea";
import Radio from "../../components/ui/Radio";
import { useCourse } from "../../context/CourseContext";
import PageHeading from "../../components/ui/PageHeading";
import BackButton from "../../components/ui/BackButton";

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function AttemptQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { currentCourse } = useCourse();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptId, setAttemptId] = useState();
  const [answerList, setAnswerList] = useState([]);
  const [quiz, setQuiz] = useState();
  const [isExpiredQuiz, setIsExpiredQuiz] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, []);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        alert("Quiz time has elapsed.");
        handleSubmitQuiz();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

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
      setIsExpiredQuiz(isQuizExpired(res.data.due_date));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/questions/${quizId}`);
      setQuestions(res.data.message);
      const now = Date.now();
      const end = now + quiz.time_limit * 60 * 1000;

      setEndTime(end);
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
      // console.log(res.data);
      fetchQuestions();
      setHasStarted(true);
      setAttemptId(res.data.attempt_id);
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong";

      alert(message);
      console.error(err);
    }
  };

  const handlePreviousQuestion = () => {
    const currentIndex =
      currentQuestionIndex - 1 > 0 ? currentQuestionIndex - 1 : 0;
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
      alert("Quiz has been submitted!");
      navigate(`/student/course/${currentCourse.id}/quizzes`);
    } catch (err) {
      console.log(err);
    }
  };
  if (!quiz) return <p>Quiz Loading...</p>;

  return (
    <div className="flex flex-col items-center text-center min-h-screen px-5">
      <div className="w-60 md:w-full">
        <PageHeading>Start Quiz</PageHeading>
      </div>
      <div className="bg-gray-700 text-stone-200 px-4 py-6 rounded-lg space-y-4 mt-10">
        <h1 className="text-4xl font-bold">{quiz.title}</h1>
        <div>
          <h2 className="font-medium text-md text-yellow-400">
            Due: {dayjs(quiz.due_date).format("ddd D MMM, YYYY h:mm A")}
          </h2>
          {!timeLeft && !hasStarted && (
            <h2 className="text-amber-600 font-semibold text-md">
              Time Limit:{" "}
              {quiz.time_limit ? `${quiz.time_limit} minutes` : "None"}
            </h2>
          )}
          {timeLeft !== null && (
            <div className="text-lg font-semibold text-amber-600">
              Time Left: {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {!hasStarted && !isExpiredQuiz && (
          <Button
            variant="primary"
            onClick={handleBeginQuiz}
            customStyles={"w-20"}
          >
            Begin
          </Button>
        )}
      </div>

      {isExpiredQuiz && <p>This quiz is no longer available.</p>}
      {hasStarted && questions.length > 0 && (
        <InnerCard
          title={`Question ${currentQuestionIndex + 1}`}
          customStyles={"w-[100%] md:w-[80%] mt-6"}
        >
          <div className="mt-5 mb-8">
            <p className="text-lg font-semibold">
              {questions[currentQuestionIndex].question_text}
            </p>
            {questions[currentQuestionIndex].question_type ===
              "short_answer" && (
              <div className="text-left">
                <Textarea
                  label={"Response"}
                  value={answerList[currentQuestionIndex]?.answer}
                  onChange={(event) =>
                    handleInputAnswer(event, questions[currentQuestionIndex].id)
                  }
                  placeholder="Type your answer"
                />
              </div>
            )}
            {questions[currentQuestionIndex].question_type ===
              "multiple_choice" && (
              <div>
                {questions[currentQuestionIndex].choices?.map(
                  (choice, index) => {
                    return (
                      <Radio
                        key={index}
                        customStyles={"my-3 w-["}
                        name={`question-${questions[currentQuestionIndex].id}`}
                        value={choice}
                        checked={
                          answerList[currentQuestionIndex]?.answer === choice
                        }
                        onChange={(event) =>
                          handleInputAnswer(
                            event,
                            questions[currentQuestionIndex].id,
                          )
                        }
                      >
                        {choice}
                      </Radio>
                    );
                  },
                )}
              </div>
            )}
          </div>
          <div className="flex justify-center space-x-3">
            <Button
              variant="secondary"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              customStyles={"w-10 md:w-20"}
            >
              <i className="bi bi-caret-left-fill"></i>
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitQuiz}
              customStyles={"w-20 md:w-40"}
            >
              Submit
            </Button>
            <Button
              variant="secondary"
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex + 1 === quiz.questions.length}
              customStyles={"w-10 md:w-20"}
            >
              <i className="bi bi-caret-right-fill"></i>
            </Button>
          </div>
        </InnerCard>
      )}
    </div>
  );
}
