"use client"

import { useState, useEffect } from "react"
import { 
  ChevronUp, 
  X, 
  Phone, 
  Mail
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import whatsapp from "@/assets/whatsapp.svg"

const ScrollOnSideSection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waName, setWaName] = useState("");
  const [waMessage, setWaMessage] = useState("");

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility)

    return () => {
      window.removeEventListener("scroll", toggleVisibility)
    }
  }, [])

  const contactMethods = [
    {
      id: 'whatsapp',
      icon: null,
      label: 'WhatsApp',
      href: 'https://wa.me/254729341277',
      color: 'bg-[#25D366]',
      hoverColor: 'hover:bg-[#128C7E]',
      description: 'Instant chat support'
    },
    {
      id: 'phone',
      icon: Phone,
      label: 'Call Us',
      href: 'tel:+254729341277',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      description: 'Direct phone support'
    },
    {
      id: 'email',
      icon: Mail,
      label: 'Email',
      href: 'mailto:cs@globeflight.co.ke',
      color: 'bg-[#88C300]',
      hoverColor: 'hover:bg-[#6ea000]',
      description: 'Email support'
    }
  ]

  // WhatsApp form submit handler
  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const base = "https://wa.me/254729341277";
    const text = encodeURIComponent(
      `Hi, my name is ${waName || "[Your Name]"}. ${waMessage}`
    );
    window.open(`${base}?text=${text}`, "_blank");
    setShowWhatsAppModal(false);
    setWaName("");
    setWaMessage("");
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9990] flex flex-col items-start space-y-4">
      {/* WhatsApp Modal */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-20 left-0 z-[9999] w-[90vw] max-w-sm md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              aria-label="Close WhatsApp form"
            >
              <X size={18} className="text-gray-600" />
            </button>
            
            <div className="flex flex-col items-center mb-4">
              <img src={whatsapp} alt="" className="mb-3 h-12 w-12" />
              <h3 className="font-bold text-lg text-gray-900 mb-1">Chat with us on WhatsApp</h3>
              <p className="text-gray-600 text-sm text-center">Fill in your details and we'll respond instantly!</p>
            </div>
            
            <form onSubmit={handleWhatsAppSubmit} className="flex flex-col gap-4 mt-2">
              <input
                type="text"
                placeholder="Your Name"
                className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                value={waName}
                onChange={e => setWaName(e.target.value)}
                required
              />
              <textarea
                placeholder="Type your message..."
                className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent min-h-[100px] resize-none"
                value={waMessage}
                onChange={e => setWaMessage(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[#25D366] text-white font-semibold shadow-md hover:bg-[#128C7E] transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <img src={whatsapp} alt="" className="h-5 w-5" /> Send via WhatsApp
                </span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp FAB */}
      <div className="relative">
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="relative"
        >
          {/* Pulsing Background */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.05, 0.2]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 bg-[#25D366] rounded-full blur-sm"
          />

          {/* Main Button */}
          <button 
            className="relative cursor-pointer" 
            onClick={() => setShowWhatsAppModal(true)}
            aria-label="Open WhatsApp chat"
          >
            <img src={whatsapp} alt="" className="h-16 w-16 rounded-full shadow-xl" />
          </button>
        </motion.div>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={scrollToTop}
            className="group relative p-4 rounded-full bg-white shadow-xl hover:shadow-2xl border border-gray-200 transition-all duration-300"
            aria-label="Back to Top"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Icon */}
            <ChevronUp className="text-gray-700 group-hover:text-[#88C300] w-6 h-6 transition-colors duration-300" />

            {/* Hover Label - Hidden on small devices */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden md:block">
              Back to top
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Contact Tabs (Optional - shows on hover) - Hidden on small devices */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-full ml-3 top-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 hidden lg:block"
          >
            <div className="flex flex-col space-y-2">
              {contactMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => {
                    if (method.id === 'whatsapp') {
                      window.open(method.href, '_blank');
                    } else {
                      window.location.href = method.href;
                    }
                  }}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    activeTab === method.id 
                      ? `${method.color} text-white shadow-lg` 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                  }`}
                  onMouseEnter={() => setActiveTab(method.id)}
                  aria-label={method.label}
                >
                  {method.id === 'whatsapp' ? (
                    <img src={whatsapp} alt="" className="h-5 w-5" />
                  ) : (
                    <method.icon className="h-5 w-5" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ScrollOnSideSection