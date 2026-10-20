import { Send, Ship, Box, Package, Shield, Truck, ShoppingCart, Globe2, FileText } from "lucide-react"

export const stats = [
  {
    number: "2000+",
    text: "Quality Service",
  },
  {
    number: "250+",
    text: "Success Story",
  },
  {
    number: "200+",
    text: "Agents Around the world",
  },
  {
    number: "1000+",
    text: "Trusted Clients",
  },
]

// Renamed from immigrationServices to logisticsServices to better reflect the content
export const logisticsServices = [
  {
    id: "air-freight",
    img: "/Air.jpg",
    icon: Send,
    title: "Air Freight",
    desc: `
      Our air-freight shipping solutions offer reliability, flexibility, and cost-effectiveness. Whether domestic or international, our air transport services include:
      - Priority Air
      - Consolidated Air
      - Worldwide Charters
    `,
  },
  {
    id: "sea-freight",
    img: "/Sea.jpg",
    icon: Ship,
    title: "Sea Freight",
    desc: `
      Sea Freight Services cater to exporters and importers seeking affordable and efficient cargo transportation. We offer:
      - Total service coverage, including customs clearance
      - Seamless coordination of pick-up and delivery
    `,
  },
  {
    id: "warehouse-distribution",
    img: "/Warehouse.jpg",
    icon: Box,
    title: "Warehouse and Distribution",
    desc: `
      Globe Flight offers advanced warehousing solutions with quality control, reliability, and efficiency. Distribution networks help expand your reach into new markets.
      - Tailored solutions to accommodate business growth
      - Support for expanding reach into new markets through safe, convenient distribution
    `,
  },
  {
    id: "consolidation",
    img: "/Consolidation.jpg",
    icon: Package,
    title: "Consolidation",
    desc: `
      Our consolidation services streamline logistics and reduce costs for importers and exporters:
      - Air and Sea Freight Options for flexibility
      - Tailored solutions to optimize your supply chain and improve operational efficiency
      - Enhanced visibility and tracking for complete transparency
    `,
  },
  {
    id: "customs-clearance",
    img: "/Customs.jpg",
    icon: Shield,
    title: "Customs Clearance and Freight Forwarding",
    desc: `
      Our Express Clearing services streamline customs clearance for both import and export shipments. With strong relationships with Kenyan Customs and Kenya Port Authority, we ensure smooth operations.
    `,
  },
  {
    id: "regional-transport",
    img: "/Transport.jpg",
    icon: Truck,
    title: "Regional Transport",
    desc: `
      Offering over 25 years of experience in East African transportation, we deliver timely and efficient solutions tailored to streamline your supply chain across the region.
    `,
  },
  {
    id: "ecommerce",
    img: "/Ecommerce.jpg",
    icon: ShoppingCart,
    title: "E-commerce",
    desc: `
      Globeflight provides omnichannel e-commerce solutions for retailers of all scales, offering convenience, accuracy, and international reach:
      - Smooth processes backed by a global network
      - Tailored support for SMEs in logistics and fulfillment
    `,
  },
  {
    id: "international-import",
    img: "/International.jpg",
    icon: Globe2,
    title: "International Import and Export Express",
    desc: `
      We handle the collection, customs clearance, and door-to-door delivery for parcels that need customs processing from international destinations.
    `,
  },
  {
    id: "importer-of-record",
    img: "/placeholder.svg?height=400&width=600",
    icon: FileText,
    title: "Importer of Record (IOR)",
    desc: `
      Our Importer of Record (IOR) service enables businesses to import goods into countries where they don't have a legal entity. We handle:
      - Complete customs compliance management
      - Payment of duties and taxes
      - Legal representation for import processes
      - Seamless international trade operations
    `,
  },
]

// Keep the original export for backward compatibility
export { logisticsServices as immigrationServices }

export const howItWorks = [
  {
    title: "Book Appointment",
    desc: "Tailored scheduling solutions.",
  },
  {
    title: "Submit Documents",
    desc: "Seamless submission guidance.",
  },
  {
    title: "Application Process",
    desc: "Effortless and organized shipping experience.",
  },
  {
    title: "Tracking Process",
    desc: "Smooth and transparent tracking system.",
  },
  {
    title: "Delivery",
    desc: "Joyful, transparent, organized package receipt.",
  },
]
