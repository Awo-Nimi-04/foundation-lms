import { useState } from "react";
import api from "../../api/api";
import { useParams } from "react-router-dom";

export default function SubmitAssignment() {
  const { id } = useParams();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = async () => {
    try {
      if (text) {
        await api.post(`/assignments/${id}/submit`, {
          text_content: text,
        });
      } else if (file) {
        const formData = new FormData();
        formData.append("file", file);

        await api.post(`/assignments/${id}/submit`, formData);
      }
      alert("Submitted!");
    } catch (err) {
      alert("Submission failed!");
    }
  };

  return (
    <div>
      <h2>Submit Assignment</h2>
      <textarea
        placeholder="Enter text submission..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
