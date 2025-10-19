import React, { useState } from 'react'
import { MapPin, Map } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const LocationTracker = () => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')
  const [showMap, setShowMap] = useState(false)

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }
        setLocation(newLocation)
        setShowMap(true)
        setError('')
      },
      (err) => {
        setError('Unable to retrieve your location. Please check your browser permissions.')
        console.error('Geolocation error:', err)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold">Location Tracker</h3>
      </div>
      
      <button 
        className="btn-primary w-full flex items-center justify-center gap-2" 
        onClick={getLocation}
      >
        <Map className="w-4 h-4" />
        Get My Location
      </button>
      
      {location && (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700">Your Location:</div>
            <div className="text-sm text-gray-600">Latitude: {location.lat.toFixed(6)}</div>
            <div className="text-sm text-gray-600">Longitude: {location.lng.toFixed(6)}</div>
          </div>
          
          {showMap && (
            <div className="h-64 rounded-lg overflow-hidden border">
              <MapContainer 
                center={[location.lat, location.lng]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[location.lat, location.lng]}>
                  <Popup>
                    <div>
                      <h3 className="font-bold">Your Location</h3>
                      <p>Lat: {location.lat.toFixed(6)}</p>
                      <p>Lng: {location.lng.toFixed(6)}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}

export default LocationTracker 