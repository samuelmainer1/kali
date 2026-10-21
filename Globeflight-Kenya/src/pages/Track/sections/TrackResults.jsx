import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package2, MapPin, Truck, FileDown, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TrackResults({ trackingData, getProgress, handleDownload }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Shipment Overview Card */}
      <Card className="overflow-hidden bg-white border border-gray-200 shadow-lg">
        <CardHeader className="p-4 sm:p-8 text-white bg-[#88C300]">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold">Shipment Details</CardTitle>
              <p className="text-white/90 text-sm sm:text-base break-all">Tracking #{trackingData.trackingNumber || trackingData.shipment_number}</p>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <span className="text-base sm:text-lg font-semibold capitalize">{trackingData.status}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 md:p-8">
          {/* Info Grid */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div whileHover={{ scale: 1.02 }} className="p-4 sm:p-5 border border-gray-200 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-[#88C300]/10 rounded-lg flex-shrink-0">
                  <Package2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#88C300]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs sm:text-sm text-gray-600 font-medium">Consignment</p>
                  <p className="font-bold text-sm sm:text-base text-gray-900 break-all">{trackingData.trackingNumber || trackingData.shipment_number}</p>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="p-4 sm:p-5 border border-gray-200 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg flex-shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs sm:text-sm text-gray-600 font-medium">Origin</p>
                  <p className="font-bold text-sm sm:text-base text-gray-900 break-words">{trackingData.origin}</p>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="p-4 sm:p-5 border border-gray-200 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-purple-50 rounded-lg flex-shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs sm:text-sm text-gray-600 font-medium">Destination</p>
                  <p className="font-bold text-sm sm:text-base text-gray-900 break-words">{trackingData.destination}</p>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="p-4 sm:p-5 border border-gray-200 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-[#88C300]/10 rounded-lg flex-shrink-0">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-[#88C300]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs sm:text-sm text-gray-600 font-medium">Status</p>
                  <p className="font-bold text-sm sm:text-base text-gray-900 capitalize break-words">{trackingData.status}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Progress Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-8"
          >
            <h3 className="mb-6 text-lg sm:text-xl font-bold text-gray-900">Shipment Progress</h3>

            {/* Desktop/Tablet View - Horizontal Timeline */}
            <div className="relative hidden sm:block">
              {/* Progress Bar Background */}
              <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full top-5" />
              {/* Progress Bar Fill */}
              <div
                className="absolute left-0 h-1 transition-all duration-1000 ease-out rounded-full top-5 bg-[#88C300]"
                style={{ width: `${getProgress()}%` }}
              />
              {/* Timeline Steps */}
              <div className="relative flex justify-between">
                {(trackingData.updates || []).map((update, index) => {
                  const isActive = trackingData.updates.findIndex(u => u.status === trackingData.status) >= index;
                  const isCurrent = update.status === trackingData.status;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <div className={
                        `w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${isCurrent ? 'bg-[#88C300] scale-125 shadow-lg shadow-[#88C300]/30' :
                          isActive ? 'bg-[#88C300]' : 'bg-gray-300'}`
                      }>
                        {isActive ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="mt-3 text-center">
                        <p className={`text-xs sm:text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                          {update.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(update.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Mobile View - Vertical Timeline */}
            <div className="relative sm:hidden">
              <div className="space-y-4">
                {(trackingData.updates || []).map((update, index) => {
                  const isActive = trackingData.updates.findIndex(u => u.status === trackingData.status) >= index;
                  const isCurrent = update.status === trackingData.status;
                  const isLast = index === trackingData.updates.length - 1;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <div className={
                          `w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0
                          ${isCurrent ? 'bg-[#88C300] scale-110 shadow-lg shadow-[#88C300]/30' :
                            isActive ? 'bg-[#88C300]' : 'bg-gray-300'}`
                        }>
                          {isActive ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 h-full min-h-[40px] ${isActive ? 'bg-[#88C300]' : 'bg-gray-300'}`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <p className={`text-sm font-semibold mb-1 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                          {update.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(update.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Download Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={() => handleDownload('waybill')}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
              Download Waybill
            </Button>
            <Button
              onClick={() => handleDownload('invoice')}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white bg-[#88C300] hover:bg-[#6ea000] rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
              Download Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}