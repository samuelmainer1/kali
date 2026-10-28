import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowRight } from "lucide-react"
import { Button } from "../../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "../../components/ui/dropdown-menu"
import { Helmet } from "react-helmet-async"

const NavbarMain = ({ data, pathname, isSticky, toggleMobileMenu, isMobileMenuOpen }) => {
  const { logo, navItems } = data;

  // Blog categories state
  const [categories, setCategories] = useState([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  // API base
  const API_BASE = "/admin/api";

  useEffect(() => {
    // Fetch categories on mount
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/categories`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        const data = await res.json();
        if (data && data.data) {
          setCategories(data.data);
        }
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": navItems.filter(item => !item.external).map(item => item.link),
    "url": navItems.filter(item => !item.external).map(item => `https://globeflight.co.ke${item.path}`)
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`relative transition-all duration-500 ${
        isSticky
          ? "bg-white/95 backdrop-blur-xl shadow-lg py-3"
          : "bg-white shadow-md py-4"
      }`}
      aria-label="Main navigation"
    >
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(navigationSchema)}
        </script>
      </Helmet>
      <div className="w-full flex items-center justify-between px-3 sm:px-6 lg:px-12">
        {/* Logo */}
        <Link to="/" className="group flex-shrink-0">
          <motion.img
            src={logo}
            className="object-cover h-10 sm:h-12 md:h-14 lg:h-16 w-auto transition-all duration-300"
            alt="Globeflight Kenya - Leading Logistics Company"
            title="Globeflight Kenya"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex flex-1 justify-center items-center space-x-2 xl:space-x-6">
          {/* Home */}
          <motion.li
            className="relative group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <Link
              to="/"
              className={`relative text-sm lg:text-base font-semibold hover:text-[#88C300] transition-all duration-300 py-2 px-2 lg:px-3 whitespace-nowrap ${
                pathname === "/" ? "text-[#88C300]" : "text-gray-700"
              }`}
              title="Home - Globeflight Kenya"
            >
              <span className="relative z-10">Home</span>
              {pathname === "/" && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#88C300]"
                />
              )}
            </Link>
          </motion.li>

          {/* Services */}
          <motion.li
            className="relative group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              to="/services"
              className={`relative text-sm lg:text-base font-semibold hover:text-[#88C300] transition-all duration-300 py-2 px-2 lg:px-3 whitespace-nowrap ${
                pathname === "/services" ? "text-[#88C300]" : "text-gray-700"
              }`}
              title="Our Services - Globeflight Kenya"
            >
              <span className="relative z-10">Services</span>
              {pathname === "/services" && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#88C300]"
                />
              )}
            </Link>
          </motion.li>

          {/* About Us */}
          <motion.li
            className="relative group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <Link
              to="/about-us"
              className={`relative text-sm lg:text-base font-semibold hover:text-[#88C300] transition-all duration-300 py-2 px-2 lg:px-3 whitespace-nowrap ${
                pathname === "/about-us" ? "text-[#88C300]" : "text-gray-700"
              }`}
              title="About Us - Globeflight Kenya"
            >
              <span className="relative z-10">About Us</span>
              {pathname === "/about-us" && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#88C300]"
                />
              )}
            </Link>
          </motion.li>

          {/* Blog/Updates with dropdown */}
          <motion.li
            className="relative group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            onMouseEnter={() => setCatDropdownOpen(true)}
            onMouseLeave={() => setCatDropdownOpen(false)}
          >
            <Link
              to="/blog"
              className={`relative text-sm lg:text-base font-semibold hover:text-[#88C300] transition-all duration-300 py-2 px-2 lg:px-3 whitespace-nowrap ${
                pathname === "/blog" ? "text-[#88C300]" : "text-gray-700"
              }`}
              title="Blog - Globeflight Kenya"
              aria-haspopup="true"
              aria-expanded={catDropdownOpen ? "true" : "false"}
            >
              <span className="relative z-10 flex items-center gap-1">
                Blog
                <svg className="w-3 h-3 lg:w-4 lg:h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              {pathname === "/blog" && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#88C300]"
                />
              )}
            </Link>
            {/* Dropdown */}
            {catDropdownOpen && categories.length > 0 && (
              <div
                className="absolute left-0 top-full mt-2 min-w-[220px] bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-2"
                role="menu"
                aria-label="Blog Categories"
              >
                {categories.map(cat => (
                  <Link
                    key={cat.slug}
                    to={`/blog/category/${cat.slug}`}
                    className="block px-5 py-3 text-gray-700 hover:bg-[#88C300]/10 hover:text-[#88C300] font-medium transition-colors duration-200"
                    role="menuitem"
                    title={cat.name}
                    onClick={() => setCatDropdownOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </motion.li>

          {/* Careers */}
          <motion.li
            className="relative group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              to="/jobs"
              className={`relative text-sm lg:text-base font-semibold hover:text-[#88C300] transition-all duration-300 py-2 px-2 lg:px-3 whitespace-nowrap ${
                pathname === "/jobs" ? "text-[#88C300]" : "text-gray-700"
              }`}
              title="Careers - Globeflight Kenya"
            >
              <span className="relative z-10">Careers</span>
              {pathname === "/jobs" && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#88C300]"
                />
              )}
            </Link>
          </motion.li>

          {/* Contact Us */}
          <motion.li
            className="relative group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Link
              to="/contact-us"
              className={`relative text-sm lg:text-base font-semibold hover:text-[#88C300] transition-all duration-300 py-2 px-2 lg:px-3 whitespace-nowrap ${
                pathname === "/contact-us" ? "text-[#88C300]" : "text-gray-700"
              }`}
              title="Contact Us - Globeflight Kenya"
            >
              <span className="relative z-10">Contact Us</span>
              {pathname === "/contact-us" && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#88C300]"
                />
              )}
            </Link>
          </motion.li>

          {/* Track */}
          <motion.li
            className="relative group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              to="/track"
              className={`relative text-sm lg:text-base font-semibold hover:text-[#88C300] transition-all duration-300 py-2 px-2 lg:px-3 whitespace-nowrap ${
                pathname === "/track" ? "text-[#88C300]" : "text-gray-700"
              }`}
              title="Track Your Shipment - Globeflight Kenya"
            >
              <span className="relative z-10">Track</span>
              {pathname === "/track" && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#88C300]"
                />
              )}
            </Link>
          </motion.li>
        </ul>

        {/* Get Quote Button - Desktop */}
        <motion.div
          className="hidden lg:block ml-3 xl:ml-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button
            asChild
            size="sm"
            className="relative group bg-[#88C300] hover:bg-[#6ea000] text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-full px-4 lg:px-6 py-2 text-sm lg:text-base font-semibold"
          >
            <Link to="/contact-us" title="Get a Quote - Globeflight Kenya">
              <span className="relative z-10 flex items-center gap-2">
                Get Quote
                <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
          </Button>
        </motion.div>

        {/* Platforms Dropdown */}
        <div className="hidden lg:flex items-center ml-2 xl:ml-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full px-3 lg:px-5 py-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#88C300]/50 text-sm lg:text-base transition-all"
                size="sm"
              >
                Platforms
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[14rem]">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Our Platforms</div>
              <div className="border-b border-gray-100 mb-1"></div>
              <DropdownMenuItem asChild>
                <a
                  href="https://globeflight.thinksynergyltd.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                  aria-label="WMS Client Login - Globeflight Kenya"
                  title="WMS Client Login"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5m0 0l-5-5m5 5H3" />
                  </svg>
                  WMS Login
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://bigdrop.co.ke/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                  aria-label="Bigdrop Ecommerce Platform by Globeflight"
                  title="Bigdrop Ecommerce Platform"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h15l-1.5 9h-13L4 6zm0 0V4a2 2 0 012-2h2a2 2 0 012 2v2" />
                  </svg>
                  Bigdrop
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile menu button */}
        <motion.button
          className="lg:hidden relative w-10 h-10 text-gray-700 focus:outline-none rounded-lg hover:bg-[#88C300]/10 hover:text-[#88C300] transition-all duration-300 flex items-center justify-center"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Menu className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.nav>
  )
}

export default NavbarMain