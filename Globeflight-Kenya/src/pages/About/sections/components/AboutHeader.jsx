import React from 'react'
import { motion } from 'framer-motion'

const AboutHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-16 text-center"
    >
     {/*} <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-green-700 bg-green-100 rounded-full"
      >
        About Globeflight Kenya
      </motion.div>*/}

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold md:text-5xl mb-4 text-gray-900"
      >
        Your Partner in Global Logistics
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="text-lg leading-relaxed text-gray-600 max-w-3xl mx-auto"
      >
        Globeflight Kenya is a leading logistics and freight forwarding company based in Nairobi, providing comprehensive cargo solutions across East Africa and beyond. We specialize in air freight, sea freight, road transport, warehousing, and customs clearance services.
      </motion.p>
    </motion.div>
  )
}

export default AboutHeader