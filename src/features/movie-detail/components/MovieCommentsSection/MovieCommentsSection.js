import React, { useState } from 'react';
import styles from './MovieCommentsSection.module.css';

/**
 * @file MovieCommentsSection.js
 * @description In-page community discussion and user comments section for the movie.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.comments=[]] - List of comment objects.
 * @param {boolean} [props.loading=false] - Comments loading state.
 * @param {Function} props.onAddComment - Callback to submit a comment (content) => Promise<boolean>.
 */
export default function MovieCommentsSection({
  comments = [],
  loading = false,
  onAddComment
}) {
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || submitting) return;

    setSubmitting(true);
    const success = await onAddComment(inputText.trim());
    if (success) {
      setInputText('');
    }
    setSubmitting(false);
  };

  return (
    <section className={styles.commentsContainer} aria-label="Bình luận phim">
      <div className={styles.headerRow}>
        <i className="fas fa-comments text-danger" />
        <h3 className={styles.sectionTitle}>Bình Luận & Đánh Giá</h3>
        <span className={styles.commentCountBadge}>{comments.length} bình luận</span>
      </div>

      {/* Comment Form */}
      <form className={styles.commentForm} onSubmit={handleSubmit}>
        <textarea
          className={styles.commentInput}
          placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
        />
        <button
          type="submit"
          className={styles.btnSubmitComment}
          disabled={!inputText.trim() || submitting}
        >
          {submitting ? (
            <span>Đang gửi...</span>
          ) : (
            <>
              <i className="fas fa-paper-plane" />
              <span>Gửi bình luận</span>
            </>
          )}
        </button>
      </form>

      {/* Comments List */}
      <div className={styles.commentsList}>
        {loading && comments.length === 0 ? (
          <div className={styles.emptyCommentsNotice}>Đang tải danh sách bình luận...</div>
        ) : comments.length > 0 ? (
          comments.map((cmt, idx) => {
            const author = cmt.user_name || cmt.user?.name || cmt.author || 'Thành viên';
            const initial = author.charAt(0).toUpperCase();
            const timeAgo = cmt.createdAt ? new Date(cmt.createdAt).toLocaleDateString('vi-VN') : 'Gần đây';

            return (
              <div key={cmt._id || cmt.id || idx} className={styles.commentItem}>
                <div className={styles.avatar}>{initial}</div>
                <div className={styles.commentBody}>
                  <div className={styles.commentMeta}>
                    <span className={styles.userName}>{author}</span>
                    <span className={styles.timestamp}>{timeAgo}</span>
                  </div>
                  <p className={styles.commentContent}>{cmt.content}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyCommentsNotice}>
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ về bộ phim!
          </div>
        )}
      </div>
    </section>
  );
}
