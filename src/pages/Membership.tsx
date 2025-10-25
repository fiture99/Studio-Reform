import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const Membership: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'bank' | null>(null);

  const packages = [
    {
      category: 'Intro Pack',
      items: [
        { name: '1 Session', price: 'D 800', validity: 'valid 1 month' },
        { name: '3 Sessions', price: 'D 2,200', validity: 'valid 6 weeks' },
        { name: '5 Sessions', price: 'D 3,500', validity: 'valid 2 months' },
        { name: '10 Sessions', price: 'D 6,500', validity: 'valid 3 months' },
        { name: 'Monthly Unlimited', price: 'D 12,000' }
      ]
    },
    {
      category: 'PRIVATE',
      items: [
        { name: '1 Session', price: 'D 2,500', validity: 'valid 1 month' },
        { name: '3 Sessions', price: 'D 7,000', validity: 'valid 6 weeks' },
        { name: '5 Sessions', price: 'D 11,000', validity: 'valid 2 months' },
        { name: '10 Sessions', price: 'D 20,000', validity: 'valid 3 months' }
      ]
    }
  ];

  const openModal = (method: 'wave' | 'bank') => {
    setPaymentMethod(method);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setPaymentMethod(null);
  };

  return (
    <div className="pt-16 bg-[#f5efe5]">
      {/* Hero Section */}
      <section className="py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-bold text-black mb-4">Studio Reform Packages</h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Choose the package that fits your needs. All packages can be paid ahead of time.
            We accept <strong>Wave</strong> or <strong>Bank Transfer</strong>.
          </p>
        </motion.div>
      </section>

      {/* Packages Section */}
      <section className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-black mb-4">{pkg.category}</h2>
              <ul className="space-y-4">
                {pkg.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-white rounded-lg p-4 shadow"
                  >
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{item.price}</span>
                      {item.validity && (
                        <span className="text-gray-500 ml-2">{item.validity}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Payment Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
        >
          <button
            className="bg-green-500 text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-green-600 transition"
            onClick={() => openModal('wave')}
          >
            Pay with Wave
          </button>
          <button
            className="bg-blue-700 text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-blue-800 transition"
            onClick={() => openModal('bank')}
          >
            Bank Transfer
          </button>
        </motion.div>

        {/* Note Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-10 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded"
        >
          <p className="text-gray-800">
            ✨ <strong>Note:</strong> All packages expire after listed validity. Packages can be frozen once at no extra cost for up to 2 weeks per package.
          </p>
        </motion.div>
      </section>

      {/* Payment Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <motion.div
            className="bg-white rounded-lg max-w-md w-full p-6 relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black font-bold text-xl"
              onClick={closeModal}
            >
              ×
            </button>

            {paymentMethod === 'bank' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Bank Transfer Details</h3>
                <p className="mb-2">Bank: Trust Bank</p>
                <p className="mb-2">Account Name: Studio Reform</p>
                <p className="mb-2">Account Number: 002123456789</p>
                <p className="text-sm text-gray-500 mt-4">
                  Please include your name as reference when making the transfer.
                </p>
              </div>
            )}

            {paymentMethod === 'wave' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Wave Payment Details</h3>
                <p className="mb-2">Wave Number: +220 123 4567</p>
                <p className="mb-2">Account Name: Studio Reform</p>
                <p className="text-sm text-gray-500 mt-4">
                  Make sure to send the exact amount and reference your name.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Membership;
