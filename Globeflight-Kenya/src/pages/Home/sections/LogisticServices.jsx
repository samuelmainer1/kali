import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Plane, Ship, Warehouse, FileCheck, ShoppingCart, Package, Globe, Clock,
  ArrowRight, FileText, Truck, MapPin, BarChart3, Shield, Zap
} from "lucide-react"
import { Link, useLocation } from "react-router-dom";

const LogisticServices = () => {
  const [activeService, setActiveService] = useState("air-freight")
  const [hoveredService, setHoveredService] = useState(null)
  const [activeCategory, setActiveCategory] = useState("all")
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const services = [
    {
      id: "air-freight",
      icon: Plane,
      title: "Air Freight",
      category: "freight",
      color: "from-blue-500 to-cyan-500",
      features: ["Express Delivery", "Global Network", "Real-time Tracking"],
      description: "Lightning-fast air cargo solutions with guaranteed delivery times across 150+ destinations worldwide.",
      stats: { speed: "1-3 Days", coverage: "Global", reliability: "99.8%" }
    },
    {
      id: "sea-freight",
      icon: Ship,
      title: "Ocean Freight",
      category: "freight",
      color: "from-teal-500 to-blue-500",
      features: ["Cost-Effective", "Bulk Cargo", "FCL & LCL"],
      description: "Economical ocean transportation for large shipments with flexible container options.",
      stats: { speed: "15-45 Days", coverage: "Worldwide", capacity: "Unlimited" }
    },
    {
      id: "warehouse",
      icon: Warehouse,
      title: "Smart Warehousing",
      category: "logistics",
      color: "from-purple-500 to-pink-500",
      features: ["24/7 Security", "Climate Control", "Inventory Management"],
      description: "State-of-the-art storage facilities with tech driven inventory management systems.",
      stats: { locations: "2+", space: "500 sq ft", technology: "WMS" }
    },
    {
      id: "customs",
      icon: FileCheck,
      title: "Customs Clearance",
      category: "compliance",
      color: "from-green-500 to-emerald-500",
      features: ["Expert Brokers", "Fast Processing", "Compliance"],
      description: "Seamless customs clearance with dedicated experts ensuring regulatory compliance.",
      stats: { clearance: "24-48h", success: "100%", countries: "50+" }
    },
    {
      id: "ecommerce",
      icon: ShoppingCart,
      title: "E-commerce Fulfillment",
      category: "digital",
      color: "from-orange-500 to-red-500",
      features: ["Order Management", "Last-Mile Delivery", "Returns"],
      description: "End-to-end e-commerce solutions from storage to doorstep delivery.",
      stats: { orders: "10K+ Daily", accuracy: "99.9%", integration: "All Platforms" }
    },
    {
      id: "road-transport",
      icon: Truck,
      title: "Road Transport",
      category: "freight",
      color: "from-amber-500 to-orange-500",
      features: ["Door-to-Door", " Tracking System", "Flexible Routes"],
      description: "Reliable road transportation across East Africa with real-time visibility.",
      stats: { fleet: "200+ Trucks", coverage: "East Africa", tracking: "Real-time" }
    }
  ]

  const categories = [
    { id: "all", label: "All Services", icon: Globe },
    { id: "freight", label: "Freight", icon: Truck },
    { id: "logistics", label: "Logistics", icon: Warehouse },
    { id: "compliance", label: "Compliance", icon: Shield },
    { id: "digital", label: "Digital", icon: Zap }
  ]

  const filteredServices = activeCategory === "all" 
    ? services 
    : services.filter(s => s.category === activeCategory)

  const activeServiceData = services.find(s => s.id === activeService) || services[0]

  return (
    <section ref={ref} className="relative py-24 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div
           className="absolute inset-0 opacity-50" 
                style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239CA3AF' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}>
          
        </div>

        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-green-200 to-blue-200 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center px-6 py-2 mb-4 space-x-2 rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10"
          >
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">COMPREHENSIVE SOLUTIONS</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl"
          >
            <span className="text-transparent bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text">
              Shipping Services
            </span>
            <br />
            <span className="text-gray-900">That Drive Success</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto text-lg text-gray-600"
          >
            Experience the future of logistics with our cutting-edge solutions designed for modern businesses
          </motion.p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`group flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* Services Grid */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onHoverStart={() => setHoveredService(service.id)}
                  onHoverEnd={() => setHoveredService(null)}
                  onClick={() => setActiveService(service.id)}
                  className={`cursor-pointer group relative overflow-hidden rounded-2xl transition-all ${
                    activeService === service.id
                      ? "ring-2 ring-offset-2 ring-green-500 shadow-xl"
                      : "shadow-lg hover:shadow-2xl"
                  }`}
                >
                  <div className={`p-6 bg-white ${
                    activeService === service.id ? "bg-gradient-to-br from-green-50 to-blue-50" : ""
                  }`}>
                    {/* Icon with gradient background */}
                    <motion.div
                      animate={hoveredService === service.id ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <service.icon className="text-white h-7 w-7" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="mb-2 text-lg font-bold text-gray-900">{service.title}</h3>
                    
                    {/* Features Pills */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {service.features.slice(0, 2).map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Active Indicator */}
                    <motion.div
                      className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${service.color}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: activeService === service.id ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ originX: 0 }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Active Service Details */}
          <motion.div
            key={activeService}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="sticky top-24"
          >
            <div className="overflow-hidden bg-white shadow-2xl rounded-3xl">
              {/* Header with gradient */}
              <div className={`relative h-48 bg-gradient-to-br ${activeServiceData.color} p-8`}>
                <div className="absolute inset-0 bg-black/10" />
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                >
                  <activeServiceData.icon className="w-16 h-16 mb-4 text-white" />
                  <h3 className="text-3xl font-bold text-white">{activeServiceData.title}</h3>
                </motion.div>
                
                {/* Floating particles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-20 h-20 rounded-full bg-white/10"
                    style={{
                      top: `${20 + i * 30}%`,
                      right: `${10 + i * 20}%`,
                    }}
                    animate={{
                      y: [-10, 10, -10],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3 + i,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="p-8">
                <p className="mb-6 leading-relaxed text-gray-600">
                  {activeServiceData.description}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {Object.entries(activeServiceData.stats).map(([key, value]) => (
                    <div key={key} className="p-4 text-center bg-gray-50 rounded-xl">
                      <p className="mb-1 text-sm text-gray-600 capitalize">{key}</p>
                      <p className="text-lg font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Features List */}
                <div className="mb-8 space-y-3">
                  {activeServiceData.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeServiceData.color} flex items-center justify-center`}>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button className="flex-1 px-6 py-3 font-semibold text-white transition-all bg-gradient-to-r from-green-500 to-blue-600 rounded-xl hover:shadow-lg hover:scale-105">
                    <Link to ="/contact-us" className="flex items-center justify-center">
                    Get Quote
                    </Link>
                  </button>
                  <button className="flex-1 px-6 py-3 font-semibold text-gray-700 transition-all border-2 border-gray-200 rounded-xl hover:bg-gray-50">
                    <Link to="/services" className="flex items-center justify-center">
                       
                    Learn More
                     </Link>
                  </button>
                 
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default LogisticServices