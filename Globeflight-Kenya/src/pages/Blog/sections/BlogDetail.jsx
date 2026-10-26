'use client'

import React, { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, User as UserIcon, ArrowLeft, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon } from "lucide-react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { getApiImageUrl, handleImageError } from '@/utils/imageUtils'

// API Configuration
import { API_BASE } from "@/constants/api";

const BlogDetailsPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchPostAndRelated = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch the blog post
        const postRes = await axios.get(`${API_BASE}/blogs/public/${slug}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })
        
        if (postRes.data.success && postRes.data.data) {
          setPost(postRes.data.data)
          
          // Fetch related posts
          try {
            const relatedRes = await axios.get(`${API_BASE}/blogs/public`, {
              params: { 
                category: postRes.data.data.category?.slug,
                page: 1, 
                limit: 3 
              },
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              }
            })
            
            if (relatedRes.data.success && relatedRes.data.data) {
              // Filter out the current post from related posts
              const filtered = relatedRes.data.data.blogs?.filter(p => p.slug !== slug) || []
              setRelatedPosts(filtered.slice(0, 3))
            }
          } catch (relatedErr) {
            console.error('Error fetching related posts:', relatedErr)
            setRelatedPosts([])
          }
        } else {
          setError("Post not found.")
        }
      } catch (err) {
        console.error('Error fetching blog post:', err)
        setError("Failed to load blog post. Please try again later.")
        setPost(null)
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) {
      fetchPostAndRelated()
    }
  }, [slug])

  const handleShare = (platform) => {
    const url = window.location.href
    const title = post?.title || ''
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }
    setShowShareMenu(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setShowShareMenu(false)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container px-4 py-16 mx-auto">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-12 w-32 mb-8" />
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-6 w-64 mb-8" />
            <Skeleton className="h-96 w-full mb-8 rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Helmet>
          <title>Article not found | Globeflight Kenya</title>
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
          <p className="text-xl text-gray-700 mb-6">{error || "Post not found."}</p>
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

  const pageTitle = post.metaTitle || `${post.title} | Globeflight Kenya Blog`;
  const pageDesc = post.metaDescription || post.shortDescription || post.title;
  const canonicalUrl = `https://globeflight.co.ke/blog/${post.slug}`;
  const imageUrl = getApiImageUrl(post.featuredImage);

  return (
    <main className="min-h-screen bg-white">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="keywords" content={[...(Array.isArray(post.tags) ? post.tags : []), post.category?.name, 'Globeflight Kenya', 'logistics', 'shipping'].filter(Boolean).join(', ')} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content={imageUrl} />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:author" content={post.author?.fullName || 'Anonymous'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={imageUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "image": imageUrl,
            "author": {
              "@type": "Person",
              "name": post.author?.fullName || 'Anonymous'
            },
            "publisher": {
              "@type": "Organization",
              "name": "Globeflight Kenya",
              "logo": {
                "@type": "ImageObject",
                "url": "https://globeflight.co.ke/logo.png"
              }
            },
            "datePublished": post.publishedAt,
            "dateModified": post.updatedAt || post.publishedAt,
            "description": pageDesc,
            "url": canonicalUrl
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
                "name": post.title,
                "item": canonicalUrl
              }
            ]
          })}
        </script>
      </Helmet>

      {/* Article Header */}
      <article className="pb-16">
        <div className="bg-gray-50 py-12">
          <div className="container px-4 mx-auto">
            <div className="max-w-4xl mx-auto">
              <Button
                onClick={() => navigate('/blog')}
                variant="ghost"
                className="mb-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
              </Button>

              {/* Category Badge */}
              {post.category && (
                <Link to={`/blog/category/${post.category.slug}`}>
                  <span className="inline-block px-4 py-2 bg-[#88C300] text-white text-sm font-semibold rounded-lg mb-6 hover:bg-[#6ea000] transition-colors">
                    {post.category.name}
                  </span>
                </Link>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  <span className="font-medium">{post.author?.fullName || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                {post.readTime && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{post.readTime} min read</span>
                  </div>
                )}
              </div>

              {/* Share Buttons */}
              <div className="relative inline-block">
                <Button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-[#88C300] hover:bg-[#88C300]/5 text-gray-700"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Article
                </Button>

                {showShareMenu && (
                  <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[200px]">
                    <div className="space-y-2">
                      <button
                        onClick={() => handleShare('facebook')}
                        className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700 font-medium">Facebook</span>
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Twitter className="w-5 h-5 text-blue-400" />
                        <span className="text-gray-700 font-medium">Twitter</span>
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Linkedin className="w-5 h-5 text-blue-700" />
                        <span className="text-gray-700 font-medium">LinkedIn</span>
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <LinkIcon className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700 font-medium">
                          {copied ? 'Copied!' : 'Copy Link'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="container px-4 mx-auto -mt-8 mb-12">
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={imageUrl}
                  alt={post.title}
                  className="w-full h-auto max-h-[600px] object-cover"
                  onError={handleImageError}
                />
              </div>
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Short Description */}
            {post.shortDescription && (
              <div className="text-xl text-gray-700 leading-relaxed mb-12 pb-8 border-b border-gray-200 font-medium">
                {post.shortDescription}
              </div>
            )}

            {/* Main Content */}
            <div 
              className="prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-[#88C300] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ul:my-6 prose-ul:space-y-2
                prose-ol:my-6 prose-ol:space-y-2
                prose-li:text-gray-700
                prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                prose-blockquote:border-l-4 prose-blockquote:border-[#88C300] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
                prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-6 prose-pre:rounded-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author Info */}
            {post.author && (
              <div className="mt-12 p-8 bg-gray-50 rounded-2xl">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-[#88C300] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {post.author.fullName?.charAt(0) || 'A'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Written by {post.author.fullName || 'Anonymous'}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Contributing author at Globeflight Kenya, sharing insights on logistics, shipping, and supply chain management.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container px-4 mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Related Articles</h2>
                <p className="text-gray-600">Continue exploring related topics</p>
              </div>
              
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <article key={relatedPost.id} className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <Link to={`/blog/${relatedPost.slug}`}>
                      {relatedPost.featuredImage && (
                        <div className="relative h-48 overflow-hidden bg-gray-100">
                          <img
                            src={getApiImageUrl(relatedPost.featuredImage)}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                            onError={handleImageError}
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {relatedPost.publishedAt && new Date(relatedPost.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#88C300] transition-colors duration-200 mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {relatedPost.shortDescription || ""}
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default BlogDetailsPage;