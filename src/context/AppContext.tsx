import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  AppTab,
  Destination,
  DiscoveryFilter,
  Locale,
  PreferenceTag,
  ProfileView,
  SavedView,
  Trip,
} from "../types";
import { allPreferenceTags, defaultWeights, mockDestinations, mockSavedFolders, mockTrips } from "../data/mockData";
import { buildRealCityDestinations } from "../data/realCityPois";
import { createTheme } from "../theme/tokens";
import { placeText } from "../utils/placeNames";
import { scoreDestination } from "../utils/recommendations";
import { loadPersistedState, savePersistedState } from "../utils/storage";
import { buildBalancedStopSlots } from "../utils/itineraryDistribution";

type AppActions = {
  setActiveTab: (tab: AppTab) => void;
  setSavedView: (view: SavedView) => void;
  setProfileView: (view: ProfileView) => void;
  loginWithOtp: (phone: string, otp: string) => void;
  socialLogin: (method: "apple" | "google") => void;
  toggleTag: (tag: PreferenceTag) => void;
  setBudgetLevel: (level: 1 | 2 | 3 | 4 | 5) => void;
  setDietaryMode: (mode: "None" | "Vegetarian" | "Halal") => void;
  finalizeOnboarding: () => void;
  toggleSaveDestination: (destination: Destination) => void;
  viewDestinationRoute: (destination: Destination) => void;
  updateDestinationDetails: (destinationId: string, updates: Pick<Destination, "title" | "address" | "description">) => void;
  removeSavedDestination: (destinationId: string) => void;
  addDestinationToTrip: (tripId: string, destinationId: string, day?: number) => void;
  addActivityToTrip: (tripId: string) => void;
  updateStopTime: (tripId: string, stopId: string, time: string) => void;
  setHighlightedDestination: (destinationId: string | null) => void;
  moveStop: (tripId: string, stopId: string, direction: "up" | "down") => void;
  deleteStop: (tripId: string, stopId: string) => void;
  deleteTrip: (tripId: string) => void;
  completeTrip: (tripId: string) => void;
  addTripMemoryPhotos: (tripId: string, photoUris: string[]) => void;
  removeTripMemoryPhoto: (tripId: string, photoUri: string) => void;
  setRearrangeDay: (day: number | null) => void;
  toggleTheme: () => void;
  setLocale: (locale: Locale) => void;
  setSearchQuery: (query: string) => void;
  setDiscoveryFilter: (filter: DiscoveryFilter) => void;
  toggleDiscoveryFilter: (filter: DiscoveryFilter) => void;
  resetDiscoveryFilters: () => void;
  generateMoodTrip: (
    mood: DiscoveryFilter,
    options?: { anchorDestinationId?: string; startDate?: string; durationDays?: number },
  ) => void;
  toggleOfflineMode: () => void;
  toggleMapFallback: () => void;
  toggleBiometric: () => void;
  setActiveTrip: (tripId: string) => void;
  logout: () => void;
};

type ContextValue = {
  state: AppState & { actions: AppActions };
  theme: ReturnType<typeof createTheme>;
  allTags: PreferenceTag[];
  activeTrip: Trip;
  destinationsById: Record<string, Destination>;
  pastTrips: Trip[];
  upcomingTrip: Trip | undefined;
};

const initialState: AppState = {
  activeTab: "discover",
  savedView: "history",
  profileView: "account",
  locale: "en",
  themeMode: "light",
  isOffline: false,
  mapAvailable: true,
  session: {
    phone: "",
    otp: "",
    isAuthenticated: false,
    authMethod: null,
    biometricEnabled: true,
  },
  selectedTags: ["Adventure", "Foodie", "Nature"],
  budgetLevel: 3,
  dietaryMode: "None",
  savedDestinationIds: ["kyoto-forest", "bali-sanctuary", "seoul-market"],
  interactionWeights: defaultWeights(),
  destinations: mockDestinations,
  savedFolders: mockSavedFolders,
  trips: mockTrips,
  activeTripId: mockTrips[0].id,
  highlightedDestinationId: mockTrips[0].stops[0].destinationId,
  rearrangeDay: null,
  searchQuery: "",
  activeDiscoveryFilter: "All",
  activeDiscoveryFilters: [],
};

const AppContext = createContext<ContextValue | null>(null);

const persistableSlice = (state: AppState) => ({
  savedView: state.savedView,
  profileView: state.profileView,
  locale: state.locale,
  themeMode: state.themeMode,
  isOffline: state.isOffline,
  mapAvailable: state.mapAvailable,
  session: state.session,
  selectedTags: state.selectedTags,
  budgetLevel: state.budgetLevel,
  dietaryMode: state.dietaryMode,
  savedDestinationIds: state.savedDestinationIds,
  interactionWeights: state.interactionWeights,
  savedFolders: state.savedFolders,
  destinations: state.destinations,
  trips: state.trips,
  activeTripId: state.activeTripId,
  highlightedDestinationId: state.highlightedDestinationId,
  searchQuery: state.searchQuery,
  activeDiscoveryFilter: state.activeDiscoveryFilter,
  activeDiscoveryFilters: state.activeDiscoveryFilters,
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadPersistedState().then((saved) => {
      if (saved) {
        setState((current) => ({
          ...current,
          ...saved,
          session: {
            ...(saved.session ?? current.session),
            isAuthenticated: false,
          },
          destinations: saved.destinations ?? mockDestinations,
          savedFolders: saved.savedFolders ?? mockSavedFolders,
        }));
      }
      hydratedRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      void savePersistedState(persistableSlice(state));
    }, 400);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [state]);

  const actions = useMemo<AppActions>(
    () => ({
      setActiveTab: (tab) => setState((current) => ({ ...current, activeTab: tab })),
      setSavedView: (view) => setState((current) => ({ ...current, savedView: view })),
      setProfileView: (view) => setState((current) => ({ ...current, profileView: view })),
      loginWithOtp: (phone, otp) =>
        setState((current) => ({
          ...current,
          session: {
            ...current.session,
            phone,
            otp,
            isAuthenticated: true,
            authMethod: "otp",
          },
        })),
      socialLogin: (method) =>
        setState((current) => ({
          ...current,
          session: {
            ...current.session,
            phone: method === "apple" ? "Apple User" : "Google User",
            otp: "******",
            isAuthenticated: true,
            authMethod: method,
          },
        })),
      toggleTag: (tag) =>
        setState((current) => ({
          ...current,
          selectedTags: current.selectedTags.includes(tag)
            ? current.selectedTags.filter((item) => item !== tag)
            : [...current.selectedTags, tag],
        })),
      setBudgetLevel: (level) => setState((current) => ({ ...current, budgetLevel: level })),
      setDietaryMode: (mode) => setState((current) => ({ ...current, dietaryMode: mode })),
      finalizeOnboarding: () =>
        setState((current) => ({
          ...current,
          session: {
            ...current.session,
            isAuthenticated: true,
            authMethod: current.session.authMethod ?? "otp",
          },
        })),
      toggleSaveDestination: (destination) =>
        setState((current) => {
          const alreadySaved = current.savedDestinationIds.includes(destination.id);
          const savedDestinationIds = alreadySaved
            ? current.savedDestinationIds.filter((item) => item !== destination.id)
            : [...current.savedDestinationIds, destination.id];
          const destinationExists = current.destinations.some((item) => item.id === destination.id);
          const interactionWeights = { ...current.interactionWeights };
          destination.tags.forEach((tag) => {
            interactionWeights[tag] = Math.max(0.4, interactionWeights[tag] + (alreadySaved ? -0.3 : 0.8));
          });
          return {
            ...current,
            savedDestinationIds,
            destinations: destinationExists ? current.destinations : [...current.destinations, destination],
            interactionWeights,
          };
        }),
      viewDestinationRoute: (destination) =>
        setState((current) => {
          const routeId = `trip-route-${Date.now()}`;
          const cityStops = buildRealCityDestinations(destination, routeId, 6);
          const routeDestinations = [
            destination,
            ...cityStops.filter((item) => item.title !== destination.title).slice(0, 5),
          ];
          const destinationMap = new Map(current.destinations.map((item) => [item.id, item]));
          routeDestinations.forEach((item) => destinationMap.set(item.id, item));
          const startCity = placeText(current.locale, destination.city);
          const trip: Trip = {
            id: routeId,
            title:
              current.locale === "zh"
                ? `${startCity}路线预览`
                : `${destination.city} route preview`,
            dateRange: current.locale === "zh" ? "即时预览" : "Instant preview",
            coverImage: destination.image,
            location: destination.city,
            status: "Draft",
            travelType: "Solo",
            travelerNote:
              current.locale === "zh"
                ? "从 DIY 结果生成的临时路线，可在地图页查看位置，也可以继续加入正式行程。"
                : "Temporary route generated from a DIY result. View it on the map or add it into a formal itinerary.",
            stops: routeDestinations.map((item, index) => ({
              id: `${routeId}-stop-${index + 1}`,
              destinationId: item.id,
              day: 1,
              time: ["09:00", "10:30", "12:00", "14:30", "16:00", "18:00"][index] ?? "10:00",
              note:
                current.locale === "zh"
                  ? index === 0
                    ? "你刚刚选择查看的景点。"
                    : `同城推荐景点，距离上一站约 ${item.distanceKm.toFixed(1)} km。`
                  : index === 0
                    ? "The stop you just opened from DIY results."
                    : `Nearby in-city stop, about ${item.distanceKm.toFixed(1)} km from the previous stop.`,
              type: item.category === "Food" || item.tags.includes("Foodie") ? "food" : "activity",
              status: index === 0 ? "Confirmed" : "Planned",
            })),
          };
          return {
            ...current,
            destinations: Array.from(destinationMap.values()),
            trips: [trip, ...current.trips],
            activeTripId: routeId,
            highlightedDestinationId: destination.id,
            activeTab: "map",
          };
        }),
      updateDestinationDetails: (destinationId, updates) =>
        setState((current) => ({
          ...current,
          destinations: current.destinations.map((destination) =>
            destination.id === destinationId ? { ...destination, ...updates } : destination,
          ),
        })),
      removeSavedDestination: (destinationId) =>
        setState((current) => ({
          ...current,
          savedDestinationIds: current.savedDestinationIds.filter((id) => id !== destinationId),
          savedFolders: current.savedFolders.map((folder) => ({
            ...folder,
            itemIds: folder.itemIds.filter((id) => id !== destinationId),
          })),
        })),
      addDestinationToTrip: (tripId, destinationId, selectedDay) =>
        setState((current) => {
          const destination = current.destinations.find((item) => item.id === destinationId);
          if (!destination) {
            return current;
          }
          const targetTrip = current.trips.find((trip) => trip.id === tripId);
          const nextDay = targetTrip?.stops.reduce((max, stop) => Math.max(max, stop.day), 1) ?? 1;
          const targetDay = Math.max(1, selectedDay ?? nextDay);
          const dayStopCount = targetTrip?.stops.filter((stop) => stop.day === targetDay).length ?? 0;
          const insertTime = ["09:30", "11:30", "14:30", "17:30", "19:30"][dayStopCount] ?? "20:30";
          return {
            ...current,
            trips: current.trips.map((trip) =>
              trip.id === tripId
                ? {
                    ...trip,
                    stops: [
                      ...trip.stops,
                      {
                        id: `stop-saved-${Date.now()}`,
                        destinationId,
                        day: targetDay,
                        time: insertTime,
                        note:
                          current.locale === "zh"
                            ? "\u4ece\u6536\u85cf\u52a0\u5165\u7684\u666f\u70b9\uff0c\u53ef\u5728\u884c\u7a0b\u9875\u7ee7\u7eed\u8c03\u6574\u987a\u5e8f\u3002"
                            : "Added from saved items. You can refine the order in the itinerary page.",
                        type: destination.category === "Food" || destination.tags.includes("Foodie") ? "food" : "activity",
                        status: "Planned",
                      },
                    ],
                  }
                : trip,
            ),
            activeTripId: tripId,
            highlightedDestinationId: destinationId,
            activeTab: "itinerary",
          };
        }),
      addActivityToTrip: (tripId) =>
        setState((current) => {
          const targetTrip = current.trips.find((trip) => trip.id === tripId);
          if (!targetTrip) {
            return current;
          }
          const existingIds = new Set(targetTrip.stops.map((stop) => stop.destinationId));
          const destination =
            current.destinations.find((item) => item.city === targetTrip.location && !existingIds.has(item.id)) ??
            current.destinations.find((item) => !existingIds.has(item.id)) ??
            current.destinations[0];
          if (!destination) {
            return current;
          }
          const nextDay = targetTrip.stops.reduce((max, stop) => Math.max(max, stop.day), 1);
          return {
            ...current,
            trips: current.trips.map((trip) =>
              trip.id === tripId
                ? {
                    ...trip,
                    stops: [
                      ...trip.stops,
                      {
                        id: `stop-activity-${Date.now()}`,
                        destinationId: destination.id,
                        day: nextDay,
                        time: "15:30",
                        note:
                          current.locale === "zh"
                            ? "从添加活动入口加入的新景点，可继续编辑时间或调整顺序。"
                            : "Added from the activity action. You can edit time or rearrange it later.",
                        type: destination.category === "Food" || destination.tags.includes("Foodie") ? "food" : "activity",
                        status: "Planned",
                      },
                    ],
                  }
                : trip,
            ),
            activeTripId: tripId,
            highlightedDestinationId: destination.id,
          };
        }),
      updateStopTime: (tripId, stopId, time) =>
        setState((current) => ({
          ...current,
          trips: current.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  stops: trip.stops.map((stop) => (stop.id === stopId ? { ...stop, time } : stop)),
                }
              : trip,
          ),
        })),
      setHighlightedDestination: (destinationId) =>
        setState((current) => ({ ...current, highlightedDestinationId: destinationId, activeTab: "map" })),
      moveStop: (tripId, stopId, direction) =>
        setState((current) => ({
          ...current,
          trips: current.trips.map((trip) => {
            if (trip.id !== tripId) {
              return trip;
            }
            const index = trip.stops.findIndex((stop) => stop.id === stopId);
            if (index < 0) {
              return trip;
            }
            const targetIndex = direction === "up" ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= trip.stops.length) {
              return trip;
            }
            const reordered = [...trip.stops];
            const [moved] = reordered.splice(index, 1);
            reordered.splice(targetIndex, 0, moved);
            const regrouped = reordered.map((stop, idx) => ({
              ...stop,
              day: idx < 2 ? 1 : idx < 3 ? 2 : 3,
            }));
            return { ...trip, stops: regrouped };
          }),
        })),
      deleteStop: (tripId, stopId) =>
        setState((current) => {
          const targetTrip = current.trips.find((trip) => trip.id === tripId);
          const removedStop = targetTrip?.stops.find((stop) => stop.id === stopId);
          const trips = current.trips.map((trip) =>
            trip.id === tripId ? { ...trip, stops: trip.stops.filter((stop) => stop.id !== stopId) } : trip,
          );
          const updatedTrip = trips.find((trip) => trip.id === tripId);
          return {
            ...current,
            trips,
            highlightedDestinationId:
              current.highlightedDestinationId === removedStop?.destinationId
                ? updatedTrip?.stops[0]?.destinationId ?? null
                : current.highlightedDestinationId,
          };
        }),
      deleteTrip: (tripId) =>
        setState((current) => {
          const trips = current.trips.filter((trip) => trip.id !== tripId);
          if (trips.length === 0) {
            const emptyTrip: Trip = {
              id: `trip-empty-${Date.now()}`,
              title: current.locale === "zh" ? "新的空行程" : "New empty itinerary",
              dateRange: current.locale === "zh" ? "待规划" : "To be planned",
              coverImage: current.destinations[0]?.image ?? "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
              location: current.locale === "zh" ? "未选择目的地" : "No destination selected",
              status: "Draft",
              travelerNote:
                current.locale === "zh"
                  ? "当前行程已删除。你可以从首页生成新行程，或从收藏里加入想去的景点。"
                  : "The current itinerary was deleted. Generate a new route from Discover or add saved places.",
              travelType: "Solo",
              stops: [],
            };
            return {
              ...current,
              trips: [emptyTrip],
              activeTripId: emptyTrip.id,
              highlightedDestinationId: null,
              rearrangeDay: null,
              activeTab: "itinerary",
            };
          }
          const activeTripId = current.activeTripId === tripId ? trips[0].id : current.activeTripId;
          const activeTrip = trips.find((trip) => trip.id === activeTripId) ?? trips[0];
          return {
            ...current,
            trips,
            activeTripId: activeTrip.id,
            highlightedDestinationId: activeTrip.stops[0]?.destinationId ?? null,
            rearrangeDay: null,
          };
        }),
      completeTrip: (tripId) =>
        setState((current) => {
          const archivedTrips = current.trips.map((trip) =>
            trip.id === tripId ? { ...trip, status: "Past" as const } : trip,
          );
          const nextCurrentTrip = archivedTrips.find((trip) => trip.status !== "Past");
          const emptyTrip: Trip | null = nextCurrentTrip
            ? null
            : {
                id: `trip-empty-${Date.now()}`,
                title: current.locale === "zh" ? "新的空行程" : "New empty itinerary",
                dateRange: current.locale === "zh" ? "待规划" : "To be planned",
                coverImage:
                  current.destinations[0]?.image ??
                  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                location: current.locale === "zh" ? "未选择目的地" : "No destination selected",
                status: "Draft",
                travelerNote:
                  current.locale === "zh"
                    ? "已完成的行程已归档。你可以从首页生成下一段旅程。"
                    : "Your completed trip is archived. Generate the next journey from Discover.",
                travelType: "Solo",
                stops: [],
              };
          const activeTrip = nextCurrentTrip ?? emptyTrip;
          return {
            ...current,
            trips: emptyTrip ? [emptyTrip, ...archivedTrips] : archivedTrips,
            activeTripId: activeTrip?.id ?? current.activeTripId,
            highlightedDestinationId: activeTrip?.stops[0]?.destinationId ?? null,
            savedView: "history",
            activeTab: "saved",
            rearrangeDay: null,
          };
        }),
      addTripMemoryPhotos: (tripId, photoUris) =>
        setState((current) => ({
          ...current,
          trips: current.trips.map((trip) =>
            trip.id === tripId
              ? { ...trip, memoryPhotos: [...(trip.memoryPhotos ?? []), ...photoUris] }
              : trip,
            ),
        })),
      removeTripMemoryPhoto: (tripId, photoUri) =>
        setState((current) => ({
          ...current,
          trips: current.trips.map((trip) =>
            trip.id === tripId
              ? { ...trip, memoryPhotos: (trip.memoryPhotos ?? []).filter((uri) => uri !== photoUri) }
              : trip,
          ),
        })),
      setRearrangeDay: (day) => setState((current) => ({ ...current, rearrangeDay: day })),
      toggleTheme: () =>
        setState((current) => ({
          ...current,
          themeMode: current.themeMode === "light" ? "dark" : "light",
        })),
      setLocale: (locale) => setState((current) => ({ ...current, locale })),
      setSearchQuery: (query) => setState((current) => ({ ...current, searchQuery: query })),
      setDiscoveryFilter: (filter) =>
        setState((current) => ({
          ...current,
          activeDiscoveryFilter: filter,
          activeDiscoveryFilters: filter === "All" ? [] : [filter],
        })),
      toggleDiscoveryFilter: (filter) =>
        setState((current) => {
          if (filter === "All") {
            return { ...current, activeDiscoveryFilter: "All", activeDiscoveryFilters: [] };
          }
          const exists = current.activeDiscoveryFilters.includes(filter);
          const activeDiscoveryFilters = exists
            ? current.activeDiscoveryFilters.filter((item) => item !== filter)
            : [...current.activeDiscoveryFilters, filter];
          return {
            ...current,
            activeDiscoveryFilter: activeDiscoveryFilters[activeDiscoveryFilters.length - 1] ?? "All",
            activeDiscoveryFilters,
          };
        }),
      resetDiscoveryFilters: () =>
        setState((current) => ({
          ...current,
          activeDiscoveryFilter: "All",
          activeDiscoveryFilters: [],
        })),
      generateMoodTrip: (mood, options) =>
        setState((current) => {
          const moodDestinationIds: Partial<Record<DiscoveryFilter, string[]>> = {
            Beach: [
              "bali-sanctuary",
              "sanya-beach",
              "hongkong-harbor",
              "phuket-island",
              "dubai-marina",
              "maldives-villa",
              "santorini-sunset",
              "barcelona-gaudi",
              "singapore-gardens",
            ],
            Foodie: [
              "seoul-market",
              "tokyo-shibuya",
              "osaka-dotonbori",
              "bangkok-temple",
              "xian-wall",
              "shanghai-bund",
              "newyork-loft",
            ],
            Culture: [
              "kyoto-forest",
              "lisbon-tram",
              "beijing-palace",
              "xian-wall",
              "bangkok-temple",
              "paris-montmartre",
              "rome-colosseum",
              "barcelona-gaudi",
            ],
            Relaxation: [
              "bali-sanctuary",
              "hangzhou-westlake",
              "maldives-villa",
              "santorini-sunset",
              "guilin-river",
              "kyoto-forest",
            ],
            Family: [
              "chengdu-panda",
              "sanya-beach",
              "singapore-gardens",
              "beijing-palace",
              "rome-colosseum",
              "london-southbank",
              "guilin-river",
            ],
            Adventure: ["queenstown-trail", "zhangjiajie-avatar", "phuket-island", "xian-wall"],
            "City Break": [
              "newyork-loft",
              "shanghai-bund",
              "hongkong-harbor",
              "tokyo-shibuya",
              "osaka-dotonbori",
              "singapore-gardens",
              "london-southbank",
              "lisbon-tram",
            ],
            Luxury: ["dubai-marina", "maldives-villa", "bali-sanctuary", "santorini-sunset"],
            "Photo Spots": [
              "barcelona-gaudi",
              "santorini-sunset",
              "zhangjiajie-avatar",
              "paris-montmartre",
              "rome-colosseum",
              "hongkong-harbor",
              "shanghai-bund",
              "guilin-river",
            ],
            Nature: [
              "kyoto-forest",
              "queenstown-trail",
              "hangzhou-westlake",
              "zhangjiajie-avatar",
              "guilin-river",
              "chengdu-panda",
            ],
          };
          const moodMatches: Record<DiscoveryFilter, (destination: Destination) => boolean> = {
            All: () => true,
            Beach: (destination) => moodDestinationIds.Beach?.includes(destination.id) ?? false,
            Mountain: (destination) =>
              ["queenstown-trail", "zhangjiajie-avatar", "kyoto-forest"].includes(destination.id),
            "City Break": (destination) => moodDestinationIds["City Break"]?.includes(destination.id) ?? false,
            Family: (destination) => moodDestinationIds.Family?.includes(destination.id) ?? false,
            Food: (destination) => moodDestinationIds.Foodie?.includes(destination.id) ?? false,
            Adventure: (destination) => moodDestinationIds.Adventure?.includes(destination.id) ?? false,
            Budget: (destination) => destination.priceLevel === "$" || destination.priceLevel === "$$",
            Weekend: (destination) => destination.etaMinutes <= 30,
            Luxury: (destination) => moodDestinationIds.Luxury?.includes(destination.id) ?? false,
            Couple: (destination) =>
              ["santorini-sunset", "maldives-villa", "bali-sanctuary", "paris-montmartre", "hangzhou-westlake"].includes(destination.id),
            Nature: (destination) => moodDestinationIds.Nature?.includes(destination.id) ?? false,
            Culture: (destination) => moodDestinationIds.Culture?.includes(destination.id) ?? false,
            Relaxation: (destination) => moodDestinationIds.Relaxation?.includes(destination.id) ?? false,
            Foodie: (destination) => moodDestinationIds.Foodie?.includes(destination.id) ?? false,
            "Short Trip": (destination) =>
              ["seoul-market", "newyork-loft", "hongkong-harbor", "tokyo-shibuya", "osaka-dotonbori", "singapore-gardens"].includes(destination.id),
            "Photo Spots": (destination) => moodDestinationIds["Photo Spots"]?.includes(destination.id) ?? false,
          };
          const candidates = current.destinations
            .filter(moodMatches[mood])
            .sort(
              (a, b) =>
                scoreDestination(b, current.selectedTags, current.interactionWeights, current.savedDestinationIds, {
                  budgetLevel: current.budgetLevel,
                  dietaryMode: current.dietaryMode,
                }) -
                scoreDestination(a, current.selectedTags, current.interactionWeights, current.savedDestinationIds, {
                  budgetLevel: current.budgetLevel,
                  dietaryMode: current.dietaryMode,
                }),
            )
            .slice(0, 8);
          const anchor = options?.anchorDestinationId
            ? current.destinations.find((destination) => destination.id === options.anchorDestinationId)
            : undefined;
          const merged = [
            ...(anchor ? [anchor] : []),
            ...candidates.filter((destination) => destination.id !== anchor?.id),
          ];
          const fallback = (merged.length > 0 ? merged : current.destinations).slice(0, Math.max(3, options?.durationDays ?? 3) + 2);
          const durationDays = Math.max(1, Math.min(options?.durationDays ?? 3, 7));
          const startDate = options?.startDate?.trim() || (current.locale === "zh" ? "自选日期" : "Custom date");
          const tripId = `trip-mood-${Date.now()}`;
          const stopsPerDay = 4;
          const realCityDestinations = anchor ? buildRealCityDestinations(anchor, tripId, durationDays * stopsPerDay) : [];
          const generatedDestinations: Destination[] = anchor
            ? realCityDestinations.length > 0
              ? realCityDestinations
              : [anchor]
            : fallback;
          const routeDestinations = anchor ? generatedDestinations : fallback;
          const stopSlots = buildBalancedStopSlots(routeDestinations.length, durationDays);
          const trip: Trip = {
            id: tripId,
            title:
              current.locale === "zh"
                ? `${anchor ? placeText(current.locale, anchor.city) : "心情"}景点行程`
                : `${anchor?.city ?? "Mood"} itinerary`,
            dateRange:
              current.locale === "zh"
                ? `${startDate} · ${durationDays} 天`
                : `${startDate} · ${durationDays} days`,
            coverImage: anchor?.image ?? fallback[0]?.image ?? current.destinations[0].image,
            location: anchor?.city ?? fallback.map((destination) => destination.city).slice(0, 3).join(" / "),
            status: "Upcoming",
            travelerNote:
              current.locale === "zh"
                ? "根据你的心情自动生成的景点路线，可继续在行程页调整顺序。"
                : "Generated from your mood and ready to refine in the itinerary timeline.",
            durationDays,
            travelType: "Solo",
            stops: routeDestinations.map((destination, index) => {
              const slot = stopSlots[index] ?? { day: 1, position: index, daySize: routeDestinations.length };
              const isFirstStop = slot.position === 0;
              const isLastStop = slot.position === slot.daySize - 1;
              const timeOptions = ["09:00", "11:30", "14:30", "17:30", "19:30"];
              return {
              id: `${tripId}-stop-${index + 1}`,
              destinationId: destination.id,
              day: slot.day,
              time: timeOptions[slot.position] ?? "20:30",
              note:
                isLastStop
                  ? current.locale === "zh"
                    ? `\u53ef\u9009\u53bb\uff1a\u5982\u679c\u5f53\u5929\u65f6\u95f4\u6216\u4f53\u529b\u5145\u8db3\uff0c\u53ef\u4ee5\u52a0\u5165\u8fd9\u4e00\u7ad9\u3002\u4e0a\u4e00\u7ad9\u8ddd\u79bb\u7ea6 ${destination.distanceKm.toFixed(1)} km\u3002`
                    : `Optional stop: add it if time and energy allow. About ${destination.distanceKm.toFixed(1)} km from the previous stop.`
                  : current.locale === "zh"
                    ? isFirstStop
                      ? "\u5f53\u5929\u7b2c\u4e00\u7ad9\uff0c\u4ece\u771f\u5b9e\u666f\u70b9\u5e93\u4e2d\u5339\u914d\u3002"
                      : `\u771f\u5b9e\u666f\u70b9\u63a8\u8350\u3002\u4e0a\u4e00\u7ad9\u5230\u8fd9\u91cc\u7ea6 ${destination.distanceKm.toFixed(1)} km\uff0c\u9884\u8ba1 ${destination.etaMinutes} \u5206\u949f\u3002`
                    : isFirstStop
                      ? "First stop of the day, matched from the real attraction library."
                      : `Real attraction recommendation. About ${destination.distanceKm.toFixed(1)} km and ${destination.etaMinutes} min from the previous stop.`,
              type: index === 1 ? "food" : "activity",
              status: isLastStop ? "Planned" : slot.position < 2 ? "Confirmed" : "Planned",
            };
            }),
          };
          return {
            ...current,
            destinations: anchor ? [...current.destinations, ...generatedDestinations] : current.destinations,
            trips: [trip, ...current.trips],
            activeTripId: tripId,
            highlightedDestinationId: routeDestinations[0]?.id ?? current.highlightedDestinationId,
            activeTab: "itinerary",
          };
        }),
      toggleOfflineMode: () => setState((current) => ({ ...current, isOffline: !current.isOffline })),
      toggleMapFallback: () => setState((current) => ({ ...current, mapAvailable: !current.mapAvailable })),
      toggleBiometric: () =>
        setState((current) => ({
          ...current,
          session: {
            ...current.session,
            biometricEnabled: !current.session.biometricEnabled,
          },
        })),
      setActiveTrip: (tripId) =>
        setState((current) => ({
          ...current,
          activeTripId: tripId,
          highlightedDestinationId:
            current.trips.find((trip) => trip.id === tripId)?.stops[0]?.destinationId ?? current.highlightedDestinationId,
        })),
      logout: () =>
        setState((current) => ({
          ...initialState,
          themeMode: current.themeMode,
          locale: current.locale,
        })),
    }),
    [],
  );

  const theme = useMemo(() => createTheme(state.themeMode), [state.themeMode]);
  const activeTrip = state.trips.find((trip) => trip.id === state.activeTripId) ?? state.trips[0];
  const destinationsById = useMemo(
    () => Object.fromEntries(state.destinations.map((destination) => [destination.id, destination])),
    [state.destinations],
  );
  const pastTrips = state.trips.filter((trip) => trip.status === "Past");
  const upcomingTrip = state.trips.find((trip) => trip.status === "Upcoming");

  const value: ContextValue = {
    state: { ...state, actions },
    theme,
    allTags: allPreferenceTags,
    activeTrip,
    destinationsById,
    pastTrips,
    upcomingTrip,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
