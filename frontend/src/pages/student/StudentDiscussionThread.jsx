import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import api from "../../api/api";
import PageHeading from "../../components/ui/PageHeading";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedCounter from "../../components/ui/AnimatedCounter";
import BackButton from "../../components/ui/BackButton";

export default function StudentDiscussionThread() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showPostInput, setShowPostInput] = useState(false);
  const [parentPost, setParentPost] = useState(null);
  const [reply, setReply] = useState("");

  const myPost = posts.find((post) => post.user_id === user.id);

  const scrollToMyPost = () => {
    if (!myPost) return;

    document.getElementById(`post-${myPost.id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    showLoading("Fetching thread messages");
    try {
      const res = await api.get(`/discussions/threads/${threadId}`);
      setThread(res.data.thread);
      setPosts(res.data.posts);

      const answered = res.data.posts.some((p) => p.user_id === user.id);
      setHasAnswered(answered);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleSendPost = async () => {
    showLoading("Replying . . .");
    try {
      const res = await api.post(`/discussions/threads/${threadId}/posts`, {
        content: reply,
        parent_post_id: parentPost,
      });
      setReply("");
      setShowPostInput(false);
      fetchThread();
    } catch (err) {
      console.error(err);
      fetchThread();
    } finally {
      hideLoading();
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
  };

  const handleReplyAdded = (postId, newReply) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              replies: [...post.replies, newReply],
            }
          : post,
      ),
    );
  };

  const handleReplyUpdated = (parentPostId, updatedReply) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === parentPostId
          ? {
              ...post,
              replies: post.replies.map((reply) =>
                reply.id === updatedReply.id ? updatedReply : reply,
              ),
            }
          : post,
      ),
    );
  };

  const handleReplyDeleted = (parentPostId, replyId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === parentPostId
          ? {
              ...post,
              replies: post.replies.filter((reply) => reply.id !== replyId),
            }
          : post,
      ),
    );
  };

  if (!thread) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 relative">
      <div className="absolute top-0 left-5 z-50">
        <BackButton />
      </div>

      <div className="sticky top-0 z-40 bg-stone-950 border-b border-blue-300 pb-4">
        <div className="mx-auto p-6">
          <PageHeading>{thread.title}</PageHeading>
          <p className="mt-2 text-gray-400">{thread.prompt}</p>

          <div className="mt-5 text-center">
            {!showPostInput && (
              <>
                {!hasAnswered && (
                  <button
                    className="bg-blue-500 hover:bg-blue-600 hover:text-stone-300 text-stone-200 p-2 rounded-md w-40 cursor-pointer"
                    onClick={() => {
                      setShowPostInput(true);
                      setParentPost(null);
                    }}
                  >
                    Reply <i className="bi bi-reply-fill"></i>
                  </button>
                )}

                {hasAnswered && (
                  <button
                    className="bg-blue-500 text-stone-200 p-2 rounded-md w-40 cursor-pointer"
                    onClick={scrollToMyPost}
                  >
                    View Your Reply
                  </button>
                )}
              </>
            )}

            {showPostInput && (
              <div className="flex justify-center space-x-2">
                <Button
                  customStyles={"w-40"}
                  variant="secondary"
                  onClick={handleSendPost}
                >
                  <div className="flex space-x-2 items-center justify-center">
                    <p>Send</p>
                    <i className="bi bi-send-fill"></i>
                  </div>
                </Button>
                <Button
                  customStyles={"w-40"}
                  variant="tertiary"
                  onClick={() => setShowPostInput(false)}
                >
                  <div className="flex space-x-2 items-center justify-center">
                    <p>Cancel</p>
                    <i className="bi bi-x-lg"></i>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {hasAnswered && (
        <div className="p-2">
          {posts.length > 0 &&
            posts.map((post) => {
              return (
                <DiscussionPost
                  key={post.id}
                  id={`post-${post.id}`}
                  post={post}
                  onPostUpdated={handlePostUpdated}
                  onReplyAdded={(newReply) =>
                    handleReplyAdded(post.id, newReply)
                  }
                  onReplyDeleted={handleReplyDeleted}
                  onReplyUpdated={handleReplyUpdated}
                  threadId={threadId}
                />
              );
            })}
        </div>
      )}
      {!hasAnswered && (
        <p className="text-lg text-stone-300 font-semibold text-center">
          You must first reply to the question in order to see other responses
        </p>
      )}
      {showPostInput && (
        <Textarea
          placeholder={"Reply here"}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
      )}
    </div>
  );
}

function DiscussionPost({
  id,
  post,
  onPostUpdated,
  onReplyAdded,
  onReplyUpdated,
  onReplyDeleted,
  threadId,
}) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [hideReplies, setHideReplies] = useState(true);
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likes, setLikes] = useState(post.like_count);
  const [liking, setLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

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

  const handleEditPost = async () => {
    if (!editedContent.trim()) return;
    try {
      const res = await api.patch(`/discussions/posts/${post.id}`, {
        content: editedContent,
      });

      onPostUpdated(res.data);

      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;

    try {
      const res = await api.post(`/discussions/threads/${threadId}/posts`, {
        content: comment,
        parent_post_id: post.id,
      });

      onReplyAdded(res.data);

      setComment("");
      setShowReplyInput(false);
      setHideReplies(false);
    } catch (err) {
      console.error(err);
      fetchThread();
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
              {post.liked_by_instructor && (
                <div className="flex space-x-1 items-end text-red-500 text-sm">
                  <i className="bi bi-heart-fill"></i>
                  <p className="text-rose-400">Liked by instructor</p>
                </div>
              )}
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
      {!isEditing && (
        <p className="text-stone-400 ml-13 text-md">{post.content}</p>
      )}
      {isEditing && (
        <textarea
          className="border border-stone-200 w-full rounded-md p-2 bg-stone-800 mt-5 mb-2 text-stone-200 placeholder-stone-400 focus:border-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
        />
      )}
      {!showReplyInput && (
        // ACTIONS
        <div className="flex text-stone-200 mt-3 space-x-1">
          {!isEditing && (
            <>
              {/* LIKE */}
              <button
                onClick={handleLike}
                disabled={liking}
                className={`text-center ${user.id === post.user_id ? "w-[33%]" : "w-[50%]"} p-1 rounded-sm bg-pink-500 hover:bg-pink-500/75 cursor-pointer`}
              >
                <div className="flex justify-center md:space-x-3">
                  <i
                    className={
                      liked
                        ? "bi bi-hand-thumbs-up-fill"
                        : "bi bi-hand-thumbs-up"
                    }
                  ></i>
                  <p className="hidden md:block">{liked ? "Liked" : "Like"}</p>
                </div>
              </button>

              {/* REPLY */}
              <button
                onClick={() => {
                  setShowReplyInput(true);
                }}
                className={`text-center ${user.id === post.user_id ? "w-[33%]" : "w-[50%]"} p-1 rounded-sm bg-indigo-500 hover:bg-indigo-600 cursor-pointer`}
              >
                <div className="flex justify-center md:space-x-3">
                  <i className="bi bi-chat-dots"></i>{" "}
                  <p className="hidden md:block">Reply</p>
                </div>
              </button>

              {/* EDIT */}
              {user.id === post.user_id && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-[33%] text-center text-stone-200 p-1 rounded-sm bg-blue-400 hover:bg-blue-500 cursor-pointer"
                >
                  <div className="flex justify-center md:space-x-3">
                    <i className="bi bi-pencil-fill"></i>
                    <p className="hidden md:block">Edit</p>
                  </div>
                </button>
              )}
            </>
          )}

          {isEditing && (
            <>
              {/* CANCEL */}
              <button
                onClick={() => setIsEditing(false)}
                className="w-[50%] text-center text-stone-800 p-1 rounded-sm bg-yellow-500 hover:bg-yellow-700 cursor-pointer"
              >
                <div className="flex justify-center space-x-3">
                  <i className="bi bi-x-lg"></i>
                  <p>Cancel</p>
                </div>
              </button>
              {/* SAVE */}
              <button
                onClick={handleEditPost}
                className="w-[50%] text-center text-stone-200 p-1 rounded-sm bg-green-600 hover:bg-green-800 cursor-pointer"
              >
                <div className="flex justify-center space-x-3">
                  <i className="bi bi-check-circle-fill"></i>
                  <p>Save</p>
                </div>
              </button>
            </>
          )}
        </div>
      )}
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
                  <Comment
                    comment={reply}
                    key={reply.id}
                    parentPostId={post.id}
                    onDeleteComment={onReplyDeleted}
                    onUpdateComment={onReplyUpdated}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
      {showReplyInput && (
        <div className="ml-10">
          <textarea
            className="border border-stone-200 w-full rounded-md p-2 bg-stone-800 mt-5 mb-2 text-stone-200 placeholder-stone-400 focus:border-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="w-full flex space-x-1">
            <button
              onClick={() => {
                setShowReplyInput(false);
                setComment("");
              }}
              className="w-[50%] hover:bg-yellow-500 hover:text-stone-800  text-yellow-500 border border-yellow-500 text-sm font-medium p-1 rounded-sm cursor-pointer"
            >
              <i className="bi bi-x-lg"></i> Cancel
            </button>
            <button
              onClick={handleComment}
              className="w-[50%] hover:bg-green-600 hover:text-stone-300 text-green-500 border border-green-500 text-sm font-medium p-1 rounded-sm cursor-pointer"
            >
              <i className="bi bi-send-fill"></i> Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Comment({ comment, parentPostId, onDeleteComment, onUpdateComment }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(comment.liked_by_user);
  const [likes, setLikes] = useState(comment.like_count);
  const [liking, setLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

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

  const handleEditComment = async () => {
    if (!editedContent.trim()) return;

    try {
      const res = await api.patch(`/discussions/posts/${comment.id}`, {
        content: editedContent,
      });

      onUpdateComment(parentPostId, res.data);

      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async () => {
    try {
      const res = await api.delete(`/discussions/posts/${comment.id}`);
      onDeleteComment(parentPostId, comment.id);
    } catch (err) {
      console.error(err);
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

          <p className="text-blue-500 text-sm font-medium">
            {dayjs(comment.created_at).format("D MMM h:mm A")}{" "}
            {comment.updated_at &&
              `| Last edited ${dayjs(comment.updated_at).format("D MMM h:mm A")}`}
          </p>
        </div>
      </div>
      {!isEditing && (
        <p className="ml-11 text-stone-400 text-sm mb-2">{comment.content}</p>
      )}
      {isEditing && (
        <textarea
          className="border border-stone-200 w-full rounded-md p-2 bg-stone-800 mt-5 mb-2 text-stone-200 placeholder-stone-400 focus:border-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
        />
      )}
      {/* ACTIONS */}
      <div className="space-x-1 flex">
        {!isEditing && (
          <button
            onClick={handleLike}
            disabled={liking}
            className={`text-center ${comment.user_id !== user.id ? "w-[100%]" : isEditing ? "w-[25%]" : "w-[33%]"} text-stone-200 p-1 rounded-sm bg-pink-500 hover:bg-pink-500/75 cursor-pointer`}
          >
            <div className="flex justify-center space-x-1 md:space-x-3">
              <i
                className={
                  liked ? "bi bi-hand-thumbs-up-fill" : "bi bi-hand-thumbs-up"
                }
              ></i>
              <p className="hidden md:block">{liked ? "Liked" : "Like"}</p>
            </div>
          </button>
        )}
        {comment.user_id == user.id && (
          <>
            {!isEditing && (
              <button
                onClick={handleDeleteComment}
                className={`${!isEditing ? "w-[33%]" : "w-[25%]"} text-center text-stone-200 p-1 rounded-sm bg-red-800 hover:bg-red-900 cursor-pointer`}
              >
                <div className="flex justify-center space-x-1 md:space-x-3">
                  <i class="bi bi-trash-fill"></i>
                  <p className="hidden md:block">Delete</p>
                </div>
              </button>
            )}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-[33%] text-center text-stone-200 p-1 rounded-sm bg-blue-400 hove:bg-blue-700 cursor-pointer"
              >
                <div className="flex justify-center space-x-1 md:space-x-3">
                  <i class="bi bi-pencil-fill"></i>
                  <p className="hidden md:block">Edit</p>
                </div>
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className={`${!isEditing ? "w-[33%]" : "w-[50%]"} text-center text-stone-800 p-1 rounded-sm bg-yellow-500 hover:bg-yellow-700 cursor-pointer`}
                >
                  <div className="flex justify-center space-x-3">
                    <i class="bi bi-x-lg"></i>
                    <p>Cancel</p>
                  </div>
                </button>
                <button
                  onClick={handleEditComment}
                  className={`${!isEditing ? "w-[33%]" : "w-[50%]"} text-center text-stone-200 p-1 rounded-sm bg-green-600 hover:bg-green-800 cursor-pointer`}
                >
                  <div className="flex justify-center space-x-3">
                    <i class="bi bi-check-circle-fill"></i>
                    <p>Save</p>
                  </div>
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
