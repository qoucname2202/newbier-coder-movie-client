import React, { useState } from 'react';

const ReportButton = ({ movieId }) => {
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movies/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId,
          type: reportType,
          description
        })
      });
      setShowModal(false);
    } catch (error) {
      console.error('Lỗi khi báo cáo:', error);
    }
  };

  return (
    <>
      <button 
        className="btn btn-outline-danger"
        onClick={() => setShowModal(true)}
      >
        Báo lỗi phim
      </button>

      {/* Modal báo lỗi */}
      {showModal && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header">
                <h5>Báo lỗi phim</h5>
                <button 
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <select 
                  className="form-select mb-3"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="">Chọn loại lỗi</option>
                  <option value="video">Lỗi video</option>
                  <option value="subtitle">Lỗi phụ đề</option>
                  <option value="link">Link hỏng</option>
                </select>
                <textarea
                  className="form-control"
                  placeholder="Mô tả chi tiết lỗi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-danger"
                  onClick={handleSubmit}
                >
                  Gửi báo cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;