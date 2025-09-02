import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';


// Define prop types
interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userWalletAddress: string | undefined;
}

// Define form data interface
interface FormData {
  overallRating: number;
  contentRating: number;
  featuresWanted: string[];
  otherSuggestion: string;
  wouldRecommend: boolean | null;
  additionalFeedback: string;
}

// Define StarRating props
interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  label: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userWalletAddress }) => {
  const [formData, setFormData] = useState<FormData>({
    overallRating: 0,
    contentRating: 0,
    featuresWanted: [],
    otherSuggestion: '',
    wouldRecommend: null,
    additionalFeedback: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  const featureOptions: string[] = [
    "Community creation and management",
    "Attention pools for extra rewards", 
    "Community chat",
    "AI Recommendations",
    "Story generator",
    "Personal feeds",
    "Others"
  ];

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, label }) => (
    <div className="mb-8">
      <h3 className="text-white text-lg mb-4 font-medium">{label}</h3>
      <div className="flex gap-4 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="flex flex-col items-center gap-2 group transition-all duration-200 hover:scale-110"
          >
            <Star 
              size={40}
              className={`transition-all duration-200 ${
                star <= rating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-400 group-hover:text-yellow-300'
              }`}
            />
            <span className={`text-lg font-semibold ${
              star <= rating ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {star}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      featuresWanted: prev.featuresWanted.includes(feature)
        ? prev.featuresWanted.filter(f => f !== feature)
        : [...prev.featuresWanted, feature]
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!userWalletAddress) {
      setSubmitError('Please connect your wallet first');
      return;
    }

    if (formData.overallRating === 0 || formData.contentRating === 0) {
      setSubmitError('Please provide both ratings');
      return;
    }

    if (formData.featuresWanted.length === 0) {
      setSubmitError('Please select at least one feature you\'d like to see');
      return;
    }

    if (formData.wouldRecommend === null) {
      setSubmitError('Please let us know if you would recommend Aristhrottle');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_wallet_address: userWalletAddress,
          overall_rating: formData.overallRating,
          content_rating: formData.contentRating,
          features_wanted: formData.featuresWanted,
          other_suggestion: formData.otherSuggestion,
          would_recommend: formData.wouldRecommend,
          additional_feedback: formData.additionalFeedback
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage(data.message || 'Feedback submitted successfully! You\'ve earned 5 $eART tokens.');
        setTimeout(() => {
          onClose();
          setSubmitMessage('');
          setFormData({
            overallRating: 0,
            contentRating: 0,
            featuresWanted: [],
            otherSuggestion: '',
            wouldRecommend: null,
            additionalFeedback: ''
          });
        }, 3000);
      } else {
        setSubmitError(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75"
      onClick={handleBackdropClick}
    >
      <div className="relative w-[90vw] max-w-xl bg-[#050D28] rounded-xl p-6 max-h-[90vh] overflow-y-auto mx-auto my-auto shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isSubmitting) {
              onClose();
            }
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-red-600/20 hover:bg-red-600/40 text-white hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          aria-label="Close feedback modal"
        >
          <X size={20} />
        </button>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-teal-400 mb-2">
              Aristhrottle Beta Feedback
            </h2>
            <p className="text-white text-lg mb-4">
              Earn 5 $eART instantly
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Team Aristhrottle is grateful for your time and attention.
              <br />
              We request you to help us improve the product by filling this feedback form.
            </p>
          </div>

          {/* Success Message */}
          {submitMessage && (
            <div className="mb-6 p-4 bg-green-600 bg-opacity-20 border border-green-500 rounded-lg text-green-400 text-center">
              {submitMessage}
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg text-red-400 text-center">
              {submitError}
            </div>
          )}

          <div className="space-y-8">
            {/* Overall Rating */}
            <StarRating
              rating={formData.overallRating}
              onRatingChange={(rating) => setFormData(prev => ({ ...prev, overallRating: rating }))}
              label="How much would you rate the overall experience on a scale of 1-5*"
            />

            {/* Content Rating */}
            <StarRating
              rating={formData.contentRating}
              onRatingChange={(rating) => setFormData(prev => ({ ...prev, contentRating: rating }))}
              label="How much would you rate the contents on a scale of 1-5*"
            />

            {/* Features Section */}
            <div className="space-y-4">
              <h3 className="text-white text-lg font-medium">
                What would you like to see next?
              </h3>
              <div className="space-y-3">
                {featureOptions.map((feature) => (
                  <label
                    key={feature}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.featuresWanted.includes(feature)}
                        onChange={() => handleFeatureToggle(feature)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                        formData.featuresWanted.includes(feature)
                          ? 'border-cyan-400 bg-cyan-400'
                          : 'border-gray-400 group-hover:border-cyan-400'
                      }`}>
                        {formData.featuresWanted.includes(feature) && (
                          <svg className="w-3 h-3 text-black m-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-white group-hover:text-cyan-400 transition-colors">
                      {feature}
                    </span>
                  </label>
                ))}
              </div>
              
              {/* Other Suggestion Text Area */}
              {formData.featuresWanted.includes("Others") && (
                <textarea
                  placeholder="Write your suggestions here"
                  value={formData.otherSuggestion}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherSuggestion: e.target.value }))}
                  className="w-full p-3 bg-[#0f1f2e] border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                  rows={3}
                  maxLength={500}
                />
              )}
            </div>

            {/* Recommendation Question */}
            <div className="space-y-4">
              <h3 className="text-white text-lg font-medium">
                Would you recommend Aristhrottle to a friend?
              </h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="recommend"
                      checked={formData.wouldRecommend === true}
                      onChange={() => setFormData(prev => ({ ...prev, wouldRecommend: true }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                      formData.wouldRecommend === true
                        ? 'border-cyan-400 bg-cyan-400'
                        : 'border-gray-400 group-hover:border-cyan-400'
                    }`}>
                      {formData.wouldRecommend === true && (
                        <div className="w-2 h-2 bg-black rounded-full m-1.5" />
                      )}
                    </div>
                  </div>
                  <span className="text-white group-hover:text-cyan-400 transition-colors">
                    Yes
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="recommend"
                      checked={formData.wouldRecommend === false}
                      onChange={() => setFormData(prev => ({ ...prev, wouldRecommend: false }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                      formData.wouldRecommend === false
                        ? 'border-cyan-400 bg-cyan-400'
                        : 'border-gray-400 group-hover:border-cyan-400'
                    }`}>
                      {formData.wouldRecommend === false && (
                        <div className="w-2 h-2 bg-black rounded-full m-1.5" />
                      )}
                    </div>
                  </div>
                  <span className="text-white group-hover:text-cyan-400 transition-colors">
                    No
                  </span>
                </label>
              </div>
            </div>

            {/* Additional Feedback */}
            <div className="space-y-4">
              <h3 className="text-white text-lg font-medium">
                Any other feedback
              </h3>
              <textarea
                placeholder="Optional, write if you have any other feedbacks for us"
                value={formData.additionalFeedback}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalFeedback: e.target.value }))}
                className="w-full p-3 bg-[#0f1f2e] border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                rows={4}
                maxLength={1000}
              />
            </div>

            {/* Character Counts */}
            <div className="text-center">
              <span className="bg-cyan-400 text-black px-3 py-1 rounded text-sm font-medium">
                {formData.additionalFeedback.length}/1000
              </span>
            </div>

            {/* Submit Button - Updated with rounded pill shape and teal color */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-teal-400 hover:bg-teal-500 text-black py-3 px-8 rounded-full font-semibold text-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;