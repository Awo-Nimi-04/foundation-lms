import { useParams } from "react-router-dom";
import { useLoading } from "../../context/LoadingContext";
import api from "../../api/api";
import { useEffect, useState } from "react";
import BackButton from "../../components/ui/BackButton";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import InnerCard from "../../components/ui/InnerCard";
import Input from "../../components/ui/Input";
import Label from "../../components/ui/Label";
import PageHeading from "../../components/ui/PageHeading";

export default function GradeDiscussion() {
  const { threadId } = useParams();
  const { showLoading, hideLoading } = useLoading();
  const [participation, setParticipation] = useState();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchThreadParicipation();
  }, []);

  const fetchThreadParicipation = async () => {
    showLoading();
    try {
      const res = await api.get(
        `/discussions/threads/${threadId}/participation`,
      );
      setParticipation(res.data);
    } catch (error) {
    } finally {
      hideLoading();
    }
  };

  const updateCurrentGrade = (field, value) => {
    setParticipation((prev) => {
      const updated = [...prev.results];

      updated[index] = {
        ...updated[index],
        grade: {
          ...updated[index].grade,
          [field]: value,
        },
      };

      return {
        ...prev,
        results: updated,
      };
    });
  };

  const handleGradeDiscussion = async () => {
    if (!participation) return;

    const student = participation.results[index];
    showLoading();
    try {
      await api.post(
        `/discussions/threads/${threadId}/grade/${student.student.id}`,
        { score: student.grade.score },
      );
      alert("Graded successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handlePrevIndex = () => {
    const newIndex = index - 1 >= 0 ? index - 1 : index;
    setIndex(newIndex);
  };

  const handleNextIndex = () => {
    const newIndex =
      index + 1 >= participation?.results.length ? index : index + 1;
    setIndex(newIndex);
  };

  if (!participation || participation.results.length === 0)
    return (
      <div className="relative flex flex-col items-center text-center min-h-screen">
        <div className="absolute top-5 left-5">
          <BackButton />
        </div>
        <div className="w-60 md:w-full mt-5">
          <PageHeading>Grade Discussion</PageHeading>
        </div>
        <p className="text-stone-300 text-center mt-10">
          No engagements with this discussion yet
        </p>
      </div>
    );

  if (
    participation.results[index].comments.length === 0 &&
    !participation.results[index].main_post
  ) {
    return (
      <div className="relative flex flex-col items-center text-center min-h-screen p-3">
        <div className="absolute top-5 left-5">
          <BackButton />
        </div>
        <div className="w-60 md:w-full mt-3">
          <PageHeading>Grade Discussion</PageHeading>
        </div>
        <Card
          headerStyles={"text-center"}
          customStyles={"mt-20 w-[70%] mx-auto"}
          headerDecor={"Student"}
          title={`${participation.results[index].student.first_name} ${participation.results[index].student.last_name}`}
          footer={
            <div>
              {/* {console.log(participation)} */}
              <div className="space-x-3 p-4 text-center">
                <Button
                  variant="secondary"
                  customStyles={"w-20"}
                  disabled={index === 0}
                  onClick={handlePrevIndex}
                >
                  <i className="bi bi-caret-left-fill"></i>
                </Button>
                <Button
                  variant="secondary"
                  customStyles={"w-20"}
                  disabled={index === participation.results.length - 1}
                  onClick={handleNextIndex}
                >
                  <i className="bi bi-caret-right-fill"></i>
                </Button>
              </div>
            </div>
          }
        >
          <p className="text-stone-400 text-lg text-center">
            This student has no engagement with this discussion
          </p>
          <img
            className="md:w-100 md:h-100 mx-auto p-2 rounded-full bg-blue-200 my-5"
            src="https://static.vecteezy.com/system/resources/previews/055/476/494/non_2x/emoticon-crying-cartoon-character-with-sad-face-and-sad-expression-illustration-free-vector.jpg"
            alt="Sad emoji tearing up"
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center text-center min-h-screen p-3">
      <div className="absolute top-5 left-5">
        <BackButton />
      </div>
      <div className="w-60 md:w-full mt-3">
        <PageHeading>Grade Discussion</PageHeading>
      </div>
      <Card
        headerStyles={"text-center"}
        customStyles={"hidden md:block mt-10 lg:160 mx-auto"}
        headerDecor={"Student"}
        title={`${participation.results[index].student.first_name} ${participation.results[index].student.last_name}`}
        footer={
          <div>
            {participation.max_score && (
              <div className="flex space-x-2 items-end justify-center">
                <div className="w-20">
                  <Input
                    label={"Score"}
                    type="number"
                    onChange={(e) =>
                      updateCurrentGrade("score", e.target.value)
                    }
                    value={
                      participation.results[index].grade
                        ? participation.results[index].grade.score
                        : 0
                    }
                  />
                </div>
                <p className="text-xl font-bold text-stone-300">
                  / {participation.max_score}
                </p>
              </div>
            )}
            <div className="space-x-3 p-4 text-center">
              <Button
                variant="secondary"
                customStyles={"w-20"}
                disabled={index === 0}
                onClick={handlePrevIndex}
              >
                <i className="bi bi-caret-left-fill"></i>
              </Button>
              <Button customStyles={"w-60"} onClick={handleGradeDiscussion}>
                Grade
              </Button>
              <Button
                variant="secondary"
                customStyles={"w-20"}
                disabled={index === participation.results.length - 1}
                onClick={handleNextIndex}
              >
                <i className="bi bi-caret-right-fill"></i>
              </Button>
            </div>
          </div>
        }
      >
        <InnerCard
          title={"Discussion Question"}
          titleColor="text-yellow-500"
          customStyles={"mx-auto my-5 w-[80%]"}
        >
          <p className="text-center text-lg">{participation.prompt}</p>
        </InnerCard>

        <InnerCard
          title={"Main Post"}
          titleColor="text-green-400"
          customStyles={"mx-auto my-5 w-[80%]"}
        >
          <p className="text-center text-lg">
            {participation.results[index].main_post.content}
          </p>
          {participation.results[index].main_post.is_late && (
            <Label color="red" customStyling={"absolute top-2 right-2"}>
              Late
            </Label>
          )}
        </InnerCard>
        <InnerCard title={"Comments"} customStyles={"mx-auto w-[80%]"}>
          {participation.results[index].comments.length === 0 && (
            <p className="text-stone-400 text-center">No comments yet</p>
          )}
          {participation.results[index].comments.map((comment) => {
            return (
              <div key={comment.id}>
                <div className="flex justify-between">
                  <p className="text-blue-400 font-semibold">
                    {comment.content}
                  </p>
                  {comment.is_late && <Label color="red">Late</Label>}
                </div>
                <div className="ml-5 rounded-sm px-2 py-1 border-l-2 shadow-xl">
                  <p className="text-xs text-yellow-600 font-bold">
                    {comment.parent.author.first_name}{" "}
                    {comment.parent.author.last_name}
                  </p>
                  <p className="text-sm font-medium">
                    {comment.parent.content}
                  </p>
                </div>
              </div>
            );
          })}
        </InnerCard>
      </Card>
      <div className="md:hidden">
        <div className="mt-5 rounded-sm border-t border-stone-200">
          <p className="font-medium text-yellow-600 text-xs">Student</p>
          <p className="text-xl text-stone-200 font-bold">
            {participation.results[index].student.first_name}{" "}
            {participation.results[index].student.last_name}
          </p>
        </div>

        <InnerCard
          title={"Discussion Question"}
          titleColor="text-yellow-500"
          customStyles={"mx-auto my-5 w-[80%]"}
        >
          <p className="text-center text-lg">{participation.prompt}</p>
        </InnerCard>
        <InnerCard
          title={"Main Post"}
          titleColor="text-green-400"
          customStyles={"mx-auto my-5 w-[80%]"}
        >
          <p className="text-center text-lg">
            {participation.results[index].main_post.content}
          </p>
          {participation.results[index].main_post.is_late && (
            <Label color="red" customStyling={"absolute top-2 right-2"}>
              Late
            </Label>
          )}
        </InnerCard>
        <InnerCard title={"Comments"} customStyles={"mx-auto w-[80%]"}>
          {participation.results[index].comments.length === 0 && (
            <p className="text-stone-400 text-center">No comments yet</p>
          )}
          {participation.results[index].comments.map((comment) => {
            return (
              <div key={comment.id}>
                <div className="flex justify-between">
                  <p className="text-blue-400 font-semibold">
                    {comment.content}
                  </p>
                  {comment.is_late && <Label color="red">Late</Label>}
                </div>
                <div className="ml-5 rounded-sm px-2 py-1 border-l-2 shadow-xl bg-gray-900">
                  <p className="text-xs text-yellow-600 font-bold">
                    {comment.parent.author.first_name}{" "}
                    {comment.parent.author.last_name}
                  </p>
                  <p className="text-sm font-medium">
                    {comment.parent.content}
                  </p>
                </div>
              </div>
            );
          })}
        </InnerCard>
        <div className="mt-5">
          {participation.max_score && (
            <div className="flex space-x-2 items-end justify-center">
              <div className="w-20">
                <Input
                  label={"Score"}
                  type="number"
                  onChange={(e) => updateCurrentGrade("score", e.target.value)}
                  value={
                    participation.results[index].grade
                      ? participation.results[index].grade.score
                      : 0
                  }
                />
              </div>
              <p className="text-xl font-bold text-stone-300">
                / {participation.max_score}
              </p>
            </div>
          )}
          <div className="space-x-3 p-4 text-center">
            <Button
              variant="secondary"
              customStyles={"w-20"}
              disabled={index === 0}
              onClick={handlePrevIndex}
            >
              <i className="bi bi-caret-left-fill"></i>
            </Button>
            <Button
              customStyles={"w-20 sm:w-40"}
              onClick={handleGradeDiscussion}
            >
              Grade
            </Button>
            <Button
              variant="secondary"
              customStyles={"w-20"}
              disabled={index === participation.results.length - 1}
              onClick={handleNextIndex}
            >
              <i className="bi bi-caret-right-fill"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
