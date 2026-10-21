"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import "./LoaderOnPageMount.css"

const LoaderOnPageMount = () => {
  useEffect(() => {
    // Prevent scrolling while loader is active
    document.body.style.overflow = "hidden"

    return () => {
      // Re-enable scrolling when component unmounts
      document.body.style.overflow = "auto"
    }
  }, [])

  return (
    <motion.div
      className="loader-container"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="loader-content">
        <div className="logo-container">
          <svg className="logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d="M20,50 A30,30 0 1,1 80,50 A30,30 0 1,1 20,50 Z"
              fill="none"
              strokeWidth="5"
              stroke="url(#gradient)"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.path
              d="M30,50 L70,50"
              fill="none"
              strokeWidth="5"
              stroke="#88C300"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#88C300" />
                <stop offset="100%" stopColor="#6ea000" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="dots-container">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="dot"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.div
          className="loading-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Loading Globeflight
        </motion.div>
      </div>
    </motion.div>
  )
}

export default LoaderOnPageMount