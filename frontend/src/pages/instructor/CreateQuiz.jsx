import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import api from "../../api/api";
import PageHeading from "../../components/ui/PageHeading";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { useLoading } from "../../context/LoadingContext";
import BackButton from "../../components/ui/BackButton";

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { courseId } = useParams();
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    showLoading("Creating Quiz . . .");
    try {
      const res = await api.post(
        `/quizzes/courses/${courseId}/create_quiz`,
        {
          title: title,
          due_date: dueDate,
          time_limit: timeLimit,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      navigate(
        `/instructor/course/${courseId}/quizzes/${res.data.quiz_id}/quiz_editor`,
      );
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
        <PageHeading>Create Quiz</PageHeading>
      </div>
      <Card customStyles={"md:w-100 mx-auto mt-10"}>
        <form
          onSubmit={handleSubmit}
          className="p-4 text-left flex flex-col space-y-3"
        >
          <Input
            label={"Title"}
            type={"text"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={"Quiz title"}
          />

          <Input
            label={"Time Limit (minutes)"}
            value={timeLimit}
            type={"number"}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder={"Time limit"}
            customStyles={""}
          />

          <Input
            label={"Due Date"}
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Button type="submit" variant="primary">
            Create
          </Button>
        </form>
      </Card>
    </div>
  );
}
