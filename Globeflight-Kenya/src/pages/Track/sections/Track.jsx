'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import 'leaflet/dist/leaflet.css'
import '@/lib/leafletIconFix'
import TrackHero from './TrackHero'
import TrackMap from './TrackMap'
import PublicTrackingDetails from '@/components/PublicTrackingDetails'
import PublicTrackingTimeline from '@/components/PublicTrackingTimeline'
import { useSearchParams } from 'react-router-dom'
import io from 'socket.io-client'

import { API_BASE } from "@/constants/api";
const SOCKET_URL = import.meta.env.DEV ? "http://127.0.0.1:5000" : "";

export default function TrackShipment() {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingData, setTrackingData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLiveUpdating, setIsLiveUpdating] = useState(false)
  const socketRef = useRef(null)
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    const trackParam = searchParams.get('trackingNumber');
    if (trackParam) {
      setTrackingNumber(trackParam);
      handleTrack(null, trackParam);
    }
  }, [searchParams]);

  // Setup real-time updates
  useEffect(() => {
    if (!trackingData?.trackingNumber) return;

    // Try Socket.IO first
    try {
      socketRef.current = io(SOCKET_URL + '/public/tracking', {
        path: '/socket.io',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      socketRef.current.on('connect', () => {
        setIsLiveUpdating(true);
        socketRef.current.emit('join-tracking', trackingData.trackingNumber);
      });

      socketRef.current.on('tracking-update', (data) => {
        if (data.trackingNumber === trackingData.trackingNumber) {
          setTrackingData(prev => ({
            ...prev,
            status: data.status,
            updates: [data.update, ...(prev.updates || [])],
            // Update latest location if coordinates are available
            ...(data.latitude && data.longitude && {
              latestLocation: {
                latitude: data.latitude,
                longitude: data.longitude,
                location: data.location,
                status: data.status
              }
            })
          }));
        }
      });

      socketRef.current.on('disconnect', () => {
        setIsLiveUpdating(false);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave-tracking', trackingData.trackingNumber);
          socketRef.current.disconnect();
        }
      };
    } catch (err) {
      console.log('Socket.IO not available, using polling fallback');
      // Fallback to polling every 30 seconds
      pollIntervalRef.current = setInterval(() => {
        handleTrack(null, trackingData.trackingNumber);
      }, 30000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [trackingData?.trackingNumber]);

  const handleTrack = async (e, trackNum) => {
    if (e) e.preventDefault()
    const currentTrackingNumber = trackNum || trackingNumber;
    if (!currentTrackingNumber) return
    
    setLoading(true)
    setError(null)
    setTrackingData(null)
    try {
      const response = await fetch(`${API_BASE}/tracking/public/${currentTrackingNumber}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('No shipment found for this consignment number.')
        } else {
          setError('An error occurred while fetching tracking data. Please try again later.')
        }
        setLoading(false)
        return
      }
      const res = await response.json()
      if (res && res.data) {
        setTrackingData(res.data)
      } else {
        setError('No shipment found for this consignment number.')
      }
    } catch (err) {
      setError('An error occurred while fetching tracking data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Get latest update with location
  const latestUpdateWithLocation = trackingData?.updates
    ? [...trackingData.updates].reverse().find(u => u.latitude && u.longitude)
    : null;

  return (
    <div className="relative min-h-screen mt-16 bg-gray-50">
      {/* Hero/Search Section */}
      <TrackHero
        trackingNumber={trackingNumber}
        setTrackingNumber={setTrackingNumber}
        handleTrack={handleTrack}
        loading={loading}
      />
      
      {/* Results Section */}
      <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50">
                  <AlertCircle className="w-5 h-5" />
                  <AlertTitle className="text-lg font-bold">Tracking Error</AlertTitle>
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {trackingData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Live Update Indicator */}
                {isLiveUpdating && (
                  <div className="bg-[#88C300]/10 border border-[#88C300]/30 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#88C300] rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700 font-semibold">Live tracking enabled - Updates in real-time</span>
                  </div>
                )}

                {/* Timeline - FIRST (Most Important) */}
                <PublicTrackingTimeline
                  shipment={trackingData}
                  updates={trackingData.updates || []}
                />

                {/* Enhanced Tracking Details */}
                <PublicTrackingDetails shipment={trackingData} />

                {/* Map */}
                {latestUpdateWithLocation && (
                  <TrackMap latestUpdateWithLocation={latestUpdateWithLocation} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}