import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import PageHeading from "../../components/ui/PageHeading";
import { useLoading } from "../../context/LoadingContext";
import { useCourse } from "../../context/CoursecONTEXT.JSX";
import BackButton from "../../components/ui/BackButton";

export default function CreateDiscussion() {
  const navigate = useNavigate();
  const { currentCourse } = useCourse();
  const { showLoading, hideLoading } = useLoading();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [totalPoints, setTotalPoints] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("title", title);
    formData.append("prompt", prompt);
    formData.append("due_date", dueDate);
    formData.append("course_id", currentCourse.id);
    formData.append("max_score", totalPoints);

    showLoading("Creating Discussion...");

    try {
      const res = await api.post(
        `/discussions/course/${currentCourse.id}/threads`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // console.log("Assignment created", res.data);
      navigate(`/instructor/course/${currentCourse.id}/discussions`);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };
  return (
    <div className="relative flex flex-col items-center text-center min-h-screen px-5">
      <div className="absolute top-0 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full">
        <PageHeading>Create Discussion</PageHeading>
      </div>

      <Card title="New Discussion" customStyles={"md:w-120 mt-10 mx-auto"}>
        <form
          onSubmit={handleSubmit}
          className="p-4 text-left flex flex-col space-y-3"
        >
          <Input
            label={"Title"}
            type={"text"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={"Discussion title"}
          />

          <Textarea
            label={"Prompt"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={"Prompt"}
          />

          <Input
            label={"Total Points"}
            type="number"
            value={totalPoints}
            onChange={(e) => setTotalPoints(e.target.value)}
            placeholder={"Total points"}
          />

          <Input
            label={"Due Date"}
            type={"datetime-local"}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

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
