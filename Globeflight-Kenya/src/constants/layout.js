import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

export const navbaritems = {
  logo: '/logo.png', // Reference logo from public folder
  navItems: [
    { link: 'Home', path: '/home' }, // Original home page moved to /home
    { link: 'Services', path: '/services', dropdown: true },
    { link: 'About', path: '/about-us' },
    { link: 'Contact', path: '/contact-us' },
    { link: 'WMS Logins', path: 'https://globeflight.thinksynergyltd.com/', external: true },
  ],
};

export const footerItems = {
  brand: '/logo.png', // Reference logo from public folder
  text1: "We are Globeflight Family.",
  text2: " 2024. All rights reserved.",
  socials: [
    {
      icon: Facebook,
      link: "https://www.facebook.com/globeflightkenya",
    },
    {
      icon: Twitter,
      link: "https://x.com/globeflight_ke",
    },
    {
      icon: Linkedin,
      link: "https://www.linkedin.com/company/globeflight-kenya",
    },
    {
      icon: Youtube,
      link: "https://www.youtube.com/@globeflightkenya",
    },
  ],
};
