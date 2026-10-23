import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import {
  FileText, Building2, Shield, Clock, Users,
  CheckCircle, ArrowRight, ChevronDown, Volume2, VolumeX,
  Truck, Award, TrendingUp, Scale, PackageSearch
} from "lucide-react"
import { Link } from "react-router-dom"
import Container from '@/components/Container'
import { Helmet } from 'react-helmet-async'
import ScrollOnSideSection from '@/components/ScrollOnSideSection'
import LatestArticles from '@/components/LatestArticles'
import Testimonials from '@/components/Testimonials'
import Clients from '../Home/sections/Clients'

const Landing = () => {
  const [isMuted, setIsMuted] = useState(true)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
      console.log('Mute toggled:', newMutedState)
    } else {
      console.log('Video ref not available')
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setIsVideoLoaded(true)
      video.muted = isMuted
      video.play().catch(err => console.log("Autoplay prevented:", err))
    }

    video.addEventListener('loadeddata', handleLoadedData)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [isMuted])

  const iorBenefits = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Speedy Clearance",
      description: "Achieve customs processing through our local expertise and pre-approvals",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Full Compliance",
      description: "We handle KRA declarations, KEBS certifications, and new 2025 COO requirements",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: "Risk Mitigation",
      description: "Assume all liability, including audits and inspections, protecting your business",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Scalability",
      description: "Ideal for SMEs and enterprises in tech, e-commerce, and manufacturing expanding into Africa",
      color: "from-orange-500 to-red-500"
    }
  ]

  const processSteps = [
    {
      step: "01",
      title: "Consultation",
      description: "Assess your shipment needs and provide a custom quote",
      icon: <Users className="w-8 h-8" />
    },
    {
      step: "02", 
      title: "Documentation Prep",
      description: "Gather and verify invoices, packing lists, AWBs, CoCs, and COOs",
      icon: <FileText className="w-8 h-8" />
    },
    {
      step: "03",
      title: "Customs Filing", 
      description: "Submit entries to KRA/KEBS; pay duties/taxes on your behalf",
      icon: <Building2 className="w-8 h-8" />
    },
    {
      step: "04",
      title: "Clearance & Delivery",
      description: "Coordinate inspections; ensure goods reach you",
      icon: <Truck className="w-8 h-8" />
    }
  ]

  const idealClients = [
    "Multinationals shipping IT equipment, telecom devices, or pharmaceuticals",
    "E-commerce brands entering African markets", 
    "Tech companies handling data centre hardware",
    "Government and NGO projects requiring compliant import processes"
  ]

  return (
    <>
      <Helmet>
        <title>Importer of Record (IOR) Services Kenya | Globeflight Worldwide Express</title>
        <meta name="description" content="Professional Importer of Record (IOR) services in Kenya. Expert customs clearance, KRA compliance, and import documentation. Trusted by multinationals and tech companies across Africa." />
        <meta name="keywords" content="Importer of Record, IOR services, Kenya customs clearance, KRA compliance, import documentation, African import services, customs broker Kenya, import compliance" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://globeflight.co.ke/" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://globeflight.co.ke/" />
        <meta property="og:title" content="Importer of Record (IOR) Services Kenya | Globeflight Worldwide Express" />
        <meta property="og:description" content="Professional Importer of Record (IOR) services in Kenya. Expert customs clearance, KRA compliance, and import documentation. Trusted by multinationals and tech companies across Africa." />
        <meta property="og:image" content="https://globeflight.co.ke/logo-og.png" />
        
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://globeflight.co.ke/" />
        <meta property="twitter:title" content="Importer of Record (IOR) Services Kenya | Globeflight Worldwide Express" />
        <meta property="twitter:description" content="Professional Importer of Record (IOR) services in Kenya. Expert customs clearance, KRA compliance, and import documentation. Trusted by multinationals and tech companies across Africa." />
        <meta property="twitter:image" content="https://globeflight.co.ke/logo-og.png" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Globeflight Worldwide Express Limited",
            "url": "https://globeflight.co.ke",
            "logo": "https://globeflight.co.ke/logo.png",
            "description": "Professional Importer of Record (IOR) services in Kenya. Expert customs clearance, KRA compliance, and import documentation.",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "KE",
              "addressLocality": "Nairobi"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+254-XXX-XXXXXX",
              "contactType": "customer service"
            },
            "sameAs": [
              "https://www.facebook.com/globeflightkenya",
              "https://x.com/globeflight_ke",
              "https://www.linkedin.com/company/globeflight-kenya",
              "https://www.youtube.com/@globeflightkenya"
            ],
            "service": {
              "@type": "Service",
              "name": "Importer of Record (IOR) Services",
              "description": "Professional customs clearance and import compliance services for international companies importing goods into Kenya and Africa.",
              "provider": {
                "@type": "Organization",
                "name": "Globeflight Worldwide Express Limited"
              }
            }
          })}
        </script>
      </Helmet>

      <div className="bg-white dark:bg-gray-900">
        {/* Hero Section with Video Background */}
        <section ref={containerRef} className="relative w-full mt-16 h-screen overflow-hidden">
          {/* Video Background - Always Present */}
          <motion.div 
            style={{ y }} 
            className="absolute inset-0 z-0"
          >
            {/* Loading State */}
            {!isVideoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-[#88C300]/20">
                <motion.div
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-20 h-20 border-4 border-[#88C300]/30 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-0 w-20 h-20 border-4 border-t-[#88C300] rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
            )}

            {/* Video Element */}
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-1000 ${
                isVideoLoaded ? "opacity-100" : "opacity-0"
              }`}
              poster="/herolanding.jpg"
            >
              <source src="/herovid.mp4" type="video/mp4" />
              <source src="/video1.mp4" type="video/mp4" />
            </video>

            {/* Gradient Overlays for Better Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#88C300]/30 via-transparent to-blue-900/30" />
          </motion.div>

          {/* Floating TRACK/TRACE Button - Top Right Corner */}
          <Link to="/track">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="fixed top-20 right-4 mt-20 sm:top-24 sm:right-6 md:top-28 md:right-8 z-50 group cursor-pointer"
              title="Track your shipment"
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#88C300] to-blue-500 rounded-2xl blur-xl opacity-60 group-hover:opacity-90 transition-opacity" />

                {/* Button Container */}
                <div className="relative bg-white/95 backdrop-blur-xl border-2 border-white/40 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 hover:bg-white transition-all duration-300 hover:scale-105 cursor-pointer shadow-2xl">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Icon with animated background */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#88C300] to-blue-500 rounded-lg blur-md opacity-50" />
                      <div className="relative p-2 bg-gradient-to-br from-[#88C300] to-blue-600 rounded-lg">
                        <PackageSearch className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>

                    {/* Text */}
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                        TRACK/TRACE
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-600 leading-tight">
                        Your Shipment
                      </span>
                    </div>

                    {/* Arrow Icon */}
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#88C300] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Floating Mute Button - Modern Design - Responsive - Moved Down */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            onClick={toggleMute}
            className="fixed top-36 right-4 mt-16 sm:top-40 sm:right-6 md:top-48 md:right-8 z-50 group cursor-pointer"
            title={isMuted ? "Unmute video" : "Mute video"}
            type="button"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#88C300] to-blue-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative p-3 sm:p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg">
                <AnimatePresence mode="wait">
                  {isMuted ? (
                    <motion.div
                      key="muted"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unmuted"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.button>

          {/* Hero Content */}
          <div className="relative z-10 mt-8 sm:mt-10 md:mt-12 flex flex-col items-center justify-center h-full px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
            <motion.div
              style={{ opacity }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-full max-w-6xl mx-auto text-center"
            >
              {/* Badge
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="inline-flex items-center gap-2 px-6 py-3 mb-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
              >
                <Sparkles className="w-4 h-4 text-[#88C300]" />
                <span className="text-sm font-semibold tracking-wider text-white/90 uppercase">
                  Your Trusted IOR/EOR Partner
                </span>
              </motion.div>*/}

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mb-4 sm:mb-6 px-2"
              >
                <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight mb-3 sm:mb-4">
                  <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#88C300] via-[#a0d626] to-[#b8e34d] animate-gradient">
                    IMPORTER/EXPORTER
                  </span>
                </div>
                <div className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white">
                  OF RECORD
                </div>
                <div className="mt-3 sm:mt-4 text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#88C300]">
                  SERVICES
                </div>
              </motion.h1>

              {/* Subheadline 
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="max-w-4xl mx-auto mb-8 sm:mb-10 md:mb-12 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed text-white/95 font-light px-4"
              >
                Globeflight Worldwide Express Limited is your trusted partner for Importer/Exporter of Record (IOR/EOR) services across Africa.
                With strong logistics presence and deep regulatory expertise, we help international companies legally import/export goods
                into African markets without the need for a local entity.
              </motion.p>*/}

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
              >
                <Link to="/contact-us" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-6 sm:px-8 py-3 sm:py-4 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#88C300] to-[#a0d626] text-white font-semibold text-base sm:text-lg shadow-2xl shadow-[#88C300]/50 w-full sm:w-auto"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Get Started Today
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7ab300] to-[#88C300] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.button>
                </Link>

                <Link to="/home" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 w-full sm:w-auto"
                  >
                    Explore All Services
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center cursor-pointer group"
              >
                <span className="mb-3 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                  Scroll to explore
                </span>
                <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-all">
                  <ChevronDown className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Clients Section */}
        <Clients />

        {/* Testimonials Section */}
        <section className="relative pt-8 pb-12 md:pt-12 md:pb-20 overflow-hidden bg-white dark:bg-gray-900">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#88C300]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

          <Container>
            <div className="relative text-center max-w-3xl mx-auto mb-16">
              {/*<motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
                  What Our{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#88C300] to-blue-600">
                    Clients Say
                  </span>
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#88C300] to-blue-500 mx-auto rounded-full mb-6" />
                <p className="text-xl text-gray-600 dark:text-gray-300 font-light">
                  Trusted by businesses across Africa for seamless import and export solutions
                </p>
              </motion.div>*/}
            </div>

            <div className="relative">
              <Testimonials />
            </div>
          </Container>
        </section>

        {/* What is IOR Section */}
        <section className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-[#88C300]/5 dark:from-gray-900 dark:to-gray-800">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }} 
            />
          </div>

          <Container>
            <div className="relative max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
                  What is an{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#88C300] to-blue-600">
                    IOR/EOR
                  </span>
                  ?
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#88C300] to-blue-500 mx-auto rounded-full mb-8" />
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto font-light">
                  The Importer/Exporter of Record (IOR/EOR) is the entity legally responsible for ensuring imported and exported goods comply with all customs laws, 
                  regulations, and requirements in the destination/origin country.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#88C300] via-blue-500 to-teal-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-gradient-to-br from-[#88C300] to-blue-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Key Role</h3>
                      <p className="text-lg leading-relaxed text-white/95 font-light">
                        The IOR/EOR acts as the primary point of contact for customs, assuming liability for accuracy and compliance. 
                        This is especially critical for IT, telecom, pharma, and high-value goods where specialized knowledge is needed.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* Benefits Section */}
        <section className="py-12 md:py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#88C300]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

          <Container>
            <div className="relative text-center max-w-3xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
                  Why Choose Our{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#88C300] to-blue-600">
                    IOR/EOR Service
                  </span>
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#88C300] to-blue-500 mx-auto rounded-full mb-6" />
                <p className="text-xl text-gray-600 dark:text-gray-300 font-light">
                  Experience seamless import and export operations with our comprehensive solutions
                  Globeflight Worldwide Express Limited is your trusted partner for Importer/Exporter of Record (IOR/EOR) services across Africa.
                  With strong logistics presence and deep regulatory expertise, we help international companies legally import/export goods
                 into African markets without the need for a local entity.
                </p>
              </motion.div>
            </div>

            <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {iorBenefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="group relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                  <div className="relative h-full bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${benefit.color} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500`}>
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-light">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Process Section */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-gray-50 via-slate-50 to-[#88C300]/5 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
          <Container>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
                  Our{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#88C300] to-blue-600">
                    Streamlined Process
                  </span>
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#88C300] to-blue-500 mx-auto rounded-full mb-6" />
                <p className="text-xl text-gray-600 dark:text-gray-300 font-light">
                  A simple 4-step journey to get your goods cleared and delivered
                </p>
              </motion.div>
            </div>

            <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  {/* Step Number */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#88C300] to-blue-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-[#88C300] to-blue-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-xl">
                      {step.step}
                    </div>
                  </div>

                  {/* Card */}
                  <div className="bg-white dark:bg-gray-700 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 dark:border-gray-600">
                    <div className="text-[#88C300] dark:text-[#a0d626] mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center font-light leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Connector Line */}
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#88C300] to-blue-600 opacity-30" />
                  )}
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Ideal Clients Section */}
        <section className="py-12 md:py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
          <Container>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-8">
                  Perfect For{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#88C300] to-blue-600">
                    Your Business
                  </span>
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#88C300] to-blue-500 rounded-full mb-10" />
                
                <div className="space-y-6">
                  {idealClients.map((client, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-4 group"
                    >
                      <div className="flex-shrink-0 mt-1 p-2 bg-gradient-to-br from-[#88C300] to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                        {client}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#88C300] via-blue-500 to-teal-500 rounded-[3rem] blur-2xl opacity-20" />
                <div className="relative bg-gradient-to-br from-[#88C300] to-blue-600 rounded-[3rem] p-10 md:p-12 text-white shadow-2xl">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                        <Award className="w-10 h-10" />
                      </div>
                      <h3 className="text-3xl font-black">Why Choose Us?</h3>
                    </div>
                    
                    <p className="text-lg md:text-xl leading-relaxed text-white/95 font-light">
                      With deep regulatory expertise and strong logistics presence across Africa, 
                      we ensure your imports are compliant, efficient, and cost-effective.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6 pt-6">
                      <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                        <div className="text-5xl font-black mb-2">100%</div>
                        <div className="text-sm font-medium text-white/90 uppercase tracking-wider">Compliance Rate</div>
                      </div>
                      <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                        <div className="text-5xl font-black mb-2">24-48h</div>
                        <div className="text-sm font-medium text-white/90 uppercase tracking-wider">Clearance Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#88C300] via-blue-600 to-teal-700" />
          <div 
            className="absolute inset-0 opacity-10" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
          
          <Container>
            <div className="relative max-w-4xl mx-auto text-center text-white">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                  Ready to Streamline Your
                  <br />
                  <span className="text-[#d4f078]">Imports & Exports?</span>
                </h2>
                
                <div className="w-24 h-1 bg-white/50 mx-auto rounded-full mb-8" />
                
                <p className="text-xl md:text-2xl mb-12 leading-relaxed text-white/95 max-w-3xl mx-auto font-light">
                  Let us handle the complexities of customs clearance while you focus on growing your business. 
                  Get started with our expert IOR services today.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5 justify-center">
                  <Link to="/contact-us">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="group px-10 py-5 bg-white text-[#88C300] rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300"
                    >
                      <span className="flex items-center gap-2">
                        Get Your Quote Today
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </motion.button>
                  </Link>
                  
                  <Link to="/home">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300"
                    >
                      Explore All Services
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </Container>
        </section>
      </div>

      {/* Latest Articles Section */}
      <LatestArticles limit={3} showViewAll={true} />

      {/* WhatsApp & Scroll to Top Widget */}
      <ScrollOnSideSection />

      <style>{`



        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </>
  )
}

export default Landing