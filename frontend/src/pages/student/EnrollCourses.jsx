import { useEffect, useState } from "react";
import PageHeading from "../../components/ui/PageHeading";
import { useLoading } from "../../context/LoadingContext";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import CourseCard from "../../components/ui/CourseCard";
import Label from "../../components/ui/Label";
import dayjs from "dayjs";
import BackButton from "../../components/ui/BackButton";

const themes = ["red", "orange", "purple", "teal", "rose", "sky"];
const getRandomColorName = () => {
  const index = Math.floor(Math.random() * themes.length);
  return themes[index];
};

const getEnrollStatus = (course) => {
  const now = new Date();
  const endDate = new Date(course.enrollment_end);
  if (course.is_enrolled) return "enrolled";
  else if (course.enrollment_open) return "open";
  else if (now > endDate) return "closed";
  else return "inactive";
};

export default function EnrollCourses() {
  const { showLoading, hideLoading } = useLoading();
  const [courses, setCourses] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const fetchAllCourses = async () => {
    showLoading("Fetching Courses. . .");
    try {
      const res = await api.get("/courses");
      setCourses(res.data.courses);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const enroll = async (courseId) => {
    showLoading("Enrolling . . .");
    try {
      const res = await api.post(`/courses/${courseId}/enroll`);
      //   console.log(res.data);
      fetchAllCourses();
    } catch (err) {
      console.error(err);
    }
  };

  if (!courses) {
    return (
      <div className="flex flex-col justify-center items-center text-center min-h-screen">
        <p className="text-stone-300 text-md font-medium">
          No courses available. . .
        </p>
      </div>
    );
  }
  return (
    <div className="relative flex flex-col items-center text-center min-h-screen mt-12">
      <div className="absolute top-0 left-5">
        <BackButton />
      </div>
      <PageHeading>Courses</PageHeading>
      {courses.length <= 0 && (
        <p className="text-stone-300 text-md font-medium my-3">
          There are no courses avaialble
        </p>
      )}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              color={getRandomColorName()}
              key={course.id}
              title={course.title}
              customStyles={"my-3 h-60 w-80"}
              label={
                <>
                  {getEnrollStatus(course) === "open" && (
                    <Label color="green">Open</Label>
                  )}
                  {getEnrollStatus(course) === "closed" && (
                    <Label color="red">Closed</Label>
                  )}
                  {getEnrollStatus(course) === "inactive" && (
                    <Label color="yellow">
                      Opens{" "}
                      {dayjs(course.enrollment_start).format("ddd DD MMM YYYY")}
                    </Label>
                  )}
                  {getEnrollStatus(course) === "enrolled" && (
                    <Label color="blue">Already Enrolled</Label>
                  )}
                </>
              }
              footer={
                <Button
                  variant="secondary"
                  customStyles={"w-40 font-semibold"}
                  onClick={() => {
                    enroll(course.id);
                  }}
                  disabled={course.is_enrolled || !course.enrollment_open}
                >
                  Enroll
                </Button>
              }
              invert={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
