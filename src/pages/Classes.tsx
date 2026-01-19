import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, BookOpen, Star, Check, X } from 'lucide-react';
import { classesAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import advanceImg from '../images/advance.png';
import foundationImg from '../images/Foudation.png';
import foundamentalImg from '../images/Foundamental.png';
import transitionalImg from '../images/transitional.png';

const Classes: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { isAuthenticated } = useAuth();



  const classLevels = [
    {
      id: 1,
      level: 'all levels',
      name: 'Root (Classical)',
      description: 'A return to classical Pilates. Precise, grounded, and methodical — ROOT follows the traditional reformer sequence focusing on control, alignment, and flow. Ideal for anyone wanting to reconnect with the roots of the method through a structured, mindful pace.',
      difficulty: 'All Levels',
      duration: '50 min',
      instructor: 'Studio Reform',
      image: foundationImg
    },
    {
      id: 2,
      level: 'all levels',
      name: 'Reform I (Signature, Full Body)',
      description: 'The signature Studio Reform experience. A full-body reformer flow that merges strength, elongation, and balance.',
      difficulty: 'All Levels',
      duration: '50 min',
      instructor: 'Studio Reform',
      image: foundamentalImg
    },
    {
      id: 3,
      level: 'intermediate',
      name: 'Reform II (Abs, Booty, Core)',
      description: 'The sculpting phase. Focus on the ABC\'s. A focused reformer class targeting abs, booty, and core through deeper resistance and endurance sequences. Elevated energy, refined precision, intentional burn.',
      difficulty: 'Intermediate',
      duration: '55 min',
      instructor: 'Studio Reform',
      image: transitionalImg
    },
    {
      id: 4,
      level: 'all levels',
      name: 'Rhythm (Jumpboard)',
      description: 'A dynamic reformer flow with jumpboard integration. Low-impact bursts that challenge coordination and control while maintaining form and precision. Strength in flight, grounded by grace.',
      difficulty: 'All Levels',
      duration: '55 min',
      instructor: 'Studio Reform',
      image: advanceImg
    },
    {
      id: 5,
      level: 'all levels',
      name: 'Repose (Stretch)',
      description: 'A restorative reformer experience for elongation, mobility, and release. Focused on breath, flexibility, and tension relief — the Studio Reform reset. "Rest is part of reform."',
      difficulty: 'All Levels',
      duration: '50 min',
      instructor: 'Studio Reform',
      image: 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
  ]

  useEffect(() => {
    setClasses(classLevels);
    setLoading(false);
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };



  // In Classes component, after successful booking
const handleBookClass = async (classItem: any) => {
  if (!isAuthenticated) {
    alert('Please sign in to book a class');
    return;
  }

  setBookingLoading(classItem.id);

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await bookingsAPI.create({
      booking_type: 'class',
      class_id: classItem.id,
      booking_date: tomorrow.toISOString().split('T')[0],
      booking_time: '07:00',
      amount: 0
    });

    showSuccessMessage(
      `Success! Your ${classItem.name} class has been booked.
Reference: ${response.reference_number}`
    );

    // Store booking data in sessionStorage - USE CORRECT STRUCTURE
    sessionStorage.setItem('bookingData', JSON.stringify({
      classBookingId: response.booking_id,  // Changed from bookingId
      classReference: response.reference_number,  // Changed from referenceNumber
      classItem: classItem,
      timestamp: new Date().toISOString()
    }));

    // Navigate to membership
    setTimeout(() => {
      navigate('/Studio-Reform/membership');
    }, 1000);

  } catch (error: any) {
    console.error(error);
    alert(
      error.response?.data?.message ||
      error.message ||
      'Failed to book class'
    );
  } finally {
    setBookingLoading(null);
  }
};

  

  // const handleBookClass = async (classItem: any) => {
  //   if (!isAuthenticated) {
  //     alert('Please sign in to book a class');
  //     return;
  //   }

  //   setBookingLoading(classItem.id);

  //   try {
  //     const tomorrow = new Date();
  //     tomorrow.setDate(tomorrow.getDate() + 1);

  //     // Create the booking
  //     const response = await bookingsAPI.create({
  //       booking_type: 'class',
  //       class_id: classItem.id,
  //       booking_date: tomorrow.toISOString().split('T')[0],
  //       booking_time: '07:00',
  //       amount: 0
  //     });

  //     // Show success message immediately after booking
  //     showSuccessMessage(`Success! Your ${classItem.name} class has been booked for ${tomorrow.toISOString().split('T')[0]} at 07:00. Your reference number is: ${response.reference_number}`);
      
  //      setTimeout(() => {
  //       navigate('/Studio-Reform/membership'); // or '/payment' if that’s your route
  //       }, 1000);
    
  //   } catch (error: any) {
  //     console.error(error);
  //     alert(error.response?.data?.message || error.message || 'Failed to book class');
  //   } finally {
  //     setBookingLoading(null);
  //   }
  // };

  // Success Notification Component
  const SuccessNotification = () => (
    <AnimatePresence>
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-20 right-4 z-50 max-w-sm w-full"
        >
          <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2" />
                <span className="font-semibold">Booking Confirmed!</span>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="text-white hover:text-green-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm">{successMessage}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* Success Notification */}
      <SuccessNotification />

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
                    {classItem.level}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-pure-black mb-2">{classItem.name}</h3>
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
                    {/* <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">{classItem.enrolled || 0}/{classItem.capacity || 8} enrolled</span>
                    </div> */}
                  </div>
                  
                  {/* <button 
                    onClick={() => handleBookClass(classItem)}
                    disabled={bookingLoading === classItem.id}
                    className="w-full bg-[#8F9980] text-white py-2 px-4 rounded-md font-semibold hover:bg-[#7a8570] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingLoading === classItem.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      classItem.name.includes('Private') ? 'Schedule Session' : 'Book Class'
                    )}
                  </button> */}
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
                <h3 className="text-2xl font-bold text-pure-black mb-6">Booking Information</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[#8F9980]/10 rounded-lg">
                    <p className="font-semibold text-pure-black mb-2">Instant Confirmation</p>
                    <p className="text-gray-600 text-sm">Your class booking is confirmed immediately with a reference number.</p>
                  </div>
                  <div className="p-4 bg-[#b9d9eb]/10 rounded-lg">
                    <p className="font-semibold text-pure-black mb-2">Need to Cancel?</p>
                    <p className="text-gray-600 text-sm">Contact us at least 12 hours before your scheduled class.</p>
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