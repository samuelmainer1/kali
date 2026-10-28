import React from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "../../components/ui/button"

const NavbarMobileMenu = ({ isMobileMenuOpen, toggleMobileMenu, data, pathname, handlePhoneClick }) => (
  <AnimatePresence>
    {isMobileMenuOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-[998]"
          onClick={toggleMobileMenu}
        />
        
        {/* Mobile menu panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-0 right-0 h-full w-[90%] sm:w-[75%] max-w-sm bg-white shadow-2xl lg:hidden overflow-y-auto z-[999]"
          aria-label="Main navigation"
        >
          {/* Mobile menu header */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <Link to="/" onClick={toggleMobileMenu} className="flex-shrink-0">
                <img
                  src={data.logo}
                  className="h-12 w-auto"
                  alt="Globeflight Kenya"
                  title="Globeflight Kenya - Home"
                />
              </Link>
              <motion.button
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-[#88C300]/10 text-gray-600 hover:text-[#88C300] transition-all duration-300 shadow-md"
                onClick={toggleMobileMenu}
                aria-label="Close menu"
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Mobile menu items */}
          <div className="p-6">
            <ul className="space-y-2">
              {/* Home */}
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.01 }}
              >
                <Link
                  to="/"
                  className={`block px-4 py-3 rounded-lg transition-all duration-300 font-semibold text-base ${
                    pathname === "/" 
                      ? "bg-[#88C300] text-white shadow-md" 
                      : "text-gray-700 hover:text-[#88C300] hover:bg-[#88C300]/10"
                  }`}
                  onClick={toggleMobileMenu}
                  title="Home - Globeflight Kenya"
                >
                  Home
                </Link>
              </motion.li>

              {/* Services */}
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.02 }}
              >
                <Link
                  to="/services"
                  className={`block px-4 py-3 rounded-lg transition-all duration-300 font-semibold text-base ${
                    pathname === "/services" 
                      ? "bg-[#88C300] text-white shadow-md" 
                      : "text-gray-700 hover:text-[#88C300] hover:bg-[#88C300]/10"
                  }`}
                  onClick={toggleMobileMenu}
                  title="Our Services - Globeflight Kenya"
                >
                  Services
                </Link>
              </motion.li>

              {/* About Us */}
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.025 }}
              >
                <Link
                  to="/about-us"
                  className={`block px-4 py-3 rounded-lg transition-all duration-300 font-semibold text-base ${
                    pathname === "/about-us" 
                      ? "bg-[#88C300] text-white shadow-md" 
                      : "text-gray-700 hover:text-[#88C300] hover:bg-[#88C300]/10"
                  }`}
                  onClick={toggleMobileMenu}
                  title="About Us - Globeflight Kenya"
                >
                  About Us
                </Link>
              </motion.li>

              {/* Updates/Blog */}
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.03 }}
              >
                <Link
                  to="/blog"
                  className={`block px-4 py-3 rounded-lg transition-all duration-300 font-semibold text-base ${
                    pathname === "/blog" 
                      ? "bg-[#88C300] text-white shadow-md" 
                      : "text-gray-700 hover:text-[#88C300] hover:bg-[#88C300]/10"
                  }`}
                  onClick={toggleMobileMenu}
                  title="Blog - Globeflight Kenya"
                >
                  Blog
                </Link>
              </motion.li>

              {/* Careers */}
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.04 }}
              >
                <Link
                  to="/jobs"
                  className={`block px-4 py-3 rounded-lg transition-all duration-300 font-semibold text-base ${
                    pathname === "/jobs" 
                      ? "bg-[#88C300] text-white shadow-md" 
                      : "text-gray-700 hover:text-[#88C300] hover:bg-[#88C300]/10"
                  }`}
                  onClick={toggleMobileMenu}
                  title="Careers at Globeflight Kenya"
                >
                  Careers
                </Link>
              </motion.li>

              {/* Contact Us */}
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <Link
                  to="/contact-us"
                  className={`block px-4 py-3 rounded-lg transition-all duration-300 font-semibold text-base ${
                    pathname === "/contact-us" 
                      ? "bg-[#88C300] text-white shadow-md" 
                      : "text-gray-700 hover:text-[#88C300] hover:bg-[#88C300]/10"
                  }`}
                  onClick={toggleMobileMenu}
                  title="Contact Us - Globeflight Kenya"
                >
                  Contact Us
                </Link>
              </motion.li>

              {/* Track */}
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.06 }}
              >
                <Link
                  to="/track"
                  className={`block px-4 py-3 rounded-lg transition-all duration-300 font-semibold text-base ${
                    pathname === "/track" 
                      ? "bg-[#88C300] text-white shadow-md" 
                      : "text-gray-700 hover:text-[#88C300] hover:bg-[#88C300]/10"
                  }`}
                  onClick={toggleMobileMenu}
                  title="Track Your Shipment - Globeflight Kenya"
                >
                  Track
                </Link>
              </motion.li>
            </ul>

            {/* Get Quote Button - Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <Button
                asChild
                className="w-full bg-[#88C300] hover:bg-[#6ea000] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg py-6 font-semibold text-base"
              >
                <Link to="/contact-us" onClick={toggleMobileMenu} title="Get a Quote - Globeflight Kenya">
                  <span className="flex items-center justify-center gap-2">
                    Get Quote
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Link>
              </Button>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="mt-6 pt-6 border-t border-gray-200 space-y-3"
            >
              <a
                href="mailto:cs@globeflight.co.ke"
                className="flex items-center text-sm text-gray-700 hover:text-[#88C300] transition-all duration-300 bg-gray-50 hover:bg-[#88C300]/10 p-3 rounded-lg"
              >
                <Mail className="w-5 h-5 mr-3 text-[#88C300] flex-shrink-0" />
                <span className="font-medium">cs@globeflight.co.ke</span>
              </a>
              
              <button
                onClick={() => {
                  handlePhoneClick('+254729341277');
                  toggleMobileMenu();
                }}
                className="flex items-center text-sm text-gray-700 hover:text-[#88C300] transition-all duration-300 w-full text-left bg-gray-50 hover:bg-[#88C300]/10 p-3 rounded-lg"
              >
                <Phone className="w-5 h-5 mr-3 text-[#88C300] flex-shrink-0" />
                <span className="font-medium">+254 729 341 277</span>
              </button>
              
              <div className="flex items-start text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                <MapPin className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-[#88C300]" />
                <span className="font-medium">NEXTGEN MALL, 3rd Floor, Suite 39/40, Mombasa Road</span>
              </div>
            </motion.div>

            {/* Platform Links */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Our Platforms</p>
              
              <motion.a
                href="https://globeflight.thinksynergyltd.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WMS Client Login - Globeflight Kenya"
                title="WMS Client Login"
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-900 text-white font-semibold shadow-md hover:shadow-lg hover:bg-gray-800 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>WMS Login</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5m0 0l-5-5m5 5H3" />
                </svg>
              </motion.a>
              
              <motion.a
                href="https://bigdrop.co.ke/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bigdrop Ecommerce Platform by Globeflight"
                title="Bigdrop Ecommerce Platform"
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-900 text-white font-semibold shadow-md hover:shadow-lg hover:bg-gray-800 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Bigdrop</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h15l-1.5 9h-13L4 6zm0 0V4a2 2 0 012-2h2a2 2 0 012 2v2" />
                </svg>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)

export default NavbarMobileMenu