// File: /pages/index.js

import Container from "@/components/Container";
import React from "react";
import Track from "./sections/Track";
import CallToActionSection from "@/components/CallToActionSection";
import ScrollOnSideSection from "@/components/ScrollOnSideSection";
import { Helmet } from "react-helmet-async";


const index = () => {
    return (
      <>
        <Helmet>
          <title>Track Shipment | Globeflight Kenya</title>
          <meta name="description" content="Track your shipment in real-time with Globeflight Kenya. Enter your tracking number to get the latest status and updates." />
          <meta property="og:title" content="Track Shipment | Globeflight Kenya" />
          <meta property="og:description" content="Track your shipment in real-time with Globeflight Kenya. Enter your tracking number to get the latest status and updates." />
          <link rel="canonical" href="https://globeflight.co.ke/track" />
        </Helmet>
        <Container>
          <Track />
        </Container>
        <CallToActionSection />
        <ScrollOnSideSection />
      </>
    );
  };
  
  export default index;