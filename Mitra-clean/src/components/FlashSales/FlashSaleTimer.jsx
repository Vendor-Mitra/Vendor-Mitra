import React, { useEffect, useState } from 'react'

const FlashSaleTimer = ({ endTime, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState('Loading...')
  const [hasExpired, setHasExpired] = useState(false)

  useEffect(() => {
    if (!endTime) {
      setTimeLeft('Ended')
      return
    }

    const updateTimer = () => {
      let end;
      try {
        end = new Date(endTime)
      } catch (error) {
        console.error('Invalid endTime:', endTime, error)
        setTimeLeft('Ended')
        return
      }
      
      const now = new Date()
      const diff = end - now
      
      if (isNaN(diff) || diff <= 0) {
        setTimeLeft('Ended')
        if (!hasExpired && onExpired) {
          setHasExpired(true)
          onExpired()
        }
      } else {
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`)
        } else {
          setTimeLeft(`${seconds}s`)
        }
      }
    }

    // Update immediately
    updateTimer()
    
    // Then update every second
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [endTime])

  return <span className="text-xs font-medium">{timeLeft}</span>
}

export default FlashSaleTimer 