import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const ImageModal = ({ selectedImage, setSelectedImage }) => {
  if (!selectedImage) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm"
        onClick={() => setSelectedImage(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Responsive positioning */}
          <button
            onClick={() => setSelectedImage(null)}
            className="fixed top-2 right-2 sm:absolute sm:-top-4 sm:-right-4 z-[10000] p-2 sm:p-3 bg-white rounded-full shadow-2xl hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>

          {/* Image Container */}
          <div className="relative overflow-hidden rounded-lg sm:rounded-2xl shadow-2xl bg-white">
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh] object-contain bg-gray-50"
            />

            {/* Image Info */}
            <div className="p-4 sm:p-6 bg-white">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {selectedImage.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {selectedImage.description}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ImageModal