import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { CheckCircle, ArrowRight, Building2, Laptop, Users, Wallet, TrendingUp, Shield, Globe, Clock } from "lucide-react"
import { Link, useLocation } from "react-router-dom";

const WhyChooseUs = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hoveredCard, setHoveredCard] = useState(null)

  const stats = [
    { value: "25+", label: "Years Experience", icon: Clock },
    { value: "50K+", label: "Deliveries", icon: TrendingUp },
    { value: "175+", label: "Global Partners", icon: Globe },
    { value: "99.9%", label: "Success Rate", icon: Shield },
  ]

  const features = [
    {
      icon: Building2,
      title: "Enterprise Solutions",
      desc: "Tailored logistics solutions for businesses of all sizes with cutting-edge technology",
      gradient: "from-blue-500 to-purple-600",
      delay: 0,
    },
    {
      icon: Laptop,
      title: "Digital Integration",
      desc: "Real-time tracking and seamless API integration with your existing systems",
      gradient: "from-purple-500 to-pink-600",
      delay: 0.1,
    },
    {
      icon: Users,
      title: "Expert Team",
      desc: "Dedicated professionals providing 24/7 support and strategic guidance",
      gradient: "from-pink-500 to-red-600",
      delay: 0.2,
    },
    {
      icon: Wallet,
      title: "Competitive Pricing",
      desc: "Transparent pricing with no hidden fees and flexible payment options",
      gradient: "from-orange-500 to-yellow-600",
      delay: 0.3,
    },
  ]

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute rounded-full -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-green-400 to-blue-500 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute rounded-full -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-500 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-6 mb-20 md:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="p-6 transition-all border border-gray-100 shadow-lg bg-white/80 backdrop-blur-md rounded-2xl hover:shadow-2xl"
            >
              <stat.icon className="w-8 h-8 mb-3 text-green-500" />
              <h3 className="text-3xl font-bold text-transparent bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text">
                {stat.value}
              </h3>
              <p className="mt-1 text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid items-center gap-16 lg:grid-cols-2" ref={ref}>
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 space-x-2 rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">WHY CHOOSE US</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold leading-tight md:text-5xl"
              >
                <span className="text-gray-900">Transforming </span>
                <span className="text-transparent bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text">
                  Logistics Excellence
                </span>
                <br />
                <span className="text-gray-900">Across East Africa</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-lg leading-relaxed text-gray-600"
              >
                Experience unparalleled logistics solutions powered by cutting-edge technology, 
                decades of expertise, and a commitment to excellence that sets new industry standards.
              </motion.p>
            </div>

            {/* Features List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {["Real-time shipment tracking", "ISO certified processes", "Global network coverage", "Sustainable practices"].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 transition-colors group-hover:text-gray-900">{item}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 }}
            >
              <button className="relative px-8 py-4 overflow-hidden font-semibold text-white transition-all shadow-lg group bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:scale-105 hover:shadow-2xl">
              
                <span className="relative z-10 flex items-center">
                  <Link to="/contact-us" className="text-white">
                  Get Free Consultation
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </span>
                
                <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-r from-green-600 to-blue-700 group-hover:opacity-100" />
                
              </button>
            </motion.div>
          </motion.div>

          {/* Right Content - Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <AnimatePresence>
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ delay: feature.delay, duration: 0.5 }}
                  onHoverStart={() => setHoveredCard(idx)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="relative group"
                >
                  <div className="relative h-full p-6 overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl">
                    {/* Gradient Background on Hover */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                    />
                    
                    {/* Icon */}
                    <motion.div
                      animate={hoveredCard === idx ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <feature.icon className="text-white h-7 w-7" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="leading-relaxed text-gray-600">{feature.desc}</p>

                    {/* Hover Effect Arrow */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={hoveredCard === idx ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                      className="absolute bottom-6 right-6"
                    >
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs