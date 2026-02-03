import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Calendar, CreditCard, Package, Clock, CheckCircle, 
  XCircle, Download, Mail, Phone, MapPin, Edit, LogOut,
  ChevronRight, Star, Award, Settings, Bell, Shield, HelpCircle,
  CalendarDays, Clock as ClockIcon, MapPin as LocationIcon, Users as UsersIcon,
  AlertCircle, CalendarCheck, CalendarX, Info, DollarSign, Search, Filter, 
  ChevronLeft, ChevronRight as ChevronRightIcon, Tag, Eye, Trash2, Plus,
  Loader2, Check, X, Users, BookOpen, Key, Lock, Shield as ShieldIcon,
  Smartphone, MessageSquare, Heart, Star as StarIcon, Gift, TrendingUp,
  BarChart, FileText, Printer, Share2, Copy, ExternalLink, Home,
  Zap, Target, Dumbbell, Yoga, HeartPulse, Sunrise, Moon
} from 'lucide-react';
import { bookingsAPI, userAPI, scheduleAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [classFilter, setClassFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  
  // Schedule state
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [myBookedClasses, setMyBookedClasses] = useState<any>({ upcoming: [], past: [] });
  const [userMembership, setUserMembership] = useState<any>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [classSchedule, setClassSchedule] = useState<any>(null);
  const [scheduleFilters, setScheduleFilters] = useState({
    class_id: '',
    date_from: '',
    date_to: ''
  });
  const [classesList, setClassesList] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  
  // Payment state
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Add to your state variables


  // Add these state variables
const [recurringSchedule, setRecurringSchedule] = useState<any[]>([]);
const [bookingType, setBookingType] = useState<'weekly' | 'single'>('weekly');
const [myWeeklyBookings, setMyWeeklyBookings] = useState<any[]>([]);
const [selectedDay, setSelectedDay] = useState<string>('');
  
  // Settings state
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    reminder_notifications: true,
    promotional_emails: false
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Helper function to get class name from booking
  const getClassName = (booking: any) => {
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
        date = new Date(dateString);
        
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
      
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      let formattedTime = 'Time not set';
      if (timeString) {
        try {
          const timeParts = timeString.split(':');
          if (timeParts.length >= 2) {
            let hour = parseInt(timeParts[0], 10);
            const minute = timeParts[1].substring(0, 2);
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

  // Get all class bookings
  const getClassBookings = () => {
    return bookings.filter(booking => {
      const className = getClassName(booking);
      const hasClassName = className && className !== 'Class';
      
      const isClassType = booking.booking_type === 'class' || 
                         booking.type === 'class' ||
                         (booking.package_type && booking.package_type.includes('class'));
      
      return hasClassName || isClassType || true;
    });
  };

  // Get upcoming classes
  const getUpcomingClasses = () => {
    const now = new Date();
    return getClassBookings().filter(booking => {
      const dateStr = getBookingDate(booking);
      const timeStr = getBookingTime(booking);
      const { fullDate } = formatDateTime(dateStr, timeStr);
      
      if (!fullDate) return false;
      
      return fullDate > now && 
        (booking.status === 'confirmed' || 
         booking.status === 'scheduled' || 
         booking.status === 'active' ||
         booking.status === 'pending');
    }).sort((a, b) => {
      const dateA = formatDateTime(getBookingDate(a), getBookingTime(a)).fullDate;
      const dateB = formatDateTime(getBookingDate(b), getBookingTime(b)).fullDate;
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Get past classes
  const getPastClasses = () => {
    const now = new Date();
    return getClassBookings().filter(booking => {
      const dateStr = getBookingDate(booking);
      const timeStr = getBookingTime(booking);
      const { fullDate } = formatDateTime(dateStr, timeStr);
      
      if (!fullDate) {
        return booking.status === 'completed' || booking.status === 'cancelled';
      }
      
      return fullDate <= now || 
             booking.status === 'completed' || 
             booking.status === 'cancelled';
    }).sort((a, b) => {
      const dateA = formatDateTime(getBookingDate(a), getBookingTime(a)).fullDate;
      const dateB = formatDateTime(getBookingDate(b), getBookingTime(b)).fullDate;
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });
  };

  // Get filtered classes
  const getFilteredClasses = () => {
    switch (classFilter) {
      case 'upcoming':
        return getUpcomingClasses();
      case 'past':
        return getPastClasses();
      default:
        return getClassBookings().sort((a, b) => {
          const dateA = formatDateTime(getBookingDate(a), getBookingTime(a)).fullDate;
          const dateB = formatDateTime(getBookingDate(b), getBookingTime(b)).fullDate;
          
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          
          if (dateA && !dateB) return -1;
          if (!dateA && dateB) return 1;
          
          const createdA = new Date(a.created_at || 0);
          const createdB = new Date(b.created_at || 0);
          return createdB.getTime() - createdA.getTime();
        });
    }
  };

  // Calculate stats
  const upcomingClasses = getUpcomingClasses().length;
  const pastClasses = getPastClasses().length;
  const classBookings = getClassBookings();
  const activeMemberships = bookings.filter(b => 
    b.booking_type === 'membership' && (b.status === 'confirmed' || b.status === 'active')
  ).length;

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'schedules') {
      fetchAvailableClasses();
      fetchMyBookedClasses();
      fetchMyWeeklyBookings();
      fetchUserMembership();
      fetchClassesList();
    }
    if (activeTab === 'payment') {
      fetchPaymentHistory();
    }
  }, [activeTab, scheduleFilters]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const bookingsResponse = await bookingsAPI.getUserBookings();
      console.log('Bookings API Response:', bookingsResponse);
      
      setBookings(Array.isArray(bookingsResponse) ? bookingsResponse : []);
      
      if (user) {
        setUserDetails({
          name: user.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: user.phone || 'Not provided',
          joinDate: user.created_at || new Date().toISOString(),
          membership: user.membership_plan || 'Starter'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
  setScheduleLoading(true);
  try {
    // Fetch weekly schedule patterns for recurring booking
    const weeklyResponse = await scheduleAPI.getWeeklySchedule();
    
    // Fetch specific instances for single bookings (next 2 weeks)
    const instancesResponse = await scheduleAPI.getAvailableClasses({
      date_from: new Date().toISOString().split('T')[0],
      date_to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    
    setRecurringSchedule(weeklyResponse || []);
    setAvailableClasses(instancesResponse || []);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    setRecurringSchedule([]);
    setAvailableClasses([]);
  } finally {
    setScheduleLoading(false);
  }
};

// Add this new function
const fetchMyWeeklyBookings = async () => {
  try {
    const response = await scheduleAPI.getMyWeeklyBookings();
    setMyWeeklyBookings(response || []);
  } catch (error) {
    console.error('Error fetching weekly bookings:', error);
    setMyWeeklyBookings([]);
  }
};

const processRecurringSchedule = (schedules: any[]) => {
  // Group by day and time to show weekly patterns
  const patterns: any[] = [];
  
  schedules.forEach(schedule => {
    // Create a pattern identifier
    const patternKey = `${schedule.day_of_week}_${schedule.start_time}_${schedule.end_time}_${schedule.class_name}`;
    
    const existingPattern = patterns.find(p => 
      p.day_of_week === schedule.day_of_week &&
      p.start_time === schedule.start_time &&
      p.end_time === schedule.end_time &&
      p.class_name === schedule.class_name
    );
    
    if (existingPattern) {
      // Update existing pattern (e.g., combine instructor info)
      if (schedule.instructor && !existingPattern.instructors.includes(schedule.instructor)) {
        existingPattern.instructors.push(schedule.instructor);
      }
      existingPattern.totalSpots += schedule.available_spots || 0;
    } else {
      patterns.push({
        ...schedule,
        pattern_id: patternKey,
        instructors: schedule.instructor ? [schedule.instructor] : [],
        totalSpots: schedule.available_spots || 0,
        isRecurring: true,
        // Add next few dates for this pattern
        nextDates: generateNextDates(schedule.day_of_week, 4) // Next 4 occurrences
      });
    }
  });
  
  return patterns;
};

const generateNextDates = (dayOfWeek: string, count: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = days.indexOf(dayOfWeek);
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    // Find next occurrence of this day
    const daysUntilTarget = (targetDayIndex - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + daysUntilTarget + (i * 7));
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

  const fetchMyBookedClasses = async () => {
    try {
      const response = await scheduleAPI.getMyBookedClasses();
      setMyBookedClasses({
        upcoming: response?.upcoming_classes || [],
        past: response?.past_classes || []
      });
    } catch (error) {
      console.error('Error fetching booked classes:', error);
      setMyBookedClasses({ upcoming: [], past: [] });
    }
  };

  const fetchUserMembership = async () => {
    try {
      const response = await scheduleAPI.getUserMembership();
      setUserMembership(response?.membership);
    } catch (error) {
      console.error('Error fetching user membership:', error);
      setUserMembership(null);
    }
  };

  const fetchClassesList = async () => {
    try {
      const availableClasses = await scheduleAPI.getAvailableClasses({});
      
      if (availableClasses && Array.isArray(availableClasses)) {
        const uniqueClasses: any[] = [];
        const seenClassIds = new Set();
        
        availableClasses.forEach((cls: any) => {
          if (cls.class_id && !seenClassIds.has(cls.class_id)) {
            seenClassIds.add(cls.class_id);
            uniqueClasses.push({
              id: cls.class_id,
              name: cls.class_name,
              instructor: cls.instructor,
              duration: cls.duration,
              difficulty: cls.difficulty,
              description: cls.description
            });
          }
        });
        
        setClassesList(uniqueClasses);
      } else {
        setClassesList([]);
      }
    } catch (error) {
      console.error('Error fetching classes list:', error);
      setClassesList([]);
    }
  };

  const fetchPaymentHistory = async () => {
    setPaymentLoading(true);
    try {
      const response = await bookingsAPI.getUserBookings();
      const payments = Array.isArray(response) 
        ? response.filter(b => b.amount && b.amount > 0)
        : [];
      setPaymentHistory(payments);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentHistory([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleBookClass = async (scheduleInstanceId: number, className: string) => {
    if (!userMembership?.is_active) {
      Swal.fire({
        title: 'Membership Required',
        text: 'You need an active membership to book classes.',
        icon: 'warning',
        confirmButtonColor: '#8F9980',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (userMembership.remaining_sessions <= 0) {
      Swal.fire({
        title: 'No Sessions Remaining',
        text: 'You have no remaining sessions in your membership.',
        icon: 'warning',
        confirmButtonColor: '#8F9980',
        confirmButtonText: 'OK'
      });
      return;
    }

    setBookingLoading(scheduleInstanceId);

    try {
      await scheduleAPI.bookClass({ schedule_instance_id: scheduleInstanceId });
      
      Swal.fire({
        title: 'Success!',
        html: `
          <div class="text-center">
            <div class="text-green-500 text-5xl mb-4">✓</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Class Booked Successfully!</h3>
            <p class="text-gray-600 mb-4">You have successfully booked <strong>${className}</strong></p>
            <p class="text-sm text-gray-500">Remaining Sessions: ${userMembership.remaining_sessions - 1}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#8F9980',
        timer: 3000
      });
      
      // Refresh data
      fetchAvailableClasses();
      fetchMyBookedClasses();
      fetchUserMembership();
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to book class',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setBookingLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId: number, className: string, date: string) => {
    const result = await Swal.fire({
      title: 'Cancel Booking',
      html: `Are you sure you want to cancel your booking for <strong>${className}</strong> on <strong>${new Date(date).toLocaleDateString()}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#8F9980',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it'
    });

    if (!result.isConfirmed) return;

    try {
      await scheduleAPI.cancelBooking(bookingId);
      
      Swal.fire({
        title: 'Cancelled!',
        text: 'Your booking has been cancelled successfully.',
        icon: 'success',
        confirmButtonColor: '#8F9980',
        timer: 3000
      });
      
      // Refresh data
      fetchAvailableClasses();
      fetchMyBookedClasses();
      fetchUserMembership();
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to cancel booking',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes.padStart(2, '0')} ${ampm}`;
    } catch (error) {
      return timeStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateStr;
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
      case 'booked':
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would call your API to update user profile
      // await userAPI.updateProfile(userDetails);
      setEditMode(false);
      Swal.fire({
        title: 'Success!',
        text: 'Profile updated successfully',
        icon: 'success',
        confirmButtonColor: '#8F9980',
        timer: 2000
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to update profile',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleBookWeeklyClass = async (weeklySchedule: any) => {
  if (!userMembership?.is_active) {
    Swal.fire({
      title: 'Membership Required',
      text: 'You need an active membership to book classes.',
      icon: 'warning',
      confirmButtonColor: '#8F9980',
      confirmButtonText: 'OK'
    });
    return;
  }

  if (userMembership.remaining_sessions <= 0) {
    Swal.fire({
      title: 'No Sessions Remaining',
      text: 'You have no remaining sessions in your membership.',
      icon: 'warning',
      confirmButtonColor: '#8F9980',
      confirmButtonText: 'OK'
    });
    return;
  }

  // Check if already booked this weekly schedule
  const alreadyBooked = myWeeklyBookings.some(
    (booking: any) => booking.weekly_schedule_id === weeklySchedule.id
  );

  if (alreadyBooked) {
    Swal.fire({
      title: 'Already Booked',
      text: 'You have already booked this weekly class.',
      icon: 'info',
      confirmButtonColor: '#8F9980'
    });
    return;
  }

  setBookingLoading(weeklySchedule.id);

  try {
    // Calculate start date (next occurrence of this day)
    const today = new Date();
    const dayMapping: { [key: string]: number } = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };
    
    const targetDay = dayMapping[weeklySchedule.day_of_week];
    const currentDay = today.getDay();
    
    // Calculate days until next occurrence
    let daysUntilNext = (targetDay - currentDay + 7) % 7;
    if (daysUntilNext === 0) daysUntilNext = 7; // If today is the day, book for next week
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + daysUntilNext);
    
    // Calculate end date based on available sessions (max 12 weeks or available sessions)
    const maxWeeks = Math.min(userMembership.remaining_sessions, 12); // Limit to 12 weeks max
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (maxWeeks * 7) - 1); // -1 to end on the last booked day
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Calculate how many weeks will be booked
    const weeksToBook = maxWeeks;
    
    // Show confirmation dialog with options
    const { value: formValues } = await Swal.fire({
      title: 'Book Weekly Class',
      html: `
        <div class="text-left space-y-4">
          <div>
            <p class="font-semibold text-gray-800">${weeklySchedule.class_name}</p>
            <p class="text-sm text-gray-600">Every ${weeklySchedule.day_of_week} at ${formatTime(weeklySchedule.start_time)}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              id="swal-start-date" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
              value="${startDateStr}"
              min="${startDateStr}"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Number of Weeks (Max: ${maxWeeks} weeks)
            </label>
            <div class="flex items-center space-x-2">
              <button 
                type="button" 
                id="decrease-weeks"
                class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
              >-</button>
              
              <input 
                type="number" 
                id="swal-weeks" 
                class="w-20 px-3 py-2 border border-gray-300 rounded-md text-center"
                value="${maxWeeks}"
                min="1"
                max="${maxWeeks}"
              />
              
              <button 
                type="button" 
                id="increase-weeks"
                class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
              >+</button>
            </div>
            <p class="text-xs text-gray-500 mt-1">You have ${userMembership.remaining_sessions} sessions remaining</p>
          </div>
          
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-sm text-gray-600">
              <span id="calculated-end-date">${endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#8F9980',
      cancelButtonColor: '#dc2626',
      confirmButtonText: `Book ${maxWeeks} Sessions`,
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const startDateInput = document.getElementById('swal-start-date') as HTMLInputElement;
        const weeksInput = document.getElementById('swal-weeks') as HTMLInputElement;
        
        const selectedStartDate = startDateInput.value;
        const selectedWeeks = parseInt(weeksInput.value);
        
        if (!selectedStartDate) {
          Swal.showValidationMessage('Please select a start date');
          return false;
        }
        
        if (selectedWeeks < 1 || selectedWeeks > maxWeeks) {
          Swal.showValidationMessage(`Please select between 1 and ${maxWeeks} weeks`);
          return false;
        }
        
        // Calculate end date based on selected weeks
        const start = new Date(selectedStartDate);
        const end = new Date(start);
        end.setDate(start.getDate() + (selectedWeeks * 7) - 1);
        
        return {
          start_date: selectedStartDate,
          weeks: selectedWeeks,
          end_date: end.toISOString().split('T')[0]
        };
      },
      didOpen: () => {
        // Add event listeners for week buttons
        const decreaseBtn = document.getElementById('decrease-weeks');
        const increaseBtn = document.getElementById('increase-weeks');
        const weeksInput = document.getElementById('swal-weeks') as HTMLInputElement;
        const startDateInput = document.getElementById('swal-start-date') as HTMLInputElement;
        
        const updateEndDate = () => {
          const weeks = parseInt(weeksInput.value);
          const start = new Date(startDateInput.value);
          const end = new Date(start);
          end.setDate(start.getDate() + (weeks * 7) - 1);
          
          const endDateElement = document.getElementById('calculated-end-date');
          if (endDateElement) {
            endDateElement.textContent = end.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
          }
        };
        
        decreaseBtn?.addEventListener('click', () => {
          const current = parseInt(weeksInput.value);
          if (current > 1) {
            weeksInput.value = (current - 1).toString();
            updateEndDate();
          }
        });
        
        increaseBtn?.addEventListener('click', () => {
          const current = parseInt(weeksInput.value);
          if (current < maxWeeks) {
            weeksInput.value = (current + 1).toString();
            updateEndDate();
          }
        });
        
        weeksInput?.addEventListener('change', updateEndDate);
        startDateInput?.addEventListener('change', updateEndDate);
        
        // Initial update
        updateEndDate();
      }
    });

    if (!formValues) {
      setBookingLoading(null);
      return;
    }

    // Book the weekly class with user-selected values
    const result = await scheduleAPI.bookWeeklyClass({
      weekly_schedule_id: weeklySchedule.id,
      start_date: formValues.start_date,
      end_date: formValues.end_date
    });
    
    Swal.fire({
      title: 'Success!',
      html: `
        <div class="text-center">
          <div class="text-green-500 text-5xl mb-4">✓</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Weekly Booking Confirmed!</h3>
          <p class="text-gray-600 mb-4">
            ${formValues.weeks} ${formValues.weeks === 1 ? 'session' : 'sessions'} booked for <strong>${weeklySchedule.class_name}</strong>
          </p>
          <p class="text-sm text-gray-500">
            Every ${weeklySchedule.day_of_week} at ${formatTime(weeklySchedule.start_time)}<br>
            From ${new Date(formValues.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
            to ${new Date(formValues.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Remaining sessions: ${result.remaining_sessions || userMembership.remaining_sessions - formValues.weeks}
          </p>
        </div>
      `,
      icon: 'success',
      confirmButtonColor: '#8F9980',
      timer: 5000
    });
    
    // Refresh data
    fetchMyWeeklyBookings();
    fetchUserMembership();
  } catch (error: any) {
    // Handle specific error messages
    if (error.message?.includes('Not enough remaining sessions')) {
      // Extract available sessions from error message
      const match = error.message.match(/have (\d+) sessions/);
      const availableSessions = match ? parseInt(match[1]) : userMembership.remaining_sessions;
      
      Swal.fire({
        title: 'Not Enough Sessions',
        html: `
          <div class="text-center">
            <p class="text-gray-600 mb-4">${error.message}</p>
            <p class="text-sm text-gray-500">You have ${availableSessions} sessions remaining.</p>
            <button 
              id="book-with-available" 
              class="mt-4 px-4 py-2 bg-[#8F9980] text-white rounded-md font-medium hover:bg-[#7a8570] transition-colors"
            >
              Book ${availableSessions} ${availableSessions === 1 ? 'Session' : 'Sessions'}
            </button>
          </div>
        `,
        icon: 'warning',
        showConfirmButton: false,
        didOpen: () => {
          document.getElementById('book-with-available')?.addEventListener('click', async () => {
            // Book with available sessions
            try {
              const today = new Date();
              const startDate = new Date(today);
              startDate.setDate(today.getDate() + 7); // Start next week
              
              const endDate = new Date(startDate);
              endDate.setDate(startDate.getDate() + (availableSessions * 7) - 1);
              
              await scheduleAPI.bookWeeklyClass({
                weekly_schedule_id: weeklySchedule.id,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
              });
              
              Swal.close();
              Swal.fire({
                title: 'Success!',
                text: `Booked ${availableSessions} sessions successfully`,
                icon: 'success',
                confirmButtonColor: '#8F9980'
              });
              
              // Refresh data
              fetchMyWeeklyBookings();
              fetchUserMembership();
            } catch (retryError: any) {
              Swal.fire({
                title: 'Error',
                text: retryError.message || 'Failed to book sessions',
                icon: 'error',
                confirmButtonColor: '#dc2626'
              });
            }
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to book weekly class',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  } finally {
    setBookingLoading(null);
  }
};

const handleCancelWeeklyBooking = async (weeklyBooking: any) => {
  const result = await Swal.fire({
    title: 'Cancel Weekly Booking',
    html: `
      <div class="text-left">
        <p class="mb-2">Are you sure you want to cancel your weekly booking for:</p>
        <p class="mb-2"><strong>${weeklyBooking.class_name}</strong></p>
        <p class="mb-2">Every ${weeklyBooking.day_of_week}</p>
        <p class="mb-4">${formatTime(weeklyBooking.start_time)} - ${formatTime(weeklyBooking.end_time)}</p>
        <p class="text-sm text-red-600">This will cancel all future occurrences of this class.</p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#8F9980',
    confirmButtonText: 'Yes, cancel all',
    cancelButtonText: 'Keep booking'
  });

  if (!result.isConfirmed) return;

  try {
    await scheduleAPI.cancelWeeklyBooking(weeklyBooking.id);
    
    Swal.fire({
      title: 'Cancelled!',
      text: 'Your weekly booking has been cancelled successfully.',
      icon: 'success',
      confirmButtonColor: '#8F9980',
      timer: 3000
    });
    
    // Refresh data
    fetchMyWeeklyBookings();
    fetchUserMembership();
  } catch (error: any) {
    Swal.fire({
      title: 'Error',
      text: error.message || 'Failed to cancel weekly booking',
      icon: 'error',
      confirmButtonColor: '#dc2626'
    });
  }
};

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      Swal.fire({
        title: 'Error',
        text: 'New passwords do not match',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    try {
      // Here you would call your API to change password
      // await userAPI.changePassword(passwordData);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      Swal.fire({
        title: 'Success!',
        text: 'Password changed successfully',
        icon: 'success',
        confirmButtonColor: '#8F9980',
        timer: 2000
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to change password',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleExportPayments = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Status', 'Reference'];
    const csvData = paymentHistory.map(payment => [
      new Date(payment.created_at).toLocaleDateString(),
      payment.booking_type === 'membership' ? 'Membership' : 'Class',
      payment.booking_type === 'membership' 
        ? payment.package_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
        : payment.class_name || 'Class Booking',
      `D ${payment.amount?.toLocaleString()}`,
      payment.status,
      payment.reference_number || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    Swal.fire({
      title: 'Exported!',
      text: 'Payment history exported successfully',
      icon: 'success',
      confirmButtonColor: '#8F9980',
      timer: 2000
    });
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8F9980',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/Studio-Reform');
      }
    });
  };

  const calculateStats = () => {
    const totalSpent = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const classBookings = bookings.filter(b => b.booking_type === 'class');
    const membershipBookings = bookings.filter(b => b.booking_type === 'membership');
    
    return {
      totalBookings: bookings.length,
      upcomingClasses: myBookedClasses.upcoming.length,
      pastClasses: myBookedClasses.past.length,
      remainingSessions: userMembership?.remaining_sessions || 0,
      totalSpent,
      classBookings: classBookings.length,
      membershipBookings: membershipBookings.length,
      activeMemberships: membershipBookings.filter(b => 
        b.status === 'confirmed' || b.status === 'active'
      ).length
    };
  };

  const handleUpdateSettings = (field: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const stats = calculateStats();

  if (loading && activeTab === 'overview') {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-[#f5efe5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8F9980]"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'schedules', name: 'schedules', icon: CalendarDays },
    { id: 'classes', name: 'My Classes', icon: Calendar },
    { id: 'memberships', name: 'Memberships', icon: Package },
    { id: 'payment', name: 'Payment', icon: CreditCard },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

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
                onClick={() => setActiveTab('schedules')}
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
              <div className="text-3xl font-bold text-[#8F9980]">{stats.totalBookings}</div>
              <div className="text-sm text-gray-600 mt-1">Total Bookings</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">{stats.upcomingClasses}</div>
              <div className="text-sm text-gray-600 mt-1">Upcoming</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">{stats.remainingSessions}</div>
              <div className="text-sm text-gray-600 mt-1">Remaining Sessions</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#f5efe5] rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl font-bold text-[#8F9980]">D {stats.totalSpent.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Total Spent</div>
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
                      value={userDetails?.name || ''}
                      onChange={(e) => setUserDetails({...userDetails, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userDetails?.email || ''}
                      onChange={(e) => setUserDetails({...userDetails, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={userDetails?.phone || ''}
                      onChange={(e) => setUserDetails({...userDetails, phone: e.target.value})}
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
                    <span>{userDetails?.phone || 'Not provided'}</span>
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
                  onClick={() => setActiveTab('schedules')}
                  className="w-full text-left p-3 rounded-lg hover:bg-[#f5efe5] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-3 text-[#8F9980]" />
                    <span>schedule Class</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('memberships')}
                  className="w-full text-left p-3 rounded-lg hover:bg-[#f5efe5] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-3 text-[#8F9980]" />
                    <span>My Memberships</span>
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
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-[#8F9980] text-[#8F9980]'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.name}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
                    
                    {/* Recent Bookings */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Recent Bookings</h3>
                        <button
                          onClick={() => setActiveTab('schedules')}
                          className="text-sm text-[#8F9980] hover:text-[#7a8570]"
                        >
                          View all
                        </button>
                      </div>
                      
                      {myBookedClasses.upcoming.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No upcoming classes</p>
                          <button
                            onClick={() => setActiveTab('schedules')}
                            className="mt-4 px-4 py-2 bg-[#8F9980] text-white rounded-lg font-medium hover:bg-[#7a8570] transition-colors"
                          >
                            Book a Class
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {myBookedClasses.upcoming.slice(0, 5).map((booking: any, index: number) => (
                            <motion.div
                              key={booking.booking_id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <div className="mb-3 md:mb-0">
                                  <div className="flex items-center mb-2">
                                    <span className="font-semibold text-gray-800">
                                      {booking.class_name}
                                    </span>
                                    <span className="mx-2 text-gray-300">•</span>
                                    {getStatusBadge(booking.status)}
                                  </div>
                                  <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4">
                                    <div className="flex items-center">
                                      <CalendarDays className="w-4 h-4 mr-2" />
                                      <span>{formatDate(booking.date)}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <ClockIcon className="w-4 h-4 mr-2" />
                                      <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                                    </div>
                                  </div>
                                </div>
                                {booking.can_cancel && (
                                  <button
                                    onClick={() => handleCancelBooking(booking.booking_id, booking.class_name, booking.date)}
                                    className="text-sm text-red-600 hover:text-red-800"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </motion.div>
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
                            <div className="text-2xl font-bold">
                              {userMembership?.package_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No Active Membership'}
                            </div>
                            <p className="text-sm opacity-90 mt-1">
                              {userMembership?.remaining_sessions || 0} sessions remaining
                            </p>
                            {userMembership?.valid_until && (
                              <p className="text-xs opacity-75 mt-1">
                                Valid until {new Date(userMembership.valid_until).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Award className="w-8 h-8 text-yellow-300" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <h3 className="text-lg font-bold mb-4">Next Booking</h3>
                        {myBookedClasses.upcoming.length > 0 ? (
                          <div>
                            <div className="text-2xl font-bold">
                              {myBookedClasses.upcoming[0]?.class_name}
                            </div>
                            <p className="text-sm opacity-90 mt-1">
                              {formatDate(myBookedClasses.upcoming[0]?.date)}
                            </p>
                            <p className="text-sm opacity-90">
                              {formatTime(myBookedClasses.upcoming[0]?.start_time)}
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

                    {/* Quick Links */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Links</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={() => setActiveTab('schedules')}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                        >
                          <div className="flex items-center mb-2">
                            <CalendarDays className="w-5 h-5 text-[#8F9980] mr-2" />
                            <span className="font-medium text-gray-800">schedule Classes</span>
                          </div>
                          <p className="text-sm text-gray-600">Browse and book available classes</p>
                        </button>
                        <button
                          onClick={() => setActiveTab('memberships')}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                        >
                          <div className="flex items-center mb-2">
                            <Package className="w-5 h-5 text-[#8F9980] mr-2" />
                            <span className="font-medium text-gray-800">My Memberships</span>
                          </div>
                          <p className="text-sm text-gray-600">View your membership details</p>
                        </button>
                        <button
                          onClick={() => setActiveTab('payment')}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                        >
                          <div className="flex items-center mb-2">
                            <CreditCard className="w-5 h-5 text-[#8F9980] mr-2" />
                            <span className="font-medium text-gray-800">View Payments</span>
                          </div>
                          <p className="text-sm text-gray-600">Check your payment history</p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCHEDULES TAB */}
                {/* SCHEDULES TAB - WEEKLY RECURRING BOOKING */}
{activeTab === 'schedules' && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">schedule Classes</h2>
        <p className="text-gray-600">Choose between weekly recurring or single sessions</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBookingType('weekly')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              bookingType === 'weekly'
                ? 'bg-[#8F9980] text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => setBookingType('single')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              bookingType === 'single'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Single Sessions
          </button>
        </div>
        <button
          onClick={fetchAvailableClasses}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>
    </div>

    {/* Membership Status */}
    {userMembership && (
      <div className={`mb-6 p-4 rounded-lg ${
        userMembership.is_active 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'
          : 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-3 md:mb-0">
            <div className="flex items-center mb-1">
              <Package className="w-5 h-5 mr-2 text-gray-600" />
              <span className="font-semibold text-gray-800">
                {userMembership.package_type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No Membership'}
              </span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                userMembership.is_active 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {userMembership.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {userMembership.remaining_sessions > 0 
                ? `${userMembership.remaining_sessions} sessions remaining` 
                : 'No sessions available'}
              {userMembership.valid_until && (
                <span className="ml-4">
                  • Valid until {new Date(userMembership.valid_until).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* My Weekly Bookings */}
    {myWeeklyBookings.length > 0 && (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">My Weekly Bookings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myWeeklyBookings.map((booking: any) => (
            <div key={booking.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{booking.class_name}</h4>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium mt-1">
                    Weekly Recurring
                  </span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  <span>Every {booking.day_of_week}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                </div>
                {booking.instructor && (
                  <div className="flex items-center text-sm text-gray-600">
                    <UsersIcon className="w-4 h-4 mr-2" />
                    <span>Instructor: {booking.instructor}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleCancelWeeklyBooking(booking)}
                className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors text-sm"
              >
                Cancel Weekly Booking
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* My Single Session Bookings */}
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        My Upcoming Single Sessions ({myBookedClasses.upcoming?.length || 0})
      </h3>
      {myBookedClasses.upcoming?.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No upcoming single sessions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myBookedClasses.upcoming?.map((booking: any) => (
            <div key={booking.booking_id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-800">{booking.class_name}</h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Booked
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  <span>{formatDate(booking.date)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleCancelBooking(booking.booking_id, booking.class_name, booking.date)}
                className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors text-sm"
              >
                Cancel Booking
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* WEEKLY SCHEDULE VIEW */}
    {bookingType === 'weekly' ? (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#8F9980] to-green-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white">Weekly Class Schedule</h3>
          <p className="text-white/90 text-sm mt-1">
            Book once for your preferred weekly time slot
          </p>
        </div>
        
        <div className="p-6">
          {/* Day Selection Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 border-b pb-2">
              <button
                onClick={() => setSelectedDay('')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDay === ''
                    ? 'bg-[#8F9980] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Days
              </button>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDay === day
                      ? 'bg-[#8F9980] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {scheduleLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8F9980] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading weekly schedule...</p>
            </div>
          ) : recurringSchedule.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No weekly schedule available</h3>
              <p className="text-gray-500">Check back later for scheduled classes</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Show selected day or all days */}
              {(selectedDay 
                ? [{ day_of_week: selectedDay, classes: recurringSchedule.filter((s: any) => s.day_of_week === selectedDay) }]
                : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                  .map(day => ({
                    day_of_week: day,
                    classes: recurringSchedule.filter((s: any) => s.day_of_week === day)
                  }))
                  .filter(day => day.classes.length > 0)
              ).map((dayGroup: any) => (
                <motion.div
                  key={dayGroup.day_of_week}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <h4 className="font-bold text-lg text-gray-800">{dayGroup.day_of_week}</h4>
                    <p className="text-sm text-gray-600">
                      {dayGroup.classes.length} class{dayGroup.classes.length !== 1 ? 'es' : ''} available
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dayGroup.classes.map((schedule: any) => {
                        // Check if user has already booked this weekly schedule
                        const isBooked = myWeeklyBookings.some(
                          (b: any) => b.weekly_schedule_id === schedule.id
                        );
                        
                        const canBook = !isBooked && 
                                       userMembership?.is_active && 
                                       userMembership?.remaining_sessions > 0;
                        
                        return (
                          <div
                            key={schedule.id}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                              isBooked ? 'bg-gray-50' : 'bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-semibold text-gray-800">{schedule.class_name}</h5>
                                <p className="text-sm text-gray-600">
                                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end">
                                <div>
                                  {isBooked ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                      Booked
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                      Available
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {schedule.instructor && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <UsersIcon className="w-3 h-3 mr-2" />
                                  <span>{schedule.instructor}</span>
                                </div>
                              )}
                              {schedule.location && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <LocationIcon className="w-3 h-3 mr-2" />
                                  <span>{schedule.location}</span>
                                </div>
                              )}
                              {schedule.max_capacity && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Users className="w-3 h-3 mr-2" />
                                  <span>Max: {schedule.max_capacity}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="pt-3 border-t">
                              {isBooked ? (
                                <button
                                  disabled
                                  className="w-full px-3 py-2 bg-gray-100 text-gray-400 rounded-md font-medium cursor-not-allowed text-sm"
                                >
                                  Already Booked Weekly
                                </button>
                              ) : !userMembership?.is_active ? (
                                <button
                                  disabled
                                  className="w-full px-3 py-2 bg-gray-100 text-gray-400 rounded-md font-medium cursor-not-allowed text-sm"
                                >
                                  Membership Required
                                </button>
                              ) : userMembership?.remaining_sessions <= 0 ? (
                                <button
                                  disabled
                                  className="w-full px-3 py-2 bg-gray-100 text-gray-400 rounded-md font-medium cursor-not-allowed text-sm"
                                >
                                  No Sessions Available
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBookWeeklyClass(schedule)}
                                  disabled={bookingLoading === schedule.id}
                                  className="w-full px-3 py-2 bg-[#8F9980] text-white rounded-md font-medium hover:bg-[#7a8570] transition-colors text-sm flex items-center justify-center"
                                >
                                  {bookingLoading === schedule.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                      Booking...
                                    </>
                                  ) : (
                                    'Book Weekly'
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    ) : (
      /* SINGLE SESSION BOOKING VIEW */
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white">Single Session Booking</h3>
          <p className="text-white/90 text-sm mt-1">
            Book individual classes for specific dates
          </p>
        </div>
        
        <div className="p-6">
          {/* Date range selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3">Select Date Range</h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={scheduleFilters.date_from || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduleFilters({
                    ...scheduleFilters,
                    date_from: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={scheduleFilters.date_to || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  onChange={(e) => setScheduleFilters({
                    ...scheduleFilters,
                    date_to: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={scheduleFilters.date_from || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {availableClasses.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No classes available</h3>
              <p className="text-gray-500">Try adjusting your date range or check back later</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group classes by date */}
              {(() => {
                const groupedByDate: { [key: string]: any[] } = {};
                
                availableClasses.forEach(schedule => {
                  const date = new Date(schedule.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  
                  if (!groupedByDate[date]) {
                    groupedByDate[date] = [];
                  }
                  
                  groupedByDate[date].push(schedule);
                });
                
                return Object.entries(groupedByDate).map(([date, classes]) => (
                  <div key={date} className="border rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-6 py-4 border-b">
                      <h4 className="font-bold text-lg text-gray-800">{date}</h4>
                      <p className="text-sm text-gray-600">
                        {classes.length} session{classes.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map((schedule: any) => (
                          <div key={schedule.id} className="border rounded-lg p-4">
                            {/* Single session booking card */}
                            {/* You can reuse the existing single session booking UI */}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    )}

    {/* Booking Instructions */}
    <div className="mt-8 p-6 bg-gradient-to-r from-[#f5efe5] to-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        {bookingType === 'weekly' ? 'How Weekly Booking Works' : 'How Single Session Booking Works'}
      </h3>
      {bookingType === 'weekly' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start">
            <div className="bg-[#8F9980] rounded-full p-2 mr-3">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">1. Choose Day & Time</h4>
              <p className="text-sm text-gray-600 mt-1">Select your preferred weekly schedule</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-[#8F9980] rounded-full p-2 mr-3">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">2. Book Once</h4>
              <p className="text-sm text-gray-600 mt-1">Book recurring with one click</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-[#8F9980] rounded-full p-2 mr-3">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">3. Attend Weekly</h4>
              <p className="text-sm text-gray-600 mt-1">Same time, same class every week</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full p-2 mr-3">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">1. Select Date</h4>
              <p className="text-sm text-gray-600 mt-1">Pick specific dates for classes</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full p-2 mr-3">
              <ClockIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">2. Choose Time</h4>
              <p className="text-sm text-gray-600 mt-1">Select available time slots</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full p-2 mr-3">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">3. Book Session</h4>
              <p className="text-sm text-gray-600 mt-1">One-time booking for selected date</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}

                {/* CLASSES TAB */}
                {activeTab === 'classes' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">My Classes</h2>
                        <p className="text-gray-600">Showing {getFilteredClasses().length} classes</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('schedules')}
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
                          All Classes ({getClassBookings().length})
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
                        <button
                          onClick={() => setClassFilter('past')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            classFilter === 'past'
                              ? 'border-[#8F9980] text-[#8F9980]'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Completed ({pastClasses})
                        </button>
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
                              onClick={() => setActiveTab('schedules')}
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
                              onClick={() => setActiveTab('schedules')}
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
                                        Past
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
                                    {isUpcoming && booking.can_cancel && (
                                      <button
                                        onClick={() => handleCancelBooking(booking.id, className, getBookingDate(booking))}
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

                {/* MEMBERSHIPS TAB */}
                {activeTab === 'memberships' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">My Memberships</h2>
                        <p className="text-gray-600">Manage your membership packages</p>
                      </div>
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
                                          onClick={() => setActiveTab('schedules')}
                                          className="px-4 py-2 bg-[#8F9980] text-white rounded-md font-medium hover:bg-[#7a8570] transition-colors text-sm"
                                        >
                                          schedule Classes
                                        </button>
                                      )}
                                      {membership.status === 'pending' && (
                                        <div className="text-sm text-yellow-600">
                                          Pending Approval
                                        </div>
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

                {/* PAYMENT TAB */}
                {activeTab === 'payment' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
                        <p className="text-gray-600">All your transactions and payments</p>
                      </div>
                      <button
                        onClick={handleExportPayments}
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

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
                    <div className="space-y-6">
                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Change Password</h3>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Current Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.current_password}
                              onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.new_password}
                              onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.confirm_password}
                              onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
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
                            <input 
                              type="checkbox" 
                              className="rounded text-[#8F9980]" 
                              checked={settings.email_notifications}
                              onChange={() => handleUpdateSettings('email_notifications')}
                            />
                            <span className="ml-2">Email notifications for new classes</span>
                          </label>
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="rounded text-[#8F9980]" 
                              checked={settings.reminder_notifications}
                              onChange={() => handleUpdateSettings('reminder_notifications')}
                            />
                            <span className="ml-2">Reminders for upcoming classes</span>
                          </label>
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="rounded text-[#8F9980]" 
                              checked={settings.promotional_emails}
                              onChange={() => handleUpdateSettings('promotional_emails')}
                            />
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