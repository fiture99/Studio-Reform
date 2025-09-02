import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, MessageSquare, Settings, BarChart, Plus, Edit, Trash2 } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
      fetchMembers();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      const data = await adminAPI.getDashboard();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await adminAPI.getMembers();
      setMembers(data);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      setError(error.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        // This would call your backend API to delete a member
        console.log('Deleting member:', memberId);
        // await adminAPI.deleteMember(memberId);
        // Refresh the members list
        fetchMembers();
      } catch (error) {
        console.error('Failed to delete member:', error);
        setError('Failed to delete member');
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-yellow-600 text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart },
    { id: 'members', name: 'Members', icon: Users },
    { id: 'classes', name: 'Classes', icon: Calendar },
    { id: 'bookings', name: 'Bookings', icon: Calendar },
    { id: 'chatbot', name: 'Chatbot', icon: MessageSquare },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const stats = dashboardData?.stats ? [
    { label: 'Total Members', value: dashboardData.stats.total_members?.toString() || '0', change: '+12%', color: 'text-green-600' },
    { label: 'Active Classes', value: dashboardData.stats.active_classes?.toString() || '0', change: '+2', color: 'text-blue-600' },
    { label: 'Today\'s Bookings', value: dashboardData.stats.today_bookings?.toString() || '0', change: '+8%', color: 'text-yellow-600' },
    { label: 'Revenue (MTD)', value: `$${dashboardData.stats.revenue_mtd?.toLocaleString() || '0'}`, change: '+15%', color: 'text-green-600' }
  ] : [
    { label: 'Total Members', value: '0', change: '+0%', color: 'text-gray-600' },
    { label: 'Active Classes', value: '0', change: '+0', color: 'text-gray-600' },
    { label: 'Today\'s Bookings', value: '0', change: '+0%', color: 'text-gray-600' },
    { label: 'Revenue (MTD)', value: '$0', change: '+0%', color: 'text-gray-600' }
  ];

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your studio operations</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-yellow-600 text-black'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="h-5 w-5 mr-3" />
                      {tab.name}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{stat.label}</p>
                          <p className="text-2xl font-bold text-black">{stat.value}</p>
                        </div>
                        <span className={`text-sm font-medium ${stat.color}`}>{stat.change}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-black mb-4">Recent Bookings</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-gray-600">Member</th>
                          <th className="text-left py-2 text-gray-600">Class</th>
                          <th className="text-left py-2 text-gray-600">Time</th>
                          <th className="text-left py-2 text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData?.recent_bookings?.map((booking: any) => (
                          <tr key={booking.id} className="border-b border-gray-100">
                            <td className="py-3 text-black">{booking.member}</td>
                            <td className="py-3 text-gray-600">{booking.class}</td>
                            <td className="py-3 text-gray-600">{booking.time}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'Confirmed' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-600">
                              No recent bookings
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-black">Members</h2>
                    <button className="bg-yellow-600 text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-gray-600">Name</th>
                          <th className="text-left py-2 text-gray-600">Email</th>
                          <th className="text-left py-2 text-gray-600">Plan</th>
                          <th className="text-left py-2 text-gray-600">Status</th>
                          <th className="text-left py-2 text-gray-600">Joined</th>
                          <th className="text-left py-2 text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.length > 0 ? (
                          members.map((member) => (
                            <tr key={member.id} className="border-b border-gray-100">
                              <td className="py-3 text-black font-medium">{member.name}</td>
                              <td className="py-3 text-gray-600">{member.email}</td>
                              <td className="py-3 text-gray-600">{member.plan}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  member.status === 'Active' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {member.status}
                                </span>
                              </td>
                              <td className="py-3 text-gray-600">{member.joined}</td>
                              <td className="py-3">
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    className="text-red-600 hover:text-red-800"
                                    onClick={() => handleDeleteMember(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-gray-600">
                              No members found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Placeholder for other tabs */}
            {!['dashboard', 'members'].includes(activeTab) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm p-8 text-center"
              >
                <h2 className="text-2xl font-semibold text-black mb-4">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                <p className="text-gray-600">This section is under development.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;