
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Calendar, BookOpen } from 'lucide-react';
import { classesAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Classes: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await classesAPI.getAll();
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClass = async (classId: number) => {
    if (!isAuthenticated) {
      alert('Please sign in to book a class');
      return;
    }

    setBookingLoading(classId);
    
    try {
      // For demo purposes, book for tomorrow at the first available time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await bookingsAPI.create({
        class_id: classId,
        booking_date: tomorrow.toISOString().split('T')[0],
        booking_time: '07:00'
      });
      
      alert('Class booked successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to book class');
    } finally {
      setBookingLoading(null);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-black to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold mb-6">Our Classes</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover the perfect class for your fitness journey. From beginner-friendly sessions 
              to advanced challenges, we have something for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Classes Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.map((classItem, index) => (
              <motion.div
                key={classItem.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48">
                  <img 
                    src={classItem.image} 
                    alt={classItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-yellow-600 text-black px-3 py-1 rounded-full text-sm font-semibold">
                    {classItem.difficulty}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-black mb-2">{classItem.name}</h3>
                  <p className="text-gray-600 mb-4">{classItem.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-gray-600">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span className="text-sm">Instructor: {classItem.instructor}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">{classItem.duration}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">Max {classItem.capacity} people</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleBookClass(classItem.id)}
                    disabled={bookingLoading === classItem.id}
                    className="w-full bg-yellow-600 text-black py-2 px-4 rounded-md font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingLoading === classItem.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      'Book Now'
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-black mb-4">Weekly Schedule</h2>
            <p className="text-xl text-gray-600">
              Plan your week with our comprehensive class schedule
            </p>
          </motion.div>

          {/* Day Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  selectedDay === day
                    ? 'bg-yellow-600 text-black'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Schedule Display */}
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 className="text-2xl font-bold text-black">{selectedDay} Schedule</h3>
            </div>
            
            <div className="space-y-4">
              {classes.map((classItem) => {
                const times = classItem.schedule[selectedDay as keyof typeof classItem.schedule];
                return times !== 'Rest Day' ? (
                  <div key={classItem.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-black">{classItem.name}</h4>
                      <p className="text-gray-600 text-sm">with {classItem.instructor}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-yellow-600">{times}</p>
                      <p className="text-gray-600 text-sm">{classItem.duration}</p>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Classes;