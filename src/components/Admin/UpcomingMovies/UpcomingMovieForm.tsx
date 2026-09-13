// src/components/Admin/UpcomingMovies/UpcomingMovieForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Row, Col, Card, Tab, Nav, Image, Alert } from 'react-bootstrap';
import { UpcomingMovie } from '@/services/admin/upcomingMovieService';
import BackToListButton from '../Common/BackToListButton';
import BackToTopButton from '../Common/BackToTopButton';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from './UpcomingMovieForm.module.css';

interface UpcomingMovieFormProps {
  movie?: Partial<UpcomingMovie>;
  onSubmit: (movieData: Partial<UpcomingMovie>) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

const UpcomingMovieForm: React.FC<UpcomingMovieFormProps> = ({ 
  movie, 
  onSubmit, 
  isSubmitting,
  onCancel 
}) => {
  const [formData, setFormData] = useState<Partial<UpcomingMovie>>(movie || {
    name: '',
    origin_name: '',
    content: '',
    year: new Date().getFullYear(),
    type: 'movie',
    status: 'upcoming',
    quality: '',
    lang: '',
    category: [],
    actor: [],
    director: [],
    country: [],
    release_date: new Date(),
    is_released: false,
    chieurap: true,
    isHidden: false
  });
  
  // State cho danh sách và input mới
  const [categories, setCategories] = useState<{id: string; name: string; slug: string;}[]>([]);
  const [directors, setDirectors] = useState<{id: string; name: string;}[]>([]);
  const [actors, setActors] = useState<{id: string; name: string;}[]>([]);
  const [countries, setCountries] = useState<{id: string; name: string; slug: string;}[]>([]);
  
  // State cho input mới
  const [newCategory, setNewCategory] = useState('');
  const [newDirector, setNewDirector] = useState('');
  const [newActor, setNewActor] = useState('');
  const [newCountry, setNewCountry] = useState('');
  
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(formData.thumb_url || '');
  const [posterPreview, setPosterPreview] = useState<string>(formData.poster_url || '');
  const [activeTab, setActiveTab] = useState('basic');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRefThumb = useRef<HTMLInputElement>(null);
  const fileInputRefPoster = useRef<HTMLInputElement>(null);
  const [releaseDate, setReleaseDate] = useState<Date | null>(
    movie?.release_date ? new Date(movie.release_date) : new Date()
  );
  useEffect(() => {
    if (movie) {
      setThumbnailPreview(movie.thumb_url || '');
      setPosterPreview(movie.poster_url || '');
      if (movie.release_date) {
        setReleaseDate(new Date(movie.release_date));
      }
      
      // Khởi tạo dữ liệu cho danh sách
      if (movie.category && Array.isArray(movie.category)) {
        setCategories(movie.category);
      }
      
      if (movie.country && Array.isArray(movie.country)) {
        setCountries(movie.country);
      }
      
      // Khởi tạo danh sách đạo diễn và diễn viên
      if (movie.director && Array.isArray(movie.director)) {
        const directorList = movie.director.map((name, index) => ({
          id: `director-${index}`,
          name
        }));
        setDirectors(directorList);
      }
      
      if (movie.actor && Array.isArray(movie.actor)) {
        const actorList = movie.actor.map((name, index) => ({
          id: `actor-${index}`,
          name
        }));
        setActors(actorList);
      }
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleReleaseDateChange = (date: Date | null) => {
    setReleaseDate(date);
    if (date) {
      setFormData(prev => ({ ...prev, release_date: date }));
    }
  };  // Using CSS modules instead of inline styles
  
  // Hàm xử lý thêm thể loại mới
  const handleAddCustomCategory = () => {
    if (!newCategory.trim()) {
      setErrorMessage('Vui lòng nhập tên thể loại');
      return;
    }
    
    // Tạo ID tạm thời cho thể loại mới
    const tempId = `custom-${Date.now()}`;
    
    // Thêm vào danh sách category
    const newCategoryObj = { 
      id: tempId, 
      name: newCategory.trim(), 
      slug: newCategory.trim().toLowerCase().replace(/ /g, '-')
    };
    
    // Thêm vào danh sách categories để hiển thị trong UI
    setCategories(prev => [...prev, newCategoryObj]);
    
    // Thêm vào formData
    setFormData(prev => ({
      ...prev,
      category: [...(prev.category || []), newCategoryObj]
    }));
    
    // Reset input
    setNewCategory('');
  };
  
  // Hàm xử lý thêm đạo diễn mới
  const handleAddCustomDirector = () => {
    if (!newDirector.trim()) {
      setErrorMessage('Vui lòng nhập tên đạo diễn');
      return;
    }
    
    // Tạo ID tạm thời cho đạo diễn mới
    const tempId = `director-${Date.now()}`;
    
    // Thêm vào danh sách directors để hiển thị trong UI
    const directorObj = { id: tempId, name: newDirector.trim() };
    setDirectors(prev => [...prev, directorObj]);
    
    // Thêm vào formData
    setFormData(prev => ({
      ...prev,
      director: [...(prev.director || []), newDirector.trim()]
    }));
    
    // Reset input
    setNewDirector('');
  };
  
  // Hàm xử lý thêm diễn viên mới
  const handleAddCustomActor = () => {
    if (!newActor.trim()) {
      setErrorMessage('Vui lòng nhập tên diễn viên');
      return;
    }
    
    // Tạo ID tạm thời cho diễn viên mới
    const tempId = `actor-${Date.now()}`;
    
    // Thêm vào danh sách actors để hiển thị trong UI
    const actorObj = { id: tempId, name: newActor.trim() };
    setActors(prev => [...prev, actorObj]);
    
    // Thêm vào formData
    setFormData(prev => ({
      ...prev,
      actor: [...(prev.actor || []), newActor.trim()]
    }));
    
    // Reset input
    setNewActor('');
  };
  
  // Hàm xử lý thêm quốc gia mới
  const handleAddCustomCountry = () => {
    if (!newCountry.trim()) {
      setErrorMessage('Vui lòng nhập tên quốc gia');
      return;
    }
    
    // Tạo ID tạm thời cho quốc gia mới
    const tempId = `country-${Date.now()}`;
    
    // Thêm vào danh sách countries để hiển thị trong UI
    const countryObj = { 
      id: tempId, 
      name: newCountry.trim(),
      slug: newCountry.trim().toLowerCase().replace(/ /g, '-')
    };
    setCountries(prev => [...prev, countryObj]);
    
    // Thêm vào formData
    setFormData(prev => ({
      ...prev,
      country: [...(prev.country || []), countryObj]
    }));
    
    // Reset input
    setNewCountry('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name) {
      setErrorMessage('Vui lòng nhập tên phim');
      return;
    }
    
    if (!formData.origin_name) {
      setErrorMessage('Vui lòng nhập tên gốc phim');
      return;
    }
    
    if (!formData.content) {
      setErrorMessage('Vui lòng nhập nội dung phim');
      return;
    }
    
    if (!formData.release_date) {
      setErrorMessage('Vui lòng chọn ngày phát hành');
      return;
    }

    setErrorMessage('');
    onSubmit(formData);
  };

  return (
    <>
      <Card className={`mb-4 ${styles.formContainer}`}>
        <Card.Header className={styles.formHeader}>
          <div className="d-flex justify-content-between align-items-center">
            <BackToListButton listPath="/admin/upcoming-movies" variant="outline-light" />
            <h4 className="mb-0">{movie ? 'Chỉnh sửa phim sắp ra mắt' : 'Thêm phim sắp ra mắt'}</h4>
            <div className={styles.headerSpacing}></div>
          </div>
        </Card.Header>
        <Card.Body>
          {errorMessage && (
            <Alert variant="danger" className={styles.errorAlert}>
              <span className={styles.errorIcon}><i className="bi bi-exclamation-triangle-fill"></i></span>
              {errorMessage}
            </Alert>
          )}

          <Tab.Container id="upcoming-movie-form-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'basic')}>
            <Row>
              <Col md={3} className="mb-3">
                <Nav variant="pills" className={styles.tabNav}>
                  <Nav.Item className={styles.tabItem}>
                    <Nav.Link eventKey="basic" className={`mb-2 ${activeTab === 'basic' ? styles.tabLinkActive : styles.tabLink}`}>Thông tin cơ bản</Nav.Link>
                  </Nav.Item>
                  <Nav.Item className={styles.tabItem}>
                    <Nav.Link eventKey="details" className={`mb-2 ${activeTab === 'details' ? styles.tabLinkActive : styles.tabLink}`}>Chi tiết phim</Nav.Link>
                  </Nav.Item>
                  <Nav.Item className={styles.tabItem}>
                    <Nav.Link eventKey="media" className={`mb-2 ${activeTab === 'media' ? styles.tabLinkActive : styles.tabLink}`}>Hình ảnh & Media</Nav.Link>
                  </Nav.Item>
                  <Nav.Item className={styles.tabItem}>
                    <Nav.Link eventKey="preview" className={`mb-2 ${activeTab === 'preview' ? styles.tabLinkActive : styles.tabLink}`}>Xem trước</Nav.Link>
                  </Nav.Item>
                </Nav>
                  {(thumbnailPreview || posterPreview) && (
                  <Card className={styles.previewPanel}>
                    <Card.Header className={styles.formSection}>Xem nhanh</Card.Header>
                    <Card.Body className="text-center">
                      {thumbnailPreview && (
                        <Image 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          className={styles.mediaPreview}
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
                      <Card className={styles.formSection}>
                        <Card.Header className={styles.formHeader}>Thông tin cơ bản</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Tên phim <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="text"
                                  name="name"
                                  value={formData.name || ''}
                                  onChange={handleInputChange}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Tên gốc <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="text"
                                  name="origin_name"
                                  value={formData.origin_name || ''}
                                  onChange={handleInputChange}
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Năm sản xuất</Form.Label>
                                <Form.Control
                                  type="number"
                                  name="year"
                                  value={formData.year || new Date().getFullYear()}
                                  onChange={handleInputChange}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">                                <Form.Label>Ngày phát hành <span className="text-danger">*</span></Form.Label>
                                <div className={styles.datepickerWrapper}>
                                  <DatePicker 
                                    selected={releaseDate}
                                    onChange={handleReleaseDateChange}
                                    className={styles.datepickerInput}
                                    dateFormat="dd/MM/yyyy"
                                  />
                                </div>
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={12}>
                              <Form.Group className="mb-3">
                                <Form.Label>Nội dung <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  as="textarea"
                                  name="content"
                                  value={formData.content || ''}
                                  onChange={handleInputChange}
                                  rows={4}
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Check
                                  type="checkbox"
                                  label="Chiếu Rạp"
                                  name="chieurap"
                                  checked={formData.chieurap || false}
                                  onChange={handleCheckboxChange}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Check
                                  type="checkbox"
                                  label="Ẩn phim"
                                  name="isHidden"
                                  checked={formData.isHidden || false}
                                  onChange={handleCheckboxChange}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Details Tab */}
                    <Tab.Pane eventKey="details">
                      <Card>
                        <Card.Header className={styles.formHeader}>Chi tiết phim</Card.Header>
                        <Card.Body>                          <Row>                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Thể loại</Form.Label>
                                <div className={styles.categorySelection}>
                                  <div className={styles.checkboxContainer}>
                                    {categories.map((category) => (
                                      <div key={category.id} className={styles.checkboxItem}>
                                        <input
                                          type="checkbox"
                                          id={`category-${category.id}`}
                                          className="form-check-input"
                                          checked={formData.category?.some(c => c.id === category.id) || false}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setFormData(prev => ({
                                                ...prev,
                                                category: [...(prev.category || []), category]
                                              }));
                                            } else {
                                              setFormData(prev => ({
                                                ...prev,
                                                category: (prev.category || []).filter(c => c.id !== category.id)
                                              }));
                                            }
                                          }}
                                        />
                                        <label className="form-check-label ms-2" htmlFor={`category-${category.id}`}>
                                          {category.name}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                  <div className={styles.inputGroup}>
                                    <Form.Control
                                      type="text"
                                      placeholder="Thêm thể loại mới"
                                      value={newCategory}
                                      onChange={(e) => setNewCategory(e.target.value)}
                                      className={styles.addInput}
                                    />                                    <Button 
                                      variant="primary"
                                      onClick={handleAddCustomCategory}
                                      className={styles.addButton}
                                    >
                                      Thêm
                                    </Button>
                                  </div>
                                </div>
                              </Form.Group>
                            </Col>                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Quốc gia</Form.Label>
                                <div className={styles.categorySelection}>
                                  <div className={styles.checkboxContainer}>
                                    {countries.map((country) => (
                                      <div key={country.id} className={styles.checkboxItem}>
                                        <input
                                          type="checkbox"
                                          id={`country-${country.id}`}
                                          className="form-check-input"
                                          checked={formData.country?.some(c => c.id === country.id) || false}                                          
                                          onChange={(e) => {                                            
                                            if (e.target.checked) {
                                              setFormData(prev => ({
                                                ...prev,
                                                country: [...(prev.country || []), country]
                                              }));                                            } else {
                                              setFormData(prev => ({
                                                ...prev,
                                                country: (prev.country || []).filter(c => c.id !== country.id)
                                              }));
                                            }
                                          }}
                                        />
                                        <label className="form-check-label ms-2" htmlFor={`country-${country.id}`}>
                                          {country.name}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                  <div className={styles.inputGroup}>
                                    <Form.Control
                                      type="text"
                                      placeholder="Thêm quốc gia mới"
                                      value={newCountry}
                                      onChange={(e) => setNewCountry(e.target.value)}
                                      className={styles.addInput}
                                    />                                      <Button 
                                      variant="primary"
                                      onClick={handleAddCustomCountry}
                                      className={styles.addButton}
                                    >
                                      Thêm
                                    </Button>
                                  </div>
                                </div>
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Đạo diễn</Form.Label>
                                <div className={styles.categorySelection}>
                                  <div className={styles.checkboxContainer}>
                                    {directors.map((director) => (
                                      <div key={director.id} className={styles.checkboxItem}>
                                        <input
                                          type="checkbox"
                                          id={`director-${director.id}`}
                                          className="form-check-input"
                                          checked={formData.director?.includes(director.name) || false}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setFormData(prev => ({
                                                ...prev,
                                                director: [...(prev.director || []), director.name]
                                              }));
                                            } else {
                                              setFormData(prev => ({
                                                ...prev,
                                                director: (prev.director || []).filter(d => d !== director.name)
                                              }));
                                            }
                                          }}
                                        />
                                        <label className="form-check-label ms-2" htmlFor={`director-${director.id}`}>
                                          {director.name}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                  <div className={styles.inputGroup}>
                                    <Form.Control
                                      type="text"
                                      placeholder="Thêm đạo diễn mới"
                                      value={newDirector}
                                      onChange={(e) => setNewDirector(e.target.value)}
                                      className={styles.addInput}
                                    />                                    <Button 
                                      variant="primary"
                                      onClick={handleAddCustomDirector}
                                      className={styles.addButton}
                                    >
                                      Thêm
                                    </Button>
                                  </div>
                                </div>
                              </Form.Group>
                            </Col>                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Diễn viên</Form.Label>
                                <div className={styles.categorySelection}>
                                  <div className={styles.checkboxContainer}>
                                    {actors.map((actor) => (
                                      <div key={actor.id} className={styles.checkboxItem}>
                                        <input
                                          type="checkbox"
                                          id={`actor-${actor.id}`}
                                          className="form-check-input"
                                          checked={formData.actor?.includes(actor.name) || false}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setFormData(prev => ({
                                                ...prev,
                                                actor: [...(prev.actor || []), actor.name]
                                              }));
                                            } else {
                                              setFormData(prev => ({
                                                ...prev,
                                                actor: (prev.actor || []).filter(a => a !== actor.name)
                                              }));
                                            }
                                          }}
                                        />
                                        <label className="form-check-label ms-2" htmlFor={`actor-${actor.id}`}>
                                          {actor.name}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                  <div className={styles.inputGroup}>
                                    <Form.Control
                                      type="text"
                                      placeholder="Thêm diễn viên mới"
                                      value={newActor}
                                      onChange={(e) => setNewActor(e.target.value)}
                                      className={styles.addInput}
                                    />                                    <Button 
                                      variant="primary"
                                      onClick={handleAddCustomActor}
                                      className={styles.addButton}
                                    >
                                      Thêm
                                    </Button>
                                  </div>
                                </div>
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Chất lượng</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="quality"
                                  value={formData.quality || ''}
                                  onChange={handleInputChange}
                                  placeholder="HD, FHD, etc."
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Ngôn ngữ</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="lang"
                                  value={formData.lang || ''}
                                  onChange={handleInputChange}
                                  placeholder="Vietsub, Thuyết minh, etc."
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Media Tab */}
                    <Tab.Pane eventKey="media">
                      <Card>
                        <Card.Header className={styles.formHeader}>Hình ảnh & Media</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>                              <Form.Group className="mb-3">
                                <Form.Label>Hình thu nhỏ (Thumbnail)</Form.Label>
                                <div className={styles.fileUploadArea}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRefThumb}
                                    onChange={(e) => handleFileChange('thumb_url', e)}
                                    className={styles.fileInput}
                                    title="Chọn file hình thu nhỏ"
                                  />
                                  <Button 
                                    variant="primary"
                                    onClick={() => fileInputRefThumb.current?.click()}
                                    className={styles.fileButton}
                                  >
                                    Chọn file
                                  </Button>
                                </div>
                                {thumbnailPreview && (
                                  <div className="mt-3 text-center">
                                    <Image 
                                      src={thumbnailPreview} 
                                      alt="Thumbnail preview"
                                      className={styles.imagePreview}
                                    />
                                  </div>
                                )}
                                <Form.Text className="text-muted">
                                  Hoặc nhập URL hình ảnh
                                </Form.Text>
                                <Form.Control
                                  type="text"
                                  name="thumb_url"
                                  value={formData.thumb_url || ''}
                                  onChange={handleInputChange}
                                  placeholder="https://example.com/image.jpg"
                                  className="mt-2"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>                              <Form.Group className="mb-3">
                                <Form.Label>Poster</Form.Label>
                                <div className={styles.fileUploadArea}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRefPoster}
                                    onChange={(e) => handleFileChange('poster_url', e)}
                                    className={styles.fileInput}
                                    title="Chọn file poster"
                                  />
                                  <Button 
                                    variant="primary"
                                    onClick={() => fileInputRefPoster.current?.click()}
                                    className={styles.fileButton}
                                  >
                                    Chọn file
                                  </Button>
                                </div>                                {posterPreview && (
                                  <div className="mt-3 text-center">
                                    <Image 
                                      src={posterPreview} 
                                      alt="Poster preview"
                                      className={styles.imagePreview}
                                    />
                                  </div>
                                )}
                                <Form.Text className="text-muted">
                                  Hoặc nhập URL poster
                                </Form.Text>
                                <Form.Control
                                  type="text"
                                  name="poster_url"
                                  value={formData.poster_url || ''}
                                  onChange={handleInputChange}
                                  placeholder="https://example.com/poster.jpg"
                                  className="mt-2"
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={12}>
                              <Form.Group className="mb-3">
                                <Form.Label>URL Trailer</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="trailer_url"
                                  value={formData.trailer_url || ''}
                                  onChange={handleInputChange}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Preview Tab */}
                    <Tab.Pane eventKey="preview">
                      <Card>
                        <Card.Header className={styles.formHeader}>Xem trước thông tin phim</Card.Header>
                        <Card.Body>
                          <div className="preview-container p-3 bg-light rounded">
                            <h4>{formData.name || 'Tên phim'}</h4>
                            <p className="text-muted">{formData.origin_name || 'Tên gốc'}</p>
                            
                            <Row className="my-3">
                              <Col md={6}>                                <div className={thumbnailPreview ? styles.previewImageContainer : styles.noImage}>
                                  {thumbnailPreview ? (
                                    <Image 
                                      src={thumbnailPreview} 
                                      alt="Movie thumbnail" 
                                      className={styles.imagePreview}
                                    />                                  ) : (
                                    <div className={styles.noImage}>
                                      <i className="bi bi-image fs-1 opacity-50"></i>
                                      <p className={styles.noImageText}>Chưa có hình thu nhỏ</p>
                                    </div>
                                  )}
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="movie-details">
                                  <p><strong>Năm sản xuất:</strong> {formData.year}</p>
                                  <p><strong>Ngày phát hành:</strong> {releaseDate ? releaseDate.toLocaleDateString('vi-VN') : 'Chưa xác định'}</p>
                                  <p><strong>Thể loại:</strong> {formData.category?.map(c => c.name).join(', ') || 'Chưa xác định'}</p>
                                  <p><strong>Quốc gia:</strong> {formData.country?.map(c => c.name).join(', ') || 'Chưa xác định'}</p>
                                  <p><strong>Đạo diễn:</strong> {formData.director?.join(', ') || 'Chưa xác định'}</p>
                                  <p><strong>Diễn viên:</strong> {formData.actor?.join(', ') || 'Chưa xác định'}</p>
                                  <p><strong>Chất lượng:</strong> {formData.quality || 'Chưa xác định'}</p>
                                  <p><strong>Ngôn ngữ:</strong> {formData.lang || 'Chưa xác định'}</p>
                                </div>
                              </Col>
                            </Row>
                            
                            <div className="movie-synopsis mt-3">
                              <h5>Nội dung:</h5>
                              <p>{formData.content || 'Chưa có nội dung'}</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                  </Tab.Content>                  <div className={styles.formActions}>
                    <Button 
                      variant="light" 
                      onClick={onCancel || (() => window.history.back())}
                      className={styles.cancelButton}
                    >
                      Hủy
                    </Button>
                    <div>
                      {activeTab !== 'basic' && (
                        <Button 
                          variant="outline-primary" 
                          className="me-2" 
                          onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) - 1])}
                        >
                          <i className="bi bi-arrow-left me-1"></i> Quay lại
                        </Button>
                      )}
                      {activeTab !== 'preview' && (
                        <Button 
                          variant="outline-primary" 
                          className="me-2" 
                          onClick={() => setActiveTab(tabs[tabs.indexOf(activeTab) + 1])}
                        >
                          Tiếp theo <i className="bi bi-arrow-right ms-1"></i>
                        </Button>
                      )}
                      <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={isSubmitting}
                        className={styles.submitButton}
                      >
                        {isSubmitting ? 'Đang lưu...' : (movie ? 'Cập nhật' : 'Thêm mới')}
                      </Button>
                    </div>
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

const tabs = ['basic', 'details', 'media', 'preview'];

export default UpcomingMovieForm;
