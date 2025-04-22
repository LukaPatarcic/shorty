import { useState, useEffect } from 'react';
import { useParams } from 'react-router';

interface UrlInfo {
  originalUrl: string;
  code: string;
  createdAt: string;
}

interface HourlyClick {
  key_as_string: string;
  key: number;
  doc_count: number;
}

interface UserAgent {
  key: string;
  doc_count: number;
}

interface IpAddress {
  key: string;
  doc_count: number;
}

interface Referer {
  key: string;
  doc_count: number;
}

interface ClickAnalytics {
  totalClicks: number;
  hourlyDistribution: HourlyClick[];
  userAgents: UserAgent[];
  ipAddresses: IpAddress[];
  topReferers: Referer[];
}

interface StatsResponse {
  urlInfo: UrlInfo;
  clickAnalytics: ClickAnalytics;
}

function formatUserAgent(ua: string): { browser: string; device: string } {
  if (ua === 'unknown') {
    return { browser: 'Unknown', device: 'Unknown' };
  }

  const browser = ua.includes('Chrome') ? 'Chrome' :
                 ua.includes('Firefox') ? 'Firefox' :
                 ua.includes('Safari') ? 'Safari' :
                 ua.includes('Edge') ? 'Edge' :
                 'Other';

  const device = ua.includes('Macintosh') ? 'Mac' :
                ua.includes('Windows') ? 'Windows' :
                ua.includes('iPhone') ? 'iPhone' :
                ua.includes('Android') ? 'Android' :
                'Other';

  return { browser, device };
}

export function StatsPage() {
  const { code } = useParams();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/analytics/${code}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 bg-red-100 p-4 rounded-md">
          {error || 'No analytics data found for this URL'}
        </div>
      </div>
    );
  }

  // Process user agents to get browser and device stats
  const browserStats: Record<string, number> = {};
  const deviceStats: Record<string, number> = {};
  stats.clickAnalytics.userAgents.forEach(ua => {
    const { browser, device } = formatUserAgent(ua.key);
    browserStats[browser] = (browserStats[browser] || 0) + ua.doc_count;
    deviceStats[device] = (deviceStats[device] || 0) + ua.doc_count;
  });

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">URL Statistics</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Original URL</p>
              <p className="text-gray-900 break-all">{stats.urlInfo.originalUrl}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Short Code</p>
              <p className="text-gray-900">{stats.urlInfo.code}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-blue-600">{stats.clickAnalytics.totalClicks}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Created At</p>
              <p className="text-gray-900">{new Date(stats.urlInfo.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Browser Distribution</h2>
            <div className="space-y-3">
              {Object.entries(browserStats).map(([browser, count]) => (
                <div key={browser} className="flex items-center justify-between">
                  <span className="text-gray-600">{browser}</span>
                  <div className="flex items-center">
                    <span className="text-gray-900 font-medium">{count}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      ({Math.round((count / stats.clickAnalytics.totalClicks) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Device Distribution</h2>
            <div className="space-y-3">
              {Object.entries(deviceStats).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="text-gray-600">{device}</span>
                  <div className="flex items-center">
                    <span className="text-gray-900 font-medium">{count}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      ({Math.round((count / stats.clickAnalytics.totalClicks) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Referrers</h2>
            <div className="space-y-3">
              {stats.clickAnalytics.topReferers.map((referer) => (
                <div key={referer.key} className="flex items-center justify-between">
                  <span className="text-gray-600">{referer.key}</span>
                  <div className="flex items-center">
                    <span className="text-gray-900 font-medium">{referer.doc_count}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      ({Math.round((referer.doc_count / stats.clickAnalytics.totalClicks) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Hourly Clicks</h2>
            <div className="space-y-3">
              {stats.clickAnalytics.hourlyDistribution.map((hour) => (
                <div key={hour.key} className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {new Date(hour.key_as_string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center">
                    <span className="text-gray-900 font-medium">{hour.doc_count}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      ({Math.round((hour.doc_count / stats.clickAnalytics.totalClicks) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}