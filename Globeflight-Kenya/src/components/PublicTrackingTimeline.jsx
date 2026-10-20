'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle2, MapPin, Clock, Package, Truck,
  Plane, MapPinned, Home, ChevronDown, ChevronUp, FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STAGES = [
  { key: 'created', label: 'Created', description: 'Shipment created', icon: FileText },
  { key: 'collected', label: 'Collected', description: 'Package collected', icon: Package },
  { key: 'departed', label: 'Departed', description: 'Left origin', icon: Plane },
  { key: 'in-transit', label: 'In Transit', description: 'On the way', icon: Truck },
  { key: 'arrived-at-destination', label: 'Arrived', description: 'At destination', icon: MapPinned },
  { key: 'out-for-delivery', label: 'Out for Delivery', description: 'With driver', icon: Truck },
  { key: 'delivered', label: 'Delivered', description: 'Delivered', icon: Home }
]

export default function PublicTrackingTimeline({ shipment, updates }) {
  const [showHistory, setShowHistory] = useState(false)

  if (!shipment || !updates) return null

  const getStageStatus = (stageKey) => {
    const stageOrder = STAGES.map(s => s.key)
    const currentIndex = stageOrder.indexOf(shipment.status)
    const stageIndex = stageOrder.indexOf(stageKey)

    if (stageIndex < currentIndex) return 'completed'
    if (stageIndex === currentIndex) return 'current'
    return 'pending'
  }

  const getStageUpdate = (stageKey) => {
    return updates.find(u => u.status === stageKey)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const dateObj = new Date(date)
    console.log('🕐 Formatting date:', {
      input: date,
      dateObj: dateObj.toISOString(),
      formatted: dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Africa/Nairobi'
      })
    })
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Africa/Nairobi' // Kenya timezone (EAT - UTC+3)
    })
  }

  return (
    <div className="space-y-6">
      {/* Modern Timeline Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-2xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-[#88C300] to-[#6ea000] px-6 py-6">
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              Shipment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 px-4 sm:pt-10 sm:pb-10 sm:px-6 md:px-10">
            {/* Desktop/Tablet - Horizontal Progress Bar */}
            <div className="mb-12 hidden md:block">
              <div className="flex justify-between items-center relative">
                {/* Background Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" style={{ zIndex: 0 }} />

                {/* Progress Line */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(STAGES.findIndex(s => s.key === shipment.status) / (STAGES.length - 1)) * 100}%`
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute top-6 left-0 h-1 bg-gradient-to-r from-[#88C300] to-[#6ea000] rounded-full"
                  style={{ zIndex: 1 }}
                />

                {/* Stage Icons */}
                {STAGES.map((stage, index) => {
                  const status = getStageStatus(stage.key)
                  const StageIcon = stage.icon
                  const isLast = index === STAGES.length - 1

                  return (
                    <motion.div
                      key={stage.key}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex flex-col items-center relative"
                      style={{ zIndex: 2, flex: isLast ? '0 0 auto' : '1' }}
                    >
                      {/* Icon Circle */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg transition-all duration-300 ${
                          status === 'completed'
                            ? 'bg-gradient-to-br from-[#88C300] to-[#6ea000]'
                            : status === 'current'
                            ? 'bg-gradient-to-br from-[#88C300] to-[#6ea000] animate-pulse'
                            : 'bg-gray-200'
                        }`}
                      >
                        {status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        ) : status === 'current' ? (
                          <StageIcon className="w-6 h-6 text-white" />
                        ) : (
                          <StageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </motion.div>

                      {/* Label */}
                      <div className="mt-4 text-center">
                        <p className={`text-sm font-bold ${
                          status === 'completed' || status === 'current'
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}>
                          {stage.label}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Mobile/Small Tablet - Vertical Progress */}
            <div className="mb-8 md:hidden">
              <div className="space-y-0">
                {STAGES.map((stage, index) => {
                  const status = getStageStatus(stage.key)
                  const StageIcon = stage.icon
                  const isLast = index === STAGES.length - 1

                  return (
                    <motion.div
                      key={stage.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-3 border-white shadow-md transition-all duration-300 flex-shrink-0 ${
                            status === 'completed'
                              ? 'bg-gradient-to-br from-[#88C300] to-[#6ea000]'
                              : status === 'current'
                              ? 'bg-gradient-to-br from-[#88C300] to-[#6ea000] animate-pulse'
                              : 'bg-gray-200'
                          }`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : status === 'current' ? (
                            <StageIcon className="w-5 h-5 text-white" />
                          ) : (
                            <StageIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </motion.div>
                        {!isLast && (
                          <div className={`w-0.5 h-full min-h-[50px] transition-all duration-300 ${
                            status === 'completed' ? 'bg-[#88C300]' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <p className={`text-sm font-bold mb-1 ${
                          status === 'completed' || status === 'current'
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}>
                          {stage.label}
                        </p>
                        <p className={`text-xs ${
                          status === 'completed' || status === 'current'
                            ? 'text-gray-600'
                            : 'text-gray-400'
                        }`}>
                          {stage.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Current Status Card */}
            {STAGES.map((stage) => {
              const status = getStageStatus(stage.key)
              const update = getStageUpdate(stage.key)

              if (status !== 'current') return null

              return (
                <motion.div
                  key={stage.key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-[#88C300]/10 to-[#6ea000]/10 border-2 border-[#88C300] rounded-2xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#88C300] to-[#6ea000] rounded-xl flex items-center justify-center">
                        {React.createElement(stage.icon, { className: "w-7 h-7 text-white" })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{stage.label}</h3>
                      {update && (
                        <>
                          <p className="text-gray-700 mb-3">{update.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            {update.location && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4 text-[#88C300]" />
                                <span className="font-medium">{update.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4 text-[#88C300]" />
                              <span className="font-medium">{formatDate(update.updateDateTime || update.createdAt)}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Shipment History Toggle (Aramex Style) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-0 shadow-xl overflow-hidden bg-white">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Shipment History</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-red-600">
                {showHistory ? 'Hide History' : 'Show History'}
              </span>
              {showHistory ? (
                <ChevronUp className="w-5 h-5 text-red-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-red-600" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <CardContent className="pt-0 pb-6 px-6">
                  <div className="border-t border-gray-200 pt-6">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 mb-4 pb-3 border-b border-gray-200">
                      <div className="col-span-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Date</div>
                      <div className="col-span-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Location</div>
                      <div className="col-span-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Activity</div>
                    </div>

                    {/* History Items */}
                    <div className="space-y-0">
                      {[...updates].reverse().map((update, index) => (
                        <motion.div
                          key={update.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="grid grid-cols-12 gap-4 py-4 border-l-4 border-[#88C300] pl-4 hover:bg-gray-50 transition-colors relative"
                        >
                          {/* Timeline Dot */}
                          <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#88C300] rounded-full border-4 border-white shadow" />

                          {/* Date */}
                          <div className="col-span-3">
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(update.updateDateTime || update.createdAt).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: 'short',
                                year: '2-digit',
                                timeZone: 'Africa/Nairobi'
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(update.updateDateTime || update.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'Africa/Nairobi'
                              })}
                            </p>
                          </div>

                          {/* Location */}
                          <div className="col-span-3">
                            <p className="text-sm font-semibold text-gray-900">{update.location}</p>
                          </div>

                          {/* Activity */}
                          <div className="col-span-6">
                            <p className="text-sm text-gray-700">{update.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  )
}

