import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getUsageStats, getVideoHistory, getTransactionHistory } from '../services/api/video';
import { createPortalSession } from '../services/api/payment';

export function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, videosRes, transactionsRes] = await Promise.all([
        getUsageStats(),
        getVideoHistory(),
        getTransactionHistory(),
      ]);

      setStats(statsRes.stats);
      setVideos(videosRes.videos);
      setTransactions(transactionsRes.transactions);
      await refreshUser();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await createPortalSession();
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const usagePercentage = stats ? (stats.minutes_used_this_month / stats.minutes_quota) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/editor"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all"
            >
              Go to Editor
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Welcome back, {user?.name || user?.email}!</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-gray-400 text-sm">Plan</p>
              <p className="text-xl font-semibold capitalize">{user?.subscription_tier}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-xl font-semibold capitalize">{user?.subscription_status}</p>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Minutes Remaining</h3>
            <p className="text-4xl font-bold text-purple-400">{stats?.minutes_remaining || 0}</p>
            <div className="mt-4 bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100 - usagePercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {stats?.minutes_used_this_month || 0} / {stats?.minutes_quota || 0} used this month
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Videos</h3>
            <p className="text-4xl font-bold text-green-400">{stats?.total_videos_processed || 0}</p>
            <p className="text-gray-500 text-sm mt-2">All time</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Minutes Processed</h3>
            <p className="text-4xl font-bold text-blue-400">{stats?.total_minutes_processed || 0}</p>
            <p className="text-gray-500 text-sm mt-2">All time</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            to="/pricing"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all"
          >
            Upgrade Plan
          </Link>
          {user?.subscription_tier !== 'free' && (
            <button
              onClick={handleManageBilling}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
            >
              Manage Billing
            </button>
          )}
        </div>

        {/* Recent Videos */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Recent Videos</h3>
          {videos.length === 0 ? (
            <p className="text-gray-400">No videos processed yet</p>
          ) : (
            <div className="space-y-3">
              {videos.slice(0, 5).map((video) => (
                <div key={video.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">{video.filename}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(video.created_at).toLocaleDateString()} • {video.minutes_consumed} min used
                    </p>
                  </div>
                  <span className="text-sm text-green-400 capitalize">{video.processing_status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="text-gray-400">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm text-purple-400">-{tx.amount} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
