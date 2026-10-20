import React from "react"
import { motion } from "framer-motion"

const NavbarProgressBar = ({ scrollProgress }) => (
  <div className="h-1 bg-gray-200">
    <motion.div 
      className="h-full bg-[#88C300]"
      style={{ width: `${scrollProgress}%` }}
      transition={{ duration: 0.1 }}
    />
  </div>
)

export default NavbarProgressBar