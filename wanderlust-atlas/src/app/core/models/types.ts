// Core type definitions for Wanderlust Atlas

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
  created_at: string;
}

export type DestinationCategory =
  | 'adventure'
  | 'beach'
  | 'culture'
  | 'nature'
  | 'road_trip'
  | 'city'
  | 'spiritual'
  | 'wildlife';

export type Difficulty = 'easy' | 'moderate' | 'challenging';

export type BucketListStatus = 'dreaming' | 'planning' | 'booked' | 'completed';

export type PriorityLevel = 'low' | 'medium' | 'high';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Destination {
  id: string;
  name: string;
  country: string;
  continent: string;
  category: DestinationCategory;
  description: string | null;
  image_url: string | null;
  mood_tags: string[];
  difficulty: Difficulty | null;
  best_season: string | null;
  avg_cost_usd: number | null;
  recommended_duration_days?: string | null;
  nearest_airport?: string | null;
  local_currency_language?: string | null;
  visa_info?: string | null;
  must_try_activities?: string | null;
  is_featured: boolean;
  approval_status?: ApprovalStatus;
  submitted_by?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface BucketListItem {
  id: string;
  user_id: string;
  destination_id: string;
  status: BucketListStatus;
  target_year: number | null;
  target_month?: string | null;
  estimated_budget_usd?: number | null;
  priority?: PriorityLevel;
  notes: string | null;
  travel_tips?: string | null;
  added_at: string;
  destination?: Destination;
}

export interface Travelogue {
  id: string;
  user_id: string;
  destination_id?: string | null;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  pdf_url: string | null;
  is_published: boolean;
  created_at: string;
  profile?: Profile;
  destination?: Destination;
}

export interface UserFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface DestinationFilters {
  category?: DestinationCategory;
  continent?: string;
  difficulty?: Difficulty;
  minCost?: number;
  maxCost?: number;
  bestSeason?: string;
  search?: string;
  sortBy?: 'featured' | 'newest' | 'alphabetical' | 'cost_asc' | 'cost_desc';
  featured?: boolean;
  approvalStatus?: ApprovalStatus;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export const CATEGORIES: { value: DestinationCategory; label: string; icon: string; description: string }[] = [
  { value: 'adventure', label: 'Adventure', icon: '🏔️', description: 'Extreme experiences, hiking, climbing' },
  { value: 'beach', label: 'Beach', icon: '🏖️', description: 'Coastal paradise, islands, diving' },
  { value: 'culture', label: 'Culture', icon: '🏛️', description: 'History, museums, ancient cities' },
  { value: 'nature', label: 'Nature', icon: '🌿', description: 'National parks, forests, wildlife' },
  { value: 'road_trip', label: 'Road Trip', icon: '🚗', description: 'Scenic drives, open roads' },
  { value: 'city', label: 'City', icon: '🌆', description: 'Urban exploration, food, nightlife' },
  { value: 'spiritual', label: 'Spiritual', icon: '🕌', description: 'Temples, pilgrimage, wellness retreats' },
  { value: 'wildlife', label: 'Wildlife', icon: '🦁', description: 'Safari, animal encounters, conservation' },
];

export const CONTINENTS = [
  'Africa',
  'Antarctica',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
];

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter', 'Year-round'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const STATUS_CONFIG: Record<BucketListStatus, { label: string; icon: string; color: string }> = {
  dreaming: { label: 'Dreaming', icon: '✨', color: '#a78bfa' },
  planning: { label: 'Planning', icon: '📋', color: '#f5c842' },
  booked: { label: 'Booked', icon: '✈️', color: '#60a5fa' },
  completed: { label: 'Completed', icon: '✅', color: '#22c55e' },
};
