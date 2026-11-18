import React, { useState } from 'react';
import { apiUrl } from '@/config/apiPaths';
import authService from '@/API/services/authService';

export interface ReportButtonProps {
  movieId?: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({ movieId }) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = async (): Promise<void> => {
    try {
      // The endpoint needs the Bearer token, so the header is resolved
      // through the shared auth service.
      const authHeaders = await authService.getAuthHeader();
      await fetch(apiUrl(`reportCreate`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          movieId,
          type: reportType,
          description
        })
      });
      setShowModal(false);
    } catch (error) {

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
