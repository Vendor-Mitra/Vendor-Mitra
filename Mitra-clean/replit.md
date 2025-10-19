# Overview

Vendor Mitra is a React-based food supply chain platform that connects vendors (buyers) with suppliers (sellers) for fresh produce, dairy, and other food products. The platform provides real-time inventory management, location-based supplier discovery, and comprehensive product catalogs with image management capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with Vite as the build tool and development server
- **React Router** for client-side routing and navigation
- **Tailwind CSS** for styling with custom color themes for food categories
- **Lucide React** and **Heroicons** for consistent iconography
- **React Dropzone** for file upload functionality including camera capture

## State Management & Data Persistence
- **localStorage-based database** system for persistent data storage
- **Real-time synchronization** using localStorage events for cross-tab communication
- **Custom stock management system** with automatic inventory updates
- **Product database** with comprehensive CRUD operations

## Authentication System
- **Role-based authentication** supporting vendors and suppliers
- **Predefined user accounts** for testing and demonstration
- **Session management** with localStorage persistence

## Image Management
- **Automatic image fetching** from Unsplash API based on product names
- **Camera integration** for direct product photography (1280x720 resolution)
- **Image caching system** to minimize API calls
- **Smart fallback images** with category-specific placeholders

## Real-time Features
- **Cross-tab synchronization** using localStorage events
- **Live stock updates** when purchases are made
- **Real-time inventory management** with automatic stock decrements

## Internationalization
- **i18next** for multi-language support (English and Hindi)
- **React-i18next** for React component integration
- Comprehensive translation files for all UI elements

## Map Integration
- **Leaflet** with React-Leaflet for interactive maps
- **Supplier location tracking** with custom markers
- **Proximity-based supplier discovery**

# External Dependencies

## Third-party APIs
- **Unsplash API** for automatic product image fetching (requires free API key)
- **Leaflet/OpenStreetMap** for mapping and location services

## Core Libraries
- **React ecosystem** (React 18, React DOM, React Router)
- **Axios** for HTTP requests (though currently using mock APIs)
- **Headless UI** for accessible UI components
- **React Dropzone** for file uploads and camera integration

## Development Tools
- **Vite** for fast development and building
- **ESLint** for code quality
- **PostCSS** with Autoprefixer for CSS processing
- **Tailwind CSS** for utility-first styling

## Data Storage
- **localStorage** for persistent data storage (no external database currently)
- **JSON-based** data structures for products, users, and orders
- **In-memory caching** for images and frequently accessed data