'use client'

import React from "react"
import { useMatch } from "react-router-dom"
import { motion } from "framer-motion"

const Hero = ({ children }) => {
  const blogIndex = useMatch({ path: "/blog", end: true })
  return (
    <section
      className="relative w-screen mt-16 min-h-[70vh] overflow-hidden"
      style={{
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        width: '100vw',
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
          backgroundImage: 'url(/blogs.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
        }}
      />

      {/* Gradient Overlay for Better Text Visibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.3) 30%, rgba(15, 23, 42, 0.75) 100%)'
        }}
      />

      {/* Animated Gradient Orbs */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.2, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20,
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
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
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

      {/* Content - Full Width */}
      <div className="relative z-10 w-full mt-8 sm:mt-10 md:mt-12 px-4 sm:px-6 md:px-8 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-28">
        {children || (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="space-y-4 sm:space-y-6">
              {blogIndex && (
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white"
                  style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}
                >
                  Our Blog
                </h1>
              )}

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="max-w-2xl mx-auto text-lg mt-16 sm:text-xl md:text-2xl lg:text-3xl text-white/95 leading-relaxed font-light px-4"
                style={{
                  textShadow: '1px 1px 6px rgba(0,0,0,0.5)'
                }}
              >
                Expert perspectives, updates on logistics, shipping, and supply chain management across Africa
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default Hero