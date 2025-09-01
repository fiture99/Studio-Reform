import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Award, Heart, Clock } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Expert Trainers',
      description: 'Certified professionals dedicated to your success'
    },
    {
      icon: Award,
      title: 'Premium Equipment',
      description: 'State-of-the-art facilities and equipment'
    },
    {
      icon: Heart,
      title: 'Holistic Approach',
      description: 'Mind, body, and spirit transformation'
    },
    {
      icon: Clock,
      title: 'Flexible Schedule',
      description: 'Classes that fit your busy lifestyle'
    }
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-sage-green/80 to-pure-black/50 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)'
          }}
        ></div>
        
        <div className="relative z-20 text-center max-w-4xl mx-auto px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-pure-black"
          >
            Reform Your Body,<br />
            <span className="text-sage-green">Reform Your Life</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-cloud-cream"
          >
            The Gambia's first boutique reformer Pilates studio. Mindful movement and modern wellness rooted in the original principles of Pilates.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/classes"
              className="bg-sage-green text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-sage-green/90 transition-colors inline-flex items-center justify-center"
            >
              Discover Your Balance <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/about"
              className="border-2 border-cloud-cream text-cloud-cream px-8 py-4 rounded-md font-semibold text-lg hover:bg-cloud-cream hover:text-sage-green transition-colors"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-cloud-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-pure-black mb-4">Why Choose Studio Reform?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The Gambia's premier destination for mindful movement, healing, and transformation through reformer Pilates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="bg-sage-green w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-soft-blue transition-colors">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-pure-black mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sage-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Find Your Balance, Discover Your Strength</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join our community and experience the transformative power of reformer Pilates
            </p>
            <Link
              to="/membership"
              className="bg-cloud-cream text-sage-green px-8 py-4 rounded-md font-semibold text-lg hover:bg-white transition-colors inline-flex items-center"
            >
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;