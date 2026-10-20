import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CallToActionSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const ctaImages = [
    '/cta1.jpg?height=300&width=600',
    '/Air.jpg?height=300&width=600',
    '/Sea.jpg?height=30000&width=600',
    '/Ecommerce.jpg?height=300&width=600',
    '/Consolidation.jpg?height=300&width=600',
    '/Warehouse.jpg?height=300&width=600',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % ctaImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % ctaImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + ctaImages.length) % ctaImages.length)
  }

  return (
    <section className="relative py-12 mt-6 overflow-hidden bg-gray-200 sm:py-18">
      <div className="container px-6 mx-auto sm:px-6 lg:px-8">
        <div className="p-8 bg-gray-300 rounded-lg shadow-lg md:p-12">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left"
            >
              <h2 className="mb-6 text-3xl font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
                Let us help you find a solution that meets your{' '}
                <span className="text-green-600">Logistic needs</span>
              </h2>
              <p className="mb-8 text-xl text-gray-700">
                Take advantage of our extensive experience and let Globeflight find the right solution that fits your pocket as well
              </p>
              <Link
                to="/contact-us"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white transition duration-150 ease-in-out bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Get in Touch with us Today
                <ChevronRight className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-lg shadow-xl aspect-w-16 aspect-h-6">
                <img
                  src={ctaImages[currentImageIndex]}
                  alt={`Globeflight services ${currentImageIndex + 1}`}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-between p-4">
                <button
                  onClick={prevImage}
                  className="p-2 text-white transition duration-150 ease-in-out bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="p-2 text-white transition duration-150 ease-in-out bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}