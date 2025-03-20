import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useForumService } from "../hooks";
import { ThreadDetail } from "../components/forum/ThreadDetail";

function ThreadPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const forumService = useForumService();

  const fetchThreadData = useCallback(async () => {
    try {
      setLoading(true);
      const threadData = await forumService.fetchThreadDetails(threadId);
      setThread(threadData.thread);
      setPosts(threadData.posts);
      setTotalPosts(threadData.totalPosts);
    } catch (error) {
      console.error("Error fetching thread:", error);
    } finally {
      setLoading(false);
    }
  }, [threadId, forumService]);

  // Only load data when component mounts or threadId changes
  useEffect(() => {
    fetchThreadData();
  }, [fetchThreadData]);

  const handleReply = async (threadId, content) => {
    try {
      return await forumService.createPost(threadId, content);
    } catch (error) {
      console.error("Error creating reply:", error);
      throw error;
    }
  };

  const handleThreadUpdate = () => {
    // This is now optional since the component updates itself
    fetchThreadData();
  };

  const handleThreadDelete = () => {
    navigate("/forum");
  };

  if (loading && !thread) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-gray-400">Loading thread...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Link
        to="/forum"
        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="mr-1"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
          />
        </svg>
        Back to Forum
      </Link>

      <ThreadDetail
        thread={thread}
        posts={posts}
        onReply={handleReply}
        totalPosts={totalPosts}
        onThreadUpdate={handleThreadUpdate}
        onThreadDelete={handleThreadDelete}
      />
    </div>
  );
}

export default ThreadPage;
