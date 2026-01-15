import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Phone, Building, Star, ArrowLeft, Printer, AlertCircle } from 'lucide-react';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const Membership: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [classBookingId, setClassBookingId] = useState<number | null>(null);
  const [membershipBookingId, setMembershipBookingId] = useState<number | null>(null);
  const [classReference, setClassReference] = useState<string>('');
  const [requiresClassBooking, setRequiresClassBooking] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for booking data from multiple sources
  useEffect(() => {
    const checkBookingData = () => {
      // 1. Check location state (from navigation)
      const bookingIdFromState = location.state?.bookingId;
      const referenceFromState = location.state?.referenceNumber;
      
      // 2. Check sessionStorage (persisted data)
      const storedData = sessionStorage.getItem('bookingData');
      const bookingData = storedData ? JSON.parse(storedData) : null;
      
      console.log('SessionStorage data:', bookingData);
      console.log('Location state:', location.state);
      
      // Try multiple possible property names
      const classId = bookingIdFromState || 
                     bookingData?.bookingId || 
                     bookingData?.classBookingId;
      
      const reference = referenceFromState || 
                       bookingData?.referenceNumber || 
                       bookingData?.classReference;
      
      if (classId && reference) {
        // Data found
        setClassBookingId(classId);
        setClassReference(reference);
        setRequiresClassBooking(false);
        
        // Also store in sessionStorage with consistent structure
        sessionStorage.setItem('bookingData', JSON.stringify({
          classBookingId: classId,
          classReference: reference,
          timestamp: new Date().toISOString(),
          ...bookingData
        }));
      } else {
        // No booking data found
        setRequiresClassBooking(true);
      }
    };
    
    checkBookingData();
  }, [location]);

  const packages = [
    {
      category: 'Intro Pack',
      items: [
        { name: '1 Session', price: 800, displayPrice: 'D 800', validity: 'valid 1 month', id: 'intro-1' },
        { name: '3 Sessions', price: 2200, displayPrice: 'D 2,200', validity: 'valid 6 weeks', id: 'intro-3' },
        { name: '5 Sessions', price: 3500, displayPrice: 'D 3,500', validity: 'valid 2 months', id: 'intro-5' },
        { name: '10 Sessions', price: 6500, displayPrice: 'D 6,500', validity: 'valid 3 months', id: 'intro-10' },
        { name: 'Monthly Unlimited', price: 12000, displayPrice: 'D 12,000', id: 'intro-unlimited' }
      ]
    },
    {
      category: 'PRIVATE',
      items: [
        { name: '1 Session', price: 2500, displayPrice: 'D 2,500', validity: 'valid 1 month', id: 'private-1' },
        { name: '3 Sessions', price: 7000, displayPrice: 'D 7,000', validity: 'valid 6 weeks', id: 'private-3' },
        { name: '5 Sessions', price: 11000, displayPrice: 'D 11,000', validity: 'valid 2 months', id: 'private-5' },
        { name: '10 Sessions', price: 20000, displayPrice: 'D 20,000', validity: 'valid 3 months', id: 'private-10' }
      ]
    }
  ];

  const paymentMethods = [
    {
      method: 'wave',
      title: 'Wave Mobile Money',
      icon: Phone,
      details: [
        { label: 'Wave Number', value: '+220 2600250' },
        { label: 'Account Name', value: 'Studio Reform' }
      ],
      instructions: [
        'Open your Wave app',
        'Send payment to the number above',
        'Include your reference number'
      ],
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      method: 'bank',
      title: 'Bank Transfer',
      icon: Building,
      details: [
        { label: 'Bank Name', value: 'Trust Bank' },
        { label: 'Account Name', value: 'Studio Reform' },
        { label: 'Account Number', value: '10114221701' }
      ],
      instructions: [
        'Transfer to the account details above',
        'Use reference number as payment reference',
        'Send screenshot to +220 2600250'
      ],
      color: 'bg-blue-700 hover:bg-blue-800'
    }
  ];

  const handlePackageSelect = (pkg: any) => {
    if (!isAuthenticated) {
      alert('Please sign in to purchase a package');
      return;
    }
    
    if (requiresClassBooking) {
      alert('Please book a class first before purchasing a membership package');
      navigate('/Studio-Reform/classes');
      return;
    }
    
    setSelectedPackage(pkg.id);
    setSelectedPaymentMethod(null);
  };

  const handlePaymentMethodSelect = async (method: string) => {
  if (!selectedPackage) return;

  if (requiresClassBooking || !classBookingId || !classReference) {
    alert('Please book a class first before purchasing a membership package');
    navigate('/Studio-Reform/classes');
    return;
  }

  setProcessing(true);

  try {
    const selectedPkg = packages
      .flatMap(p => p.items)
      .find(item => item.id === selectedPackage);

    if (!selectedPkg) {
      alert('Package not found');
      return;
    }

    // Try to create membership with the SAME reference number
    // First, try with create() including reference_number
    const response = await bookingsAPI.create({
      booking_type: 'membership',
      package_id: selectedPackage,
      amount: selectedPkg.price,
      reference_number: classReference,  // Try sending existing reference
      class_booking_id: classBookingId   // Link to existing class booking
    });

    // If that doesn't work, fall back to createMembership
    // const response = await bookingsAPI.createMembership({
    //   booking_type: 'membership',
    //   package_id: selectedPackage,
    //   amount: selectedPkg.price,
    //   reference_number: classReference  // Try if backend accepts it
    // });

    const membershipRef = response.reference_number;
    
    // Check if we got the same reference
    if (membershipRef === classReference) {
      console.log('✅ Success! Same reference number used:', membershipRef);
    } else {
      console.warn('⚠️ Different reference numbers. Backend generated new one.');
      // You might want to update the backend to use same reference
    }
    
    setMembershipBookingId(response.booking_id);
    
    // Update sessionStorage
    const currentData = sessionStorage.getItem('bookingData');
    const bookingData = currentData ? JSON.parse(currentData) : {};
    bookingData.membershipBookingId = response.booking_id;
    bookingData.displayReference = classReference;
    bookingData.packageId = selectedPackage;
    bookingData.packageName = selectedPkg.name;
    bookingData.amount = selectedPkg.price;
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

    setSelectedPaymentMethod(method);

  } catch (error: any) {
    console.error('Booking creation error:', error);
    
    // If backend doesn't accept reference_number, you need to modify backend
    if (error.response?.status === 400 && error.response?.data?.message?.includes('reference')) {
      alert('System error: Cannot use same reference. Please contact support.');
    } else {
      alert(
        error.response?.data?.message ||
        error.message ||
        'Failed to create membership booking. Please try again.'
      );
    }
  } finally {
    setProcessing(false);
  }
};

  const handlePaymentComplete = async () => {
    if (!selectedPaymentMethod || !membershipBookingId) return;

    setProcessing(true);

    try {
      // Update payment for the membership booking
      await bookingsAPI.updatePayment(membershipBookingId, {
        payment_method: selectedPaymentMethod.toLowerCase()
      });

      const selectedPkg = packages.flatMap(p => p.items).find(item => item.id === selectedPackage);
      
      // Show success with ONLY class reference
      alert(`✅ Payment Confirmed!\n\n📅 Your Reference Number: ${classReference}\n📦 Package: ${selectedPkg?.name}\n\nYour class booking and package have been activated!`);
      
      // Clear sessionStorage after successful payment
      sessionStorage.removeItem('bookingData');
      
      // Reset all states
      setSelectedPackage(null);
      setSelectedPaymentMethod(null);
      setClassReference('');
      setClassBookingId(null);
      setMembershipBookingId(null);
      setRequiresClassBooking(true);

    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      alert(error.message || 'Payment confirmation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getSelectedPackageDetails = () => {
    return packages.flatMap(p => p.items).find(item => item.id === selectedPackage);
  };

  const getSelectedPaymentMethodDetails = () => {
    return paymentMethods.find(method => method.method === selectedPaymentMethod);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }

    const selectedPkg = getSelectedPackageDetails();
    const paymentDetails = getSelectedPaymentMethodDetails();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Studio Reform - Payment Details</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #8F9980; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .header h1 { 
              color: #8F9980; 
              margin: 0; 
            }
            .section { 
              margin-bottom: 25px; 
              padding: 15px; 
              border: 1px solid #ddd; 
              border-radius: 8px;
            }
            .section h2 { 
              color: #8F9980; 
              margin-top: 0; 
              border-bottom: 1px solid #eee; 
              padding-bottom: 8px;
            }
            .reference-number { 
              background: #f0f0f0; 
              padding: 15px; 
              border-radius: 6px; 
              font-family: monospace; 
              font-size: 18px; 
              text-align: center;
              margin: 15px 0;
              border: 2px dashed #8F9980;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 8px 0; 
            }
            .instructions { 
              background: #f9f9f9; 
              padding: 12px; 
              border-radius: 6px; 
            }
            .instructions ol { 
              margin: 0; 
              padding-left: 20px; 
            }
            .instructions li { 
              margin: 5px 0; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #ddd; 
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Studio Reform</h1>
            <h2>Payment Instructions</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2>Package Details</h2>
            <div class="detail-row">
              <strong>Package:</strong> ${selectedPkg?.name || 'N/A'}
            </div>
            <div class="detail-row">
              <strong>Amount:</strong> ${selectedPkg?.displayPrice || 'N/A'}
            </div>
            <div class="detail-row">
              <strong>Validity:</strong> ${selectedPkg?.validity || 'N/A'}
            </div>
          </div>

          <div class="section">
            <h2>Your Reference Number</h2>
            <div class="reference-number">
              ${classReference}
            </div>
            <p style="text-align: center; color: #666;">
              Use this reference number for both your class booking and membership package
            </p>
          </div>

          <div class="section">
            <h2>Payment Method: ${paymentDetails?.title || 'N/A'}</h2>
            ${paymentDetails?.details.map(detail => `
              <div class="detail-row">
                <strong>${detail.label}:</strong> 
                <span style="font-family: monospace;">${detail.value}</span>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <h2>Payment Instructions</h2>
            <div class="instructions">
              <ol>
                ${paymentDetails?.instructions.map(instruction => `
                  <li>${instruction}</li>
                `).join('')}
              </ol>
            </div>
          </div>

          <div class="section">
            <h2>Important Notes</h2>
            <ul>
              <li>Send payment confirmation to +220 2600250 on WhatsApp</li>
              <li>Include your name and reference number</li>
              <li>Your package will be activated after payment confirmation</li>
              <li>Contact us if you have any questions</li>
            </ul>
          </div>

          <div class="footer">
            <p>Studio Reform &copy; ${new Date().getFullYear()} | Thank you for your business!</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper variables
  const selectedPkgDetails = getSelectedPackageDetails();
  const selectedPaymentDetails = getSelectedPaymentMethodDetails();

  // Booking status banner
  const BookingStatusBanner = () => {
    if (requiresClassBooking) {
      return (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="font-semibold text-yellow-800">Class Booking Required</h3>
              <p className="text-sm text-yellow-700">
                To purchase a membership, please book a class first to get your reference number.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/Studio-Reform/classes')}
            className="mt-3 bg-[#8F9980] text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-[#7a8570] transition-colors"
          >
            Go to Classes
          </button>
        </div>
      );
    }

    if (classBookingId && classReference) {
      return (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">
                Active Booking Found ✓
              </h3>
              <div className="text-sm text-green-700">
                <div className="mb-1">
                  <span className="font-medium">Your Reference Number:</span>{' '}
                  <code className="font-mono bg-green-100 px-2 py-1 rounded">{classReference}</code>
                </div>
                {/* <p className="text-xs text-green-600 italic">
                  Use this reference for both class and membership
                </p> */}
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('bookingData');
                setClassBookingId(null);
                setMembershipBookingId(null);
                setClassReference('');
                setSelectedPackage(null);
                setSelectedPaymentMethod(null);
                setRequiresClassBooking(true);
              }}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              Clear & Start New
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="pt-16 bg-[#f5efe5] min-h-screen">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Booking Status Banner */}
        <BookingStatusBanner />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Packages Section */}
          <div>
            <section className="space-y-12">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={requiresClassBooking ? 'opacity-50 pointer-events-none' : ''}
                >
                  <h2 className="text-3xl font-bold text-black mb-4">{pkg.category}</h2>
                  <ul className="space-y-4">
                    {pkg.items.map((item, idx) => (
                      <li
                        key={idx}
                        className={`flex items-center justify-between rounded-lg p-4 shadow border-l-4 cursor-pointer transition-all ${
                          selectedPackage === item.id 
                            ? 'bg-[#8F9980] text-white border-white' 
                            : 'bg-white border-[#8F9980] hover:bg-gray-50'
                        } ${requiresClassBooking ? 'cursor-not-allowed' : ''}`}
                        onClick={() => !requiresClassBooking && handlePackageSelect(item)}
                      >
                        <div className="flex items-center space-x-2">
                          {selectedPackage === item.id ? (
                            <Star className="h-5 w-5 text-yellow-300" />
                          ) : (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-lg">{item.displayPrice}</span>
                          {item.validity && (
                            <span className={`text-sm block ${
                              selectedPackage === item.id ? 'text-yellow-100' : 'text-gray-500'
                            }`}>
                              {item.validity}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </section>

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
          </div>

          {/* Payment Methods Section */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="sticky top-24"
            >
              <h2 className="text-3xl font-bold text-black mb-6 text-center">
                {selectedPaymentMethod ? 'Payment Details' : 'Payment Methods'}
              </h2>
              
              {selectedPaymentMethod && (
                <button
                  onClick={() => setSelectedPaymentMethod(null)}
                  className="mb-4 flex items-center text-[#8F9980] hover:text-[#6b7356] transition-colors"
                >
                  <ArrowLeft size={20} className="mr-2" />
                  Back to payment methods
                </button>
              )}

              {/* Payment Details View */}
              {selectedPaymentMethod && classReference ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Print Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handlePrint}
                      className="flex items-center bg-[#8F9980] text-white px-4 py-2 rounded-lg hover:bg-[#7a8570] transition-colors"
                    >
                      <Printer size={18} className="mr-2" />
                      Print Payment Details
                    </button>
                  </div>

                  {/* Printable Content */}
                  <div ref={printRef} className="printable-content">
                    {/* Package Summary */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Package Summary</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{selectedPkgDetails?.name}</span>
                        <span className="font-bold text-lg">{selectedPkgDetails?.displayPrice}</span>
                      </div>
                      {selectedPkgDetails?.validity && (
                        <div className="mt-2 text-sm text-gray-500">
                          Validity: {selectedPkgDetails?.validity}
                        </div>
                      )}
                    </div>

                    {/* Reference Number */}
                    <div className="bg-gradient-to-r from-[#8F9980] to-green-600 rounded-lg text-white p-6">
                      <h3 className="font-bold text-lg mb-3">Your Reference Number</h3>
                      <div className="flex items-center justify-between">
                        <code className="text-lg font-mono bg-black/20 px-4 py-3 rounded flex-1 mr-4">
                          {classReference}
                        </code>
                        <button
                          onClick={() => copyToClipboard(classReference, 'reference')}
                          className="p-3 bg-white/20 rounded hover:bg-white/30 transition-colors flex-shrink-0"
                        >
                          {copied === 'reference' ? (
                            <Check size={20} className="text-green-300" />
                          ) : (
                            <Copy size={20} />
                          )}
                        </button>
                      </div>
                      <p className="text-sm mt-3 text-yellow-100">
                        Include this reference number when making payment
                      </p>
                    </div>

                    {/* Payment Method Details */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border">
                      <div className="flex items-center mb-4">
                        {selectedPaymentDetails?.icon && (
                          <selectedPaymentDetails.icon className="h-6 w-6 mr-2 text-gray-600" />
                        )}
                        <h3 className="text-xl font-bold text-gray-800">
                          {selectedPaymentDetails?.title}
                        </h3>
                      </div>

                      {/* Payment Details */}
                      <div className="space-y-4 mb-6">
                        {selectedPaymentDetails?.details.map((detail, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">{detail.label}:</span>
                            <div className="flex items-center space-x-2">
                              <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                                {detail.value}
                              </code>
                              <button
                                onClick={() => copyToClipboard(detail.value, `${selectedPaymentMethod}-${idx}`)}
                                className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                              >
                                {copied === `${selectedPaymentMethod}-${idx}` ? (
                                  <Check size={16} className="text-green-500" />
                                ) : (
                                  <Copy size={16} className="text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Instructions */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-gray-700 mb-3">Instructions:</h4>
                        <ol className="text-sm text-gray-600 space-y-2">
                          {selectedPaymentDetails?.instructions.map((instruction, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-xs bg-[#8F9980] text-white rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                {idx + 1}
                              </span>
                              {instruction}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Additional Info */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-blue-800 mb-2">After Payment:</h4>
                        <p className="text-sm text-blue-700">
                          Send your payment confirmation to{' '}
                          <strong>+220 2600250</strong> on WhatsApp with your name and reference number.
                        </p>
                      </div>

                      {/* Complete Payment Button */}
                      <button
                        onClick={handlePaymentComplete}
                        disabled={processing}
                        className={`w-full text-white py-3 px-4 rounded-md font-semibold transition-colors ${
                          selectedPaymentDetails?.color || 'bg-gray-500'
                        } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {processing ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Confirming Payment...
                          </div>
                        ) : (
                          'I Have Completed Payment'
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Payment Methods Selection View */
                <>
                  {selectedPackage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6 p-4 bg-gradient-to-r from-[#8F9980] to-green-600 rounded-lg text-white"
                    >
                      <h3 className="font-bold text-lg mb-2">Ready for Payment</h3>
                      <p className="text-sm text-yellow-100">
                        Select a payment method to proceed with payment
                      </p>
                    </motion.div>
                  )}

                  <div className={`space-y-6 ${requiresClassBooking ? 'opacity-50 pointer-events-none' : ''}`}>
                    {paymentMethods.map((method, index) => (
                      <div key={method.method} className={`bg-white rounded-lg shadow-lg p-6 border ${
                        !selectedPackage || requiresClassBooking ? 'opacity-50' : ''
                      }`}>
                        <div className="flex items-center mb-4">
                          <method.icon className="h-6 w-6 mr-2 text-gray-600" />
                          <h3 className="text-xl font-bold text-gray-800">{method.title}</h3>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-gray-700 mb-2">How it works:</h4>
                          <p className="text-sm text-gray-600">
                            Select this method to get payment details using your class reference
                          </p>
                        </div>

                        <button
                          onClick={() => !requiresClassBooking && handlePaymentMethodSelect(method.method)}
                          disabled={!selectedPackage || processing || requiresClassBooking}
                          className={`w-full text-white py-3 px-4 rounded-md font-semibold transition-colors ${
                            method.color
                          } ${!selectedPackage || processing || requiresClassBooking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {processing ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating Booking...
                            </div>
                          ) : (
                            `Pay with ${method.title.split(' ')[0]}`
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!selectedPaymentMethod && !requiresClassBooking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <h4 className="font-semibold text-blue-800 mb-2">After Payment:</h4>
                  <p className="text-sm text-blue-700">
                    Send your payment confirmation to{' '}
                    <strong>+220 2600250</strong> on WhatsApp with your name and reference number.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;