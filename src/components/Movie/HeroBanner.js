import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../../styles/HeroBanner.module.css';

const HeroBanner = () => {
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedMovie = async () => {
      try {
        const response = await fetch('https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=1');
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          // Get first item with a poster
          const movie = data.items.find(m => m.poster_url || m.thumb_url);
          setFeaturedMovie(movie);
        }
      } catch (error) {
        console.error('Error fetching featured movie:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMovie();
  }, []);

 
};

export default HeroBanner;
