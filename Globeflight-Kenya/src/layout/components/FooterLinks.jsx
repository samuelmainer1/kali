import React from "react"
import { Link } from "react-router-dom"
import { Globe } from "lucide-react"

const FooterLinks = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold flex items-center gap-2">
      <Globe className="w-5 h-5 text-[#88C300]" />
      Quick Links
    </h3>
    <ul className="space-y-3">
      {[
        { name: "About Us", path: "/about-us" },
        { name: "Our Services", path: "/services" },
        { name: "Track Shipment", path: "/track" },
        { name: "Contact Us", path: "/contact-us" },
        { name: "Blog", path: "/blog" },
        { name: "Careers", path: "/jobs" }
      ].map((link) => (
        <li key={link.path}>
          <Link 
            to={link.path} 
            className="text-gray-300 hover:text-[#88C300] transition-colors duration-300 flex items-center gap-2 group"
          >
            <span className="w-1 h-1 bg-[#88C300] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default FooterLinks