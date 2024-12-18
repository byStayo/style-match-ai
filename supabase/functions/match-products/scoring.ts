import { Product, UserPreferences, MatchOptions, MatchScores } from './types.ts';
import { computeCosineSimilarity } from '../_shared/similarity.ts';

const DEFAULT_WEIGHTS = {
  style: 0.4,
  color: 0.2,
  price: 0.2,
  occasion: 0.2
};

export function calculateMatchScore(
  userEmbedding: number[],
  product: Product,
  preferences: UserPreferences,
  options: MatchOptions
): MatchScores {
  const weights = options.weights || DEFAULT_WEIGHTS;
  
  // Calculate style similarity using embeddings
  const styleScore = computeCosineSimilarity(userEmbedding, product.style_embedding);
  
  // Calculate color match score
  const colorScore = calculateColorScore(product, preferences);
  
  // Calculate price match score
  const priceScore = calculatePriceScore(product.product_price, preferences.priceRange);
  
  // Calculate occasion match score
  const occasionScore = calculateOccasionScore(product, preferences);
  
  // Calculate total weighted score
  const totalScore = (
    styleScore * weights.style +
    colorScore * weights.color +
    priceScore * weights.price +
    occasionScore * weights.occasion
  );
  
  return {
    totalScore,
    styleScore,
    colorScore,
    priceScore,
    occasionScore
  };
}

function calculateColorScore(product: Product, preferences: UserPreferences): number {
  if (!preferences.colorPreferences?.length || !product.metadata?.color_palette) {
    return 0.5;
  }
  
  const productColors = product.metadata.color_palette;
  const matchingColors = preferences.colorPreferences.filter(
    color => productColors.includes(color)
  );
  
  return matchingColors.length / Math.max(preferences.colorPreferences.length, productColors.length);
}

function calculatePriceScore(price: number, priceRange: { min: number; max: number }): number {
  if (price >= priceRange.min && price <= priceRange.max) {
    return 1.0;
  }
  
  const midPoint = (priceRange.min + priceRange.max) / 2;
  const maxDiff = priceRange.max - priceRange.min;
  const actualDiff = Math.abs(price - midPoint);
  
  return Math.max(0, 1 - (actualDiff / maxDiff));
}

function calculateOccasionScore(product: Product, preferences: UserPreferences): number {
  if (!preferences.occasionPreferences?.length || !product.metadata?.occasions) {
    return 0.5;
  }
  
  const productOccasions = product.metadata.occasions;
  const matchingOccasions = preferences.occasionPreferences.filter(
    occasion => productOccasions.includes(occasion)
  );
  
  return matchingOccasions.length / Math.max(preferences.occasionPreferences.length, productOccasions.length);
}