import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import styles from "../../styles/components/Forum.module.css";
import { PostList } from "./PostList";
import { ReplyForm } from "./ReplyForm";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

export function ThreadDetail({ thread, posts, onReply, totalPosts }) {
  const { user } = useUser();

  if (!thread) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Thread not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.threadDetail}>
        <div className={styles.threadDetailHeader}>
          <h1 className={styles.threadDetailTitle}>{thread.title}</h1>
          <div className={styles.threadDetailMeta}>
            <div className={styles.threadAuthor}>
              <img
                src={
                  thread.author?.avatarUrl || "https://via.placeholder.com/30"
                }
                alt={thread.author?.nickname || "User"}
                className={styles.authorAvatar}
              />
              <Link
                to={`/users/${thread.author?.id}`}
                className={`${styles.authorName} hover:text-indigo-600 hover:underline`}
              >
                {thread.author?.nickname || "Anonymous"}
              </Link>
            </div>
            <div>
              <span className={styles.threadCategory}>{thread.category}</span>
              <span className="ml-4 text-gray-400">
                Posted: {formatDate(thread.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.threadContent}>{thread.content}</div>
      </div>

      {posts && posts.length > 0 && (
        <>
          <h2 className={styles.postCount}>
            {totalPosts} {totalPosts === 1 ? "Reply" : "Replies"}
          </h2>
          <PostList
            posts={posts}
            currentUserId={user?.id}
            threadAuthorId={thread.author?.id}
          />
        </>
      )}

      {!thread.isLocked && (
        <ReplyForm onSubmit={(content) => onReply(thread.id, content)} />
      )}

      {thread.isLocked && (
        <div className="text-center py-4 text-gray-400">
          This thread is locked. No new replies can be posted.
        </div>
      )}
    </div>
  );
}
