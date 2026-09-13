export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const endpoints = {
  movies: {
    detail: (slug) => `${API_URL}/movies/${slug}`,
    related: (category, limit) => `${API_URL}/movies?category=${category}&limit=${limit}`,
    search: (query) => `${API_URL}/movies/search?q=${query}`
  },
  crawl: {
    movies: () => `${API_URL}/crawl/movies`,
    moviesAll: () => `${API_URL}/crawl/moviesall`
  },
  history: {
    getAll: (limit = 10, page = 1) => `${API_URL}/history?limit=${limit}&page=${page}`,
    add: () => `${API_URL}/history`,
    addById: (movieId) => `${API_URL}/history/${movieId}`,
    delete: (historyId) => `${API_URL}/history/${historyId}`,
    clear: () => `${API_URL}/history/clear`,
    getUserHistory: (userId, limit = 10, page = 1) => `${API_URL}/users/${userId}/history?limit=${limit}&page=${page}`
  },
  favorites: {
    getAll: () => `${API_URL}/favorites`,
    add: () => `${API_URL}/favorites`,
    remove: (movieId) => `${API_URL}/favorites/${movieId}`,
    check: (movieSlug) => `${API_URL}/favorites/check?movieSlug=${movieSlug}`
  },
  search: {
    find: () => `${API_URL}/search`
  },
  admin: {
    movies: {
      getAll: (page = 1, limit = 10) => `${API_URL}/admin/movies?page=${page}&limit=${limit}`,
      getById: (id) => `${API_URL}/admin/movies/${id}`,
      create: () => `${API_URL}/admin/movies`,
      update: (id) => `${API_URL}/admin/movies/${id}`,
      delete: (id) => `${API_URL}/admin/movies/${id}`,
      uploadThumbnail: (id) => `${API_URL}/admin/movies/${id}/thumbnail`,
      toggleVisibility: (id) => `${API_URL}/admin/movies/${id}/visibility`
    },
    users: {
      getAll: (page = 1, limit = 10) => `${API_URL}/admin/users?page=${page}&limit=${limit}`,
      getById: (id) => `${API_URL}/admin/users/${id}`,
      create: () => `${API_URL}/admin/users`,
      update: (id) => `${API_URL}/admin/users/${id}`,
      delete: (id) => `${API_URL}/admin/users/${id}`,      
      updateRole: (id) => `${API_URL}/admin/users/${id}/role`,
      ban: (id) => `${API_URL}/admin/users/${id}/ban`,
      unban: (id) => `${API_URL}/admin/users/${id}/unban`,
      toggleStatus: (id) => `${API_URL}/admin/users/${id}/toggle-status`,
      uploadAvatar: (id) => `${API_URL}/admin/users/${id}/avatar`
    },
    roles: {
      getAll: () => `${API_URL}/admin/roles`
    },
    accountTypes: {
      getAll: () => `${API_URL}/admin/account-types`
    },
    dashboard: {
      stats: () => `${API_URL}/admin/dashboard/stats`,
      recentMovies: () => `${API_URL}/admin/dashboard/recent-movies`,
      topMovies: () => `${API_URL}/admin/dashboard/top-movies`
    },
    premium: {
      getAllPackages: () => `${API_URL}/subscription/packages`,
      getPackageById: (id) => `${API_URL}/subscription/packages/${id}`,
      createPackage: () => `${API_URL}/subscription/admin/packages`,
      updatePackage: (id) => `${API_URL}/subscription/admin/packages/${id}`,
      deletePackage: (id) => `${API_URL}/subscription/admin/packages/${id}`,
      getAllSubscriptions: () => `${API_URL}/subscription/admin/subscriptions`,
      getPendingSubscriptions: () => `${API_URL}/subscription/admin/pending-subscriptions`,
      approveSubscription: (subscriptionId) => `${API_URL}/subscription/admin/approve/${subscriptionId}`,
      rejectSubscription: (subscriptionId) => `${API_URL}/subscription/admin/reject/${subscriptionId}`
    }
  }
};