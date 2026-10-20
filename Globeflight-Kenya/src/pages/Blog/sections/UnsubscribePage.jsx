'use client'

import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react"

const API_BASE = (() => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:5000/admin/api';
    } else {
      return 'https://globeflight.co.ke/admin/api';
    }
  }
  return 'http://localhost:5000/admin/api'; // fallback
})();

const UnsubscribePage = () => {
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email')
  
  const [email, setEmail] = useState(emailFromUrl || '')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')

  const handleUnsubscribe = async (e) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const res = await axios.post(`${API_BASE}/blogs/newsletter/unsubscribe`, {
        email: email
      })

      if (res.data.success) {
        setStatus('success')
        setMessage('You have been successfully unsubscribed from our newsletter.')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Failed to unsubscribe. Please try again.')
    }
  }

  const handleResubscribe = async () => {
    setStatus('loading')
    setMessage('')

    try {
      const res = await axios.post(`${API_BASE}/blogs/newsletter/subscribe`, {
        email: email
      })

      if (res.data.success) {
        setStatus('success')
        setMessage('You have been successfully resubscribed to our newsletter!')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Failed to resubscribe. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Newsletter Unsubscribe
          </CardTitle>
          <p className="text-gray-600 mt-2">
            We're sorry to see you go. Enter your email to unsubscribe from our newsletter.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Unsubscribed Successfully
                </h3>
                <p className="text-green-700 text-sm mb-4">{message}</p>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={handleResubscribe}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Resubscribe
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/blog'}
                  className="w-full"
                >
                  Back to Blog
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUnsubscribe} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{message}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Unsubscribing...' : 'Unsubscribe'}
              </Button>

              <div className="text-center">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => window.location.href = '/blog'}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UnsubscribePage 