import { useState } from "react";
import PageHeading from "../../components/ui/PageHeading";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import { useLoading } from "../../context/LoadingContext";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

export default function CreateCourse() {
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [enrollmentStartDate, setEnrollmentStartDate] = useState("");
  const [enrollmentEndDate, setEnrollmentEndDate] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const handleSubmit = async (e) => {
    e.preventDefault();

    showLoading("Creating Course. . .");
    try {
      const res = await api.post(
        "/courses",
        {
          title: title,
          description: description,
          enrollment_start: enrollmentStartDate,
          enrollment_end: enrollmentEndDate,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      // console.log("Course created", res.data);
      navigate("/instructor/courses");
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="flex flex-col justify-center items-center text-center min-h-screen">
      <PageHeading>Create A New Course</PageHeading>
      <Card title="New Assignment" customStyles={"w-100 mx-auto my-5"}>
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
            label={"Enrollment Start"}
            type={"datetime-local"}
            value={enrollmentStartDate}
            onChange={(e) => setEnrollmentStartDate(e.target.value)}
          />
          <Input
            label={"Enrollment End"}
            type={"datetime-local"}
            value={enrollmentEndDate}
            onChange={(e) => setEnrollmentEndDate(e.target.value)}
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
