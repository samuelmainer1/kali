"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Quote,
  PauseCircle,
  PlayCircle,
  User,
  Building,
  MessageSquare,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { API_BASE } from "@/constants/api"

// Custom rating stars component
const RatingStars = ({ rating, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md

  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < Math.floor(rating)
              ? "fill-current text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

const TestimonialCard = ({ testimonial, isActive }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <div
        className={`rounded-2xl p-8 h-full flex flex-col transition-all duration-300 ${
          isActive
            ? "shadow-2xl border-2"
            : "shadow-lg border-2 border-gray-100"
        }`}
        style={{
          background: isActive 
            ? 'linear-gradient(to bottom right, #f0fadc, white)' 
            : 'white',
          borderColor: isActive ? '#88C300' : undefined
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <Quote 
            className="h-12 w-12" 
            style={{ color: isActive ? '#88C300' : '#d1d5db' }}
          />
          <RatingStars rating={testimonial.rating} size="md" />
        </div>

        <p className="flex-grow mb-6 text-lg leading-relaxed text-gray-700 italic">
          "{testimonial.review}"
        </p>

        <div 
          className="pt-6 mt-auto border-t"
          style={{ borderColor: isActive ? '#88C300' : '#e5e7eb' }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center justify-center w-14 h-14 text-white rounded-full text-xl font-bold"
              style={{
                background: 'linear-gradient(to bottom right, #88C300, #6b9a00)'
              }}
            >
              {testimonial.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                {testimonial.title ? (
                  <>
                    <Building className="w-4 h-4 mr-1.5" />
                    {testimonial.title}
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-1.5" />
                    Verified Client
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [visibleCount, setVisibleCount] = useState(3)
  const [testimonialsList, setTestimonialsList] = useState([])
  const [fetchError, setFetchError] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isTablet = useMediaQuery("(min-width: 768px)")

  useEffect(() => {
    if (isDesktop) {
      setVisibleCount(3)
    } else if (isTablet) {
      setVisibleCount(2)
    } else {
      setVisibleCount(1)
    }
  }, [isDesktop, isTablet])

  useEffect(() => {
    let interval
    if (isAutoPlay && testimonialsList.length > 0) {
      interval = setInterval(() => {
        handleNext()
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [isAutoPlay, activeIndex, testimonialsList.length])

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessMessage])

  useEffect(() => {
    const fetchTestimonials = async () => {
      setIsLoading(true)
      try {
        const apiUrl = `${API_BASE}/testimonials/public`
        const res = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include'
        })

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        const data = await res.json()

        if (data.success && data.data) {
          const testimonials = Array.isArray(data.data) 
            ? data.data 
            : data.data.testimonials || []

          if (testimonials.length > 0) {
            setTestimonialsList(testimonials.map(t => ({
              id: t.id,
              name: t.name,
              title: t.position || t.company || "",
              review: t.content,
              rating: t.rating || 5,
            })))
            setFetchError(false)
          } else {
            setTestimonialsList([])
            setFetchError(true)
          }
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error)
        setFetchError(true)
        setTestimonialsList([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonialsList.length - visibleCount : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === testimonialsList.length - visibleCount ? 0 : prev + 1))
  }

  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay)
  }

  const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID"

  const visibleTestimonials = testimonialsList.slice(activeIndex, activeIndex + visibleCount)

  if (visibleTestimonials.length < visibleCount && testimonialsList.length >= visibleCount) {
    const neededCount = visibleCount - visibleTestimonials.length
    visibleTestimonials.push(...testimonialsList.slice(0, neededCount))
  }

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2388C300%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
         
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Our Clients Say About Us
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our satisfied clients have to say about their experience with Globeflight Kenya.
          </p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between px-6 py-4 mb-8 rounded-xl border-2 max-w-2xl mx-auto"
              style={{
                backgroundColor: 'rgba(136, 195, 0, 0.1)',
                borderColor: '#88C300'
              }}
            >
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-3 fill-current" style={{ color: '#88C300' }} />
                <span className="font-semibold" style={{ color: '#6b9a00' }}>
                  Thank you for sharing your experience! Your testimonial has been submitted.
                </span>
              </div>
              <button 
                onClick={() => setShowSuccessMessage(false)} 
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-5 h-5" style={{ color: '#6b9a00' }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative max-w-7xl mx-auto">
          <div className="overflow-hidden">
            {isLoading ? (
              <div className="py-20 text-center">
                <div 
                  className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto"
                  style={{ borderColor: '#88C300', borderTopColor: 'transparent' }}
                />
                <p className="mt-4 text-gray-600">Loading testimonials...</p>
              </div>
            ) : fetchError || testimonialsList.length === 0 ? (
              <div className="py-20 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No testimonials available at the moment.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  <AnimatePresence mode="wait">
                    {visibleTestimonials.map((testimonial, idx) => (
                      <motion.div
                        key={`${testimonial.id}-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, delay: idx * 0.1 }}
                      >
                        <TestimonialCard testimonial={testimonial} isActive={idx === 0} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrev}
                    className="w-12 h-12 rounded-full border-2 hover:scale-110 transition-all"
                    style={{ borderColor: '#88C300' }}
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-6 h-6" style={{ color: '#88C300' }} />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleAutoPlay}
                    className="w-12 h-12 rounded-full border-2 hover:scale-110 transition-all"
                    style={{
                      borderColor: '#88C300',
                      backgroundColor: isAutoPlay ? 'rgba(136, 195, 0, 0.1)' : 'transparent'
                    }}
                    aria-label={isAutoPlay ? "Pause autoplay" : "Start autoplay"}
                  >
                    {isAutoPlay ? (
                      <PauseCircle className="w-6 h-6" style={{ color: '#88C300' }} />
                    ) : (
                      <PlayCircle className="w-6 h-6" style={{ color: '#88C300' }} />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    className="w-12 h-12 rounded-full border-2 hover:scale-110 transition-all"
                    style={{ borderColor: '#88C300' }}
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-6 h-6" style={{ color: '#88C300' }} />
                  </Button>
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center mt-8 gap-2">
                  {testimonialsList.slice(0, Math.max(testimonialsList.length - visibleCount + 1, 1)).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: activeIndex === idx ? '2rem' : '0.5rem',
                        backgroundColor: activeIndex === idx ? '#88C300' : '#d1d5db'
                      }}
                      aria-label={`Go to testimonial ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        
      </div>
    </section>
  )
}

export default Testimonials