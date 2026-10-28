'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

const Hero = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleQuickContact = async (e) => {
    e.preventDefault()

    if (!email.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log('Quick contact:', { email, message })

      // Detect environment and use appropriate API URL
      const apiEndpoint = "/admin/api/contacts/public";

      console.log('Using API endpoint:', apiEndpoint)

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Quick Contact User',
          email: email,
          mobileNumber: '',
          services: [],
          inquiryType: 'feedback',
          message: message
        }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response text:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: `HTTP ${response.status}: ${errorText}` }
        }
        throw new Error(errorData.message || `Failed to send message. Status: ${response.status}`)
      }

      const data = await response.json()
      console.log('API response:', data)
      
      toast({
        title: "Message Sent!",
        description: data.message || "We'll get back to you as soon as possible.",
      })
      setEmail('')
      setMessage('')
    } catch (error) {
      console.error('Error sending quick contact:', error)
      toast({
        title: "Error",
        description: error.message || "There was a problem sending your message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToContactForm = () => {
    const formSection = document.getElementById('main-contact-form')
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="relative w-screen overflow-hidden" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
      {/* Background Image with Overlay */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&h=1080&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left space-y-6 lg:space-y-8"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#88C300]/20 backdrop-blur-sm rounded-full">
                <span className="w-2 h-2 bg-[#88C300] rounded-full animate-pulse"></span>
                <span className="text-sm font-semibold text-white">Available 24/7</span>
              </div>

              <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Get in Touch with
                <span className="block mt-2 text-[#88C300]">Globeflight</span>
              </h1>

              <p className="text-gray-200 text-base sm:text-lg lg:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0">
                Professional logistics solutions tailored to your business needs. Connect with our expert team today.
              </p>

              {/* Contact Cards */}
              <div className="space-y-4">
                <motion.a
                  href="tel:+254729341277"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 transition-all group"
                >
                  <div className="w-12 h-12 bg-[#88C300] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-300 font-medium">Call Us</p>
                    <p className="text-white text-base sm:text-lg font-semibold truncate">+254 729 341 277</p>
                  </div>
                </motion.a>

                <motion.a
                  href="mailto:cs@globeflight.co.ke"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 transition-all group"
                >
                  <div className="w-12 h-12 bg-[#88C300] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-300 font-medium">Email Us</p>
                    <p className="text-white text-base sm:text-lg font-semibold truncate">cs@globeflight.co.ke</p>
                  </div>
                </motion.a>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20"
                >
                  <div className="w-12 h-12 bg-[#88C300] rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-300 font-medium">Visit Us</p>
                    <p className="text-white text-base sm:text-lg font-semibold">Nairobi, Kenya</p>
                  </div>
                </motion.div>
              </div>

              {/* CTA to full form - Hidden on mobile, shown on desktop */}
              <div className="hidden lg:block pt-6 border-t border-white/20">
                <p className="text-gray-300 mb-4 text-sm">Need detailed assistance?</p>
                <Button
                  onClick={scrollToContactForm}
                  variant="outline"
                  className="border-2 border-[#88C300] text-white hover:bg-[#88C300] hover:text-white transition-all px-6 py-3 rounded-lg font-semibold"
                >
                  View Full Contact Form
                </Button>
              </div>
            </motion.div>

            {/* Quick Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto"
              id="main-contact-form"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Quick Contact
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Send us a message and we'll respond within 24 hours
                  </p>
                </div>

                <form onSubmit={handleQuickContact} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 sm:h-12 border-gray-300 focus:border-[#88C300] focus:ring-[#88C300] text-base"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help you..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      className="border-gray-300 focus:border-[#88C300] focus:ring-[#88C300] resize-none text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#88C300] hover:bg-[#6ea000] text-white py-3 sm:py-4 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Trust indicators */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#88C300] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Quick Response</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#88C300] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Secure</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
        <svg className="relative block w-full h-12 sm:h-16 lg:h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                fill="#ffffff"
                fillOpacity="0.08">
          </path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
                fill="#ffffff"
                fillOpacity="0.12">
          </path>
        </svg>
      </div>
    </div>
  )
}

export default Hero