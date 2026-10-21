'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, MapPin, Package, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

const statusColors = {
  created: 'bg-blue-100 text-blue-800 border-blue-300',
  collected: 'bg-blue-100 text-blue-800 border-blue-300',
  departed: 'bg-purple-100 text-purple-800 border-purple-300',
  'in-transit': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'arrived-at-destination': 'bg-orange-100 text-orange-800 border-orange-300',
  'out-for-delivery': 'bg-green-100 text-green-800 border-green-300',
  delivered: 'bg-green-100 text-green-800 border-green-300'
}

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

export default function PublicTrackingDetails({ shipment }) {
  if (!shipment) return null

  const pod = shipment.proofOfDelivery?.[0]
  const exceptions = shipment.exceptions || []
  const activeExceptions = exceptions.filter(e => e.status !== 'resolved')

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const dateObj = new Date(date)
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
    <>
      <div className="space-y-6">
        {/* Modern Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-xl overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-[#88C300] to-[#6ea000] px-6 py-8 sm:px-8">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-white rounded-full"></div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight break-all">
                      {shipment.trackingNumber}
                    </h2>
                  </div>
                  <p className="text-white/90 text-sm sm:text-base font-medium">
                    {shipment.senderName} <span className="text-white">→</span> {shipment.receiverName}
                  </p>
                </div>
                <div className="flex items-center">
                  <Badge className={`${statusColors[shipment.status] || 'bg-gray-100'} border-2 px-4 py-2 text-sm font-bold`}>
                    {shipment.status.replace(/-/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <CardContent className="pt-8 pb-8 px-6 sm:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Origin */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Origin</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{shipment.origin}</p>
                </motion.div>

                {/* Destination */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Destination</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{shipment.destination}</p>
                </motion.div>

                {/* Service Type */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Service</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{shipment.serviceType || 'Standard'}</p>
                </motion.div>

              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Proof of Delivery */}
        {pod && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-[#88C300] to-[#6ea000] px-6 py-6">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  Proof of Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-8 px-6 sm:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Recipient</p>
                    <p className="text-base font-bold text-gray-900">{pod.recipientName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Location</p>
                    <p className="text-base font-bold text-gray-900">{pod.deliveryLocation}</p>
                  </div>
                </div>
                {pod.recipientPhotoUrl && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">Delivery Photo</p>
                    <img
                      src={pod.recipientPhotoUrl}
                      alt="Delivery proof"
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                {pod.notes && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-gray-800">{pod.notes}</p>
                  </div>
                )}
                <p className="text-sm text-gray-600 font-medium">
                  ✓ Delivered on {formatDate(pod.createdAt)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Exceptions */}
        {activeExceptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-6">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  Active Exceptions ({activeExceptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-8 px-6 sm:px-8">
                <div className="space-y-4">
                  {activeExceptions.map((exception, idx) => (
                    <motion.div
                      key={exception.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="border-l-4 border-orange-500 bg-gray-50 rounded-r-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="font-bold text-gray-900 capitalize text-base">
                            {exception.exceptionType}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge className={`${severityColors[exception.severity] || 'bg-gray-100'} font-semibold text-xs`}>
                              {exception.severity}
                            </Badge>
                            <Badge variant="outline" className="capitalize font-semibold text-xs">
                              {exception.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{exception.description}</p>
                      {exception.location && (
                        <p className="text-xs text-gray-600 flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {exception.location}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Reported on {formatDate(exception.createdAt)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Package Details - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-xl overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-[#88C300] to-[#6ea000] px-6 py-6">
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8 px-6 sm:px-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Weight */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">Weight</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{shipment.weight}</p>
                  <p className="text-xs text-gray-500">Kilograms</p>
                </motion.div>

                {/* Chargeable Weight */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">Chargeable</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{shipment.chargeableWeight || shipment.weight}</p>
                  <p className="text-xs text-gray-500">Kilograms</p>
                </motion.div>

                {/* Dimensions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">Dimensions</p>
                  <p className="text-lg font-bold text-gray-900 mb-1">{shipment.dimensions || 'N/A'}</p>
                  <p className="text-xs text-gray-500">L × W × H (cm)</p>
                </motion.div>

                {/* Pieces */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">Pieces</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{shipment.numberOfPackages || 1}</p>
                  <p className="text-xs text-gray-500">Total Packages</p>
                </motion.div>

                {/* CBM */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">Volume (CBM)</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{shipment.cbm || '0'}</p>
                  <p className="text-xs text-gray-500">Cubic Meters</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Waybill Button - Commented out, waybill generated from dashboard only
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <button
            onClick={() => setShowWaybill(true)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
          >
            <FileText className="w-5 h-5" />
            View Enhanced Waybill
          </button>
        </motion.div>
        */}
      </div>

      {/* Waybill Modal - Commented out, waybill generated from dashboard only
      {showWaybill && (
        <PublicWaybillViewer
          shipment={shipment}
          onClose={() => setShowWaybill(false)}
        />
      )}
      */}
    </>
  )
}

