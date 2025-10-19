# Image Upload Feature for Suppliers

## Overview
The supplier dashboard now includes a comprehensive image upload system that allows suppliers to add product images using either their device's camera or by selecting from their gallery.

## Features

### 1. Camera Capture
- **Direct Camera Access**: Suppliers can take photos directly using their device's camera
- **Back Camera Default**: Automatically uses the back camera for better product photography
- **High Resolution**: Captures images at 1280x720 resolution for quality
- **Preview & Retake**: Full-screen preview with option to retake photos
- **Camera Controls**: Intuitive camera interface with capture, cancel, and retake buttons

### 2. Gallery Upload
- **File Selection**: Choose existing photos from device gallery
- **Image Format Support**: Supports all common image formats (JPEG, PNG, WebP, etc.)
- **Drag & Drop Ready**: Compatible with modern file upload interfaces

### 3. Auto-Generated Images (Fallback)
- **Smart Fallback**: If no image is uploaded, the system can auto-generate images based on product names
- **API Integration**: Uses existing product image API for automatic image generation
- **User Choice**: Suppliers can choose between manual upload or auto-generation

## How to Use

### Adding Product Images

1. **Navigate to Supplier Dashboard**
   - Go to the "Product Catalog" tab
   - Click "Add Product" button

2. **Upload Image**
   - In the "Product Image" section, click "Upload Image"
   - Choose between:
     - **Choose from Gallery**: Select existing photos
     - **Take Photo**: Use camera to capture new image

3. **Camera Usage**
   - Click "Take Photo" to open camera
   - Position your product within the frame
   - Tap the capture button (white circle)
   - Preview the captured image
   - Choose "Use This Photo" or "Retake"

4. **Gallery Selection**
   - Click "Choose from Gallery"
   - Browse and select your desired image
   - Image will be automatically added to the product

5. **Auto-Generation (Optional)**
   - If you don't have a photo, enter the product name
   - Click "Generate image for [product name]"
   - System will fetch a relevant image automatically

### Flash Sale Images

The same image upload functionality is available when creating flash sales:
- Navigate to "Flash Sales" tab
- Click "Create Flash Sale"
- Use the image upload section to add product photos

## Technical Implementation

### Components
- **ImageUpload.jsx**: Main component handling camera and gallery uploads
- **SupplierDashboard.jsx**: Integrated image upload in product and flash sale forms

### Camera API
- Uses `navigator.mediaDevices.getUserMedia()` for camera access
- Canvas-based image capture for high-quality photos
- Automatic camera stream management

### File Handling
- FileReader API for gallery image processing
- Base64 encoding for image storage
- Automatic format detection and validation

## Browser Compatibility

### Camera Features
- **Mobile Browsers**: Full support (Chrome, Safari, Firefox)
- **Desktop Browsers**: Limited support (requires HTTPS)
- **HTTPS Required**: Camera access requires secure connection

### Gallery Features
- **All Modern Browsers**: Full support
- **File Input**: Standard HTML5 file input with image filtering

## Security & Privacy

- **Local Processing**: Images are processed locally before upload
- **No External Storage**: Images are not stored on external servers during capture
- **Permission Based**: Camera access requires explicit user permission
- **Secure Context**: Camera features require HTTPS connection

## Troubleshooting

### Camera Not Working
1. Ensure you're using HTTPS (required for camera access)
2. Check browser permissions for camera access
3. Try refreshing the page and granting permissions again
4. Use a mobile device for best camera experience

### Image Upload Issues
1. Check file format (JPEG, PNG, WebP supported)
2. Ensure file size is reasonable (< 10MB recommended)
3. Try selecting a different image from gallery

### Auto-Generation Fails
1. Check internet connection
2. Try a more specific product name
3. Use manual upload as fallback

## Future Enhancements

- **Image Editing**: Basic cropping and filtering options
- **Multiple Images**: Support for multiple product photos
- **Image Optimization**: Automatic compression and resizing
- **Cloud Storage**: Integration with cloud image storage services
- **AI Enhancement**: AI-powered image quality improvement
