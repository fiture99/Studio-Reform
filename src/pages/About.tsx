import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const About: React.FC = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Member since 2022',
      text: 'Studio Reform completely transformed my relationship with fitness. The trainers are incredible and the community is so supportive.',
      image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Michael Chen',
      role: 'Member since 2021',
      text: 'I\'ve never felt stronger or more confident. The personalized approach here makes all the difference.',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Emma Rodriguez',
      role: 'Member since 2023',
      text: 'The holistic approach to fitness at Studio Reform has improved not just my body, but my mental health too.',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const trainers = [
    {
      name: 'Alex Thompson',
      specialty: 'Pilates & Yoga',
      credentials: 'Certified Pilates Instructor, 200hr Yoga Teacher',
      image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Jordan Williams',
      specialty: 'Strength Training',
      credentials: 'NASM-CPT, Functional Movement Specialist',
      image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Taylor Davis',
      specialty: 'HIIT & Cardio',
      credentials: 'ACSM Certified, Group Fitness Instructor',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-[#f5efe5] from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-black mb-6">About Studio Reform</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Founded on the belief that true fitness goes beyond physical transformation, 
              we create a space where mind, body, and spirit unite in perfect harmony.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 bg-[#8b987b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-[#f5efe5] mb-6">Our Philosophy</h2>
              <p className="text-lg text-[#f5efe5] mb-6">
                At Studio Reform, we believe that fitness is not just about building muscle or losing weight. 
                It's about creating a sustainable lifestyle that nourishes your entire being.
              </p>
              <p className="text-lg text-[#f5efe5] mb-6">
                Our approach combines cutting-edge fitness techniques with mindfulness practices, 
                creating a holistic experience that transforms not just your body, but your relationship with health and wellness.
              </p>
              <p className="text-lg text-[#f5efe5]">
                Every program is designed to challenge you appropriately, support your goals, 
                and help you discover strength you never knew you had.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="https://images.pexels.com/photos/416809/pexels-photo-416809.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Studio Interior" 
                className="rounded-lg shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trainers Section */}
      <section className="py-20 bg-[#f5efe5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-black mb-4">Meet Our Expert Trainers</h2>
            <p className="text-xl text-[#f5efe5]">
              Our certified professionals are passionate about helping you achieve your goals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trainers.map((trainer, index) => (
              <motion.div
                key={trainer.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#8b987b] rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <img 
                  src={trainer.image} 
                  alt={trainer.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-black mb-2">{trainer.name}</h3>
                  <p className="text-[#f5efe5] font-medium mb-3">{trainer.specialty}</p>
                  <p className="text-[#f5efe5] text-sm">{trainer.credentials}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-black text-[#f5efe5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">What Our Members Say</h2>
            <p className="text-xl text-[#f5efe5]">
              Real stories from real people who transformed their lives at Studio Reform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900 rounded-lg p-8 relative"
              >
                <Quote className="h-8 w-8 text-[#8b987b] mb-4" />
                <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text[#f5efe5] text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;