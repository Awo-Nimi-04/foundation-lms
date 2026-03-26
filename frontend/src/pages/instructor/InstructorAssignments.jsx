import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../api/api";

import Button from "../../components/ui/Button";
import PageHeading from "../../components/ui/PageHeading";
import ListCard from "../../components/ui/ListCard";
import Card from "../../components/ui/Card";

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
    <div className="text-center flex flex-col items-center justify-center min-h-screen space-y-2">
      <PageHeading>Instructor Assignments</PageHeading>

      {loading && <p className="text-stone-200">Loading assignments...</p>}
      {/* {error && <p className="">{error}</p>} */}

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card
            customStyles={"py-6"}
            key={assignment.id}
            title={assignment.title}
            footer={
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    `/instructor/assignments/${assignment.id}/submissions`,
                  )
                }
              >
                Submissions
              </Button>
            }
          >
            <div className="flex flex-col">
              <p className="text-sm text-yellow-500 font-bold mb-2">
                Due:{" "}
                {dayjs(assignment.due_date).format("ddd D MMM, YYYY h:mm A")}
              </p>
              {assignment.description && (
                <p className="text-gray-300">{assignment.description}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {!loading && assignments.length === 0 && (
        <p className="text-stone-300 mt-4">No assignments created yet.</p>
      )}

      <Button
        variant="primary"
        onClick={() => navigate("/instructor/assignments/create")}
        customStyles={"mx-auto"}
      >
        Create Assignment
      </Button>
    </div>
  );
}
