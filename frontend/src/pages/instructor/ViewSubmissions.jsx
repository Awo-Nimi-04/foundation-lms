import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import StatItem from "../../components/ui/StatItem";
import dayjs from "dayjs";
import Highlight from "../../components/ui/Highlight";
import { useLoading } from "../../context/LoadingContext";
import BackButton from "../../components/ui/BackButton";
import PageHeading from "../../components/ui/PageHeading";

export default function ViewSubmissions() {
  const { assignmentId } = useParams();
  const { showLoading, hideLoading } = useLoading();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submissions, setSubmissions] = useState();
  const [scores, setScores] = useState({});
  const [feedBackList, setFeedbackList] = useState({});
  const [maxScore, setMaxScore] = useState();
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchSubmission();
  }, [currentIndex]);

  const fetchSubmission = async () => {
    showLoading("Retrieving Submissions . . .");
    try {
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data);
      setMaxScore(res.data.max_score);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleNext = () => {
    const index =
      currentIndex + 1 >= submissions.students.length
        ? currentIndex
        : currentIndex + 1;
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    const index = currentIndex - 1 < 0 ? currentIndex : currentIndex - 1;
    setCurrentIndex(index);
  };

  const handleGrade = async () => {
    // console.log(score, feedback);
    // console.log(submissions);
    showLoading("Grading Submission . . .");
    try {
      await api.patch(
        `assignments/submissions/${submissions.students[currentIndex].submission_id}/grade`,
        {
          score: score,
          feedback: feedback,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      alert("Graded successfully!");
      fetchSubmission();
    } catch (err) {
      alert("Grading failed!");
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  if (!submissions || submissions.students.length === 0)
    return (
      <div className="relative flex flex-col items-center text-center min-h-screen">
        <div className="absolute top-5 left-5">
          <BackButton />
        </div>
        <div className="w-60 md:w-full mt-5">
          <PageHeading>Student Submissions</PageHeading>
        </div>
        <p className="text-stone-400 mt-10 italic">No submissions available</p>
      </div>
    );

  return (
    <div className="relative flex flex-col items-center text-center min-h-screen">
      <div className="absolute top-5 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full mt-5">
        <PageHeading>Student Submissions</PageHeading>
      </div>
      {/* {console.log(submissions)} */}
      <Card
        headerDecor={"Student"}
        title={`${submissions.students[currentIndex].first_name} ${submissions.students[currentIndex].last_name}`}
        footer={
          <div className="p-3 space-x-3">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              customStyles={"md:w-20 w-10"}
            >
              <i className="bi bi-caret-left-fill"></i>
            </Button>

            <Button
              variant="primary"
              onClick={handleGrade}
              customStyles={"md:w-40 w-20"}
            >
              Grade
            </Button>

            <Button
              variant="secondary"
              onClick={handleNext}
              disabled={currentIndex + 1 >= submissions.students.length}
              customStyles={"md:w-20 w-10"}
            >
              <i className="bi bi-caret-right-fill"></i>
            </Button>
          </div>
        }
        customStyles={"max-w-[80%] py-4 mt-4"}
      >
        <div className="text-stone-200 space-y-2 p-2">
          <StatItem
            stat={"Status"}
            value={
              submissions.students[currentIndex].status === "submitted"
                ? "Submitted"
                : "Not Submitted"
            }
            color={
              submissions.students[currentIndex].status === "submitted"
                ? "green"
                : "red"
            }
          />
          <StatItem
            stat={"Grade"}
            value={
              submissions.students[currentIndex].status === "submitted"
                ? submissions.students[currentIndex].score || "Not yet graded"
                : "N/A"
            }
            color={submissions.students[currentIndex].score ? "blue" : "orange"}
          />
          <StatItem
            stat={"Submitted"}
            value={
              submissions.students[currentIndex].status === "submitted"
                ? dayjs(submissions.students[currentIndex].submitted_at).format(
                    "M/D/YY h:mm a",
                  )
                : "N/A"
            }
          />
          {submissions.students[currentIndex].status !== "submitted" && (
            <p className="text-left font-medium text-stone-400 text-lg">
              No submission for this student
            </p>
          )}
          {submissions.students[currentIndex].submission_text && (
            <div className="flex flex-col items-center w-full my-3">
              <h1 className="text-stone-300 text-lg font-semibold">
                Text Submission
              </h1>
              <Highlight customStyles={"h-100 w-full text-left"}>
                {submissions.students[currentIndex].submission_text}
              </Highlight>
            </div>
          )}
          {submissions.students[currentIndex].submission_file && (
            <>
              <p className="text-sm text-stone-300 font-medium text-left">
                File Submission
              </p>
              <div className="flex items-center space-x-4">
                <Highlight
                  customStyles={"line-clamp-1 lg:line-clamp-none text-center"}
                >
                  {submissions.students[currentIndex].submission_file}
                </Highlight>
                <a
                  href={submissions.students[currentIndex].submission_file_url}
                  target="_blank"
                  className="text-blue-400"
                >
                  Download
                </a>
              </div>
            </>
          )}
        </div>

        <div className="">
          <div className="flex flex-col justify-center items-center space-y-2 text-left p-2">
            <div className="flex justify-center items-end">
              <Input
                label={"Score"}
                type="number"
                placeholder="Score"
                value={
                  scores[submissions.students[currentIndex].student_id] ??
                  submissions.students[currentIndex].score ??
                  ""
                }
                onChange={(e) => {
                  setScores({
                    ...scores,
                    [submissions.students[currentIndex].student_id]:
                      e.target.value,
                  });
                }}
                customStyles={"w-20"}
              />
              <p className="text-lg text-stone-300 ml-2">/ {maxScore}</p>
            </div>

            <Textarea
              label={"Feedback"}
              placeholder="Feedback"
              value={
                scores[submissions.students[currentIndex].student_id] ??
                submissions.students[currentIndex].feedback ??
                ""
              }
              onChange={(e) => {
                setFeedbackList({
                  ...feedBackList,
                  [submissions.students[currentIndex].student_id]:
                    e.target.value,
                });
              }}
              customStyles={"lg:w-80 w-60"}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
