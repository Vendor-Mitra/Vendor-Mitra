import React, { useState, useRef, useEffect } from 'react'
import { Camera, Image, Upload, X, RotateCcw } from 'lucide-react'

const ImageUpload = ({ onImageSelect, currentImage, onRemoveImage }) => {
  const [showOptions, setShowOptions] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)

  // Cleanup effect to stop camera when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      document.body.style.overflow = 'auto'
    }
  }, [stream])

  const handleGalleryUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onImageSelect(e.target.result)
        setShowOptions(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      setIsCapturing(true)
      // Prevent body scrolling when camera is active
      document.body.style.overflow = 'hidden'
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        // Wait for video to load before setting up orientation
        videoRef.current.onloadedmetadata = () => {
          // Force video to fit container properly
          videoRef.current.style.transform = 'scaleX(-1)' // Mirror the video for better UX
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
      setIsCapturing(false)
      document.body.style.overflow = 'auto'
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
    setCapturedImage(null)
    // Restore body scrolling
    document.body.style.overflow = 'auto'
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height)

      // Flip the image horizontally to correct the mirror effect
      context.save()
      context.scale(-1, 1)
      context.translate(-canvas.width, 0)
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Restore context
      context.restore()

      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageDataUrl)
      onImageSelect(imageDataUrl)
      
      // Stop camera after capture
      stopCamera()
      setShowOptions(false)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleRemoveImage = () => {
    onRemoveImage()
    setCapturedImage(null)
  }

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {(currentImage || capturedImage) && (
        <div className="relative">
          <img 
            src={capturedImage || currentImage} 
            alt="Product" 
            className="w-full h-48 object-cover rounded-lg border"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Options */}
      {!currentImage && !capturedImage && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="space-y-4">
            <div className="text-gray-500">
              <Upload className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Upload product image</p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowOptions(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                Upload Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Image</h3>
              <button
                onClick={() => {
                  setShowOptions(false)
                  stopCamera()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGalleryUpload}
                className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <Image className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Choose from Gallery</div>
                  <div className="text-sm text-gray-500">Select an existing photo</div>
                </div>
              </button>

              <button
                onClick={startCamera}
                className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <Camera className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Take Photo</div>
                  <div className="text-sm text-gray-500">Use camera to capture</div>
                </div>
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

             {/* Camera Interface */}
       {isCapturing && (
         <div className="fixed inset-0 bg-black flex flex-col z-50">
           {/* Header */}
           <div className="flex justify-between items-center p-4 bg-black text-white z-10">
             <button
               onClick={stopCamera}
               className="text-white hover:text-gray-300 p-2"
             >
               <X className="w-6 h-6" />
             </button>
             <span className="text-lg font-medium">Take Photo</span>
             <div className="w-10"></div> {/* Spacer for centering */}
           </div>

           {/* Camera View */}
           <div className="flex-1 relative overflow-hidden">
             <video
               ref={videoRef}
               autoPlay
               playsInline
               muted
               className="w-full h-full object-cover"
               style={{ transform: 'scaleX(-1)' }}
             />
             
             {/* Camera overlay with better positioning */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="border-2 border-white rounded-lg w-64 h-64 opacity-50"></div>
             </div>

             {/* Instructions */}
             <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
               <p className="text-sm">Position your product in the frame</p>
             </div>
           </div>

           {/* Camera controls - Fixed at bottom */}
           <div className="bg-black bg-opacity-90 p-6">
             <div className="flex items-center justify-center gap-8">
               <button
                 onClick={stopCamera}
                 className="bg-white bg-opacity-20 p-4 rounded-full hover:bg-opacity-30 transition-all"
               >
                 <X className="w-6 h-6 text-white" />
               </button>
               
               <button
                 onClick={captureImage}
                 className="bg-white p-6 rounded-full hover:bg-gray-100 transition-all shadow-lg"
               >
                 <div className="w-16 h-16 border-4 border-gray-800 rounded-full"></div>
               </button>

               <button
                 onClick={retakePhoto}
                 className="bg-white bg-opacity-20 p-4 rounded-full hover:bg-opacity-30 transition-all"
               >
                 <RotateCcw className="w-6 h-6 text-white" />
               </button>
             </div>
           </div>

           {/* Hidden canvas for capturing */}
           <canvas ref={canvasRef} className="hidden" />
         </div>
       )}

      {/* Captured Image Preview */}
      {capturedImage && !isCapturing && (
        <div className="fixed inset-0 bg-black flex flex-col z-50">
          <div className="flex justify-between items-center p-4 bg-black text-white">
            <button
              onClick={retakePhoto}
              className="text-white hover:text-gray-300 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <span className="text-lg font-medium">Preview</span>
            <button
              onClick={() => {
                setCapturedImage(null)
                setShowOptions(false)
              }}
              className="text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={capturedImage}
              alt="Captured"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="p-4 bg-black">
            <button
              onClick={() => {
                onImageSelect(capturedImage)
                setCapturedImage(null)
                setShowOptions(false)
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
            >
              Use This Photo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
