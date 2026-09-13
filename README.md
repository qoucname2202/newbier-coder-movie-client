# 🎬 Movie Streaming Platform - Đồ Án Cuối Khóa

## Giới thiệu dự án
Đây là một ứng dụng streaming phim trực tuyến hoàn chỉnh được xây dựng bằng **Next.js** (Frontend) và **Node.js/Express** (Backend). Dự án bao gồm đầy đủ các tính năng của một nền tảng xem phim hiện đại với hệ thống quản lý, quảng cáo, và thanh toán.

## 🏗️ Kiến trúc hệ thống

### Frontend (Next.js)
- **Framework:** Next.js 14 với TypeScript
- **UI Libraries:** React Bootstrap, React Icons
- **Charts:** Chart.js, ApexCharts
- **Styling:** CSS Modules, Bootstrap 5.3.2
- **State Management:** React Hooks + Context API
- **Authentication:** JWT + Local Storage

### Backend (Node.js/Express)
- **Framework:** Express.js
- **Database:** MongoDB với Mongoose
- **Authentication:** JWT + bcryptjs
- **File Upload:** Cloudinary
- **Search Engine:** Elasticsearch
- **Email Service:** Nodemailer
- **Cron Jobs:** node-cron
- **API Documentation:** Swagger

## 📁 Cấu trúc thư mục

```
MovieStreaming/
├── frontend/                 # Frontend Next.js
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Layout/      # Layout components (Navbar, Footer)
│   │   │   ├── Movie/       # Movie-related components
│   │   │   ├── Admin/       # Admin panel components
│   │   │   └── UI/          # Reusable UI components
│   │   ├── pages/           # Next.js pages
│   │   │   ├── admin/       # Admin pages
│   │   │   ├── movie/       # Movie detail pages
│   │   │   └── index.js     # Homepage
│   │   ├── API/             # API service layer
│   │   ├── styles/          # CSS modules
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration files
│   └── public/              # Static assets
└── backend/                 # Backend Node.js
    ├── src/
    │   ├── controllers/     # Route controllers
    │   ├── models/          # MongoDB models
    │   ├── routes/          # API routes
    │   ├── services/        # Business logic
    │   ├── middlewares/     # Custom middlewares
    │   ├── utils/           # Utility functions
    │   └── config/          # Configuration
    └── scripts/             # Automation scripts
```

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- **Node.js:** v16.0.0 trở lên
- **MongoDB:** v4.4 trở lên
- **Git:** Latest version

### 1. Clone dự án
```bash
git clone <repository-url>
cd MovieStreaming
```

### 2. Cài đặt Backend
```bash
cd backend
npm install

# Tạo file .env
cp .env.example .env
```

**Cấu hình file .env cho Backend:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/moviestreaming
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Cloudinary (cho upload ảnh)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Elasticsearch (optional)
ELASTICSEARCH_NODE=http://localhost:9200
```

### 3. Cài đặt Frontend
```bash
cd frontend
npm install

# Cấu hình thư viện đã được cài sẵn:
# - dayjs (date manipulation)
# - react-chartjs-2 chart.js (charts)
# - xlsx (Excel export)
# - next-themes (theme switching)
# - admin-lte (admin UI)
```

**Cấu hình file .env.local cho Frontend:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name

# TMDB API (for actor/movie info)
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_AUTH_TOKEN=your_tmdb_token
```

### 4. Khởi chạy ứng dụng

**Chạy Backend:**
```bash
cd backend
npm start      # Production mode
```

**Chạy Frontend:**
```bash
cd frontend
npm run dev    # Development mode
# hoặc
npm run build && npm start  # Production mode
```

**Truy cập ứng dụng:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)
- API Documentation: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

## 🎯 Tính năng chính

### 👥 Người dùng thông thường
- ✅ Đăng ký/Đăng nhập
- ✅ Xem phim trực tuyến
- ✅ Tìm kiếm phim theo nhiều tiêu chí
- ✅ Đánh giá và bình luận phim
- ✅ Thêm phim vào danh sách yêu thích
- ✅ Lịch sử xem phim
- ✅ Gói premium/subscription
- ✅ Thông báo qua email

### 🛠️ Quản trị viên
- ✅ Dashboard thống kê
- ✅ Quản lý phim (CRUD)
- ✅ Quản lý người dùng
- ✅ Quản lý quảng cáo
- ✅ Quản lý gói premium
- ✅ Gửi email hàng loạt
- ✅ Thống kê chi tiết
- ✅ Export dữ liệu Excel

### 🤖 Tự động hóa
- ✅ Crawl phim từ nguồn external
- ✅ Kiểm tra gói premium hết hạn
- ✅ Gửi email thông báo tự động
- ✅ Backup dữ liệu định kỳ

## 📊 Công nghệ sử dụng

### Frontend Dependencies
```json
{
  "dependencies": {
    "next": "^14.2.25",
    "react": "^18.2.0",
    "react-bootstrap": "^2.10.9",
    "chart.js": "^4.4.9",
    "react-chartjs-2": "^5.3.0",
    "dayjs": "^1.11.13",
    "xlsx": "^0.18.5",
    "next-themes": "^0.4.6",
    "admin-lte": "^4.0.0-beta3",
    "axios": "^1.8.4",
    "react-slick": "^0.30.3",
    "sweetalert2": "^11.21.2"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^6.12.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^3.0.2",
    "cloudinary": "^2.6.0",
    "nodemailer": "^7.0.3",
    "node-cron": "^3.0.3",
    "@elastic/elasticsearch": "^7.17.14",
    "express-rate-limit": "^7.5.0",
    "swagger-ui-express": "^5.0.1"
  }
}
```

## 🔧 Scripts hữu ích

### Backend Scripts
```bash
# Crawl phim từ nguồn external
node scripts/movieCrawl.js

# Thêm gói premium mới
node scripts/addPremiumPackage.js

# Kiểm tra subscription hết hạn
node scripts/checkExpiredSubscriptions.js

# Gửi email hàng loạt
node scripts/sendBulkEmail.js

# Test cấu hình email
node scripts/testEmailConfig.js

# Upload logo lên Cloudinary
node scripts/uploadLogoToCloudinary.js
```

### Frontend Scripts
```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📚 API Documentation

Truy cập Swagger UI tại: `http://localhost:5000/api-docs`

**Các endpoint chính:**

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Thông tin user

### Movies
- `GET /api/movies` - Danh sách phim
- `GET /api/movies/:slug` - Chi tiết phim
- `POST /api/movies` - Thêm phim (admin)
- `PUT /api/movies/:id` - Cập nhật phim
- `DELETE /api/movies/:id` - Xóa phim

### Search
- `GET /api/search` - Tìm kiếm phim
- `GET /api/search/suggestions` - Gợi ý tìm kiếm

### Admin
- `GET /api/admin/dashboard/stats` - Thống kê
- `GET /api/admin/users` - Quản lý users
- `POST /api/admin/bulk-email` - Gửi email hàng loạt

## 🎨 Giao diện

### Trang chủ
- Hero banner với phim nổi bật
- Danh sách phim mới nhất
- Phim được xem nhiều nhất
- Phim sắp ra mắt

### Trang phim
- Trình phát video
- Thông tin chi tiết
- Đánh giá và bình luận
- Phim liên quan

### Admin Panel
- Dashboard với charts
- Quản lý dữ liệu với DataTables
- Export Excel/CSV
- Responsive design

## 🔒 Bảo mật

- ✅ JWT Authentication
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ CORS Configuration
- ✅ Password Hashing (bcrypt)
- ✅ Environment Variables
- ✅ Role-based Access Control

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build
npm run dev 

# Backend
cd backend
npm start
```

### Environment Variables
Đảm bảo cấu hình đúng các biến môi trường cho production:
- Database URLs
- JWT secrets
- API keys
- Email configuration

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📞 Hỗ trợ

Nếu gặp vấn đề trong quá trình cài đặt hoặc sử dụng:

1. Kiểm tra file `.env` đã cấu hình đúng
2. Đảm bảo MongoDB đang chạy
3. Kiểm tra port 3000 và 5000 không bị conflict
4. Xem logs trong terminal để debug

## 📝 Ghi chú

- Dự án này được xây dựng cho mục đích học tập
- Database mẫu có thể được import từ file `data/sample.json`
- Phim được crawl từ các nguồn công khai
- Tuân thủ bản quyền khi sử dụng

## 🏆 Kết luận

Đây là một dự án hoàn chỉnh thể hiện khả năng xây dựng ứng dụng web fullstack với:
- Architecture tốt (MVC pattern)
- Security practices
- Modern technologies
- Scalable design
- Production-ready code

---

**Happy Coding! 🎬✨**
