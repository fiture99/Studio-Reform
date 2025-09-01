import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Calendar, BookOpen, Star } from 'lucide-react';
import { classesAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();

  // Pilates class levels with descriptions
  const classLevels = [
    {
      level: 'Level 0',
      name: 'Foundation',
      description: 'First-time intro to the reformer. Breath, alignment, basics.',
      difficulty: 'Beginner',
      duration: '50 min',
      instructor: 'Alex Thompson',
      image: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      level: 'Level 1',
      name: 'Fundamentals', 
      description: 'Beginner sequences. Build strength, control, and flow.',
      difficulty: 'Beginner',
      duration: '50 min',
      instructor: 'Alex Thompson',
      image: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      level: 'Level 1.5',
      name: 'Transitional',
      description: 'Bridge to advanced. More flow, props, and challenge.',
      difficulty: 'Intermediate',
      duration: '55 min',
      instructor: 'Jordan Williams',
      image: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      level: 'Level 2',
      name: 'Advanced',
      description: 'Complex, powerful sequences for confident movers.',
      difficulty: 'Advanced',
      duration: '55 min',
      instructor: 'Taylor Davis',
      image: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      level: 'Private',
      name: '1:1 Training',
      description: 'Personalized training tailored to your goals.',
      difficulty: 'All Levels',
      duration: '50 min',
      instructor: 'Available Instructors',
      image: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
  ];
  useEffect(() => {
    // Use the predefined class levels instead of fetching from API
    setClasses(classLevels);
    setLoading(false);
  }, []);


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
      <section className="py-20 bg-gradient-to-r from-[#8F9980] to-pure-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold mb-6">Our Classes</h1>
            <p className="text-xl text-cloud-cream max-w-2xl mx-auto">
              From foundation to advanced, discover the perfect level for your reformer Pilates journey. 
              Each class builds strength, control, and mindful movement.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Classes Grid */}
      <section className="py-20 bg-cloud-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48">
                  <img 
                    src={classItem.image_url || classItem.image} 
                    alt={classItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-[#8F9980] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {classItem.difficulty}
                  </div>
                  <div className="absolute top-4 left-4 bg-pure-black/80 text-cloud-cream px-3 py-1 rounded-full text-sm font-semibold">
                    {classItem.name.split(' - ')[0]}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-pure-black mb-2">{classItem.name.split(' - ')[1] || classItem.name}</h3>
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
                      <span className="text-sm">{classItem.enrolled || 0}/{classItem.capacity} enrolled</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleBookClass(classItem.id)}
                    disabled={bookingLoading === classItem.id}
                    className="w-full bg-[#8F9980] text-white py-2 px-4 rounded-md font-semibold hover:bg-[#b9d9eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingLoading === classItem.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      classItem.name.includes('Private') ? 'Schedule Session' : 'Book Class'
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio Info Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-pure-black mb-4">Class Schedule</h2>
            <p className="text-xl text-gray-600">
              Small class sizes ensure personalized attention and proper form guidance
            </p>
          </motion.div>


          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-pure-black mb-6">Weekly Schedule</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-cloud-cream rounded-lg">
                    <div>
                      <p className="font-semibold text-pure-black">Monday - Friday</p>
                      <p className="text-gray-600 text-sm">All Levels Available</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#8F9980]">7:00 AM - 8:00 PM</p>
                      <p className="text-gray-600 text-sm">Multiple sessions daily</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-cloud-cream rounded-lg">
                    <div>
                      <p className="font-semibold text-pure-black">Saturday - Sunday</p>
                      <p className="text-gray-600 text-sm">Weekend Sessions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#8F9980]">8:00 AM - 6:00 PM</p>
                      <p className="text-gray-600 text-sm">Relaxed schedule</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-pure-black mb-6">Class Capacity</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[#8F9980]/10 rounded-lg">
                    <p className="font-semibold text-pure-black mb-2">Small Class Sizes</p>
                    <p className="text-gray-600 text-sm">Maximum 6-8 participants per class to ensure personalized attention and proper form guidance.</p>
                  </div>
                  <div className="p-4 bg-[#b9d9eb]/10 rounded-lg">
                    <p className="font-semibold text-pure-black mb-2">Private Sessions</p>
                    <p className="text-gray-600 text-sm">One-on-one training available for personalized programs and specific goals.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Classes;