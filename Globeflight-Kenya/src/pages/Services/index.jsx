// File: /pages/index.js

import Container from "@/components/Container";
import React from "react";
import Hero from "./sections/Hero";
import { Helmet } from "react-helmet-async";

import Service from "./sections/Service";
import WhereWeShip from "@/components/WhereWeShip";
import CallToActionSection from "@/components/CallToActionSection";
import ScrollOnSideSection from "@/components/ScrollOnSideSection";
import HowWeWork from "./sections/HowWeWork";
import { whereWeWorkImmigrationCards } from "@/constants/homepage";

const HomePage = () => {
  // Structured data for the services page
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Globeflight Kenya",
    "url": "https://globeflight.co.ke",
    "logo": "https://globeflight.co.ke/logo.png",
    "description": "Leading international logistics and shipping company based in Kenya, offering comprehensive freight forwarding, warehousing, and distribution services across Africa and worldwide.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "NEXTGEN MALL, 3rd Floor, Suite 39/40, Mombasa Road",
      "addressLocality": "Nairobi",
      "addressCountry": "KE"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+254729341277",
      "contactType": "customer service",
      "areaServed": "Worldwide",
      "availableLanguage": ["English", "Swahili", "French", "Arabic", "Chinese", "Spanish"]
    },
    "sameAs": [
      "https://www.facebook.com/globeflightkenya",
      "https://twitter.com/globeflight_ke",
      "https://www.linkedin.com/company/globeflight-kenya",
      "https://www.youtube.com/@globeflightkenya"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Logistics Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "International Air Freight Services",
            "description": "Fast and reliable international air cargo services from Kenya to worldwide destinations"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Global Sea Freight Services",
            "description": "Cost-effective international ocean cargo shipping solutions to all major ports worldwide"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Continental Road Transport",
            "description": "Comprehensive road freight services across Africa - from Cairo to Cape Town"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "International Warehousing & Distribution",
            "description": "Strategic warehousing hubs in Kenya serving Africa and global distribution networks"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Global Customs Clearance",
            "description": "Expert international customs clearance and documentation services for import/export"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "International E-commerce Logistics",
            "description": "End-to-end global e-commerce fulfillment connecting African businesses to world markets"
          }
        }
      ]
    }
  };

  const breadcrumbSchema = {
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
        "name": "Services",
        "item": "https://globeflight.co.ke/services"
      }
    ]
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Our Services - Globeflight Kenya",
    "description": "Comprehensive logistics and shipping services in Kenya and East Africa. Air freight, sea freight, warehousing, customs clearance, and more.",
    "url": "https://globeflight.co.ke/services",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Globeflight Kenya Services",
      "description": "Complete list of logistics services offered by Globeflight Kenya"
    }
  };

  return (
    <>
      <Helmet>
        <title>International Logistics Services | Global Air & Sea Freight - Globeflight Kenya</title>
        <meta name="description" content="Globeflight Kenya's international logistics services: Air freight, sea freight, road transport, warehousing, customs clearance worldwide. Global shipping from Kenya to Europe, Asia, Americas, and across Africa. Professional freight forwarding solutions." />
        <meta name="keywords" content="Globeflight international services, global logistics Kenya, international air freight, worldwide sea freight, Africa logistics hub, Kenya to Europe shipping, Kenya to Asia freight, Kenya to USA logistics, international warehousing, global customs clearance, worldwide shipping services, international freight forwarding, Africa cargo services, global transportation Kenya, continental logistics Africa, international supply chain, worldwide distribution services, global e-commerce logistics" />
        
        {/* Open Graph */}
        <meta property="og:title" content="International Logistics Services | Globeflight Kenya - Global Shipping" />
        <meta property="og:description" content="Professional international air freight, sea freight, warehousing, customs clearance, and logistics solutions. Connecting Kenya and Africa to the world with reliable global shipping services." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://globeflight.co.ke/services" />
        <meta property="og:image" content="https://globeflight.co.ke/services-hero.jpg" />
        <meta property="og:site_name" content="Globeflight Kenya" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Our Services - Globeflight Kenya" />
        <meta name="twitter:description" content="Complete logistics solutions: Air & sea freight, warehousing, customs clearance. Serving Kenya & East Africa." />
        <meta name="twitter:image" content="https://globeflight.co.ke/services-hero.jpg" />
        <meta name="twitter:site" content="@globeflight_ke" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Globeflight Kenya" />
        <meta name="publisher" content="Globeflight Kenya Ltd" />
        <meta name="copyright" content="Globeflight Kenya" />
        <meta name="rating" content="general" />
        <meta name="distribution" content="global" />
        <meta name="revisit-after" content="3 days" />
        
        <link rel="canonical" href="https://globeflight.co.ke/services" />
        
        {/* Alternate Language Tags */}
        <link rel="alternate" hrefLang="en" href="https://globeflight.co.ke/services" />
        <link rel="alternate" hrefLang="sw" href="https://globeflight.co.ke/sw/services" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(webPageSchema)}
        </script>
      </Helmet>
      
      <div className="main-container">
        {/* Hero Section - Ensure it has relevant H1 and content */}
        <Hero />
        
        <Container>
          {/* Main Services Section */}
          <section aria-label="Our logistics services">
            <Service />
          </section>
          
          {/* Where We Ship Section */}
          <section className="py-12" aria-label="Our global service coverage">
            <h2 className="text-3xl font-bold text-center mb-8">
              Experience Seamless International Logistics Services Worldwide
            </h2>
            <WhereWeShip 
              title="Our Global Service Coverage" 
              styles="grid grid-cols-1 md:grid-cols-2 gap-10 my-7" 
              data={whereWeWorkImmigrationCards || []} // Fallback in case data is undefined
            />
          </section>
          
          {/* How We Work Section */}
          <section className="py-12" aria-label="How our logistics process works">
            <HowWeWork />
          </section>
          
          {/* Additional SEO Content Section */}
          <section className="py-12 prose max-w-none">
            <h2 className="text-3xl font-bold mb-6">Why Choose Globeflight Kenya for International Logistics?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">Global Logistics Network</h3>
                <p className="text-gray-600">
                  Globeflight Kenya operates a comprehensive international logistics network connecting Kenya 
                  to over 200 destinations worldwide. From air freight to Europe and Americas, sea freight to 
                  Asia and Australia, to road transport across the African continent - we deliver everywhere.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Africa's International Gateway</h3>
                <p className="text-gray-600">
                  Strategically positioned in Nairobi, we serve as the premier logistics hub for international 
                  trade in and out of Africa. Our partnerships with global carriers like DHL, FedEx, and major 
                  shipping lines ensure seamless worldwide connectivity.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Worldwide Coverage</h3>
                <p className="text-gray-600">
                  Whether shipping to New York, London, Dubai, Shanghai, or Sydney - we handle it all. 
                  Our international services cover all continents with specialized expertise in Africa-Asia, 
                  Africa-Europe, and Africa-Americas trade lanes.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">International Trade Expertise</h3>
                <p className="text-gray-600">
                  With 25+ years handling international shipments, we understand global trade regulations, 
                  documentation requirements, and customs procedures for every country. Our multilingual 
                  team ensures smooth communication across all international markets.
                </p>
              </div>
            </div>
          </section>
        </Container>
        
        {/* Call to Action Section */}
        <CallToActionSection />
        
        {/* Scroll on Side Section */}
        <ScrollOnSideSection/>
      </div>
    </>
  );
};

export default HomePage;