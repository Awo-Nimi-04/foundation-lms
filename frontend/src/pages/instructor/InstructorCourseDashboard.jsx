import { useEffect, useState } from "react";
import PageHeading from "../../components/ui/PageHeading";
import { useLoading } from "../../context/LoadingContext";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import CourseCard from "../../components/ui/CourseCard";
import { useCourse } from "../../context/CourseContext";

const themes = ["red", "orange", "purple", "teal", "rose", "sky"];
const getRandomColorName = () => {
  const index = Math.floor(Math.random() * themes.length);
  return themes[index];
};

export default function InstructorCourseDashboard() {
  const { showLoading, hideLoading } = useLoading();
  const { setCurrentCourse } = useCourse();
  const [courses, setCourses] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    showLoading("Fetching Courses. . .");
    try {
      const res = await api.get("/courses/instructor");
      setCourses(res.data.courses);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
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
    <div className="flex flex-col items-center text-center min-h-screen mt-12">
      <PageHeading>Courses</PageHeading>
      {courses.length <= 0 && (
        <p className="text-stone-300 text-md font-medium my-3">
          You have not created any courses
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
              onClick={() => {
                setCurrentCourse({ id: Number(course.id) });
                navigate(`/instructor/course/${course.id}/assignments`);
              }}
              footer={
                <div className="flex items-center justify-between">
                  <button
                    className="font-semibold text-md hover:text-stone-300 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentCourse({ id: Number(course.id) });
                      navigate(`/instructor/course/${course.id}/assignments`);
                    }}
                  >
                    Assignments
                  </button>
                  <button
                    className="font-semibold text-md hover:text-stone-300 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentCourse({ id: 1 });
                      navigate(`/instructor/course/${course.id}/quizzes`);
                    }}
                  >
                    Quizzes
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
      <Button
        onClick={() => {
          navigate("/instructor/courses/create_course");
        }}
      >
        Create A Course
      </Button>
    </div>
  );
}
