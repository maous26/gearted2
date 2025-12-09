import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Check if Cloudinary is properly configured
 */
function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(base64Data: string, folder: string = 'gearted'): Promise<string> {
  // Ensure the base64 string has the data URI prefix
  let dataUri = base64Data;
  if (!base64Data.startsWith('data:')) {
    dataUri = `data:image/jpeg;base64,${base64Data}`;
  }

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
      { quality: 'auto:good' }, // Auto quality optimization
      { fetch_format: 'auto' }, // Auto format (webp where supported)
    ],
  });

  return result.secure_url;
}

// Upload single image (base64)
router.post('/image', async (req, res): Promise<any> => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.error('[Uploads] Cloudinary is not configured! Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
      return res.status(500).json({
        error: 'Image storage not configured',
        details: 'Please configure Cloudinary environment variables'
      });
    }

    // Extract base64 data (handle both with and without data URI prefix)
    let base64Data = image;

    if (image.startsWith('data:')) {
      // Already has data URI prefix, use as is
      base64Data = image;
    } else if (image.startsWith('file://')) {
      console.warn('[Uploads] Received file:// URL - should be base64:', image.substring(0, 50));
      return res.status(400).json({
        error: 'Invalid image format',
        details: 'Please send base64 encoded image, not file:// URL'
      });
    }

    // Upload to Cloudinary
    const publicUrl = await uploadToCloudinary(base64Data);

    console.log(`[Uploads] Image uploaded to Cloudinary: ${publicUrl}`);

    return res.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error('[Uploads] Error uploading image:', error);
    return res.status(500).json({
      error: 'Failed to upload image',
      details: error.message
    });
  }
});

// Upload multiple images (base64 array)
router.post('/images', async (req, res): Promise<any> => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.error('[Uploads] Cloudinary is not configured! Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
      return res.status(500).json({
        error: 'Image storage not configured',
        details: 'Please configure Cloudinary environment variables'
      });
    }

    const uploadedUrls: string[] = [];

    for (const image of images) {
      // Skip if already a valid Cloudinary or HTTPS URL
      if (typeof image === 'string' && image.startsWith('https://')) {
        uploadedUrls.push(image);
        continue;
      }

      // Skip file:// URLs - they should have been converted to base64 on frontend
      if (typeof image === 'string' && image.startsWith('file://')) {
        console.warn('[Uploads] Skipping file:// URL - should be base64:', image.substring(0, 50));
        continue;
      }

      // Upload to Cloudinary
      try {
        const publicUrl = await uploadToCloudinary(image);
        uploadedUrls.push(publicUrl);
        console.log(`[Uploads] Image uploaded to Cloudinary: ${publicUrl}`);
      } catch (uploadError: any) {
        console.error('[Uploads] Failed to upload single image:', uploadError.message);
        // Continue with other images
      }
    }

    return res.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length
    });
  } catch (error: any) {
    console.error('[Uploads] Error uploading images:', error);
    return res.status(500).json({
      error: 'Failed to upload images',
      details: error.message
    });
  }
});

// Delete image from Cloudinary
router.delete('/:publicId', async (req, res): Promise<any> => {
  try {
    const { publicId } = req.params;

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({ error: 'Cloudinary not configured' });
    }

    // Cloudinary public_id for deletion (without extension)
    const result = await cloudinary.uploader.destroy(`gearted/${publicId}`);

    if (result.result === 'ok') {
      console.log(`[Uploads] Image deleted from Cloudinary: ${publicId}`);
      return res.json({ success: true, message: 'Image deleted' });
    } else {
      return res.status(404).json({ error: 'Image not found or already deleted' });
    }
  } catch (error: any) {
    console.error('[Uploads] Error deleting image:', error);
    return res.status(500).json({
      error: 'Failed to delete image',
      details: error.message
    });
  }
});

export default router;
