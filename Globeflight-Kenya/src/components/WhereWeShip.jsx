"use client"

import { useState, useEffect } from "react"
import { 
  MapPin, 
  Package, 
  Globe, 
  Clock,
  Shield,
  Zap,
  Navigation,
  Truck,
  CheckCircle
} from "lucide-react"
import { Link } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"
import { motion, AnimatePresence } from "framer-motion"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "@/lib/leafletIconFix"

const createCustomIcon = (color, isActive = false) =>
  L.divIcon({
    html: `
      <div style="position: relative;">
        <div style="position:absolute;width:${isActive ? '40px' : '30px'};height:${isActive ? '40px' : '30px'};background:${color};border-radius:50%;border:3px solid white;box-shadow:0 4px 20px rgba(0,0,0,0.3);top:${isActive ? '-20px' : '-15px'};left:${isActive ? '-20px' : '-15px'};display:flex;align-items:center;justify-content:center;transition:all 0.3s ease;z-index:${isActive ? '1000' : '100'};">
          <div style="width:${isActive ? '12px' : '8px'};height:${isActive ? '12px' : '8px'};background:white;border-radius:50%;"></div>
        </div>
        <div style="position:absolute;width:${isActive ? '80px' : '60px'};height:${isActive ? '80px' : '60px'};background:${color};border-radius:50%;opacity:0.3;top:${isActive ? '-40px' : '-30px'};left:${isActive ? '-40px' : '-30px'};animation:pulse 2s infinite;"></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 0.5; }
          50% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(0.5); opacity: 0.5; }
        }
      </style>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -20],
    className: "custom-marker",
  })

const createArrowHead = ([from, to]) => {
  const angle = Math.atan2(to[0] - from[0], to[1] - from[1])
  const arrowSize = 2
  const tipLat = to[0]
  const tipLng = to[1]
  const leftLat = tipLat - arrowSize * Math.cos(angle - Math.PI / 6)
  const leftLng = tipLng - arrowSize * Math.sin(angle - Math.PI / 6)
  const rightLat = tipLat - arrowSize * Math.cos(angle + Math.PI / 6)
  const rightLng = tipLng - arrowSize * Math.sin(angle + Math.PI / 6)

  return [
    [leftLat, leftLng],
    [tipLat, tipLng],
    [rightLat, rightLng],
  ]
}

const connectionLines = [
  { from: [40, -100], to: [54, -3], color: "#88C300", label: "US → UK" },
  { from: [54, -3], to: [24, 54], color: "#3b82f6", label: "UK → UAE" },
  { from: [24, 54], to: [20, 78], color: "#ef4444", label: "UAE → India" },
  { from: [20, 78], to: [1.3, 103.8], color: "#ef4444", label: "India → Singapore" },
  { from: [1.3, 103.8], to: [-27, 133], color: "#06b6d4", label: "Singapore → Australia" },
  { from: [40, -100], to: [-10, -52], color: "#88C300", label: "US → Brazil" },
  { from: [-10, -52], to: [-30, 25], color: "#f59e0b", label: "Brazil → South Africa" },
  { from: [-30, 25], to: [24, 54], color: "#f59e0b", label: "South Africa → UAE" },
  { from: [51, 10], to: [35, 105], color: "#3b82f6", label: "Germany → China" },
  { from: [35, 105], to: [36, 138], color: "#ef4444", label: "China → Japan" },
  { from: [-1, 37], to: [24, 54], color: "#88C300", label: "Kenya → UAE" },
]

const shippingDestinations = [
  { 
    id: "us", 
    name: "United States", 
    coordinates: [40, -100], 
    color: "#88C300",
    flag: "🇺🇸",
    stats: { shipments: "2.5K+", time: "3-5 days", coverage: "98%" }
  },
  { 
    id: "uk", 
    name: "United Kingdom", 
    coordinates: [54, -3], 
    color: "#3b82f6",
    flag: "🇬🇧",
    stats: { shipments: "1.8K+", time: "2-4 days", coverage: "95%" }
  },
  { 
    id: "ae", 
    name: "UAE", 
    coordinates: [24, 54], 
    color: "#ef4444",
    flag: "🇦🇪",
    stats: { shipments: "3.2K+", time: "1-2 days", coverage: "99%" }
  },
  { 
    id: "in", 
    name: "India", 
    coordinates: [20, 78], 
    color: "#ef4444",
    flag: "🇮🇳",
    stats: { shipments: "4.1K+", time: "2-3 days", coverage: "97%" }
  },
  { 
    id: "sg", 
    name: "Singapore", 
    coordinates: [1.3, 103.8], 
    color: "#ef4444",
    flag: "🇸🇬",
    stats: { shipments: "2.9K+", time: "1-2 days", coverage: "99%" }
  },
  { 
    id: "au", 
    name: "Australia", 
    coordinates: [-27, 133], 
    color: "#06b6d4",
    flag: "🇦🇺",
    stats: { shipments: "1.6K+", time: "4-6 days", coverage: "94%" }
  },
  { 
    id: "br", 
    name: "Brazil", 
    coordinates: [-10, -52], 
    color: "#88C300",
    flag: "🇧🇷",
    stats: { shipments: "1.2K+", time: "3-5 days", coverage: "92%" }
  },
  { 
    id: "za", 
    name: "South Africa", 
    coordinates: [-30, 25], 
    color: "#f59e0b",
    flag: "🇿🇦",
    stats: { shipments: "800+", time: "2-4 days", coverage: "90%" }
  },
  { 
    id: "de", 
    name: "Germany", 
    coordinates: [51, 10], 
    color: "#3b82f6",
    flag: "🇩🇪",
    stats: { shipments: "2.1K+", time: "2-3 days", coverage: "96%" }
  },
  { 
    id: "cn", 
    name: "China", 
    coordinates: [35, 105], 
    color: "#ef4444",
    flag: "🇨🇳",
    stats: { shipments: "5.2K+", time: "2-4 days", coverage: "98%" }
  },
  { 
    id: "jp", 
    name: "Japan", 
    coordinates: [36, 138], 
    color: "#ef4444",
    flag: "🇯🇵",
    stats: { shipments: "1.9K+", time: "2-3 days", coverage: "95%" }
  },
  { 
    id: "ke", 
    name: "Kenya", 
    coordinates: [-1, 37], 
    color: "#88C300",
    flag: "🇰🇪",
    stats: { shipments: "6.5K+", time: "Same day", coverage: "100%" }
  },
]

{/*const stats = [
  { icon: Globe, label: "Countries Served", value: "175+", color: "#3b82f6" },
  { icon: Package, label: "Monthly Shipments", value: "25K+", color: "#88C300" },
  { icon: Clock, label: "Avg Delivery Time", value: "2.5 days", color: "#8b5cf6" },
  { icon: Shield, label: "Success Rate", value: "99.2%", color: "#ef4444" },
]*/}

const features = [
  { icon: CheckCircle, title: "Lightning Fast", description: "Express delivery in 24-48 hours" },
  { icon: Shield, title: "Secure & Insured", description: "Full coverage for all shipments" },
  { icon: Navigation, title: "Real-time Tracking", description: "Track your package anywhere" },
  { icon: Truck, title: "Door-to-Door", description: "Complete logistics solution" },
]

export default function WorldShippingMap() {
  const [activeDestination, setActiveDestination] = useState(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setIsMapLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2388C300%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* Header Section */}
      <section className="relative z-10 max-w-7xl px-4 mx-auto pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
         {/*} <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 mb-8 font-bold tracking-wide rounded-full border-2"
            style={{
              backgroundColor: 'rgba(136, 195, 0, 0.1)',
              borderColor: '#88C300',
              color: '#88C300'
            }}
          >
            <Globe className="w-5 h-5" />
            TRUSTED WORLDWIDE
          </motion.div>*/}
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-6"
          >
            Ship Anywhere, Anytime with{" "}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #88C300, #6b9a00)' }}>
              Globeflight Worldwide Express
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            From small parcels to global freight our logistics network ensures fast, secure, and trackable delivery to over 175 countries worldwide.
          </motion.p>
        </motion.div>

        {/* Stats Section 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div 
                  className="p-3 rounded-xl mb-4"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-gray-600">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>*/}

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  selectedFeature === index
                    ? "shadow-2xl scale-105"
                    : "shadow-lg hover:shadow-xl"
                }`}
                style={{
                  background: selectedFeature === index 
                    ? 'linear-gradient(to bottom right, rgba(136, 195, 0, 0.1), white)' 
                    : 'white',
                  borderColor: selectedFeature === index ? '#88C300' : '#e5e7eb'
                }}
                onClick={() => setSelectedFeature(index)}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: selectedFeature === index 
                        ? 'rgba(136, 195, 0, 0.2)' 
                        : 'rgba(156, 163, 175, 0.1)'
                    }}
                  >
                    <feature.icon 
                      className="w-6 h-6" 
                      style={{ color: selectedFeature === index ? '#88C300' : '#6b7280' }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
                {selectedFeature === index && (
                  <motion.div
                    layoutId="activeFeature"
                    className="absolute inset-0 border-2 rounded-2xl pointer-events-none"
                    style={{ borderColor: '#88C300' }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Map Section */}
      <section className="relative z-10 max-w-7xl px-4 mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isMapLoaded ? 1 : 0, scale: isMapLoaded ? 1 : 0.95 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden"
        >
          {/* Map Header */}
          <div 
            className="p-8 text-white"
            style={{
              background: 'linear-gradient(to right, #88C300, #6b9a00)'
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">Global Shipping Network</h3>
                <p className="text-white/90">Interactive map showing our worldwide coverage</p>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: '#88C300' }}
                  ></div>
                  <span className="text-sm font-medium">Active Routes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-sm font-medium">Major Hubs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative h-[500px] md:h-[700px]">
            <MapContainer 
              center={[20, 0]} 
              zoom={2} 
              scrollWheelZoom={false} 
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Shipment Lines + Arrows */}
              {connectionLines.map((line, idx) => (
                <motion.div key={`route-${idx}`}>
                  <Polyline
                    positions={[line.from, line.to]}
                    color={line.color}
                    weight={3}
                    opacity={0.6}
                    dashArray="15, 15"
                  />
                  <Polyline
                    positions={createArrowHead([line.from, line.to])}
                    color={line.color}
                    weight={3}
                    opacity={0.9}
                  />
                </motion.div>
              ))}

              {/* Location Markers */}
              {shippingDestinations.map((loc) => (
                <Marker 
                  key={loc.id} 
                  position={loc.coordinates} 
                  icon={createCustomIcon(loc.color, activeDestination === loc.id)}
                  eventHandlers={{
                    click: () => setActiveDestination(activeDestination === loc.id ? null : loc.id),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-4 min-w-[240px]">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{loc.flag}</span>
                        <h3 className="font-bold text-gray-900 text-lg">{loc.name}</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-600 font-medium">Monthly Shipments:</span>
                          <span className="font-bold" style={{ color: '#88C300' }}>{loc.stats.shipments}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-600 font-medium">Delivery Time:</span>
                          <span className="font-bold text-blue-600">{loc.stats.time}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-600 font-medium">Coverage:</span>
                          <span className="font-bold text-purple-600">{loc.stats.coverage}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div 
              className="absolute top-6 right-6 rounded-2xl p-4 shadow-2xl border-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                borderColor: '#e5e7eb'
              }}
            >
              <div className="text-xs font-bold text-gray-900 mb-3">LEGEND</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#88C300' }}
                  ></div>
                  <span className="text-xs font-medium text-gray-700">Americas / Kenya</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Europe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Asia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Africa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Oceania</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16"
        >
          <div 
            className="rounded-3xl p-12 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #88C300 0%, #6b9a00 100%)',
              boxShadow: '0 20px 60px rgba(136, 195, 0, 0.3)'
            }}
          >
            {/* Decorative Elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center">Ready to Ship Worldwide?</h3>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto text-center">
                Join thousands of satisfied customers who trust Globeflight for their international shipping needs. Fast, secure, and reliable delivery guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/contact-us"
                  className="bg-white text-gray-900 px-10 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl group"
                >
                  <Package className="w-5 h-5" />
                  Get Quote Now
                </Link>
                <Link 
                  to="/track"
                  className="border-2 border-white text-white px-10 py-4 rounded-xl font-bold hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <MapPin className="w-5 h-5" />
                  Track Package
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-8 mt-10 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Free Quote</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}