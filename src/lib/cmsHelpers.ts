import animalIbex from '@/assets/animal-ibex.jpg';
import animalVulture from '@/assets/animal-vulture.jpg';
import animalEagle from '@/assets/animal-eagle.jpg';
import animalFox from '@/assets/animal-fox.jpg';
import { SiteContent } from '@/hooks/useSiteContent';

// Default images for when CMS doesn't have an image
export const defaultImages: Record<string, string> = {
  'animal.ibex': animalIbex,
  'animal.vulture': animalVulture,
  'animal.eagle': animalEagle,
  'animal.fox': animalFox,
};

export function getDefaultImage(contentKey: string): string {
  return defaultImages[contentKey] || '';
}

// Get localized value from site content
export function getLocalizedValue(content: SiteContent, isRTL: boolean): string {
  return (isRTL ? content.valueHe : content.valueEn) || content.valueHe || content.valueEn || '';
}

// Get localized metadata field
export function getLocalizedMeta(content: SiteContent, field: string, isRTL: boolean): string {
  const heField = `${field}He`;
  const enField = `${field}En`;
  const meta = content.metadata || {};
  return (isRTL ? meta[heField] : meta[enField]) || meta[heField] || meta[enField] || '';
}

// Get image from content metadata or fallback to default
export function getContentImage(content: SiteContent): string {
  const imageUrl = content.metadata?.imageUrl;
  if (imageUrl) return imageUrl;
  
  // Check if it's a local path reference
  const imagePath = content.metadata?.image;
  if (imagePath) {
    // Try to get from defaults based on content key
    return defaultImages[content.contentKey] || imagePath;
  }
  
  return getDefaultImage(content.contentKey);
}
