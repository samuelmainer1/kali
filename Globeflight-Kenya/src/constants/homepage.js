import { 
  CalendarClock, Globe2, ShieldCheck, Truck, Building2, 
  Laptop, Users, Wallet, Plane, Ship, Warehouse, FileCheck,
  ShoppingCart, Package, Clock, Target, Zap, TrendingUp,
  BarChart3, Workflow 
} from "lucide-react";

export const whychooseus = {
  title: "Safe, Reliable And Express Logistics Transport Solutions That Saves Your Time!",
  subTitle: "WHY CHOOSE GLOBEFLIGHT WORLDWIDE EXPRESS",
  desc: "We pride ourselves on providing the best transport and shipping services available allover the world. Our skilled personnel, utilising the latest communications, tracking and processing, combined with decades of experience! We take great pride in providing unparalleled shipping and transportation services worldwide. Leveraging advanced tracking software, streamlined processing, effective communication, and drawing upon our knowledgeable staff's decades of experience, we extend our commitment to excellence to both logistics and immigration services.",
};

export const whychooseusCards = [
  {
    icon: Building2,
    title: "Enterprise Solutions",
    desc: "Tailored logistics solutions for businesses of all sizes with cutting-edge technology",
    gradient: "from-blue-500 to-purple-600",
  },
  {
    icon: Laptop,
    title: "Digital Integration",
    desc: "Real-time tracking and seamless API integration with your existing systems",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    icon: Users,
    title: "Expert Team",
    desc: "Dedicated professionals providing 24/7 support and strategic guidance",
    gradient: "from-pink-500 to-red-600",
  },
  {
    icon: Wallet,
    title: "Competitive Pricing",
    desc: "Transparent pricing with no hidden fees and flexible payment options",
    gradient: "from-orange-500 to-yellow-600",
  },
];

export const processSteps = [
  {
    icon: Target,
    title: "Strategic Analysis",
    description: "Comprehensive assessment of your logistics needs and objectives",
    color: "from-blue-500 to-purple-600",
    features: ["Market Analysis", "Risk Assessment", "Cost Optimization"]
  },
  {
    icon: Workflow,
    title: "Process Design",
    description: "Custom workflow creation tailored to your business requirements",
    color: "from-purple-500 to-pink-600",
    features: ["Route Planning", "Resource Allocation", "Timeline Creation"]
  },
  {
    icon: Zap,
    title: "Implementation",
    description: "Seamless execution with real-time monitoring and adjustments",
    color: "from-pink-500 to-red-600",
    features: ["System Integration", "Team Training", "Quality Control"]
  },
  {
    icon: TrendingUp,
    title: "Optimization",
    description: "Continuous improvement through data-driven insights",
    color: "from-orange-500 to-yellow-600",
    features: ["Performance Metrics", "Feedback Loop", "Scale & Growth"]
  }
];

export const logisticsServices = [
  {
    id: "air-freight",
    title: "Air Freight",
    icon: Plane,
    category: "freight",
    color: "from-blue-500 to-cyan-500",
    features: ["Express Delivery", "Global Network", "Real-time Tracking"],
    serviceDesc:
      "As seasoned industry professionals, our knowledge and strong partner relationships allow us to offer our current and potential customers reliable, flexible, and cost-effective air-freight shipping solutions. Whether your needs are domestic or international, our air transport services are cost-effective, efficient, and include:\n\nInternational Air Cargo Transportation Services:\n\n1. Priority Air\n\n2. Consolidated Air\n\n3. Worldwide Charters.",
    minorDesc: "Air Freight is typically the fastest mode for long-distance freight.",
    desc: "Lightning-fast air cargo solutions with guaranteed delivery times across 150+ destinations worldwide.",
    stats: { speed: "1-3 Days", coverage: "Global", reliability: "99.8%" },
    img: "https://media.istockphoto.com/id/511885777/photo/cargo-plane-taking-off.jpg?s=612x612&w=0&k=20&c=gkWi8wvfc2kcZGxk0pxBN6EOZF9zAvkjLBIaoRaz9YI=",
  },
  {
    id: "sea-freight",
    title: "Sea Freight",
    icon: Ship,
    category: "freight",
    color: "from-teal-500 to-blue-500",
    features: ["Cost-Effective", "Bulk Cargo", "FCL & LCL"],
    serviceDesc:
      "Sea Freight Services have been booming, particularly for exporters and importers. There has been a shift in the global market causing an upsurge in international trade in Kenya. The demand has been created by business people and individuals seeking affordable and efficient means of cargo transportation.\n\n" +
      "Globeflight remains in tune with the market and thus understands this; we value your business above all else. No matter what size or capacity, we are here to find solutions for you!\n\n" +
      "Our team provides total service coverage. This means we not only monitor the sea freight movement of your product but also handle customs clearance and tariff classification, coordinating pick-up and delivery. This is coordinated by our experienced in-house team.",
    minorDesc:
      "Sea Freight provides an economical and dependable solution, especially suitable for international shipping of heavy or oversized items.",
    desc: "Economical ocean transportation for large shipments with flexible container options.",
    stats: { speed: "15-45 Days", coverage: "Worldwide", capacity: "Unlimited" },
    img: "https://media.istockphoto.com/id/520138253/photo/container-ship-in-the-harbor-in-asia.jpg?s=612x612&w=0&k=20&c=Ihg1RS88f6SYIjFNa6wePep5ycWI-TZ26LHjktyFBHE=",
  },
  {
    id: "warehouse-distribution",
    title: "Smart Warehousing",
    icon: Warehouse,
    category: "logistics",
    color: "from-purple-500 to-pink-500",
    features: ["24/7 Security", "Climate Control", "Inventory Management"],
    serviceDesc:
      "Optimize your supply chain with our Warehousing solutions. We specialize in efficient storage management, handling, and distribution of your goods. From inventory control to order fulfillment, our comprehensive warehousing services ensure your products reach their destination seamlessly.",
    minorDesc:
      "Experience streamlined logistics and warehousing with our dedicated service. Your partner in efficient order fulfillment and supply chain management.",
    desc: "State-of-the-art storage facilities with AI-powered inventory management systems.",
    stats: { locations: "25+", space: "500K sq ft", technology: "AI-Powered" },
    img: "https://media.istockphoto.com/id/1521289911/photo/container-trucks-parked-loading-package-boxes-pallets-at-warehouse-dock-supply-chain.jpg?s=612x612&w=0&k=20&c=cbaUTGirSEdGMgXoxdHBmOuVJ7LsJaJERY7lnLz5-fg=",
  },
  {
    id: "customs-clearance",
    title: "Customs Clearance",
    icon: FileCheck,
    category: "compliance",
    color: "from-green-500 to-emerald-500",
    features: ["Expert Brokers", "Fast Processing", "Compliance"],
    serviceDesc:
      "Simplify international trade with our Clearing and Forwarding services. We manage the intricate customs clearance process and facilitate the smooth movement of your goods across borders. Our expertise ensures a hassle-free experience for your global shipments.",
    minorDesc: "Seamless customs clearance with dedicated experts ensuring regulatory compliance.",
    desc: "Seamless customs clearance with dedicated experts ensuring regulatory compliance.",
    stats: { clearance: "24-48h", success: "100%", countries: "50+" },
    img: "",
  },
  {
    id: "ecommerce",
    title: "E-commerce Fulfillment",
    icon: ShoppingCart,
    category: "digital",
    color: "from-orange-500 to-red-500",
    features: ["Order Management", "Last-Mile Delivery", "Returns"],
    serviceDesc:
      "Elevate your online business with our E-commerce Logistics solutions. We specialize in managing the shipping and fulfillment processes for your online store, ensuring seamless order processing and timely deliveries to your customers.",
    minorDesc: "Our E-commerce Logistics service is your partner in efficient order fulfillment.",
    desc: "End-to-end e-commerce solutions from storage to doorstep delivery.",
    stats: { orders: "10K+ Daily", accuracy: "99.9%", integration: "All Platforms" },
    img: "https://media.istockphoto.com/id/1437739003/photo/beautiful-african-american-woman-using-online-paying-services-on-smart-phone.jpg?s=612x612&w=0&k=20&c=rxOTxq8UXCGpPIM4x3NcRkW3AqXFKezCPgIlg2jVYWw=",
  },
  {
    id: "consolidation",
    title: "Consolidation",
    icon: Package,
    category: "logistics",
    color: "from-indigo-500 to-purple-500",
    features: ["LCL Services", "Cost Optimization", "Multi-vendor"],
    serviceDesc:
      "At Globeflight Logistics, we understand the complexities and challenges involved in international trade. Whether you're an importer or exporter, optimizing your supply chain is essential for success. That's why we offer tailored Consolidation by Air and Sea services, designed to streamline your logistics, reduce costs, and enhance your overall trading experience. With our extensive global network, state-of-the-art facilities, and expertise in freight forwarding, we are your trusted partner for efficient and reliable cargo consolidation.",
    minorDesc: "we are your trusted partner for efficient and reliable cargo consolidation.",
    desc: "Smart consolidation services combining multiple shipments for cost-effective transport.",
    stats: { savings: "Up to 40%", partners: "200+", efficiency: "95%" },
    img: "https://media.istockphoto.com/id/1802522345/photo/delivery-man-courier-with-cardboard-box-and-mobile-phone-giving-a-parcel.jpg?s=612x612&w=0&k=20&c=isXYhmqmxWmlFVo1mOGIFqt-3ZODK4CmSkwKhk2M7LY=",
  },
  {
    id: "road-transport",
    title: "Road Transport",
    icon: Truck,
    category: "freight",
    color: "from-amber-500 to-orange-500",
    features: ["Door-to-Door", "GPS Tracking", "Flexible Routes"],
    serviceDesc:
      "We pride ourselves in regional transportation and distribution services in east africa: Connecting Wholesalers and manufacturers Globeflight and Union Green, your trusted partners for regional transportation and distribution services within East Africa. With over 25 years of experience in the logistics industry, we bring a wealth of expertise and a deep understanding of the region to deliver tailored solutions that streamline your supply chain, ensuring timely and efficient delivery of goods.",
    minorDesc: "we bring a wealth of expertise and a deep understanding of the region to deliver tailored solutions that streamline your supply chain, ensuring timely and efficient delivery of goods.",
    desc: "Reliable road transportation across East Africa with real-time visibility.",
    stats: { fleet: "200+ Trucks", coverage: "East Africa", tracking: "Real-time" },
    img: "",
  },
  {
    id: "importer-of-record",
    title: "Importer of Record (IOR)",
    icon: FileCheck,
    category: "compliance",
    color: "from-violet-500 to-purple-500",
    features: ["Legal Compliance", "Tax Management", "Documentation"],
    serviceDesc:
      "Our Importer of Record (IOR) service enables businesses to import goods into countries where they don't have a legal entity. We handle all customs compliance, duties, and taxes, ensuring smooth international trade operations.",
    minorDesc: "Complete import solutions for businesses without local entities.",
    desc: "Expert IOR services enabling seamless imports without local entity requirements.",
    stats: { countries: "30+", compliance: "100%", processing: "48-72h" },
    img: "/placeholder.svg",
  },
  {
    id: "international-import",
    title: "International Import",
    icon: Globe2,
    category: "digital",
    color: "from-cyan-500 to-blue-500",
    features: ["Global Sourcing", "Quality Control", "Supply Chain"],
    serviceDesc:
      "Comprehensive international import solutions connecting you with suppliers worldwide. From sourcing to delivery, we manage the entire import process.",
    minorDesc: "End-to-end import solutions for global trade.",
    desc: "Complete import management from global sourcing to final delivery.",
    stats: { suppliers: "1000+", countries: "80+", satisfaction: "98%" },
    img: "/placeholder.svg",
  }
];

export const serviceCategories = [
  { id: "all", label: "All Services", icon: Globe2 },
  { id: "freight", label: "Freight", icon: Truck },
  { id: "logistics", label: "Logistics", icon: Warehouse },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "digital", label: "Digital", icon: Zap }
];

export const companyStats = [
  { value: "25+", label: "Years Experience", icon: Clock },
  { value: "50K+", label: "Deliveries", icon: TrendingUp },
  { value: "150+", label: "Global Partners", icon: Globe2 },
  { value: "99.9%", label: "Success Rate", icon: ShieldCheck },
];

export const whereWeWorkCards = [
  {
    img: "https://media.istockphoto.com/id/923519778/photo/dallas-texas-cityscape.jpg?s=612x612&w=0&k=20&c=i4JccEMqxIs2NwGUgB7-zY_SQVq37G_8aPWcZsKJdBc=",
    flag: "https://media.istockphoto.com/id/524055319/photo/flag-of-the-united-states.jpg?s=612x612&w=0&k=20&c=uHu4Hd0_U1yrKlTWCtslmJNDz-vcL5Zdq8GUwU6EbAg=",
    title: "United States",
  },
  {
    img: "https://media.istockphoto.com/id/1312550959/photo/the-city-of-london-skyline-at-night-united-kingdom.webp?b=1&s=170667a&w=0&k=20&c=G_lpSR2edaC7JwBqP7cPxN-a37M8uLbFL8IrRHKLTb0=",
    flag: "https://media.istockphoto.com/id/1217765834/photo/flag-of-united-kingdom-blowing-in-the-wind.webp?b=1&s=170667a&w=0&k=20&c=GXXWJLCwj6QuRZh0p6xSEVc4eCTr6SZmkGTxXb8t__A=",
    title: "United Kingdom",
  },
  {
    img: "https://media.istockphoto.com/id/1487205172/photo/early-morning-shot-over-strand-beach-near-cape-town.jpg?s=612x612&w=0&k=20&c=vqf30MXUCPR6ascmnusOvpA5wx2a58GVsqJ6Fzei6sU=",
    flag: "https://media.istockphoto.com/id/497566021/photo/flag-of-republic-of-south-africa.jpg?s=612x612&w=0&k=20&c=zLmhGuEbuWq5q8epVvCYxZwZFEKz7q9Y8TJk4QPN-yc=",
    title: "South Africa",
  },
  {
    img: "https://media.istockphoto.com/id/1184398225/photo/growing-asian-cities-night-view-of-pune-city-in-india-during-diwali-festival.jpg?s=612x612&w=0&k=20&c=tJlE2RMCYl6fTC5hkkA3jDBnNXRtOnrj6odmf70aJpI=",
    flag: "https://media.istockphoto.com/id/931097020/photo/india-flag-waving-background.jpg?s=612x612&w=0&k=20&c=jvkGJAnp0c9iDzPQnebTHWw9A-y_lRET65zEHkfetUA=",
    title: "India",
  },
  {
    img: "https://media.istockphoto.com/id/526540092/photo/beautiful-modern-city-at-night-in-shanghai-china.jpg?s=612x612&w=0&k=20&c=3CvU2ZTEW-i4mTidCX3hrq4Hps0_9mWGXHBbcGzu3ZY=",
    flag: "https://media.istockphoto.com/id/509311994/photo/flag-of-china-3d-silk-texture.webp?b=1&s=170667a&w=0&k=20&c=jVSBWFG7Es34SX4RyctgENQluAZcT8WIPMOpYO4AMUg=",
    title: "China",
  },
  {
    img: "https://media.istockphoto.com/id/913519636/photo/dubai-downtown-at-sunrise-united-arab-emirates.jpg?s=612x612&w=0&k=20&c=1iop0pytLAdYyKchsv9XsisvuL9-Cpm_7IlXO0B8ibw=",
    flag: "https://media.istockphoto.com/id/1180612997/photo/united-arab-emirates-flag.jpg?s=612x612&w=0&k=20&c=e5PF4jD1qNT8CnKLU48i88NFZ9cfIFWEFt8zSD2KjMU=",
    title: "Dubai",
  },
];

export const whereWeWorkImmigrationCards = [
  {
    img: "https://media.istockphoto.com/id/637912692/photo/nairobi-cityscape-capital-city-of-kenya.jpg?s=612x612&w=0&k=20&c=S8wPNq9om-IMcapXFC030ew28nhpYCFYBStX5yxCQbs=",
    flag: "https://media.istockphoto.com/id/182810324/photo/kenya-flag.jpg?s=612x612&w=0&k=20&c=PWOuVEmYLkFtGAUK19ci7JF-mOoLnfBSOfW-lGYNblk=",
    title: "Kenya",
  },
  {
    img: "https://media.istockphoto.com/id/1184398225/photo/growing-asian-cities-night-view-of-pune-city-in-india-during-diwali-festival.jpg?s=612x612&w=0&k=20&c=tJlE2RMCYl6fTC5hkkA3jDBnNXRtOnrj6odmf70aJpI=",
    flag: "https://media.istockphoto.com/id/931097020/photo/india-flag-waving-background.jpg?s=612x612&w=0&k=20&c=jvkGJAnp0c9iDzPQnebTHWw9A-y_lRET65zEHkfetUA=",
    title: "India",
  },
];