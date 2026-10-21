import React from 'react'
import { motion } from 'framer-motion'
import { Package, Truck, Shield, Clock } from 'lucide-react'

const StatsSection = () => {
  const stats = [
    {
      icon: Package,
      label: "Shipments Handled",
      value: "Monthly",
      description: "Reliable cargo solutions",
      color: "text-green-600"
    },
    {
      icon: Truck,
      label: "On-Time Delivery",
      value: "Priority",
      description: "Timely logistics services",
      color: "text-blue-600"
    },
    {
      icon: Shield,
      label: "Secure Handling",
      value: "Guaranteed",
      description: "Safe cargo management",
      color: "text-emerald-600"
    },
    {
      icon: Clock,
      label: "24/7 Support",
      value: "Available",
      description: "Round-the-clock assistance",
      color: "text-green-700"
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className={`p-3 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors duration-300`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.description}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default StatsSection