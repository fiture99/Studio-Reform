import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Crown, Zap } from 'lucide-react';

const Membership: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 89,
      period: 'month',
      icon: Zap,
      description: 'Perfect for beginners starting their fitness journey',
      features: [
        'Access to all group classes',
        'Basic locker room facilities',
        'Monthly fitness assessment',
        'Access to mobile app',
        'Community support group'
      ],
      popular: false,
      color: 'border-gray-200'
    },
    {
      name: 'Transform',
      price: 149,
      period: 'month',
      icon: Star,
      description: 'Most popular choice for serious fitness enthusiasts',
      features: [
        'All Starter benefits',
        'Unlimited class bookings',
        'Premium locker with amenities',
        '2 personal training sessions/month',
        'Nutrition consultation',
        'Access to recovery room',
        'Guest passes (2/month)'
      ],
      popular: true,
      color: 'border-yellow-600'
    },
    {
      name: 'Elite',
      price: 249,
      period: 'month',
      icon: Crown,
      description: 'Ultimate experience with exclusive premium services',
      features: [
        'All Transform benefits',
        'Unlimited personal training',
        'VIP locker room access',
        'Private shower suites',
        'Complimentary towel service',
        'Priority class booking',
        'Monthly massage therapy',
        'Unlimited guest passes',
        '24/7 gym access'
      ],
      popular: false,
      color: 'border-black'
    }
  ];

  const faqs = [
    {
      question: 'Can I cancel my membership anytime?',
      answer: 'Yes, you can cancel your membership with 30 days written notice. No cancellation fees apply.'
    },
    {
      question: 'Are there any joining fees?',
      answer: 'We do not charge any joining fees. The price you see is what you pay monthly.'
    },
    {
      question: 'Can I freeze my membership?',
      answer: 'Yes, you can freeze your membership for up to 3 months per year for medical or travel reasons.'
    },
    {
      question: 'Do you offer family discounts?',
      answer: 'Yes! We offer 15% discount for families with 2+ members on the same plan.'
    },
    {
      question: 'What if I want to upgrade or downgrade?',
      answer: 'You can change your plan at any time. Changes take effect from your next billing cycle.'
    }
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold text-black mb-6">Membership Plans</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Choose the perfect plan to start your transformation journey. 
              All memberships include access to our world-class facilities and expert guidance.
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 inline-block">
              <p className="text-yellow-800 font-medium">🎉 New Member Special: Get your first month FREE!</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Membership Plans */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-white rounded-lg shadow-lg overflow-hidden border-2 ${plan.color} ${
                  plan.popular ? 'scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-yellow-600 text-black text-center py-2 font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                  <div className="text-center mb-8">
                    <plan.icon className={`h-12 w-12 mx-auto mb-4 ${
                      plan.popular ? 'text-yellow-600' : 'text-gray-600'
                    }`} />
                    <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-black">${plan.price}</span>
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-3 px-4 rounded-md font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-yellow-600 text-black hover:bg-yellow-500'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}>
                    Choose {plan.name}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-black mb-4">Why Choose Studio Reform?</h2>
            <p className="text-xl text-gray-600">
              Every membership comes with exclusive benefits designed for your success
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'No Contracts',
                description: 'Month-to-month flexibility with no long-term commitments'
              },
              {
                title: 'Expert Trainers',
                description: 'Certified professionals dedicated to your success'
              },
              {
                title: 'Small Classes',
                description: 'Intimate class sizes ensure personalized attention'
              },
              {
                title: 'Premium Facilities',
                description: 'State-of-the-art equipment in a luxury environment'
              }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-black mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Got questions? We've got answers to help you make the right choice.
            </p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-black mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join Studio Reform today and take the first step towards transforming your life
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-yellow-600 text-black px-8 py-4 rounded-md font-semibold text-lg hover:bg-yellow-500 transition-colors">
                Start Free Trial
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-white hover:text-black transition-colors">
                Schedule Tour
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Membership;