// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const API_BASE_URL = 'https://studio-reform-1.onrender.com/api';



// Auth token management
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  authToken = null;
  localStorage.removeItem('authToken');
};

export const getAuthToken = () => authToken;

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    membership_plan?: string;
  }) => {
    return apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};

// Classes API
export const classesAPI = {
  getAll: async () => {
    return apiRequest('/api/classes');
  },

  create: async (classData: {
    name: string;
    instructor: string;
    duration: string;
    difficulty: string;
    capacity: number;
    description?: string;
    image_url?: string;
  }) => {
    return apiRequest('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },
};

// Bookings API - UPDATED FOR EXTENDED SYSTEM
export const bookingsAPI = {
  // For class bookings
  create: async (bookingData: {
    booking_type?: string;
    class_id?: number;
    booking_date?: string;
    booking_time?: string;
    package_id?: string;
    amount?: number;
  }) => {
    console.log('Booking payload:', bookingData);
    return apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // For membership bookings
  createMembership: async (bookingData: {
    booking_type: 'membership';
    package_id: string;
    amount: number;
  }) => {
    console.log('Membership booking payload:', bookingData);
    return apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Update payment status
  updatePayment: async (bookingId: number, paymentData: {
    payment_method: string;
  }) => {
    return apiRequest(`/bookings/${bookingId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  getUserBookings: async () => {
    return apiRequest('/bookings');
  },
};

// Packages API
export const packagesAPI = {
  getAll: async () => {
    return apiRequest('/packages');
  },
};

// Contact API
export const contactAPI = {
  submit: async (contactData: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }) => {
    return apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  },
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: async (message: string, sessionId?: string) => {
    return apiRequest('/chatbot', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: sessionId || 'anonymous',
      }),
    });
  },
};

// Admin API - FIXED: Remove the extra /api prefix
// Admin API
// export const adminAPI = {
//   getDashboard: async () => {
//     return apiRequest('/admin/dashboard');
//   },

//   getMembers: async () => {
//     return apiRequest('/admin/members');
//   },

//   // NEW: Get all classes for admin
//   getAllClasses: async () => {
//     return apiRequest('/admin/classes');
//   },

//   // NEW: Get all bookings for admin
//   getAllBookings: async () => {
//     return apiRequest('/admin/bookings');
//   },

//   // NEW: Update booking status
//   updateBookingStatus: async (bookingId: number, status: string) => {
//     return apiRequest(`/admin/bookings/${bookingId}/status`, {
//       method: 'PUT',
//       body: JSON.stringify({ status }),
//     });
//   },

//   deleteClass: async (classId: number) => {
//     return apiRequest(`/classes/${classId}`, {
//       method: 'DELETE',
//     });
//   },
// };
// =====================================================
// Admin API - Add new membership endpoints
export const adminAPI = {
  getDashboard: async () => {
    return apiRequest('/admin/dashboard');
  },

  getMembers: async () => {
    return apiRequest('/admin/members');
  },

  getAllClasses: async () => {
    return apiRequest('/admin/classes');
  },

  getAllBookings: async () => {
    return apiRequest('/admin/bookings');
  },

  // NEW: Get membership bookings for admin approval
  getMembershipBookings: async () => {
    return apiRequest('/admin/membership-bookings');
  },

  // NEW: Approve membership booking
  approveMembershipBooking: async (bookingId: number) => {
    return apiRequest(`/admin/bookings/${bookingId}/approve`, {
      method: 'POST',
    });
  },

  // NEW: Reject membership booking
  rejectMembershipBooking: async (bookingId: number, reason: string) => {
    return apiRequest(`/admin/bookings/${bookingId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  updateBookingStatus: async (bookingId: number, status: string) => {
    return apiRequest(`/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  deleteClass: async (classId: number) => {
    return apiRequest(`/classes/${classId}`, {
      method: 'DELETE',
    });
  },

  // Schedule Management - FIXED
  getWeeklySchedules: async (): Promise<any[]> => {
    return apiRequest('/admin/weekly-schedule');
  },

  getScheduleInstances: async (params?: {
    class_id?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
  }): Promise<any[]> => {
    let url = '/admin/schedule-instances';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.class_id) queryParams.append('class_id', params.class_id);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.status) queryParams.append('status', params.status);
      url += `?${queryParams.toString()}`;
    }
    return apiRequest(url);
  },

  createWeeklySchedule: async (data: {
    class_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    max_capacity?: number;
  }): Promise<any> => {
    return apiRequest('/admin/weekly-schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generateScheduleInstances: async (scheduleId: number, daysAhead: number = 30): Promise<any> => {
    return apiRequest(`/admin/weekly-schedule/${scheduleId}/instances`, {
      method: 'POST',
      body: JSON.stringify({ days_ahead: daysAhead }),
    });
  },

  cancelScheduleInstance: async (instanceId: number): Promise<any> => {
    return apiRequest(`/admin/schedule-instances/${instanceId}/cancel`, {
      method: 'POST',
    });
  },

  toggleScheduleStatus: async (scheduleId: number): Promise<any> => {
    return apiRequest(`/admin/weekly-schedule/${scheduleId}/toggle`, {
      method: 'PUT',
    });
  },

  deleteSchedule: async (scheduleId: number): Promise<any> => {
    return apiRequest(`/admin/weekly-schedule/${scheduleId}`, {
      method: 'DELETE',
    });
  },
};
// =====================================================

// Debug/Test API - FIXED: Remove the extra /api prefix
export const debugAPI = {
  testDB: async () => {
    return apiRequest('/test-db'); // Changed from '/api/test-db'
  },

  getTables: async () => {
    return apiRequest('/debug/tables'); // Changed from '/api/debug/tables'
  },

  getSchema: async () => {
    return apiRequest('/debug/schema'); // Changed from '/api/debug/schema'
  },

  checkToken: async () => {
    return apiRequest('/debug/token'); // Changed from '/api/debug/token'
  },
};


export const userAPI = {
  updateProfile: async (userData: {
    name?: string;
    email?: string;
    phone?: string;
  }) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  changePassword: async (passwordData: {
    current_password: string;
    new_password: string;
  }) => {
    return apiRequest('/users/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },
};
export default {
  auth: authAPI,
  classes: classesAPI,
  bookings: bookingsAPI,
  packages: packagesAPI,
  contact: contactAPI,
  chatbot: chatbotAPI,
  admin: adminAPI,
  debug: debugAPI,
};

// ================================================================
// Add these to your existing api.ts fil
export const scheduleAPI = {
  // Get available classes for user to book
  getAvailableClasses: async (params?: {
    class_id?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    let url = '/available-classes'; // Already correct
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.class_id) queryParams.append('class_id', params.class_id);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      url += `?${queryParams.toString()}`;
    }
    return apiRequest(url);
  },

  // Get weekly schedule patterns (recurring) - NEW ENDPOINT
  getWeeklySchedule: async () => {
    return apiRequest('/weekly-schedule'); // This is now correct
  },

  // Book a class (single session)
  bookClass: async (data: { schedule_instance_id: number }) => {
    return apiRequest('/book-class', { // Already correct
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Book recurring weekly class - NEW ENDPOINT
  bookWeeklyClass: async (data: {
    weekly_schedule_id: number;
    start_date?: string;
    end_date?: string;
  }) => {
    return apiRequest('/book-weekly-class', { // This is now correct
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get user's booked classes
  getMyBookedClasses: async () => {
    return apiRequest('/my-booked-classes'); // Already correct
  },

  // Get user's weekly bookings (recurring) - NEW ENDPOINT
  getMyWeeklyBookings: async () => {
    return apiRequest('/my-weekly-bookings'); // This is now correct
  },

  // Get user membership info
  getUserMembership: async () => {
    return apiRequest('/my-membership'); // Already correct
  },

  // Cancel a single booking
  cancelBooking: async (bookingId: number) => {
    return apiRequest(`/cancel-booking/${bookingId}`, { // Already correct
      method: 'POST',
    });
  },

  // Cancel a weekly recurring booking - NEW ENDPOINT
  cancelWeeklyBooking: async (weeklyBookingId: number) => {
    return apiRequest(`/cancel-weekly-booking/${weeklyBookingId}`, { // This is now correct
      method: 'POST',
    });
  },
};

// Add admin schedule endpoints
export const adminScheduleAPI = {
  // Weekly schedule management
  createWeeklySchedule: async (data: {
    class_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    max_capacity?: number;
  }) => {
    return apiRequest('/admin/weekly-schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getWeeklySchedules: async () => {
    return apiRequest('/admin/weekly-schedule');
  },

  toggleWeeklySchedule: async (scheduleId: number) => {
    return apiRequest(`/admin/weekly-schedule/${scheduleId}/toggle`, {
      method: 'PUT',
    });
  },

  generateScheduleInstances: async (scheduleId: number, daysAhead: number = 30) => {
    return apiRequest(`/admin/weekly-schedule/${scheduleId}/instances`, {
      method: 'POST',
      body: JSON.stringify({ days_ahead: daysAhead }),
    });
  },

  // Schedule instances management
  getScheduleInstances: async (params?: {
    class_id?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
  }) => {
    let url = '/admin/schedule-instances';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.class_id) queryParams.append('class_id', params.class_id);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.status) queryParams.append('status', params.status);
      url += `?${queryParams.toString()}`;
    }
    return apiRequest(url);
  },

  cancelScheduleInstance: async (instanceId: number) => {
    return apiRequest(`/admin/schedule-instances/${instanceId}/cancel`, {
      method: 'POST',
    });
  },
};
// ================================================================