import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function ViewSubmissions() {
  const { assignmentId } = useParams();
  const [submission, setSubmission] = useState();
  const [currentIndex, setCurrentIndex] = useState(1);
  const [score, setScore] = useState();
  const [feedback, setFeedback] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmission(2);
  }, []);

  const fetchSubmission = async (index) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/assignments/${assignmentId}/submissions/${index}`,
      );
      setSubmission(res.data);
      setCurrentIndex(Number(res.data.student_id));
    } catch (err) {
      console.error(err);
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // get actual no of Submissions
    if (currentIndex + 1 < 10) fetchSubmission(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) fetchSubmission(currentIndex - 1);
  };

  const handleGrade = async () => {
    try {
      await api.patch(`/submissions/${id}/grade`, { score, feedback });
      alert("Graded successfully!");
    } catch (err) {
      alert("Grading failed!");
    }
  };

  if (loading) return <p>Loading submission...</p>;
  if (!submission) return <p>No submissions available.</p>;

  return (
    <div className="">
      <Card title={`Student: ${submission.student_id}`}>
        <div className="">
          {submission.text_submission && (
            <div className="">
              <strong>Text Submission</strong>
              <p>{submission.text_submission}</p>
            </div>
          )}
          {submission.file_submission && (
            <div className="">
              <strong>File Submission</strong>
              <a
                href={submission.file_submission}
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
            <p>Status: {submission.status}</p>
            <p>Grade: {submission.score || "Not yet graded"}</p>
            <p>
              Submitted: {new Date(submission.submitted_at).toLocaleString()}
            </p>
            {submission.score !== null && <p>Score: {submission.score}</p>}
            {submission.feedback && <p>Feedback: {submission.feedback}</p>}
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
              disabled={currentIndex + 1 >= 10}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
