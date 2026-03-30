import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCourse } from "../context/CoursecONTEXT.JSX";
import PageHeading from "../components/ui/PageHeading";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

export default function Register() {
  const { login } = useAuth();
  const { setCurrentCourse } = useCourse();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await api.post("/auth/register", { email, password, role });
      login(res.data.access_token, {
        id: res.data.user_id,
        role: role,
        email: email,
      });
      setCurrentCourse({ id: 1 });

      if (role === "student") {
        navigate("/student/assignments");
      } else {
        navigate("/instructor/course/1/assignments");
      }
    } catch (err) {
      alert("Failed to register user!");
      console.log(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <PageHeading>Create Account</PageHeading>
      <div className="flex flex-col bg-stone-950 p-4 w-80 rounded-xl shadow-2xl space-y-4 my-2">
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
