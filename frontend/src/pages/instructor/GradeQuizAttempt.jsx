import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import InnerCard from "../../components/ui/InnerCard";
import Label from "../../components/ui/Label";
import { useCourse } from "../../context/CourseContext";
import BackButton from "../../components/ui/BackButton";
import PageHeading from "../../components/ui/PageHeading";
import StatItem from "../../components/ui/StatItem";
import { useLoading } from "../../context/LoadingContext";

export default function GradeQuizAttempt() {
  const { quizId } = useParams();
  const { currentCourse } = useCourse();
  const { showLoading, hideLoading } = useLoading();
  const [students, setStudents] = useState([]);
  const [studentIndex, setStudentIndex] = useState(0);
  const [attempt, setAttempt] = useState();
  const [scores, setScores] = useState([]);

  useEffect(() => {
    fetchEnrolledStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0 && students[studentIndex]) {
      fetchQuizAttempt();
    }
  }, [studentIndex, students]);

  const fetchQuizAttempt = async () => {
    try {
      const studentId = students[studentIndex].student_id;

      const res = await api.get(
        `/quiz_attempts/quiz/${quizId}/student/${studentId}/responses`,
      );
      // console.log(res.data);

      setAttempt(res.data);
      if (res.data.status === "submitted") {
        const initialScores = res.data.responses.map((response) => ({
          question_id: response.question_id,
          score: response.score,
        }));
        setScores(initialScores);
      }
    } catch (err) {
      console.error(err);

      // handle no submission case
      setAttempt(null);
      setScores([]);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const res = await api.get(
        `/courses/${currentCourse.id}/course_enrollees`,
      );
      // console.log(res.data.students[0]);
      setStudents(res.data.students);
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
    showLoading("Grading");
    try {
      const res = await api.patch(
        `/quiz_attempts/${attempt.attempt_id}/grade`,
        {
          questions: scores,
        },
      );
      alert("Quiz attempt graded!");
      fetchQuizAttempt();
      // console.log(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      hideLoading();
    }
  };

  const handlePreviousStudent = () => {
    const index = studentIndex - 1 < 0 ? studentIndex : studentIndex - 1;
    setStudentIndex(index);
  };

  const handleNextStudent = () => {
    const index =
      studentIndex + 1 >= students.length ? studentIndex : studentIndex + 1;
    setStudentIndex(index);
  };

  if (!attempt || attempt.responses?.length <= 0)
    return (
      <div className="relative flex flex-col items-center text-center min-h-screen px-5">
        <div className="absolute top-0 left-5">
          <BackButton />
        </div>
        <div className="w-60 md:w-full">
          <PageHeading>Grade Quiz</PageHeading>
        </div>
        <p className="text-stone-400 italic mt-10">
          There is no attempt to grade
        </p>
      </div>
    );

  return (
    <div className="relative flex flex-col items-center text-center min-h-screen px-5">
      <div className="absolute top-0 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full">
        <PageHeading>Grade Quiz</PageHeading>
      </div>
      {/* {console.log(attempt)} */}
      <Card
        headerDecor={"Student"}
        title={`${attempt.first_name} ${attempt.last_name}`}
        footer={
          <div className="flex justify-center p-2 space-x-2">
            <Button
              variant="secondary"
              onClick={handlePreviousStudent}
              disabled={studentIndex === 0}
              customStyles={"w-10 md:w-20"}
            >
              <i className="bi bi-caret-left-fill"></i>
            </Button>
            <Button onClick={handleGradeQuiz} customStyles={"w-20 md:w-40"}>
              Grade
            </Button>
            <Button
              variant="secondary"
              onClick={handleNextStudent}
              disabled={studentIndex === students.length - 1}
              customStyles={"w-10 md:w-20"}
            >
              <i className="bi bi-caret-right-fill"></i>
            </Button>
          </div>
        }
        customStyles={"text-center py-4 w-[80%] mx-auto mt-10"}
      >
        {/* {console.log(studentIndex)} */}
        <div className="flex justify-between px-6">
          <div className="text-stone-200 w-full">
            <StatItem
              stat={"Score"}
              color={"orange"}
              value={`${attempt.attempt_score || attempt.attempt_score === 0 ? `${Number(attempt.attempt_score)} / ${attempt.quiz_total_score}` : "N/A"}`}
            />
          </div>
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
        {attempt.status === "not_submitted" && (
          <>
            <h1 className="text-lg text-stone-400 font-semibold">
              This student has no attempt for this quiz
            </h1>
            <img
              className="md:w-100 md:h-100 mx-auto p-2 rounded-full bg-blue-200 my-5"
              src="https://static.vecteezy.com/system/resources/previews/055/476/494/non_2x/emoticon-crying-cartoon-character-with-sad-face-and-sad-expression-illustration-free-vector.jpg"
              alt="Sad emoji tearing up"
            />
          </>
        )}
      </Card>
    </div>
  );
}
