import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCourse } from "../../context/CoursecONTEXT.JSX";

const navStyle =
  "text-stone-200 hover:bg-gray-100 hover:text-stone-900 p-2 rounded";

export default function SideBar() {
  const { user } = useAuth();
  const { currentCourse, setCurrentCourse } = useCourse();

  if (!user) return null;

  return (
    <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-600/50 shadow-xl p-4 z-40">
      <div className="flex flex-col gap-3">
        {user.role === "student" && (
          <>
            <Link
              to="/student/courses"
              onClick={() => {
                setCurrentCourse(null);
              }}
              className={`font-bold text-lg ${navStyle}`}
            >
              My Courses
            </Link>

            {currentCourse && (
              <>
                <Link
                  to={`/student/course/${currentCourse.id}/assignments`}
                  className={`${navStyle}`}
                >
                  Assignments
                </Link>
                <Link
                  to={`/student/course/${currentCourse.id}/quizzes`}
                  className={`${navStyle}`}
                >
                  Quizzes
                </Link>
                <Link
                  to={`/student/${currentCourse.id}/study`}
                  className={`${navStyle}`}
                >
                  Study
                </Link>
                <Link
                  to={`/student/course/${currentCourse.id}/files/`}
                  className={`${navStyle}`}
                >
                  Files
                </Link>
              </>
            )}
            <Link
              to="/student/all_courses"
              className={`font-bold text-lg ${navStyle}`}
            >
              Register Courses
            </Link>
          </>
        )}

        {user.role === "instructor" && (
          <>
            <Link
              to="/instructor/courses"
              onClick={() => {
                setCurrentCourse(null);
              }}
              className={`font-bold text-lg ${navStyle}`}
            >
              My Courses
            </Link>
            {currentCourse && (
              <>
                <Link
                  to={`/instructor/course/${currentCourse.id}/assignments`}
                  className={`${navStyle}`}
                >
                  Assignments
                </Link>
                <Link
                  to={`/instructor/course/${currentCourse.id}/quizzes`}
                  className={`${navStyle}`}
                >
                  Quizzes
                </Link>
                <Link
                  to={`/instructor/course/${currentCourse.id}/files`}
                  className={`${navStyle}`}
                >
                  Files
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
