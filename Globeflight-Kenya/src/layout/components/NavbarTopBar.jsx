import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Mail, Phone, MapPin } from "lucide-react"

const NavbarTopBar = ({ showTopBar, handlePhoneClick }) => (
  <AnimatePresence>
    {showTopBar && (
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative overflow-hidden bg-[#88C300]"
      >
        <div className="relative px-4 py-3 text-white">
          <div className="container flex flex-col sm:flex-row items-center justify-between mx-auto text-sm">
            {/* Contact info - responsive layout */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
              {/* Email */}
              <a 
                href="mailto:cs@globeflight.co.ke" 
                className="flex items-center group transition-all duration-300 hover:text-white/80"
              >
                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">
                  cs@globeflight.co.ke
                </span>
              </a>
              {/* Phone */}
              <button 
                onClick={() => handlePhoneClick('+254729341277')}
                className="flex items-center group transition-all duration-300 hover:text-white/80"
              >
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">
                  +254 729 341 277
                </span>
              </button>
            </div>
            {/* Address - hidden on very small screens */}
            <div className="flex items-center mt-2 sm:mt-0">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-white/95 text-xs sm:text-sm font-medium hidden xs:block">
                NEXTGEN MALL, 3rd Floor, Suite 39/40, Mombasa Road
              </span>
              <span className="text-white/95 text-xs sm:text-sm font-medium xs:hidden">
                Mombasa Road, Nairobi
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

export default NavbarTopBar