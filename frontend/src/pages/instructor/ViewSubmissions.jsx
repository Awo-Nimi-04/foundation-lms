import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Label from "../../components/ui/Label";
import StatItem from "../../components/ui/StatItem";
import dayjs from "dayjs";
import Highlight from "../../components/ui/Highlight";

export default function ViewSubmissions() {
  const { assignmentId } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmission();
  }, [currentIndex]);

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data.submissions);
      setMaxScore(res.data.max_score);
    } catch (err) {
      console.error(err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // get actual no of Submissions
    if (currentIndex + 1 < submissions.length)
      setCurrentIndex(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleGrade = async () => {
    console.log(score, feedback);
    try {
      await api.patch(
        `assignments/submissions/${submissions[currentIndex].submission_id}/grade`,
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
    } catch (err) {
      alert("Grading failed!");
    }
  };

  if (loading) return <p>Loading submission...</p>;
  if (submissions.length <= 0)
    return (
      <div className="flex flex-col justify-center items-center text-center min-h-screen">
        <p className="text-stone-300">No submissions available.</p>
      </div>
    );

  return (
    <div className="flex flex-col justify-center items-center text-center min-h-screen">
      <Card
        title={`Student: ${submissions[currentIndex].student_id}`}
        footer={
          <div className="p-3 space-x-3">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>

            <Button variant="primary" onClick={handleGrade}>
              Grade
            </Button>

            <Button
              variant="secondary"
              onClick={handleNext}
              disabled={currentIndex + 1 >= submissions.length}
            >
              Next
            </Button>
          </div>
        }
        customStyles={"w-[50%] py-4 mt-4"}
      >
        <div className="text-stone-200 space-y-2 p-2">
          <StatItem
            stat={"Status"}
            value={submissions[currentIndex].status}
            color={
              submissions[currentIndex].status === "submitted" ? "green" : null
            }
          />
          <StatItem
            stat={"Grade"}
            value={submissions[currentIndex].score || "Not yet graded"}
            color={submissions[currentIndex].score ? "blue" : "orange"}
          />
          <StatItem
            stat={"Submitted"}
            value={dayjs(submissions[currentIndex].submitted_at).format(
              "M/D/YY h:mm a",
            )}
          />
        </div>

        <div className="">
          {submissions[currentIndex].submission_text && (
            <div className="flex flex-col items-center w-full my-3">
              <h1 className="text-stone-300 text-lg font-semibold">
                Text Submission
              </h1>
              <Highlight customStyles={"h-100 w-full text-left"}>
                {submissions[currentIndex].submission_text}
              </Highlight>
            </div>
          )}
          {submissions[currentIndex].file_submission && (
            <div className="">
              <strong>File Submission</strong>
              <a
                href={submissions[currentIndex].file_submission}
                target="_blank"
                rel="noreferrer"
              >
                Download File
              </a>
            </div>
          )}

          <div className="flex flex-col justify-center items-center space-y-2 text-left p-2">
            <div className="flex justify-center items-end">
              <Input
                label={"Score"}
                type="number"
                placeholder="Score"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                customStyles={"w-20"}
              />
              <p className="text-lg text-stone-300 ml-2">/ {maxScore}</p>
            </div>

            <Textarea
              label={"Feedback"}
              placeholder="Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              customStyles={"w-80"}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
