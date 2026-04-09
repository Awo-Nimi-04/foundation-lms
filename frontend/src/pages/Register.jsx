import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCourse } from "../context/CoursecONTEXT.JSX";
import PageHeading from "../components/ui/PageHeading";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { useLoading } from "../context/LoadingContext";
import BackButton from "../components/ui/BackButton";

export default function Register() {
  const { showLoading, hideLoading } = useLoading();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleRegister = async () => {
    showLoading("Creating account . . .");
    try {
      const res = await api.post("/auth/register", {
        fname: firstName.trim(),
        lname: lastName.trim(),
        email: email.trim(),
        password: password.trim(),
        role: role.trim(),
      });
      hideLoading();
      alert("Account created successfully!");
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.error || "Failed to register user!";

      alert(message);
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <div className="flex items-center justify-between w-160">
        <BackButton />
        <PageHeading>Create Your Foundation Account</PageHeading>
        <div />
      </div>
      <div className="flex flex-col bg-stone-950 p-6 w-160 rounded-xl shadow-2xl space-y-4 my-4 border border-stone-400">
        <Input
          label={"First name"}
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <Input
          label={"Last name"}
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <Input
          label={"Email"}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label={"Password"}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Select
          label={"Role"}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </Select>
        <Button onClick={handleRegister}>Create Account</Button>
      </div>
    </div>
  );
}
