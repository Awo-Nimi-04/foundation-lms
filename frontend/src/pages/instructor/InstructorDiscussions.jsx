import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import PageHeading from "../../components/ui/PageHeading";
import { useLoading } from "../../context/LoadingContext";
import BackButton from "../../components/ui/BackButton";
import dayjs from "dayjs";

export default function InstructorDiscussions() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [discussions, setDiscussions] = useState([]);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    showLoading("Fetching Discussions . . .");
    try {
      const res = await api.get(`/discussions/course/${courseId}/threads`);
      setDiscussions(res.data);
    } catch (err) {
      console.error("Failed to fetch discussions", err);
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="relative flex flex-col items-center text-center min-h-screen">
      <div className="absolute top-5 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full mt-5">
        <PageHeading>Course Discussions</PageHeading>
      </div>
      <div className="mt-6">
        {discussions.length === 0 && (
          <p className="text-stone-400 text-center">No discussions yet</p>
        )}
        {discussions.length > 0 &&
          discussions.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              title={discussion.title}
              due_date={discussion.due_date}
              onClick={() =>
                navigate(
                  `/instructor/course/${courseId}/threads/${discussion.id}`,
                )
              }
            />
          ))}
        <Button
          variant="primary"
          onClick={() =>
            navigate(`/instructor/course/${courseId}/discussions/create`)
          }
          customStyles={"mt-4 w-60"}
        >
          Create Discussion
        </Button>
      </div>
    </div>
  );
}

function DiscussionCard({ title, due_date, onClick }) {
  return (
    <div
      onClick={onClick}
      className="w-80 md:w-150 my-3 bg-gray-700/40 p-5 border-t-2 border-stone-300 text-stone-300 flex flex-col md:flex-row justify-between items-center hover:bg-gray-700/50 cursor-pointer"
    >
      <div className="line-clamp-1 md:w-60 text-left text-lg font-semibold">
        {title}
      </div>
      <div className="flex items-center md:flex-col space-x-1">
        <p className="text-sm">Due:</p>
        <p className="text-sm text-amber-600 font-medium">
          {dayjs(due_date).format("ddd D MMM, YYYY h:mm A")}
        </p>
      </div>
    </div>
  );
}
