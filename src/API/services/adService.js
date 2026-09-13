// Tệp này quản lý các lệnh gọi API và logic liên quan đến quảng cáo

// Nhập cấu hình API của chúng ta
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Bộ nhớ đệm để ngăn chặn nhiều yêu cầu giống hệt nhau
const requestCache = {
  videoAd: null,
  videoAdTimestamp: 0,
  bannerTopAd: null,
  bannerTopTimestamp: 0,
  bannerBottomAd: null,
  bannerBottomTimestamp: 0,
  // Xóa bộ nhớ đệm sau 5 phút (300000ms)
  cacheDuration: 300000
};

const adService = {  // Lấy một quảng cáo video ngẫu nhiên để hiển thị trước nội dung
  getRandomVideoAd: async () => {
    try {
      // Kiểm tra xem chúng ta có quảng cáo video trong bộ nhớ đệm chưa hết hạn không
      const now = Date.now();
      if (requestCache.videoAd && 
          (now - requestCache.videoAdTimestamp) < requestCache.cacheDuration) {
        console.log('Using cached video ad to prevent switching during playback');
        return requestCache.videoAd;
      }
      
      console.log('Fetching new video ad from server...');
      const response = await axios.get(`${API_URL}/advertisements/random?type=video`);
      if (response.data.success && response.data.advertisement) {
        // Lưu trữ trong bộ nhớ đệm với dấu thời gian
        requestCache.videoAd = response.data.advertisement;
        requestCache.videoAdTimestamp = now;
        return response.data.advertisement;
      }
      console.log('No video ad available from server');
      return null; // Trả về null thay vì quảng cáo dự phòng
    } catch (error) {
      console.error('Error fetching video ad:', error);
      return null; // Trả về null khi có lỗi thay vì sử dụng quảng cáo dự phòng
    }
  },
  
  // Lấy quảng cáo biểu ngữ cho màn hình chính (vị trí trên cùng)
  getTopBannerAd: async () => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/random?type=banner_top`);
      if (response.data.success && response.data.advertisement) {
        return response.data.advertisement;
      }
      return null; // Không có quảng cáo biểu ngữ để hiển thị cũng không sao
    } catch (error) {
      console.error('Error fetching top banner ad:', error);
      return null;
    }
  },
  
  // Lấy quảng cáo biểu ngữ cho màn hình chính (vị trí dưới cùng)
  getBottomBannerAd: async () => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/random?type=banner_bottom`);
      if (response.data.success && response.data.advertisement) {
        return response.data.advertisement;
      }
      return null; // Không có quảng cáo biểu ngữ để hiển thị cũng không sao
    } catch (error) {
      console.error('Error fetching bottom banner ad:', error);
      return null;
    }
  },
  // Lấy nhiều quảng cáo biểu ngữ cho một vị trí cụ thể
  getMultipleBannerAds: async (position = 'top', limit = 3) => {
    try {
      const type = position === 'top' ? 'banner_top' : 'banner_bottom';
      const response = await axios.get(`${API_URL}/advertisements/random?type=${type}&limit=${limit}`);
      if (response.data.success && response.data.advertisements && response.data.advertisements.length > 0) {
        return response.data.advertisements;
      }
      // Cố gắng lấy ít nhất một quảng cáo nếu không có nhiều quảng cáo
      const singleAd = await (position === 'top' ? adService.getTopBannerAd() : adService.getBottomBannerAd());
      return singleAd ? [singleAd] : [];
    } catch (error) {
      console.error(`Error fetching multiple ${position} banner ads:`, error);
      return [];
    }
  },
    // Lấy nhiều quảng cáo video (giới hạn mặc định là 1 để đảm bảo chỉ có một quảng cáo tại một thời điểm)
  getMultipleVideoAds: async (limit = 1) => {
    try {
      // Luôn sử dụng bộ nhớ đệm cho quảng cáo đầu tiên nếu có để tránh chuyển đổi
      const now = Date.now();
      if (limit === 1 && requestCache.videoAd && 
          (now - requestCache.videoAdTimestamp) < requestCache.cacheDuration) {
        console.log('Using cached video ad in getMultipleVideoAds to prevent switching');
        return [requestCache.videoAd];
      }
      
      console.log('Fetching multiple video ads from server...');
      const response = await axios.get(`${API_URL}/advertisements/random?type=video&limit=${limit}`);
      if (response.data.success && response.data.advertisements && response.data.advertisements.length > 0) {
        // Lưu trữ quảng cáo đầu tiên trong bộ nhớ đệm
        if (response.data.advertisements.length > 0) {
          requestCache.videoAd = response.data.advertisements[0];
          requestCache.videoAdTimestamp = now;
        }
        return response.data.advertisements;
      }
      
      // Dự phòng cho quảng cáo video đơn nếu điểm cuối nhiều quảng cáo không trả về một mảng
      const singleAd = await adService.getRandomVideoAd();
      return singleAd ? [singleAd] : [];
    } catch (error) {
      console.error('Error fetching multiple video ads:', error);
      return [];
    }
  },
    // Ghi lại rằng một quảng cáo đã được xem (cho mục đích phân tích)
  trackAdImpression: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/view`, { adId });
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      return false;
    }
  },
  
  // Ghi lại rằng một quảng cáo đã được nhấp (cho mục đích phân tích)
  trackAdClick: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/click`, { adId });
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad click:', error);
      return false;
    }
  },
  
  // Ghi lại rằng một quảng cáo đã bị bỏ qua (cho mục đích phân tích)
  trackAdSkip: async (adId) => {
    try {
      const response = await axios.post(`${API_URL}/advertisements/skip`, { adId });
      return response.data.success;
    } catch (error) {
      console.error('Error tracking ad skip:', error);
      return false;
    }
  },
  // Dành cho Quản trị viên: Lấy tất cả quảng cáo với tùy chọn lọc
  getAllAds: async (page = 1, limit = 10, type = null, active = null) => {
    try {
      let url = `${API_URL}/advertisements?page=${page}&limit=${limit}`;
      if (type) url += `&type=${type}`;
      if (active !== null) url += `&active=${active}`;
      
      // Dành cho phát triển: thêm một chút chậm trễ để mô phỏng độ trễ mạng và phát hiện các sự cố hết thời gian chờ
      // await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching all ads:', error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.response) {
        // Máy chủ đã phản hồi với mã trạng thái lỗi
        console.log('Server error:', error.response.status, error.response.data);
      } else if (error.request) {
        // Yêu cầu đã được thực hiện nhưng không nhận được phản hồi
        console.log('Network error - no response received');
      } else {
        // Một cái gì đó khác đã gây ra lỗi
        console.log('Error setting up request:', error.message);
      }
      
      // Trả về phản hồi lỗi có cấu trúc thay vì ném lỗi
      return {
        success: false,
        advertisements: [],
        totalPages: 1,
        error: error.message || 'Network error when fetching advertisements'
      };
    }
  },
  
  // Dành cho Quản trị viên: Lấy một quảng cáo đơn lẻ theo ID
  getAdById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/advertisements/${id}`);
      return response.data.advertisement;
    } catch (error) {
      console.error('Error fetching ad by ID:', error);
      throw error;
    }
  },
  // Dành cho Quản trị viên: Tạo quảng cáo mới
  createAd: async (adData) => {
    try {
      console.log('Creating ad with data:', adData);
      const response = await axios.post(`${API_URL}/advertisements`, adData);
      console.log('Create ad response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating ad:', error);
      
      // Xử lý lỗi nâng cao
      if (error.response) {
        // Yêu cầu đã được thực hiện và máy chủ đã phản hồi với mã trạng thái
        // nằm ngoài phạm vi 2xx
        console.log('Server error response:', error.response.status, error.response.data);
        return {
          success: false,
          error: error.response.data?.message || `Server error: ${error.response.status}`,
          details: error.response.data
        };
      } else if (error.request) {
        // Yêu cầu đã được thực hiện nhưng không nhận được phản hồi
        console.log('No response received:', error.request);
        return {
          success: false,
          error: 'No response received from server'
        };
      } else {
        // Đã xảy ra sự cố khi thiết lập yêu cầu gây ra Lỗi
        return {
          success: false,
          error: error.message || 'Unknown error when creating advertisement'
        };
      }
    }
  },
  
  // Dành cho Quản trị viên: Cập nhật quảng cáo hiện có
  updateAd: async (id, adData) => {
    try {
      const response = await axios.put(`${API_URL}/advertisements/${id}`, adData);
      return response.data;
    } catch (error) {
      console.error('Error updating ad:', error);
      // Trả về phản hồi lỗi thay vì ném lỗi
      return {
        success: false,
        error: error.message || 'Network error when updating advertisement'
      };
    }  },
  
  // Dành cho Quản trị viên: Xóa quảng cáo
  deleteAd: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/advertisements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting ad:', error);
      // Trả về phản hồi lỗi thay vì ném lỗi
      return {
        success: false,
        error: error.message || 'Network error when deleting advertisement'
      };
    }
  },
  
  // Xóa bộ nhớ đệm quảng cáo để buộc tìm nạp quảng cáo mới
  clearCache: () => {
    console.log('Clearing ad service cache');
    requestCache.videoAd = null;
    requestCache.videoAdTimestamp = 0;
    requestCache.bannerTopAd = null;
    requestCache.bannerTopTimestamp = 0;
    requestCache.bannerBottomAd = null;
    requestCache.bannerBottomTimestamp = 0;
    return true;
  }
};

export default adService;
