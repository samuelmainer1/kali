import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  X, 
  Star, 
  MessageSquare, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import Cookies from 'js-cookie';

const FeedbackWidget = ({ 
  delay = 5000, 
  position = 'bottom-right',
  onFeedbackSubmit 
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [step, setStep] = useState(1); // 1: type, 2: rating, 3: comment, 4: success

  useEffect(() => {
    const feedbackSubmitted = Cookies.get('feedback-submitted');
    if (!feedbackSubmitted) {
      const timer = setTimeout(() => setShowFeedback(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const handleFeedbackType = (type) => {
    setFeedbackType(type);
    setStep(2);
  };

  const handleRating = (stars) => {
    setRating(stars);
    setStep(3);
  };

  const handleSubmit = () => {
    const feedbackData = {
      type: feedbackType,
      rating,
      comment,
      timestamp: new Date().toISOString()
    };

    // Call the callback if provided
    if (onFeedbackSubmit) {
      onFeedbackSubmit(feedbackData);
    }

    // Log to console for now (replace with actual API call)
    console.log('Feedback submitted:', feedbackData);

    // Set cookie to prevent showing again for 30 days
    Cookies.set('feedback-submitted', 'true', { expires: 30 });
    
    setFeedbackSubmitted(true);
    setStep(4);

    // Hide after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackSubmitted(false);
      setFeedbackType(null);
      setRating(0);
      setComment('');
      setStep(1);
    }, 2000);
  };

  const handleClose = () => {
    setShowFeedback(false);
    setFeedbackType(null);
    setRating(0);
    setComment('');
    setStep(1);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  if (!showFeedback) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className={`fixed ${getPositionClasses()} z-40 w-full max-w-sm`}
      >
        <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            {/* Success State */}
            {step === 4 && (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Thank you!</h3>
                <p className="text-sm text-gray-600">
                  Your feedback helps us improve our services.
                </p>
              </div>
            )}

            {/* Main Feedback Flow */}
            {step < 4 && (
              <>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">How was your experience?</h3>
                      <p className="text-xs text-gray-500">We'd love to hear from you</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Step 1: Feedback Type */}
                {step === 1 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">What would you like to share?</p>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => handleFeedbackType('positive')}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-300"
                      >
                        <ThumbsUp className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium">Positive Experience</span>
                      </button>
                      <button
                        onClick={() => handleFeedbackType('negative')}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-300"
                      >
                        <ThumbsDown className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium">Issue or Problem</span>
                      </button>
                      <button
                        onClick={() => handleFeedbackType('suggestion')}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                      >
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Suggestion</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Rating */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">How would you rate your experience?</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRating(star)}
                            className="p-1 hover:scale-110 transition-transform duration-200"
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                star <= rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {rating === 1 && <span className="flex items-center justify-center gap-1"><Frown className="w-4 h-4" /> Very Poor</span>}
                        {rating === 2 && <span className="flex items-center justify-center gap-1"><Frown className="w-4 h-4" /> Poor</span>}
                        {rating === 3 && <span className="flex items-center justify-center gap-1"><Meh className="w-4 h-4" /> Average</span>}
                        {rating === 4 && <span className="flex items-center justify-center gap-1"><Smile className="w-4 h-4" /> Good</span>}
                        {rating === 5 && <span className="flex items-center justify-center gap-1"><Smile className="w-4 h-4" /> Excellent</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Comment */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Tell us more about your experience (optional)</p>
                      <textarea
                        placeholder="Share your thoughts, suggestions, or any issues you encountered..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows="4"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStep(2)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Submit Feedback
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedbackWidget; 