import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import PageHeading from "../../components/ui/PageHeading";
import dayjs from "dayjs";
import ListCard from "../../components/ui/ListCard";

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get("/assignments/course/1");
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
          // footer={

          // }
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
    </div>
  );
}
