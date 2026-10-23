import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const WhyChooseUsSection = ({ setSelectedImage }) => {
  const whyChooseUs = [
    {
      title: "Extensive Global Network",
      description: "Members of KGCHA with established networks across Africa and beyond. Our extensive network in East Africa enables us to reach key markets and connect businesses efficiently.",
      features: ["Regional Expertise", "24/7 Support", "Real-time Tracking"]
    },
    {
      title: "Industry Experience",
      description: "Years of experience in the logistics industry have enabled us to develop strong relationships and gain in-depth knowledge of the East African market dynamics.",
      features: ["Market Expertise", "Local Knowledge", "Proven Track Record"]
    },
    {
      title: "Authorized Economic Operator",
      description: "Our sister company, UNION GREEN LOGISTICS LTD, handles all customs brokerage with open communication throughout your journey, ensuring compliance and efficiency.",
      features: ["Customs Brokerage", "Open Communication", "Full Compliance"]
    },
    {
      title: "End-to-End Solutions",
      description: "From planning to warehousing, our comprehensive services cover every aspect of the distribution process, providing seamless logistics management.",
      features: ["Complete Solution", "Warehousing", "Distribution"]
    }
  ]

  const whyChooseUsImages = [
    '/3.jpg',
    '/1.jpg',
    '/2.jpg',
    '/profile2.jpg',
  ]

  return (
    <div className="space-y-16">
      <div className="text-center mb-12">
        {/*<motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-green-700 bg-green-100 rounded-full"
        >
          Why Choose Us
        </motion.div>*/}
        <h2 className="text-3xl font-bold md:text-5xl mb-4">
          <span className="text-gray-900">Your Trusted Logistics Partner</span>
        </h2>
        <p className="text-lg leading-relaxed text-gray-600 max-w-2xl mx-auto">
          Experience reliable, efficient, and professional logistics solutions tailored to your business needs.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
        {whyChooseUs.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group hover:border-green-300"
          >
            {/* Image */}
            <div className="w-full h-64 md:h-72 lg:h-80 overflow-hidden relative">
              <img
                src={whyChooseUsImages[idx]}
                alt={item.title}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            {/* Content */}
            <div className="p-8 lg:p-10">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">{item.title}</h3>
              <p className="text-base lg:text-lg text-gray-600 mb-6 leading-relaxed">{item.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {item.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-full border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    {feature}
                  </span>
                ))}
              </div>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-green-600 font-semibold text-lg hover:text-green-700 transition-colors group/link"
              >
                Learn More
                <ArrowRight className="w-5 h-5 group-hover/link:translate-x-2 transition-transform" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default WhyChooseUsSection