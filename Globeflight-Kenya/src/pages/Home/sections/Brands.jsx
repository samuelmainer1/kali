"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Globe, Network, ArrowRight, CheckCircle } from "lucide-react"
import { Link } from "react-router-dom"

export default function Brands() {
  const benefits = [
    "Global reach across 175+ countries",
    "Reliable and verified partners",
    "Seamless international shipping",
    "24/7 worldwide support"
  ]

  return (
    <section className="w-full py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2388C300%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* Decorative Blobs */}
      <div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'linear-gradient(to bottom right, #88C300, #6b9a00)' }}
      />
      <div 
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)' }}
      />

      <div className="container px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/*<div 
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full mb-6"
            style={{
              backgroundColor: 'rgba(136, 195, 0, 0.1)',
              border: '2px solid #88C300'
            }}
          >
            <Network className="w-5 h-5" style={{ color: '#88C300' }} />
            <span className="text-sm font-bold tracking-wide" style={{ color: '#88C300' }}>
              GLOBAL NETWORK
            </span>
          </div>*/}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            GLOBEFLIGHT KENYA <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #88C300, #6b9a00)' }}>NETWORKS</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connecting businesses worldwide through our trusted network of international logistics partners
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card 
              className="p-10 h-full flex flex-col justify-center border-2 shadow-2xl"
              style={{
                background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
                borderColor: '#2563eb'
              }}
            >
              <Globe className="w-16 h-16 text-white mb-6" />
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-relaxed">
                We work with an international and reliable network of global agents
              </h3>
              <p className="text-xl text-blue-100">
                They facilitate our international shipping across all continents, ensuring your cargo reaches any destination safely and on time.
              </p>
            </Card>
          </motion.div>

          {/* Partner Logos Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card 
              className="p-10 h-full flex flex-col justify-center border-2 shadow-2xl"
              style={{
                background: 'linear-gradient(to bottom right, #88C300, #6b9a00)',
                borderColor: '#6b9a00'
              }}
            >
              <div className="grid grid-cols-2 gap-6">
                <div 
                  className="bg-white p-6 rounded-xl flex items-center justify-center hover:scale-105 transition-transform duration-300 shadow-lg"
                >
                  <img
                    src="/infinite.png"
                    alt="Infinite Connection - Global Logistics Partner"
                    className="max-w-full h-auto"
                    style={{ maxHeight: '60px' }}
                  />
                </div>
                <div 
                  className="bg-white p-6 rounded-xl flex items-center justify-center hover:scale-105 transition-transform duration-300 shadow-lg"
                >
                  <img
                    src="/globalink.png"
                    alt="Globalink - International Shipping Network"
                    className="max-w-full h-auto"
                    style={{ maxHeight: '60px' }}
                  />
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/30">
                <p className="text-white text-lg text-center font-semibold">
                  Certified partners in 175+ countries worldwide
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Why Choose Our Network?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-4 p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-[#88C300] hover:shadow-lg transition-all duration-300"
                >
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(136, 195, 0, 0.1)' }}
                  >
                    <CheckCircle className="w-6 h-6" style={{ color: '#88C300' }} />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div 
            className="max-w-4xl mx-auto rounded-3xl p-12 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #88C300 0%, #6b9a00 100%)',
              boxShadow: '0 20px 60px rgba(136, 195, 0, 0.3)'
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Ship Globally?
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join our growing network and experience seamless international logistics
              </p>
              <Link to="/contact-us">
                <Button
                  size="lg"
                  className="bg-white hover:bg-gray-100 text-gray-900 px-10 py-6 rounded-xl font-bold text-lg shadow-2xl group"
                >
                  <span>Join Our Network Today</span>
                  <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
             {/* <p className="mt-6 text-white/80 text-sm">
                No setup fees • Free consultation • 24/7 Support
              </p>*/}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}