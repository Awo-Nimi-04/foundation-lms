import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import Select from "../../components/ui/Select";
import BackButton from "../../components/ui/BackButton";

const Study = () => {
  const { courseId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [mastery, setMastery] = useState(null); // temp

  const bottomRef = useRef(null);

  useEffect(() => {
    if (!selectedMaterial) return;

    const fetchMessages = async () => {
      const res = await api.get(`/study/messages/${selectedMaterial}`);
      // console.log(res.data);
      setMessages(res.data.messages);
      setMastery(res.data.engagement_score);
    };

    fetchMessages();
  }, [selectedMaterial]);

  useEffect(() => {
    fetchCourseMaterials();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!question.trim() || loading || !selectedMaterial) return;

    const userQuestion = question;

    setMessages((prev) => [...prev, { role: "user", content: userQuestion }]);

    setQuestion("");
    setLoading(true);

    try {
      const res = await api.post(`/study/${courseId}`, {
        question: userQuestion,
        material_id: selectedMaterial,
      });
      // console.log(res.data);
      console.log(res.data.engagement_score);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: res.data.answer,
          difficulty: res.data.difficulty,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Something went wrong.",
        },
      ]);
    }

    setLoading(false);
  };

  const fetchCourseMaterials = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/course_materials`);
      setMaterials(res.data.course_materials);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen max-w-4xl mx-auto p-4">
      <div className="absolute top-10 left-5">
        <BackButton />
      </div>
      <div className="mx-auto mb-4">
        <h1 className="text-center text-2xl font-bold mb-2 text-stone-200">
          Study Material
        </h1>
        <p className="text-center text-gray-300">
          Select any course material and ask questions about it
        </p>
        <div className="my-5">
          <Select
            customStyles={"w-100"}
            value={selectedMaterial}
            label={"Select a material"}
            onChange={(e) => {
              setSelectedMaterial(e.target.value);
            }}
          >
            <option value="">Select a file</option>
            {materials?.map((material) => (
              <option key={material.id} value={material.id}>
                {material.file_name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {selectedMaterial && (
        <>
          <div className="flex-1 border-2 border-stone-300 bg-stone-950 rounded-lg p-4">
            <div className="flex-1 overflow-y-auto rounded-lg p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-md">
                    {/* LABEL */}
                    <p
                      className={`text-xs mb-1 ${
                        msg.role === "user"
                          ? "text-right text-blue-300"
                          : "text-left text-gray-400"
                      }`}
                    >
                      {msg.role === "user" ? "You" : "Tutor"}
                    </p>

                    {/* MESSAGE BUBBLE */}
                    <div
                      className={`p-3 rounded-xl ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p>{msg.content}</p>

                      {msg.role === "ai" && msg.difficulty && (
                        <div className="flex items-center space-x-2 mt-2">
                          <p className="text-stone-500 text-sm font-medium">
                            Question difficulty:
                          </p>
                          <span
                            className={`text-xs ${msg.difficulty === "easy" ? "bg-green-100 text-green-700" : msg.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}  px-2 py-1 rounded-lg`}
                          >
                            {msg.difficulty}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {loading && <p className="text-gray-400 italic">Thinking...</p>}
            <div className="flex gap-2">
              <input
                disabled={loading}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="p-2 flex-1 rounded-lg border border-stone-200 bg-stone-950 text-stone-200 placeholder-stone-400 focus:border-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Type your question"
              />
              <button
                onClick={handleSend}
                className="bg-blue-500 text-white px-4 rounded-lg"
              >
                Send
              </button>
            </div>
            <div ref={bottomRef} />
          </div>
          {mastery && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${mastery * 100}%` }}
                />
              </div>
              <p className="text-xs mt-1 text-gray-500">
                Engagement: {(mastery * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Study;
