import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import dayjs from "dayjs";
import InnerCard from "../../components/ui/InnerCard";
import Textarea from "../../components/ui/Textarea";
import Input from "../../components/ui/Input";
import Radio from "../../components/ui/Radio";

export default function AttemptQuiz() {
  const { quizId } = useParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptId, setAttemptId] = useState();
  const [answerList, setAnswerList] = useState([]);
  const [quiz, setQuiz] = useState();
  const [isExpiredQuiz, setIsExpiredQuiz] = useState(false);
  const [questions, setQuestions] = useState([]);
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
      setIsExpiredQuiz(isQuizExpired(res.data.due_date));
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
  if (!quiz) return <p>Quiz Loading...</p>;

  return (
    <div className="text-center flex flex-col items-center mt-12 min-h-screen space-y-2">
      <div className="bg-gray-700 text-stone-200 px-4 py-6 rounded-lg space-y-4">
        <h1 className="text-4xl font-bold">{quiz.title}</h1>
        <div>
          <h2 className="font-medium text-md text-yellow-400">
            Due: {dayjs(quiz.due_date).format("ddd D MMM, YYYY h:mm A")}
          </h2>
          <h2 className="text-amber-600 font-semibold text-md">
            Time Limit:{" "}
            {quiz.time_limit ? `${quiz.time_limit} minutes` : "None"}
          </h2>
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
          customStyles={"w-[50%] mt-6"}
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
              "multiple_choice" &&
            questions[currentQuestionIndex].is_ai_generated ? (
              <div>
                {JSON.parse(questions[currentQuestionIndex].choices)?.map(
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
            ) : (
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
            >
              Previous
            </Button>
            <Button variant="primary" onClick={handleSubmitQuiz}>
              Submit
            </Button>
            <Button
              variant="secondary"
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex + 1 === quiz.questions.length}
            >
              Next
            </Button>
          </div>
        </InnerCard>
      )}
    </div>
  );
}
