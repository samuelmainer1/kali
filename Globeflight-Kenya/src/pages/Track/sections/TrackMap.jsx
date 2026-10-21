import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MapPin, AlertCircle } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function TrackMap({ latestUpdateWithLocation }) {
  // Check if we have valid coordinates
  if (!latestUpdateWithLocation || !latestUpdateWithLocation.latitude || !latestUpdateWithLocation.longitude) {
    return (
      <Card className="overflow-hidden border border-amber-200 bg-amber-50">
        <CardHeader className="border-b border-amber-200 bg-amber-50/50">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-amber-800">
            <AlertCircle className="w-6 h-6" />
            Location Not Available
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-700">
            Location coordinates are not yet available for this shipment.
            {latestUpdateWithLocation?.location && (
              <span className="block mt-2">
                Last known location: <strong className="text-gray-900">{latestUpdateWithLocation.location}</strong>
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-lg">
      <CardHeader className="border-b border-gray-200 bg-gray-50">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
          <MapPin className="w-6 h-6 text-[#88C300]" />
          Current Location
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height: 400, width: "100%" }}>
          <MapContainer
            center={[latestUpdateWithLocation.latitude, latestUpdateWithLocation.longitude]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[latestUpdateWithLocation.latitude, latestUpdateWithLocation.longitude]}>
              <Popup>
                <div className="p-2">
                  <div className="font-semibold text-gray-900 mb-1">{latestUpdateWithLocation.status}</div>
                  <div className="text-sm text-gray-600 mb-2">{latestUpdateWithLocation.location}</div>
                  <div className="text-xs text-gray-500">
                    {latestUpdateWithLocation.latitude.toFixed(4)}, {latestUpdateWithLocation.longitude.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  )
}