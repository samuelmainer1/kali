import React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { motion } from "framer-motion"

const FooterNewsletter = ({
  subscribeEmail,
  setSubscribeEmail,
  subscribeLoading,
  subscribeError,
  showSuccessMessage,
  handleSubscribe
}) => (
  <div className="bg-gradient-to-r from-[#88C300] to-[#6ea000] py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 text-white">Stay Updated</h2>
        <p className="text-white/95 mb-8 max-w-2xl mx-auto">
          Subscribe to our newsletter for the latest shipping updates, industry insights, and exclusive offers.
        </p>
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={subscribeEmail}
            onChange={(e) => setSubscribeEmail(e.target.value)}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
            required
          />
          <Button
            type="submit"
            disabled={subscribeLoading}
            className="bg-white text-[#88C300] hover:bg-gray-100 transition-colors duration-300 disabled:opacity-50 font-semibold"
          >
            {subscribeLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#88C300] border-t-transparent rounded-full animate-spin"></div>
                Subscribing...
              </div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>
        </form>
        {subscribeError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-200 mt-3"
          >
            {subscribeError}
          </motion.p>
        )}
        {showSuccessMessage && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-white mt-3 font-medium"
          >
            Subscription successful! Welcome to our newsletter.
          </motion.p>
        )}
        <p className="mt-4 text-sm text-white/85">
          <Link to="/unsubscribe" className="underline hover:text-white">Unsubscribe</Link>
        </p>
      </div>
    </div>
  </div>
)

export default FooterNewsletter