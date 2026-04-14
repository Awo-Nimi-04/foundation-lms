import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import Button from "../components/ui/Button";
import PageHeading from "../components/ui/PageHeading";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const handleVerifyEmail = () => {
    if (!token) {
      setStatus("error");
      return;
    }
    try {
      api.get(`/auth/verify-email?token=${token}`);
      alert("Verification Successful!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again!");
    } finally {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center p-3">
      <h1 className="mt-10 mb-10 text-blue-400 font-medium text-md italic">
        Foundation LMS
      </h1>
      <PageHeading>Email Verification</PageHeading>
      <p className="text-purple-400 text-xl">Welcome to Foundation LMS</p>
      <p className="text-stone-400">
        Please click the button below to verify your email.
      </p>
      <i className="bi bi-arrow-down-circle-fill text-4xl text-purple-500 my-3"></i>
      <Button onClick={handleVerifyEmail} customStyles={"mt-5 w-60"}>
        Verify Email
      </Button>
    </div>
  );
}
