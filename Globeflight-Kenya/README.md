# 🌍 Globeflight Kenya - Logistics & Shipping Solutions

[![Live Site](https://img.shields.io/badge/Live%20Site-globeflight.co.ke-brightgreen)](https://globeflight.co.ke)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.10-purple)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC)](https://tailwindcss.com/)

A modern, responsive logistics and shipping solutions website for Globeflight Kenya, featuring real-time tracking, live chat support, and comprehensive service offerings.

## 🚀 Live Demo

**Website**: [https://globeflight.co.ke](https://globeflight.co.ke)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)
- [Key Components](#-key-components)
- [Services Offered](#-services-offered)
- [Configuration](#-configuration)
- [Contributing](#-contributing)

## ✨ Features

### 🌟 Core Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Chat**: Tawk.to integration for customer support
- **Service Tracking**: Interactive tracking system for shipments
- **Multi-language Support**: Ready for internationalization
- **SEO Optimized**: Meta tags, structured data, and performance optimized
- **Contact Forms**: Integrated email services with Resend API
- **Interactive Maps**: Leaflet.js integration for location services

### 🎨 UI/UX Features
- **Modern Design**: Clean, professional interface with smooth animations
- **Dark/Light Mode**: Theme switching capability
- **Loading States**: Skeleton loaders and smooth transitions
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Performance**: Optimized images and lazy loading

### 📱 Mobile Features
- **Touch-friendly**: Optimized for mobile interactions
- **Progressive Web App**: PWA capabilities
- **Offline Support**: Service worker implementation
- **Push Notifications**: Real-time updates

## 🛠 Tech Stack

### Frontend
- **React 18.2.0** - UI library
- **Vite 5.4.10** - Build tool and dev server
- **React Router DOM 6.27.0** - Client-side routing
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Framer Motion 11.18.2** - Animation library

### UI Components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Maps & Location
- **Leaflet 1.9.4** - Interactive maps
- **React Leaflet 4.2.1** - React wrapper for Leaflet

### Communication
- **Tawk.to** - Live chat widget
- **Resend** - Email service integration
- **Axios** - HTTP client

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📁 Project Structure

```
Globeflight-Kenya/
├── public/                 # Static assets
│   ├── images/            # Public images
│   │   ├── netlify.toml       # Netlify configuration
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # Base UI components (Radix)
│   │   │   ├── Container.jsx # Layout wrapper
│   │   │   ├── TawkToComponent.jsx # Live chat
│   │   │   └── ...
│   │   ├── constants/        # Application constants
│   │   │   ├── global.js     # Global settings
│   │   │   ├── homepage.js   # Homepage content
│   │   │   ├── layout.js     # Layout configuration
│   │   │   └── ...
│   │   ├── config/          # Configuration files
│   │   │   └── tawkTo.js    # Tawk.to settings
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layout/          # Layout components
│   │   │   ├── components/  # Layout-specific components
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── ...
│   │   │   └── MainLayout.jsx
│   │   ├── lib/            # Utility libraries
│   │   │   ├── utils.js    # Helper functions
│   │   │   └── validations/ # Form validation schemas
│   │   ├── pages/          # Page components
│   │   │   ├── Home/       # Homepage
│   │   │   ├── About/      # About page
│   │   │   ├── Services/   # Services pages
│   │   │   ├── Contact/    # Contact page
│   │   │   ├── Track/      # Tracking page
│   │   │   └── Blog/       # Blog pages
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # App entry point
│   │   └── index.css       # Global styles
│   ├── package.json         # Dependencies and scripts
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── vercel.json          # Vercel deployment config
│   └── README.md           # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Globeflight-Kenya.git
   cd Globeflight-Kenya
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Add your configuration
   VITE_EMAIL_API_KEY=your_resend_api_key
   VITE_TAWK_TO_WIDGET_ID=your_tawk_to_widget_id
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Additional commands
npm run format       # Format code with Prettier
npm run test         # Run tests (if configured)
```

### Code Structure Guidelines

- **Components**: Use functional components with hooks
- **Styling**: Tailwind CSS classes with custom CSS variables
- **State Management**: React hooks (useState, useEffect, useContext)
- **Routing**: React Router with nested routes
- **Forms**: React Hook Form with Zod validation

### Component Naming Convention

- **Pages**: PascalCase (e.g., `HomePage.jsx`)
- **Components**: PascalCase (e.g., `Navbar.jsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useMediaQuery.js`)
- **Utilities**: camelCase (e.g., `utils.js`)

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Netlify Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag and drop the `dist` folder to Netlify
   - Or connect your GitHub repository

### Environment Variables for Production

```env
VITE_EMAIL_API_KEY=your_resend_api_key
VITE_TAWK_TO_WIDGET_ID=your_tawk_to_widget_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 🎯 Key Components

### MainLayout
The main layout wrapper that includes:
- Navigation bar with responsive menu
- Footer with company information
- Live chat widget integration
- Route outlet for page content

### TawkToComponent
Advanced live chat integration featuring:
- Custom styling and branding
- Visitor tracking and analytics
- File upload capabilities
- Offline message handling
- Mobile-responsive design

### Service Components
- **LogisticServices**: Showcase of shipping services
- **ServiceDetails**: Detailed service information
- **Tracking**: Real-time shipment tracking
- **Contact Forms**: Customer inquiry forms

## 📦 Services Offered

### Freight Services
- **Air Freight**: Express delivery worldwide
- **Sea Freight**: Cost-effective ocean transportation
- **Road Transport**: Regional East Africa coverage

### Logistics Solutions
- **Smart Warehousing**: AI-powered inventory management
- **Consolidation**: Multi-vendor shipment combining
- **E-commerce Fulfillment**: End-to-end online business support

### Compliance Services
- **Customs Clearance**: Expert brokerage services
- **Importer of Record (IOR)**: Legal compliance solutions
- **International Import**: Global sourcing and supply chain

## ⚙️ Configuration

### Tailwind CSS Configuration
Custom brand colors and responsive breakpoints:
```javascript
colors: {
  brandRed: "#ED203A",
  brandBluish: "#57C9E9",
  // ... other custom colors
}
```

### Vite Configuration
Path aliases and build optimization:
```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Tawk.to Configuration
Live chat widget settings in `src/config/tawkTo.js`:
- Widget positioning and styling
- Notification settings
- Visitor tracking options
- Custom CSS theming

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed
- Ensure responsive design works on all devices

## 📄 License

This project is proprietary software owned by Globeflight Kenya. All rights reserved.

## 📞 Contact

- **Website**: [https://globeflight.co.ke](https://globeflight.co.ke)
- **Email**: info@globeflight.co.ke
- **Phone**: +254 XXX XXX XXX

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite team for the fast build tool
- Tailwind CSS for the utility-first approach
- Radix UI for accessible components
- Tawk.to for live chat functionality

---

**Built with ❤️ for Globeflight Kenya**
