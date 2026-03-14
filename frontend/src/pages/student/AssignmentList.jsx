import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

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
    <div>
      <h2>Your Assignments</h2>

      {assignments.map((assignment) => (
        <Card
          key={assignment.id}
          title={assignment.title}
          footer={
            <Button
              variant="primary"
              onClick={() =>
                navigate(`/student/assignments/${assignment.id}/submit`)
              }
            >
              Submit
            </Button>
          }
        >
          <p>Due: {assignment.due_date}</p>
        </Card>
      ))}
    </div>
  );
}
