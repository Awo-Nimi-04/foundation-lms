import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function InstructorAssignments() {
  const { courseId } = useParams;
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      // should be the assignments per course
      const res = await api.get(`/assignments/course/${courseId || 1}`);
      setAssignments(res.data.message || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Unauthorized. Please log in again.");
      } else {
        setError("Failed to fetch assignments.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="">
        <h2>Instructor Assignments</h2>
        <Button
          variant="primary"
          onClick={() => navigate("/instructor/assignments/create")}
        >
          Create Assignment
        </Button>
      </div>

      {loading && <p>Loading assignments...</p>}
      {/* {error && <p className="">{error}</p>} */}

      {assignments.map((assignment) => (
        <Card
          key={assignment.id}
          title={assignment.title}
          footer={
            <Button
              variant="secondary"
              onClick={() =>
                navigate(`/instructor/assignments/${assignment.id}/submissions`)
              }
            >
              View Submissions
            </Button>
          }
        >
          <p>Due: {assignment.due_date}</p>
          {assignment.description && <p>{assignment.description}</p>}
        </Card>
      ))}

      {!loading && assignments.length === 0 && (
        <p>No assignments created yet.</p>
      )}
    </div>
  );
}
