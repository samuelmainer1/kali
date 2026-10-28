'use client'

import React, { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, ChevronLeft, ChevronRight, Search, User as UserIcon, Tag as TagIcon } from "lucide-react"
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import { getApiImageUrl, handleImageError } from '@/utils/imageUtils'

// API Configuration
import { API_BASE } from "@/constants/api";

export default function BlogGrid() {
  const [posts, setPosts] = useState([])
  const [featuredPost, setFeaturedPost] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const postsPerPage = 6
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [subscribeEmail, setSubscribeEmail] = useState("")
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [subscribeError, setSubscribeError] = useState("")
  const [recentPosts, setRecentPosts] = useState([])
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const blogsRes = await axios.get(`${API_BASE}/blogs/public`, {
          params: {
            page: currentPage,
            limit: postsPerPage,
            search: searchTerm || undefined
          },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })
        
        if (blogsRes.data.success && blogsRes.data.data) {
          setPosts(blogsRes.data.data.blogs || [])
          setTotalPages(blogsRes.data.data.pagination?.pages || 1)
          const featured = blogsRes.data.data.blogs?.find(b => b.isFeatured) || blogsRes.data.data.blogs?.[0]
          setFeaturedPost(featured)
        } else {
          setPosts([])
          setTotalPages(1)
          setFeaturedPost(null)
        }
        
        try {
          const catRes = await axios.get(`${API_BASE}/categories`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }
          })
          if (catRes.data.success && catRes.data.data) {
            setCategories(catRes.data.data)
          } else {
            setCategories([])
          }
        } catch (catErr) {
          console.error('Error fetching categories:', catErr)
          setCategories([])
        }
        
        try {
          const recentRes = await axios.get(`${API_BASE}/blogs/public`, {
            params: { page: 1, limit: 5 },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }
          });
          if (recentRes.data.success && recentRes.data.data) {
            setRecentPosts(recentRes.data.data.blogs || []);
          } else {
            setRecentPosts([]);
          }
        } catch (recentErr) {
          console.error('Error fetching recent posts:', recentErr)
          setRecentPosts([]);
        }
        
        try {
          const relatedRes = await axios.get(`${API_BASE}/blogs/public`, {
            params: { page: 1, limit: 3 },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }
          });
          if (relatedRes.data.success && relatedRes.data.data) {
            setRelatedPosts(relatedRes.data.data.blogs || []);
          } else {
            setRelatedPosts([]);
          }
        } catch (relatedErr) {
          console.error('Error fetching related posts:', relatedErr)
          setRelatedPosts([]);
        }
      } catch (err) {
        console.error('Error fetching blog data:', err)
        setError("Failed to load blog content. Please try again later.")
        setPosts([])
        setCategories([])
        setRecentPosts([])
        setRelatedPosts([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentPage, searchTerm])

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscribeEmail || !subscribeEmail.includes('@')) {
      setSubscribeError('Please enter a valid email address');
      return;
    }

    setSubscribeLoading(true);
    setSubscribeError('');
    
    try {
      const res = await axios.post(`${API_BASE}/blogs/newsletter/subscribe`, {
        email: subscribeEmail
      });
      
      if (res.data.success) {
        setShowSuccessMessage(true);
        setSubscribeEmail('');
        setTimeout(() => setShowSuccessMessage(false), 5000);
      }
    } catch (err) {
      setSubscribeError(err.response?.data?.message || 'Failed to subscribe. Please try again.');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return ""
    const strippedText = text.replace(/<\/?[^>]+(>|$)/g, "")
    return strippedText.length > maxLength ? strippedText.slice(0, maxLength) + "..." : strippedText
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container px-4 py-16 mx-auto">
          <div className="grid gap-8 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="group">
                <Skeleton className="w-full h-64 rounded-xl mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl text-gray-700 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-[#88C300] hover:bg-[#6ea000] text-white shadow-md px-8"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main id="blog-content" className="min-h-screen bg-white">
      <Helmet>
        <title>Blog | Latest News & Industry Updates | Globeflight Kenya</title>
        <meta name="description" content="Stay updated with Globeflight Kenya's latest news, shipping industry insights, logistics tips, and company announcements. Read our blog for expert advice and updates." />
        <meta name="keywords" content="Globeflight Kenya blog, logistics news, shipping updates, freight tips, industry insights, global shipping, Africa logistics, supply chain, warehousing, customs clearance, air freight, sea freight" />
        <link rel="canonical" href={`https://globeflight.co.ke/blog`} />
        <link rel="alternate" type="application/rss+xml" title="Globeflight Kenya Blog RSS Feed" href="https://globeflight.co.ke/rss.xml" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://globeflight.co.ke/blog`} />
        <meta property="og:title" content="Blog | Latest News & Industry Updates | Globeflight Kenya" />
        <meta property="og:description" content="Stay updated with Globeflight Kenya's latest news, shipping industry insights, logistics tips, and company announcements." />
        <meta property="og:image" content="https://globeflight.co.ke/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog | Latest News & Industry Updates | Globeflight Kenya" />
        <meta name="twitter:description" content="Stay updated with Globeflight Kenya's latest news, shipping industry insights, logistics tips, and company announcements." />
        <meta name="twitter:image" content="https://globeflight.co.ke/logo.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Globeflight Kenya Blog",
            "description": "Latest news, updates, and insights from Globeflight Kenya.",
            "url": "https://globeflight.co.ke/blog",
            "publisher": {
              "@type": "Organization",
              "name": "Globeflight Kenya",
              "logo": {
                "@type": "ImageObject",
                "url": "https://globeflight.co.ke/logo.png"
              }
            },
            "blogPost": posts.map(post => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "image": post.featuredImage,
              "author": {
                "@type": "Person",
                "name": post.author?.fullName || 'Anonymous'
              },
              "datePublished": post.publishedAt,
              "url": `https://globeflight.co.ke/blog/${post.slug}`
            }))
          })}
        </script>
      </Helmet>

      {/* Featured Post Section */}
      {featuredPost && (
        <section className="bg-gray-50 py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 bg-[#88C300] text-white text-sm font-semibold rounded-lg">
                  Featured Article
                </span>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="order-2 lg:order-1 p-8 lg:p-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        {featuredPost.author?.fullName || 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {featuredPost.publishedAt && new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                      {featuredPost.title}
                    </h2>
                    
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {featuredPost.shortDescription}
                    </p>
                    
                    <Link to={`/blog/${featuredPost.slug}`}>
                      <Button className="bg-[#88C300] hover:bg-[#6ea000] text-white px-8 py-3 rounded-lg shadow-md">
                        Read Article
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="order-1 lg:order-2 relative h-64 lg:h-full min-h-[400px]">
                  {featuredPost.featuredImage && (
                    <img
                      src={getApiImageUrl(featuredPost.featuredImage)}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  )}
                  <div className="absolute top-4 right-4">
                    <span className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-lg text-sm font-semibold text-gray-800 shadow-md">
                      {featuredPost.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container px-4 py-16 mx-auto">
        {/* Search Section */}
        <section className="max-w-2xl mx-auto mb-16">
          <form onSubmit={handleSearch} role="search" aria-label="Blog Search">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-32 py-6 text-base rounded-xl border-2 border-gray-200 focus:border-[#88C300] focus:ring-4 focus:ring-[#88C300]/10"
                aria-label="Search blog posts"
              />
              <Button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#88C300] hover:bg-[#6ea000] text-white rounded-lg px-6"
                aria-label="Search"
              >
                Search
              </Button>
            </div>
          </form>
        </section>

        <div className="grid gap-12 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Latest Articles</h2>
              <p className="text-gray-600 mt-2">Explore our latest insights and updates</p>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-2xl">
                <div className="max-w-md mx-auto">
                  <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-xl text-gray-500 mb-6">No articles found</p>
                  {searchTerm && (
                    <Button 
                      onClick={() => setSearchTerm("")} 
                      variant="outline" 
                      className="border-2 border-[#88C300] text-[#88C300] hover:bg-[#88C300]/5"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <article key={post.id} className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    <Link to={`/blog/${post.slug}`}>
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        {post.featuredImage && (
                          <img
                            src={getApiImageUrl(post.featuredImage)}
                            alt={post.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                            onError={handleImageError}
                          />
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 bg-white/95 backdrop-blur-sm rounded-md text-xs font-semibold text-gray-800">
                            {post.category?.name || 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#88C300] transition-colors duration-200 line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                          {truncateText(post.shortDescription || "", 100)}
                        </p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserIcon className="w-3.5 h-3.5" />
                            <span className="truncate">{post.author?.fullName || 'Anonymous'}</span>
                          </div>
                          <span className="text-[#88C300] font-semibold text-sm">
                            Read →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {posts.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "ghost"}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === i + 1 
                          ? "bg-[#88C300] hover:bg-[#6ea000] text-white" 
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8 lg:col-span-1">
            {/* Recent Posts */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Recent Posts</h3>
              </div>
              <div className="p-6">
                {recentPosts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent posts available.</p>
                ) : (
                  <ul className="space-y-4">
                    {recentPosts.slice(0, 5).map((post) => (
                      <li key={post.id} className="group">
                        <Link to={`/blog/${post.slug}`} className="block">
                          <h4 className="font-semibold text-gray-900 group-hover:text-[#88C300] transition-colors duration-200 line-clamp-2 mb-1 text-sm">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Categories</h3>
              </div>
              <div className="p-6">
                {categories.length === 0 ? (
                  <p className="text-gray-500 text-sm">No categories available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/blog/category/${category.slug}`}
                        className="px-4 py-2 bg-gray-50 hover:bg-[#88C300] hover:text-white text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Newsletter */}
            <div id="newsletter" className="bg-gradient-to-br from-[#88C300] to-[#6ea000] rounded-xl shadow-lg p-6 text-white">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Newsletter</h3>
                <p className="text-white/90 text-sm">Subscribe for updates and exclusive content</p>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={subscribeEmail}
                    onChange={e => setSubscribeEmail(e.target.value)}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
                  />
                  <Button 
                    type="submit" 
                    disabled={subscribeLoading}
                    className="w-full bg-white text-[#88C300] hover:bg-gray-100 font-semibold"
                  >
                    {subscribeLoading ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>
                <p className="text-sm text-white/85">
                  <Link to="/unsubscribe" className="underline hover:text-white">Unsubscribe</Link>
                </p>
                {subscribeError && (
                  <p className="text-sm text-red-200">{subscribeError}</p>
                )}
                {showSuccessMessage && (
                  <p className="text-sm text-white font-semibold">✓ Successfully subscribed!</p>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Related Articles</h2>
              <p className="text-gray-600">More stories you might find interesting</p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <Link to={`/blog/${post.slug}`}>
                    {post.featuredImage && (
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img
                          src={getApiImageUrl(post.featuredImage)}
                          alt={post.title}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          onError={handleImageError}
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          {post.author?.fullName || 'Anonymous'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#88C300] transition-colors duration-200 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {truncateText(post.shortDescription || "", 80)}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}