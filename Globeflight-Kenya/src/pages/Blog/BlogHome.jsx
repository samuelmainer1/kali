// src/pages/Blog/BlogHome.jsx
import React, { Suspense } from "react";
import Container from "@/components/Container";
import Hero from "./sections/Hero";  
import CallToActionSection from "@/components/CallToActionSection"; 
import ScrollOnSideSection from "@/components/ScrollOnSideSection";
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const BlogHome = () => {
  return (
    <>
      <Helmet>
        <title>Our Blog | Globeflight Kenya</title>
        <meta name="description" content="Read the latest news, updates, and insights from Globeflight Kenya. Stay informed about logistics, shipping, and industry trends." />
        <meta property="og:title" content="Our Blog | Globeflight Kenya" />
        <meta property="og:description" content="Read the latest news, updates, and insights from Globeflight Kenya. Stay informed about logistics, shipping, and industry trends." />
        <link rel="canonical" href="https://globeflight.co.ke/blog" />
      </Helmet>
      <div className="main-container">
        <Hero />
        <Container>
          <Suspense fallback={<div className="py-20 text-center">Loading Blog...</div>}>
            <Outlet />
          </Suspense>
        </Container>
        <CallToActionSection />
        <ScrollOnSideSection/>
      </div>
    </>
  );
};

export default BlogHome;
