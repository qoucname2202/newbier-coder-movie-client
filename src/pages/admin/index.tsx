// src/pages/admin/index.tsx

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/AdminDashboard.module.css';
import {
  FaFilm,
  FaChartLine,
  FaUserPlus,
  FaChartPie,
  FaArrowRight,
  FaEye,
  FaEdit,
  FaClock,
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import {
  getDashboardStats,
  getAnalyticsData,
  getFeedbackStats
} from '@/API/services/admin/dashboardService';
import { getReportStats } from '@/API/services/admin/reportService';
import AdminLayout from '@/components/Layout/AdminLayout';
import AdminRoute from '@/components/ProtectedRoute/AdminRoute';
import dynamic from 'next/dynamic';
import ApexCharts from 'apexcharts';
import { NextPageWithLayout } from '@/types/next';

// Dynamically import charts to prevent server-side rendering errors
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type ApexOptions = ApexCharts.ApexOptions;

interface FeedbackTypeItem {
  _id: string;
  count: number;
}

interface FeedbackStatusItem {
  _id: string;
  count: number;
}

interface Movie {
  _id: string;
  title: string;
  poster?: string;
  createdAt: string;
  views?: number;
}

interface Feedback {
  _id: string;
  subject: string;
  name: string;
  type: string;
  isRead: boolean;
  status: string;
  createdAt: string;
}

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
      labels: [] as string[],
      data: [] as number[]
    },
    genreDistribution: {
      labels: [] as string[],
      data: [] as number[]
    },
    recentMovies: [] as Movie[]
  });

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
    byType: {} as Record<string, number>
  });

  const [activeChartFilter, setActiveChartFilter] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Safe parallel fetch with fallbacks - none can crash the entire dashboard
        const [dashRes, analyticsRes, feedbackRes, reportRes] = await Promise.allSettled([
          getDashboardStats().catch(() => null),
          getAnalyticsData().catch(() => null),
          getFeedbackStats().catch(() => null),
          getReportStats().catch(() => null)
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value) {
          const val = dashRes.value;
          setStatistics({
            totalMovies: val.totalMovies ?? 0,
            engagementRate: val.engagementRate ?? '0%',
            newUsers: val.newUsers ?? 0,
            reports: val.reports ?? 0,
            feedback: {
              total: val.feedback?.total ?? 0,
              unread: val.feedback?.unread ?? 0
            }
          });
        }

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
          const val = analyticsRes.value;
          setAnalyticsData({
            viewsByDay: val.viewsByDay || { labels: [], data: [] },
            genreDistribution: val.genreDistribution || { labels: [], data: [] },
            recentMovies: val.recentMovies || []
          });
        }

        if (feedbackRes.status === 'fulfilled' && feedbackRes.value) {
          const val = feedbackRes.value;
          setFeedbackData({
            recent: val.recent || [],
            byType: val.byType || [],
            byStatus: val.byStatus || [],
            byDay: val.byDay || { labels: [], data: [] }
          });
        }

        if (reportRes.status === 'fulfilled' && reportRes.value) {
          const val = reportRes.value;
          setReportData({
            total: val.total ?? 0,
            new: val.new ?? 0,
            byStatus: val.byStatus || { pending: 0, 'in-progress': 0, resolved: 0, rejected: 0 },
            byType: val.byType || {}
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Shared dark theme chart defaults
  const darkChartTheme = {
    mode: 'dark' as const,
    palette: 'palette1'
  };

  // Chart options for view trends
  const viewsChartOptions: ApexOptions = {
    chart: {
      type: 'area' as const,
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'inherit'
    },
    theme: darkChartTheme,
    colors: ['#e50914'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.05)',
      strokeDashArray: 4,
      padding: { right: 16, left: 16 }
    },
    xaxis: {
      categories: analyticsData.viewsByDay.labels,
      labels: {
        style: { colors: '#64748b', fontSize: '11px', fontFamily: 'inherit' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '11px', fontFamily: 'inherit' }
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value: number) => `${value.toLocaleString()} lượt xem`
      }
    }
  };

  const viewsChartSeries = [
    {
      name: 'Lượt xem',
      data: analyticsData.viewsByDay.data
    }
  ];

  // Chart options for genre distribution
  const genreChartOptions: ApexOptions = {
    chart: {
      type: 'donut' as const,
      background: 'transparent',
      fontFamily: 'inherit'
    },
    theme: darkChartTheme,
    colors: ['#e50914', '#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#06b6d4', '#64748b'],
    labels: analyticsData.genreDistribution.labels,
    legend: {
      position: 'bottom',
      labels: { colors: '#94a3b8' },
      fontFamily: 'inherit',
      fontSize: '11px'
    },
    stroke: { colors: ['#111723'] },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Tổng phim',
              color: '#94a3b8',
              fontSize: '12px'
            }
          }
        }
      }
    },
    dataLabels: { enabled: false }
  };

  const genreChartSeries = analyticsData.genreDistribution.data;

  // Chart options for feedback by day
  const feedbackChartOptions: ApexOptions = {
    chart: {
      type: 'bar' as const,
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'inherit'
    },
    theme: darkChartTheme,
    colors: ['#38bdf8'],
    fill: { opacity: 0.8 },
    dataLabels: { enabled: false },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.05)',
      strokeDashArray: 4,
      padding: { right: 16, left: 16 }
    },
    xaxis: {
      categories: feedbackData.byDay.labels,
      labels: {
        style: { colors: '#64748b', fontSize: '11px', fontFamily: 'inherit' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '11px', fontFamily: 'inherit' }
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value: number) => `${value} phản hồi`
      }
    }
  };

  const feedbackChartSeries = [
    {
      name: 'Góp ý',
      data: feedbackData.byDay.data
    }
  ];

  // Chart options for feedback by type
  const feedbackTypeChartOptions: ApexOptions = {
    chart: {
      type: 'pie' as const,
      background: 'transparent',
      fontFamily: 'inherit'
    },
    theme: darkChartTheme,
    colors: ['#38bdf8', '#34d399', '#fbbf24', '#f87171'],
    labels: feedbackData.byType.map((item) => item._id || 'Không xác định'),
    legend: {
      position: 'bottom',
      labels: { colors: '#94a3b8' },
      fontFamily: 'inherit',
      fontSize: '11px'
    },
    stroke: { colors: ['#111723'] },
    dataLabels: { enabled: false }
  };

  const feedbackTypeChartSeries = feedbackData.byType.map((item) => item.count || 0);

  // Filter buttons for charts
  const chartFilters = [
    { id: 'week', label: 'Tuần này' },
    { id: 'month', label: 'Tháng này' },
    { id: 'quarter', label: 'Quý này' },
    { id: 'year', label: 'Năm nay' }
  ];

  const resolvedFeedbackCount =
    feedbackData.byStatus.find((item) => item._id === 'resolved')?.count || 0;

  return (
    <>
      <Head>
        <title>Bảng Quản Trị - Movie Admin</title>
      </Head>

      <div className={styles.container}>
        {/* Header Toolbar */}
        <section className={styles.header}>
          <div className="container-fluid p-0">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h1 className={styles.headerTitle}>Tổng Quan Hệ Thống</h1>
                <p className={styles.headerSubtitle}>
                  Chào mừng trở lại! Dưới đây là các chỉ số hoạt động chính của nền tảng.
                </p>
              </div>
              <div className="col-md-6 text-md-end mt-2 mt-md-0">
                <nav className={styles.breadcrumb} aria-label="Đường dẫn">
                  <Link href="/admin">Admin</Link>
                  <span className="mx-2 text-secondary">/</span>
                  <span className="text-light">Dashboard</span>
                </nav>
              </div>
            </div>
          </div>
        </section>

        {/* Top 4 Core Metrics */}
        <section className={styles.dashboardSection}>
          <div className="row g-3">
            {/* 1. Total Movies */}
            <div className="col-lg-3 col-sm-6">
              <div className={styles.statsCard}>
                <div>
                  <div className={styles.statsTopRow}>
                    <span className={styles.statsSubtitle}>Tổng số phim</span>
                    <div className={styles.statsIconWrap}>
                      <FaFilm />
                    </div>
                  </div>
                  {loading ? (
                    <div className={styles.loadingPlaceholder} />
                  ) : (
                    <h3 className={styles.statsTitle}>
                      {statistics.totalMovies > 0 ? statistics.totalMovies.toLocaleString() : '0'}
                    </h3>
                  )}
                </div>
                <Link href="/admin/movies" className={styles.statsFooter}>
                  <span>Quản lý phim</span>
                  <FaArrowRight style={{ fontSize: '0.7rem' }} />
                </Link>
              </div>
            </div>

            {/* 2. Interaction Rate */}
            <div className="col-lg-3 col-sm-6">
              <div className={styles.statsCard}>
                <div>
                  <div className={styles.statsTopRow}>
                    <span className={styles.statsSubtitle}>Tương tác (7 ngày)</span>
                    <div className={styles.statsIconWrap} style={{ color: '#2dd4bf' }}>
                      <FaChartLine />
                    </div>
                  </div>
                  {loading ? (
                    <div className={styles.loadingPlaceholder} />
                  ) : (
                    <h3 className={styles.statsTitle}>
                      {statistics.engagementRate}
                      <span className={styles.statsUnit}>👁/User</span>
                    </h3>
                  )}
                </div>
                <div className={styles.statsFooter} style={{ cursor: 'default' }}>
                  <span>Tỉ lệ xem trung bình</span>
                </div>
              </div>
            </div>

            {/* 3. New Users */}
            <div className="col-lg-3 col-sm-6">
              <div className={styles.statsCard}>
                <div>
                  <div className={styles.statsTopRow}>
                    <span className={styles.statsSubtitle}>Người dùng mới</span>
                    <div className={styles.statsIconWrap} style={{ color: '#38bdf8' }}>
                      <FaUserPlus />
                    </div>
                  </div>
                  {loading ? (
                    <div className={styles.loadingPlaceholder} />
                  ) : (
                    <h3 className={styles.statsTitle}>
                      {statistics.newUsers > 0 ? statistics.newUsers.toLocaleString() : '0'}
                    </h3>
                  )}
                </div>
                <Link href="/admin/users" className={styles.statsFooter}>
                  <span>Quản lý người dùng</span>
                  <FaArrowRight style={{ fontSize: '0.7rem' }} />
                </Link>
              </div>
            </div>

            {/* 4. Total Reports */}
            <div className="col-lg-3 col-sm-6">
              <div className={styles.statsCard}>
                <div>
                  <div className={styles.statsTopRow}>
                    <span className={styles.statsSubtitle}>Báo cáo sự cố</span>
                    <div className={styles.statsIconWrap} style={{ color: '#f87171' }}>
                      <FaChartPie />
                    </div>
                  </div>
                  {loading ? (
                    <div className={styles.loadingPlaceholder} />
                  ) : (
                    <h3 className={styles.statsTitle}>
                      {statistics.reports > 0 ? statistics.reports.toLocaleString() : '0'}
                    </h3>
                  )}
                </div>
                <Link href="/admin/reports" className={styles.statsFooter}>
                  <span>Xem báo cáo</span>
                  <FaArrowRight style={{ fontSize: '0.7rem' }} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary Metric Cards: Feedbacks & Reports Split */}
        <section className={styles.dashboardSection}>
          <div className="row g-3">
            {/* Feedback Breakdown */}
            <div className="col-lg-6">
              <div className={styles.splitCard}>
                <div className={styles.splitCardBody}>
                  <div className={styles.splitColumn}>
                    <span className={styles.splitLabel}>Góp ý chưa đọc</span>
                    {loading ? (
                      <div className={styles.loadingPlaceholder} />
                    ) : (
                      <>
                        <h4 className={styles.splitNumber}>
                          {statistics.feedback?.unread || 0}
                        </h4>
                        {(statistics.feedback?.unread || 0) > 0 && (
                          <span className={styles.badgeNotice}>Mới</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className={styles.splitColumn}>
                    <span className={styles.splitLabel}>Góp ý đã giải quyết</span>
                    {loading ? (
                      <div className={styles.loadingPlaceholder} />
                    ) : (
                      <h4 className={styles.splitNumber}>{resolvedFeedbackCount}</h4>
                    )}
                  </div>
                </div>
                <div className={styles.splitActions}>
                  <Link href="/admin/feedback?filter=unread" className={styles.splitActionBtn}>
                    <span>Xem chưa đọc</span>
                    <FaArrowRight style={{ fontSize: '0.7rem' }} />
                  </Link>
                  <Link href="/admin/feedback?filter=resolved" className={styles.splitActionBtn}>
                    <span>Xem đã giải quyết</span>
                    <FaArrowRight style={{ fontSize: '0.7rem' }} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Reports Breakdown */}
            <div className="col-lg-6">
              <div className={styles.splitCard}>
                <div className={styles.splitCardBody}>
                  <div className={styles.splitColumn}>
                    <span className={styles.splitLabel}>Báo cáo đang chờ</span>
                    {loading ? (
                      <div className={styles.loadingPlaceholder} />
                    ) : (
                      <>
                        <h4 className={styles.splitNumber}>
                          {reportData.byStatus.pending || 0}
                        </h4>
                        {(reportData.byStatus.pending || 0) > 0 && (
                          <span className={styles.badgeNotice}>Cần xử lý</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className={styles.splitColumn}>
                    <span className={styles.splitLabel}>Báo cáo đã xử lý</span>
                    {loading ? (
                      <div className={styles.loadingPlaceholder} />
                    ) : (
                      <h4 className={styles.splitNumber}>
                        {reportData.byStatus.resolved || 0}
                      </h4>
                    )}
                  </div>
                </div>
                <div className={styles.splitActions}>
                  <Link href="/admin/reports?status=pending" className={styles.splitActionBtn}>
                    <span>Xem đang chờ</span>
                    <FaArrowRight style={{ fontSize: '0.7rem' }} />
                  </Link>
                  <Link href="/admin/reports?status=resolved" className={styles.splitActionBtn}>
                    <span>Xem đã xử lý</span>
                    <FaArrowRight style={{ fontSize: '0.7rem' }} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Charts: Views Trends & Genre Distribution */}
        <section className={styles.dashboardSection}>
          <div className="row g-3">
            {/* Views Area Chart */}
            <div className="col-lg-8">
              <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Biểu Đồ Lượt Xem</h3>
                  <div className={styles.chartActions}>
                    {chartFilters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`${styles.chartFilterButton} ${
                          activeChartFilter === filter.id ? styles.chartFilterButtonActive : ''
                        }`}
                        onClick={() => setActiveChartFilter(filter.id)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className={styles.loadingPlaceholder} style={{ height: '300px' }} />
                ) : analyticsData.viewsByDay.data.length > 0 ? (
                  <div id="viewsChart">
                    {typeof window !== 'undefined' && (
                      <Chart
                        options={viewsChartOptions}
                        series={viewsChartSeries}
                        type="area"
                        height={300}
                      />
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyChartState}>
                    <FaChartLine className={styles.emptyChartIcon} />
                    <span>Không có dữ liệu lượt xem trong khoảng thời gian này</span>
                  </div>
                )}
              </div>
            </div>

            {/* Genre Distribution Donut Chart */}
            <div className="col-lg-4">
              <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Phân Bổ Thể Loại</h3>
                </div>

                {loading ? (
                  <div className={styles.loadingPlaceholder} style={{ height: '300px' }} />
                ) : analyticsData.genreDistribution.data.length > 0 ? (
                  <div id="genreChart">
                    {typeof window !== 'undefined' && (
                      <Chart
                        options={genreChartOptions}
                        series={genreChartSeries}
                        type="donut"
                        height={300}
                      />
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyChartState}>
                    <FaChartPie className={styles.emptyChartIcon} />
                    <span>Chưa có dữ liệu phân loại thể loại</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Charts: Feedback Trends & By Type */}
        <section className={styles.dashboardSection}>
          <div className="row g-3">
            {/* Feedback Trends Bar Chart */}
            <div className="col-lg-8">
              <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Xu Hướng Góp Ý</h3>
                </div>

                {loading ? (
                  <div className={styles.loadingPlaceholder} style={{ height: '280px' }} />
                ) : feedbackData.byDay.data.length > 0 ? (
                  <div id="feedbackChart">
                    {typeof window !== 'undefined' && (
                      <Chart
                        options={feedbackChartOptions}
                        series={feedbackChartSeries}
                        type="bar"
                        height={280}
                      />
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyChartState}>
                    <FaEnvelope className={styles.emptyChartIcon} />
                    <span>Chưa có dữ liệu phản hồi gần đây</span>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback By Type Pie Chart */}
            <div className="col-lg-4">
              <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Phân Loại Góp Ý</h3>
                </div>

                {loading ? (
                  <div className={styles.loadingPlaceholder} style={{ height: '280px' }} />
                ) : feedbackData.byType.length > 0 ? (
                  <div id="feedbackTypeChart">
                    {typeof window !== 'undefined' && (
                      <Chart
                        options={feedbackTypeChartOptions}
                        series={feedbackTypeChartSeries}
                        type="pie"
                        height={280}
                      />
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyChartState}>
                    <FaChartPie className={styles.emptyChartIcon} />
                    <span>Chưa có dữ liệu phân loại góp ý</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Movies & Feedbacks Section */}
        <section className={styles.dashboardSection}>
          <div className="row g-3">
            {/* Recent Movies */}
            <div className="col-lg-6">
              <div className={styles.recentItemsContainer}>
                <div className={styles.recentItemsHeader}>
                  <h3 className={styles.recentItemsTitle}>Phim Vừa Cập Nhật</h3>
                  <Link href="/admin/movies" className={styles.recentItemsViewAll}>
                    <span>Xem tất cả</span>
                    <FaArrowRight style={{ fontSize: '0.65rem' }} />
                  </Link>
                </div>

                {loading ? (
                  <>
                    <div className={styles.loadingPlaceholder} />
                    <div className={styles.loadingPlaceholder} />
                  </>
                ) : analyticsData.recentMovies && analyticsData.recentMovies.length > 0 ? (
                  analyticsData.recentMovies.slice(0, 4).map((movie: Movie, index: number) => (
                    <div className={styles.recentItem} key={movie._id || index}>
                      <div className={styles.recentItemImage}>
                        {movie.poster ? (
                          <Image
                            src={movie.poster}
                            alt={movie.title}
                            width={40}
                            height={40}
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <FaFilm />
                        )}
                      </div>
                      <div className={styles.recentItemContent}>
                        <h4 className={styles.recentItemTitle}>{movie.title}</h4>
                        <div className={styles.recentItemMeta}>
                          <span>
                            <FaClock className="me-1" />
                            {movie.createdAt ? new Date(movie.createdAt).toLocaleDateString('vi-VN') : '--'}
                          </span>
                          <span>
                            <FaEye className="me-1" />
                            {movie.views || 0} lượt xem
                          </span>
                        </div>
                      </div>
                      <div className={styles.recentItemActions}>
                        <Link
                          href={`/admin/movies/edit/${movie._id}`}
                          className={styles.recentItemButton}
                          title="Chỉnh sửa"
                        >
                          <FaEdit />
                        </Link>
                        <Link
                          href={`/admin/movies/view/${movie._id}`}
                          className={styles.recentItemButton}
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyItems}>
                    <FaFilm className={styles.emptyItemsIcon} />
                    <span>Không có dữ liệu phim gần đây</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Feedbacks */}
            <div className="col-lg-6">
              <div className={styles.recentItemsContainer}>
                <div className={styles.recentItemsHeader}>
                  <h3 className={styles.recentItemsTitle}>Góp Ý Mới Nhất</h3>
                  <Link href="/admin/feedback" className={styles.recentItemsViewAll}>
                    <span>Xem tất cả</span>
                    <FaArrowRight style={{ fontSize: '0.65rem' }} />
                  </Link>
                </div>

                {loading ? (
                  <>
                    <div className={styles.loadingPlaceholder} />
                    <div className={styles.loadingPlaceholder} />
                  </>
                ) : feedbackData.recent && feedbackData.recent.length > 0 ? (
                  feedbackData.recent.slice(0, 4).map((feedback: Feedback, index: number) => (
                    <div className={styles.recentItem} key={feedback._id || index}>
                      <div className={styles.recentItemImage}>
                        <FaEnvelope style={{ color: feedback.isRead ? '#64748b' : '#38bdf8' }} />
                      </div>
                      <div className={styles.recentItemContent}>
                        <h4 className={styles.recentItemTitle}>
                          {feedback.subject || 'Không có tiêu đề'}
                        </h4>
                        <div className={styles.recentItemMeta}>
                          <span>Từ: {feedback.name || 'Người dùng'}</span>
                          <span>
                            <FaClock className="me-1" />
                            {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString('vi-VN') : '--'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.recentItemActions}>
                        <Link
                          href={`/admin/feedback/${feedback._id}`}
                          className={styles.recentItemButton}
                          title="Xem phản hồi"
                        >
                          <FaEye />
                        </Link>
                        {feedback.status === 'pending' && (
                          <span className={`${styles.statusBadge} ${styles.pendingBadge}`}>
                            Chờ
                          </span>
                        )}
                        {feedback.status === 'resolved' && (
                          <span className={`${styles.statusBadge} ${styles.resolvedBadge}`}>
                            Xong
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyItems}>
                    <FaEnvelope className={styles.emptyItemsIcon} />
                    <span>Không có dữ liệu góp ý gần đây</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

AdminDashboardPage.getLayout = (page: React.ReactElement) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default AdminDashboardPage;