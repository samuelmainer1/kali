'use client'

import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import CallToActionSection from "@/components/CallToActionSection"
import ScrollOnSideSection from "@/components/ScrollOnSideSection"
import { ChevronLeft, ChevronRight, Calendar, Share2, Facebook, Twitter, Linkedin, MapPin, Clock, Phone, Mail, CheckCircle2, Award } from 'lucide-react'
import { getApiImageUrl, handleImageError } from '@/utils/imageUtils'
import { services, getServiceBySlug } from '@/data/services'

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = getServiceBySlug(slug)
  const allServices = services
  const [activeSection, setActiveSection] = useState('')
  const [readingProgress, setReadingProgress] = useState(0)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setReadingProgress(progress)

      const sections = document.querySelectorAll('section')
      let currentActiveSection = ''
      sections.forEach((section) => {
        const sectionTop = section.offsetTop
        const sectionHeight = section.clientHeight
        if (window.scrollY >= sectionTop - 50 && window.scrollY < sectionTop + sectionHeight - 50) {
          currentActiveSection = section.id
        }
      })
      setActiveSection(currentActiveSection)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!service) return (
    <div className="min-h-screen flex items-center justify-center">
      <Helmet>
        <title>Service not found | Globeflight Kenya</title>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://globeflight.co.ke/services" />
        <meta property="og:url" content="https://globeflight.co.ke/services" />
      </Helmet>
      <div className="text-center">
        <p className="text-xl text-gray-800">Service not found.</p>
        <Link to="/services" className="mt-4 inline-block text-blue-600">Back to services</Link>
      </div>
    </div>
  )

  const currentIndex = allServices.findIndex(s => s.slug === service.slug)
  const previousService = currentIndex > 0 ? allServices[currentIndex - 1] : null
  const nextService = currentIndex < allServices.length - 1 ? allServices[currentIndex + 1] : null
  const relatedServices = allServices
    .filter(s => s.slug !== service.slug && s.id !== previousService?.id && s.id !== nextService?.id)
    .slice(0, 3)

  const galleryImages = Array.isArray(service.galleryUrls) && service.galleryUrls.length > 0
    ? service.galleryUrls
    : service.imageUrl ? [service.imageUrl] : []

  const faqs = Array.isArray(service.faq) && service.faq.length > 0 ? service.faq : []

  const tableOfContents = [
    { id: 'overview', title: 'Overview' },
    { id: 'details', title: 'Service Details' },
    { id: 'gallery', title: 'Photo Gallery' },
    { id: 'faq', title: 'FAQ' },
    { id: 'related', title: 'Related Services' },
  ];

  const slugify = (str) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "description": service.description,
    "provider": {
      "@type": "Organization",
      "name": "Globeflight Kenya",
      "url": "https://globeflight.co.ke",
      "logo": "https://globeflight.co.ke/logo.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+254729341277",
        "contactType": "customer service",
        "areaServed": "Worldwide",
        "availableLanguage": ["English", "Swahili", "French", "Arabic"]
      }
    },
    "areaServed": [
      { "@type": "Place", "name": "Worldwide" },
      { "@type": "Continent", "name": "Africa" },
      { "@type": "Country", "name": "Kenya" },
      { "@type": "Continent", "name": "Europe" },
      { "@type": "Continent", "name": "Asia" },
      { "@type": "Continent", "name": "North America" }
    ],
    "serviceType": ["International Logistics", "Global Shipping", "Freight Forwarding"],
    "image": service.imageUrl,
    "url": `https://globeflight.co.ke/services/${slug}`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://globeflight.co.ke" },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://globeflight.co.ke/services" },
      { "@type": "ListItem", "position": 3, "name": service.title, "item": `https://globeflight.co.ke/services/${slug}` }
    ]
  };

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  const contactInfo = [
    { icon: MapPin, label: "Location", value: "NEXTGEN MALL, 3rd Floor, Suite 39/40, Mombasa Road", type: "address" },
    { icon: Clock, label: "Processing Time", value: "30min - 1hour", type: "text" },
    { icon: Phone, label: "Call Us", value: "+254 729 341 277", type: "tel" },
    { icon: Mail, label: "Email", value: "cs@globeflight.co.ke", type: "email" },
  ];

  return (
    <>
      <Helmet>
        <title>{service.title} | International Logistics Services - Globeflight Kenya</title>
        <meta name="description" content={`${service.description || service.shortDescription}. Professional international ${service.title} services from Kenya to worldwide destinations. Global logistics solutions by Globeflight Kenya.`} />
        <meta name="keywords" content={`${service.title}, ${service.title} Kenya, international ${service.title}, global ${service.title} services, ${service.title} Africa, ${service.title} worldwide, Globeflight ${service.title}, Kenya to world ${service.title}, Africa logistics, international shipping ${service.title}`} />
        
        <meta property="og:title" content={`${service.title} - Globeflight Kenya`} />
        <meta property="og:description" content={service.description || service.shortDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://globeflight.co.ke/services/${slug}`} />
        <meta property="og:image" content={service.imageUrl} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${service.title} - Globeflight Kenya`} />
        <meta name="twitter:description" content={service.shortDescription || service.description} />
        <meta name="twitter:image" content={service.imageUrl} />
        
        <link rel="canonical" href={`https://globeflight.co.ke/services/${slug}`} />
        
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-36">
        {/* Reading Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-100 z-50">
          <div 
            className="h-full transition-all duration-300 ease-out"
            style={{ 
              width: `${readingProgress}%`,
              backgroundImage: 'linear-gradient(to right, #3B82F6, #88C300)'
            }}
            role="progressbar"
            aria-valuenow={readingProgress}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>

        {/* Breadcrumb Navigation */}
        <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
          <div className="container mx-auto px-4 py-4">
            <ol className="flex items-center space-x-2 text-sm">
              <li><Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link></li>
              <li><span className="text-gray-400">/</span></li>
              <li><Link to="/services" className="text-gray-600 hover:text-blue-600 transition-colors">Services</Link></li>
              <li><span className="text-gray-400">/</span></li>
              <li className="text-blue-600 font-semibold" aria-current="page">{service.title}</li>
            </ol>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sticky Table of Contents */}
            <aside className="lg:w-1/4" role="navigation" aria-label="Table of contents">
              <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Contents
                </h2>
                <ul className="space-y-2">
                  {tableOfContents.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block py-3 px-4 rounded-xl transition-all duration-200 ${
                          activeSection === item.id
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                        aria-current={activeSection === item.id ? 'location' : undefined}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:w-3/4">
              <article itemScope itemType="https://schema.org/Service">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <header className="mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight" itemProp="name">
                      {service.title}
                    </h1>
                    <p className="text-xl text-gray-600">International Logistics Services</p>
                  </header>
                  
                  <section id="overview" className="mb-16">
                    {service.imageUrl && (
                      <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8">
                        <img
                          src={getApiImageUrl(service.imageUrl)}
                          alt={`${service.title} services by Globeflight Kenya`}
                          className="w-full h-96 object-cover"
                          itemProp="image"
                          onError={handleImageError}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      </div>
                    )}
                    <div itemProp="description" className="prose prose-lg max-w-none">
                      <p className="text-xl text-gray-700 leading-relaxed mb-6">
                        {service.shortDescription}
                      </p>
                      <p className="text-lg text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                    {service.keyBenefits && service.keyBenefits.length > 0 && (
                      <div className="mt-8 rounded-2xl p-8" style={{ backgroundImage: 'linear-gradient(to right, #EBF5FF, #F0FADC)' }}>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                          <CheckCircle2 className="h-6 w-6" style={{ color: '#88C300' }} />
                          Key Benefits of Our {service.title} Service
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {service.keyBenefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-3 text-gray-700">
                              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#88C300' }} />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>

                  <section id="details" className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Us for {service.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {contactInfo.map((contact, idx) => (
                        <Card key={idx} className="hover:shadow-lg transition-shadow border-2 border-gray-100 rounded-2xl">
                          <CardContent className="flex items-center p-6">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4">
                              <contact.icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">{contact.label}</h3>
                              <p className="text-gray-600">{contact.value}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>

                  <section id="gallery" className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">{service.title} Photo Gallery</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {galleryImages.length > 0 ? (
                        galleryImages.map((imgUrl, i) => (
                          <div key={i} className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group">
                            <img
                              src={getApiImageUrl(imgUrl)}
                              alt={`${service.title} service image ${i + 1} - Globeflight Kenya`}
                              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                              onError={handleImageError}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-gray-400 text-center py-12">No gallery images available.</div>
                      )}
                    </div>
                  </section>

                  <section id="faq" className="mb-16" itemScope itemType="https://schema.org/FAQPage">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">
                      Frequently Asked Questions about {service.title}
                    </h2>
                    {faqs.length > 0 ? (
                      <Accordion type="single" collapsible className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        {faqs.map((faq, idx) => (
                          <AccordionItem 
                            value={`item-${idx}`} 
                            key={idx}
                            className="border-b border-gray-200 last:border-0"
                            itemScope 
                            itemProp="mainEntity" 
                            itemType="https://schema.org/Question"
                          >
                            <AccordionTrigger className="px-6 py-5 hover:bg-gray-50 text-left font-semibold" itemProp="name">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent 
                              className="px-6 pb-5 text-gray-600"
                              itemScope 
                              itemProp="acceptedAnswer" 
                              itemType="https://schema.org/Answer"
                            >
                              <span itemProp="text">{faq.answer}</span>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-gray-400 text-center py-12 bg-gray-50 rounded-2xl">No FAQs available for this service.</div>
                    )}
                  </section>

                  <section id="related" className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Related {service.title} Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {relatedServices.length > 0 ? relatedServices.map((related) => (
                        <Card key={related.id} className="hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 rounded-2xl overflow-hidden group">
                          {related.imageUrl && (
                            <div className="relative overflow-hidden">
                              <img
                                src={getApiImageUrl(related.imageUrl)}
                                alt={`${related.title} - Related service to ${service.title}`}
                                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                                onError={handleImageError}
                              />
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="text-lg mb-2 group-hover:text-blue-600 transition-colors">{related.title}</CardTitle>
                            <p className="text-sm text-gray-600 line-clamp-2">{related.shortDescription || related.description?.slice(0, 100)}...</p>
                          </CardHeader>
                          <CardContent>
                            <Link 
                              to={`/services/${related.slug || slugify(related.title)}`} 
                              aria-label={`Learn more about ${related.title}`}
                            >
                              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl">
                                Learn More
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      )) : (
                        <div className="col-span-3 text-gray-400 text-center py-12">No related services found.</div>
                      )}
                    </div>
                  </section>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-12 p-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                      <Button 
                        onClick={() => setIsBookingModalOpen(true)} 
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-6 rounded-xl font-bold"
                        aria-label={`Book ${service.title} service now`}
                      >
                        <Calendar className="mr-2 h-5 w-5" /> Book {service.title}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => setIsSharingModalOpen(true)}
                        className="px-8 py-6 rounded-xl font-bold border-2"
                        aria-label={`Share ${service.title} service`}
                      >
                        <Share2 className="mr-2 h-5 w-5" /> Share
                      </Button>
                    </div>
                    <nav className="flex gap-4" aria-label="Service navigation">
                      {previousService && (
                        <Link to={`/services/${previousService.slug || slugify(previousService.title)}`}>
                          <Button variant="outline" size="lg" className="rounded-xl border-2">
                            <ChevronLeft className="mr-2 h-5 w-5" /> Previous
                          </Button>
                        </Link>
                      )}
                      {nextService && (
                        <Link to={`/services/${nextService.slug || slugify(nextService.title)}`}>
                          <Button variant="outline" size="lg" className="rounded-xl border-2">
                            Next <ChevronRight className="ml-2 h-5 w-5" />
                          </Button>
                        </Link>
                      )}
                    </nav>
                  </div>
                </motion.div>
              </article>
            </main>
          </div>
        </div>

        <CallToActionSection />
        <ScrollOnSideSection />

        {/* Booking Modal */}
        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Book {service.title} Service</DialogTitle>
              <DialogDescription>
                Fill out the form below and our team will contact you within 24 hours to discuss your {service.title} requirements.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4 mt-4">
              <Input placeholder="Your Full Name" className="h-12 rounded-xl" required />
              <Input type="email" placeholder="Your Email Address" className="h-12 rounded-xl" required />
              <Input type="tel" placeholder="Your Phone Number" className="h-12 rounded-xl" required />
              <Textarea placeholder="Tell us about your shipping requirements..." className="rounded-xl min-h-[120px]" required />
              <DialogFooter className="mt-6">
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12 rounded-xl font-bold">
                  Submit Inquiry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sharing Modal */}
        <Dialog open={isSharingModalOpen} onOpenChange={setIsSharingModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Share {service.title} Service</DialogTitle>
              <DialogDescription>
                Share this service with others who might benefit from our {service.title} solutions.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button 
                variant="outline"
                size="lg"
                className="justify-start h-14 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              >
                <Facebook className="mr-3 h-5 w-5 text-blue-600" /> Share on Facebook
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="justify-start h-14 rounded-xl border-2 hover:bg-sky-50 hover:border-sky-300"
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${service.title} services by Globeflight Kenya`)}`, '_blank')}
              >
                <Twitter className="mr-3 h-5 w-5 text-sky-600" /> Share on Twitter
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="justify-start h-14 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
              >
                <Linkedin className="mr-3 h-5 w-5 text-blue-700" /> Share on LinkedIn
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}