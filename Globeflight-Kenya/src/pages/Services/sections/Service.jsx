'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowRight, Star, TrendingUp, Award, Users, CheckCircle2 } from 'lucide-react';
import { getApiImageUrl, handleImageError } from '@/utils/imageUtils';
import { services } from '@/data/services';

export default function Service() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const featuredService = services.find((service) => service.featured) || services[0] || null;

  // Filter services by search/category
  const filteredServices = services.filter(service => {
    const title = service.title || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.shortDescription || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const categoryName = service.category || 'Uncategorized';
    return matchesSearch && (selectedCategory === 'all' || categoryName === selectedCategory);
  });

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category || 'Uncategorized')))];

  const openModal = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const slugify = (str) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  // Generate structured data for services
  const generateServiceSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Globeflight Kenya International Logistics Services",
      "description": "Comprehensive international logistics and shipping services connecting Kenya and Africa to the world. Global air freight, sea freight, warehousing, and customs clearance solutions.",
      "numberOfItems": filteredServices.length,
      "itemListElement": filteredServices.map((service, index) => ({
        "@type": "Service",
        "position": index + 1,
        "name": service.title,
        "description": service.shortDescription || service.description,
        "provider": {
          "@type": "Organization",
          "name": "Globeflight Kenya",
          "url": "https://globeflight.co.ke"
        },
        "areaServed": [
          { "@type": "Place", "name": "Worldwide" },
          { "@type": "Continent", "name": "Africa" },
          { "@type": "Continent", "name": "Europe" },
          { "@type": "Continent", "name": "Asia" },
          { "@type": "Continent", "name": "North America" },
          { "@type": "Continent", "name": "South America" }
        ],
        "serviceType": ["International Shipping", "Global Logistics", "Freight Forwarding"],
        "url": `https://globeflight.co.ke/services/${service.slug || slugify(service.title)}`,
        "image": service.imageUrl
      }))
    };
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://globeflight.co.ke" },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://globeflight.co.ke/services" }
    ]
  };

  {/*const trustStats = [
    { icon: Users, value: "5,000+", label: "Happy Clients" },
    { icon: TrendingUp, value: "99.8%", label: "On-Time Delivery" },
    { icon: Award, value: "25+", label: "Years Experience" },
  ];*/}

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(generateServiceSchema())}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <header className="text-center mb-16 max-w-4xl mx-auto">
            {/*<div className="inline-block mb-6">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                GLOBAL LOGISTICS SOLUTIONS
              </span>
            </div>*/}
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              International <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #3B82F6, #88C300)' }}>Logistics Services</span>
            </h2>
            <h2 className="text-xl text-gray-600 leading-relaxed">
              Fast, reliable, and cost-effective shipping from Kenya to anywhere in the world. 
              Connecting Africa to Europe, Asia, Americas, and beyond.
            </h2>
          </header>

          {/* Trust Stats 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
            {trustStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>*/}

          {/* Featured Service */}
          {featuredService && (
            <section className="mb-20" aria-label="Featured Service" itemScope itemType="https://schema.org/Service">
              <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundImage: 'linear-gradient(to right, #3B82F6, #88C300)' }}>
                <div className="md:flex">
                  <div className="md:w-1/2 relative min-h-[400px]">
                    <img
                      src={getApiImageUrl(featuredService.imageUrl)}
                      alt={`${featuredService.title} - Featured logistics service by Globeflight Kenya`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      itemProp="image"
                      onError={handleImageError}
                    />
                    <div className="absolute top-6 left-6">
                      <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                        <Star className="h-4 w-4 fill-current" />
                        Featured Service
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-white">
                    <h3 className="text-3xl md:text-4xl font-bold mb-4" itemProp="name">{featuredService.title}</h3>
                    <p className="text-lg mb-6 text-blue-50 leading-relaxed" itemProp="description">
                      {featuredService.shortDescription || featuredService.description}
                    </p>
                    {featuredService.keyBenefits && featuredService.keyBenefits.length > 0 && (
                      <ul className="space-y-3 mb-8">
                        {featuredService.keyBenefits.slice(0, 4).map((b, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#D4F4A7' }} />
                            <span className="text-blue-50">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link 
                      to={`/services/${featuredService.slug || slugify(featuredService.title)}`}
                      itemProp="url"
                    >
                      <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-6 text-lg group">
                        Learn More About {featuredService.title}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Search and Filter */}
          {services.length > 0 && (
            <section className="mb-12" aria-label="Service search and filters">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <label htmlFor="service-search" className="sr-only">
                      Search logistics services
                    </label>
                    <Input
                      id="service-search"
                      type="text"
                      placeholder="Search services... (e.g., air freight, warehousing)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-14 text-base border-2 focus:border-blue-500 rounded-xl"
                      aria-label="Search logistics services"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} aria-label="Filter services by category">
                    <SelectTrigger className="w-full md:w-[220px] h-14 border-2 rounded-xl">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category ? category.charAt(0).toUpperCase() + category.slice(1) : "Uncategorized"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          )}

          {/* Services Grid */}
          {services.length > 0 && (
            <section aria-label="All logistics services">
            <h2 className="sr-only">Our Logistics Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service) => {
                const slug = service.slug || slugify(service.title);
                return (
                  <article 
                    key={service.id} 
                    className="h-full group"
                    itemScope 
                    itemType="https://schema.org/Service"
                  >
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-2xl h-full flex flex-col border-2 border-transparent hover:border-blue-200 rounded-2xl">
                      <div className="relative overflow-hidden">
                        <img
                          src={getApiImageUrl(service.imageUrl)}
                          alt={`${service.title} - Logistics service by Globeflight Kenya`}
                          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          itemProp="image"
                          onError={handleImageError}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <CardHeader className="flex-grow">
                        <CardTitle className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors" itemProp="name">
                          {service.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-base" itemProp="description">
                          {service.shortDescription || service.description}
                        </CardDescription>
                        {service.keyBenefits && service.keyBenefits.length > 0 && (
                          <ul className="mt-4 space-y-2" aria-label={`Benefits of ${service.title}`}>
                            {service.keyBenefits.slice(0, 3).map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#88C300' }} />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardHeader>
                      <CardContent className="flex gap-3 pt-0">
                        <Button 
                          variant="outline" 
                          onClick={() => openModal(service)}
                          className="flex-1 rounded-xl hover:bg-gray-50"
                          aria-label={`Quick view ${service.title}`}
                        >
                          Quick View
                        </Button>
                        <Link 
                          to={`/services/${slug}`}
                          itemProp="url"
                          className="flex-1"
                          aria-label={`Read more about ${service.title}`}
                        >
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl">
                            Learn More
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </article>
                );
              })}
            </div>
          </section>
          )}

          {/* CTA Section */}
          <section className="mt-20 bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-12 text-center shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Need International Logistics Solutions?</h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Contact our global logistics experts for tailored international shipping and freight forwarding services 
              connecting Kenya and Africa to any destination worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact-us">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 px-10 py-6 rounded-xl font-bold text-lg group">
                  Get International Quote
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="tel:+254729341277">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-700 px-10 py-6 rounded-xl font-bold text-lg">
                  Call: +254 729 341 277
                </Button>
              </a>
            </div>
          </section>
        </div>

        {/* Service Preview Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          {selectedService && (
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{selectedService.title}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedService.shortDescription || selectedService.description}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <img
                  src={selectedService.imageUrl}
                  alt={selectedService.title}
                  className="w-full h-64 object-cover rounded-xl"
                />
              </div>
              {selectedService.keyBenefits && selectedService.keyBenefits.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {selectedService.keyBenefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#88C300' }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              <DialogFooter className="mt-6 gap-3">
                <Button onClick={closeModal} variant="outline" className="flex-1 rounded-xl">Close</Button>
                <Link to={`/services/${selectedService.slug || slugify(selectedService.title)}`} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl">Learn More</Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </>
  );
}