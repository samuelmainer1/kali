import React, { useRef, useEffect } from "react"
import { MapPin, Clock } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "@/lib/leafletIconFix"

const FooterMap = () => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return
    mapInstanceRef.current = L.map(mapRef.current).setView([-1.3195, 36.897], 15)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstanceRef.current)
    const marker = L.marker([-1.3195, 36.897]).addTo(mapInstanceRef.current)
    marker.bindPopup(`
      <div class="text-center">
        <strong>Globeflight Kenya</strong><br>
        NEXTGEN MALL, 3rd Floor<br>
        Suite 39/40, Mombasa Road
      </div>
    `).openPopup()
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#88C300]" />
        Our Location
      </h3>
      <div ref={mapRef} className="h-48 rounded-xl shadow-lg border border-gray-700 overflow-hidden"></div>
      <div className="flex flex-col gap-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#88C300]" />
          <span>Mon-Fri: 8AM-6PM</span>
        </div>
        <div className="flex items-center gap-2 pl-6">
          <span>Saturday: 9AM-1PM</span>
        </div>
      </div>
    </div>
  )
}

export default FooterMap