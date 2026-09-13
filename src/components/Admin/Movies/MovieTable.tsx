// src/components/Admin/Movies/MovieTable.tsx
import React from 'react';
import { Table, Button, Row, Col } from 'react-bootstrap';
import BackToTopButton from '../Common/BackToTopButton';

export interface Movie {
  _id: string;
  name: string;
  origin_name: string;
  slug: string;
  year: number;
  type: string; // 'series' | 'single'
  status: string;
  thumb_url: string;
  poster_url: string;
  quality: string;
  lang: string;
  trailer_url?: string;
  time?: string;
  episodes?: Array<{
    server_name: string;
    server_data: Array<{
      name: string;
      slug: string;
      filename: string;
      link_embed: string;
      link_m3u8: string;
    }>
  }>;
  category: Array<{
    id: string;
    name: string;
  }>;
  actor: Array<{
    id: string;
    name: string;
  }>;
  director: Array<{
    id: string;
    name: string;
  }>;
  country: Array<{
    id: string;
    name: string;
  }>;
  description?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

interface MovieTableProps {
  movies: Movie[];
  onEdit?: (movieId: string) => void;
  onDelete?: (movieId: string) => void;
}

const MovieTable: React.FC<MovieTableProps> = ({ movies, onEdit, onDelete }) => {
  return (
    <>
      <Table striped bordered hover responsive className="mb-3">
        <thead>
          <tr>
            <th>#</th>
            <th>Hình ảnh</th>
            <th>Tên Phim</th>
            <th>Tên Gốc</th>
            <th>Năm</th>
            <th>Thể loại</th>
            <th>Quốc gia</th>
            <th>Chất lượng</th>
            <th>Ngôn ngữ</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {movies && movies.length > 0 ? (
            movies.map((movie, index) => (
              <tr key={movie._id}>
                <td>{index + 1}</td>
                <td>
                  <img 
                    src={movie.thumb_url || movie.poster_url} 
                    alt={movie.name}
                    style={{ width: '50px', height: '75px', objectFit: 'cover' }}
                  />
                </td>
                <td>{movie.name}</td>
                <td>{movie.origin_name}</td>
                <td>{movie.year}</td>
                <td>
                  {movie.category?.map(cat => cat.name).join(', ')}
                </td>
                <td>
                  {movie.country?.map(c => c.name).join(', ')}
                </td>
                <td>{movie.quality}</td>
                <td>{movie.lang}</td>
                <td>{movie.status}</td>
                <td>
                  <Button 
                    variant="info" 
                    size="sm" 
                    className="me-1"
                    onClick={() => onEdit?.(movie._id)}
                  >
                    Sửa
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => onDelete?.(movie._id)}
                  >
                    Xóa
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={11} className="text-center">Không có dữ liệu phim.</td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Back to top button at the bottom of the page */}
      {movies && movies.length > 10 && (
        <Row className="mt-3 mb-4">
          <Col className="d-flex justify-content-center">
            <BackToTopButton variant="primary" />
          </Col>
        </Row>
      )}
    </>
  );
};

export default MovieTable;