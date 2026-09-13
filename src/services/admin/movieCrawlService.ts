// src/services/admin/movieCrawlService.ts
import axiosInstance from '../../API/config/axiosConfig';
import { endpoints } from '../../config/API';

export interface CrawlResponse {
  message: string;
  data: {
    allMovies?: any[];
    errors?: any[];
    totalCrawled?: number;
    totalErrors?: number;
  };
}

class MovieCrawlService {
  // Crawl movies from a specific page
  async crawlMovies(page: number = 1): Promise<CrawlResponse> {
    try {
      const response = await axiosInstance.post(`${endpoints.crawl.movies()}?page=${page}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to crawl movies');
    }
  }

  // Crawl all movies from all pages
  async crawlAllMovies(): Promise<CrawlResponse> {
    try {
      const response = await axiosInstance.post(endpoints.crawl.moviesAll());
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to crawl all movies');
    }
  }
}

export default new MovieCrawlService();
