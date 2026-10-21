import React, { useState, useEffect } from 'react'

// Import sub-components
import {
  AboutHeader,
  CoreValuesSection,
  StatsSection,
  WhyChooseUsSection,
  ImageShowcaseSection,
  ServicesGridSection,
  SocialMediaSection,
  ImageModal
} from './components'

// About Section Component
const AboutUs = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  
  // Preload critical images
  useEffect(() => {
    const preloadImages = ['/3.jpg', '/1.jpg', '/2.jpg']
    preloadImages.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSelectedImage(null)
      }
    }
    
    if (selectedImage) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden bg-white">
      <div className="container relative z-10 px-4 mx-auto sm:px-6 lg:px-8">
        {/* Section Header */}
        <AboutHeader />

        {/* Vision, Mission, Values Cards - MOVED TO FIRST */}
        <CoreValuesSection />

        {/* Stats Section */}
        <StatsSection />

        {/* Why Choose Us Section */}
        <WhyChooseUsSection setSelectedImage={setSelectedImage} />

        {/* Modern Image Showcase Section */}
        <ImageShowcaseSection setSelectedImage={setSelectedImage} />

        {/* Final Image Showcase - Additional Services */}
        <ServicesGridSection setSelectedImage={setSelectedImage} />

        {/* Enhanced Social Media Section */}
        <SocialMediaSection />
      </div>

      {/* Image Zoom Modal */}
      <ImageModal selectedImage={selectedImage} setSelectedImage={setSelectedImage} />
    </section>
  )
}

export default AboutUs
