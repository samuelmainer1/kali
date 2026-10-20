import Container from "@/components/Container";
import React from "react";
import Hero from "./sections/Hero";
import AboutUs from "./sections/AboutUs";
import Relation from "./sections/Relation";
import Team from "./sections/Team";
import CallToActionSection from "@/components/CallToActionSection";
import ScrollOnSideSection from "@/components/ScrollOnSideSection";
import { Helmet } from "react-helmet-async";


const index = () => {
  return (
    <>
      <Helmet>
        <title>About Us | Globeflight Kenya</title>
        <meta name="description" content="Learn about Globeflight Kenya, our mission, vision, and the team behind our logistics excellence." />
        <meta property="og:title" content="About Us | Globeflight Kenya" />
        <meta property="og:description" content="Learn about Globeflight Kenya, our mission, vision, and the team behind our logistics excellence." />
        <link rel="canonical" href="https://globeflight.co.ke/about-us" />
      </Helmet>
      <div className="main-container">
        <Hero />
        <Container>
          <AboutUs />
          <Relation/>
          <Team />
        </Container>
        <CallToActionSection />
        <ScrollOnSideSection/>
      </div>
    </>
  );
};

export default index;
