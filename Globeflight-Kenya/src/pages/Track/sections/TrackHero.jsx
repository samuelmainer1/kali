import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Phone, Globe, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TrackHero({ trackingNumber, setTrackingNumber, handleTrack, loading }) {
  return (
    <section
      className="relative w-screen mt-16 min-h-[70vh] mt-12 overflow-hidden"
      style={{
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        width: '100vw',
        background: '#0a0f1e'
      }}
    >
      {/* Animated Background Image */}
      <motion.div
        initial={{ scale: 1, opacity: 0.75 }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.75, 0.9, 0.75]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/track.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
        }}
      />

      {/* Gradient Overlay for Better Text Visibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.3) 30%, rgba(15, 23, 42, 0.7) 100%)'
        }}
      />

      {/* Animated Gradient Orbs */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.2, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: '35rem',
            height: '35rem',
            backgroundColor: '#3b82f6',
            borderRadius: '9999px',
            filter: 'blur(120px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '20%',
            width: '40rem',
            height: '40rem',
            backgroundColor: '#88C300',
            borderRadius: '9999px',
            filter: 'blur(120px)',
          }}
        />
      </div>

      {/* Content - Full Width */}
      <div className="relative z-10 w-full px-4 mt-16 sm:px-6 md:px-8 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 sm:mb-8 text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white px-2"
            style={{
              textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
              letterSpacing: '-0.02em'
            }}
          >
            Track Your Shipment
          </motion.h1>

          {/* Search Form with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="px-2"
          >
            <div
              className="max-w-3xl mx-auto rounded-2xl p-6 sm:p-8 md:p-10"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
            >
              <form onSubmit={handleTrack}>
                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
                  <div className="relative flex-grow">
                    <Input
                      type="text"
                      placeholder="Enter your tracking number(s)"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="h-14 sm:h-16 px-4 sm:px-6 text-base sm:text-lg border-2 border-gray-300 focus:border-[#88C300] focus:ring-2 focus:ring-[#88C300] rounded-lg"
                      style={{
                        fontSize: '16px',
                        fontWeight: '400'
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-bold text-white rounded-lg shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                    style={{
                      backgroundColor: '#d40511',
                      fontSize: '16px',
                      fontWeight: '700'
                    }}
                    disabled={loading || !trackingNumber}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Tracking...
                      </span>
                    ) : (
                      'Track'
                    )}
                  </Button>
                </div>
              </form>

                {/* Quick Stats with Glassmorphism */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10"
                >
                  {/* 24/7 Support - Clickable WhatsApp Card */}
                  <motion.a
                    href="https://wa.me/254729341277"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contact 24/7 support on WhatsApp"
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl cursor-pointer transition-all"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(136, 195, 0, 0.3)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-[#88C300] mb-3" />
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">24/7</div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">Support Available</div>
                  </motion.a>

                  {/* Countries Served */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(136, 195, 0, 0.3)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-[#88C300] mb-3" />
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">200+</div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">Countries Served</div>
                  </motion.div>

                  {/* Delivery Success */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(136, 195, 0, 0.3)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#88C300] mb-3" />
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">99.9%</div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">Delivery Success</div>
                  </motion.div>
                </motion.div>
              </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}