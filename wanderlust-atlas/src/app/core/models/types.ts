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

export type ActivityCategory = 'must_do' | 'food' | 'stay' | 'photography' | 'general';

export interface UserActivity {
  id: string;
  user_id: string;
  destination_id?: string | null;
  title: string;
  category: ActivityCategory;
  is_completed: boolean;
  notes?: string | null;
  created_at: string;
  destination?: Destination;
}

export const ACTIVITY_CATEGORIES: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'must_do', label: 'Must Do', icon: '🎯' },
  { value: 'food', label: 'Food & Dining', icon: '🍜' },
  { value: 'stay', label: 'Stays & Hotels', icon: '🏨' },
  { value: 'photography', label: 'Photography', icon: '📸' },
  { value: 'general', label: 'General Task', icon: '📝' },
];

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

// TRIP PLANNER MODELS
export type TransportationMode = 'plane' | 'train' | 'bus' | 'car' | 'ship' | 'bike' | 'irctc_dormitory';

export interface TripTransportation {
  id?: string;
  trip_id?: string;
  mode: TransportationMode;
  carrier_or_name?: string | null;
  ticket_no?: string | null;
  pnr_no?: string | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  origin?: string | null;
  destination_name?: string | null;
  notes?: string | null;
  bus_no?: string | null;
  amount?: string | null;
  booking_platform?: string | null;
  booking_platform_other?: string | null;
  created_at?: string;
}

export interface TripChecklistItem {
  id: string;
  title: string;
  is_completed: boolean;
}

export interface TripDestination {
  id?: string;
  trip_id?: string;
  destination_id?: string | null;
  place_name: string;
  arrival_date?: string | null;
  departure_date?: string | null;
  // Stay / Hotel fields
  stay_name?: string | null;
  stay_address?: string | null;
  stay_booking_ref?: string | null;
  stay_booking_platform?: string | null;
  stay_booking_platform_other?: string | null;  // freetext when platform = 'other'
  stay_check_in?: string | null;                 // datetime-local string
  stay_check_out?: string | null;                // datetime-local string
  stay_rate?: string | null;                     // e.g. ₹3500/night
  stay_status?: 'confirmed' | 'cancelled' | null;
  stay_refund_status?: 'complete' | 'pending' | null; // only if cancelled
  stay_contact?: string | null;                  // phone/email of property
  stay_room_type?: string | null;                // e.g. Deluxe Double, Dormitory 4-bed
  stay_notes?: string | null;                    // personal reminder notes
  stay_duration?: string | null;                 // e.g. 6 Hours, 12 Hours, 24 Hours, or custom text
  // Entry ticket fields
  ticket_required?: boolean | null;
  ticket_booking_url?: string | null;
  ticket_booking_ref?: string | null;
  ticket_price?: string | null;
  ticket_timing_notes?: string | null;
  checklist_items?: TripChecklistItem[];
  order_index?: number;
  is_completed?: boolean;
  created_at?: string;
  destination?: Destination;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  cover_image_url?: string | null;
  created_at: string;
  transportation?: TripTransportation[];
  destinations?: TripDestination[];
}

export const TRANSPORT_MODES: { value: TransportationMode; label: string; icon: string }[] = [
  { value: 'plane', label: 'Flight / Aeroplane', icon: '✈️' },
  { value: 'train', label: 'Train / Railway', icon: '🚆' },
  { value: 'bus', label: 'Bus / Coach', icon: '🚌' },
  { value: 'car', label: 'Car / Road Trip', icon: '🚗' },
  { value: 'ship', label: 'Ship / Cruise / Ferry', icon: '🚢' },
  { value: 'bike', label: 'Motorbike / Bicycle', icon: '🏍️' },
  { value: 'irctc_dormitory', label: 'IRCTC Dormitory', icon: '🛏️' },
];
