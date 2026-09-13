import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaSave, FaInfoCircle, FaFilm, FaCamera, FaEye, FaPlus, FaCopyright, FaClosedCaptioning, FaArrowUp } from 'react-icons/fa';
import { useRouter } from 'next/router';
import Image from 'next/image';
import axios from '@/API/config/axiosConfig';
import { toast } from 'react-toastify';
import Link from 'next/link';
import AdminLayout from '@/components/Layout/AdminLayout';
import styles from '@/styles/AdminMoviesEnhanced.module.css';
import EpisodeManager from '@/components/Admin/Movies/EpisodeManager';
import FormField from '@/components/Admin/Movies/FormField';
import ImageUrlInput from '@/components/Admin/Movies/ImageUrlInput';
import FormSkeleton from '@/components/Admin/Movies/FormSkeleton';

// Interface cho danh mục phim
interface Category {
  id: string;
  name: string;
  slug: string;
}

// Interface cho đạo diễn và diễn viên
interface Person {
  id: string;
  name: string;
}

// Interface cho server_data
interface Episode {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

const AddMovie = () => {
  const router = useRouter();
  const [showBackToTop, setShowBackToTop] = useState(false);  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [movie, setMovie] = useState({
    name: '',
    origin_name: '',
    slug: '',    year: new Date().getFullYear(),
    thumb_url: '',
    poster_url: '',
    // Đã loại bỏ backdrop_url
    trailer_url: '',
    category: [] as string[],
    type: 'movie', // Phù hợp với backend
    status: 'completed', // Phù hợp với backend
    quality: 'HD',
    lang: 'Vietsub',
    director: [] as string[],
    actor: [] as string[],
    content: '',
    time: '60 phút/tập',
    episode_current: 'Hoàn Tất (1/1)',
    episode_total: '1 Tập',
    is_copyright: false,
    chieurap: false,
    sub_docquyen: false,
    notify: '',
    showtimes: '',
    country: [] as string[],
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [
          {
            name: "Tập 1",
            slug: "tap-1",
            filename: "tap-1",
            link_embed: "",
            link_m3u8: ""
          }
        ]
      }
    ],
    // TMDB fields
    tmdb: {
      type: '',
      id: '',
      season: 1,
      vote_average: 0,
      vote_count: 0
    },
    // IMDB field
    imdb: {
      id: ''
    }
  });  const [categories, setCategories] = useState<Category[]>([]);
  const [directors, setDirectors] = useState<Person[]>([]);  // State cho danh sách đạo diễn
  const [actors, setActors] = useState<Person[]>([]);  // State cho danh sách diễn viên
  const [loading, setLoading] = useState(false);  const [preview, setPreview] = useState('');  const [newCategory, setNewCategory] = useState('');  // State cho input thể loại mới
  const [newCountry, setNewCountry] = useState('');  // State cho input quốc gia mới
  const [newDirector, setNewDirector] = useState('');  // State cho input đạo diễn mới
  const [newActor, setNewActor] = useState('');  // State cho input diễn viên mới
  const [countries, setCountries] = useState<{ id: string; name: string; }[]>([]);

  // State để theo dõi tab đang active
  const [activeTab, setActiveTab] = useState('basic-info');
  
  // Các bước của form
  const formSteps = [
    { id: 'basic-info', title: 'Thông tin cơ bản', icon: <FaInfoCircle className="mr-2" /> },
    { id: 'movie-details', title: 'Chi tiết phim', icon: <FaFilm className="mr-2" /> },
    { id: 'media', title: 'Hình ảnh & Media', icon: <FaCamera className="mr-2" /> },
    { id: 'preview', title: 'Xem trước', icon: <FaEye className="mr-2" /> },
  ];

  // Hàm chuyển đến tab tiếp theo
  const goToNextTab = () => {
    const currentIndex = formSteps.findIndex(step => step.id === activeTab);
    if (currentIndex < formSteps.length - 1) {
      setActiveTab(formSteps[currentIndex + 1].id);
    }
  };

  // Hàm quay lại tab trước
  const goToPrevTab = () => {
    const currentIndex = formSteps.findIndex(step => step.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(formSteps[currentIndex - 1].id);
    }
  };

  // Thêm hàm xử lý nhập mảng (categories và countries) ngăn cách bởi dấu phẩy
  // const handleArrayTextInput = (field: string, value: string) => {
  //   // Chuyển đổi chuỗi thành mảng bằng cách tách theo dấu phẩy
  //   const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
  //   setMovie(prev => ({
  //     ...prev,
  //     [field]: arrayValue
  //   }));
  //     // Xóa lỗi nếu đã nhập dữ liệu
  //   if (arrayValue.length > 0 && validationErrors[field]) {
  //     const newErrors = { ...validationErrors };
  //     delete newErrors[field];
  //     setValidationErrors(newErrors);
  //   }
  // };
  // Hàm định dạng mảng thành chuỗi
  // const getArrayAsString = (array: string[] | string): string => {
  //   if (Array.isArray(array)) {
  //     return array.join(', ');
  //   } 
  //   return array || '';
  // };  // Lấy danh sách danh mục
  // useEffect(() => {
  //   const fetchCategories = async () => {
  //     try {
  //       const response = await axios.get('/categories');
  //       if (response.data && response.data.data) {
  //         setCategories(response.data.data);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching categories:', error);
  //       toast.error('Không thể tải danh sách thể loại phim');
  //     }
  //   };

  //   fetchCategories();
    
  //   // Khởi tạo dữ liệu cho đạo diễn và diễn viên phổ biến
  // }, []);
  
  // Handle scroll event to show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Xử lý tạo slug tự động từ tên phim
  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    return slug;
  };

  // Xử lý thay đổi tên phim và tạo slug tự động
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setMovie(prev => ({ 
      ...prev, 
      name: name,
      slug: generateSlug(name)
    }));    // Xóa lỗi nếu trường đã được điền
    if (name) {
      const newErrors = { ...validationErrors };
      delete newErrors.name;
      setValidationErrors(newErrors);
    }
  };

  // Xử lý thay đổi giá trị form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMovie(prev => ({ ...prev, [name]: value }));
      // Xóa lỗi nếu trường đã được điền
    if (value && validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
  };
  // No longer needed - using direct image URLs now

  // Kiểm tra tính hợp lệ của form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Danh sách trường bắt buộc theo controller backend
    const requiredFields = [
      { field: 'name', label: 'Tên phim' },
      { field: 'origin_name', label: 'Tên gốc' },
      { field: 'slug', label: 'Slug URL' },
      { field: 'content', label: 'Nội dung phim' },
      { field: 'year', label: 'Năm sản xuất' }
    ];
    
    // Kiểm tra các trường bắt buộc
    requiredFields.forEach(({ field, label }) => {
      if (!movie[field as keyof typeof movie]) {
        errors[field] = `${label} là trường bắt buộc`;
      }
    });
    
    // Kiểm tra thể loại
    if (!movie.category.length) {
      errors.category = 'Vui lòng chọn ít nhất một thể loại';
    }
    
    // Kiểm tra quốc gia
    if (!movie.country.length) {
      errors.country = 'Vui lòng chọn ít nhất một quốc gia';
    }
    
    // Kiểm tra năm sản xuất
    const year = parseInt(String(movie.year));
    if (isNaN(year) || year < 1900 || year > 2100) {
      errors.year = 'Năm sản xuất không hợp lệ (1900-2100)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra tính hợp lệ của form
    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
          // Chuẩn bị dữ liệu gửi đi
      const directorValue = movie.director.map(id => {
        const directorInfo = directors.find(d => d.id === id);
        return directorInfo ? directorInfo.name : id;
      });
        
      const actorValue = movie.actor.map(id => {
        const actorInfo = actors.find(a => a.id === id);
        return actorInfo ? actorInfo.name : id;
      });
      
      // Định dạng category cho đúng với schema - mỗi phần tử phải là object có id, name và slug
      const categoryValue = Array.isArray(movie.category) 
        ? movie.category.map(categoryId => {
            // Tìm thông tin category từ danh sách có sẵn
            const categoryInfo = categories.find(c => c.id === categoryId);
            if (categoryInfo) {
              return {
                id: categoryInfo.id,
                name: categoryInfo.name,
                slug: categoryInfo.slug
              };
            }
            // Fallback nếu không tìm thấy
            return {
              id: categoryId,
              name: categoryId,
              slug: generateSlug(categoryId)
            };
          })
        : [];
      
      // Định dạng country cho đúng với schema - mỗi phần tử phải là object có id, name và slug
      const countryValue = Array.isArray(movie.country) 
        ? movie.country.map(countryId => {
            // Tìm thông tin country từ danh sách có sẵn
            const countryInfo = countries.find(c => c.id === countryId);
            if (countryInfo) {
              return {
                id: countryInfo.id,
                name: countryInfo.name,
                slug: generateSlug(countryInfo.name)
              };
            }
            // Fallback nếu không tìm thấy
            return {
              id: countryId,
              name: countryId,
              slug: generateSlug(countryId)
            };
          })
        : [];        // Đảm bảo các trường dữ liệu đúng định dạng
      const formattedMovie = {
        ...movie,
        director: directorValue,
        actor: actorValue,
        year: Number(movie.year),
        category: categoryValue, // Sử dụng category đã định dạng đúng
        country: countryValue, // Sử dụng country đã định dạng đúng
        thumb_url: movie.thumb_url,
        poster_url: movie.poster_url
        // Đã loại bỏ backdrop_url khỏi dữ liệu gửi đi
      };

      // Chỉ thêm episodes nếu có dữ liệu hợp lệ
      const validEpisodes = movie.episodes.filter(episode => 
        episode.server_data.some(ep => ep.link_embed && ep.link_m3u8)
      );
      if (validEpisodes.length > 0) {
        formattedMovie.episodes = validEpisodes;
      }
      // Nếu không có episodes hợp lệ, không gửi trường episodes

      // Ghi log dữ liệu gửi đi để debug
      console.log('Sending movie data:', formattedMovie);      // Gửi request đến API backend
      const response = await axios.post('/admin/movies', formattedMovie);
      if (response.data) {
        toast.success('Thêm phim mới thành công');
        console.log('Movie added successfully:', response.data);
        // Type-safe router navigation
        void router.push('/admin/movies');
      }
    } catch (error) {
      console.error('Error adding movie:', error);
      
      // Handle error with type safety
      let errorMessage = 'Unknown error occurred';
      
      // Type safety - check for properties we expect, one by one
      if (error && typeof error === 'object') {
        // Check for error message
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
        // Check for axios response object
        if ('response' in error) {
          const response = error.response;
          
          if (response && typeof response === 'object') {
            // Process response data if available
            if ('data' in response && response.data) {
              const data = response.data;
              
              if (typeof data === 'object') {
                if ('message' in data && typeof data.message === 'string') {
                  errorMessage = data.message;
                } else if ('error' in data && typeof data.error === 'string') {
                  errorMessage = data.error;
                }
              }
            }
            
            // Include status code if available
            if ('status' in response && typeof response.status === 'number') {
              errorMessage = `Error ${response.status}: ${errorMessage}`;
            }
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  // Xử lý thêm thể loại mới
  const handleAddCustomCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Vui lòng nhập tên thể loại');
      return;
    }
    
    // Tạo ID tạm thời cho thể loại mới
    const tempId = `custom-${Date.now()}`;
    
    // Thêm vào danh sách category đã chọn
    setMovie(prev => ({
      ...prev,
      category: [...prev.category, tempId]
    }));
    
    // Thêm vào danh sách categories để hiển thị trong UI
    setCategories(prev => [
      ...prev,
      { id: tempId, name: newCategory.trim(), slug: generateSlug(newCategory) }
    ]);
    
    // Reset input
    setNewCategory('');
    toast.success(`Đã thêm thể loại "${newCategory.trim()}"`);
    
    // Xóa lỗi thể loại nếu có
    if (validationErrors.category) {
      const newErrors = { ...validationErrors };
      delete newErrors.category;
      setValidationErrors(newErrors);
    }
  };

  // Xử lý thêm đạo diễn mới
  const handleAddCustomDirector = () => {
    if (!newDirector.trim()) {
      toast.error('Vui lòng nhập tên đạo diễn');
      return;
    }
    
    // Tạo ID tạm thời cho đạo diễn mới
    const tempId = `director-${Date.now()}`;
    
    // Thêm vào danh sách director đã chọn
    setMovie(prev => ({
      ...prev,
      director: [...prev.director, tempId]
    }));
    
    // Thêm vào danh sách directors để hiển thị trong UI
    setDirectors(prev => [
      ...prev,
      { id: tempId, name: newDirector.trim() }
    ]);
    
    // Reset input
    setNewDirector('');
    toast.success(`Đã thêm đạo diễn "${newDirector.trim()}"`);
  };
  // Xử lý thêm diễn viên mới
  const handleAddCustomActor = () => {
    if (!newActor.trim()) {
      toast.error('Vui lòng nhập tên diễn viên');
      return;
    }
    
    // Tạo ID tạm thời cho diễn viên mới
    const tempId = `actor-${Date.now()}`;
    
    // Thêm vào danh sách actor đã chọn
    setMovie(prev => ({
      ...prev,
      actor: [...prev.actor, tempId]
    }));
    
    // Thêm vào danh sách actors để hiển thị trong UI
    setActors(prev => [
      ...prev,
      { id: tempId, name: newActor.trim() }
    ]);
    
    // Reset input
    setNewActor('');
    toast.success(`Đã thêm diễn viên "${newActor.trim()}"`);
  };
  
  // Xử lý thêm quốc gia mới
  const handleAddCustomCountry = () => {
    if (!newCountry.trim()) {
      toast.error('Vui lòng nhập tên quốc gia');
      return;
    }
    
    // Tạo ID tạm thời cho quốc gia mới
    const tempId = `country-${Date.now()}`;
    
    // Thêm vào danh sách country đã chọn
    setMovie(prev => ({
      ...prev,
      country: [...prev.country, tempId]
    }));
    
    // Thêm vào danh sách countries để hiển thị trong UI
    setCountries(prev => [
      ...prev,
      { id: tempId, name: newCountry.trim() }
    ]);
    
    // Reset input
    setNewCountry('');
    toast.success(`Đã thêm quốc gia "${newCountry.trim()}"`);
    
    // Xóa lỗi quốc gia nếu có
    if (validationErrors.country) {
      const newErrors = { ...validationErrors };
      delete newErrors.country;
      setValidationErrors(newErrors);
    }
  };

  // Xử lý thêm server mới
  const handleAddServer = () => {
    setMovie(prev => ({
      ...prev,
      episodes: [
        ...prev.episodes,
        {
          server_name: `Server #${prev.episodes.length + 1}`,
          server_data: [
            {
              name: "Tập 1",
              slug: "tap-1",
              filename: "tap-1",
              link_embed: "",
              link_m3u8: ""
            }
          ]
        }
      ]
    }));
  };

  // Xử lý xóa server
  const handleRemoveServer = (serverIndex: number) => {
    setMovie(prev => ({
      ...prev,
      episodes: prev.episodes.filter((_, index) => index !== serverIndex)
    }));
  };

  // Xử lý thay đổi tên server
  const handleServerNameChange = (serverIndex: number, newName: string) => {
    const updatedEpisodes = [...movie.episodes];
    updatedEpisodes[serverIndex].server_name = newName;
    
    setMovie(prev => ({
      ...prev,
      episodes: updatedEpisodes
    }));
  };

  // Xử lý thêm tập mới vào server
  const handleAddEpisode = (serverIndex: number) => {
    const updatedEpisodes = [...movie.episodes];
    const episodeCount = updatedEpisodes[serverIndex].server_data.length + 1;
    
    updatedEpisodes[serverIndex].server_data.push({
      name: `Tập ${episodeCount}`,
      slug: `tap-${episodeCount}`,
      filename: `tap-${episodeCount}`,
      link_embed: "",
      link_m3u8: ""
    });
    
    setMovie(prev => ({
      ...prev,
      episodes: updatedEpisodes
    }));
  };

  // Xử lý xóa tập khỏi server
  const handleRemoveEpisode = (serverIndex: number, episodeIndex: number) => {
    const updatedEpisodes = [...movie.episodes];
    updatedEpisodes[serverIndex].server_data = updatedEpisodes[serverIndex].server_data.filter(
      (_, index) => index !== episodeIndex
    );
    
    setMovie(prev => ({
      ...prev,
      episodes: updatedEpisodes
    }));
  };

  // Xử lý cập nhật thông tin tập phim
  const handleUpdateEpisode = (serverIndex: number, episodeIndex: number, field: keyof Episode, value: string) => {
    const updatedEpisodes = [...movie.episodes];
    updatedEpisodes[serverIndex].server_data[episodeIndex][field] = value;
    
    setMovie(prev => ({
      ...prev,
      episodes: updatedEpisodes
    }));
  };

  // Define the scrollToTop function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AdminLayout>
      <div className={styles.pageContainer}>
        {/* Content Header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            <FaFilm className={styles.headerIcon} />
            Thêm Phim Mới
          </h1>
          <ul className={styles.breadcrumb}>
            <li>
              <Link href="/admin/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/admin/movies">Quản lý phim</Link>
            </li>
            <li>Thêm phim mới</li>
          </ul>
        </header>

        {/* Back to Top Button */}
        <button 
          className={`${styles.backToTop} ${showBackToTop ? styles.visible : ''}`}
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <FaArrowUp />
        </button>

        {loading ? (
          <FormSkeleton />
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
              {formSteps.map((step) => (
                <div
                  key={step.id}
                  className={`${styles.tabItem} ${activeTab === step.id ? styles.tabItemActive : ''}`}
                  onClick={() => setActiveTab(step.id)}
                >
                  <span className={styles.tabIcon}>{step.icon}</span>
                  {step.title}
                </div>
              ))}
            </div>

            {/* Basic Info Section */}
            {activeTab === 'basic-info' && (
              <div className={styles.formSection}>
                <div className={styles.formTitle}>
                  <span>
                    <FaInfoCircle className="mr-2" /> 
                    Thông tin cơ bản
                  </span>
                </div>
                <div className={styles.formContent}>
                  <div className={styles.formRow}>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Tên phim (Tiếng Việt)" 
                        id="name" 
                        required 
                        error={validationErrors.name}
                      >
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={movie.name}
                          onChange={handleNameChange}
                          className={styles.formInput}
                          placeholder="Nhập tên phim bằng tiếng Việt"
                        />
                      </FormField>
                    </div>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Tên gốc" 
                        id="origin_name" 
                        required 
                        error={validationErrors.origin_name}
                      >
                        <input
                          type="text"
                          id="origin_name"
                          name="origin_name"
                          value={movie.origin_name}
                          onChange={handleChange}
                          className={styles.formInput}
                          placeholder="Nhập tên gốc của phim"
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Slug URL" 
                        id="slug" 
                        required 
                        error={validationErrors.slug}
                        hint="Slug sẽ được tự động tạo từ tên phim"
                      >
                        <div className={styles.inputGroupAddon}>
                          <input
                            type="text"
                            id="slug"
                            name="slug"
                            value={movie.slug}
                            onChange={handleChange}
                            className={styles.formInput}
                            placeholder="slug-tu-dong"
                          />
                          <button 
                            type="button" 
                            onClick={() => movie.name && setMovie(prev => ({ ...prev, slug: generateSlug(movie.name) }))
                            }
                            className={styles.addonButton}
                          >
                            Tạo lại
                          </button>
                        </div>
                      </FormField>
                    </div>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Năm sản xuất" 
                        id="year" 
                        required 
                        error={validationErrors.year}
                      >
                        <input
                          type="number"
                          id="year"
                          name="year"
                          value={movie.year}
                          onChange={handleChange}
                          min="1900"
                          max="2100"
                          className={styles.formInput}
                          placeholder="Nhập năm sản xuất"
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Thể loại" 
                        id="category" 
                        required 
                        error={validationErrors.category}
                      >
                        <div className={styles.categorySelection}>
                          <div className={styles.checkboxContainer}>
                            {categories.map((category) => (
                              <div key={category.id} className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    name="category"
                                    value={category.id}
                                    checked={movie.category.includes(category.id)}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setMovie(prev => ({
                                        ...prev,
                                        category: e.target.checked
                                          ? [...prev.category, value]
                                          : prev.category.filter(id => id !== value)
                                      }));
                                      
                                      // Xóa lỗi nếu đã chọn ít nhất một thể loại
                                      if (e.target.checked && validationErrors.category) {
                                        const newErrors = { ...validationErrors };
                                        delete newErrors.category;
                                        setValidationErrors(newErrors);
                                      }
                                    }}
                                    className={styles.checkboxInput}
                                  />
                                  {category.name}
                                </label>
                              </div>
                            ))}
                          </div>

                          <div className={styles.addCustomCategory}>
                            <div className={styles.inputGroupAddon}>
                              <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className={styles.formInput}
                                placeholder="Thêm thể loại mới"
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomCategory}
                                className={styles.addonButton}
                                title="Thêm thể loại"
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </div>
                        </div>
                      </FormField>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formCol}>                      <FormField 
                        label="Quốc gia" 
                        id="country" 
                        required 
                        error={validationErrors.country}
                      >
                        <div className={styles.categorySelection}>
                          <div className={styles.checkboxContainer}>
                            {countries.map((country) => (
                              <div key={country.id} className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    name="country"
                                    value={country.id}
                                    checked={movie.country.includes(country.id)}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setMovie(prev => ({
                                        ...prev,
                                        country: e.target.checked
                                          ? [...prev.country, value]
                                          : prev.country.filter(id => id !== value)
                                      }));
                                      
                                      // Xóa lỗi nếu đã chọn ít nhất một quốc gia
                                      if (e.target.checked && validationErrors.country) {
                                        const newErrors = { ...validationErrors };
                                        delete newErrors.country;
                                        setValidationErrors(newErrors);
                                      }
                                    }}
                                    className={styles.checkboxInput}
                                  />
                                  {country.name}
                                </label>
                              </div>
                            ))}
                          </div>

                          <div className={styles.addCustomCategory}>
                            <div className={styles.inputGroupAddon}>
                              <input
                                type="text"
                                value={newCountry}
                                onChange={(e) => setNewCountry(e.target.value)}
                                className={styles.formInput}
                                placeholder="Thêm quốc gia mới"
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomCountry}
                                className={styles.addonButton}
                                title="Thêm quốc gia"
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </div>
                        </div>
                      </FormField>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Movie Details Section */}
            {activeTab === 'movie-details' && (
              <div className={styles.formSection}>
                <div className={styles.formTitle}>
                  <span>
                    <FaFilm className="mr-2" /> 
                    Chi tiết phim
                  </span>
                </div>
                <div className={styles.formContent}>
                  <div className={styles.formRow}>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Nội dung phim" 
                        id="content" 
                        required 
                        error={validationErrors.content}
                      >
                        <textarea
                          id="content"
                          name="content"
                          value={movie.content}
                          onChange={handleChange}
                          className={styles.formTextarea}
                          placeholder="Nhập nội dung mô tả phim"
                          rows={5}
                        />
                      </FormField>
                    </div>
                  </div>                  <div className={styles.formRow}>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Đạo diễn" 
                        id="director"
                      >
                        <div className={styles.categorySelection}>
                          <div className={styles.checkboxContainer}>
                            {directors.map((director) => (
                              <div key={director.id} className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    name="director"
                                    value={director.id}
                                    checked={movie.director.includes(director.id)}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setMovie(prev => ({
                                        ...prev,
                                        director: e.target.checked
                                          ? [...prev.director, value]
                                          : prev.director.filter(id => id !== value)
                                      }));
                                    }}
                                    className={styles.checkboxInput}
                                  />
                                  {director.name}
                                </label>
                              </div>
                            ))}
                          </div>

                          <div className={styles.addCustomCategory}>
                            <div className={styles.inputGroupAddon}>
                              <input
                                type="text"
                                value={newDirector}
                                onChange={(e) => setNewDirector(e.target.value)}
                                className={styles.formInput}
                                placeholder="Thêm đạo diễn mới"
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomDirector}
                                className={styles.addonButton}
                                title="Thêm đạo diễn"
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </div>
                        </div>
                      </FormField>
                    </div>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Diễn viên" 
                        id="actor"
                      >
                        <div className={styles.categorySelection}>
                          <div className={styles.checkboxContainer}>
                            {actors.map((actor) => (
                              <div key={actor.id} className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                  <input
                                    type="checkbox"
                                    name="actor"
                                    value={actor.id}
                                    checked={movie.actor.includes(actor.id)}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setMovie(prev => ({
                                        ...prev,
                                        actor: e.target.checked
                                          ? [...prev.actor, value]
                                          : prev.actor.filter(id => id !== value)
                                      }));
                                    }}
                                    className={styles.checkboxInput}
                                  />
                                  {actor.name}
                                </label>
                              </div>
                            ))}
                          </div>

                          <div className={styles.addCustomCategory}>
                            <div className={styles.inputGroupAddon}>
                              <input
                                type="text"
                                value={newActor}
                                onChange={(e) => setNewActor(e.target.value)}
                                className={styles.formInput}
                                placeholder="Thêm diễn viên mới"
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomActor}
                                className={styles.addonButton}
                                title="Thêm diễn viên"
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </div>
                        </div>
                      </FormField>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Loại phim" 
                        id="type"
                      >
                        <select
                          id="type"
                          name="type"
                          value={movie.type}
                          onChange={handleChange}
                          className={styles.formSelect}
                          aria-label="Loại phim"
                        >
                          <option value="movie">Phim lẻ</option>
                          <option value="series">Phim bộ</option>
                          <option value="tvshow">TV Show</option>
                          <option value="hoathinh">Hoạt hình</option>
                        </select>
                      </FormField>
                    </div>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Trạng thái" 
                        id="status"
                      >
                        <select
                          id="status"
                          name="status"
                          value={movie.status}
                          onChange={handleChange}
                          className={styles.formSelect}
                          aria-label="Trạng thái"
                        >
                          <option value="ongoing">Đang chiếu</option>
                          <option value="completed">Hoàn tất</option>
                          <option value="trailer">Sắp chiếu</option>
                        </select>
                      </FormField>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Chất lượng" 
                        id="quality"
                      >
                        <select
                          id="quality"
                          name="quality"
                          value={movie.quality}
                          onChange={handleChange}
                          className={styles.formSelect}
                          aria-label="Chất lượng"
                        >
                          <option value="HD">HD</option>
                          <option value="SD">SD</option>
                          <option value="HDCam">HD Cam</option>
                          <option value="Trailer">Trailer</option>
                          <option value="FullHD">Full HD</option>
                        </select>
                      </FormField>
                    </div>
                    <div className={styles.formCol}>
                      <FormField 
                        label="Ngôn ngữ" 
                        id="lang"
                      >
                        <select
                          id="lang"
                          name="lang"
                          value={movie.lang}
                          onChange={handleChange}
                          className={styles.formSelect}
                          aria-label="Chất lượng"
                        >
                          <option value="Vietsub">Vietsub</option>
                          <option value="Thuyết minh">Thuyết minh</option>
                          <option value="Lồng tiếng">Lồng tiếng</option>
                        </select>
                      </FormField>
                    </div>
                  </div>

                  <div className={styles.formCard}>
                    <div className={`${styles.formCardHeader} ${styles.blue}`}>
                      <h3>Thông tin tập phim</h3>
                    </div>
                    <div className={styles.formCardBody}>
                      <div className={styles.formRow}>
                        <div className={styles.formCol}>
                          <FormField 
                            label="Thời lượng" 
                            id="time"
                          >
                            <input
                              type="text"
                              id="time"
                              name="time"
                              value={movie.time}
                              onChange={handleChange}
                              className={styles.formInput}
                              placeholder="VD: 45 phút/tập"
                            />
                          </FormField>
                        </div>
                        <div className={styles.formCol}>
                          <FormField 
                            label="Tổng số tập" 
                            id="episode_total"
                          >
                            <input
                              type="text"
                              id="episode_total"
                              name="episode_total"
                              value={movie.episode_total}
                              onChange={handleChange}
                              className={styles.formInput}
                              placeholder="VD: 16 Tập"
                            />
                          </FormField>
                        </div>
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formCol}>
                          <FormField 
                            label="Tập hiện tại" 
                            id="episode_current"
                          >
                            <input
                              type="text"
                              id="episode_current"
                              name="episode_current"
                              value={movie.episode_current}
                              onChange={handleChange}
                              className={styles.formInput}
                              placeholder="VD: Hoàn Tất (16/16)"
                            />
                          </FormField>
                        </div>
                        <div className={styles.formCol}>
                          <FormField 
                            label="Lịch chiếu (nếu có)" 
                            id="showtimes"
                          >
                            <input
                              type="text"
                              id="showtimes"
                              name="showtimes"
                              value={movie.showtimes}
                              onChange={handleChange}
                              className={styles.formInput}
                              placeholder="VD: Thứ 2, 3 hàng tuần"
                            />
                          </FormField>
                        </div>
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formCol}>
                          <FormField 
                            label="Trailer URL" 
                            id="trailer_url"
                            hint="URL Youtube hoặc URL nhúng khác"
                          >                            <input
                              type="text"
                              id="trailer_url"
                              name="trailer_url"
                              value={movie.trailer_url}
                              onChange={handleChange}
                              className={styles.formInput}
                              placeholder="https://www.youtube.com/watch?v=..."
                            />
                          </FormField>
                        </div>
                      </div>                      <div className={styles.formRow}>
                        <div className={styles.formCol}>
                          <div className={styles.customSwitch}>
                            <span>
                              <FaCopyright className="me-2" />
                              Bản quyền
                            </span>
                            <label className={styles.toggleSwitch}>
                              <input
                                type="checkbox"
                                name="is_copyright"
                                checked={movie.is_copyright}
                                onChange={(e) => setMovie(prev => ({ ...prev, is_copyright: e.target.checked }))}
                                aria-label="Bản quyền"
                              />
                              <span className={styles.toggleSlider}></span>
                            </label>
                          </div>
                        </div>
                        <div className={styles.formCol}>
                          <div className={styles.customSwitch}>
                            <span>
                              <FaFilm className="me-2" />
                              Phim chiếu rạp
                            </span>
                            <label className={styles.toggleSwitch}>
                              <input
                                type="checkbox"
                                name="chieurap"
                                checked={movie.chieurap}
                                onChange={(e) => setMovie(prev => ({ ...prev, chieurap: e.target.checked }))}
                                aria-label="Phim chiếu rạp"
                              />
                              <span className={styles.toggleSlider}></span>
                            </label>
                          </div>
                        </div>
                        <div className={styles.formCol}>
                          <div className={styles.customSwitch}>
                            <span>
                              <FaClosedCaptioning className="me-2" />
                              Sub độc quyền
                            </span>
                            <label className={styles.toggleSwitch}>
                              <input
                                type="checkbox"
                                name="sub_docquyen"
                                checked={movie.sub_docquyen}
                                onChange={(e) => setMovie(prev => ({ ...prev, sub_docquyen: e.target.checked }))}
                                aria-label="Sub độc quyền"
                              />
                              <span className={styles.toggleSlider}></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formCard}>
                    <div className={`${styles.formCardHeader} ${styles.purple}`}>
                      <h3>ID tham chiếu (nếu có)</h3>
                    </div>
                    <div className={styles.formCardBody}>
                      <div className={styles.formRow}>
                        <div className={styles.formCol}>
                          <FormField 
                            label="IMDB ID" 
                            id="imdb_id"
                          >
                            <input
                              type="text"
                              id="imdb_id"
                              name="imdb[id]"
                              value={movie.imdb.id}
                              onChange={(e) => setMovie(prev => ({ ...prev, imdb: { ...prev.imdb, id: e.target.value } }))
                              }
                              className={styles.formInput}
                              placeholder="VD: tt0944947"
                            />
                          </FormField>
                        </div>
                        <div className={styles.formCol}>
                          <FormField 
                            label="TMDB ID" 
                            id="tmdb_id"
                          >
                            <input
                              type="text"
                              id="tmdb_id"
                              name="tmdb[id]"
                              value={movie.tmdb.id}
                              onChange={(e) => setMovie(prev => ({ ...prev, tmdb: { ...prev.tmdb, id: e.target.value } }))
                              }
                              className={styles.formInput}
                              placeholder="VD: 1399"
                            />
                          </FormField>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Section */}
            {activeTab === 'media' && (
              <div className={styles.formSection}>
                <div className={styles.formTitle}>
                  <span>
                    <FaCamera className="mr-2" /> 
                    Hình ảnh & Media
                  </span>
                </div>
                <div className={styles.formContent}>
                  <div className={styles.formRow}>
                    <div className={styles.formCol}>
                      <ImageUrlInput
                        id="thumbUrl"
                        label="URL hình thumbnail"
                        onUrlChange={(url) => {
                          setMovie(prev => ({ ...prev, thumb_url: url }));
                          setPreview(url);
                        }}
                        value={movie.thumb_url}
                        hint="Định dạng: JPG, PNG, WebP (Kích thước đề xuất: 500x750px)"
                        placeholder="Nhập đường dẫn hình thumbnail"
                      />
                    </div>
                    <div className={styles.formCol}>
                      <ImageUrlInput
                        id="posterUrl"
                        label="URL hình poster"
                        onUrlChange={(url) => {
                          setMovie(prev => ({ ...prev, poster_url: url }));
                        }}
                        value={movie.poster_url}
                        hint="Định dạng: JPG, PNG, WebP (Kích thước đề xuất: 800x1200px)"
                        placeholder="Nhập đường dẫn hình poster"
                      />
                    </div>
                  </div>                  {/* Đã loại bỏ trường URL hình nền backdrop */}

                  <EpisodeManager
                    episodes={movie.episodes}
                    onAddServer={handleAddServer}
                    onRemoveServer={handleRemoveServer}
                    onServerNameChange={handleServerNameChange}
                    onAddEpisode={handleAddEpisode}
                    onRemoveEpisode={handleRemoveEpisode}
                    onUpdateEpisode={handleUpdateEpisode}
                  />
                </div>
              </div>
            )}

            {/* Preview Section */}
            {activeTab === 'preview' && (
              <div className={styles.formSection}>
                <div className={styles.formTitle}>
                  <span>
                    <FaEye className="mr-2" /> 
                    Xem trước thông tin
                  </span>
                </div>
                <div className={styles.formContent}>                  <div className={styles.previewSection}>
                    <div className="row">
                      <div className="col-md-8">
                        <h3 className={styles.previewTitle}>Thông tin cơ bản</h3>
                        <div className={styles.previewItem}>
                          <div className={styles.previewLabel}>Tên phim:</div>
                          <div className={styles.previewValue}>{movie.name || '(Chưa nhập)'}</div>
                        </div>
                        <div className={styles.previewItem}>
                          <div className={styles.previewLabel}>Tên gốc:</div>
                          <div className={styles.previewValue}>{movie.origin_name || '(Chưa nhập)'}</div>
                        </div>
                        <div className={styles.previewItem}>
                          <div className={styles.previewLabel}>Slug URL:</div>
                          <div className={styles.previewValue}>{movie.slug || '(Chưa nhập)'}</div>
                        </div>
                        <div className={styles.previewItem}>
                          <div className={styles.previewLabel}>Năm sản xuất:</div>
                          <div className={styles.previewValue}>{movie.year}</div>
                        </div>
                      </div>
                      <div className={styles.formCol}>                        {preview && (
                          <div className={styles.imagePreviewContainer}>
                            <Image 
                              src={preview} 
                              alt="Preview" 
                              className={styles.thumbnailPreview}
                              width={300}
                              height={450}
                              style={{objectFit: 'contain'}}
                            />
                          </div>
                        )}
                        
                        {!preview && movie.thumb_url && (
                          <div className={styles.imagePreviewContainer}>
                            <Image
                              src={movie.thumb_url}
                              alt="Thumbnail"
                              className={styles.thumbnailPreview}
                              width={300}
                              height={450}
                              style={{objectFit: 'contain'}}
                            />
                          </div>
                        )}
                        
                        {!preview && !movie.thumb_url && (
                          <div className={`${styles.imagePreviewContainer} ${styles.noImage}`}>
                            <div className={styles.noImagePlaceholder}>
                              <FaFilm size={48} opacity={0.5} />
                              <p>Chưa có ảnh</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className={styles.previewTitle}>Thể loại & Quốc gia</h3>
                    <div className={styles.previewItem}>
                      <div className={styles.previewLabel}>Thể loại:</div>
                      <div className={styles.previewValue}>
                        {movie.category.length > 0 ? (
                          <div className={styles.tagList}>
                            {movie.category.map(categoryId => {
                              const category = categories.find(c => c.id === categoryId);
                              return (
                                <span key={categoryId} className={styles.tag}>
                                  {category ? category.name : categoryId}
                                </span>
                              );
                            })}
                          </div>
                        ) : '(Chưa chọn)'}
                      </div>
                    </div>
                    <div className={styles.previewItem}>
                      <div className={styles.previewLabel}>Quốc gia:</div>
                      <div className={styles.previewValue}>
                        {movie.country.length > 0 ? (
                          <div className={styles.tagList}>
                            {movie.country.map(countryId => {
                              const country = countries.find(c => c.id === countryId);
                              return (
                                <span key={countryId} className={styles.tag}>
                                  {country ? country.name : countryId}
                                </span>
                              );
                            })}
                          </div>
                        ) : '(Chưa chọn)'}
                      </div>
                    </div>
                    
                    <h3 className={styles.previewTitle}>Thông tin chi tiết</h3>
                    <div className={styles.previewItem}>
                      <div className={styles.previewLabel}>Nội dung:</div>
                      <div className={styles.previewValue}>
                        {movie.content || '(Chưa nhập)'}
                      </div>
                    </div>
                    <div className={styles.previewItem}>
                      <div className={styles.previewLabel}>Đạo diễn:</div>
                      <div className={styles.previewValue}>
                        {Array.isArray(movie.director) && movie.director.length > 0 ? movie.director.join(', ') : '(Chưa nhập)'}
                      </div>
                    </div>
                    <div className={styles.previewItem}>
                      <div className={styles.previewLabel}>Diễn viên:</div>
                      <div className={styles.previewValue}>
                        {Array.isArray(movie.actor) && movie.actor.length > 0 ? movie.actor.join(', ') : '(Chưa nhập)'}
                      </div>
                    </div>
                    <div className={styles.previewItem}>
                      <div className={styles.previewLabel}>Loại phim:</div>
                      <div className={styles.previewValue}>
                        {movie.type === 'movie' ? 'Phim lẻ' : movie.type === 'series' ? 'Phim bộ' : movie.type === 'tvshow' ? 'TV Show' : 'Hoạt hình'}
                      </div>
                    </div>
                    <div className={styles.previewItem}>
                      <div className={styles.previewLabel}>Trạng thái:</div>
                      <div className={styles.previewValue}>
                        {movie.status === 'completed' ? 'Hoàn tất' : movie.status === 'ongoing' ? 'Đang chiếu' : 'Sắp chiếu'}
                      </div>
                    </div>
                    
                    <h3 className={styles.previewTitle}>Thông tin tập phim</h3>
                    <div className={styles.previewItem}>
                      <div className={styles.previewLabel}>Số tập:</div>
                      <div className={styles.previewValue}>
                        {`${movie.episode_current} - Tổng cộng: ${movie.episode_total}`}
                      </div>
                    </div>
                    <div className={styles.previewItem}>
                      <div className={styles.previewLabel}>Server phim:</div>
                      <div className={styles.previewValue}>
                        {movie.episodes.length} server với tổng cộng {movie.episodes.reduce((total, server) => total + server.server_data.length, 0)} tập
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Navigation */}
            <div className={styles.formNavigation}>
              {activeTab !== formSteps[0].id && (
                <button 
                  type="button" 
                  onClick={goToPrevTab}
                  className={styles.navButtonPrev}
                >
                  <FaArrowLeft className={styles.navButtonIcon} /> 
                  Quay lại
                </button>
              )}
              
              {activeTab !== formSteps[formSteps.length - 1].id ? (
                <button 
                  type="button"
                  onClick={goToNextTab}
                  className={styles.navButtonNext}
                >
                  Tiếp theo
                </button>
              ) : (
                <button 
                  type="submit"
                  className={styles.saveButton}
                  disabled={loading}
                >
                  <FaSave className={styles.saveButtonIcon} />
                  {loading ? 'Đang lưu...' : 'Lưu phim'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AddMovie;