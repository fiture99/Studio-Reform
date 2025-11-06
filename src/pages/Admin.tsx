import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, MessageSquare, Settings, BarChart, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
      fetchMembers();
    }
  }, [isAdmin]);

  // Fetch data based on active tab
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'classes') {
        fetchAllClasses();
      } else if (activeTab === 'bookings') {
        fetchAllBookings();
      }
    }
  }, [activeTab, isAdmin]);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboardData(response);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      setDashboardData({ stats: {}, recent_bookings: [] });
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await adminAPI.getMembers();
      setMembers(response || []);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      setError(error.message || 'Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllClasses = async () => {
    try {
      const response = await adminAPI.getAllClasses();
      setClasses(response || []);
    } catch (error: any) {
      console.error('Failed to fetch classes:', error);
      setError(error.message || 'Failed to load classes');
      setClasses([]);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await adminAPI.getAllBookings();
      setAllBookings(response || []);
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      setError(error.message || 'Failed to load bookings');
      setAllBookings([]);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        console.log('Deleting member:', memberId);
        // await adminAPI.deleteMember(memberId);
        fetchMembers();
      } catch (error: any) {
        console.error('Failed to delete member:', error);
        setError(error.response?.data?.message || error.message || 'Failed to delete member');
      }
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await adminAPI.deleteClass(classId);
        fetchAllClasses();
      } catch (error: any) {
        console.error('Failed to delete class:', error);
        setError(error.response?.data?.message || error.message || 'Failed to delete class');
      }
    }
  };

  const handleUpdateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      await adminAPI.updateBookingStatus(bookingId, newStatus);
      fetchAllBookings(); // Refresh the bookings list
    } catch (error: any) {
      console.error('Failed to update booking status:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update booking status');
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

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (error && !dashboardData && activeTab === 'dashboard') {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchDashboardData();
              fetchMembers();
            }}
            className="mt-4 bg-[#8F9980] text-white px-4 py-2 rounded-md font-medium hover:bg-[#7a8570] transition-colors"
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

  // Safely access dashboard data with fallbacks
  const stats = [
    { 
      label: 'Total Members', 
      value: dashboardData?.stats?.total_members?.toString() || '0', 
      change: '+12%', 
      color: 'text-green-600' 
    },
    { 
      label: 'Active Classes', 
      value: dashboardData?.stats?.active_classes?.toString() || '0', 
      change: '+2', 
      color: 'text-blue-600' 
    },
    { 
      label: 'Today\'s Bookings', 
      value: dashboardData?.stats?.today_bookings?.toString() || '0', 
      change: '+8%', 
      color: 'text-yellow-600' 
    },
    { 
      label: 'Revenue (MTD)', 
      value: `D ${dashboardData?.stats?.revenue_mtd?.toLocaleString() || '0'}`, 
      change: '+15%', 
      color: 'text-green-600' 
    }
  ];

  // Safely get recent bookings
  const recentBookings = dashboardData?.recent_bookings || [];

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
                          ? 'bg-[#8F9980] text-white'
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
                        {recentBookings.length > 0 ? (
                          recentBookings.map((booking: any) => (
                            <tr key={booking.id} className="border-b border-gray-100">
                              <td className="py-3 text-black">{booking.member || booking.user_name || 'N/A'}</td>
                              <td className="py-3 text-gray-600">{booking.class || booking.class_name || 'N/A'}</td>
                              <td className="py-3 text-gray-600">{booking.time || 'N/A'}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  (booking.status === 'Confirmed' || booking.status === 'confirmed') 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
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
                    <button className="bg-[#8F9980] text-white px-4 py-2 rounded-md font-medium hover:bg-[#7a8570] transition-colors flex items-center">
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
                        {members && members.length > 0 ? (
                          members.map((member) => (
                            <tr key={member.id} className="border-b border-gray-100">
                              <td className="py-3 text-black font-medium">{member.name}</td>
                              <td className="py-3 text-gray-600">{member.email}</td>
                              <td className="py-3 text-gray-600">{member.plan || member.membership_plan || 'Starter'}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  (member.status === 'Active' || member.status === 'active') 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {member.status || 'Active'}
                                </span>
                              </td>
                              <td className="py-3 text-gray-600">
                                {member.joined || (member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A')}
                              </td>
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

            {activeTab === 'classes' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-black">All Classes</h2>
                    <button className="bg-[#8F9980] text-white px-4 py-2 rounded-md font-medium hover:bg-[#7a8570] transition-colors flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Class
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-gray-600">Class Name</th>
                          <th className="text-left py-2 text-gray-600">Instructor</th>
                          <th className="text-left py-2 text-gray-600">Duration</th>
                          <th className="text-left py-2 text-gray-600">Difficulty</th>
                          <th className="text-left py-2 text-gray-600">Capacity</th>
                          <th className="text-left py-2 text-gray-600">Booked</th>
                          <th className="text-left py-2 text-gray-600">Available</th>
                          <th className="text-left py-2 text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes && classes.length > 0 ? (
                          classes.map((classItem) => (
                            <tr key={classItem.id} className="border-b border-gray-100">
                              <td className="py-3 text-black font-medium">{classItem.name}</td>
                              <td className="py-3 text-gray-600">{classItem.instructor}</td>
                              <td className="py-3 text-gray-600">{classItem.duration}</td>
                              <td className="py-3 text-gray-600 capitalize">{classItem.difficulty}</td>
                              <td className="py-3 text-gray-600">{classItem.capacity}</td>
                              <td className="py-3 text-gray-600">{classItem.current_bookings || 0}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  (classItem.available_spots || classItem.capacity) > 0 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {classItem.available_spots || classItem.capacity}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    className="text-red-600 hover:text-red-800"
                                    onClick={() => handleDeleteClass(classItem.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-4 text-center text-gray-600">
                              No classes found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-black">All Customer Bookings</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-gray-600">Reference</th>
                          <th className="text-left py-2 text-gray-600">Customer</th>
                          <th className="text-left py-2 text-gray-600">Type</th>
                          <th className="text-left py-2 text-gray-600">Details</th>
                          <th className="text-left py-2 text-gray-600">Amount</th>
                          <th className="text-left py-2 text-gray-600">Status</th>
                          <th className="text-left py-2 text-gray-600">Payment</th>
                          <th className="text-left py-2 text-gray-600">Date</th>
                          <th className="text-left py-2 text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allBookings && allBookings.length > 0 ? (
                          allBookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-gray-100">
                              <td className="py-3 text-black font-medium text-sm">{booking.reference_number}</td>
                              <td className="py-3">
                                <div>
                                  <div className="font-medium text-black">{booking.user_name}</div>
                                  <div className="text-xs text-gray-500">{booking.user_email}</div>
                                </div>
                              </td>
                              <td className="py-3 text-gray-600 capitalize">{booking.booking_type}</td>
                              <td className="py-3 text-gray-600 text-sm">
                                {booking.booking_type === 'class' ? (
                                  <>
                                    <div>{booking.class_name}</div>
                                    {booking.booking_date && (
                                      <div className="text-xs">
                                        {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div>{booking.package_type} ({booking.package_sessions} sessions)</div>
                                )}
                              </td>
                              <td className="py-3 text-gray-600">D {booking.amount}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800'
                                    : booking.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.payment_status === 'paid' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.payment_status}
                                </span>
                              </td>
                              <td className="py-3 text-gray-600 text-sm">
                                {new Date(booking.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-3">
                                <div className="flex space-x-1">
                                  {booking.status !== 'confirmed' && (
                                    <button 
                                      className="text-green-600 hover:text-green-800 p-1"
                                      onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                      title="Confirm Booking"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                  {booking.status !== 'cancelled' && (
                                    <button 
                                      className="text-red-600 hover:text-red-800 p-1"
                                      onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                      title="Cancel Booking"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-4 text-center text-gray-600">
                              No bookings found
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
            {!['dashboard', 'members', 'classes', 'bookings'].includes(activeTab) && (
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