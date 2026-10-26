// src/utils/imageUtils.js
// Utility functions for handling image URLs across the application

/**
 * Constructs a full image URL from a relative or absolute path
 * @param {string} imagePath - The image path (can be relative or absolute URL)
 * @param {string} baseUrl - The base URL to prepend for relative paths (default: production URL)
 * @returns {string} - Full image URL or placeholder if path is invalid
 */
export const getImageUrl = (imagePath, baseUrl = 'https://globeflight.co.ke') => {
  // Return placeholder if no image path provided
  if (!imagePath || imagePath === '' || imagePath === 'null' || imagePath === 'undefined') {
    return '/globe1.jpg'; // Using existing image as placeholder
  }

  // If it's already a full URL (starts with http:// or https://), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // For relative paths, construct full URL
  // Remove leading slashes to avoid double slashes
  const cleanPath = imagePath.replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Handles image load errors by setting a fallback image
 * @param {Event} e - The error event from the img tag
 * @param {string} fallbackSrc - Optional custom fallback image path
 */
export const handleImageError = (e, fallbackSrc = '/globe1.jpg') => {
  console.error('Image failed to load:', e.target.src);

  // Prevent infinite loop if fallback also fails
  if (e.target.src !== fallbackSrc && !e.target.src.endsWith(fallbackSrc)) {
    e.target.src = fallbackSrc;
  }

  // Prevent further error handling
  e.target.onerror = null;
};

/**
 * Gets the API base URL based on current environment
 * @returns {string} - API base URL
 */
export const getApiBase = () => "/admin/api";

/**
 * Constructs image URL specifically for blog/service images from API
 * This handles both Cloudinary URLs and local uploads
 * @param {string} imagePath - The image path from API response
 * @returns {string} - Full image URL
 */
export const getApiImageUrl = (imagePath) => {
  if (!imagePath || imagePath === '' || imagePath === 'null' || imagePath === 'undefined') {
    return '/globe1.jpg'; // Using existing image as placeholder
  }

  // If it's a Cloudinary URL or any external URL, return as-is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // For local uploads, construct URL
  const API_BASE = getApiBase();
  const baseUrl = API_BASE.replace('/admin/api', '');
  const cleanPath = imagePath.replace(/^\/+/, '');

  return `${baseUrl}/${cleanPath}`;
};

/**
 * Preloads an image to check if it exists
 * @param {string} src - Image source URL
 * @returns {Promise<boolean>} - Resolves to true if image loads, false otherwise
 */
export const preloadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
};

/**
 * Gets optimized image URL with optional transformations
 * (For future Cloudinary optimization)
 * @param {string} imagePath - The image path
 * @param {Object} options - Transformation options (width, height, quality, etc.)
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (imagePath, options = {}) => {
  const url = getImageUrl(imagePath);
  
  // If it's a Cloudinary URL, we could add transformations here
  // For now, just return the URL as-is
  // TODO: Add Cloudinary transformation logic if needed
  
  return url;
};

