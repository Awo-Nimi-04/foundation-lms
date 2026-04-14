import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatItem from "../../components/ui/StatItem";
import dayjs from "dayjs";
import Highlight from "../../components/ui/Highlight";
import TabButton from "../../components/ui/TabButton";
import Textarea from "../../components/ui/Textarea";
import { useCourse } from "../../context/CourseContext";
import BackButton from "../../components/ui/BackButton";
import PageHeading from "../../components/ui/PageHeading";
import { useLoading } from "../../context/LoadingContext";

export default function SubmitAssignment() {
  const { showLoading, hideLoading } = useLoading();
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { currentCourse } = useCourse();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [submitType, setSubmitType] = useState("Text");
  const [canSubmit, setCanSubmit] = useState(true);

  useEffect(() => {
    fetchAssignment();
  }, []);

  const fetchAssignment = async () => {
    try {
      const res = await api.get(`/assignments/${assignmentId}`);
      // console.log(res.data);
      setAssignment(res.data);
      setCanSubmit(res.data.latest_submission ? false : true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    showLoading("Submitting assignment");
    try {
      if (text) {
        await api.post(`/assignments/${assignmentId}/submit`, {
          text_content: text,
        });
      } else if (file) {
        const formData = new FormData();
        formData.append("file", file);

        await api.post(`/assignments/${assignmentId}/submit`, formData);
      }
      alert("Submitted!");
      navigate(`/student/course/${currentCourse.id}/assignments`);
    } catch (err) {
      alert("Submission failed!");
    } finally {
      hideLoading();
    }
  };

  const handleChangeSubmitType = (type) => {
    setSubmitType(type);
  };

  if (!assignment) return <p>Loading Assignment...</p>;

  return (
    <div className="relative flex flex-col items-center text-center min-h-screen px-5">
      <div className="absolute top-0 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full">
        <PageHeading>Submit Assignment</PageHeading>
      </div>
      {/* {console.log(assignment)} */}
      <Card
        customStyles={"text-center text-stone-300 w-[100%] md:w-[80%] my-10"}
        title={assignment.title}
        footer={
          !canSubmit && (
            <div className="flex justify-center p-2">
              <Button onClick={() => setCanSubmit(true)}>Resubmit</Button>
            </div>
          )
        }
      >
        <div className="mb-8">
          <div className="text-left my-5 space-y-3">
            <p className="text-sm text-stone-300 font-medium">
              Assignment Prompt
            </p>
            <Highlight>{assignment.description}</Highlight>
          </div>
          {assignment.reference_file_name && (
            <>
              <p className="text-sm text-stone-300 font-medium text-left">
                Reference File
              </p>
              <div className="flex items-center space-x-4">
                <Highlight customStyles={"line-clamp-1 lg:line-clamp-none"}>
                  {assignment.reference_file_name}
                </Highlight>
                <a
                  href={assignment.reference_file_url}
                  target="_blank"
                  className="text-blue-400"
                >
                  Download
                </a>
              </div>
            </>
          )}
          {assignment.latest_submission && (
            <>
              {assignment.latest_submission.submission_text && (
                <div className="text-left my-5 space-y-3">
                  <p className="text-sm text-stone-300 font-medium">
                    Latest Submission
                  </p>
                  <Highlight customStyles={"h-100"}>
                    {assignment.latest_submission.submission_text}
                  </Highlight>
                </div>
              )}
              {assignment.latest_submission.submission_file && (
                <div className="text-left my-5 space-y-3">
                  <p className="text-sm text-stone-300 font-medium">
                    Latest Submission
                  </p>
                  <div className="flex items-center space-x-4">
                    <Highlight
                      customStyles={
                        "line-clamp-1 lg:line-clamp-none text-center"
                      }
                    >
                      {assignment.latest_submission.submission_file}
                    </Highlight>
                    <a
                      href={assignment.latest_submission.submission_file_url}
                      target="_blank"
                      className="text-blue-400"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
              {assignment.latest_submission.feedback && (
                <div className="text-left my-5 space-y-3">
                  <p className="text-sm text-stone-300 font-medium">Feedback</p>
                  <Highlight customStyles={"h-100"}>
                    {assignment.latest_submission.feedback}
                  </Highlight>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-3">
          <StatItem
            stat={"Due by"}
            value={dayjs(assignment.due_date).format("M/D/YY h:mm a")}
          />
          <StatItem
            stat={"Assignment Total"}
            value={assignment.max_score}
            color={"green"}
          />
          {assignment.latest_submission && (
            <StatItem
              stat={"Latest Submission Score"}
              value={assignment.latest_submission.score || "Not yet graded"}
              color={assignment.latest_submission.score ? "yellow" : "orange"}
            />
          )}
        </div>

        {canSubmit && (
          <div className="flex flex-col justify-center items-center my-3 space-y-5 px-2">
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold">Submit Assignment</h2>
              <TabButton
                options={["Text", "File"]}
                selectedOption={submitType}
                onChange={handleChangeSubmitType}
              />
            </div>

            {submitType === "Text" && (
              <div className="text-left w-full">
                {assignment.allow_text && (
                  <Textarea
                    label={"Text Submission"}
                    placeholder="Enter text submission..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    customStyles={"w-full"}
                  />
                )}
                {!assignment.allow_text && (
                  <p>You are not allowed to submit text for this assignment.</p>
                )}
              </div>
            )}
            {submitType === "File" && (
              <div className="w-full">
                {assignment.allow_file && (
                  <div className="w-[100%] md:w-100 mx-auto">
                    <p className="text-stone-300 text-left text-sm font-medium">File Submission</p>
                    {!file && (
                      <label className="flex items-center p-2 border border-stone-600 rounded-lg bg-stone-900 cursor-pointer">
                        <span className="text-stone-300 p-2">Upload file</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setFile(e.target.files[0])}
                        />
                      </label>
                    )}
                    {file && (
                      <div className="flex items-center justify-between p-2 border border-stone-600 rounded-lg bg-stone-900 cursor-pointer">
                        <p className="text-blue-300 line-clamp-1 overflow-auto">
                          {file.name}
                        </p>
                        <Button
                          variant="tertiary"
                          onClick={() => {
                            setFile(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!assignment.allow_file && (
                  <p>You are not allowed to submit file for this assignment.</p>
                )}
              </div>
            )}
            <div className="space-x-3">
              <Button onClick={handleSubmit}>Submit</Button>
              {assignment.latest_submission && (
                <Button variant="tertiary" onClick={() => setCanSubmit(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
