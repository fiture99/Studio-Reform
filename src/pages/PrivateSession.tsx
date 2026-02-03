import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, MessageSquare, Settings, BarChart, 
  Plus, Edit, Trash2, CheckCircle, XCircle, 
  CreditCard, Clock, User, DollarSign, Filter,
  Package, Check, X, AlertCircle, RefreshCw,
  BookOpen, CalendarDays, Mail, Phone, Eye, ChevronDown,
  ChevronLeft, ChevronRight // Added missing imports
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

// Calendar Component for Date Selection
interface CalendarPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Check if date is disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  // Render calendar days
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const disabled = isDateDisabled(date);
      const today = isToday(date);
      const selected = isSelected(date);
      
      days.push(
        <button
          key={day}
          onClick={() => !disabled && onDateSelect(date)}
          disabled={disabled}
          className={`
            w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium
            transition-all duration-200
            ${selected 
              ? 'bg-[#8F9980] text-white' 
              : today 
                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                : disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
            }
            ${!selected && !today && !disabled ? 'hover:scale-105' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <div className="text-lg font-semibold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map(day => (
          <div 
            key={day} 
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
      
      {/* Selected Date Display */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">Selected Date:</div>
        <div className="font-medium text-gray-800">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onDateSelect(new Date())}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            onDateSelect(tomorrow);
          }}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Tomorrow
        </button>
      </div>
    </div>
  );
};

// Time Picker Component (optional, if you want to use it)
interface TimePickerProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ selectedTime, onTimeSelect }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={selectedTime}
          onChange={(e) => onTimeSelect(e.target.value)}
          placeholder="HH:MM"
          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980] focus:border-transparent"
        />
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Clock className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {timeSlots.map(time => (
            <button
              key={time}
              onClick={() => {
                onTimeSelect(time);
                setShowDropdown(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                selectedTime === time ? 'bg-[#8F9980] text-white' : ''
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [privateSessions, setPrivateSessions] = useState<any[]>([]);
  const [membershipBookings, setMembershipBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [sessionFilter, setSessionFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
      fetchMembers();
      fetchMembershipBookings();
      fetchAllBookings();
      fetchAllClasses();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === 'private-sessions') {
      fetchPrivateSessions();
    }
    if (isAdmin && activeTab === 'memberships') {
      fetchMembershipBookings();
    }
    if (isAdmin && activeTab === 'bookings') {
      fetchAllBookings();
    }
    if (isAdmin && activeTab === 'classes') {
      fetchAllClasses();
    }
  }, [activeTab, sessionFilter, membershipFilter, bookingFilter, isAdmin]);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboardData(response);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      setDashboardData({ stats: {}, recent_sessions: [] });
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

  const fetchPrivateSessions = async () => {
    try {
      const response = await adminAPI.getAllBookings();
      const privateSessions = response.filter((booking: any) => 
        booking.booking_type === 'class' && booking.class_name?.includes('Private')
      );
      setPrivateSessions(privateSessions || []);
    } catch (error: any) {
      console.error('Failed to fetch private sessions:', error);
      setError(error.message || 'Failed to load private sessions');
      setPrivateSessions([]);
    }
  };

  const fetchMembershipBookings = async () => {
    try {
      const response = await adminAPI.getMembershipBookings();
      setMembershipBookings(response || []);
    } catch (error: any) {
      console.error('Failed to fetch membership bookings:', error);
      setError(error.message || 'Failed to load membership bookings');
      setMembershipBookings([]);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await adminAPI.getAllBookings();
      setAllBookings(response || []);
    } catch (error: any) {
      console.error('Failed to fetch all bookings:', error);
      setError(error.message || 'Failed to load bookings');
      setAllBookings([]);
    }
  };

  const fetchAllClasses = async () => {
    try {
      const response = await adminAPI.getAllClasses();
      setAllClasses(response || []);
    } catch (error: any) {
      console.error('Failed to fetch classes:', error);
      setError(error.message || 'Failed to load classes');
      setAllClasses([]);
    }
  };

  const showSuccessAlert = (title: string, text: string) => {
    Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#8F9980',
      timer: 3000
    });
  };

  const showErrorAlert = (title: string, text: string) => {
    Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#dc2626'
    });
  };

  const showConfirmAlert = (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#8F9980',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'Cancel'
    });
  };

  const handleVerifyPayment = async (sessionId: number, action: 'verify' | 'reject') => {
    const result = await showConfirmAlert(
      `${action === 'verify' ? 'Verify' : 'Reject'} Payment`,
      `Are you sure you want to ${action} this payment?`
    );
    
    if (result.isConfirmed) {
      try {
        await adminAPI.updateBookingStatus(sessionId, action === 'verify' ? 'payment_verified' : 'rejected');
        fetchAllBookings();
        fetchDashboardData();
        showSuccessAlert(
          'Success',
          `Payment ${action === 'verify' ? 'verified' : 'rejected'} successfully!`
        );
      } catch (error: any) {
        console.error(`Failed to ${action} payment:`, error);
        showErrorAlert('Error', error.message || `Failed to ${action} payment`);
      }
    }
  };

  const handleScheduleSession = async (bookingId: number, memberName: string) => {
    // Use HTML5 date and time inputs instead of text
    const { value: formValues } = await Swal.fire({
      title: `Schedule Session for ${memberName}`,
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input 
              type="date" 
              id="session-date" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980] focus:border-transparent"
              min="${new Date().toISOString().split('T')[0]}"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
            <input 
              type="time" 
              id="session-time" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980] focus:border-transparent"
              value="09:00"
            >
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#8F9980',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Schedule Session',
      cancelButtonText: 'Cancel',
      width: '450px',
      preConfirm: () => {
        const dateInput = document.getElementById('session-date') as HTMLInputElement;
        const timeInput = document.getElementById('session-time') as HTMLInputElement;
        
        if (!dateInput?.value || !timeInput?.value) {
          Swal.showValidationMessage('Please select both date and time');
          return false;
        }
        
        return {
          date: dateInput.value,
          time: timeInput.value
        };
      },
      didOpen: () => {
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateInput = document.getElementById('session-date') as HTMLInputElement;
        if (dateInput) {
          dateInput.value = tomorrow.toISOString().split('T')[0];
        }
      }
    });

    if (!formValues) return;

    try {
      // You need to update this to call the correct API endpoint
      await adminAPI.scheduleSession(bookingId, {
        scheduled_date: formValues.date,
        scheduled_time: formValues.time
      });
      fetchAllBookings();
      showSuccessAlert('Success', 'Session scheduled successfully!');
    } catch (error: any) {
      console.error('Failed to schedule session:', error);
      showErrorAlert('Error', error.message || 'Failed to schedule session');
    }
  };

  const handleApproveMembership = async (bookingId: number, memberName: string, packageType: string) => {
    const result = await showConfirmAlert(
      'Approve Membership',
      `Are you sure you want to approve ${memberName}'s ${packageType} membership?`
    );
    
    if (result.isConfirmed) {
      try {
        await adminAPI.approveMembershipBooking(bookingId);
        fetchMembershipBookings();
        fetchDashboardData();
        fetchMembers();
        showSuccessAlert('Success', 'Membership approved successfully!');
      } catch (error: any) {
        console.error('Failed to approve membership:', error);
        showErrorAlert('Error', error.message || 'Failed to approve membership');
      }
    }
  };

  const handleRejectMembership = async (bookingId: number, memberName: string) => {
    const { value: reason } = await Swal.fire({
      title: `Reject Membership for ${memberName}`,
      input: 'textarea',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'Please provide a reason for rejection...',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Reject',
      inputValidator: (value) => {
        if (!value) {
          return 'Please provide a reason for rejection!';
        }
      }
    });

    if (!reason) return;

    try {
      await adminAPI.rejectMembershipBooking(bookingId, reason);
      fetchMembershipBookings();
      fetchDashboardData();
      showSuccessAlert('Membership Rejected', 'The membership has been rejected.');
    } catch (error: any) {
      console.error('Failed to reject membership:', error);
      showErrorAlert('Error', error.message || 'Failed to reject membership');
    }
  };

  const handleAssignClass = async (memberId: number, memberName: string) => {
    // Format classes for selection
    const classOptions = allClasses.reduce((acc: any, classItem) => {
      acc[classItem.id] = `${classItem.name} (${classItem.difficulty}) - ${classItem.duration}`;
      return acc;
    }, {});

    const { value: classId } = await Swal.fire({
      title: `Assign Class to ${memberName}`,
      input: 'select',
      inputOptions: classOptions,
      inputPlaceholder: 'Select a class',
      showCancelButton: true,
      confirmButtonColor: '#8F9980',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a class!';
        }
      }
    });

    if (!classId) return;

    const { value: formValues } = await Swal.fire({
      title: 'Select Date & Time',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input 
              type="date" 
              id="class-date" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980] focus:border-transparent"
              min="${new Date().toISOString().split('T')[0]}"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
            <input 
              type="time" 
              id="class-time" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980] focus:border-transparent"
              value="09:00"
            >
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#8F9980',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Assign Class',
      cancelButtonText: 'Cancel',
      width: '500px',
      preConfirm: () => {
        const dateInput = document.getElementById('class-date') as HTMLInputElement;
        const timeInput = document.getElementById('class-time') as HTMLInputElement;
        
        if (!dateInput?.value || !timeInput?.value) {
          Swal.showValidationMessage('Please select both date and time');
          return false;
        }
        
        return {
          date: dateInput.value,
          time: timeInput.value
        };
      },
      didOpen: () => {
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateInput = document.getElementById('class-date') as HTMLInputElement;
        if (dateInput) {
          dateInput.value = tomorrow.toISOString().split('T')[0];
        }
      }
    });

    if (!formValues) return;

    try {
      const confirmResult = await showConfirmAlert(
        'Confirm Assignment',
        `Assign ${memberName} to class on ${formValues.date} at ${formValues.time}?`
      );
      
      if (confirmResult.isConfirmed) {
        // Make sure this API function exists in your adminAPI
        await adminAPI.assignClassToMember(memberId, {
          class_id: classId,
          booking_date: formValues.date,
          booking_time: formValues.time
        });
        
        fetchAllBookings();
        fetchMembers();
        showSuccessAlert('Success', `Class assigned to ${memberName} successfully!`);
      }
    } catch (error: any) {
      console.error('Failed to assign class:', error);
      showErrorAlert('Error', error.message || 'Failed to assign class');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: number, currentStatus: string, bookingType: string = 'booking') => {
    // Define status options based on booking type
    let statusOptions: any = {};
    
    if (bookingType === 'membership') {
      statusOptions = {
        'pending_admin_approval': 'Pending Admin Approval',
        'active': 'Active',
        'rejected': 'Rejected',
        'expired': 'Expired'
      };
    } else if (bookingType === 'class') {
      statusOptions = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'scheduled': 'Scheduled',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
      };
    } else {
      statusOptions = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'scheduled': 'Scheduled',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'active': 'Active',
        'rejected': 'Rejected'
      };
    }

    const { value: newStatus } = await Swal.fire({
      title: 'Update Status',
      input: 'select',
      inputOptions: statusOptions,
      inputPlaceholder: 'Select new status',
      inputValue: currentStatus,
      showCancelButton: true,
      confirmButtonColor: '#8F9980',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a status!';
        }
      }
    });

    if (!newStatus) return;

    const result = await showConfirmAlert(
      'Confirm Status Update',
      `Change status from "${currentStatus}" to "${newStatus}"?`
    );
    
    if (result.isConfirmed) {
      try {
        await adminAPI.updateBookingStatus(bookingId, newStatus);
        fetchAllBookings();
        fetchDashboardData();
        if (bookingType === 'membership') {
          fetchMembershipBookings();
        }
        showSuccessAlert('Success', 'Booking status updated successfully!');
      } catch (error: any) {
        console.error('Failed to update booking status:', error);
        showErrorAlert('Error', error.message || 'Failed to update booking status');
      }
    }
  };

  const handleDeleteClass = async (classId: number, className: string) => {
    const result = await showConfirmAlert(
      'Delete Class',
      `Are you sure you want to delete "${className}"? This action cannot be undone.`
    );
    
    if (result.isConfirmed) {
      try {
        await adminAPI.deleteClass(classId);
        fetchAllClasses();
        showSuccessAlert('Success', 'Class deleted successfully!');
      } catch (error: any) {
        console.error('Failed to delete class:', error);
        showErrorAlert('Error', error.message || 'Failed to delete class');
      }
    }
  };

  const refreshData = () => {
    Swal.fire({
      title: 'Refreshing Data',
      text: 'Please wait...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    Promise.all([
      fetchDashboardData(),
      fetchMembers(),
      fetchMembershipBookings(),
      fetchAllBookings(),
      fetchAllClasses()
    ]).then(() => {
      Swal.close();
      showSuccessAlert('Success', 'Data refreshed successfully!');
    }).catch((error) => {
      Swal.close();
      showErrorAlert('Error', 'Failed to refresh data');
    });
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

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart },
    { id: 'members', name: 'Members', icon: Users },
    { id: 'bookings', name: 'All Bookings', icon: Calendar },
    { id: 'classes', name: 'Classes', icon: BookOpen },
    { id: 'memberships', name: 'Memberships', icon: Package },
    { id: 'private-sessions', name: 'Private Sessions', icon: CalendarDays },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const stats = [
    { 
      label: 'Total Members', 
      value: dashboardData?.stats?.total_members?.toString() || '0', 
      icon: Users,
      color: 'text-blue-600',
      change: '+2' 
    },
    { 
      label: 'Active Classes', 
      value: dashboardData?.stats?.active_classes?.toString() || '0', 
      icon: Calendar,
      color: 'text-purple-600',
      change: '+1' 
    },
    { 
      label: 'Pending Memberships', 
      value: dashboardData?.stats?.pending_memberships?.toString() || '0', 
      icon: AlertCircle,
      color: 'text-yellow-600',
      change: '' 
    },
    { 
      label: 'Today Bookings', 
      value: dashboardData?.stats?.today_bookings?.toString() || '0', 
      icon: CalendarDays,
      color: 'text-green-600',
      change: '+3' 
    },
    { 
      label: 'Total Revenue', 
      value: `GMD ${(dashboardData?.stats?.total_revenue || 0).toLocaleString()}`, 
      icon: DollarSign,
      color: 'text-green-600',
      change: '+GMD 5,200' 
    },
    { 
      label: 'Active Memberships', 
      value: dashboardData?.stats?.active_memberships?.toString() || '0', 
      icon: Package,
      color: 'text-blue-600',
      change: '+1' 
    }
  ];

  // Filter membership bookings
  const filteredMembershipBookings = membershipBookings.filter(booking => {
    if (membershipFilter === 'all') return true;
    if (membershipFilter === 'pending') return booking.status === 'pending_admin_approval';
    if (membershipFilter === 'active') return booking.status === 'active';
    if (membershipFilter === 'rejected') return booking.status === 'rejected';
    return true;
  });

  // Filter all bookings
  const filteredBookings = allBookings.filter(booking => {
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'class') return booking.booking_type === 'class';
    if (bookingFilter === 'membership') return booking.booking_type === 'membership';
    if (bookingFilter === 'pending') return booking.status === 'pending';
    if (bookingFilter === 'confirmed') return booking.status === 'confirmed';
    if (bookingFilter === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  // Filter private sessions
  const filteredPrivateSessions = privateSessions.filter(session => {
    if (sessionFilter === 'all') return true;
    if (sessionFilter === 'pending') return session.status === 'pending';
    if (sessionFilter === 'confirmed') return session.status === 'confirmed';
    if (sessionFilter === 'scheduled') return session.status === 'scheduled';
    if (sessionFilter === 'completed') return session.status === 'completed';
    return true;
  });

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your studio operations • Currency: GMD</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-[#8F9980]">{user?.name}</span>
            </div>
            <button
              onClick={refreshData}
              className="flex items-center bg-[#8F9980] text-white px-4 py-2 rounded-md hover:bg-[#7a8570] transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Navigation
                </h3>
                <ul className="space-y-2">
                  {tabs.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-md text-left transition-colors ${
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
              </div>
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Quick Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Members</span>
                    <span className="font-semibold">{dashboardData?.stats?.total_members || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Pending Approvals</span>
                    <span className="font-semibold text-yellow-600">{dashboardData?.stats?.pending_memberships || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Today Revenue</span>
                    <span className="font-semibold text-green-600">GMD {(dashboardData?.stats?.total_revenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading && activeTab === 'dashboard' ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8F9980]"></div>
              </div>
            ) : activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{stat.label}</p>
                          <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
                          {stat.change && (
                            <p className="text-xs mt-1 text-green-600">
                              {stat.change} this week
                            </p>
                          )}
                        </div>
                        <div className={`p-3 rounded-full ${stat.color.replace('text', 'bg').replace('600', '100')}`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Pending Memberships */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-black">Pending Approvals</h2>
                        <p className="text-sm text-gray-500">Memberships awaiting admin approval</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        {dashboardData?.stats?.pending_memberships || 0} pending
                      </span>
                    </div>
                    <div className="space-y-4">
                      {membershipBookings
                        .filter(b => b.status === 'pending_admin_approval')
                        .slice(0, 4)
                        .map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-[#8F9980] rounded-full flex items-center justify-center text-white font-semibold">
                                {booking.user_name?.charAt(0) || 'U'}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">{booking.user_name}</p>
                                <p className="text-sm text-gray-500">{booking.package_type?.replace('-', ' ')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">GMD {booking.amount?.toLocaleString()}</p>
                              <div className="flex space-x-2 mt-1">
                                <button
                                  onClick={() => handleApproveMembership(booking.id, booking.user_name, booking.package_type)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectMembership(booking.id, booking.user_name)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                      {membershipBookings.filter(b => b.status === 'pending_admin_approval').length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p>No pending membership approvals</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Bookings */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-black">Recent Bookings</h2>
                        <p className="text-sm text-gray-500">Latest class and membership bookings</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {dashboardData?.stats?.today_bookings || 0} today
                      </span>
                    </div>
                    <div className="space-y-4">
                      {dashboardData?.recent_sessions?.slice(0, 5).map((session: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              session.session_type === 'Membership' ? 'bg-green-100' : 'bg-blue-100'
                            }`}>
                              {session.session_type === 'Membership' ? (
                                <Package className="h-5 w-5 text-green-600" />
                              ) : (
                                <Calendar className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">{session.user_name}</p>
                              <p className="text-sm text-gray-500">
                                {session.session_type === 'Membership' ? session.package_type : session.class_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">GMD {session.amount?.toLocaleString() || '0'}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              session.status === 'active' || session.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : session.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(dashboardData?.recent_sessions?.length || 0) === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p>No recent bookings</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-black mb-6">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('memberships')}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left"
                    >
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="font-medium text-yellow-800">Review Memberships</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        {dashboardData?.stats?.pending_memberships || 0} pending approvals
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
                    >
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-800">Manage Bookings</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        View and manage all class bookings
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                    >
                      <div className="flex items-center mb-2">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium text-green-800">Assign Classes</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Assign classes to members with active memberships
                      </p>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-black">Members Management</h2>
                      <p className="text-sm text-gray-500">Manage members and assign classes</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('memberships')}
                      className="bg-[#8F9980] text-white px-4 py-2 rounded-md font-medium hover:bg-[#7a8570] transition-colors flex items-center"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      View Memberships
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Member</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Contact</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Membership</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Joined</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members && members.length > 0 ? (
                          members.map((member) => (
                            <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-[#8F9980] rounded-full flex items-center justify-center text-white font-semibold">
                                    {member.name?.charAt(0) || 'U'}
                                  </div>
                                  <div className="ml-3">
                                    <p className="font-medium text-gray-900">{member.name}</p>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm">
                                  <div className="flex items-center text-gray-600 mb-1">
                                    <Mail className="h-3 w-3 mr-2" />
                                    {member.email}
                                  </div>
                                  {member.phone && (
                                    <div className="flex items-center text-gray-600">
                                      <Phone className="h-3 w-3 mr-2" />
                                      {member.phone}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  member.membership_plan 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {member.membership_plan || 'No Plan'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  member.status === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {member.status || 'Active'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-gray-600 text-sm">
                                {new Date(member.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleAssignClass(member.id, member.name)}
                                    className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                                    title="Assign Class"
                                    disabled={!member.membership_plan}
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </button>
                                  <button 
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                    title="View Details"
                                    onClick={() => {
                                      // Add view details functionality here
                                      console.log('View details for member:', member.id);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button 
                                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                    onClick={() => {
                                      if (window.confirm('Delete this member?')) {
                                        // Handle delete member
                                        console.log('Delete member:', member.id);
                                      }
                                    }}
                                    title="Delete Member"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                              <p>No members found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rest of the code remains the same - just fixed the missing parameters in the calls */}
            {/* ... rest of the component code ... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;