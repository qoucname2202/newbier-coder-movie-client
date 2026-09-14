/**
 * @file MovieList.js
 * @description Container component that manages movie category rails on the homepage.
 */

import React, { useState } from 'react';
import MovieCategory from './MovieCategory';
import { MOVIE_CONFIG } from '../../config/movieConfig';

/**
 * Generates initial category list from centralized movie configuration.
 * @returns {Array<Object>} Array of category definitions for display.
 */
const getDefaultCategories = () => {
  return [
    {
      id: MOVIE_CONFIG.categories.new.id,
      title: MOVIE_CONFIG.categories.new.title,
      endpoint: MOVIE_CONFIG.categories.new.endpoint
    }
  ];
};

/**
 * MovieList component renders category sections with horizontal carousels.
 * @returns {JSX.Element} Rendered movie category sections.
 */
const MovieList = () => {
  const [categories] = useState(getDefaultCategories);

  return (
    <div className="container-fluid movie-list-container">
      {categories.map((category) => (
        <MovieCategory
          key={category.id}
          title={category.title}
          endpoint={category.endpoint}
        />
      ))}

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: #0d1117;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(13, 17, 23, 0.6);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(70, 70, 90, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(90, 90, 115, 0.8);
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(70, 70, 90, 0.5) rgba(13, 17, 23, 0.6);
        }

        .movie-list-container {
          padding-left: 0;
          padding-right: 0;
          max-width: 100%;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
};

export default MovieList;
