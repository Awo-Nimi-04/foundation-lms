import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import PageHeading from "../../components/ui/PageHeading";
import dayjs from "dayjs";
import ListCard from "../../components/ui/ListCard";
import BackButton from "../../components/ui/BackButton";

export default function AssignmentList() {
  const { courseId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get(`/assignments/course/${courseId}`);
      setAssignments(res.data.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative flex flex-col items-center text-center min-h-screen px-5">
      <div className="absolute top-0 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full">
        <PageHeading>Course Assignments</PageHeading>
      </div>

      {assignments.map((assignment) => (
        <ListCard
          customStyles="w-[100%] lg:w-[80%] mt-10"
          key={assignment.id}
          title={assignment.title}
          subtitle={
            <>
              <p className="hidden md:block text-sm text-yellow-500 font-bold mb-2">
                Due:{" "}
                {dayjs(assignment.due_date).format("ddd D MMM, YYYY h:mm A")}
              </p>
              <p className="md:hidden text-sm text-yellow-500 font-bold mb-2">
                Due:{" "}
                {dayjs(assignment.due_date).format("ddd D MMM, YYYY")}
              </p>
            </>
          }
        >
          <Button
            variant="secondary"
            onClick={() =>
              navigate(
                `/student/course/${courseId}/assignments/${assignment.id}/submit`,
              )
            }
          >
            Submit
          </Button>
        </ListCard>
      ))}
      {assignments.length === 0 && (
        <p className="text-stone-300 mt-4">No assignments created yet</p>
      )}
    </div>
  );
}
