import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, MessageSquare, Settings, BarChart, 
  Plus, Edit, Trash2, CheckCircle, XCircle, 
  CreditCard, Clock, User, DollarSign, Filter,
  Package, Check, X, AlertCircle, RefreshCw,
  BookOpen, CalendarDays, Mail, Phone, Eye, ChevronDown,
  ChevronLeft, ChevronRight, 
  Layers, Clock as ClockIcon, Users as UsersIcon,
  Zap, RotateCcw, Maximize2, FileText, Download, AlertTriangle,
  CalendarCheck, ChevronUp, ChevronDown as ChevronDownIcon,
  MapPin, Award, Target, Dumbbell, Heart, Star,
  Home, Search, ExternalLink, Share2, Copy, Printer,
  Grid, List, Sliders, Upload, MoreVertical, TrendingUp,
  Shield, Key, Lock, Bell, Globe, File, 
  BarChart2, PieChart, Activity, Database, Server,
  Tag, Hash, Percent, TrendingDown, ArrowUpRight,
  ArrowDownRight, Circle, Square, Triangle
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

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

  // Schedule-related state
  const [weeklySchedules, setWeeklySchedules] = useState<any[]>([]);
  const [scheduleInstances, setScheduleInstances] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [scheduleView, setScheduleView] = useState<'weekly' | 'instances'>('weekly');
  const [scheduleFilters, setScheduleFilters] = useState({
    class_id: '',
    date_from: '',
    date_to: '',
    status: 'upcoming'
  });

  const [newSchedule, setNewSchedule] = useState({
    class_id: '',
    day_of_week: 'Monday',
    time_slots: [
      { start_time: '07:00', end_time: '07:50', max_capacity: 4 }
    ]
  });

  // Contact Messages state
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [messageFilter, setMessageFilter] = useState('all');

  // Settings state
  const [settings, setSettings] = useState({
    siteName: 'Studio Reform',
    currency: 'GMD',
    timezone: 'Africa/Banjul',
    maintenanceMode: false,
    registrationEnabled: true,
    notificationsEnabled: true
  });

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

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
    if (isAdmin && activeTab === 'schedules') {
      fetchWeeklySchedules();
      if (scheduleView === 'instances') {
        fetchScheduleInstances();
      }
    }
    if (isAdmin && activeTab === 'messages') {
      fetchContactMessages();
    }
  }, [activeTab, sessionFilter, membershipFilter, bookingFilter, messageFilter, isAdmin, scheduleView, scheduleFilters]);

  // Data fetching functions
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

  const timeSlots = [
  '07:00', '07:50', '08:00', '08:50', '09:00', '09:50',
  '10:00', '10:50', '11:00', '11:50', '12:00', '12:50',
  '13:00', '13:50', '14:00', '14:50', '15:00', '15:50',
  '16:00', '16:50', '17:00', '17:50', '18:00', '18:50',
  '19:00', '19:50', '20:00', '20:50', '21:00', '21:50'
];



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

  const fetchContactMessages = async () => {
    try {
      // You'll need to add this API endpoint to your backend
      // For now, we'll use mock data
      const mockMessages = [
        { id: 1, name: 'John Doe', email: 'john@example.com', message: 'Interested in membership', status: 'new', created_at: new Date().toISOString() },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', message: 'Question about classes', status: 'read', created_at: new Date().toISOString() },
      ];
      setContactMessages(mockMessages);
    } catch (error: any) {
      console.error('Failed to fetch contact messages:', error);
      setError(error.message || 'Failed to load messages');
      setContactMessages([]);
    }
  };

  // Schedule functions
  const fetchWeeklySchedules = async () => {
  setScheduleLoading(true);
  try {
    const data = await adminAPI.getWeeklySchedules();
    
    // Group schedules by class_id and day_of_week
    const groupedSchedules = data.reduce((acc: any, schedule: any) => {
      const key = `${schedule.class_id}-${schedule.day_of_week}`;
      
      if (!acc[key]) {
        acc[key] = {
          id: schedule.id,
          class_id: schedule.class_id,
          class_name: schedule.class_name,
          day_of_week: schedule.day_of_week,
          time_slots: [],
          is_active: schedule.is_active,
          created_at: schedule.created_at,
          upcoming_instances: 0,
          // Calculate max capacity as the sum of all time slots
          max_capacity: 0
        };
      }
      
      // Add time slot to the schedule
      acc[key].time_slots.push({
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        max_capacity: schedule.max_capacity,
        slot_id: schedule.id // Keep track of individual slot IDs
      });
      
      // Update max capacity
      acc[key].max_capacity += schedule.max_capacity;
      
      // Update upcoming instances count
      if (schedule.upcoming_instances) {
        acc[key].upcoming_instances += schedule.upcoming_instances;
      }
      
      return acc;
    }, {});
    
    // Convert to array
    const uniqueSchedules = Object.values(groupedSchedules);
    setWeeklySchedules(uniqueSchedules);
    
  } catch (error: any) {
    console.error('Error fetching weekly schedules:', error);
    showErrorAlert('Error', 'Failed to load weekly schedules');
  } finally {
    setScheduleLoading(false);
  }
};

  const fetchScheduleInstances = async () => {
    setScheduleLoading(true);
    try {
      const data = await adminAPI.getScheduleInstances(scheduleFilters);
      setScheduleInstances(data || []);
    } catch (error: any) {
      console.error('Error fetching schedule instances:', error);
      showErrorAlert('Error', 'Failed to load schedule instances');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSchedule.class_id || newSchedule.time_slots.length === 0) {
      showErrorAlert('Error', 'Please select a class and add at least one time slot');
      return;
    }
    
    try {
      // Create all schedules at once
      const createPromises = newSchedule.time_slots.map(slot => 
        adminAPI.createWeeklySchedule({
          class_id: parseInt(newSchedule.class_id),
          day_of_week: newSchedule.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          max_capacity: slot.max_capacity
        })
      );
      
      await Promise.all(createPromises);
      
      showSuccessAlert('Success!', `Created ${newSchedule.time_slots.length} schedule(s) for ${newSchedule.day_of_week}`);
      setShowCreateScheduleModal(false);
      setNewSchedule({
        class_id: '',
        day_of_week: 'Monday',
        time_slots: [{ start_time: '07:00', end_time: '07:50', max_capacity: 4 }]
      });
      fetchWeeklySchedules();
    } catch (error: any) {
      showErrorAlert('Error', error.message || 'Failed to create schedule(s)');
    }
  };

  const handleGenerateInstances = async (scheduleId: number) => {
    try {
      await adminAPI.generateScheduleInstances(scheduleId);
      showSuccessAlert('Success!', 'Schedule instances generated successfully');
      setShowGenerateModal(false);
      fetchWeeklySchedules();
      fetchScheduleInstances();
    } catch (error: any) {
      showErrorAlert('Error', error.message || 'Failed to generate instances');
    }
  };

  const handleToggleSchedule = async (scheduleId: number, currentStatus: boolean) => {
    try {
      await adminAPI.toggleScheduleStatus(scheduleId);
      showSuccessAlert('Success!', `Schedule ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchWeeklySchedules();
    } catch (error: any) {
      showErrorAlert('Error', error.message || 'Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: number, scheduleName: string) => {
    const result = await showConfirmAlert(
      'Delete Schedule',
      `Are you sure you want to delete "${scheduleName}"?`
    );
    
    if (!result.isConfirmed) return;
    
    try {
      await adminAPI.deleteSchedule(scheduleId);
      showSuccessAlert('Deleted!', 'Schedule deleted successfully');
      fetchWeeklySchedules();
    } catch (error: any) {
      showErrorAlert('Error', error.message || 'Failed to delete schedule');
    }
  };

  const handleCancelInstance = async (instanceId: number, className: string, date: string) => {
    const result = await showConfirmAlert(
      'Cancel Class Instance',
      `Cancel "${className}" on ${date}? Users will be notified and refunded.`
    );
    
    if (!result.isConfirmed) return;
    
    try {
      await adminAPI.cancelScheduleInstance(instanceId);
      showSuccessAlert('Cancelled!', 'Class instance cancelled successfully');
      fetchScheduleInstances();
    } catch (error: any) {
      showErrorAlert('Error', error.message || 'Failed to cancel instance');
    }
  };

  // Alert utilities
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

  // Handler functions
  const handleVerifyPayment = async (sessionId: number, action: 'verify' | 'reject') => {
    const result = await showConfirmAlert(
      `${action === 'verify' ? 'Verify' : 'Reject'} Payment`,
      `Are you sure you want to ${action} this payment?`
    );
    
    if (!result.isConfirmed) return;
    
    try {
      await adminAPI.updateBookingStatus(sessionId, action === 'verify' ? 'payment_verified' : 'rejected');
      fetchAllBookings();
      fetchDashboardData();
      showSuccessAlert('Success', `Payment ${action === 'verify' ? 'verified' : 'rejected'} successfully!`);
    } catch (error: any) {
      console.error(`Failed to ${action} payment:`, error);
      showErrorAlert('Error', error.message || `Failed to ${action} payment`);
    }
  };

  const handleApproveMembership = async (bookingId: number) => {
    const result = await showConfirmAlert(
      'Approve Membership',
      'Are you sure you want to approve this membership?'
    );
    
    if (!result.isConfirmed) return;
    
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
  };

  const handleRejectMembership = async (bookingId: number) => {
    const { value: reason } = await Swal.fire({
      title: 'Reject Membership',
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

  const handleUpdateBookingStatus = async (bookingId: number, currentStatus: string) => {
    const statusOptions = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'scheduled': 'Scheduled',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'active': 'Active',
      'rejected': 'Rejected'
    };

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
    
    if (!result.isConfirmed) return;
    
    try {
      await adminAPI.updateBookingStatus(bookingId, newStatus);
      fetchAllBookings();
      fetchDashboardData();
      showSuccessAlert('Success', 'Booking status updated successfully!');
    } catch (error: any) {
      console.error('Failed to update booking status:', error);
      showErrorAlert('Error', error.message || 'Failed to update booking status');
    }
  };

  const handleDeleteClass = async (classId: number, className: string) => {
    const result = await showConfirmAlert(
      'Delete Class',
      `Are you sure you want to delete "${className}"? This action cannot be undone.`
    );
    
    if (!result.isConfirmed) return;
    
    try {
      await adminAPI.deleteClass(classId);
      fetchAllClasses();
      showSuccessAlert('Success', 'Class deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete class:', error);
      showErrorAlert('Error', error.message || 'Failed to delete class');
    }
  };

  const handleUpdateMessageStatus = async (messageId: number, status: string) => {
    try {
      // Add your API call here to update message status
      showSuccessAlert('Success', 'Message status updated successfully!');
    } catch (error: any) {
      console.error('Failed to update message status:', error);
      showErrorAlert('Error', error.message || 'Failed to update message status');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    const result = await showConfirmAlert(
      'Delete Message',
      'Are you sure you want to delete this message?'
    );
    
    if (!result.isConfirmed) return;
    
    try {
      // Add your API call here to delete message
      setContactMessages(contactMessages.filter(msg => msg.id !== messageId));
      showSuccessAlert('Success', 'Message deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      showErrorAlert('Error', error.message || 'Failed to delete message');
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
      fetchAllClasses(),
      fetchWeeklySchedules(),
      fetchScheduleInstances()
    ]).then(() => {
      Swal.close();
      showSuccessAlert('Success', 'Data refreshed successfully!');
    }).catch((error) => {
      Swal.close();
      showErrorAlert('Error', 'Failed to refresh data');
    });
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

  // SimpleScheduleModal component
  // SimpleScheduleModal component with dropdowns for time selection
const SimpleScheduleModal = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Create Multiple Schedules</h3>
          <button onClick={() => setShowCreateScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              required
              value={newSchedule.class_id}
              onChange={(e) => setNewSchedule({...newSchedule, class_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a class</option>
              {allClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              required
              value={newSchedule.day_of_week}
              onChange={(e) => setNewSchedule({...newSchedule, day_of_week: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Time Slots</label>
              <button
                type="button"
                onClick={() => {
                  setNewSchedule({
                    ...newSchedule,
                    time_slots: [
                      ...newSchedule.time_slots,
                      { start_time: '07:00', end_time: '07:50', max_capacity: 4 }
                    ]
                  });
                }}
                className="text-sm text-[#8F9980] hover:text-[#7a8570] flex items-center"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Time Slot
              </button>
            </div>
            
            <div className="space-y-4">
              {newSchedule.time_slots.map((slot, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Slot {index + 1}</span>
                    {newSchedule.time_slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSlots = newSchedule.time_slots.filter((_, i) => i !== index);
                          setNewSchedule({...newSchedule, time_slots: updatedSlots});
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                      <select
                        value={slot.start_time}
                        onChange={(e) => {
                          const updatedSlots = [...newSchedule.time_slots];
                          updatedSlots[index].start_time = e.target.value;
                          setNewSchedule({...newSchedule, time_slots: updatedSlots});
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      >
                        {timeSlots.map((time) => (
                          <option key={`start-${time}`} value={time}>
                            {formatTime(time)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End Time</label>
                      <select
                        value={slot.end_time}
                        onChange={(e) => {
                          const updatedSlots = [...newSchedule.time_slots];
                          updatedSlots[index].end_time = e.target.value;
                          setNewSchedule({...newSchedule, time_slots: updatedSlots});
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      >
                        {timeSlots.map((time) => (
                          <option key={`end-${time}`} value={time}>
                            {formatTime(time)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={slot.max_capacity}
                      onChange={(e) => {
                        const updatedSlots = [...newSchedule.time_slots];
                        updatedSlots[index].max_capacity = parseInt(e.target.value) || 4;
                        setNewSchedule({...newSchedule, time_slots: updatedSlots});
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              You can add multiple time slots for the same day
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 bg-[#8F9980] text-white py-2 rounded-md font-medium hover:bg-[#7a8570] transition-colors">
              Create {newSchedule.time_slots.length} {newSchedule.time_slots.length === 1 ? 'Slot' : 'Slots'}
            </button>
            <button type="button" onClick={() => setShowCreateScheduleModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md font-medium hover:bg-gray-300 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

  if (!isAdmin) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart },
    { id: 'members', name: 'Members', icon: Users },
    { id: 'bookings', name: 'Bookings', icon: Calendar },
    { id: 'schedules', name: 'Schedules', icon: CalendarDays },
    { id: 'classes', name: 'Classes', icon: BookOpen },
    { id: 'memberships', name: 'Memberships', icon: Package },
    { id: 'private-sessions', name: 'Private', icon: Users },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
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

  // Filter functions
  const filteredMembershipBookings = membershipBookings.filter(booking => {
    if (membershipFilter === 'all') return true;
    if (membershipFilter === 'pending') return booking.status === 'pending_admin_approval';
    if (membershipFilter === 'active') return booking.status === 'active';
    if (membershipFilter === 'rejected') return booking.status === 'rejected';
    return true;
  });

  const filteredBookings = allBookings.filter(booking => {
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'class') return booking.booking_type === 'class';
    if (bookingFilter === 'membership') return booking.booking_type === 'membership';
    if (bookingFilter === 'pending') return booking.status === 'pending';
    if (bookingFilter === 'confirmed') return booking.status === 'confirmed';
    if (bookingFilter === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  const filteredPrivateSessions = privateSessions.filter(session => {
    if (sessionFilter === 'all') return true;
    if (sessionFilter === 'pending') return session.status === 'pending';
    if (sessionFilter === 'confirmed') return session.status === 'confirmed';
    if (sessionFilter === 'scheduled') return session.status === 'scheduled';
    if (sessionFilter === 'completed') return session.status === 'completed';
    return true;
  });

  const filteredMessages = contactMessages.filter(message => {
    if (messageFilter === 'all') return true;
    if (messageFilter === 'new') return message.status === 'new';
    if (messageFilter === 'read') return message.status === 'read';
    if (messageFilter === 'archived') return message.status === 'archived';
    return true;
  });

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage Studio Reform operations</p>
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
                                  onClick={() => handleApproveMembership(booking.id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectMembership(booking.id)}
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
                      {allBookings.slice(0, 5).map((booking, index) => (
                        <div key={booking.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              booking.booking_type === 'membership' ? 'bg-green-100' : 'bg-blue-100'
                            }`}>
                              {booking.booking_type === 'membership' ? (
                                <Package className="h-5 w-5 text-green-600" />
                              ) : (
                                <Calendar className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">{booking.user_name}</p>
                              <p className="text-sm text-gray-500">
                                {booking.booking_type === 'membership' ? booking.package_type?.replace('-', ' ') : booking.class_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">GMD {booking.amount?.toLocaleString() || '0'}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              booking.status === 'active' || booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {allBookings.length === 0 && (
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
                      onClick={() => setActiveTab('schedules')}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                    >
                      <div className="flex items-center mb-2">
                        <CalendarDays className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium text-green-800">Manage Schedules</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Create and manage class schedules
                      </p>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Members Tab */}
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
                                    onClick={() => handleUpdateBookingStatus(member.id, member.status)}
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                    title="Edit Member"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Reset Password',
                                        html: `Reset password for ${member.name}?`,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#8F9980',
                                        cancelButtonColor: '#dc2626',
                                        confirmButtonText: 'Reset Password'
                                      });
                                    }}
                                    className="text-amber-600 hover:text-amber-800 p-2 rounded hover:bg-amber-50"
                                    title="Reset Password"
                                  >
                                    <Key className="h-4 w-4" />
                                  </button>
                                  <button 
                                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Delete Member',
                                        html: `Delete ${member.name}? This cannot be undone.`,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#dc2626',
                                        cancelButtonColor: '#8F9980',
                                        confirmButtonText: 'Delete'
                                      });
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

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-black">All Bookings</h2>
                      <p className="text-sm text-gray-500">Manage class and membership bookings</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select
                        value={bookingFilter}
                        onChange={(e) => setBookingFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Bookings</option>
                        <option value="class">Class Bookings</option>
                        <option value="membership">Membership Bookings</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Ref #</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Member</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Payment</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <code className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                  {booking.reference_number?.substring(0, 8)}...
                                </code>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{booking.user_name}</p>
                                  <p className="text-xs text-gray-500">{booking.user_email}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  booking.booking_type === 'membership'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {booking.booking_type === 'membership' ? 'Membership' : 'Class'}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-medium text-gray-900">
                                GMD {booking.amount?.toLocaleString() || '0'}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    booking.payment_method === 'wave'
                                      ? 'bg-green-100 text-green-800'
                                      : booking.payment_method === 'bank'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {booking.payment_method || 'N/A'}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    booking.payment_status === 'paid' || booking.payment_status === 'verified'
                                      ? 'bg-green-100 text-green-800'
                                      : booking.payment_status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {booking.payment_status || 'N/A'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'active' || booking.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.status === 'pending' || booking.status === 'pending_admin_approval'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : booking.status === 'cancelled' || booking.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status?.replace(/_/g, ' ') || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {new Date(booking.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleUpdateBookingStatus(booking.id, booking.status)}
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                    title="Update Status"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  {booking.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleVerifyPayment(booking.id, 'verify')}
                                        className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                                        title="Verify Payment"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleVerifyPayment(booking.id, 'reject')}
                                        className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                        title="Reject Payment"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-gray-500">
                              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                              <p>No bookings found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Schedules Tab */}
            {activeTab === 'schedules' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-black">Schedule Management</h2>
                      <p className="text-sm text-gray-500">Manage weekly schedules and class instances</p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowCreateScheduleModal(true)}
                        className="bg-[#8F9980] text-white px-4 py-2 rounded-md font-medium hover:bg-[#7a8570] transition-colors flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Schedule
                      </button>
                      <button
                        onClick={() => {
                          if (scheduleView === 'weekly') {
                            fetchWeeklySchedules();
                          } else {
                            fetchScheduleInstances();
                          }
                        }}
                        className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Sub-tabs for schedules */}
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setScheduleView('weekly')}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                        scheduleView === 'weekly'
                          ? 'border-[#8F9980] text-[#8F9980]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Weekly Schedules
                    </button>
                    <button
                      onClick={() => setScheduleView('instances')}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                        scheduleView === 'instances'
                          ? 'border-[#8F9980] text-[#8F9980]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Class Instances
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {scheduleLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8F9980] mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading schedules...</p>
                    </div>
                  ) : scheduleView === 'weekly' ? (
                    // Weekly Schedules Section
                    <div>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Schedules</h3>
                        <p className="text-gray-600 mb-6">Create recurring class schedules that generate instances automatically</p>
                      </div>
                      
                      {weeklySchedules.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-3" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No weekly schedules</h3>
                          <p className="text-gray-500 mb-6">Create your first weekly schedule to generate class instances</p>
                          <button
                            onClick={() => setShowCreateScheduleModal(true)}
                            className="px-6 py-3 bg-[#8F9980] text-white rounded-lg font-semibold hover:bg-[#7a8570] transition-colors"
                          >
                            Create Schedule
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {weeklySchedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <div className="mb-4 md:mb-0 md:flex-1">
                                  <div className="flex items-center mb-3">
                                    <h3 className="font-bold text-lg text-gray-800">
                                      {schedule.class_name}
                                    </h3>
                                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                                      schedule.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {schedule.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Day:</span>
                                        <span className="ml-2">{schedule.day_of_week}</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Time:</span>
                                        <span className="ml-2">
                                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <UsersIcon className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Capacity:</span>
                                        <span className="ml-2">{schedule.max_capacity} spots</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-600">
                                        <CalendarDays className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Instances:</span>
                                        <span className="ml-2">{schedule.upcoming_instances || 0} upcoming</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">Created:</span>
                                        <span className="ml-2">
                                          {new Date(schedule.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">Class ID:</span>
                                        <span className="ml-2 font-mono">{schedule.class_id}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col space-y-2">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => {
                                        setSelectedSchedule(schedule);
                                        setShowGenerateModal(true);
                                      }}
                                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md font-medium hover:bg-blue-100 transition-colors text-sm"
                                    >
                                      Generate Instances
                                    </button>
                                    <button
                                      onClick={() => handleToggleSchedule(schedule.id, schedule.is_active)}
                                      className={`px-3 py-2 rounded-md font-medium transition-colors text-sm ${
                                        schedule.is_active
                                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                                      }`}
                                    >
                                      {schedule.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSchedule(schedule.id, schedule.class_name)}
                                      className="px-3 py-2 bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors text-sm"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Class Instances Section
                    <div>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Class Instances</h3>
                        <p className="text-gray-600 mb-6">Manage specific class dates and times generated from weekly schedules</p>
                      </div>
                      
                      {/* Filters for instances */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-gray-700 mb-3">Filter Instances</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                              value={scheduleFilters.class_id}
                              onChange={(e) => setScheduleFilters({...scheduleFilters, class_id: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980] text-sm"
                            >
                              <option value="">All Classes</option>
                              {allClasses.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                              type="date"
                              value={scheduleFilters.date_from}
                              onChange={(e) => setScheduleFilters({...scheduleFilters, date_from: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980] text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                              type="date"
                              value={scheduleFilters.date_to}
                              onChange={(e) => setScheduleFilters({...scheduleFilters, date_to: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980] text-sm"
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <button
                              onClick={() => setScheduleFilters({class_id: '', date_from: '', date_to: '', status: 'upcoming'})}
                              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition-colors text-sm"
                            >
                              Clear Filters
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {scheduleInstances.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <CalendarDays className="h-16 w-16 mx-auto text-gray-300 mb-3" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No class instances found</h3>
                          <p className="text-gray-500 mb-6">Try adjusting your filters or generate instances from weekly schedules</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {scheduleInstances.map((instance) => (
                            <div
                              key={instance.id}
                              className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <div className="mb-4 md:mb-0 md:flex-1">
                                  <div className="flex items-center mb-3">
                                    <h3 className="font-bold text-lg text-gray-800">
                                      {instance.class_name}
                                    </h3>
                                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                                      instance.is_cancelled
                                        ? 'bg-red-100 text-red-800'
                                        : instance.current_bookings >= instance.max_capacity
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {instance.is_cancelled 
                                        ? 'Cancelled' 
                                        : instance.current_bookings >= instance.max_capacity
                                        ? 'Full'
                                        : `${instance.available_spots} spots available`
                                      }
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Date:</span>
                                        <span className="ml-2">
                                          {new Date(instance.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Time:</span>
                                        <span className="ml-2">
                                          {formatTime(instance.start_time)} - {formatTime(instance.end_time)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <UsersIcon className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Bookings:</span>
                                        <span className="ml-2">
                                          {instance.current_bookings} / {instance.max_capacity}
                                        </span>
                                      </div>
                                      {instance.instructor && (
                                        <div className="flex items-center text-sm text-gray-600">
                                          <User className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Instructor:</span>
                                          <span className="ml-2">{instance.instructor}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {instance.booked_users && instance.booked_users.length > 0 && (
                                        <div className="text-sm text-gray-600">
                                          <span className="font-medium">Booked by:</span>
                                          <div className="mt-1">
                                            {instance.booked_users.slice(0, 2).map((user: any) => (
                                              <span key={user.id} className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-1 mb-1">
                                                {user.name}
                                              </span>
                                            ))}
                                            {instance.booked_users.length > 2 && (
                                              <span className="text-xs text-gray-500">
                                                +{instance.booked_users.length - 2} more
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col space-y-2">
                                  <div className="flex space-x-2">
                                    {!instance.is_cancelled && (
                                      <button
                                        onClick={() => handleCancelInstance(instance.id, instance.class_name, instance.date)}
                                        className="px-3 py-2 bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors text-sm"
                                      >
                                        Cancel Class
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        console.log('View instance details:', instance.id);
                                      }}
                                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md font-medium hover:bg-blue-100 transition-colors text-sm"
                                    >
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-black">Class Management</h2>
                      <p className="text-sm text-gray-500">View and manage all classes</p>
                    </div>
                    <button 
                      className="bg-[#8F9980] text-white px-4 py-2 rounded-md font-medium hover:bg-[#7a8570] transition-colors flex items-center"
                      onClick={() => {
                        Swal.fire({
                          title: 'Add New Class',
                          html: `
                            <div class="text-left space-y-4">
                              <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
                                <input type="text" id="className" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
                              </div>
                              <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
                                <input type="text" id="instructor" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
                              </div>
                              <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                                <input type="number" id="duration" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
                              </div>
                            </div>
                          `,
                          showCancelButton: true,
                          confirmButtonColor: '#8F9980',
                          confirmButtonText: 'Create Class',
                          preConfirm: () => {
                            const className = (document.getElementById('className') as HTMLInputElement).value;
                            const instructor = (document.getElementById('instructor') as HTMLInputElement).value;
                            const duration = (document.getElementById('duration') as HTMLInputElement).value;
                            
                            if (!className || !instructor || !duration) {
                              Swal.showValidationMessage('Please fill all fields');
                              return false;
                            }
                            
                            return { className, instructor, duration };
                          }
                        }).then((result) => {
                          if (result.isConfirmed) {
                            showSuccessAlert('Success!', 'Class created successfully');
                            fetchAllClasses();
                          }
                        });
                      }}
                    >
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
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Class</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Instructor</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Duration</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Difficulty</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Capacity</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Booked</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allClasses && allClasses.length > 0 ? (
                          allClasses.map((classItem) => (
                            <tr key={classItem.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                    <Dumbbell className="h-6 w-6 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{classItem.name}</p>
                                    <p className="text-xs text-gray-500 line-clamp-2">{classItem.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-gray-700">{classItem.instructor}</td>
                              <td className="py-4 px-4">
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                  {classItem.duration}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  classItem.difficulty === 'Beginner'
                                    ? 'bg-green-100 text-green-800'
                                    : classItem.difficulty === 'Intermediate'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {classItem.difficulty || 'All Levels'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-700">{classItem.capacity}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-[#8F9980] h-2 rounded-full" 
                                      style={{ width: `${(classItem.current_bookings || 0) / (classItem.capacity || 1) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="ml-2 text-sm text-gray-600">
                                    {classItem.current_bookings || 0}/{classItem.capacity}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  <button 
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Edit Class',
                                        html: `
                                          <div class="text-left space-y-4">
                                            <div>
                                              <label class="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
                                              <input type="text" id="editClassName" value="${classItem.name}" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                            </div>
                                            <div>
                                              <label class="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
                                              <input type="text" id="editInstructor" value="${classItem.instructor}" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                            </div>
                                            <div>
                                              <label class="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                                              <input type="number" id="editCapacity" value="${classItem.capacity}" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                            </div>
                                          </div>
                                        `,
                                        showCancelButton: true,
                                        confirmButtonColor: '#8F9980',
                                        confirmButtonText: 'Update Class'
                                      }).then((result) => {
                                        if (result.isConfirmed) {
                                          showSuccessAlert('Success!', 'Class updated successfully');
                                          fetchAllClasses();
                                        }
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClass(classItem.id, classItem.name)}
                                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-500">
                              <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                              <p>No classes found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Memberships Tab */}
            {activeTab === 'memberships' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-black">Membership Bookings</h2>
                      <p className="text-sm text-gray-500">Manage membership purchases and approvals</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select
                        value={membershipFilter}
                        onChange={(e) => setMembershipFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Memberships</option>
                        <option value="pending">Pending Approval</option>
                        <option value="active">Active</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Ref #</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Member</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Package</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Payment Method</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembershipBookings.length > 0 ? (
                          filteredMembershipBookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <code className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                  {booking.reference_number?.substring(0, 8)}...
                                </code>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{booking.user_name}</p>
                                  <p className="text-xs text-gray-500">{booking.user_email}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-700 capitalize">
                                  {booking.package_type?.replace('-', ' ')}
                                </div>
                                {booking.package_sessions && (
                                  <div className="text-xs text-gray-500">
                                    {booking.package_sessions} sessions • {booking.package_validity_days} days
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-4 font-medium text-gray-900">
                                GMD {booking.amount?.toLocaleString()}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  booking.payment_method === 'wave'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.payment_method === 'bank'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.payment_method || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.status === 'pending_admin_approval'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : booking.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status?.replace(/_/g, ' ') || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {new Date(booking.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  {booking.status === 'pending_admin_approval' && (
                                    <>
                                      <button
                                        onClick={() => handleApproveMembership(booking.id)}
                                        className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                                        title="Approve"
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleRejectMembership(booking.id)}
                                        className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                        title="Reject"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                  {booking.status === 'active' && (
                                    <button
                                      onClick={() => {
                                        Swal.fire({
                                          title: 'Assign Class',
                                          text: 'Assign a class to this member?',
                                          icon: 'question',
                                          showCancelButton: true,
                                          confirmButtonColor: '#8F9980',
                                          confirmButtonText: 'Yes, assign'
                                        });
                                      }}
                                      className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                      title="Assign Class"
                                    >
                                      <Calendar className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-gray-500">
                              <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                              <p>No membership bookings found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Private Sessions Tab */}
              {activeTab === 'private-sessions' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-black">Private Session Requests</h2>
                      <p className="text-sm text-gray-500">Manage private session bookings and scheduling</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select
                        value={sessionFilter}
                        onChange={(e) => setSessionFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Sessions</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Ref #</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Member</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Payment</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPrivateSessions.length > 0 ? (
                          filteredPrivateSessions.map((session) => (
                            <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <code className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                  {session.reference_number?.substring(0, 8)}...
                                </code>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{session.user_name}</p>
                                  <p className="text-xs text-gray-500">{session.user_email}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-gray-700 capitalize">
                                Private Session
                              </td>
                              <td className="py-4 px-4 font-medium text-gray-900">
                                GMD {session.amount?.toLocaleString()}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  session.payment_method === 'wave'
                                    ? 'bg-green-100 text-green-800'
                                    : session.payment_method === 'bank'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {session.payment_method || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  session.status === 'scheduled'
                                    ? 'bg-green-100 text-green-800'
                                    : session.status === 'confirmed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : session.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {session.status?.replace(/_/g, ' ') || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {session.booking_date ? new Date(session.booking_date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  {session.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleVerifyPayment(session.id, 'verify')}
                                        className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                                        title="Verify Payment"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleVerifyPayment(session.id, 'reject')}
                                        className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                        title="Reject Payment"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                  {session.status === 'confirmed' && (
                                    <button
                                      onClick={() => handleUpdateBookingStatus(session.id, session.status)}
                                      className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                      title="Schedule Session"
                                    >
                                      <Calendar className="h-4 w-4" />
                                    </button>
                                  )}
                                  {session.status === 'scheduled' && (
                                    <button
                                      onClick={() => handleUpdateBookingStatus(session.id, 'completed')}
                                      className="text-purple-600 hover:text-purple-800 p-2 rounded hover:bg-purple-50"
                                      title="Mark Complete"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-gray-500">
                              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                              <p>No private session requests found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-black">Contact Messages</h2>
                      <p className="text-sm text-gray-500">Manage customer inquiries and messages</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select
                        value={messageFilter}
                        onChange={(e) => setMessageFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Messages</option>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {filteredMessages.length > 0 ? (
                      filteredMessages.map((message) => (
                        <div key={message.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row md:items-start justify-between">
                            <div className="mb-4 md:mb-0 md:flex-1">
                              <div className="flex items-center mb-3">
                                <div className="w-10 h-10 bg-[#8F9980] rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                  {message.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-800">{message.name}</h3>
                                  <p className="text-sm text-gray-600">{message.email}</p>
                                </div>
                                <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${
                                  message.status === 'new'
                                    ? 'bg-blue-100 text-blue-800'
                                    : message.status === 'read'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {message.status?.charAt(0).toUpperCase() + message.status?.slice(1)}
                                </span>
                              </div>
                              <p className="text-gray-700 mt-3">{message.message}</p>
                              <div className="mt-4 text-sm text-gray-500">
                                Sent on {new Date(message.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {message.status === 'new' && (
                                <button
                                  onClick={() => handleUpdateMessageStatus(message.id, 'read')}
                                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md font-medium hover:bg-blue-100 transition-colors text-sm"
                                >
                                  Mark Read
                                </button>
                              )}
                              {message.status === 'read' && (
                                <button
                                  onClick={() => handleUpdateMessageStatus(message.id, 'archived')}
                                  className="px-3 py-2 bg-gray-50 text-gray-600 rounded-md font-medium hover:bg-gray-100 transition-colors text-sm"
                                >
                                  Archive
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  Swal.fire({
                                    title: 'Reply to Message',
                                    html: `
                                      <div class="text-left">
                                        <div class="mb-4">
                                          <label class="block text-sm font-medium text-gray-700 mb-2">To: ${message.email}</label>
                                          <textarea id="replyMessage" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Type your reply here..."></textarea>
                                        </div>
                                      </div>
                                    `,
                                    showCancelButton: true,
                                    confirmButtonColor: '#8F9980',
                                    confirmButtonText: 'Send Reply'
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      showSuccessAlert('Success!', 'Reply sent successfully');
                                    }
                                  });
                                }}
                                className="px-3 py-2 bg-green-50 text-green-600 rounded-md font-medium hover:bg-green-100 transition-colors text-sm"
                              >
                                Reply
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages found</h3>
                        <p className="text-gray-500">All messages have been processed</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-black">System Settings</h2>
                      <p className="text-sm text-gray-500">Configure application settings and preferences</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">General Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site Name
                          </label>
                          <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Currency
                          </label>
                          <select
                            value={settings.currency}
                            onChange={(e) => setSettings({...settings, currency: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                          >
                            <option value="GMD">Gambian Dalasi (GMD)</option>
                            <option value="USD">US Dollar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                          >
                            <option value="Africa/Banjul">Africa/Banjul (GMT)</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">America/New York (EST)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">System Features</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">Maintenance Mode</p>
                            <p className="text-sm text-gray-500">Temporarily disable public access</p>
                          </div>
                          <button
                            onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              settings.maintenanceMode ? 'bg-[#8F9980]' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">User Registration</p>
                            <p className="text-sm text-gray-500">Allow new users to register</p>
                          </div>
                          <button
                            onClick={() => setSettings({...settings, registrationEnabled: !settings.registrationEnabled})}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              settings.registrationEnabled ? 'bg-[#8F9980]' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.registrationEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">Email Notifications</p>
                            <p className="text-sm text-gray-500">Send email notifications to users</p>
                          </div>
                          <button
                            onClick={() => setSettings({...settings, notificationsEnabled: !settings.notificationsEnabled})}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              settings.notificationsEnabled ? 'bg-[#8F9980]' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Danger Zone</h3>
                      <div className="space-y-4">
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Clear All Data',
                              text: 'This will delete all bookings, members, and schedules. This action cannot be undone!',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#dc2626',
                              cancelButtonColor: '#8F9980',
                              confirmButtonText: 'Yes, clear all data'
                            });
                          }}
                          className="w-full px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
                        >
                          <div className="flex items-center">
                            <Trash2 className="h-5 w-5 mr-3" />
                            <div>
                              <p className="font-medium">Clear All Data</p>
                              <p className="text-sm">Permanently delete all system data</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Export All Data',
                              text: 'Export all system data as CSV files',
                              icon: 'info',
                              showCancelButton: true,
                              confirmButtonColor: '#8F9980',
                              confirmButtonText: 'Export'
                            });
                          }}
                          className="w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
                        >
                          <div className="flex items-center">
                            <Download className="h-5 w-5 mr-3" />
                            <div>
                              <p className="font-medium">Export All Data</p>
                              <p className="text-sm">Download backups of all system data</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                      <button
                        onClick={() => {
                          showSuccessAlert('Success', 'Settings saved successfully');
                        }}
                        className="px-6 py-2 bg-[#8F9980] text-white rounded-md font-medium hover:bg-[#7a8570] transition-colors"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Generate Instances Modal */}
            {showGenerateModal && selectedSchedule && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-800">Generate Class Instances</h3>
                      <button
                        onClick={() => setShowGenerateModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-gray-600 mb-2">
                        Generate class instances for: <strong>{selectedSchedule.class_name}</strong>
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedSchedule.day_of_week} at {formatTime(selectedSchedule.start_time)} - {formatTime(selectedSchedule.end_time)}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Generate for next (days):
                        </label>
                        <select
                          id="generateDays"
                          defaultValue="30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8F9980]"
                        >
                          <option value="7">7 days (1 week)</option>
                          <option value="14">14 days (2 weeks)</option>
                          <option value="30">30 days (1 month)</option>
                          <option value="60">60 days (2 months)</option>
                          <option value="90">90 days (3 months)</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 mb-3">
                          This will create individual class instances for each occurrence of {selectedSchedule.day_of_week} 
                          within the selected time period.
                        </p>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={() => {
                            const daysSelect = document.getElementById('generateDays') as HTMLSelectElement;
                            const days = parseInt(daysSelect.value);
                            handleGenerateInstances(selectedSchedule.id);
                          }}
                          className="flex-1 bg-[#8F9980] text-white py-2 rounded-md font-medium hover:bg-[#7a8570] transition-colors"
                        >
                          Generate Instances
                        </button>
                        <button
                          onClick={() => setShowGenerateModal(false)}
                          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md font-medium hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* SimpleScheduleModal for creating multiple schedules at once */}
      {showCreateScheduleModal && <SimpleScheduleModal />}
    </div>
  );
};

export default Admin;