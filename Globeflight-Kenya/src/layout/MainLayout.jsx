import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import Navbar from './components/Navbar'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import LiveChat from '@/components/LiveChat'
import { footerItems, navbaritems } from '@/constants/layout'

const MainLayout = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GTM
    const initGTM = () => {
      if (window.dataLayer) {
        window.dataLayer.push({
          event: "pageview",
          page: {
            url: window.location.href,
            path: location.pathname,
          },
        });
      }
    };

    initGTM();
  }, [location]);

  // Get page-specific meta data
  const getPageMeta = () => {
    const pathname = location.pathname;
    const baseTitle = "Globeflight Kenya";
    
    switch(pathname) {
      case '/':
        return {
          title: 'Importer of Record (IOR) Services Kenya | Globeflight Worldwide Express',
          description: 'Professional Importer of Record (IOR) services in Kenya. Expert customs clearance, KRA compliance, and import documentation. Trusted by multinationals and tech companies across Africa.',
        };
      case '/contact-us':
        return {
          title: 'Contact Us | Frequently Asked Questions | Globeflight Kenya',
          description: 'Contact Globeflight Kenya for logistics, shipping, and courier quotes. The same page answers common questions on safety, logistics, importer of record, freight, and customs.',
        };
      case '/services':
        return {
          title: `${baseTitle} - International Logistics Services | Global Shipping Solutions`,
          description: "Explore Globeflight Kenya's comprehensive international logistics services including air freight, sea freight, road transport, warehousing, and customs clearance. Connecting Africa to the world.",
        };
      case '/track':
        return {
          title: `${baseTitle} - Track Your Shipment | Real-time Tracking`,
          description: "Track your Globeflight Kenya shipment in real-time. Enter your tracking number to get instant updates on your cargo location and delivery status.",
        };
      case '/about-us':
        return {
          title: `${baseTitle} - About Us | Your Trusted Logistics Partner`,
          description: "Learn about Globeflight Kenya's journey as a leading logistics company. Discover our mission, values, and commitment to excellence in shipping services.",
        };
      case '/home':
        return {
          title: `${baseTitle} - Shipping, Tracking and Logistics from Nairobi`,
          description: "Globeflight Kenya ships air freight, sea freight, and parcels from Nairobi, with warehousing in Mlolongo and customs clearance through Union Green Logistics Ltd.",
        };
      case '/blog':
        return {
          title: `${baseTitle} - Blog | Latest News & Industry Updates`,
          description: "Stay updated with Globeflight Kenya's latest news, shipping industry insights, logistics tips, and company announcements.",
        };
      case '/jobs':
        return {
          title: `${baseTitle} - Careers | Join Our Team`,
          description: "Explore career opportunities at Globeflight Kenya. Join our dynamic team and build your career in the logistics and shipping industry.",
        };
      default:
        return {
          title: `${baseTitle} - Your Global Logistics Partner`,
          description: "Globeflight Kenya - International logistics and shipping company offering reliable freight forwarding, warehousing, and distribution services worldwide.",
        };
    }
  };

  const { title, description } = getPageMeta();

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="Globeflight Kenya, international logistics, global shipping, worldwide freight forwarding, Africa logistics hub, Kenya to world shipping, international air freight, global sea freight, continental road transport, international warehousing, global customs clearance, Africa cargo services, worldwide track shipment, international express delivery" />
        <meta name="author" content="Globeflight Kenya Ltd" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://globeflight.co.ke${location.pathname}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://globeflight.co.ke/logo-og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Globeflight Kenya" />
        <meta property="og:locale" content="en_KE" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@globeflight_ke" />
        <meta name="twitter:url" content={`https://globeflight.co.ke${location.pathname}`} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://globeflight.co.ke/logo-og.png" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://globeflight.co.ke${location.pathname}`} />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
        
        {/* JSON-LD Schema Markup - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["Organization", "LocalBusiness", "LogisticsService"],
            "@id": "https://globeflight.co.ke/#organization",
            "name": "Globeflight Kenya",
            "legalName": "Globeflight Kenya Ltd",
            "url": "https://globeflight.co.ke",
            "logo": {
              "@type": "ImageObject",
              "url": "https://globeflight.co.ke/logo.png",
              "width": "512",
              "height": "512"
            },
            "image": "https://globeflight.co.ke/logo.png",
            "description": "Leading international logistics and shipping company based in Kenya, connecting Africa to the world with reliable freight forwarding, warehousing, and global distribution services.",
            "email": "cs@globeflight.co.ke",
            "telephone": "+254729341277",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "NEXTGEN MALL, 3rd Floor, Suite 39/40, Mombasa Road",
              "addressLocality": "Nairobi",
              "postalCode": "00100",
              "addressRegion": "Nairobi County",
              "addressCountry": "KE"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "-1.3195",
              "longitude": "36.897"
            },
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "08:00",
                "closes": "17:00"
              },
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Saturday",
                "opens": "09:00",
                "closes": "13:00"
              }
            ],
            "priceRange": "$$",
            "areaServed": [
              {
                "@type": "Country",
                "name": "Kenya"
              },
              {
                "@type": "Continent",
                "name": "Africa"
              },
              {
                "@type": "Place",
                "name": "Worldwide"
              }
            ],
            "sameAs": [
              "https://www.facebook.com/globeflightkenya",
              "https://twitter.com/globeflight_ke",
              "https://www.linkedin.com/in/globeflight-kenya-491351141/",
              "https://www.youtube.com/@globeflightkenya"
            ],
            "contactPoint": [
              {
                "@type": "ContactPoint",
                "telephone": "+254729341277",
                "contactType": "customer service",
                "email": "cs@globeflight.co.ke",
                "availableLanguage": ["English", "Swahili", "French", "Arabic", "Chinese", "Spanish", "Portuguese"],
                "areaServed": "Worldwide"
              },
              {
                "@type": "ContactPoint",
                "telephone": "+254729341277",
                "contactType": "sales",
                "email": "cs@globeflight.co.ke",
                "availableLanguage": ["English", "Swahili"]
              }
            ],
            "serviceArea": {
              "@type": "Place",
              "name": "Worldwide - Specializing in Africa to Global Routes"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Logistics Services",
              "itemListElement": [
                {
                  "@type": "Service",
                  "name": "International Air Freight",
                  "description": "Fast and reliable air freight services worldwide"
                },
                {
                  "@type": "Service",
                  "name": "Global Sea Freight",
                  "description": "Cost-effective ocean freight solutions"
                },
                {
                  "@type": "Service",
                  "name": "Continental Road Transport",
                  "description": "Efficient road transport across Africa"
                },
                {
                  "@type": "Service",
                  "name": "International Warehousing",
                  "description": "Secure warehousing and distribution services"
                },
                {
                  "@type": "Service",
                  "name": "Global Customs Clearance",
                  "description": "Expert customs clearance and documentation"
                }
              ]
            },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://globeflight.co.ke/track?trackingNumber={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "foundingDate": "2010",
            "slogan": "Connecting Africa to the World"
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://globeflight.co.ke/#website",
            "name": "Globeflight Kenya",
            "url": "https://globeflight.co.ke",
            "inLanguage": "en-KE",
            "publisher": { "@id": "https://globeflight.co.ke/#organization" },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://globeflight.co.ke/track?trackingNumber={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
        
        {/* Google Tag Manager - GTM-PVKKQVN */}
        <script>
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PVKKQVN');
          `}
        </script>
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        {/* Google Tag Manager (noscript) - GTM-PVKKQVN */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-PVKKQVN"
            height="0" 
            width="0" 
            style={{display:'none',visibility:'hidden'}}
          ></iframe>
        </noscript>
        
        {/* Navbar */}
        <Navbar data={navbaritems}/>
        
        {/* Outlet (Centered) */}
        <div className="flex-1 ">
          <Outlet />
        </div>
        
        {/* Footer */}
        <Footer data={footerItems} />
        <LiveChat />
      </div>
    </>
  );
}

export default MainLayout