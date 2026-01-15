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
      <section className="py-20 bg-gradient-to-b from-cloud-cream to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-pure-black mb-6">The Studio</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Studio Reform A boutique reformer Pilates studio in The Gambia, created to bring mindful
              movement and modern wellness to our community. Rooted in the original principles of Pilates,
              our classes focus on both healing and transformation leaving you balanced, strengthened,
              and renewed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-pure-black mb-6">Our Philosophy</h2>
              <p className="text-lg text-gray-600 mb-6">
                At Studio Reform, we believe in the transformative power of mindful movement. 
                Our approach honors the original principles of Pilates while embracing modern wellness practices.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Each class is designed to create balance between strength and flexibility, 
                control and flow, challenge and restoration. We focus on quality of movement over quantity.
              </p>
              <p className="text-lg text-gray-600">
                Whether you're seeking healing, transformation, or simply a moment of mindful movement, 
                our studio provides a sanctuary for your wellness journey.
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
                src="https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Studio Interior" 
                className="rounded-lg shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trainers Section */}
      {/* <section className="py-20 bg-cloud-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-pure-black mb-4">Meet Our Instructors</h2>
            <p className="text-xl text-gray-600">
              Certified Pilates professionals dedicated to your mindful movement journey
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
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <img 
                  src={trainer.image} 
                  alt={trainer.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-pure-black mb-2">{trainer.name}</h3>
                  <p className="text-[#8F9980] font-medium mb-3">{trainer.specialty}</p>
                  <p className="text-gray-600 text-sm">{trainer.credentials}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Testimonials Section */}
      {/* <section className="py-20 bg-[#8F9980] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">What Our Members Say</h2>
            <p className="text-xl text-gray-300">
              Stories of transformation, healing, and discovery from our Studio Reform community
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
                <Quote className="h-8 w-8 text-cloud-cream mb-4" />
                <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default About;