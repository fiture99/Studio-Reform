import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Calendar, CreditCard, Package, Clock, CheckCircle, 
  XCircle, Download, Mail, Phone, MapPin, Edit, LogOut,
  ChevronRight, Star, Award, Settings, Bell, Shield, HelpCircle,
  CalendarDays, Clock as ClockIcon, MapPin as LocationIcon, Users as UsersIcon,
  AlertCircle, CalendarCheck, CalendarX, Info,DollarSign
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
  const [classFilter, setClassFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const bookingsResponse = await bookingsAPI.getUserBookings();
      console.log('Bookings API Response:', bookingsResponse); // Debug log
      
      // Log all bookings to see what data we have
      if (Array.isArray(bookingsResponse) && bookingsResponse.length > 0) {
        console.log(`Total bookings: ${bookingsResponse.length}`);
        bookingsResponse.forEach((booking, index) => {
          console.log(`Booking ${index + 1}:`, {
            id: booking.id,
            class_name: booking.class_name,
            booking_type: booking.booking_type,
            package_type: booking.package_type,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            status: booking.status,
            amount: booking.amount,
            reference: booking.reference_number
          });
        });
      }
      
      setBookings(Array.isArray(bookingsResponse) ? bookingsResponse : []);
      
      if (user) {
        setUserDetails({
          name: user.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: user.phone || 'Not provided',
          joinDate: user.created_at || new Date().toISOString(),
          membership: 'Active'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get class name from booking
  const getClassName = (booking: any) => {
    // Try multiple possible field names
    return booking.class_name || 
           booking.package_type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ||
           booking.title || 
           booking.name || 
           'Class';
  };

  // Helper function to get booking date
  const getBookingDate = (booking: any) => {
    return booking.booking_date || 
           booking.date || 
           booking.start_date ||
           booking.scheduled_date ||
           booking.created_at;
  };

  // Helper function to get booking time
  const getBookingTime = (booking: any) => {
    return booking.booking_time || 
           booking.time || 
           booking.start_time ||
           booking.scheduled_time;
  };

  // Format date and time properly
  const formatDateTime = (dateString?: string, timeString?: string) => {
    if (!dateString) {
      return { date: 'Date not set', time: timeString || 'Time not set', fullDate: null };
    }
    
    try {
      let date: Date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Try to parse date string
        date = new Date(dateString);
        
        // If date is invalid, return fallback
        if (isNaN(date.getTime())) {
          return { 
            date: dateString, 
            time: timeString || 'Time not set',
            fullDate: null
          };
        }
      } else {
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return { 
            date: 'Invalid date', 
            time: timeString || 'Time not set',
            fullDate: null
          };
        }
      }
      
      // Format date
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Format time if available
      let formattedTime = 'Time not set';
      if (timeString) {
        try {
          // Parse time string
          const timeParts = timeString.split(':');
          if (timeParts.length >= 2) {
            let hour = parseInt(timeParts[0], 10);
            const minute = timeParts[1].substring(0, 2); // Get first 2 characters for minutes
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            formattedTime = `${hour12}:${minute.padStart(2, '0')} ${ampm}`;
          } else {
            formattedTime = timeString;
          }
        } catch (error) {
          formattedTime = timeString;
        }
      }
      
      return { 
        date: formattedDate, 
        time: formattedTime,
        fullDate: date
      };
    } catch (error) {
      console.error('Error formatting date/time:', error, dateString, timeString);
      return { 
        date: dateString || 'Date not set', 
        time: timeString || 'Time not set',
        fullDate: null
      };
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'confirmed':
      case 'paid':
      case 'active':
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case 'pending':
      case 'payment_pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case 'cancelled':
      case 'expired':
      case 'inactive':
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CalendarCheck className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
    }
  };

  // Get all class bookings - include ALL bookings for now to see what we have
  const getClassBookings = () => {
    return bookings.filter(booking => {
      // Include all bookings that might be classes
      // Based on your output, we have class names like "Reform II", "Rhythm", etc.
      const className = getClassName(booking);
      const hasClassName = className && className !== 'Class';
      
      // Also include bookings with class-related types
      const isClassType = booking.booking_type === 'class' || 
                         booking.type === 'class' ||
                         (booking.package_type && booking.package_type.includes('class'));
      
      return hasClassName || isClassType || true; // Include all for debugging
    });
  };

  // Get upcoming classes (classes scheduled for future dates)
  const getUpcomingClasses = () => {
    const now = new Date();
    return getClassBookings().filter(booking => {
      const dateStr = getBookingDate(booking);
      const timeStr = getBookingTime(booking);
      const { fullDate } = formatDateTime(dateStr, timeStr);
      
      if (!fullDate) return false;
      
      // Check if booking is in the future and has a valid status
      return fullDate > now && 
        (booking.status === 'confirmed' || 
         booking.status === 'scheduled' || 
         booking.status === 'active' ||
         booking.status === 'pending');
    }).sort((a, b) => {
      const dateA = formatDateTime(getBookingDate(a), getBookingTime(a)).fullDate;
      const dateB = formatDateTime(getBookingDate(b), getBookingTime(b)).fullDate;
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime(); // Ascending - soonest first
    });
  };

  // Get past classes (classes that have already occurred)
  const getPastClasses = () => {
    const now = new Date();
    return getClassBookings().filter(booking => {
      const dateStr = getBookingDate(booking);
      const timeStr = getBookingTime(booking);
      const { fullDate } = formatDateTime(dateStr, timeStr);
      
      if (!fullDate) {
        // If no date, check if status is completed or cancelled
        return booking.status === 'completed' || booking.status === 'cancelled';
      }
      
      // Check if booking is in the past OR has completed/cancelled status
      return fullDate <= now || 
             booking.status === 'completed' || 
             booking.status === 'cancelled';
    }).sort((a, b) => {
      const dateA = formatDateTime(getBookingDate(a), getBookingTime(a)).fullDate;
      const dateB = formatDateTime(getBookingDate(b), getBookingTime(b)).fullDate;
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime(); // Descending - most recent first
    });
  };

  // Get filtered classes based on current filter
  const getFilteredClasses = () => {
    switch (classFilter) {
      case 'upcoming':
        return getUpcomingClasses();
      case 'past':
        return getPastClasses();
      default:
        // Show all classes, sorted by date (most recent first)
        return getClassBookings().sort((a, b) => {
          const dateA = formatDateTime(getBookingDate(a), getBookingTime(a)).fullDate;
          const dateB = formatDateTime(getBookingDate(b), getBookingTime(b)).fullDate;
          
          // If both have dates, sort by date (most recent first)
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          
          // If only one has date, put it first
          if (dateA && !dateB) return -1;
          if (!dateA && dateB) return 1;
          
          // Otherwise sort by creation date
          const createdA = new Date(a.created_at || 0);
          const createdB = new Date(b.created_at || 0);
          return createdB.getTime() - createdA.getTime();
        });
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
  const classBookings = getClassBookings();
  const upcomingClasses = getUpcomingClasses().length;
  const pastClasses = getPastClasses().length;
  const activeMemberships = bookings.filter(b => 
    b.booking_type === 'membership' && (b.status === 'confirmed' || b.status === 'active')
  ).length;

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
                  Member since {new Date(userDetails?.joinDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
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
              <div className="text-3xl font-bold text-[#8F9980]">{bookings.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Bookings</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">{upcomingClasses}</div>
              <div className="text-sm text-gray-600 mt-1">Upcoming</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">{pastClasses}</div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">{activeMemberships}</div>
              <div className="text-sm text-gray-600 mt-1">Active Memberships</div>
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
                    <span>Joined {new Date(userDetails?.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
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
                  onClick={() => setActiveTab('payment')}
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
                  {['overview', 'classes', 'memberships', 'payment', 'settings'].map((tab) => (
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
                        {tab === 'classes' && <Calendar className="w-4 h-4 mr-2" />}
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
                          onClick={() => setActiveTab('classes')}
                          className="text-sm text-[#8F9980] hover:text-[#7a8570]"
                        >
                          View all
                        </button>
                      </div>
                      
                      {bookings.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No bookings yet</p>
                          <button
                            onClick={() => navigate('/Studio-Reform/classes')}
                            className="mt-4 px-4 py-2 bg-[#8F9980] text-white rounded-lg font-medium hover:bg-[#7a8570] transition-colors"
                          >
                            Book a Class
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookings.slice(0, 5).map((booking, index) => {
                            const className = getClassName(booking);
                            const { date, time } = formatDateTime(getBookingDate(booking), getBookingTime(booking));
                            
                            return (
                              <motion.div
                                key={booking.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                  <div className="mb-3 md:mb-0">
                                    <div className="flex items-center mb-2">
                                      <span className="font-semibold text-gray-800">
                                        {className}
                                      </span>
                                      <span className="mx-2 text-gray-300">•</span>
                                      {getStatusBadge(booking.status)}
                                    </div>
                                    <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4">
                                      <div className="flex items-center">
                                        <CalendarDays className="w-4 h-4 mr-2" />
                                        <span>{date}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <ClockIcon className="w-4 h-4 mr-2" />
                                        <span>{time}</span>
                                      </div>
                                      {booking.reference_number && (
                                        <div className="flex items-center">
                                          <Info className="w-4 h-4 mr-2" />
                                          <span className="font-mono text-xs">{booking.reference_number}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {booking.amount > 0 && (
                                    <div className="text-lg font-bold text-[#8F9980]">
                                      D {booking.amount?.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
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
                        {upcomingClasses > 0 ? (
                          <div>
                            <div className="text-2xl font-bold">
                              {getClassName(getUpcomingClasses()[0])}
                            </div>
                            <p className="text-sm opacity-90 mt-1">
                              {formatDateTime(
                                getBookingDate(getUpcomingClasses()[0]),
                                getBookingTime(getUpcomingClasses()[0])
                              ).date}
                            </p>
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

                {activeTab === 'classes' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">My Classes</h2>
                        <p className="text-gray-600">Showing {getFilteredClasses().length} classes</p>
                      </div>
                      <button
                        onClick={() => navigate('/Studio-Reform/classes')}
                        className="px-4 py-2 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors flex items-center"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        + Book New Class
                      </button>
                    </div>

                    {/* Class Filters */}
                    <div className="mb-6">
                      <div className="flex space-x-2 border-b border-gray-200">
                        <button
                          onClick={() => setClassFilter('all')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            classFilter === 'all'
                              ? 'border-[#8F9980] text-[#8F9980]'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          All Classes ({bookings.length})
                        </button>
                        <button
                          onClick={() => setClassFilter('upcoming')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            classFilter === 'upcoming'
                              ? 'border-[#8F9980] text-[#8F9980]'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Upcoming ({upcomingClasses})
                        </button>
                        {/* <button
                          onClick={() => setClassFilter('past')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            classFilter === 'past'
                              ? 'border-[#8F9980] text-[#8F9980]'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Completed ({pastClasses})
                        </button> */}
                      </div>
                    </div>

                    {getFilteredClasses().length === 0 ? (
                      <div className="text-center py-12">
                        {classFilter === 'upcoming' ? (
                          <>
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No upcoming classes</h3>
                            <p className="text-gray-500 mb-6">Book your next class to get started!</p>
                            <button
                              onClick={() => navigate('/Studio-Reform/classes')}
                              className="px-6 py-3 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors"
                            >
                              Browse Classes
                            </button>
                          </>
                        ) : classFilter === 'past' ? (
                          <>
                            <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No completed classes</h3>
                            <p className="text-gray-500">Your completed classes will appear here</p>
                          </>
                        ) : (
                          <>
                            <CalendarX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No classes booked yet</h3>
                            <p className="text-gray-500 mb-6">Book your first class to get started!</p>
                            <button
                              onClick={() => navigate('/Studio-Reform/classes')}
                              className="px-6 py-3 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors"
                            >
                              Browse Classes
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getFilteredClasses().map((booking, index) => {
                          const className = getClassName(booking);
                          const { date, time } = formatDateTime(getBookingDate(booking), getBookingTime(booking));
                          const isUpcoming = getUpcomingClasses().includes(booking);
                          const isPast = getPastClasses().includes(booking);
                          
                          return (
                            <motion.div
                              key={booking.id || index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                                <div className="mb-4 lg:mb-0 lg:flex-1">
                                  <div className="flex flex-wrap items-center mb-3 gap-2">
                                    <span className="font-semibold text-lg text-gray-800">
                                      {className}
                                    </span>
                                    {getStatusBadge(booking.status)}
                                    {isPast && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                        {/* Past */}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <CalendarDays className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Date:</span>
                                        <span className="ml-2">{date}</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-600">
                                        <ClockIcon className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Time:</span>
                                        <span className="ml-2">{time}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      {booking.instructor && (
                                        <div className="flex items-center text-sm text-gray-600">
                                          <UsersIcon className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Instructor:</span>
                                          <span className="ml-2">{booking.instructor}</span>
                                        </div>
                                      )}
                                      {booking.difficulty && (
                                        <div className="flex items-center text-sm text-gray-600">
                                          <AlertCircle className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Level:</span>
                                          <span className="ml-2">{booking.difficulty}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-1">
                                      {booking.location && (
                                        <div className="flex items-center text-sm text-gray-600">
                                          <LocationIcon className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Location:</span>
                                          <span className="ml-2">{booking.location}</span>
                                        </div>
                                      )}
                                      {booking.duration && (
                                        <div className="flex items-center text-sm text-gray-600">
                                          <Clock className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Duration:</span>
                                          <span className="ml-2">{booking.duration}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {booking.reference_number && (
                                    <div className="text-sm text-gray-500">
                                      <span className="font-medium">Reference:</span>
                                      <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                                        {booking.reference_number}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-end space-y-2">
                                  {booking.amount !== undefined && booking.amount > 0 && (
                                    <div className="text-lg font-bold text-[#8F9980]">
                                      D {booking.amount?.toLocaleString()}
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-2">
                                    {isUpcoming && (
                                      <button
                                        onClick={() => {
                                          // Cancel class logic
                                          console.log('Cancel class:', booking.id);
                                        }}
                                        className="text-sm text-red-600 hover:text-red-800"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        // View class details
                                        console.log('View class details:', booking.id);
                                      }}
                                      className="text-sm text-[#8F9980] hover:text-[#7a8570] font-medium"
                                    >
                                      Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* // Replace the incomplete section in your Profile component with this complete code: */}

                {activeTab === 'memberships' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">My Memberships</h2>
                        <p className="text-gray-600">Manage your membership packages</p>
                      </div>
                      <button
                        onClick={() => navigate('/Studio-Reform/membership')}
                        className="px-4 py-2 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors flex items-center"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        + Get New Membership
                      </button>
                    </div>
                
                    {/* Membership Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-[#f5efe5] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Active Memberships</p>
                            <p className="text-2xl font-bold text-[#8F9980]">{activeMemberships}</p>
                          </div>
                          <Package className="w-8 h-8 text-[#8F9980]" />
                        </div>
                      </div>
                      <div className="bg-[#f5efe5] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Spent</p>
                            <p className="text-2xl font-bold text-[#8F9980]">
                              D {bookings
                                .filter(b => b.booking_type === 'membership' && b.amount)
                                .reduce((sum, b) => sum + (b.amount || 0), 0)
                                .toLocaleString()}
                            </p>
                          </div>
                          <CreditCard className="w-8 h-8 text-[#8F9980]" />
                        </div>
                      </div>
                      <div className="bg-[#f5efe5] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Membership History</p>
                            <p className="text-2xl font-bold text-[#8F9980]">
                              {bookings.filter(b => b.booking_type === 'membership').length}
                            </p>
                          </div>
                          <Calendar className="w-8 h-8 text-[#8F9980]" />
                        </div>
                      </div>
                    </div>
                            
                    {/* Membership List */}
                    {bookings.filter(b => b.booking_type === 'membership').length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No memberships yet</h3>
                        <p className="text-gray-500 mb-6">Get a membership to access all our classes!</p>
                        <button
                          onClick={() => navigate('/Studio-Reform/membership')}
                          className="px-6 py-3 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors"
                        >
                          View Packages
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings
                          .filter(b => b.booking_type === 'membership')
                          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                          .map((membership, index) => {
                            const { date } = formatDateTime(getBookingDate(membership));
                            const packageName = membership.package_type 
                              ? membership.package_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                              : 'Membership';

                            return (
                              <motion.div
                                key={membership.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                              >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                                  <div className="mb-4 lg:mb-0 lg:flex-1">
                                    <div className="flex items-center mb-4">
                                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                                        <Package className="w-6 h-6 text-purple-600" />
                                      </div>
                                      <div>
                                        <div className="flex items-center mb-1">
                                          <span className="font-semibold text-lg text-gray-800">
                                            {packageName}
                                          </span>
                                          <span className="mx-2 text-gray-300">•</span>
                                          {getStatusBadge(membership.status)}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          Purchased on {date}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-600">
                                          <CalendarDays className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Purchase Date:</span>
                                          <span className="ml-2">{date}</span>
                                        </div>
                                        {membership.payment_method && (
                                          <div className="flex items-center text-sm text-gray-600">
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            <span className="font-medium">Payment Method:</span>
                                            <span className="ml-2 capitalize">{membership.payment_method}</span>
                                          </div>
                                        )}
                                        {membership.package_sessions && (
                                          <div className="flex items-center text-sm text-gray-600">
                                            <Clock className="w-4 h-4 mr-2" />
                                            <span className="font-medium">Sessions:</span>
                                            <span className="ml-2">{membership.package_sessions}</span>
                                          </div>
                                        )}
                                      </div>
                                    
                                      <div className="space-y-2">
                                        {membership.reference_number && (
                                          <div className="flex items-center text-sm text-gray-600">
                                            <Info className="w-4 h-4 mr-2" />
                                            <span className="font-medium">Reference:</span>
                                            <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                              {membership.reference_number}
                                            </span>
                                          </div>
                                        )}
                                        {membership.package_validity_days && (
                                          <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span className="font-medium">Validity:</span>
                                            <span className="ml-2">{membership.package_validity_days} days</span>
                                          </div>
                                        )}
                                        {membership.expires_at && (
                                          <div className="flex items-center text-sm text-gray-600">
                                            <CalendarCheck className="w-4 h-4 mr-2" />
                                            <span className="font-medium">Expires:</span>
                                            <span className="ml-2">
                                              {new Date(membership.expires_at).toLocaleDateString()}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                    
                                  <div className="flex flex-col items-end space-y-3">
                                    {membership.amount !== undefined && membership.amount > 0 && (
                                      <div className="text-lg font-bold text-[#8F9980]">
                                        D {membership.amount?.toLocaleString()}
                                      </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                      {membership.status === 'active' && (
                                        <button
                                          onClick={() => navigate('/Studio-Reform/classes')}
                                          className="px-4 py-2 bg-[#8F9980] text-white rounded-md font-medium hover:bg-[#7a8570] transition-colors text-sm"
                                        >
                                          Book Classes
                                        </button>
                                      )}
                                      {membership.status === 'pending' && (
                                        <button
                                          onClick={() => {
                                            // View payment details
                                            console.log('View payment details:', membership.id);
                                          }}
                                          className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md font-medium hover:bg-yellow-200 transition-colors text-sm"
                                        >
                                          Complete Payment
                                        </button>
                                      )}
                                    </div>
                                  
                                    {membership.status === 'active' && (
                                      <div className="text-xs text-green-600 font-medium">
                                        ✓ Active Membership
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    )}

                    {/* Membership Benefits */}
                    {activeMemberships > 0 && (
                      <div className="mt-8 p-6 bg-gradient-to-r from-[#8F9980] to-green-600 rounded-lg text-white">
                        <h3 className="text-lg font-bold mb-4">Membership Benefits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 mr-3 text-yellow-300" />
                            <span>Access to all regular classes</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 mr-3 text-yellow-300" />
                            <span>Priority booking for popular classes</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 mr-3 text-yellow-300" />
                            <span>Discounts on private sessions</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 mr-3 text-yellow-300" />
                            <span>Free guest passes monthly</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'payment' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
                        <p className="text-gray-600">All your transactions and payments</p>
                      </div>
                      <button
                        onClick={() => {
                          // Export payment history
                          console.log('Export payment history');
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </button>
                    </div>
                    
                    {/* Payment Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-[#f5efe5] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Spent</p>
                            <p className="text-2xl font-bold text-[#8F9980]">
                              D {bookings
                                .filter(b => b.amount && b.amount > 0)
                                .reduce((sum, b) => sum + (b.amount || 0), 0)
                                .toLocaleString()}
                            </p>
                          </div>
                          <CreditCard className="w-8 h-8 text-[#8F9980]" />
                        </div>
                      </div>
                      <div className="bg-[#f5efe5] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Transactions</p>
                            <p className="text-2xl font-bold text-[#8F9980]">
                              {bookings.filter(b => b.amount && b.amount > 0).length}
                            </p>
                          </div>
                          <Calendar className="w-8 h-8 text-[#8F9980]" />
                        </div>
                      </div>
                      <div className="bg-[#f5efe5] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Average Payment</p>
                            <p className="text-2xl font-bold text-[#8F9980]">
                              D {bookings.filter(b => b.amount && b.amount > 0).length > 0 
                                ? Math.round(
                                    bookings.filter(b => b.amount && b.amount > 0)
                                      .reduce((sum, b) => sum + (b.amount || 0), 0) / 
                                    bookings.filter(b => b.amount && b.amount > 0).length
                                  ).toLocaleString()
                                : '0'}
                            </p>
                          </div>
                          <DollarSign className="w-8 h-8 text-[#8F9980]" />
                        </div>
                      </div>
                    </div>
                              
                    {/* Payment Methods Summary */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Methods</h3>
                      <div className="flex flex-wrap gap-3">
                        {(() => {
                          const methods = bookings.reduce((acc, booking) => {
                            if (booking.payment_method) {
                              acc[booking.payment_method] = (acc[booking.payment_method] || 0) + 1;
                            }
                            return acc;
                          }, {} as Record<string, number>);

                          return Object.entries(methods).map(([method, count]) => (
                            <div key={method} className="flex items-center bg-gray-100 px-4 py-2 rounded-lg">
                              <CreditCard className="w-4 h-4 mr-2 text-gray-600" />
                              <span className="font-medium text-gray-700 capitalize">{method}</span>
                              <span className="ml-2 text-sm text-gray-500">({count})</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                    
                    {/* Payment History List */}
                    {bookings.filter(b => b.amount && b.amount > 0).length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No payment history</h3>
                        <p className="text-gray-500 mb-6">Your payment history will appear here after making bookings</p>
                        <button
                          onClick={() => navigate('/Studio-Reform/membership')}
                          className="px-6 py-3 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors"
                        >
                          View Packages
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings
                          .filter(b => b.amount && b.amount > 0)
                          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                          .map((payment, index) => {
                            const { date } = formatDateTime(getBookingDate(payment));
                            const itemName = payment.class_name || 
                                            (payment.package_type 
                                              ? payment.package_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                              : 'Booking');
                                            
                            return (
                              <motion.div
                                key={payment.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                              >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                                  <div className="mb-4 lg:mb-0 lg:flex-1">
                                    <div className="flex items-center mb-4">
                                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                                        payment.booking_type === 'membership' ? 'bg-purple-100' : 'bg-blue-100'
                                      }`}>
                                        {payment.booking_type === 'membership' ? (
                                          <Package className="w-6 h-6 text-purple-600" />
                                        ) : (
                                          <Calendar className="w-6 h-6 text-blue-600" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center mb-1">
                                          <span className="font-semibold text-lg text-gray-800">
                                            {itemName}
                                          </span>
                                          <span className="mx-2 text-gray-300">•</span>
                                          {getStatusBadge(payment.status)}
                                          <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                            payment.booking_type === 'membership' 
                                              ? 'bg-purple-100 text-purple-800' 
                                              : 'bg-blue-100 text-blue-800'
                                          }`}>
                                            {payment.booking_type === 'membership' ? 'Membership' : 'Class'}
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4">
                                          <div className="flex items-center">
                                            <CalendarDays className="w-4 h-4 mr-2" />
                                            <span>{date}</span>
                                          </div>
                                          {payment.reference_number && (
                                            <div className="flex items-center">
                                              <Info className="w-4 h-4 mr-2" />
                                              <span className="font-mono text-xs">{payment.reference_number}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                      
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-600">
                                          <CreditCard className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Payment Method:</span>
                                          <span className="ml-2 capitalize">{payment.payment_method || 'Not specified'}</span>
                                        </div>
                                        {payment.payment_status && (
                                          <div className="flex items-center text-sm text-gray-600">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            <span className="font-medium">Payment Status:</span>
                                            <span className="ml-2 capitalize">{payment.payment_status}</span>
                                          </div>
                                        )}
                                      </div>
                                    
                                      <div className="space-y-2">
                                        {payment.transaction_id && (
                                          <div className="flex items-center text-sm text-gray-600">
                                            <Tag className="w-4 h-4 mr-2" />
                                            <span className="font-medium">Transaction ID:</span>
                                            <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                              {payment.transaction_id}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex items-center text-sm text-gray-600">
                                          <Calendar className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Processed:</span>
                                          <span className="ml-2">{new Date(payment.created_at).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                    
                                  <div className="flex flex-col items-end space-y-3">
                                    <div className="text-lg font-bold text-[#8F9980]">
                                      D {payment.amount?.toLocaleString()}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => {
                                          // View receipt
                                          console.log('View receipt for:', payment.id);
                                        }}
                                        className="text-sm text-[#8F9980] hover:text-[#7a8570] font-medium"
                                      >
                                        View Receipt
                                      </button>
                                      {payment.status === 'pending' && (
                                        <button
                                          onClick={() => {
                                            // Retry payment
                                            console.log('Retry payment for:', payment.id);
                                          }}
                                          className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                                        >
                                          Retry Payment
                                        </button>
                                      )}
                                    </div>
                                  
                                    {payment.status === 'completed' && (
                                      <div className="text-xs text-green-600 font-medium flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Payment Successful
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    )}

                {/* Payment Summary */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Class Bookings:</span>
                      <span className="font-medium">
                        {bookings.filter(b => b.booking_type === 'class' && b.amount && b.amount > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Membership Purchases:</span>
                      <span className="font-medium">
                        {bookings.filter(b => b.booking_type === 'membership' && b.amount && b.amount > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount Spent:</span>
                      <span className="font-bold text-[#8F9980]">
                        D {bookings
                          .filter(b => b.amount && b.amount > 0)
                          .reduce((sum, b) => sum + (b.amount || 0), 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

{activeTab === 'settings' && (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Change Password</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#8F9980] text-white rounded-md font-medium hover:bg-[#7a8570] transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>
      
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" className="rounded text-[#8F9980]" defaultChecked />
            <span className="ml-2">Email notifications for new classes</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="rounded text-[#8F9980]" defaultChecked />
            <span className="ml-2">Reminders for upcoming classes</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="rounded text-[#8F9980]" />
            <span className="ml-2">Promotional offers</span>
          </label>
        </div>
      </div>
      
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Account Actions</h3>
        <div className="space-y-3">
          <button className="w-full text-left p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
            Request Account Deletion
          </button>
          <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            Download My Data
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