import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, VolumeX, ChevronDown, ArrowRight, Play, CheckCircle } from "lucide-react"
import { Link } from "react-router-dom"

const Hero = () => {
  const [isMuted, setIsMuted] = useState(true)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [activeService, setActiveService] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef(null)

  const services = [
    {
      title: "Air Freight",
      description: "Lightning-fast air cargo solutions across continents",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Sea Freight",
      description: "Cost-effective ocean transportation worldwide",
      color: "from-teal-500 to-teal-600",
    },
    {
      title: "Warehousing",
      description: "State-of-the-art storage facilities",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "E-commerce",
      description: "Seamless fulfillment for online businesses",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Importer of Records",
      description: "Full compliance and representation for your import needs",
      color: "from-blue-600 to-blue-700",
    },
  ]

  {/*const trustIndicators = [
    { value: "175+", label: "Countries" },
    { value: "25K+", label: "Monthly Shipments" },
    { value: "99.2%", label: "Success Rate" },
  ]*/}

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)

    if (video.paused) {
      setIsPlaying(false)
    }

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [isVideoLoaded])

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  return (
    <section 
      style={{
        position: 'relative',
        width: '100vw',
        minHeight: '100vh',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        overflow: 'hidden',
        background: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)'
      }}
    >
      {/* Animated Background Blobs */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
        <div 
          style={{
            position: 'absolute',
            top: '-8rem',
            left: '-8rem',
            width: '40vw',
            height: '40vw',
            backgroundColor: '#88C300',
            borderRadius: '9999px',
            filter: 'blur(96px)',
            animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '-8rem',
            right: '-8rem',
            width: '40vw',
            height: '40vw',
            backgroundColor: '#3b82f6',
            borderRadius: '9999px',
            filter: 'blur(96px)',
            animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: '2s'
          }}
        />
      </div>

      {/* Video Background */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {!isVideoLoaded && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(to bottom right, #064e3b, #1e40af)'
            }}
          >
            <div
              style={{
                width: '5rem',
                height: '5rem',
                border: '4px solid #88C300',
                borderTopColor: 'transparent',
                borderRadius: '9999px',
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isVideoLoaded ? 0.5 : 0,
            transition: 'opacity 1s'
          }}
          poster="/herolanding.jpg"
        >
          <source src="/herovid.mp4" type="video/mp4" />
          <source src="/video1.mp4" type="video/mp4" />
        </video>
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.95))'
          }}
        />

        {!isPlaying && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              cursor: 'pointer'
            }}
            onClick={togglePlayPause}
          >
            <button 
              style={{
                padding: '1rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)'
              }}
              className="hover:bg-white/30 transition-colors"
            >
              <Play className="w-12 h-12 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20"
        style={{ minHeight: '100vh' }}
      >
        <div className="w-full max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-4 sm:mb-6 md:mb-8"
          >
            {/*<div
              className="inline-flex items-center px-6 py-3 rounded-full border"
              style={{
                background: 'rgba(136, 195, 0, 0.15)',
                backdropFilter: 'blur(12px)',
                borderColor: 'rgba(136, 195, 0, 0.3)',
                boxShadow: '0 8px 32px rgba(136, 195, 0, 0.15)'
              }}
            >
              <CheckCircle className="w-5 h-5 mr-2" style={{ color: '#88C300' }} />
              <span className="text-sm font-semibold tracking-wide" style={{ color: '#88C300' }}>
                TRUSTED BY 5,000+ BUSINESSES WORLDWIDE
              </span>
            </div>*/}
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-center mb-4 sm:mb-6 leading-tight px-2"
          >
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(to right, #88C300, #6b9a00)' }}
            >
              LOGISTICS
            </span>
            <br />
            <span className="text-white drop-shadow-2xl">24.SEVEN.365</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-center mb-8 sm:mb-10 md:mb-12 text-gray-200 max-w-3xl mx-auto px-4"
          >
            Revolutionizing supply chain excellence across East Africa and beyond
          </motion.p>

          {/* Trust Indicators 
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-8 mb-16"
          >
            {trustIndicators.map((item, index) => (
              <div 
                key={index}
                className="text-center"
                style={{
                  padding: '1.5rem 2rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <div className="text-4xl font-bold mb-2" style={{ color: '#88C300' }}>
                  {item.value}
                </div>
                <div className="text-sm text-gray-300 font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </motion.div>*/}

          {/* Service Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 px-2"
          >
            <div className="relative h-auto min-h-[160px] sm:min-h-[140px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeService}
                  initial={{ opacity: 0, x: 100, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -100, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <div
                    className="p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(16px)',
                      borderColor: 'rgba(136, 195, 0, 0.3)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                          {services[activeService].title}
                        </h3>
                        <p className="text-gray-300 text-sm sm:text-base md:text-lg">
                          {services[activeService].description}
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-white/50 flex-shrink-0 sm:ml-4 self-end sm:self-center" />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Service Indicators */}
            <div className="flex justify-center mt-4 sm:mt-6 gap-1.5 sm:gap-2">
              {services.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveService(index)}
                  className="h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  style={{
                    width: index === activeService ? '2rem' : '0.5rem',
                    backgroundColor: index === activeService ? '#88C300' : 'rgba(255, 255, 255, 0.3)'
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons 
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/contact-us">
              <button 
                className="px-10 py-5 font-bold text-white rounded-xl transition-all hover:scale-105 shadow-2xl text-lg group"
                style={{
                  background: 'linear-gradient(to right, #88C300, #6b9a00)',
                  boxShadow: '0 10px 40px rgba(136, 195, 0, 0.3)'
                }}
              >
                <span className="flex items-center">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </Link>
            <Link to="/services">
              <button 
                className="px-10 py-5 font-bold text-white rounded-xl transition-all hover:scale-105 border-2 text-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }}
              >
                Explore Services
              </button>
            </Link>
          </motion.div>*/}
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 hidden sm:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center cursor-pointer group"
          >
            <span className="mb-2 text-xs sm:text-sm text-gray-400 group-hover:text-white transition-colors">
              Scroll to explore
            </span>
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-white transition-colors" />
          </motion.div>
        </motion.div>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="absolute top-20 sm:top-24 left-3 sm:left-4 md:left-8 p-2 sm:p-3 rounded-full transition-all border hover:scale-110"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.15;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  )
}

export default Hero