export interface UserPreferences {
  minMatchScore: number;
  autoScrapeNewProducts: boolean;
  emailNotifications: boolean;
  [key: string]: any; // Allow additional properties for JSON storage
}