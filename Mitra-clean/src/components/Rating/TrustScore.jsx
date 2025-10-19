import React, { useState } from 'react'
import { Star, Image } from 'lucide-react'

const TrustScore = ({ supplierId }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photo, setPhoto] = useState(null)
  const [reviews, setReviews] = useState([])

  const handlePhotoUpload = (e) => {
    setPhoto(URL.createObjectURL(e.target.files[0]))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setReviews([...reviews, { rating, comment, photo }])
    setRating(0)
    setComment('')
    setPhoto(null)
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        {[1,2,3,4,5].map(n => (
          <Star
            key={n}
            className={`w-6 h-6 cursor-pointer ${n <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            onClick={() => setRating(n)}
          />
        ))}
        <span className="ml-2 font-semibold">Rate Supplier</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          className="input-field"
          placeholder="Leave a comment..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        <button className="btn-primary" type="submit">Submit Review</button>
      </form>
      <div>
        <h4 className="font-bold mb-2">Reviews</h4>
        {reviews.length === 0 && <div>No reviews yet.</div>}
        {reviews.map((r, i) => (
          <div key={i} className="border-b py-2">
            <div className="flex items-center gap-1">
              {[...Array(r.rating)].map((_, idx) => (
                <Star key={idx} className="w-4 h-4 text-yellow-400" />
              ))}
            </div>
            <div>{r.comment}</div>
            {r.photo && <img src={r.photo} alt="review" className="w-24 h-24 object-cover mt-2 rounded" />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrustScore 