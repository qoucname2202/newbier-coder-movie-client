import React, { useState } from 'react';
import styles from './MovieCommentsSection.module.css';

const QUICK_TAGS = [
  '#PhimHay',
  '#KỹXảoĐỉnh',
  '#CốtTruyệnCuốn',
  '#NhạcPhimXuấtSắc',
  '#ĐángXem'
];

const STAR_LABELS = {
  1: '1★ - Rất dở',
  2: '2★ - Dở',
  3: '3★ - Dưới trung bình',
  4: '4★ - Tạm được',
  5: '5★ - Trung bình',
  6: '6★ - Khá',
  7: '7★ - Đáng xem',
  8: '8★ - Rất hay',
  9: '9★ - Xuất sắc',
  10: '10★ - Tuyệt phẩm'
};

const SEED_COMMENTS = [
  {
    id: 'seed-1',
    user: 'MinhKhang_Cinema',
    avatarLetter: 'M',
    time: '2 giờ trước',
    rating: 10,
    content: 'Phim xem cuốn thực sự từ hình ảnh đến âm thanh rạp chiếu. Khuyên mọi người nên xem!',
    likes: 14
  },
  {
    id: 'seed-2',
    user: 'ThuHa_Review',
    avatarLetter: 'T',
    time: 'Hôm qua',
    rating: 9,
    content: 'Mạch phim dồn dập, các pha hành động và biểu cảm nhân vật rất mượt mà. 9/10 điểm xứng đáng.',
    likes: 8
  }
];

/**
 * @file MovieCommentsSection.js
 * @description Rich cinema community reviews and interactive star rating section.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.comments=[]] - Existing comments from backend.
 * @param {boolean} [props.loading=false] - Comments loading state.
 * @param {Function} props.onAddComment - Callback to add a comment.
 */
export default function MovieCommentsSection({
  comments = [],
  loading = false,
  onAddComment
}) {
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(10);
  const [hasRated, setHasRated] = useState(false);
  const [localComments, setLocalComments] = useState([]);
  const [likedIds, setLikedIds] = useState({});

  // Merge seed comments if comments from API is empty
  const displayComments = [
    ...localComments,
    ...(comments.length > 0 ? comments : SEED_COMMENTS)
  ];

  const handleRate = (star) => {
    setSelectedStar(star);
    setHasRated(true);
  };

  const handleQuickTagClick = (tag) => {
    setInputText((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || submitting) return;

    setSubmitting(true);
    const content = inputText.trim();
    const success = await onAddComment(content);

    // Optimistically add to local comments
    const newComment = {
      id: `local-${Date.now()}`,
      user: 'Bạn',
      avatarLetter: 'B',
      time: 'Vừa xong',
      rating: selectedStar,
      content,
      likes: 0
    };
    setLocalComments((prev) => [newComment, ...prev]);
    setInputText('');
    setSubmitting(false);
  };

  const handleToggleLike = (id) => {
    setLikedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section className={styles.sectionContainer} aria-label="Bình luận và đánh giá phim">
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <i className="fas fa-comments text-danger me-2" />
          <h3 className={styles.sectionTitle}>Bình Luận & Đánh Giá</h3>
          <span className={styles.countBadge}>({displayComments.length})</span>
        </div>
      </div>

      {/* Interactive Rating Scoreboard */}
      <div className={styles.ratingScoreboard}>
        <div className={styles.scoreLeft}>
          <span className={styles.bigScore}>8.8</span>
          <div className={styles.starsWrap}>
            <div className={styles.starsGold}>
              {'★★★★★'.split('').map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
            <span className={styles.voteCount}>1,248 lượt bình chọn</span>
          </div>
        </div>

        {/* User interactive voting widget */}
        <div className={styles.votingWidget}>
          <span className={styles.votePrompt}>Đánh giá của bạn:</span>
          <div className={styles.interactiveStars}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
              const isLit = (hoverStar || selectedStar) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  className={`${styles.starBtn} ${isLit ? styles.starBtnLit : ''}`}
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => handleRate(star)}
                  title={STAR_LABELS[star]}
                >
                  ★
                </button>
              );
            })}
          </div>
          <span className={styles.starFeedback}>
            {hasRated ? `Đã chọn: ${STAR_LABELS[selectedStar]}` : (STAR_LABELS[hoverStar || selectedStar] || '')}
          </span>
        </div>
      </div>

      {/* Quick Reaction Tags */}
      <div className={styles.quickTagsRow}>
        <span className={styles.quickTagLabel}>
          Cảm nhận nhanh:
        </span>
        <div className={styles.tagChips}>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={styles.quickTagBtn}
              onClick={() => handleQuickTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Form */}
      <form className={styles.commentForm} onSubmit={handleSubmit}>
        <textarea
          className={styles.commentInput}
          placeholder="Chia sẻ cảm nghĩ của bạn về diễn xuất, âm thanh, cốt truyện..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={2}
        />
        <div className={styles.formFooter}>
          <span className={styles.inputTip}>Bình luận lịch sự, văn minh để cùng xây dựng cộng đồng.</span>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={!inputText.trim() || submitting}
          >
            {submitting ? (
              <span>Đang gửi...</span>
            ) : (
              <>
                <i className="fas fa-paper-plane me-1" />
                <span>Gửi Bình Luận</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Community Comments List */}
      <div className={styles.commentsList}>
        {displayComments.map((item, index) => {
          const isLiked = !!likedIds[item.id || index];
          const likesCount = (item.likes || 0) + (isLiked ? 1 : 0);

          return (
            <div key={item.id || index} className={styles.commentItem}>
              <div className={styles.commentAvatar}>
                {item.avatarLetter || (item.user ? item.user.charAt(0).toUpperCase() : 'U')}
              </div>

              <div className={styles.commentBody}>
                <div className={styles.commentHeader}>
                  <span className={styles.userName}>{item.user || 'Khán giả'}</span>
                  {item.rating && (
                    <span className={styles.userRatingBadge}>
                      ⭐ {item.rating}/10
                    </span>
                  )}
                  <span className={styles.commentTime}>{item.time || 'Vừa xong'}</span>
                </div>

                <p className={styles.commentText}>{item.content}</p>

                <div className={styles.commentActions}>
                  <button
                    type="button"
                    className={`${styles.btnLike} ${isLiked ? styles.btnLikeActive : ''}`}
                    onClick={() => handleToggleLike(item.id || index)}
                  >
                    <i className={isLiked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up'} />
                    <span>Thích ({likesCount})</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
