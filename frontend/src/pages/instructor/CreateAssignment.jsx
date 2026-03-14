import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
export default function CreateAssignment() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !dueDate) {
      setError("Title and due date are required.");
      return;
    }
    if (file) {
      formData.append("file", file);
    }

    try {
      setLoading(true);
      const res = await api.post(
        "/assignments",
        {
          title: title,
          description: description,
          due_date: dueDate,
          course_id: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      console.log("Assignment created", res.data);
      navigate("/instructor/course/1/assignments");
    } catch (err) {
      console.error(err);
      setError("Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="">
      <h2>Create Assignment</h2>

      <Card title="New Assignment">
        <form onSubmit={handleSubmit} className="">
          <div className="">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title"
            />
          </div>

          <div className="">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions or description"
            />
          </div>

          <div className="">
            <label>Due Date</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="">
            <label>Reference File (optional)</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </div>

          {error && <p className="">{error}</p>}

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Creating..." : "Create Assignment"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
