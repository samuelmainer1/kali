'use client'

import React, { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar as CalendarIcon, User as UserIcon, ArrowLeft, Tag as TagIcon } from "lucide-react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { getApiImageUrl, handleImageError } from '@/utils/imageUtils'

// API Configuration
import { API_BASE } from "@/constants/api";

const BlogCategoryPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCategoryAndPosts = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch category details
        const categoryRes = await axios.get(`${API_BASE}/categories`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })
        
        const foundCategory = categoryRes.data.data?.find(cat => cat.slug === slug)
        if (!foundCategory) {
          setError("Category not found.")
          setLoading(false)
          return
        }
        
        setCategory(foundCategory)

        // Fetch posts for this category
        const postsRes = await axios.get(`${API_BASE}/blogs/public`, {
          params: {
            category: foundCategory.id,
            page: 1,
            limit: 20
          },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })
        
        if (postsRes.data.success && postsRes.data.data) {
          setPosts(postsRes.data.data.blogs || [])
        } else {
          setPosts([])
        }
      } catch (err) {
        console.error('Error fetching category data:', err)
        setError("Failed to load category content. Please try again later.")
        setCategory(null)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) {
      fetchCategoryAndPosts()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container px-4 py-16 mx-auto">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-64 mb-8" />
            <Skeleton className="h-6 w-full mb-4" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Helmet>
          <title>Category not found | Globeflight Kenya</title>
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href="https://globeflight.co.ke/blog" />
          <meta property="og:url" content="https://globeflight.co.ke/blog" />
        </Helmet>
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl text-gray-700 mb-6">{error || "Category not found."}</p>
          <Button 
            onClick={() => navigate('/blog')}
            className="bg-[#88C300] hover:bg-[#6ea000] text-white shadow-md px-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Button>
        </div>
      </div>
    )
  }

  const pageTitle = `${category.name} | Blog | Globeflight Kenya`;
  const pageDesc = category.description || `Read the latest updates about ${category.name} from Globeflight Kenya.`;
  const canonicalUrl = `https://globeflight.co.ke/blog/category/${category.slug}`;

  return (
    <main className="min-h-screen bg-white">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="keywords" content={`Globeflight Kenya blog, ${category.name}, logistics, shipping, Africa logistics, supply chain`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content="https://globeflight.co.ke/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content="https://globeflight.co.ke/logo.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": category.name,
            "description": pageDesc,
            "url": canonicalUrl,
            "mainEntity": posts.map(post => ({
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
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://globeflight.co.ke/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://globeflight.co.ke/blog"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": category.name,
                "item": `https://globeflight.co.ke/blog/category/${category.slug}`
              }
            ]
          })}
        </script>
      </Helmet>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#88C300] to-[#6ea000] py-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => navigate('/blog')}
              variant="ghost"
              className="mb-6 text-white hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Button>
            
            <div className="text-center text-white space-y-4">
              <div className="inline-flex items-center justify-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <TagIcon className="w-6 h-6" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold">
                {category.name}
              </h1>
              
              {category.description && (
                <p className="text-lg text-white/90 max-w-2xl mx-auto">
                  {category.description}
                </p>
              )}
              
              <div className="pt-2 text-white/80">
                {posts.length} article{posts.length !== 1 ? 's' : ''} in this category
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="container px-4 py-16 mx-auto">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <div className="max-w-md mx-auto">
                <TagIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-600 mb-6">No articles found in this category</p>
                <Button 
                  onClick={() => navigate('/blog')} 
                  variant="outline" 
                  className="border-2 border-[#88C300] text-[#88C300] hover:bg-[#88C300]/5"
                >
                  Browse All Articles
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200">
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
                  <CardContent className="flex-grow p-6">
                    <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="flex-shrink-0 w-4 h-4" />
                        <span className="truncate">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="flex-shrink-0 w-4 h-4" />
                        <span className="truncate">{post.author?.fullName || 'Anonymous'}</span>
                      </div>
                    </div>
                    <h2 className="mb-3 text-xl font-bold text-gray-900 group-hover:text-[#88C300] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <div className="text-gray-600 line-clamp-3 text-sm">
                      {post.shortDescription || "No description available."}
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Link to={`/blog/${post.slug}`} className="w-full">
                      <Button variant="default" className="w-full bg-[#88C300] hover:bg-[#6ea000] text-white">
                        Read Article
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default BlogCategoryPage;