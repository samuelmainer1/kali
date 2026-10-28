"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Copy,
  CheckCircle,
  Mail,
  Phone,
} from "lucide-react"
import { faqs } from "@/constants/contactpage"
import { Helmet } from "react-helmet-async"
import React from "react"

// Define FAQ categories
const categories = [
  { id: "all", name: "All Questions" },
  { id: "shipping", name: "Shipping" },
  { id: "services", name: "Services" },
  { id: "safety", name: "Safety & Security" },
  { id: "logistics", name: "Logistics" },
]

// Assign categories to FAQs
const categorizedFaqs = faqs.map((faq) => {
  if (faq.category) return faq
  let category = "all"
  const q = faq.question.toUpperCase()
  if (
    q.includes("TRANSPORT") ||
    q.includes("SHIP") ||
    q.includes("TRACK") ||
    q.includes("SHIPMENT") ||
    q.includes("FREIGHT")
  ) {
    category = "shipping"
  } else if (
    q.includes("SERVICES") ||
    q.includes("OFFER") ||
    q.includes("WAREHOUSING") ||
    q.includes("STORAGE")
  ) {
    category = "services"
  } else if (q.includes("SAFETY") || q.includes("SECURE") || q.includes("SAFE")) {
    category = "safety"
  } else if (
    q.includes("EAST AFRICA") ||
    q.includes("LOGISTICS") ||
    q.includes("DELIVERY") ||
    q.includes("REGIONS")
  ) {
    category = "logistics"
  }
  return { ...faq, category }
})

const Faq = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [copiedIndex, setCopiedIndex] = useState(null)

  const filteredFaqs = categorizedFaqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const copyToClipboard = (idx, question, answer) => {
    const textToCopy = `Q: ${question}\nA: ${answer}`
    navigator.clipboard.writeText(textToCopy)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <>
      <Helmet>
        <title>Contact Us | Frequently Asked Questions | Globeflight Kenya</title>
        <meta name="description" content="Contact Globeflight Kenya for logistics, shipping, and courier quotes. The same page answers common questions on safety, logistics, importer of record, freight, and customs." />
        <meta name="keywords" content="Globeflight Kenya FAQ, international logistics FAQ, global shipping questions, international freight charges, worldwide cargo tracking, global warehousing, international delivery schedules, Africa to world shipping FAQ, Kenya international logistics questions, customs clearance FAQ, international shipping restrictions" />
        <meta property="og:title" content="Contact Us | Frequently Asked Questions | Globeflight Kenya" />
        <meta property="og:description" content="Contact Globeflight Kenya for logistics, shipping, and courier quotes. The same page answers common questions on safety, logistics, importer of record, freight, and customs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://globeflight.co.ke/contact-us" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Us | Frequently Asked Questions | Globeflight Kenya" />
        <meta name="twitter:description" content="Contact Globeflight Kenya for logistics, shipping, and courier quotes. The same page answers common questions on safety, logistics, importer of record, freight, and customs." />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map((faq) => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer,
                "author": {
                  "@type": "Organization",
                  "name": "Globeflight Kenya"
                }
              }
            }))
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Globeflight Kenya",
            "url": "https://globeflight.co.ke",
            "logo": "https://globeflight.co.ke/logo.png",
            "description": "International logistics and shipping company connecting Kenya and Africa to the world",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+254 729 341 277",
              "contactType": "customer service",
              "areaServed": "Worldwide",
              "availableLanguage": ["English", "Swahili", "French", "Arabic", "Chinese", "Spanish"]
            }
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://globeflight.co.ke"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Contact Us",
                "item": "https://globeflight.co.ke/contact-us"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "FAQs",
                "item": "https://globeflight.co.ke/contact-us"
              }
            ]
          })}
        </script>
      </Helmet>
      
      <section className="py-20 bg-white" id="faq" itemScope itemType="https://schema.org/FAQPage">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg md:text-xl text-gray-600">
                Find answers to common questions about our international logistics services
              </p>
            </motion.div>
          </div>

          {/* Search and Category Filters */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="faq-search"
                  type="text"
                  placeholder="Search for answers..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-[#88C300] focus:ring-[#88C300] rounded-xl"
                  aria-label="Search frequently asked questions"
                />
              </div>

              {/* Category Tabs */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <TabsList className="w-full grid grid-cols-5 gap-2 bg-gray-100 p-2 rounded-xl h-auto" role="navigation" aria-label="FAQ Categories">
                  {categories.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="px-4 py-3 rounded-lg font-semibold text-sm data-[state=active]:bg-[#88C300] data-[state=active]:text-white transition-all"
                      aria-label={`Filter by ${cat.name}`}
                    >
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-4xl mx-auto">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl">
                <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg mb-2">No questions found matching your search</p>
                <p className="text-gray-500">Try different keywords or browse all categories</p>
                <Button
                  onClick={() => setSearchTerm("")}
                  className="mt-6 bg-[#88C300] hover:bg-[#6ea000]"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Accordion 
                  type="single" 
                  collapsible 
                  className="space-y-4"
                  defaultValue={filteredFaqs[0]?.question}
                >
                  {filteredFaqs.map((faq, idx) => (
                    <AccordionItem 
                      key={idx} 
                      value={faq.question} 
                      className="border-2 border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
                      itemScope 
                      itemProp="mainEntity" 
                      itemType="https://schema.org/Question"
                    >
                      <AccordionTrigger 
                        className="flex justify-between items-center w-full px-6 py-5 text-lg font-semibold text-gray-900 hover:text-[#88C300] hover:bg-gray-50 transition-colors text-left"
                        itemProp="name"
                      >
                        <span className="pr-4">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent 
                        className="px-6 pb-6 pt-2 text-gray-700 text-base bg-white border-t border-gray-100"
                        itemScope 
                        itemProp="acceptedAnswer" 
                        itemType="https://schema.org/Answer"
                      >
                        <div itemProp="text" className="space-y-3">
                          {faq.answer.split('\n').map((paragraph, pIdx) => (
                            <p key={pIdx} className="leading-relaxed">
                              {paragraph.trim()}
                            </p>
                          ))}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="text-sm text-gray-500 font-medium">
                            Was this helpful?
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(idx, faq.question, faq.answer)}
                            className="text-gray-600 hover:text-[#88C300] hover:bg-gray-50"
                            title="Copy question and answer"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2 text-[#88C300]" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            )}
          </div>
          
          {/* Call to Action Section */}
          <motion.div 
            className="mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-gradient-to-br from-[#88C300] to-[#6ea000] rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-8 py-12 text-center text-white">
                <h3 className="text-3xl font-bold mb-4">
                  Still Have Questions?
                </h3>
                <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                  Can't find the answer you're looking for? Our international logistics experts are ready to assist you with personalized support.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    asChild
                    size="lg"
                    className="bg-white text-[#88C300] hover:bg-gray-100 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg"
                  >
                    <a href="mailto:cs@globeflight.co.ke" className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Us
                    </a>
                  </Button>
                  <Button 
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-xl"
                  >
                    <a href="tel:+254729341277" className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Call +254 729 341 277
                    </a>
                  </Button>
                </div>
                
                {/* Additional Info */}
                <div className="mt-8 pt-8 border-t border-white/20">
                  <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/90">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Response within 24 hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Expert support team</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Available worldwide</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default Faq