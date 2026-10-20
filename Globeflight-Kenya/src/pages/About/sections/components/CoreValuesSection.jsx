import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Target, Lightbulb, Heart } from 'lucide-react'

const CoreValuesSection = () => {
  const coreValues = [
    {
      icon: Target,
      title: "OUR VISION",
      description: "To be the leading independent logistics company, offering value-added total cargo solutions for corporates, SMEs & developing market sectors, growing our market share in Kenya and East Africa.",
      gradient: "from-green-600 to-emerald-600",
      iconBg: "bg-green-600"
    },
    {
      icon: Lightbulb,
      title: "OUR MISSION",
      description: "To be recognized as a responsible organization, providing precise, prompt, and affordable services, keeping in tune with market needs and utilizing the latest technology to exceed client expectations.",
      gradient: "from-blue-600 to-cyan-600",
      iconBg: "bg-blue-600"
    },
    {
      icon: Heart,
      title: "CORE VALUES",
      description: "Reliability, Integrity, Efficiency, Innovation & Professionalism - the pillars that guide every decision we make and every service we deliver.",
      gradient: "from-emerald-600 to-teal-600",
      iconBg: "bg-emerald-600"
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-6 mb-24 md:grid-cols-3">
      {coreValues.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.15 }}
          className="group"
        >
          <Card className="relative h-full overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm hover:shadow-lg bg-white">
            <CardContent className="relative p-8">
              <div className={`inline-flex p-3 rounded-lg ${item.iconBg} mb-4`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <h4 className="mb-4 text-xl font-bold text-gray-900">{item.title}</h4>
              <p className="text-base leading-relaxed text-gray-600">{item.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default CoreValuesSection