import React, { useState, useEffect } from 'react'
import { Star, Upload, X, Camera } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { reviewsDatabase } from '../../data/userDatabase'

const ReviewSystem = ({ itemId, itemName, supplierId, supplierName, onClose, onSubmit, readOnly = false }) => {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [reviews, setReviews] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  // Load existing reviews for this supplier
  useEffect(() => {
    if (supplierId) {
      const existingReviews = reviewsDatabase.getReviewsBySupplier(supplierId)
      setReviews(existingReviews)
    }
  }, [supplierId])

  const handleSubmitReview = () => {
    if (rating === 0) {
      alert('Please select a rating')
      return
    }

    if (!comment.trim()) {
      alert('Please write a comment')
      return
    }

    setLoading(true)

    try {
      const newReview = {
        productId: itemId,
        productName: itemName,
        supplierId: supplierId,
        supplierName: supplierName,
        vendorId: user?.id || 1,
        vendorName: user?.name || 'Anonymous',
        rating,
        comment,
        image: imagePreview,
        date: new Date().toISOString(),
        status: 'published'
      }

      // Save to database
      const savedReview = reviewsDatabase.addReview(newReview)
      console.log('Review submitted successfully:', savedReview)
      
      // Update local state
      setReviews(prev => [...prev, savedReview])
      setRating(0)
      setComment('')
      setSelectedImage(null)
      setImagePreview(null)
      setShowForm(false)

      if (onSubmit) {
        onSubmit(savedReview)
      }

      // Close the modal after successful submission
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Reviews for {itemName}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Average Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= averageRating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {averageRating} ({reviews.length} reviews)
          </span>
        </div>

        {/* Write Review Button - Only show if not read-only */}
        {!readOnly && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors mb-4"
          >
            Write a Review
          </button>
        )}

        {/* Review Form - Only show if not read-only */}
        {!readOnly && showForm && (
          <div className="border rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3">Write Your Review</h4>
            
            {/* Rating Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows="3"
              />
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photo (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {!imagePreview ? (
                  <div>
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer text-primary-600 hover:text-primary-700"
                    >
                      Click to upload image
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2">
              <button
                onClick={handleSubmitReview}
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No reviews yet for this supplier.</p>
              <p className="text-sm">Be the first to share your experience!</p>
            </div>
          ) : (
            <>
              {/* Past Reviews Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Past Reviews ({reviews.length})</h4>
              </div>
              
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{review.vendorName || 'Anonymous'}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                  {review.image && (
                    <img
                      src={review.image}
                      alt="Review"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewSystem 