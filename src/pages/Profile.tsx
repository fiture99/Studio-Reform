import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Calendar, CreditCard, Package, Clock, CheckCircle, 
  XCircle, Download, Mail, Phone, MapPin, Edit, LogOut,
  ChevronRight, Star, Award, Settings, Bell, Shield, HelpCircle
} from 'lucide-react';
import { bookingsAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const bookingsResponse = await bookingsAPI.getUserBookings();
      setBookings(Array.isArray(bookingsResponse) ? bookingsResponse : []);
      
      // Set user details from auth context
      if (user) {
        setUserDetails({
          name: user.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: user.phone || 'Not provided',
          joinDate: user.created_at || new Date().toISOString(),
          membership: 'Active' // You might want to fetch this from API
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If no bookings, show empty state
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    return timeString || '--:--';
  };

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'paid':
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
      case 'cancelled':
      case 'expired':
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement update logic here
    setEditMode(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/Studio-Reform');
  };

  // Calculate stats
  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' || b.status === 'pending'
  ).length;
  const activeMemberships = bookings.filter(b => 
    b.booking_type === 'membership' && (b.status === 'confirmed' || b.status === 'active')
  ).length;

  // Sort bookings by date (newest first)
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = a.created_at || a.booking_date;
    const dateB = b.created_at || b.booking_date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-[#f5efe5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8F9980]"></div>
      </div>
    );
  }

  return (
    <div className="pt-16 bg-[#f5efe5] min-h-screen">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-[#8F9980] to-pure-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                  {userDetails?.name?.charAt(0) ? (
                    <span className="text-3xl font-bold">{userDetails.name.charAt(0)}</span>
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className="absolute bottom-0 right-0 bg-[#8F9980] rounded-full p-2 hover:bg-[#7a8570] transition-colors"
                >
                  <Edit className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold">{userDetails?.name}</h1>
                <p className="text-cloud-cream opacity-90">{userDetails?.email}</p>
                <p className="text-sm text-cloud-cream opacity-75 mt-1">
                  Member since {formatDate(userDetails?.joinDate)}
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/Studio-Reform/classes')}
                className="px-6 py-3 bg-white text-[#8F9980] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Book New Class
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">{totalBookings}</div>
              <div className="text-sm text-gray-600 mt-1">Total Bookings</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">{upcomingBookings}</div>
              <div className="text-sm text-gray-600 mt-1">Upcoming</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">{activeMemberships}</div>
              <div className="text-sm text-gray-600 mt-1">Active Memberships</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">
                {bookings.filter(b => b.amount > 0).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Paid Bookings</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Details</h3>
              {editMode ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      defaultValue={userDetails?.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={userDetails?.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue={userDetails?.phone}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#8F9980] text-white py-2 rounded-md font-medium hover:bg-[#7a8570] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-3" />
                    <span>{userDetails?.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-3" />
                    <span>{userDetails?.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-3" />
                    <span>Joined {formatDate(userDetails?.joinDate)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Award className="w-4 h-4 mr-3" />
                    <span className="font-medium">{userDetails?.membership}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/Studio-Reform/classes')}
                  className="w-full text-left p-3 rounded-lg hover:bg-[#f5efe5] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-3 text-[#8F9980]" />
                    <span>Book a Class</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/Studio-Reform/membership')}
                  className="w-full text-left p-3 rounded-lg hover:bg-[#f5efe5] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-3 text-[#8F9980]" />
                    <span>View Packages</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="w-full text-left p-3 rounded-lg hover:bg-[#f5efe5] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-3 text-[#8F9980]" />
                    <span>Payment History</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="w-full text-left p-3 rounded-lg hover:bg-[#f5efe5] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Settings className="w-4 h-4 mr-3 text-[#8F9980]" />
                    <span>Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:w-3/4">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-lg mb-6">
              <div className="border-b">
                <nav className="flex -mb-px overflow-x-auto">
                  {['overview', 'bookings', 'memberships', 'payment', 'settings'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-[#8F9980] text-[#8F9980]'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        {tab === 'overview' && <User className="w-4 h-4 mr-2" />}
                        {tab === 'bookings' && <Calendar className="w-4 h-4 mr-2" />}
                        {tab === 'memberships' && <Package className="w-4 h-4 mr-2" />}
                        {tab === 'payment' && <CreditCard className="w-4 h-4 mr-2" />}
                        {tab === 'settings' && <Settings className="w-4 h-4 mr-2" />}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
                    
                    {/* Recent Bookings */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Recent Bookings</h3>
                        <button
                          onClick={() => setActiveTab('bookings')}
                          className="text-sm text-[#8F9980] hover:text-[#7a8570]"
                        >
                          View all
                        </button>
                      </div>
                      
                      {sortedBookings.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No bookings yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sortedBookings.slice(0, 5).map((booking, index) => (
                            <div key={booking.id || index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center mb-2">
                                    <span className="font-medium text-gray-800">
                                      {booking.class_name || booking.package_type || 'Booking'}
                                    </span>
                                    <span className="mx-2 text-gray-300">•</span>
                                    {getStatusBadge(booking.status)}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {booking.booking_date && formatDate(booking.booking_date)}
                                    {booking.booking_time && ` • ${formatTime(booking.booking_time)}`}
                                    {booking.reference_number && (
                                      <>
                                        <span className="mx-2 text-gray-300">•</span>
                                        <span className="font-mono">Ref: {booking.reference_number}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {booking.amount > 0 && (
                                  <div className="text-right">
                                    <div className="font-semibold text-[#8F9980]">
                                      D {booking.amount.toLocaleString()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-[#8F9980] to-green-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-bold mb-4">Membership Status</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold">{userDetails?.membership}</div>
                            <p className="text-sm opacity-90 mt-1">Current Plan</p>
                          </div>
                          <Award className="w-8 h-8 text-yellow-300" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-bold mb-4">Next Booking</h3>
                        {upcomingBookings > 0 ? (
                          <div>
                            <div className="text-2xl font-bold">{upcomingBookings} upcoming</div>
                            <p className="text-sm opacity-90 mt-1">Classes scheduled</p>
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl font-bold">No upcoming</div>
                            <p className="text-sm opacity-90 mt-1">Book your next class</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'bookings' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
                      <button
                        onClick={() => navigate('/Studio-Reform/classes')}
                        className="px-4 py-2 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors"
                      >
                        + New Booking
                      </button>
                    </div>

                    {sortedBookings.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No bookings yet</h3>
                        <p className="text-gray-500 mb-6">Book your first class to get started!</p>
                        <button
                          onClick={() => navigate('/Studio-Reform/classes')}
                          className="px-6 py-3 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors"
                        >
                          Browse Classes
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedBookings.map((booking, index) => (
                          <motion.div
                            key={booking.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                              <div className="mb-4 md:mb-0 md:flex-1">
                                <div className="flex items-center mb-3">
                                  <span className="font-semibold text-lg text-gray-800">
                                    {booking.class_name || booking.package_type || 'Booking'}
                                  </span>
                                  <span className="mx-3 text-gray-300">•</span>
                                  {getStatusBadge(booking.status)}
                                </div>
                                
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                  {booking.booking_date && (
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      {formatDate(booking.booking_date)}
                                    </div>
                                  )}
                                  {booking.booking_time && (
                                    <div className="flex items-center">
                                      <Clock className="w-4 h-4 mr-2" />
                                      {formatTime(booking.booking_time)}
                                    </div>
                                  )}
                                  {booking.reference_number && (
                                    <div className="flex items-center">
                                      <CreditCard className="w-4 h-4 mr-2" />
                                      <span className="font-mono">Ref: {booking.reference_number}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end">
                                {booking.amount !== undefined && booking.amount > 0 && (
                                  <div className="text-lg font-bold text-[#8F9980] mb-2">
                                    D {booking.amount.toLocaleString()}
                                  </div>
                                )}
                                <span className="text-xs text-gray-500">
                                  {formatDate(booking.created_at || booking.booking_date)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'memberships' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">My Memberships</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sortedBookings
                        .filter(b => b.booking_type === 'membership' || b.package_type)
                        .map((membership, index) => (
                          <motion.div
                            key={membership.id || index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-br from-[#8F9980] to-green-600 rounded-lg p-6 text-white"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-bold mb-2">
                                  {membership.package_type ? 
                                    membership.package_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                                    : 'Membership Package'}
                                </h3>
                                <div className="flex items-center">
                                  {getStatusBadge(membership.status || 'active')}
                                </div>
                              </div>
                              <Star className="w-6 h-6 text-yellow-300" />
                            </div>
                            
                            <div className="mb-4">
                              <div className="text-2xl font-bold mb-2">
                                D {membership.amount?.toLocaleString() || '0'}
                              </div>
                              <p className="text-sm opacity-90">
                                {membership.package_sessions ? `${membership.package_sessions} sessions` : 'Package'}
                              </p>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                              <div>
                                <div className="opacity-75">Reference</div>
                                <div className="font-mono">{membership.reference_number}</div>
                              </div>
                              <button className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                                View Details
                              </button>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                    
                    {sortedBookings.filter(b => b.booking_type === 'membership').length === 0 && (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No memberships yet</h3>
                        <p className="text-gray-500 mb-6">Purchase a package to unlock membership benefits!</p>
                        <button
                          onClick={() => navigate('/Studio-Reform/membership')}
                          className="px-6 py-3 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors"
                        >
                          View Packages
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'payment' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment History</h2>
                    
                    {sortedBookings.filter(b => b.amount > 0).length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No payment history</h3>
                        <p className="text-gray-500">Your payment history will appear here</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reference
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sortedBookings
                              .filter(b => b.amount > 0)
                              .map((payment, index) => (
                                <tr key={payment.id || index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(payment.created_at || payment.booking_date)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    <div>
                                      <div className="font-medium">
                                        {payment.class_name || payment.package_type || 'Payment'}
                                      </div>
                                      <div className="text-gray-500 text-xs">
                                        {payment.booking_type}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                    {payment.reference_number}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                    D {payment.amount?.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(payment.payment_status || payment.status)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                          <Bell className="w-5 h-5 mr-2" />
                          Notifications
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Email notifications</span>
                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#8F9980]">
                              <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white transition" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">SMS notifications</span>
                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                              <span className="inline-block h-4 w-4 transform translate-x-1 rounded-full bg-white transition" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                          <Shield className="w-5 h-5 mr-2" />
                          Privacy & Security
                        </h3>
                        <div className="space-y-3">
                          <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                            Change Password
                          </button>
                          <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                            Two-Factor Authentication
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                          <HelpCircle className="w-5 h-5 mr-2" />
                          Help & Support
                        </h3>
                        <div className="space-y-3">
                          <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                            Contact Support
                          </button>
                          <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                            FAQ
                          </button>
                          <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors text-red-600">
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;