import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams } from "react-router-dom";
import Button from "../../components/ui/Button";

export default function SubmitAssignment() {
  const { assignmentId } = useParams();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [submitType, setSubmitType] = useState("text");
  const [canSubmit, setCanSubmit] = useState(true);

  useEffect(() => {
    fetchAssignment();
  }, []);

  const fetchAssignment = async () => {
    try {
      const res = await api.get(`assignments/${assignmentId}?student_id=2`);
      console.log(res.data);
      setAssignment(res.data);
      setCanSubmit(res.data.latest_submission ? false : true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      if (text) {
        await api.post(`/assignments/${assignmentId}/submit`, {
          text_content: text,
        });
      } else if (file) {
        const formData = new FormData();
        formData.append("file", file);

        await api.post(`/assignments/${assignmentId}/submit`, formData);
      }
      alert("Submitted!");
    } catch (err) {
      alert("Submission failed!");
    }
  };

  if (!assignment) return <p>Loading Assignment...</p>;

  return (
    <div>
      <h1>{assignment.title}</h1>
      <p>{assignment.description}</p>
      <p>Due by: {assignment.due_date}</p>
      <p>Total Possible Points: {assignment.max_score}</p>
      {assignment.latest_submission && (
        <p>Latest Submission Score: {assignment.latest_submission.score || "Not yet graded"}</p>
      )}
      {!canSubmit && (
        <Button onClick={() => setCanSubmit(true)}>Resubmit</Button>
      )}
      {canSubmit && (
        <>
          <h2>Submit Assignment</h2>
          <div className="flex">
            <button
              onClick={() => {
                setSubmitType("text");
              }}
            >
              Text
            </button>
            <button
              onClick={() => {
                setSubmitType("file");
              }}
            >
              File Upload
            </button>
          </div>

          {submitType === "text" && (
            <div>
              {assignment.allow_text && (
                <textarea
                  placeholder="Enter text submission..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              )}
              {!assignment.allow_text && (
                <p>You are not allowed to submit text for this assignment.</p>
              )}
            </div>
          )}
          {submitType === "file" && (
            <div>
              {assignment.allow_file && (
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              )}

              {!assignment.allow_file && (
                <p>You are not allowed to submit file for this assignment.</p>
              )}
            </div>
          )}

          <button onClick={handleSubmit}>Submit</button>
          {assignment.latest_submission && (
            <button onClick={() => setCanSubmit(false)}>Cancel</button>
          )}
        </>
      )}
    </div>
  );
}

// "id": assignment.id,
// "title": assignment.title,
// "description": assignment.description,
// "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
// "max_score": assignment.max_score,
// "allow_text": assignment.allow_text_submission,
// "allow_file": assignment.allow_file_submission,
