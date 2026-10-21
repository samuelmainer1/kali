import Container from "@/components/Container";
import React, { useRef, useEffect } from "react";
import Hero from "./sections/Hero";
import ContactForm from "./sections/ContactForm";
import FAQ from './sections/Faq'
import ScrollOnSideSection from "@/components/ScrollOnSideSection";
import { Helmet } from "react-helmet-async";

const index = () => {
  const formRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const form = formRef.current;
      if (!form) return;
      const rect = form.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        form.classList.add('highlight-contact-form');
        setTimeout(() => {
          form.classList.remove('highlight-contact-form');
        }, 1500);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Helmet>
        <title>Contact Us | Globeflight Kenya</title>
        <meta name="description" content="Contact Globeflight Kenya for all your logistics, shipping, and courier needs. Get in touch for quotes, support, and more." />
        <meta property="og:title" content="Contact Us | Globeflight Kenya" />
        <meta property="og:description" content="Contact Globeflight Kenya for all your logistics, shipping, and courier needs. Get in touch for quotes, support, and more." />
        <link rel="canonical" href="https://globeflight.co.ke/contact-us" />
      </Helmet>
      <div className="main-container">
        <Hero />
        <Container>
          <div id="main-contact-form" ref={formRef}>
            <ContactForm />
          </div>
          <FAQ/>
        </Container>
        <ScrollOnSideSection/>
      </div>
    </>
  );
};

export default index;
