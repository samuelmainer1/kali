'use client'

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Send } from "lucide-react"

export default function LearnMoreSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    // Here you would typically send the email and message to your backend
    console.log("Submitted:", { email, message })
    setIsSubmitting(false)
    setIsModalOpen(false)
    setEmail("")
    setMessage("")
  }

  return (
    <div className="my-16">
      <div className="bg-gradient-to-br from-[#88C300] to-[#6ea000] rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-0">
          {/* Content Side */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Expert Insights Available
              </div>
              
              <h2 className="text-white font-bold text-3xl md:text-4xl leading-tight">
                Want to Learn More About This Topic?
              </h2>
              
              <p className="text-white/90 text-lg leading-relaxed">
                Connect with our logistics experts to get deeper insights, ask questions, and explore how we can support your business needs.
              </p>
              
              <div className="space-y-4 pt-2">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/95 text-gray-900 placeholder:text-gray-500 border-0 h-12 rounded-lg shadow-md focus:ring-2 focus:ring-white"
                />
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full md:w-auto bg-white text-[#88C300] hover:bg-gray-50 font-semibold py-6 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Get in Touch
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Quick Response
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Expert Guidance
                </div>
              </div>
            </div>
          </div>

          {/* Image Side */}
          <div className="relative h-64 md:h-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6ea000]/20 to-transparent"></div>
            <img 
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop" 
              alt="Professional consultation" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#88C300]/40 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Get in Touch</DialogTitle>
            <DialogDescription className="text-gray-600">
              Share your questions or comments and our team will respond within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="h-12 rounded-lg border-gray-300 focus:border-[#88C300] focus:ring-[#88C300]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-semibold text-gray-700">
                  Your Message
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you'd like to know more about..."
                  className="min-h-[120px] rounded-lg border-gray-300 focus:border-[#88C300] focus:ring-[#88C300] resize-none"
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#88C300] hover:bg-[#6ea000] text-white rounded-lg px-6"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}