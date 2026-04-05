import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import PageHeading from "../../components/ui/PageHeading";
import dayjs from "dayjs";
import ListCard from "../../components/ui/ListCard";

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
    <div className="text-center flex flex-col items-center justify-center min-h-screen space-y-2">
      <PageHeading>Your Assignments</PageHeading>

      {assignments.map((assignment) => (
        <ListCard
          customStyles={"w-120"}
          key={assignment.id}
          title={assignment.title}
          subtitle={
            <p className="text-sm text-yellow-500 font-bold mb-2">
              Due: {dayjs(assignment.due_date).format("ddd D MMM, YYYY h:mm A")}
            </p>
          }
        >
          <Button
            variant="secondary"
            onClick={() =>
              navigate(`/student/assignments/${assignment.id}/submit`)
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
