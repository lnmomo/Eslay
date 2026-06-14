export type PreferenceTag =
  | "Adventure"
  | "Relaxation"
  | "Foodie"
  | "Nature"
  | "Family"
  | "Beach"
  | "Mountain"
  | "City Break"
  | "Culture";

export type AppTab = "discover" | "itinerary" | "map" | "saved" | "profile";
export type SavedView = "history" | "wishlists";
export type ProfileView = "account" | "preferences" | "system";
export type DiscoveryFilter =
  | "All"
  | "Beach"
  | "Mountain"
  | "City Break"
  | "Family"
  | "Food"
  | "Adventure"
  | "Budget"
  | "Weekend"
  | "Luxury"
  | "Couple"
  | "Nature"
  | "Culture"
  | "Relaxation"
  | "Foodie"
  | "Short Trip"
  | "Photo Spots";

export type Locale = "en" | "zh";
export type ThemeMode = "light" | "dark";

export type Destination = {
  id: string;
  city: string;
  country: string;
  title: string;
  description: string;
  image: string;
  rating: number;
  priceLevel: string;
  category: DiscoveryFilter;
  tags: PreferenceTag[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  etaMinutes: number;
  distanceKm: number;
  address: string;
  hours: string;
};

export type ItineraryStop = {
  id: string;
  destinationId: string;
  day: number;
  time: string;
  note: string;
  type: "flight" | "hotel" | "activity" | "food" | "transport";
  status: "Confirmed" | "Planned" | "Action Required" | "Delayed";
  weather?: string;
};

export type Trip = {
  id: string;
  title: string;
  dateRange: string;
  coverImage: string;
  location: string;
  status: "Upcoming" | "Past" | "Draft";
  travelerNote: string;
  durationDays?: number;
  memoryPhotos?: string[];
  travelType?: "Family" | "Solo" | "Couple" | "Work";
  stops: ItineraryStop[];
};

export type SavedFolder = {
  id: string;
  name: string;
  description: string;
  itemIds: string[];
};

export type Session = {
  phone: string;
  otp: string;
  isAuthenticated: boolean;
  authMethod: "otp" | "apple" | "google" | null;
  biometricEnabled: boolean;
};

export type RecommendationWeights = Record<PreferenceTag, number>;

export type AppState = {
  activeTab: AppTab;
  savedView: SavedView;
  profileView: ProfileView;
  locale: Locale;
  themeMode: ThemeMode;
  isOffline: boolean;
  mapAvailable: boolean;
  session: Session;
  selectedTags: PreferenceTag[];
  budgetLevel: 1 | 2 | 3 | 4 | 5;
  dietaryMode: "None" | "Vegetarian" | "Halal";
  savedDestinationIds: string[];
  interactionWeights: RecommendationWeights;
  destinations: Destination[];
  savedFolders: SavedFolder[];
  trips: Trip[];
  activeTripId: string;
  highlightedDestinationId: string | null;
  rearrangeDay: number | null;
  searchQuery: string;
  activeDiscoveryFilter: DiscoveryFilter;
  activeDiscoveryFilters: DiscoveryFilter[];
};
