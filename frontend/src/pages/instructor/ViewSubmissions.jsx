import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

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
  if (submissions.length <= 0) return <p>No submissions available.</p>;

  return (
    <div className="">
      <Card title={`Student: ${submissions[currentIndex].student_id}`}>
        <div className="">
          {submissions[currentIndex].submission_text && (
            <div className="">
              <strong>Text Submission</strong>
              <p>{submissions[currentIndex].submission_text}</p>
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

          <div>
            <input
              type="number"
              placeholder="Score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />

            <textarea
              placeholder="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          <div className="">
            <p>Status: {submissions[currentIndex].status}</p>
            <p>Grade: {submissions[currentIndex].score || "Not yet graded"}</p>
            <p>
              Submitted:{" "}
              {new Date(
                submissions[currentIndex].submitted_at,
              ).toLocaleString()}
            </p>
            {submissions[currentIndex].feedback && (
              <p>Feedback: {submissions[currentIndex].feedback}</p>
            )}
          </div>

          <div className="">
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
          <p>Max Score: {maxScore}</p>
        </div>
      </Card>
    </div>
  );
}
