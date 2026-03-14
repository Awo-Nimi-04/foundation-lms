import { Link } from "react-router-dom";

export default function SideBar() {
  const role = localStorage.getItem("role");

  return (
    <div className="">
      <h3 className="">Foundation</h3>
      <div className="flex flex-col">
        {role === "student" && (
          <>
            <Link to={"/student/assignments"} className="">
              Assignments
            </Link>
            <Link to={"/student/course/1/quizzes"}>Quizzes</Link>
          </>
        )}

        {role === "instructor" && (
          <>
            <Link to={"/instructor/course/1/assignments"} className="">
              Assignments
            </Link>
            <Link to={"/instructor/course/1/quizzes"} className="">
              Quizzes
            </Link>
          </>
        )}

        <Link to={"/"} className="">
          Logout
        </Link>
      </div>
    </div>
  );
}
