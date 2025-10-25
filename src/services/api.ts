const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://studio-reform.onrender.com';

// Auth token management
let authToken: string | null = localStorage.getItem('authToken');
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1NjQ4NTc3MSwianRpIjoiYmVlYTQ2NDEtZjZlMi00N2NlLTk2ZDktNWMwMThhZWI5MDcyIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6MiwibmJmIjoxNzU2NDg1NzcxLCJjc3JmIjoiYWJkM2VjN2ItYzAyMS00MjU5LWEwNTUtODBkMGQ0NzYwYWE2IiwiZXhwIjoxNzU2NTcyMTcxfQ.0ODjwirOlTjurzaF9bbn5HqszIpCvxxfGVqZK71thII

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
    return apiRequest('/classes');
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

// Bookings API
export const bookingsAPI = {
  // create: async (bookingData: {
  //   class_id: number;
  //   booking_date: string;
  //   booking_time: string;
  // }) => {
  //   return apiRequest('/bookings', {
  //     method: 'POST',
  //     body: JSON.stringify(bookingData),
  //   });
  // },

  create: async (bookingData: {
  class_id: number;
  booking_date: string;
  booking_time: string;
}) => {
  console.log('Booking payload:', bookingData); // <-- log payload
  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
},



  getUserBookings: async () => {
    return apiRequest('/bookings');
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

// Admin API
export const adminAPI = {
  getDashboard: async () => {
    return apiRequest('/admin/dashboard');
  },

  getMembers: async () => {
    return apiRequest('/admin/members');
  },

  deleteClass: async (classId: number) => {
    return apiRequest(`/classes/${classId}`, {
      method: 'DELETE',
    });
  },
};

export default {
  auth: authAPI,
  classes: classesAPI,
  bookings: bookingsAPI,
  contact: contactAPI,
  chatbot: chatbotAPI,
  admin: adminAPI,
};