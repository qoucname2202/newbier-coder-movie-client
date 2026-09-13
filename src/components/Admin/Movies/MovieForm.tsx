// src/components/Admin/Movies/MovieForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Row, Col, Card, Tab, Nav, Image, Alert } from 'react-bootstrap';
import { Movie } from './MovieTable';
import BackToListButton from '../Common/BackToListButton';
import BackToTopButton from '../Common/BackToTopButton';

interface MovieFormProps {
  movie?: Partial<Movie>;
  onSubmit: (movieData: Partial<Movie>) => void;
  onCancel: () => void;
}

const MovieForm: React.FC<MovieFormProps> = ({ movie, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Movie>>(movie || {
    name: '',
    origin_name: '',
    year: new Date().getFullYear(),
    type: 'single',
    status: 'ongoing',
    quality: 'HD',
    lang: 'Vietsub',
    category: [],
    actor: [],
    director: [],
    country: [],
    episodes: [{ server_name: 'Server #1', server_data: [] }]
  });
  
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(formData.thumb_url || '');
  const [posterPreview, setPosterPreview] = useState<string>(formData.poster_url || '');
  const [activeTab, setActiveTab] = useState('basic');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRefThumb = useRef<HTMLInputElement>(null);
  const fileInputRefPoster = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (movie) {
      setThumbnailPreview(movie.thumb_url || '');
      setPosterPreview(movie.poster_url || '');
    }
    
    // Check for authentication token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
      console.error('Authentication token missing. User might need to log in again.');
    }
  }, [movie]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (field: keyof Movie, value: string) => {
    const items = value.split(',').map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      name: item.trim()
    }));
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const handleEpisodeChange = (serverIndex: number, field: string, value: any) => {
    setFormData(prev => {
      const episodes = [...(prev.episodes || [])];
      episodes[serverIndex] = {
        ...episodes[serverIndex],
        [field]: value
      };
      return { ...prev, episodes };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleRemoveEpisode = (serverIndex: number, episodeIndex: number) => {
    setFormData(prev => {
      const episodes = [...(prev.episodes || [])];
      const serverData = [...episodes[serverIndex].server_data];
      serverData.splice(episodeIndex, 1);
      episodes[serverIndex] = {
        ...episodes[serverIndex],
        server_data: serverData
      };
      return { ...prev, episodes };
    });
  };

  const handleRemoveServer = (serverIndex: number) => {
    setFormData(prev => {
      const episodes = [...(prev.episodes || [])];
      episodes.splice(serverIndex, 1);
      return { ...prev, episodes };
    });
  };

  const handleFileChange = (field: 'thumb_url' | 'poster_url', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileUrl = URL.createObjectURL(file);
      
      // Here we would normally upload the file to a server,
      // but for now we'll just use the local URL for preview
      if (field === 'thumb_url') {
        setThumbnailPreview(fileUrl);
        setFormData(prev => ({ ...prev, thumb_url: fileUrl }));
      } else {
        setPosterPreview(fileUrl);
        setFormData(prev => ({ ...prev, poster_url: fileUrl }));
      }
    }
  };

  return (
    <>
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <BackToListButton listPath="/admin/movies" variant="outline-light" />
            <h4 className="mb-0">{movie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}</h4>
            <div style={{ width: '120px' }}></div>
          </div>
        </Card.Header>
        <Card.Body>
          <Tab.Container id="movie-form-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'basic')}>
            <Row>
              <Col md={3} className="mb-3">
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="basic" className="mb-2">Thông tin cơ bản</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="details" className="mb-2">Chi tiết phim</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="media" className="mb-2">Hình ảnh & Media</Nav.Link>
                  </Nav.Item>
                  {formData.type === 'series' && (
                    <Nav.Item>
                      <Nav.Link eventKey="episodes" className="mb-2">Danh sách tập phim</Nav.Link>
                    </Nav.Item>
                  )}
                  <Nav.Item>
                    <Nav.Link eventKey="preview" className="mb-2">Xem trước</Nav.Link>
                  </Nav.Item>
                </Nav>
                
                {(thumbnailPreview || posterPreview) && (
                  <Card className="mt-4">
                    <Card.Header className="bg-light">Xem nhanh</Card.Header>
                    <Card.Body className="text-center">
                      {thumbnailPreview && (
                        <Image 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          style={{ maxWidth: '100%', height: 'auto', maxHeight: '150px' }}
                          className="mb-2"
                        />
                      )}
                    </Card.Body>
                  </Card>
                )}
              </Col>
              
              <Col md={9}>
                <Form onSubmit={handleSubmit}>
                  <Tab.Content>
                    {/* Basic Information Tab */}
                    <Tab.Pane eventKey="basic">
                      <Card>
                        <Card.Header className="bg-light">Thông tin cơ bản</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Tên phim <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleInputChange}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Tên gốc</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="origin_name"
                                  value={formData.origin_name}
                                  onChange={handleInputChange}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Năm phát hành <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="number"
                                  name="year"
                                  value={formData.year}
                                  onChange={handleInputChange}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Loại phim</Form.Label>
                                <Form.Select name="type" value={formData.type} onChange={handleInputChange}>
                                  <option value="single">Phim lẻ</option>
                                  <option value="series">Phim bộ</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Trạng thái</Form.Label>
                                <Form.Select name="status" value={formData.status} onChange={handleInputChange}>
                                  <option value="ongoing">Đang chiếu</option>
                                  <option value="completed">Hoàn thành</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Chất lượng</Form.Label>
                                <Form.Select name="quality" value={formData.quality} onChange={handleInputChange}>
                                  <option value="HD">HD</option>
                                  <option value="Full HD">Full HD</option>
                                  <option value="2K">2K</option>
                                  <option value="4K">4K</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Ngôn ngữ</Form.Label>
                                <Form.Select name="lang" value={formData.lang} onChange={handleInputChange}>
                                  <option value="Vietsub">Vietsub</option>
                                  <option value="Thuyết minh">Thuyết minh</option>
                                  <option value="Raw">Bản gốc</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Thời lượng</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="time"
                                  value={formData.time}
                                  onChange={handleInputChange}
                                  placeholder="VD: 120 phút"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Movie Details Tab */}
                    <Tab.Pane eventKey="details">
                      <Card>
                        <Card.Header className="bg-light">Chi tiết phim</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Thể loại (phân cách bằng dấu phẩy)</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.category?.map(cat => cat.name).join(', ')}
                                  onChange={(e) => handleArrayInputChange('category', e.target.value)}
                                  placeholder="Hành động, Phiêu lưu, ..."
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Quốc gia (phân cách bằng dấu phẩy)</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.country?.map(c => c.name).join(', ')}
                                  onChange={(e) => handleArrayInputChange('country', e.target.value)}
                                  placeholder="Việt Nam, Mỹ, ..."
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Diễn viên (phân cách bằng dấu phẩy)</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.actor?.map(a => a.name).join(', ')}
                                  onChange={(e) => handleArrayInputChange('actor', e.target.value)}
                                  placeholder="Tom Cruise, Brad Pitt, ..."
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Đạo diễn (phân cách bằng dấu phẩy)</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.director?.map(d => d.name).join(', ')}
                                  onChange={(e) => handleArrayInputChange('director', e.target.value)}
                                  placeholder="Christopher Nolan, ..."
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Form.Group className="mb-3">
                            <Form.Label>Mô tả ngắn</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              name="description"
                              value={formData.description}
                              onChange={handleInputChange}
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Nội dung chi tiết</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={5}
                              name="content"
                              value={formData.content}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Media Tab */}
                    <Tab.Pane eventKey="media">
                      <Card>
                        <Card.Header className="bg-light">Hình ảnh & Media</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Hình thumbnail</Form.Label>
                                <div className="d-flex mb-2">
                                  <Form.Control
                                    type="text"
                                    name="thumb_url"
                                    value={formData.thumb_url}
                                    onChange={handleInputChange}
                                    placeholder="URL hình thumbnail"
                                  />
                                  <Button 
                                    variant="outline-secondary" 
                                    onClick={() => fileInputRefThumb.current?.click()}
                                    className="ms-2"
                                  >
                                    Upload
                                  </Button>
                                </div>
                                <Form.Control
                                  type="file"
                                  ref={fileInputRefThumb}
                                  onChange={(e) => handleFileChange('thumb_url', e as React.ChangeEvent<HTMLInputElement>)}
                                  style={{ display: 'none' }}
                                  accept="image/*"
                                />
                                {thumbnailPreview && (
                                  <div className="mt-2 text-center">
                                    <Image
                                      src={thumbnailPreview}
                                      alt="Thumbnail preview"
                                      style={{ maxHeight: '150px', maxWidth: '100%' }}
                                      thumbnail
                                    />
                                  </div>
                                )}
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Hình poster</Form.Label>
                                <div className="d-flex mb-2">
                                  <Form.Control
                                    type="text"
                                    name="poster_url"
                                    value={formData.poster_url}
                                    onChange={handleInputChange}
                                    placeholder="URL hình poster"
                                  />
                                  <Button 
                                    variant="outline-secondary" 
                                    onClick={() => fileInputRefPoster.current?.click()}
                                    className="ms-2"
                                  >
                                    Upload
                                  </Button>
                                </div>
                                <Form.Control
                                  type="file"
                                  ref={fileInputRefPoster}
                                  onChange={(e) => handleFileChange('poster_url', e as React.ChangeEvent<HTMLInputElement>)}
                                  style={{ display: 'none' }}
                                  accept="image/*"
                                />
                                {posterPreview && (
                                  <div className="mt-2 text-center">
                                    <Image
                                      src={posterPreview}
                                      alt="Poster preview"
                                      style={{ maxHeight: '150px', maxWidth: '100%' }}
                                      thumbnail
                                    />
                                  </div>
                                )}
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>Trailer URL</Form.Label>
                            <Form.Control
                              type="text"
                              name="trailer_url"
                              value={formData.trailer_url}
                              onChange={handleInputChange}
                              placeholder="URL video trailer (YouTube)"
                            />
                            {formData.trailer_url && formData.trailer_url.includes('youtube') && (
                              <div className="mt-2">
                                <Alert variant="info">
                                  Xem trước trailer sẽ hiển thị trong tab "Xem trước"
                                </Alert>
                              </div>
                            )}
                          </Form.Group>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Episodes Tab */}
                    {formData.type === 'series' && (
                      <Tab.Pane eventKey="episodes">
                        <Card>
                          <Card.Header className="bg-light">Danh sách tập phim</Card.Header>
                          <Card.Body>
                            {formData.episodes?.map((server, serverIndex) => (
                              <div key={serverIndex} className="border rounded p-3 mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <Form.Group className="mb-0 flex-grow-1">
                                    <Form.Label>Tên server</Form.Label>
                                    <Form.Control
                                      type="text"
                                      value={server.server_name}
                                      onChange={(e) => handleEpisodeChange(serverIndex, 'server_name', e.target.value)}
                                    />
                                  </Form.Group>
                                  {formData.episodes && formData.episodes.length > 1 && (
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm" 
                                      className="ms-2 align-self-end"
                                      onClick={() => handleRemoveServer(serverIndex)}
                                    >
                                      Xóa Server
                                    </Button>
                                  )}
                                </div>

                                <div className="episodes-list">
                                  {server.server_data && server.server_data.length > 0 ? (
                                    server.server_data.map((episode, episodeIndex) => (
                                      <div key={episodeIndex} className="border rounded p-2 mb-2">
                                        <Row>
                                          <Col md={3}>
                                            <Form.Group>
                                              <Form.Label>Tên tập</Form.Label>
                                              <Form.Control
                                                type="text"
                                                value={episode.name}
                                                onChange={(e) => {
                                                  const newServerData = [...server.server_data];
                                                  newServerData[episodeIndex] = {
                                                    ...episode,
                                                    name: e.target.value
                                                  };
                                                  handleEpisodeChange(serverIndex, 'server_data', newServerData);
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={8}>
                                            <Form.Group>
                                              <Form.Label>Link phim</Form.Label>
                                              <Form.Control
                                                type="text"
                                                value={episode.link_embed}
                                                onChange={(e) => {
                                                  const newServerData = [...server.server_data];
                                                  newServerData[episodeIndex] = {
                                                    ...episode,
                                                    link_embed: e.target.value
                                                  };
                                                  handleEpisodeChange(serverIndex, 'server_data', newServerData);
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={1} className="d-flex align-items-end justify-content-center">
                                            <Button 
                                              variant="outline-danger" 
                                              size="sm"
                                              onClick={() => handleRemoveEpisode(serverIndex, episodeIndex)}
                                            >
                                              Xóa
                                            </Button>
                                          </Col>
                                        </Row>
                                      </div>
                                    ))
                                  ) : (
                                    <Alert variant="info">Chưa có tập phim nào. Hãy thêm tập mới.</Alert>
                                  )}
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => {
                                      const newServerData = [...(server.server_data || [])];
                                      newServerData.push({
                                        name: `Tập ${newServerData.length + 1}`,
                                        slug: '',
                                        filename: '',
                                        link_embed: '',
                                        link_m3u8: ''
                                      });
                                      handleEpisodeChange(serverIndex, 'server_data', newServerData);
                                    }}
                                  >
                                    Thêm tập mới
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button
                              variant="outline-success"
                              className="mb-3"
                              onClick={() => {
                                const episodes = [...(formData.episodes || [])];
                                episodes.push({
                                  server_name: `Server #${episodes.length + 1}`,
                                  server_data: []
                                });
                                setFormData(prev => ({ ...prev, episodes }));
                              }}
                            >
                              Thêm server mới
                            </Button>
                          </Card.Body>
                        </Card>
                      </Tab.Pane>
                    )}

                    {/* Preview Tab */}
                    <Tab.Pane eventKey="preview">
                      <Card>
                        <Card.Header className="bg-light">Xem trước thông tin phim</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={4} className="text-center">
                              {thumbnailPreview ? (
                                <Image
                                  src={thumbnailPreview}
                                  alt="Thumbnail preview"
                                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
                                  className="mb-3"
                                  thumbnail
                                />
                              ) : (
                                <div className="border rounded p-3 text-muted mb-3">
                                  Chưa có hình thumbnail
                                </div>
                              )}
                            </Col>
                            <Col md={8}>
                              <h4>{formData.name || 'Chưa có tên phim'}</h4>
                              <p className="text-muted">{formData.origin_name || 'Chưa có tên gốc'}</p>
                              
                              <div className="mb-3">
                                <strong>Năm phát hành:</strong> {formData.year}<br/>
                                <strong>Loại phim:</strong> {formData.type === 'single' ? 'Phim lẻ' : 'Phim bộ'}<br/>
                                <strong>Trạng thái:</strong> {formData.status === 'ongoing' ? 'Đang chiếu' : 'Hoàn thành'}<br/>
                                <strong>Chất lượng:</strong> {formData.quality}<br/>
                                <strong>Ngôn ngữ:</strong> {formData.lang}<br/>
                                {formData.time && <><strong>Thời lượng:</strong> {formData.time}<br/></>}
                              </div>
                              
                              <div className="mb-3">
                                {formData.category && formData.category.length > 0 && (
                                  <div><strong>Thể loại:</strong> {formData.category.map(c => c.name).join(', ')}</div>
                                )}
                                {formData.country && formData.country.length > 0 && (
                                  <div><strong>Quốc gia:</strong> {formData.country.map(c => c.name).join(', ')}</div>
                                )}
                                {formData.actor && formData.actor.length > 0 && (
                                  <div><strong>Diễn viên:</strong> {formData.actor.map(a => a.name).join(', ')}</div>
                                )}
                                {formData.director && formData.director.length > 0 && (
                                  <div><strong>Đạo diễn:</strong> {formData.director.map(d => d.name).join(', ')}</div>
                                )}
                              </div>
                              
                              {formData.description && (
                                <div className="mb-3">
                                  <strong>Mô tả ngắn:</strong>
                                  <p>{formData.description}</p>
                                </div>
                              )}
                            </Col>
                          </Row>
                          
                          {formData.content && (
                            <Row className="mt-3">
                              <Col>
                                <strong>Nội dung chi tiết:</strong>
                                <p className="mt-2">{formData.content}</p>
                              </Col>
                            </Row>
                          )}
                          
                          {formData.trailer_url && formData.trailer_url.includes('youtube') && (
                            <Row className="mt-3">
                              <Col>
                                <strong>Trailer:</strong>
                                <div className="ratio ratio-16x9 mt-2">
                                  <iframe
                                    src={formData.trailer_url.replace('watch?v=', 'embed/')}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              </Col>
                            </Row>
                          )}
                          
                          {formData.type === 'series' && formData.episodes && (
                            <Row className="mt-3">
                              <Col>
                                <strong>Danh sách tập phim:</strong>
                                <div className="mt-2">
                                  {formData.episodes.map((server, serverIndex) => (
                                    <div key={serverIndex} className="mb-3">
                                      <div className="fw-bold mb-2">{server.server_name}</div>
                                      <div className="d-flex flex-wrap gap-2">
                                        {server.server_data && server.server_data.map((episode, episodeIndex) => (
                                          <Button key={episodeIndex} variant="outline-secondary" size="sm">
                                            {episode.name}
                                          </Button>
                                        ))}
                                        {(!server.server_data || server.server_data.length === 0) && (
                                          <span className="text-muted">Chưa có tập phim nào</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Col>
                            </Row>
                          )}
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                  </Tab.Content>
                  
                  {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                  
                  <div className="d-flex justify-content-end mt-4">
                    <Button variant="secondary" onClick={onCancel} className="me-2">Hủy</Button>
                    <Button type="submit" variant="primary">{movie ? 'Cập nhật' : 'Thêm phim'}</Button>
                  </div>
                </Form>
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>
      <BackToTopButton />
    </>
  );
};

export default MovieForm;
