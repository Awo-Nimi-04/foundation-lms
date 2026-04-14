import { useEffect, useState } from "react";
import PageHeading from "../../components/ui/PageHeading";
import { useLoading } from "../../context/LoadingContext";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import CourseCard from "../../components/ui/CourseCard";

const themes = ["red", "orange", "purple", "teal", "rose", "sky"];
const getRandomColorName = () => {
  const index = Math.floor(Math.random() * themes.length);
  return themes[index];
};

export default function StudentCourseDashboard() {
  const { showLoading, hideLoading } = useLoading();
  const [courses, setCourses] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    showLoading("Fetching Courses. . .");
    try {
      const res = await api.get("/courses/enrolled");
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
    <div className="flex flex-col items-center text-center min-h-screen">
      <PageHeading>Courses</PageHeading>
      {courses.length <= 0 && (
        <p className="text-stone-300 text-md font-medium my-3">
          You have not enrolled in any course
        </p>
      )}
      {courses.length > 0 && (
        <div className="p-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              color={getRandomColorName()}
              key={course.id}
              title={course.title}
              customStyles={"my-3 h-60 w-80"}
              onClick={() => {
                navigate(`/student/course/${course.id}/assignments`);
              }}
              footer={
                <div className="flex items-center justify-between">
                  <button
                    className="font-semibold text-md hover:text-stone-300 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/course/${course.id}/assignments`);
                    }}
                  >
                    Assignments
                  </button>
                  <button
                    className="font-semibold text-md hover:text-stone-300 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/course/${course.id}/quizzes`);
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
    </div>
  );
}
