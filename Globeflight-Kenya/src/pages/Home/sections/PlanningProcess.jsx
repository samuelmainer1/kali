import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Workflow, 
  Target, 
  Zap, 
  TrendingUp,
  Sparkles,
  Shield,
  Users,
  Globe
} from "lucide-react"

const PlanningProcess = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.2 })
  const [activeStep, setActiveStep] = useState(0)

  const processSteps = [
    {
      icon: Target,
      title: "Strategic Analysis",
      description: "Comprehensive assessment of your logistics needs and objectives",
      color: "from-blue-500 to-purple-600",
      bgColor: "from-blue-50 to-purple-50",
      features: ["Market Analysis", "Risk Assessment", "Cost Optimization"],
      stats: { time: "2-3 days", accuracy: "99.5%" }
    },
    {
      icon: Workflow,
      title: "Process Design",
      description: "Custom workflow creation tailored to your business requirements",
      color: "from-purple-500 to-pink-600",
      bgColor: "from-purple-50 to-pink-50",
      features: ["Route Planning", "Resource Allocation", "Timeline Creation"],
      stats: { time: "3-5 days", accuracy: "99.8%" }
    },
    {
      icon: Zap,
      title: "Implementation",
      description: "Seamless execution with real-time monitoring and adjustments",
      color: "from-pink-500 to-red-600",
      bgColor: "from-pink-50 to-red-50",
      features: ["System Integration", "Team Training", "Quality Control"],
      stats: { time: "1-2 weeks", accuracy: "99.9%" }
    },
    {
      icon: TrendingUp,
      title: "Optimization",
      description: "Continuous improvement through data-driven insights",
      color: "from-orange-500 to-yellow-600",
      bgColor: "from-orange-50 to-yellow-50",
      features: ["Performance Metrics", "Feedback Loop", "Scale & Growth"],
      stats: { time: "Ongoing", accuracy: "100%" }
    }
  ]

  const stats = [
    { icon: Users, label: "Happy Clients", value: "10K+", color: "text-blue-600" },
    { icon: Globe, label: "Countries Served", value: "175+", color: "text-green-600" },
    { icon: Shield, label: "Success Rate", value: "99.9%", color: "text-purple-600" },
    { icon: Clock, label: "Avg Delivery", value: "24h", color: "text-orange-600" },
  ]

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Modern Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      </div>

      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute rounded-full top-1/4 -left-48 w-96 h-96 bg-gradient-to-br from-green-200/30 to-blue-200/30 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -25, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute rounded-full bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 space-x-2 rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm border border-green-200/20"
          >
            {/*<Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">OUR PROCESS</span>*/}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold md:text-6xl mt-6 mb-6"
          >
            <span className="text-gray-900">Intelligent </span>
            <span className="text-transparent bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text">
              Planning Process
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl leading-relaxed text-gray-600 max-w-3xl mx-auto"
          >
            Our data-driven approach ensures optimal logistics performance through strategic planning,
            cutting-edge technology, and continuous optimization.
          </motion.p>
        </motion.div>

        {/* Stats Section 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 group-hover:bg-gray-200 transition-colors duration-300">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
          </motion.div>*/}

        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Side - Interactive Process Steps */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.7 + index * 0.1 }}
                onClick={() => setActiveStep(index)}
                className={`cursor-pointer group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                  activeStep === index 
                    ? 'bg-white shadow-2xl scale-[1.02] border-2 border-green-200' 
                    : 'bg-white/70 backdrop-blur-sm hover:bg-white hover:shadow-xl border border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <motion.div
                      animate={activeStep === index ? { scale: 1.1, rotate: 360 } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                    >
                      <step.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    
                    <div className="flex-grow">
                      <h3 className="mb-2 text-xl font-bold text-gray-900">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-gray-600 mb-3">{step.description}</p>
                      
                      {/* Stats for active step */}
                      <AnimatePresence>
                        {activeStep === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex gap-4 mb-4 text-sm"
                          >
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-700">{step.stats.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="font-medium text-gray-700">{step.stats.accuracy} accuracy</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Expandable Features */}
                      <AnimatePresence>
                        {activeStep === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-wrap gap-2"
                          >
                            {step.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 text-xs font-medium text-gray-700 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-200"
                              >
                                {feature}
                              </span>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.div
                      animate={activeStep === index ? { opacity: 1, x: 0 } : { opacity: 0.3, x: 10 }}
                      className="flex-shrink-0"
                    >
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  </div>
                </div>

                {/* Active Indicator */}
                <motion.div
                  className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${step.color}`}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: activeStep === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ originY: 0 }}
                />
              </motion.div>
            ))}

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.1 }}
              className="pt-6"
            >
              <button className="relative px-8 py-4 overflow-hidden font-semibold text-white transition-all shadow-lg group bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl hover:scale-105 hover:shadow-2xl">
                <span className="relative z-10 flex items-center">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-r from-green-600 to-blue-700 group-hover:opacity-100" />
              </button>
            </motion.div>
          </motion.div>

          {/* Right Side - Stable Image with Modern Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Main Image Container - Fixed Position */}
            <div className="relative overflow-hidden shadow-2xl rounded-3xl border border-gray-100">
              <img
                src="/cta1.jpg"
                alt="Advanced Logistics Planning"
                className="object-cover w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Floating Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute p-4 shadow-2xl top-6 right-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-green-100">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Success Rate</p>
                    <p className="text-xl font-bold text-gray-900">99.9%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
                className="absolute p-4 text-white shadow-2xl bottom-6 left-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs opacity-90 font-medium">Average Delivery</p>
                    <p className="text-xl font-bold">24-48 Hours</p>
                  </div>
                </div>
              </motion.div>

              {/* Additional Floating Element */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute p-3 shadow-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xl rounded-full border border-gray-200"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </motion.div>
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute w-40 h-40 rounded-full -top-10 -right-10 bg-gradient-to-br from-green-400/20 to-blue-400/20 blur-3xl" />
            <div className="absolute w-48 h-48 rounded-full -bottom-10 -left-10 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 blur-3xl" />
            
            {/* Subtle Floating Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 opacity-60"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default PlanningProcess