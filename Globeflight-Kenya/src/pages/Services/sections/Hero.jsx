'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Globe, Shield, Clock, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const trustIndicators = [
    { icon: Globe, text: "200+ Countries Served" },
    { icon: Shield, text: "ISO Certified" },
    { icon: Clock, text: "24/7 Support" },
  ]

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: scale(1) translateY(0px);
          }
          50% {
            transform: scale(1.05) translateY(-20px);
          }
        }

        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
      `}</style>

      <section
        style={{
          position: 'relative',
          width: '100vw',
          minHeight: '100vh',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          overflow: 'hidden',
          background: '#0a0f1e'
        }}
      >
        {/* Animated Background Image */}
        <motion.div
          initial={{ scale: 1, opacity: 0.75 }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.75, 0.9, 0.75]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/Services.avif)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        />

        {/* Lighter Gradient Overlay for Better Image Visibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.15) 30%, rgba(15, 23, 42, 0.85) 100%)'
          }}
        />

        {/* Animated Gradient Orbs */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, overflow: 'hidden' }}>
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              top: '10%',
              left: '20%',
              width: '35rem',
              height: '35rem',
              backgroundColor: '#3b82f6',
              borderRadius: '9999px',
              filter: 'blur(120px)',
            }}
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '20%',
              width: '40rem',
              height: '40rem',
              backgroundColor: '#88C300',
              borderRadius: '9999px',
              filter: 'blur(120px)',
            }}
          />
        </div>

        {/* Content Overlay */}
        <div
          className="relative z-10 flex flex-col justify-end items-center text-white px-6 sm:px-8 md:px-12 lg:px-16 pb-16 sm:pb-20 md:pb-24"
          style={{ minHeight: '100vh' }}
        >
          {/* Main Content at Bottom Center */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 w-full"
            style={{ maxWidth: '100%' }}
          >
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 leading-tight"
              style={{
                textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
                letterSpacing: '-0.02em'
              }}
            >
              Our services
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-2xl sm:text-3xl mt-6  md:text-4xl lg:text-5xl mb-8 font-normal"
              style={{
                maxWidth: '60rem',
                margin: '0 auto',
                color: '#ffffff',
                textShadow: '1px 1px 6px rgba(0,0,0,0.5)',
                letterSpacing: '-0.01em'
              }}
            >
              Whatever you want. We can deliver.
            </motion.p>

            {/* CTA Buttons 
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-10 w-full"
            >
              <Button
                size="lg"
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 border-0 group"
              >
                Explore Our Services
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                onClick={() => window.location.href = '/contact'}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}
                className="text-white hover:bg-white/25 px-8 py-6 text-lg font-semibold shadow-xl transition-all duration-300"
              >
                Get a Quote
              </Button>
            </motion.div>*/}
          </motion.div>

          {/* Trust Indicators with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 md:gap-6 px-0"
            style={{ maxWidth: '100%' }}
          >
            {trustIndicators.map((indicator, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 px-5 py-3 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  color: '#ffffff'
                }}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(136, 195, 0, 0.2)',
                    border: '1px solid rgba(136, 195, 0, 0.4)'
                  }}
                >
                  <indicator.icon className="h-5 w-5" style={{ color: '#88C300' }} />
                </div>
                <span className="font-semibold text-sm sm:text-base">{indicator.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20
          }}
        >
          <div
            className="w-7 h-11 rounded-full flex justify-center p-2"
            style={{
              border: '2px solid rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-3 rounded-full"
              style={{ backgroundColor: 'rgba(136, 195, 0, 0.8)' }}
            />
          </div>
        </motion.div>
      </section>

      {/* Info Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="top-[45vh] mt-28 max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Your Global Logistics Partner</DialogTitle>
            <DialogDescription className="text-base mt-4">
              Globeflight Kenya provides comprehensive logistics solutions that connect businesses across continents. 
              With cutting-edge technology and a global network, we ensure your cargo reaches its destination efficiently and securely.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" style={{ color: '#88C300' }} />
                Our Comprehensive Services
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "International Air Freight",
                  "Sea Freight Solutions",
                  "Customs Clearance",
                  "Warehousing & Distribution",
                  "E-commerce Logistics",
                  "Regional Transport",
                  "Cargo Consolidation"
                ].map((service, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#88C300' }} />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button 
                onClick={() => setIsModalOpen(false)} 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Get Started Today
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}