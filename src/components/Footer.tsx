import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';
import logo from '../images/logo (1).svg'

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Studio Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              {/* <Dumbbell className="h-8 w-8 text-yellow-600" /> */}
              <img src={logo} alt="Studio Reform Logo" className="h-[65px]  " />
              
              <span className="text-gray-300 font-semibold">Studio Reform</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Transform your body and mind at Studio Reform. Our premium fitness studio offers world-class classes, expert trainers, and a motivating community.
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-yellow-600" />
              <span className="text-gray-300">Banjul, The Gambia</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Phone className="h-4 w-4 text-yellow-600" />
              <span className="text-gray-300">+220 123 4567</span>
            </div>
            <div className="flex items-center space-x-2 mb-6">
              <Mail className="h-4 w-4 text-yellow-600" />
              <span className="text-gray-300">info@studioreform.com</span>
            </div>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-gray-400 hover:text-yellow-600 cursor-pointer transition-colors" />
              <Instagram className="h-6 w-6 text-gray-400 hover:text-yellow-600 cursor-pointer transition-colors" />
              <Twitter className="h-6 w-6 text-gray-400 hover:text-yellow-600 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-300 hover:text-yellow-600 transition-colors">About Us</Link></li>
              <li><Link to="/classes" className="text-gray-300 hover:text-yellow-600 transition-colors">Classes</Link></li>
              <li><Link to="/membership" className="text-gray-300 hover:text-yellow-600 transition-colors">Membership</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-yellow-600 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-300">123 Fitness St, City, State 12345</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-300">(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-300">support@studioreform.com</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
