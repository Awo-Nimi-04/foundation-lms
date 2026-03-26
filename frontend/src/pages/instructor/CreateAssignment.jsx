import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import PageHeading from "../../components/ui/PageHeading";
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
    <div className="text-center flex flex-col justify-center min-h-screen space-y-4">
      <PageHeading>Create Assignment</PageHeading>

      <Card title="New Assignment" customStyles={"w-100 mx-auto"}>
        <form
          onSubmit={handleSubmit}
          className="p-4 text-left flex flex-col space-y-3"
        >
          <Input
            label={"Title"}
            type={"text"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={"Assignment title"}
          />

          <Textarea
            label={"Description"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={"Instructions or description"}
          />

          <Input
            label={"Due Date"}
            type={"datetime-local"}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <div className="flex flex-col space-y-1">
            <label className="text-sm text-stone-300 font-medium">
              Reference File (optional)
            </label>
            <label className="flex items-center p-2 border border-stone-600 rounded-lg bg-stone-900 cursor-pointer">
              <span className="text-stone-300">Upload file</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
          </div>

          {error && <p className="">{error}</p>}
          <div className="text-center p-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
