// Default placeholder image for products
export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300/4B5D3A/FFFFFF?text=Photo';

/**
 * Returns a valid image URL for display.
 * Replaces file:// URIs (which are device-local and not accessible to other users)
 * with a placeholder image.
 *
 * @param imageUrl - The image URL to validate
 * @param placeholder - Optional custom placeholder URL
 * @returns A valid HTTP(S) URL or the placeholder
 */
export function getValidImageUrl(
  imageUrl: string | undefined | null,
  placeholder: string = PLACEHOLDER_IMAGE
): string {
  if (!imageUrl) {
    return placeholder;
  }

  // Check if it's a valid HTTP(S) URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // file:// URLs are local device paths - not accessible to other users
  // Return placeholder instead
  return placeholder;
}

/**
 * Returns the first valid image URL from an array of images.
 *
 * @param images - Array of image URLs
 * @param placeholder - Optional custom placeholder URL
 * @returns A valid HTTP(S) URL or the placeholder
 */
export function getFirstValidImage(
  images: string[] | undefined | null,
  placeholder: string = PLACEHOLDER_IMAGE
): string {
  if (!images || images.length === 0) {
    return placeholder;
  }

  // Try to find the first valid HTTP(S) URL
  for (const img of images) {
    if (img && (img.startsWith('http://') || img.startsWith('https://'))) {
      return img;
    }
  }

  // No valid URL found, return placeholder
  return placeholder;
}
