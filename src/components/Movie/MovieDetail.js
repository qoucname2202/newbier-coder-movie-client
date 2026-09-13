import React, { useState } from 'react';

const MovieDetail = () => {
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <div>
      {movie.trailer_url && (
        <button 
          className="btn btn-outline-danger mt-3"
          onClick={() => setShowTrailer(true)}
        >
          Xem Trailer
        </button>
      )}

      {showTrailer && (
        <div className="modal show d-block">
          <div className="modal-dialog modal-lg">
            <div className="modal-content bg-dark">
              <div className="modal-body p-0">
                <div className="ratio ratio-16x9">
                  <iframe
                    src={movie.trailer_url}
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail; 