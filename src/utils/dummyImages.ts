/**
 * Utility function to generate dummy images for properties
 */

export const generateDummyImagesForProperty = (
  bedrooms: number,
  type: 'apartment' | 'pg' | 'hostel' | 'flat'
): {
  bedroom?: string[];
  bathroom?: string[];
  kitchen?: string[];
  living?: string[];
  balcony?: string[];
} => {
  const images = {
    bedroom: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
    ],
    bathroom: [
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=400&h=300&fit=crop',
    ],
    kitchen: [
      'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop',
    ],
    living: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    ],
    balcony: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop',
    ],
  };

  // Return appropriate images based on bedrooms and type
  const result: any = {};
  
  if (bedrooms >= 1) {
    result.bedroom = images.bedroom.slice(0, Math.min(bedrooms, 2));
  }
  result.bathroom = images.bathroom;
  result.kitchen = images.kitchen.slice(0, 1);
  result.living = type === 'apartment' || type === 'flat' ? images.living : undefined;
  result.balcony = Math.random() > 0.5 ? images.balcony.slice(0, 1) : undefined;

  return result;
};


