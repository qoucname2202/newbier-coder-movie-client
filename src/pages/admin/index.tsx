// src/pages/admin/index.tsx

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/AdminDashboard.module.css';
import { FaFilm, FaChartLine, FaUserPlus, FaChartPie, FaArrowRight, FaEye, FaEdit, FaClock, FaEnvelope, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { getDashboardStats, getAnalyticsData, getFeedbackStats } from '@/API/services/admin/dashboardService';
import { getReportStats } from '@/API/services/admin/reportService'; 
import AdminLayout from '@/components/Layout/AdminLayout';
import AdminRoute from '@/components/ProtectedRoute/AdminRoute';
import dynamic from 'next/dynamic';

// Dynamically import charts to prevent server-side rendering errors
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Import the types from apexcharts
import ApexCharts from 'apexcharts';
import { NextPageWithLayout } from '@/types/next';

// Define ApexOptions type
type ApexOptions = ApexCharts.ApexOptions;

const AdminDashboardPage: NextPageWithLayout = () => {
  const [statistics, setStatistics] = useState({
    totalMovies: 0,
    engagementRate: '0%',
    newUsers: 0,
    reports: 0,
    feedback: {
      total: 0,
      unread: 0
    }
  });

  const [analyticsData, setAnalyticsData] = useState({
    viewsByDay: {
      labels: [],
      data: []
    },
    genreDistribution: {
      labels: [],
      data: []
    },
    recentMovies: []
  });
  // Định nghĩa các interface cho cấu trúc dữ liệu phản hồi
interface FeedbackTypeItem {
  _id: string;
  count: number;
}

interface FeedbackStatusItem {
  _id: string;
  count: number;
}

// Define Movie interface
interface Movie {
  _id: string;
  title: string;
  poster?: string;
  createdAt: string;
  views?: number;
}

// Define Feedback interface for recent feedbacks
interface Feedback {
  _id: string;
  subject: string;
  name: string;
  type: string;
  isRead: boolean;
  status: string;
  createdAt: string;
}

const [feedbackData, setFeedbackData] = useState({
    recent: [] as Feedback[],
    byType: [] as FeedbackTypeItem[],
    byStatus: [] as FeedbackStatusItem[],
    byDay: {
      labels: [] as string[],
      data: [] as number[]
    }
  });
  
  const [reportData, setReportData] = useState({
    total: 0,
    new: 0,
    byStatus: {
      pending: 0,
      'in-progress': 0,
      resolved: 0,
      rejected: 0
    },
    byType: {}
  });

  const [activeChartFilter, setActiveChartFilter] = useState('week');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardStats, analytics, feedbackStats, reportStats] = await Promise.all([
          getDashboardStats(),
          getAnalyticsData(),
          getFeedbackStats(),
          getReportStats()
        ]);

        setStatistics(dashboardStats);
        setAnalyticsData(analytics);
        setFeedbackData(feedbackStats);
        setReportData(reportStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Chart options for view trends
  const viewsChartOptions: ApexOptions = {
    chart: {
      type: 'area' as const,
      toolbar: {
        show: false
      },
      fontFamily: 'inherit',
    },
    colors: ['#3498db'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 5,
      padding: {
        right: 20,
        left: 20
      }
    },
    xaxis: {
      categories: analyticsData.viewsByDay.labels,
      labels: {
        style: {
          colors: '#718096',
          fontFamily: 'inherit'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#718096',
          fontFamily: 'inherit'
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value: number) => `${value} views`
      }
    }
  };

  const viewsChartSeries = [
    {
      name: 'Views',
      data: analyticsData.viewsByDay.data
    }
  ];

  // Chart options for genre distribution
  const genreChartOptions: ApexOptions = {
    chart: {
      type: 'donut' as const,
      fontFamily: 'inherit',
    },
    colors: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e'],
    labels: analyticsData.genreDistribution.labels,
    legend: {
      position: 'bottom',
      fontFamily: 'inherit'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const genreChartSeries = analyticsData.genreDistribution.data;

  // Chart options for feedback by day
  const feedbackChartOptions: ApexOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: {
        show: false
      },
      fontFamily: 'inherit',
    },
    colors: ['#9b59b6'],
    fill: {
      opacity: 0.8
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 5,
      padding: {
        right: 20,
        left: 20
      }
    },
    xaxis: {
      categories: feedbackData.byDay.labels,
      labels: {
        style: {
          colors: '#718096',
          fontFamily: 'inherit'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#718096',
          fontFamily: 'inherit'
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value: number) => `${value} feedback`
      }
    }
  };

  const feedbackChartSeries = [
    {
      name: 'Feedback',
      data: feedbackData.byDay.data
    }
  ];

  // Chart options for feedback by type
  const feedbackTypeChartOptions: ApexOptions = {
    chart: {
      type: 'pie' as const,
      fontFamily: 'inherit',
    },
    colors: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'],
    labels: feedbackData.byType.map(item => item._id || 'Không xác định'),
    legend: {
      position: 'bottom',
      fontFamily: 'inherit'
    },
    dataLabels: {
      enabled: false
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 250
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const feedbackTypeChartSeries = feedbackData.byType.map(item => item.count || 0);

  // Filter buttons for charts
  const chartFilters = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' }
  ];

  return (
    <>
      <Head>
        <title>Dashboard - Admin Panel</title>
      </Head>

      <div className={styles.container}>
        <section className={styles.header}>
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h1 className={styles.headerTitle}>Dashboard Overview</h1>
                <p className={styles.headerSubtitle}>Welcome back! </p>
              </div>
              <div className="col-md-6">
                <ol className={`breadcrumb float-md-end ${styles.breadcrumb}`}>
                  <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
                  <li className="breadcrumb-item active">Dashboard</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.dashboardSection} content`}>
          <div className="container-fluid">
            <div className="row">
              <div className="col-lg-3 col-md-6 col-12 mb-4">
                <div className={`${styles.statsCard} ${styles.info}`}>
                  <div className={styles.statsInner}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <h3 className={styles.statsTitle}>{statistics.totalMovies.toLocaleString()}</h3>
                    )}
                    <p className={styles.statsSubtitle}>Total Movies</p>
                  </div>
                  <FaFilm className={styles.statsIcon} />
                  <Link href="/admin/movies" className={styles.statsFooter}>
                    View Details <FaArrowRight />
                  </Link>
                </div>
              </div>

              <div className="col-lg-3 col-md-6 col-12 mb-4">
                <div className={`${styles.statsCard} ${styles.success}`}>
                  <div className={styles.statsInner}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <h3 className={styles.statsTitle}>{statistics.engagementRate}<span style={{ fontSize: '1.4rem', opacity: 0.9}}>👁/User</span></h3>
                      
                    )}
                    <p className={styles.statsSubtitle}>Interaction rate in 1 week</p>
                  </div>
                  <FaChartLine className={styles.statsIcon} />
                  
                </div>
              </div>

              <div className="col-lg-3 col-md-6 col-12 mb-4">
                <div className={`${styles.statsCard} ${styles.warning}`}>
                  <div className={styles.statsInner}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <h3 className={styles.statsTitle}>{statistics.newUsers}</h3>
                    )}
                    <p className={styles.statsSubtitle}>New Users</p>
                  </div>
                  <FaUserPlus className={styles.statsIcon} />
                  <Link href="/admin/users" className={styles.statsFooter}>
                    View Details <FaArrowRight />
                  </Link>
                </div>
              </div>

              <div className="col-lg-3 col-md-6 col-12 mb-4">
                <div className={`${styles.statsCard} ${styles.danger}`}>
                  <div className={styles.statsInner}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <h3 className={styles.statsTitle}>{statistics.reports}</h3>
                    )}
                    <p className={styles.statsSubtitle}>Reports</p>
                  </div>
                  <FaChartPie className={styles.statsIcon} />
                  <Link href="/admin/reports" className={styles.statsFooter}>
                    View Details <FaArrowRight />
                  </Link>
                </div>
              </div>
            </div>

            {/* Add Feedback Card */}
            <div className="row mt-3">
              <div className="col-lg-6 col-md-6 col-12 mb-4">
                <div className={`${styles.statsCard} ${styles.purple}`}>
                  <div className={styles.statsInner}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <h3 className={styles.statsTitle}>{statistics.feedback?.total || 0}</h3>
                    )}
                    <p className={styles.statsSubtitle}>Total Feedbacks</p>
                  </div>
                  <FaEnvelope className={styles.statsIcon} />
                  <Link href="/admin/feedback" className={styles.statsFooter}>
                    View Details <FaArrowRight />
                  </Link>
                </div>
              </div>
              
              <div className="col-lg-6 col-md-6 col-12 mb-4">
                <div className={styles.feedbackCard}>
                  <div className={styles.feedbackCardTop}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <div className={styles.feedbackStatItem}>
                        <span className={styles.feedbackNumber}>{statistics.feedback?.unread || 0}</span>
                        <span className={styles.feedbackTitle}>UNREAD FEEDBACKS</span>
                        {statistics.feedback?.unread > 0 && 
                          <span className={styles.badgeUnread}>New</span>
                        }
                      </div>
                    )}
                  </div>
                  <div className={styles.feedbackCardBottom}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <div className={styles.feedbackStatItem}>
                        <span className={styles.feedbackNumber}>
                          {feedbackData.byStatus.find(item => item._id === 'resolved')?.count || 0}
                        </span>
                        <span className={styles.feedbackTitle}>RESOLVED FEEDBACKS</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.feedbackCardActions}>
                    <Link href="/admin/feedback?filter=unread" className={styles.feedbackCardActionBtn}>
                      View Unread <FaArrowRight />
                    </Link>
                    <Link href="/admin/feedback?filter=resolved" className={styles.feedbackCardActionBtn}>
                      View Resolved <FaArrowRight />
                    </Link>
                  </div>
                </div>
              </div>            </div>
            
            {/* Add Reports Card */}
            <div className="row mt-3">
              <div className="col-lg-6 col-md-6 col-12 mb-4">
                <div className={`${styles.statsCard} ${styles.danger}`}>
                  <div className={styles.statsInner}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <h3 className={styles.statsTitle}>{reportData.total || 0}</h3>
                    )}
                    <p className={styles.statsSubtitle}>Total Reports</p>
                  </div>
                  <FaExclamationTriangle className={styles.statsIcon} />
                  <Link href="/admin/reports" className={styles.statsFooter}>
                    View Details <FaArrowRight />
                  </Link>
                </div>
              </div>
              
              <div className="col-lg-6 col-md-6 col-12 mb-4">
                <div className={styles.feedbackCard}>
                  <div className={styles.feedbackCardTop}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <div className={styles.feedbackStatItem}>
                        <span className={styles.feedbackNumber}>{reportData.byStatus.pending || 0}</span>
                        <span className={styles.feedbackTitle}>PENDING REPORTS</span>
                        {(reportData.byStatus.pending > 0) && 
                          <span className={styles.badgeUnread}>Action Needed</span>
                        }
                      </div>
                    )}
                  </div>
                  <div className={styles.feedbackCardBottom}>
                    {loading ? (
                      <div className={styles.loadingPlaceholder}></div>
                    ) : (
                      <div className={styles.feedbackStatItem}>
                        <span className={styles.feedbackNumber}>
                          {reportData.byStatus.resolved || 0}
                        </span>
                        <span className={styles.feedbackTitle}>RESOLVED REPORTS</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.feedbackCardActions}>
                    <Link href="/admin/reports?status=pending" className={styles.feedbackCardActionBtn}>
                      View Pending <FaArrowRight />
                    </Link>
                    <Link href="/admin/reports?status=resolved" className={styles.feedbackCardActionBtn}>
                      View Resolved <FaArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row">
              {/* Views Chart */}
              <div className="col-lg-8 mb-4">
                <div className={styles.chartContainer}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Views Trend</h3>
                    <div className={styles.chartActions}>
                      {chartFilters.map(filter => (
                        <button
                          key={filter.id}
                          className={`${styles.chartFilterButton} ${activeChartFilter === filter.id ? styles.chartFilterButtonActive : ''}`}
                          onClick={() => setActiveChartFilter(filter.id)}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {loading ? (
                    <div className={styles.loadingPlaceholder} style={{ height: '300px' }}></div>
                  ) : (
                    <div id="viewsChart">
                      {typeof window !== 'undefined' && (
                        <Chart
                          options={viewsChartOptions}
                          series={viewsChartSeries}
                          type="area"
                          height={350}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Genre Distribution Chart */}
              <div className="col-lg-4 mb-4">
                <div className={styles.chartContainer}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Genre Distribution</h3>
                  </div>
                  {loading ? (
                    <div className={styles.loadingPlaceholder} style={{ height: '300px' }}></div>
                  ) : (
                    <div id="genreChart">
                      {typeof window !== 'undefined' && (
                        <Chart
                          options={genreChartOptions}
                          series={genreChartSeries}
                          type="donut"
                          height={350}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              {/* Feedback by Day Chart */}
              <div className="col-lg-8 mb-4">
                <div className={styles.chartContainer}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Feedback Trends</h3>
                  </div>
                  {loading ? (
                    <div className={styles.loadingPlaceholder} style={{ height: '300px' }}></div>
                  ) : (
                    <div id="feedbackChart">
                      {typeof window !== 'undefined' && (
                        <Chart
                          options={feedbackChartOptions}
                          series={feedbackChartSeries}
                          type="bar"
                          height={300}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback by Type Chart */}
              <div className="col-lg-4 mb-4">
                <div className={styles.chartContainer}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Feedback by Type</h3>
                  </div>
                  {loading ? (
                    <div className={styles.loadingPlaceholder} style={{ height: '300px' }}></div>
                  ) : (
                    <div id="feedbackTypeChart">
                      {typeof window !== 'undefined' && (
                        <Chart
                          options={feedbackTypeChartOptions}
                          series={feedbackTypeChartSeries}
                          type="pie"
                          height={300}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              {/* Recent Movies */}
              <div className="col-lg-6">
                <div className={styles.recentItemsContainer}>
                  <div className={styles.recentItemsHeader}>
                    <h3 className={styles.recentItemsTitle}>Recent Movies</h3>
                    <Link href="/admin/movies" className={styles.recentItemsViewAll}>
                      View All <FaArrowRight />
                    </Link>
                  </div>
                  
                  {loading ? (
                    <>
                      <div className={styles.loadingPlaceholder} style={{ marginBottom: '15px' }}></div>
                      <div className={styles.loadingPlaceholder} style={{ marginBottom: '15px' }}></div>
                    </>
                  ) : (
                    <>                      {analyticsData.recentMovies && analyticsData.recentMovies.length > 0 ? (
                        analyticsData.recentMovies.slice(0, 3).map((movie: Movie, index: number) => (
                          <div className={styles.recentItem} key={index}>
                            <div className={styles.recentItemImage}>
                              {movie.poster && (
                                <Image 
                                  src={movie.poster} 
                                  alt={movie.title} 
                                  width={50} 
                                  height={50}
                                  style={{ objectFit: 'cover' }}
                                />
                              )}
                            </div>
                            <div className={styles.recentItemContent}>
                              <h4 className={styles.recentItemTitle}>{movie.title}</h4>
                              <div className={styles.recentItemMeta}>
                                <span><FaClock /> {new Date(movie.createdAt).toLocaleDateString()}</span>
                                <span><FaEye /> {movie.views || 0} views</span>
                              </div>
                            </div>
                            <div className={styles.recentItemActions}>
                              <Link href={`/admin/movies/edit/${movie._id}`} className={styles.recentItemButton}>
                                <FaEdit />
                              </Link>
                              <Link href={`/admin/movies/view/${movie._id}`} className={styles.recentItemButton}>
                                <FaEye />
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No recent movies found</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Recent Feedbacks */}
              <div className="col-lg-6">
                <div className={styles.recentItemsContainer}>
                  <div className={styles.recentItemsHeader}>
                    <h3 className={styles.recentItemsTitle}>Recent Feedbacks</h3>
                    <Link href="/admin/feedback" className={styles.recentItemsViewAll}>
                      View All <FaArrowRight />
                    </Link>
                  </div>
                  
                  {loading ? (
                    <>
                      <div className={styles.loadingPlaceholder} style={{ marginBottom: '15px' }}></div>
                      <div className={styles.loadingPlaceholder} style={{ marginBottom: '15px' }}></div>
                    </>
                  ) : (
                    <>                      {feedbackData.recent && feedbackData.recent.length > 0 ? (
                        feedbackData.recent.slice(0, 3).map((feedback: Feedback, index: number) => (
                          <div className={styles.recentItem} key={index}>
                            <div className={`${styles.recentItemImage} ${styles.feedbackIcon}`}>
                              {feedback.isRead ? (
                                <FaEnvelope />
                              ) : (
                                <FaEnvelope className={styles.unreadIcon} />
                              )}
                            </div>
                            <div className={styles.recentItemContent}>
                              <h4 className={styles.recentItemTitle}>
                                {feedback.subject}
                                {!feedback.isRead && <span className={styles.unreadBadge}>New</span>}
                              </h4>
                              <div className={styles.recentItemMeta}>
                                <span><b>From:</b> {feedback.name}</span>
                                <span><b>Type:</b> {feedback.type}</span>
                                <span><FaClock /> {new Date(feedback.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className={styles.recentItemActions}>
                              <Link href={`/admin/feedback/${feedback._id}`} className={styles.recentItemButton}>
                                <FaEye />
                              </Link>
                              {feedback.status === 'pending' && (
                                <span className={`${styles.statusBadge} ${styles.pendingBadge}`}>
                                  <FaExclamationTriangle /> Pending
                                </span>
                              )}
                              {feedback.status === 'reviewed' && (
                                <span className={`${styles.statusBadge} ${styles.reviewedBadge}`}>
                                  <FaEye /> Reviewed
                                </span>
                              )}
                              {feedback.status === 'resolved' && (
                                <span className={`${styles.statusBadge} ${styles.resolvedBadge}`}>
                                  <FaCheckCircle /> Resolved
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No recent feedbacks found</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

// Thêm getLayout để sử dụng AdminLayout với bảo vệ admin
AdminDashboardPage.getLayout = (page: React.ReactElement) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default AdminDashboardPage;