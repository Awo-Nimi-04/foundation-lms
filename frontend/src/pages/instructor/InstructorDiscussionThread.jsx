import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoading } from "../../context/LoadingContext";
import api from "../../api/api";
import PageHeading from "../../components/ui/PageHeading";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedCounter from "../../components/ui/AnimatedCounter";
import BackButton from "../../components/ui/BackButton";

export default function InstructorDiscussionThread() {
  const { courseId, threadId } = useParams();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    showLoading("Fetching thread messages");
    try {
      const res = await api.get(`/discussions/threads/${threadId}`);
      setThread(res.data.thread);
      setPosts(res.data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  if (!thread) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 h-600">
      {/* {console.log(posts)} */}
      <BackButton />
      <div className="border-b border-blue-300 pb-4">
        <div className="flex flex-col md:flex-row space-y-2 justify-between items-center">
          <PageHeading>{thread.title}</PageHeading>
          {thread.max_score && (
            <button
              onClick={() =>
                navigate(
                  `/instructor/course/${courseId}/threads/${threadId}/grade`,
                )
              }
              className="w-60 bg-blue-500 text-stone-200 p-2 rounded-md text-lg font-medium cursor-pointer hover:bg-blue-600 hover:text-stone-300"
            >
              Grade
            </button>
          )}
        </div>
        <p className="text-center md:text-left mt-2 text-gray-400">
          {thread.prompt}
        </p>
      </div>
      <div className="p-2">
        {posts.length <= 0 && <p className="text-stone-400 text-center text-lg italic">No posts yet</p>}
        {posts.length > 0 &&
          posts.map((post) => {
            return (
              <DiscussionPost
                key={post.id}
                id={`post-${post.id}`}
                post={post}
              />
            );
          })}
      </div>
    </div>
  );
}

function DiscussionPost({ id, post }) {
  const [hideReplies, setHideReplies] = useState(true);
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likes, setLikes] = useState(post.like_count);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;

    setLiking(true);

    const prevLiked = liked;
    const prevLikes = likes;

    setLiked(!prevLiked);
    setLikes(prevLiked ? prevLikes - 1 : prevLikes + 1);

    try {
      await api.post(`/discussions/posts/${post.id}/like`);
    } catch (err) {
      console.error(err);

      setLiked(prevLiked);
      setLikes(prevLikes);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div id={id} className="border-b border-stone-300 p-2">
      <div className="flex items-center space-x-3">
        <img
          className="object-cover rounded-full w-10 h-10 border border-stone-200"
          src={
            post.creator_profile_url ||
            "https://upload.wikimedia.org/wikipedia/commons/b/b5/Windows_10_Default_Profile_Picture.svg"
          }
        />
        <div className="w-full">
          <div className="w-full flex items-center justify-between">
            <p className="text-stone-200 text-lg font-semibold">
              {post.creator_fname} {post.creator_lname}
            </p>

            <div className="flex space-x-1">
              <div className="text-pink-300 flex items-center space-x-1">
                <i className="bi bi-hand-thumbs-up-fill"></i>
                <AnimatedCounter value={likes} />
              </div>

              <div className="text-indigo-300 flex items-center space-x-1">
                <i className="bi bi-chat-dots-fill"></i>
                <AnimatedCounter value={post.replies.length} />
              </div>
            </div>
          </div>

          <p className="text-blue-500 text-sm font-medium">
            {dayjs(post.created_at).format("D MMM h:mm A")}{" "}
            {post.updated_at &&
              `| Last edited ${dayjs(post.updated_at).format("D MMM h:mm A")}`}
          </p>
        </div>
      </div>

      <p className="text-stone-400 ml-13 text-md">{post.content}</p>

      <div className="flex text-stone-200 mt-3 space-x-1">
        {/* LIKE */}
        <button
          onClick={handleLike}
          disabled={liking}
          className="text-center w-full p-1 rounded-sm bg-pink-500 hover:bg-pink-500/75 cursor-pointer"
        >
          <div className="flex justify-center space-x-3">
            <i
              className={
                liked ? "bi bi-hand-thumbs-up-fill" : "bi bi-hand-thumbs-up"
              }
            ></i>
            <p>{liked ? "Liked" : "Like"}</p>
          </div>
        </button>
      </div>
      {post.replies.length > 0 && (
        <>
          <button
            onClick={() => setHideReplies((prev) => !prev)}
            className="flex text-blue-300 ml-auto space-x-1 cursor-pointer items-center"
          >
            <p className="text-right text-sm">
              {hideReplies ? "View Replies" : "Hide Replies"}
            </p>
            {hideReplies ? (
              <i className="bi bi-caret-down-fill"></i>
            ) : (
              <i className="bi bi-caret-up-fill"></i>
            )}
          </button>
          {!hideReplies && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {post.replies.map((reply) => (
                  <Comment comment={reply} key={reply.id} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  );
}

function Comment({ comment }) {
  const [liked, setLiked] = useState(comment.liked_by_user);
  const [likes, setLikes] = useState(comment.like_count);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;

    setLiking(true);

    const prevLiked = liked;
    const prevLikes = likes;

    setLiked(!prevLiked);
    setLikes(prevLiked ? prevLikes - 1 : prevLikes + 1);

    try {
      await api.post(`/discussions/posts/${comment.id}/like`);
    } catch (err) {
      console.error(err);

      setLiked(prevLiked);
      setLikes(prevLikes);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="ml-10 my-3">
      <div className="flex items-center space-x-3">
        <img
          className="object-cover rounded-full w-8 h-8 border border-stone-200"
          src={
            comment.creator_profile_url ||
            "https://upload.wikimedia.org/wikipedia/commons/b/b5/Windows_10_Default_Profile_Picture.svg"
          }
        />
        <div className="w-full pr-3">
          <div className="w-full flex items-center justify-between">
            <p className="text-stone-200 text-md font-medium">
              {comment.creator_fname} {comment.creator_lname}
            </p>
            <div className="text-pink-300 flex items-center space-x-1">
              <i className="bi bi-hand-thumbs-up-fill"></i>
              <AnimatedCounter value={likes} />
            </div>
          </div>

          <p className="text-blue-500 text-xs font-medium">
            {dayjs(comment.created_at).format("D MMM h:mm A")}
          </p>
        </div>
      </div>

      <p className="ml-11 text-stone-400 text-sm mb-2">{comment.content}</p>

      {/* ACTIONS */}
      <div className="space-x-1 flex">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`text-center w-[100%] text-stone-200 p-1 rounded-sm bg-pink-500 hover:bg-pink-500/75 cursor-pointer`}
        >
          <div className="flex justify-center space-x-3">
            <i
              className={
                liked ? "bi bi-hand-thumbs-up-fill" : "bi bi-hand-thumbs-up"
              }
            ></i>
            <p>{liked ? "Liked" : "Like"}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
