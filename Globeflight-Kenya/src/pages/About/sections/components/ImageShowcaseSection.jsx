import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

const ImageShowcaseSection = ({ setSelectedImage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="mb-32"
    >
      <div className="text-center mt-12 mb-12">
        {/*<motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full"
        >
          Our Services
        </motion.div>*/}
        <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
          Comprehensive Logistics Solutions
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          From air freight to sea cargo, warehousing to customs clearance - we handle every aspect of your logistics needs with precision and care.
        </p>
      </div>

      {/* Main Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {/* Air Freight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-green-200 bg-white/60 backdrop-blur-lg"
          tabIndex={0}
          aria-label="View Air Freight image details"
          onClick={() => setSelectedImage({
            src: '/Air.jpg',
            alt: 'Globeflight air freight services - Fast international air cargo and express shipping solutions',
            title: 'Air Freight Services',
            description: 'Express worldwide air cargo services with real-time tracking and fast delivery'
          })}
        >
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img 
              src="/Air.jpg" 
              alt="Globeflight air freight services - Fast international air cargo and express shipping solutions" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:brightness-90"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-green-700/70 via-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/70 backdrop-blur-md rounded-b-3xl shadow-lg z-20">
            <h4 className="text-xl font-bold text-green-800 mb-1 font-sans">Air Freight</h4>
            <p className="text-green-900/80 text-sm font-medium">Express worldwide air cargo services with real-time tracking</p>
          </div>
        </motion.div>

        {/* Sea Freight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-green-200 bg-white/60 backdrop-blur-lg"
          tabIndex={0}
          aria-label="View Sea Freight image details"
          onClick={() => setSelectedImage({
            src: '/Sea.jpg',
            alt: 'Globeflight sea freight services - International maritime shipping and ocean cargo solutions',
            title: 'Sea Freight Services',
            description: 'Cost-effective ocean shipping for large cargo volumes with global reach'
          })}
        >
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img 
              src="/Sea.jpg" 
              alt="Globeflight sea freight services - International maritime shipping and ocean cargo solutions" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:brightness-90"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-700/70 via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/70 backdrop-blur-md rounded-b-3xl shadow-lg z-20">
            <h4 className="text-xl font-bold text-blue-800 mb-1 font-sans">Sea Freight</h4>
            <p className="text-blue-900/80 text-sm font-medium">Cost-effective ocean shipping for large cargo volumes</p>
          </div>
        </motion.div>

        {/* Warehousing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-green-200 bg-white/60 backdrop-blur-lg"
          tabIndex={0}
          aria-label="View Warehouse image details"
          onClick={() => setSelectedImage({
            src: '/Warehouse.jpg',
            alt: 'Globeflight warehouse management - Secure storage and inventory management solutions',
            title: 'Warehouse Management',
            description: 'Secure storage facilities with advanced inventory management and tracking'
          })}
        >
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img 
              src="/Warehouse.jpg" 
              alt="Globeflight warehouse management - Secure storage and inventory management solutions" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:brightness-90"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-green-700/70 via-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/70 backdrop-blur-md rounded-b-3xl shadow-lg z-20">
            <h4 className="text-xl font-bold text-green-800 mb-1 font-sans">Warehousing</h4>
            <p className="text-green-900/80 text-sm font-medium">Secure storage facilities with advanced inventory management</p>
          </div>
        </motion.div>

        {/* Customs Clearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-green-200 bg-white/60 backdrop-blur-lg"
          tabIndex={0}
          aria-label="View Customs image details"
          onClick={() => setSelectedImage({
            src: '/Customs.jpg',
            alt: 'Globeflight customs clearance - Professional customs brokerage and compliance services',
            title: 'Customs Clearance',
            description: 'Expert customs brokerage ensuring smooth clearance and compliance'
          })}
        >
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img 
              src="/Customs.jpg" 
              alt="Globeflight customs clearance - Professional customs brokerage and compliance services" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:brightness-90"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-green-700/70 via-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/70 backdrop-blur-md rounded-b-3xl shadow-lg z-20">
            <h4 className="text-xl font-bold text-green-800 mb-1 font-sans">Customs Clearance</h4>
            <p className="text-green-900/80 text-sm font-medium">Expert customs brokerage ensuring smooth clearance</p>
          </div>
        </motion.div>

        {/* International Shipping */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-blue-200 bg-white/60 backdrop-blur-lg"
          tabIndex={0}
          aria-label="View International Shipping image details"
          onClick={() => setSelectedImage({
            src: '/International.jpg',
            alt: 'Globeflight international shipping - Global logistics network',
            title: 'International Shipping',
            description: 'Global network with comprehensive logistics solutions'
          })}
        >
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img
              src="/International.jpg"
              alt="Globeflight international shipping - Global logistics network"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:brightness-90"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-700/70 via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/70 backdrop-blur-md rounded-b-3xl shadow-lg z-20">
            <h4 className="text-xl font-bold text-blue-800 mb-1 font-sans">International Shipping</h4>
            <p className="text-blue-900/80 text-sm font-medium">Global network for international logistics</p>
          </div>
        </motion.div>

        {/* Transport Solutions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-green-200 bg-white/60 backdrop-blur-lg"
          tabIndex={0}
          aria-label="View Transport image details"
          onClick={() => setSelectedImage({
            src: '/Transport.jpg',
            alt: 'Globeflight transport solutions - Comprehensive land transportation and delivery services',
            title: 'Transport Solutions',
            description: 'Comprehensive land transportation and delivery services across East Africa'
          })}
        >
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img 
              src="/Transport.jpg" 
              alt="Globeflight transport solutions - Comprehensive land transportation and delivery services" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:brightness-90"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-green-700/70 via-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/70 backdrop-blur-md rounded-b-3xl shadow-lg z-20">
            <h4 className="text-xl font-bold text-green-800 mb-1 font-sans">Transport Solutions</h4>
            <p className="text-green-900/80 text-sm font-medium">Comprehensive land transportation and delivery services</p>
          </div>
        </motion.div>
      </div>


    </motion.div>
  )
}

export default ImageShowcaseSection 