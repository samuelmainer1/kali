import React from "react"

const FooterBottom = () => (
  <div className="mt-12 pt-8 border-t border-gray-700">
    <div className="flex flex-col lg:flex-row justify-center items-center gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-400">
        <span>&copy; {new Date().getFullYear()} Globeflight Kenya. All rights reserved.</span>
      </div>
    </div>
  </div>
)

export default FooterBottom