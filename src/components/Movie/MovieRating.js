import React, { useState } from 'react';

const MovieRating = ({ movieId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    try {
      await fetch('http://localhost:5000/api/movies/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId,
          rating,
          comment
        })
      });
      // Hiển thị thông báo thành công
    } catch (error) {
      console.error('Lỗi khi đánh giá:', error);
    }
  };

  return (
    <div className="mt-4">
      <h4>Đánh giá phim</h4>
      <div className="rating mb-3">
        {[1,2,3,4,5].map(star => (
          <span 
            key={star}
            className={`star ${rating >= star ? 'active' : ''}`}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>
      <textarea
        className="form-control mb-3"
        placeholder="Nhận xét của bạn..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button 
        className="btn btn-danger"
        onClick={handleSubmit}
      >
        Gửi đánh giá
      </button>
    </div>
  );
};

export default MovieRating; 