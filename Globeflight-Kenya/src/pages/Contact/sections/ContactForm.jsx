'use client'

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Send, MapPin, Phone, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/lib/leafletIconFix'

const contactFormSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  mobileNumber: yup.string().required("Mobile number is required"),
  services: yup.array().of(yup.string()),
  inquiryType: yup.string().required("Please select an inquiry type"),
  message: yup.string().required("Message is required"),
})

const services = [
  { id: "airFreight", label: "Air Freight" },
  { id: "seaFreight", label: "Sea Freight" },
  { id: "customsClearance", label: "Customs Clearance" },
  { id: "warehousing", label: "Warehousing" },
  { id: "ecommerce", label: "E-commerce Logistics" },
  { id: "roadTransport", label: "Road Transport" },
  { id: "projectCargo", label: "Project Cargo" },
  { id: "logistics", label: "Logistics" },
  { id: "safetySecurity", label: "Safety & Security" },
  { id: "importerOfRecord", label: "Importer of Record (IOR)" },
]

const inquiryTypes = [
  { id: "quote", label: "Request a Quote" },
  { id: "feedback", label: "General Feedback" },
  { id: "support", label: "Customer Support" },
]

const CONTACT_EMAIL = "cs@globeflight.co.ke"
const CONTACT_PHONE = "+254 729 341 277"
const CONTACT_PHONE_TEL = "+254729341277"

const offices = [
  {
    country: "Kenya (HQ)",
    address: "NEXTGEN MALL, 3rd Floor, Suite 39/40, Mombasa Road, Nairobi",
    phone: CONTACT_PHONE,
    email: CONTACT_EMAIL,
    coordinates: [-1.3195, 36.8970]
  },
  {
    country: "USA",
    address: "Queens NY 11413",
    phone: CONTACT_PHONE,
    email: CONTACT_EMAIL,
    coordinates: [40.6782, -73.7949]
  },
  {
    country: "South Africa",
    address: "Kempton Park",
    phone: CONTACT_PHONE,
    email: CONTACT_EMAIL,
    coordinates: [-26.1087, 28.2322]
  },
  {
    country: "China",
    address: "Guang Dong Sheng 510091",
    phone: CONTACT_PHONE,
    email: CONTACT_EMAIL,
    coordinates: [23.1291, 113.2644]
  },
  {
    country: "UK",
    address: "London",
    phone: CONTACT_PHONE,
    email: CONTACT_EMAIL,
    coordinates: [51.5074, -0.1278]
  }
]

export default function GlobalflightContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const mapRef = useRef(null)
  const [activeOffice, setActiveOffice] = useState("Kenya (HQ)")
  const form = useForm({
    resolver: yupResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      mobileNumber: "",
      services: [],
      inquiryType: "",
      message: "",
    },
    mode: "onSubmit",
  })

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([0, 0], 2)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current)
    }

    const markers = offices.map(office => {
      const marker = L.marker(office.coordinates)
        .addTo(mapRef.current)
        .bindPopup(`<b>${office.country}</b><br>${office.address}`)
      
      if (office.country === activeOffice) {
        marker.openPopup()
        mapRef.current.setView(office.coordinates, 5)
      }
      
      return marker
    })

    return () => {
      markers.forEach(marker => marker.remove())
    }
  }, [activeOffice])

  async function onSubmit(values) {
    setIsSubmitting(true)
    try {
      console.log("Submitting form with values:", values)

      // Detect environment and use appropriate API URL
      const apiEndpoint = "/admin/api/contacts/public";

      console.log("Using API endpoint:", apiEndpoint)

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response text:", errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: `HTTP ${response.status}: ${errorText}` }
        }
        throw new Error(errorData.message || `Failed to send message. Status: ${response.status}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      toast({
        title: "Message Sent Successfully!",
        description: data.message || "Thank you for contacting Globeflight Worldwide Express. We'll get back to you shortly.",
        duration: 5000,
      })
      form.reset()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "There was a problem sending your message. Please try again or contact us directly.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-20 bg-gray-50">
      <div className="container px-4 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Contact Form</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fill out the form below with detailed information for a comprehensive response
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Contact Form */}
          <Card className="lg:col-span-2 shadow-xl border-0">
            <CardHeader className="bg-[#88C300] text-white rounded-t-xl">
              <CardTitle className="text-2xl font-bold">Send Us a Detailed Message</CardTitle>
              <CardDescription className="text-white/90">
                Complete the form and our team will respond within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Clinton John" 
                            {...field} 
                            className="h-12 border-gray-300 focus:border-[#88C300] focus:ring-[#88C300]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="john.doe@example.com" 
                              {...field} 
                              className="h-12 border-gray-300 focus:border-[#88C300] focus:ring-[#88C300]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Mobile Number</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="+254 700 000000" 
                              {...field} 
                              className="h-12 border-gray-300 focus:border-[#88C300] focus:ring-[#88C300]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Inquiry Type */}
                  <FormField
                    control={form.control}
                    name="inquiryType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-semibold">How can we help you?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-3"
                          >
                            {inquiryTypes.map((type) => (
                              <FormItem className="flex items-center space-x-3 space-y-0 bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors" key={type.id}>
                                <FormControl>
                                  <RadioGroupItem value={type.id} className="border-[#88C300]" />
                                </FormControl>
                                <FormLabel className="font-medium cursor-pointer flex-1">
                                  {type.label}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Services */}
                  <Controller
                    name="services"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Services of Interest</FormLabel>
                        <FormDescription className="text-gray-600">
                          Select all services you're interested in (optional)
                        </FormDescription>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                          {services.map((service) => (
                            <FormItem
                              key={service.id}
                              className="flex flex-row items-start space-x-3 space-y-0 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), service.id]
                                      : field.value?.filter((value) => value !== service.id) || [];
                                    field.onChange(updatedValue);
                                  }}
                                  className="border-[#88C300]"
                                />
                              </FormControl>
                              <FormLabel className="font-medium cursor-pointer text-sm">
                                {service.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Message */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Your Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide details about your inquiry..."
                            className="resize-none border-gray-300 focus:border-[#88C300] focus:ring-[#88C300]"
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full bg-[#88C300] hover:bg-[#6ea000] text-white py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Sidebar - Office Locations */}
          <div className="space-y-6">
            {/* Global Offices */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gray-900 text-white rounded-t-xl">
                <CardTitle className="text-xl font-bold">Our Global Offices</CardTitle>
                <CardDescription className="text-gray-300">
                  Connect with us worldwide
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="Kenya (HQ)" onValueChange={(value) => setActiveOffice(value)}>
                  <TabsList className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                    {offices.slice(0, 4).map((office) => (
                      <TabsTrigger 
                        key={office.country} 
                        value={office.country} 
                        className="text-sm data-[state=active]:bg-[#88C300] data-[state=active]:text-white rounded-md"
                      >
                        {office.country.split(' ')[0]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {offices.map((office) => (
                    <TabsContent key={office.country} value={office.country} className="mt-6">
                      <div className="space-y-4">
                        <h4 className="font-bold text-lg text-gray-900">{office.country}</h4>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[#88C300] flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{office.address}</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-[#88C300] flex-shrink-0" />
                            <a href={`tel:${CONTACT_PHONE_TEL}`} className="text-sm text-[#88C300] hover:underline font-medium">
                              {office.phone}
                            </a>
                          </li>
                          <li className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-[#88C300] flex-shrink-0" />
                            <a href={`mailto:${office.email}`} className="text-sm text-[#88C300] hover:underline font-medium">
                              {office.email}
                            </a>
                          </li>
                        </ul>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg font-bold text-gray-900">Global Network</CardTitle>
                <CardDescription>Locations around the world</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div id="map" className="h-80 w-full rounded-b-xl"></div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-[#88C300] to-[#6ea000] text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link to="/services" className="block text-white/90 hover:text-white font-medium transition-colors">
                    → Our Services
                  </Link>
                  <Link to="/track" className="block text-white/90 hover:text-white font-medium transition-colors">
                    → Track Shipment
                  </Link>
                  <Link to="/about-us" className="block text-white/90 hover:text-white font-medium transition-colors">
                    → About Us
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}