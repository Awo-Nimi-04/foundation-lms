import { useState } from "react";
import PageHeading from "../../components/ui/PageHeading";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import { useLoading } from "../../context/LoadingContext";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/ui/BackButton";

export default function CreateCourse() {
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [enrollmentStartDate, setEnrollmentStartDate] = useState("");
  const [enrollmentEndDate, setEnrollmentEndDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    showLoading("Creating Course. . .");
    try {
      const res = await api.post(
        "/courses",
        {
          title: title,
          description: description,
          enrollment_start: new Date(enrollmentStartDate).toISOString(),
          enrollment_end: new Date(enrollmentEndDate).toISOString(),
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
    <div className="relative flex flex-col items-center text-center min-h-screen">
      <div className="absolute top-5 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full mt-5">
        <PageHeading>Create A New Course</PageHeading>
      </div>
      <Card title="New Course" customStyles={"md:w-100 mx-auto mt-10"}>
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
