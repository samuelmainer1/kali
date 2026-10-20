import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, X } from 'lucide-react'

const Hero = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  return (
    <section className="relative w-screen left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] h-screen flex items-center justify-center overflow-hidden">
      
      {/* Video Background - Full Edge to Edge */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src="/Video44.mp4" type="video/mp4" />
          <img src="/globe1.jpg" alt="Globeflight Logistics" className="object-cover w-full h-full" />
        </video>

        {/* Gradient Overlays with Brand Color */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/75 via-black/50 to-black/75" />
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-black/60 via-transparent to-black/40" />
        
        {/* Animated Brand Color Accent */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 w-full h-full"
          style={{ background: 'linear-gradient(135deg, rgba(136, 195, 0, 0.1) 0%, transparent 50%, rgba(136, 195, 0, 0.05) 100%)' }}
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto text-center">

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2"
          >
            {/*<span className="block mb-3">About</span>*/}
            <span
              className="block text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(to right, #88C300, #a8e030, #88C300)' }}
            >
              Globeflight Worldwide Express
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-3xl mx-auto mb-8 sm:mb-10 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-light leading-relaxed text-gray-200 px-4"
          >
            Your trusted partner in logistics and supply chain solutions across East Africa and beyond.
            <span className="block mt-2 sm:mt-3 font-medium" style={{ color: '#88C300' }}>
              Connecting businesses, delivering excellence.
            </span>
          </motion.p>

          {/* Play Video Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center px-4"
          >
            <Button
              onClick={() => setIsVideoPlaying(true)}
              size="lg"
              className="bg-white/10 backdrop-blur-xl border-2 border-white/30 hover:bg-white/20 text-white px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-7 text-sm sm:text-base md:text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group w-full sm:w-auto max-w-xs sm:max-w-none"
              style={{
                '--hover-color': '#88C300',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#88C300'
                e.currentTarget.style.backgroundColor = 'rgba(136, 195, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Watch Our Story
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 rounded-full mt-2"
            style={{ backgroundColor: '#88C300' }}
          />
        </motion.div>
      </motion.div>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
            onClick={() => setIsVideoPlaying(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-6xl mx-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsVideoPlaying(false)}
                className="absolute -top-16 right-0 p-3 text-white transition-all duration-300 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20"
                style={{
                  '--hover-color': '#88C300',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(136, 195, 0, 0.2)'
                  e.currentTarget.style.color = '#88C300'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.color = 'white'
                }}
                aria-label="Close video"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Video Player */}
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <video
                  autoPlay
                  controls
                  className="w-full h-full"
                  src="/Video44.mp4"
                >
                  <source src="/Video44.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default Hero