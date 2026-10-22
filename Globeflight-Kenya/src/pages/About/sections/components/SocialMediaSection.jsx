import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const SocialMediaSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-24"
    >
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-12 text-center shadow-lg">
        <h3 className="mb-4 text-3xl font-bold text-white md:text-4xl">Ready to Get Started?</h3>
        <p className="mb-8 text-lg text-green-50 max-w-2xl mx-auto">
          Partner with Globeflight Kenya for reliable, efficient, and professional logistics solutions tailored to your business needs.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/contact-us"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            Request a Quote
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/services"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-green-600 transition-all duration-300"
          >
            View Our Services
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default SocialMediaSection