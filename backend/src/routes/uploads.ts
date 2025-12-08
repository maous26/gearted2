import { Router } from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Get the base URL for public assets
 * Priority: BACKEND_URL > RAILWAY_PUBLIC_DOMAIN > EXPO_PUBLIC_API_URL > localhost
 */
function getPublicBaseUrl(): string {
  // Railway sets this automatically
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  // Explicit backend URL (recommended for production)
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  // Fallback to frontend API URL (might work if same domain)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Local development fallback
  return `http://localhost:${process.env.PORT || 3000}`;
}

// Upload single image (base64)
router.post('/image', async (req, res): Promise<any> => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Extract base64 data (handle both with and without data URI prefix)
    let base64Data = image;
    let extension = 'jpg';

    if (image.startsWith('data:')) {
      // Extract mime type and base64 data
      const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        base64Data = matches[2];
      } else {
        base64Data = image.split(',')[1] || image;
      }
    }

    // Generate unique filename
    const uniqueFilename = `${randomUUID()}.${extension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    // Write file
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Build public URL
    const baseUrl = getPublicBaseUrl();
    const publicUrl = `${baseUrl}/uploads/${uniqueFilename}`;

    console.log(`[Uploads] Image saved: ${uniqueFilename}, URL: ${publicUrl}`);

    return res.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename
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

    const baseUrl = getPublicBaseUrl();
    const uploadedUrls: string[] = [];

    for (const image of images) {
      // Skip if already a valid URL (not file://)
      if (typeof image === 'string' && image.startsWith('http')) {
        uploadedUrls.push(image);
        continue;
      }

      // Skip file:// URLs - they should have been converted to base64 on frontend
      if (typeof image === 'string' && image.startsWith('file://')) {
        console.warn('[Uploads] Skipping file:// URL - should be base64:', image.substring(0, 50));
        continue;
      }

      // Extract base64 data
      let base64Data = image;
      let extension = 'jpg';

      if (typeof image === 'string' && image.startsWith('data:')) {
        const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.split(',')[1] || image;
        }
      }

      // Generate unique filename
      const uniqueFilename = `${randomUUID()}.${extension}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      // Write file
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `${baseUrl}/uploads/${uniqueFilename}`;
      uploadedUrls.push(publicUrl);

      console.log(`[Uploads] Image saved: ${uniqueFilename}, URL: ${publicUrl}`);
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

// Delete image
router.delete('/:filename', async (req, res): Promise<any> => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Uploads] Image deleted: ${filename}`);
      return res.json({ success: true, message: 'Image deleted' });
    } else {
      return res.status(404).json({ error: 'Image not found' });
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