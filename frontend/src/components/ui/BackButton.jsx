import { useNavigate } from "react-router-dom";

export default function BackButton({ fallback = "/" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    // If user has history, go back
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // fallback if no history (e.g., direct page load)
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="p-1 bg-blue-500 text-white rounded-full w-10 h-10 text-center font-medium hover:bg-blue-800 cursor-pointer"
    >
      <i className="bi bi-arrow-left" />
    </button>
  );
}
