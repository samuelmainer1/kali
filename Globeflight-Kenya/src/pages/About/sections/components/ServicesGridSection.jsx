import React from 'react'
import { motion } from 'framer-motion'

const ServicesGridSection = ({ setSelectedImage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="mt-32"
    >
      <div className="text-center mb-12">
        {/*<motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full"
        >
          Our Services
        </motion.div>*/}
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
          Comprehensive Logistics Solutions
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          From e-commerce fulfillment to consolidation services, we provide end-to-end logistics solutions tailored to your business needs.
        </p>
      </div>

      {/* Additional Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">
        {/* E-commerce */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white border border-gray-200 hover:border-green-300"
          tabIndex={0}
          aria-label="View E-commerce Logistics image details"
          onClick={() => setSelectedImage({
            src: '/Ecommerce.jpg',
            alt: 'Globeflight e-commerce logistics - Online retail fulfillment and order processing services',
            title: 'E-commerce Logistics',
            description: 'Online retail fulfillment and order processing services for modern businesses'
          })}
        >
          <div className="aspect-square w-full overflow-hidden">
            <img
              src="/Ecommerce.jpg"
              alt="Globeflight e-commerce logistics - Online retail fulfillment and order processing services"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 via-green-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <h4 className="text-xl font-bold text-white mb-2">E-commerce</h4>
            <p className="text-white/90 text-sm font-medium">Fulfillment & order processing</p>
          </div>
        </motion.div>
        {/* Consolidation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white border border-gray-200 hover:border-blue-300"
          tabIndex={0}
          aria-label="View Cargo Consolidation image details"
          onClick={() => setSelectedImage({
            src: '/Consolidation.jpg',
            alt: 'Globeflight cargo consolidation - Group shipping and freight consolidation services',
            title: 'Cargo Consolidation',
            description: 'Group shipping and freight consolidation services for cost-effective logistics'
          })}
        >
          <div className="aspect-square w-full overflow-hidden">
            <img
              src="/Consolidation.jpg"
              alt="Globeflight cargo consolidation - Group shipping and freight consolidation services"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <h4 className="text-xl font-bold text-white mb-2">Consolidation</h4>
            <p className="text-white/90 text-sm font-medium">Group shipping solutions</p>
          </div>
        </motion.div>
        {/* Info Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white border border-gray-200 hover:border-green-300"
          tabIndex={0}
          aria-label="View Logistics Consulting image details"
          onClick={() => setSelectedImage({
            src: '/info.jpg',
            alt: 'Globeflight information services - Logistics consulting and supply chain optimization',
            title: 'Logistics Consulting',
            description: 'Expert logistics consulting and supply chain optimization services'
          })}
        >
          <div className="aspect-square w-full overflow-hidden">
            <img
              src="/info.jpg"
              alt="Globeflight information services - Logistics consulting and supply chain optimization"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 via-green-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <h4 className="text-xl font-bold text-white mb-2">Consulting</h4>
            <p className="text-white/90 text-sm font-medium">Supply chain optimization</p>
          </div>
        </motion.div>
        {/* Profile Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white border border-gray-200 hover:border-blue-300"
          tabIndex={0}
          aria-label="View Expert Team image details"
          onClick={() => setSelectedImage({
            src: '/profile2.jpg',
            alt: 'Globeflight professional services - Expert logistics team and customer support',
            title: 'Expert Team',
            description: 'Professional logistics team providing exceptional customer support and service'
          })}
        >
          <div className="aspect-square w-full overflow-hidden">
            <img
              src="/profile2.jpg"
              alt="Globeflight professional services - Expert logistics team and customer support"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <h4 className="text-xl font-bold text-white mb-2">Expert Team</h4>
            <p className="text-white/90 text-sm font-medium">Professional support</p>
          </div>
        </motion.div>
        {/* Importer of Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white border border-gray-200 hover:border-green-300"
          tabIndex={0}
          aria-label="View Importer of Records image details"
          onClick={() => setSelectedImage({
            src: '/Customs.jpg',
            alt: 'Importer of Records - Full compliance and representation for your import needs',
            title: 'Importer of Records',
            description: 'We handle all compliance, documentation, and representation for your import shipments.'
          })}
        >
          <div className="aspect-square w-full overflow-hidden">
            <img
              src="/Customs.jpg"
              alt="Importer of Records - Full compliance and representation for your import needs"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 via-green-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <h4 className="text-xl font-bold text-white mb-2">Importer of Records</h4>
            <p className="text-white/90 text-sm font-medium">Compliance & import representation</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ServicesGridSection 