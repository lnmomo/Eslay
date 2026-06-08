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
  updateDestinationDetails: (destinationId: string, updates: Pick<Destination, "title" | "address" | "description">) => void;
  removeSavedDestination: (destinationId: string) => void;
  addDestinationToTrip: (tripId: string, destinationId: string) => void;
  setHighlightedDestination: (destinationId: string | null) => void;
  moveStop: (tripId: string, stopId: string, direction: "up" | "down") => void;
  deleteStop: (tripId: string, stopId: string) => void;
  deleteTrip: (tripId: string) => void;
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
          const interactionWeights = { ...current.interactionWeights };
          destination.tags.forEach((tag) => {
            interactionWeights[tag] = Math.max(0.4, interactionWeights[tag] + (alreadySaved ? -0.3 : 0.8));
          });
          return {
            ...current,
            savedDestinationIds,
            interactionWeights,
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
      addDestinationToTrip: (tripId, destinationId) =>
        setState((current) => {
          const destination = current.destinations.find((item) => item.id === destinationId);
          if (!destination) {
            return current;
          }
          const targetTrip = current.trips.find((trip) => trip.id === tripId);
          const nextDay = targetTrip?.stops.reduce((max, stop) => Math.max(max, stop.day), 1) ?? 1;
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
                        day: nextDay,
                        time: "18:00",
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
            return current;
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
            travelType: "Solo",
            stops: routeDestinations.map((destination, index) => ({
              id: `${tripId}-stop-${index + 1}`,
              destinationId: destination.id,
              day: Math.floor(index / stopsPerDay) + 1,
              time: ["09:00", "11:30", "14:30", "17:30"][index % stopsPerDay] ?? "10:00",
              note:
                index % stopsPerDay === stopsPerDay - 1
                  ? current.locale === "zh"
                    ? `\u53ef\u9009\u53bb\uff1a\u5982\u679c\u5f53\u5929\u65f6\u95f4\u6216\u4f53\u529b\u5145\u8db3\uff0c\u53ef\u4ee5\u52a0\u5165\u8fd9\u4e00\u7ad9\u3002\u4e0a\u4e00\u7ad9\u8ddd\u79bb\u7ea6 ${destination.distanceKm.toFixed(1)} km\u3002`
                    : `Optional stop: add it if time and energy allow. About ${destination.distanceKm.toFixed(1)} km from the previous stop.`
                  : current.locale === "zh"
                    ? index % stopsPerDay === 0
                      ? "\u5f53\u5929\u7b2c\u4e00\u7ad9\uff0c\u4ece\u771f\u5b9e\u666f\u70b9\u5e93\u4e2d\u5339\u914d\u3002"
                      : `\u771f\u5b9e\u666f\u70b9\u63a8\u8350\u3002\u4e0a\u4e00\u7ad9\u5230\u8fd9\u91cc\u7ea6 ${destination.distanceKm.toFixed(1)} km\uff0c\u9884\u8ba1 ${destination.etaMinutes} \u5206\u949f\u3002`
                    : index % stopsPerDay === 0
                      ? "First stop of the day, matched from the real attraction library."
                      : `Real attraction recommendation. About ${destination.distanceKm.toFixed(1)} km and ${destination.etaMinutes} min from the previous stop.`,
              type: index === 1 ? "food" : "activity",
              status: index % stopsPerDay === stopsPerDay - 1 ? "Planned" : index % stopsPerDay < 2 ? "Confirmed" : "Planned",
            })),
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
