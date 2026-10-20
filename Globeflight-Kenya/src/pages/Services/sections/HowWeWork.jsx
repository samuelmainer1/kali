'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const logisticsSteps = [
  { 
    number: "01",
    title: "Order Placement", 
    description: "Submit your shipping requirements through our secure platform. Get instant quotes and booking confirmation within minutes."
  },
  { 
    number: "02",
    title: "Documentation & Processing", 
    description: "Our expert team handles all paperwork, customs documentation, and compliance requirements for seamless processing."
  },
  { 
    number: "03",
    title: "Collection & Transit", 
    description: "Strategic pickup from your location with optimized routing through our global network for fastest delivery times."
  },
  { 
    number: "04",
    title: "Real-Time Tracking", 
    description: "Monitor your shipment 24/7 with live GPS tracking, automated updates, and direct communication channels."
  },
  { 
    number: "05",
    title: "Safe Delivery", 
    description: "Guaranteed delivery with proof of receipt, quality checks, and complete customer satisfaction confirmation."
  }
]

const HowWeWork = () => {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/*<div className="inline-block mb-4">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              OUR PROCESS
            </span>
          </div>*/}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How We <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #3B82F6, #88C300)' }}>Deliver Excellence</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A streamlined, technology-driven process that ensures your cargo reaches its destination safely and on time, every time.
          </p>
        </motion.div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Visual Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mb-12 lg:mb-0"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/info.jpg"
                alt="Globeflight Kenya Logistics Process"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/40 to-transparent"></div>
              
              {/* Stats Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">99.8%</div>
                    <div className="text-xs text-blue-100">On-Time Delivery</div>
                  </div>
                  <div className="text-center border-x border-white/20">
                    <div className="text-3xl font-bold text-white mb-1">24/7</div>
                    <div className="text-xs text-blue-100">Support Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">200+</div>
                    <div className="text-xs text-blue-100">Countries Served</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: '#88C300' }}></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
          </motion.div>

          {/* Right Process Steps */}
          <div className="space-y-4">
            {logisticsSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-lg ${
                    activeStep === index 
                      ? 'border-blue-500 shadow-lg bg-gradient-to-r from-blue-50 to-white' 
                      : 'border-transparent hover:border-gray-200'
                  }`}
                  onClick={() => setActiveStep(index)}
                  onMouseEnter={() => setActiveStep(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Step Number */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                        activeStep === index 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.number}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-2 transition-colors ${
                          activeStep === index ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>

                      {/* Indicator */}
                      {activeStep === index && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex-shrink-0"
                        >
                          <CheckCircle2 className="w-6 h-6" style={{ color: '#88C300' }} />
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <div className="rounded-3xl p-12 shadow-2xl" style={{ backgroundImage: 'linear-gradient(to right, #3B82F6, #88C300)' }}>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Ship with Confidence?
            </h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that trust us with their global logistics needs
            </p>
            <Link to="/contact-us">
              <Button 
                size="lg" 
                className="bg-white text-blue-700 hover:bg-gray-100 font-bold px-10 py-6 rounded-xl shadow-xl text-lg group transition-all duration-300"
              >
                Start Your Shipment
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-blue-100">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Free Quote
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                No Hidden Fees
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Instant Booking
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default HowWeWork