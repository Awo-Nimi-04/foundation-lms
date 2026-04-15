import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import PageHeading from "../../components/ui/PageHeading";
import { useLoading } from "../../context/LoadingContext";
import { useCourse } from "../../context/CourseContext";
import BackButton from "../../components/ui/BackButton";
export default function CreateAssignment() {
  const navigate = useNavigate();
  const { currentCourse } = useCourse();
  const { showLoading, hideLoading } = useLoading();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("due_date", dueDate);
    formData.append("course_id", currentCourse.id);

    if (file) {
      formData.append("reference_file", file);
    }

    showLoading("Creating Assignment...");

    try {
      const res = await api.post(`/assignments/course/${currentCourse.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("Assignment created", res.data);
      navigate(`/instructor/course/${currentCourse.id}/assignments`);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };
  return (
    <div className="relative flex flex-col items-center text-center min-h-screen">
      <div className="absolute top-5 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full mt-5">
        <PageHeading>Create Assignment</PageHeading>
      </div>

      <Card title="New Assignment" customStyles={"md:w-120 mx-auto mt-10"}>
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
            {!file && (
              <label className="flex items-center p-2 border border-stone-600 rounded-lg bg-stone-900 cursor-pointer">
                <span className="text-stone-300 p-2">Upload file</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
            )}
            {file && (
              <div className="flex items-center justify-between p-2 border border-stone-600 rounded-lg bg-stone-900 cursor-pointer">
                <p className="text-blue-300 line-clamp-1 overflow-auto">
                  {file.name}
                </p>
                <Button
                  variant="tertiary"
                  onClick={() => {
                    setFile(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="text-center my-3">
            <Button type="submit" variant="primary" customStyles={"w-full"}>
              Create
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
