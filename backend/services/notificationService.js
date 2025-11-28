import models from "../database/models/index.js";

const { Notification, PhotoContest, User, Contest, ForumThread } = models;

class NotificationService {
  /**
   * Create a notification for contest ending
   */
  static async notifyContestEnded(contestId) {
    try {
      console.log(
        `[NotificationService] Starting notification process for contest ${contestId}`
      );

      const contest = await Contest.findByPk(contestId);
      if (!contest) {
        console.error(`[NotificationService] Contest ${contestId} not found`);
        return;
      }

      console.log(`[NotificationService] Found contest: ${contest.title}`);

      // Get all users who submitted photos to this contest
      const photoContestEntries = await PhotoContest.findAll({
        where: { contestId },
        attributes: ["photoId"],
      });

      console.log(
        `[NotificationService] Found ${photoContestEntries.length} photo submissions`
      );

      if (photoContestEntries.length === 0) {
        console.log(
          `[NotificationService] No submissions for contest ${contestId}, skipping notifications`
        );
        return;
      }

      // Get all unique user IDs from the photos
      const Photo = models.Photo;
      const photoIds = photoContestEntries.map((entry) => entry.photoId);

      const photos = await Photo.findAll({
        where: { id: photoIds },
        attributes: ["userId", "id"],
      });

      console.log(
        `[NotificationService] Found ${photos.length} photos from ${photoIds.length} entries`
      );

      const uniqueUserIds = [...new Set(photos.map((photo) => photo.userId))];

      console.log(
        `[NotificationService] Notifying ${uniqueUserIds.length} unique users:`,
        uniqueUserIds
      );

      // Create notifications for all participants
      // Using individualHooks: true so afterCreate hook fires for each notification
      const notifications = uniqueUserIds.map((userId) => ({
        userId,
        type: "contest_ended",
        title: "Contest Ended!",
        message: `The contest "${contest.title}" has ended. Check out the results!`,
        link: `/events/${contestId}`,
        contestId,
      }));

      await Notification.bulkCreate(notifications, { individualHooks: true });

      console.log(
        `[NotificationService] ✓ Created ${notifications.length} notifications for contest ${contestId} ending`
      );

      return { success: true, count: notifications.length };
    } catch (error) {
      console.error(
        "[NotificationService] Error creating contest ended notifications:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a notification for contest voting starting
   */
  static async notifyContestVotingStarted(contestId) {
    try {
      console.log(
        `[NotificationService] Starting voting notification process for contest ${contestId}`
      );

      const contest = await Contest.findByPk(contestId);
      if (!contest) {
        console.error(`[NotificationService] Contest ${contestId} not found`);
        return;
      }

      console.log(`[NotificationService] Found contest: ${contest.title}`);

      // Get all users who submitted photos to this contest
      const photoContestEntries = await PhotoContest.findAll({
        where: { contestId },
        attributes: ["photoId"],
      });

      console.log(
        `[NotificationService] Found ${photoContestEntries.length} photo submissions`
      );

      if (photoContestEntries.length === 0) {
        console.log(
          `[NotificationService] No submissions for contest ${contestId}, skipping voting notifications`
        );
        return;
      }

      // Get all unique user IDs from the photos
      const Photo = models.Photo;
      const photoIds = photoContestEntries.map((entry) => entry.photoId);

      const photos = await Photo.findAll({
        where: { id: photoIds },
        attributes: ["userId", "id"],
      });

      console.log(
        `[NotificationService] Found ${photos.length} photos from ${photoIds.length} entries`
      );

      const uniqueUserIds = [...new Set(photos.map((photo) => photo.userId))];

      console.log(
        `[NotificationService] Notifying ${uniqueUserIds.length} unique users:`,
        uniqueUserIds
      );

      // Create notifications for all participants
      // Using individualHooks: true so afterCreate hook fires for each notification
      const notifications = uniqueUserIds.map((userId) => ({
        userId,
        type: "contest_ended", // Using same type for now
        title: "Voting Has Started!",
        message: `Voting has started for "${contest.title}"! Cast your votes now.`,
        link: `/events/${contestId}`,
        contestId,
      }));

      await Notification.bulkCreate(notifications, { individualHooks: true });

      console.log(
        `[NotificationService] ✓ Created ${notifications.length} voting notifications for contest ${contestId}`
      );

      return { success: true, count: notifications.length };
    } catch (error) {
      console.error(
        "[NotificationService] Error creating voting started notifications:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a notification for a forum reply
   */
  static async notifyForumReply(threadId, postAuthorId) {
    try {
      const thread = await ForumThread.findByPk(threadId, {
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "nickname"],
          },
        ],
      });

      if (!thread) {
        console.error(`Thread ${threadId} not found`);
        return;
      }

      // Don't notify if the thread author is replying to their own thread
      if (thread.userId === postAuthorId) {
        return;
      }

      // Get the post author's nickname for the notification
      const postAuthor = await User.findByPk(postAuthorId);
      if (!postAuthor) {
        console.error(`Post author ${postAuthorId} not found`);
        return;
      }

      // Create notification - push notification is sent automatically via hook
      await Notification.create({
        userId: thread.userId,
        type: "forum_reply",
        title: "New Reply to Your Thread",
        message: `${postAuthor.nickname} replied to your thread "${thread.title}"`,
        link: `/forum/threads/${threadId}`,
        threadId,
      });

      console.log(
        `Created notification for user ${thread.userId} about reply in thread ${threadId}`
      );
    } catch (error) {
      console.error("Error creating forum reply notification:", error);
    }
  }

  /**
   * Create a notification for contest winner
   */
  static async notifyContestWinner(userId, contestId, placement) {
    try {
      const contest = await Contest.findByPk(contestId);
      if (!contest) {
        console.error(`Contest ${contestId} not found`);
        return;
      }

      let placementText = "";
      if (placement === 1) {
        placementText = "1st place";
      } else if (placement === 2) {
        placementText = "2nd place";
      } else if (placement === 3) {
        placementText = "3rd place";
      } else {
        placementText = `${placement}th place`;
      }

      // Create notification - push notification is sent automatically via hook
      await Notification.create({
        userId,
        type: "contest_winner",
        title: `🏆 ${placementText} in Contest!`,
        message: `Congratulations! You placed ${placementText} in "${contest.title}"`,
        link: `/events/${contestId}`,
        contestId,
      });

      console.log(
        `Created winner notification for user ${userId} (${placementText}) in contest ${contestId}`
      );
    } catch (error) {
      console.error("Error creating contest winner notification:", error);
    }
  }

  /**
   * Create a general notification for a user
   */
  static async notifyUser(userId, title, message, link = null) {
    try {
      // Create notification - push notification is sent automatically via hook
      await Notification.create({
        userId,
        type: "general",
        title,
        message,
        link,
      });

      console.log(`Created general notification for user ${userId}: ${title}`);
    } catch (error) {
      console.error("Error creating general notification:", error);
    }
  }

  /**
   * Create a notification for a new comment on a photo
   */
  static async notifyPhotoComment(photoId, photoOwnerId, commentAuthorId) {
    try {
      // Don't notify if the photo owner is commenting on their own photo
      if (photoOwnerId === commentAuthorId) {
        return;
      }

      // Get the comment author's nickname
      const commentAuthor = await User.findByPk(commentAuthorId);
      if (!commentAuthor) {
        console.error(`Comment author ${commentAuthorId} not found`);
        return;
      }

      // Get the photo for additional context
      const Photo = models.Photo;
      const photo = await Photo.findByPk(photoId);
      if (!photo) {
        console.error(`Photo ${photoId} not found`);
        return;
      }

      const notificationMessage = `${
        commentAuthor.nickname
      } commented on your photo${photo.title ? ` "${photo.title}"` : ""}`;
      const notificationLink = `/users/${photoOwnerId}?photoId=${photoId}`;

      // Create notification - push notification is sent automatically via hook
      await Notification.create({
        userId: photoOwnerId,
        type: "photo_comment",
        title: "New Comment on Your Photo",
        message: notificationMessage,
        link: notificationLink,
        photoId,
      });

      console.log(
        `Created notification for user ${photoOwnerId} about comment on photo ${photoId}`
      );
    } catch (error) {
      console.error("Error creating photo comment notification:", error);
    }
  }

  /**
   * Create a notification for a reply to a comment
   */
  static async notifyCommentReply(
    parentCommentId,
    parentCommentAuthorId,
    replyAuthorId
  ) {
    try {
      // Don't notify if replying to their own comment
      if (parentCommentAuthorId === replyAuthorId) {
        return;
      }

      // Get the reply author's nickname
      const replyAuthor = await User.findByPk(replyAuthorId);
      if (!replyAuthor) {
        console.error(`Reply author ${replyAuthorId} not found`);
        return;
      }

      // Get the parent comment for context
      const Comment = models.Comment;
      const parentComment = await Comment.findByPk(parentCommentId, {
        include: [
          {
            model: models.Photo,
            as: "Photo",
            attributes: ["id", "title", "userId"],
          },
        ],
      });

      if (!parentComment) {
        console.error(`Parent comment ${parentCommentId} not found`);
        return;
      }

      const notificationLink = `/users/${parentComment.Photo.userId}?photoId=${parentComment.photoId}`;

      // Create notification - push notification is sent automatically via hook
      await Notification.create({
        userId: parentCommentAuthorId,
        type: "comment_reply",
        title: "New Reply to Your Comment",
        message: `${replyAuthor.nickname} replied to your comment`,
        link: notificationLink,
        photoId: parentComment.photoId,
        commentId: parentCommentId,
      });

      console.log(
        `Created notification for user ${parentCommentAuthorId} about reply to comment ${parentCommentId}`
      );
    } catch (error) {
      console.error("Error creating comment reply notification:", error);
    }
  }
}

export default NotificationService;
