import React from "react"
import { MessageSquare, MapPin, Phone, Mail } from "lucide-react"

const FooterContactInfo = ({ handlePhoneClick }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold flex items-center gap-2">
      <MessageSquare className="w-5 h-5 text-[#88C300]" />
      Contact Info
    </h3>
    <ul className="space-y-4">
      <li className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-[#88C300] mt-1 flex-shrink-0" />
        <span className="text-gray-300">
          NEXTGEN MALL, 3rd Floor, Suite 39/40, Mombasa Road
        </span>
      </li>
      <li className="flex items-center gap-3">
        <Phone className="w-5 h-5 text-[#88C300] flex-shrink-0" />
        <button 
          onClick={() => handlePhoneClick('+254729341277')}
          className="text-gray-300 hover:text-[#88C300] transition-colors duration-300"
        >
          +254 729 341 277
        </button>
      </li>
      <li className="flex items-center gap-3">
        <Mail className="w-5 h-5 text-[#88C300] flex-shrink-0" />
        <a 
          href="mailto:cs@globeflight.co.ke"
          className="text-gray-300 hover:text-[#88C300] transition-colors duration-300"
        >
          cs@globeflight.co.ke
        </a>
      </li>
    </ul>
  </div>
)

export default FooterContactInfo