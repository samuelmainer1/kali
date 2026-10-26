// src/components/LatestArticles.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiImageUrl, handleImageError } from '@/utils/imageUtils';

// API Configuration
import { API_BASE } from "@/constants/api";

const LatestArticles = ({ limit = 3, showViewAll = true }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/blogs/public`, {
          params: {
            page: 1,
            limit: limit,
          },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        if (response.data.success && response.data.data) {
          setArticles(response.data.data.blogs || []);
        } else {
          setArticles([]);
        }
      } catch (err) {
        console.error('Error fetching latest articles:', err);
        setError('Failed to load articles');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticles();
  }, [limit]);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#88C300]" />
          </div>
        </div>
      </section>
    );
  }

  if (error || articles.length === 0) {
    return null; // Don't show section if there's an error or no articles
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Latest Articles
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Explore our latest insights and updates
            </motion.p>
          </div>

          {/* Articles Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/blog/${article.slug}`} className="group block h-full">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden bg-gray-100">
                      {article.featuredImage && (
                        <img
                          src={getApiImageUrl(article.featuredImage)}
                          alt={article.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          onError={handleImageError}
                        />
                      )}
                      {article.category && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-[#88C300] text-white rounded-lg text-xs font-semibold">
                            {article.category.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#88C300] transition-colors duration-200">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                        {article.shortDescription}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* View All Button */}
          {showViewAll && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#88C300] text-white rounded-xl font-semibold hover:bg-[#76a800] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                View All Articles
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LatestArticles;

