import { Destination, DiscoveryFilter, PreferenceTag, RecommendationWeights } from "../types";

type RecommendationProfile = {
  budgetLevel: 1 | 2 | 3 | 4 | 5;
  dietaryMode: "None" | "Vegetarian" | "Halal";
};

const priceToLevel = (priceLevel: string) => Math.max(1, Math.min(priceLevel.length, 5));

const budgetScore = (destination: Destination, budgetLevel: RecommendationProfile["budgetLevel"]) => {
  const priceLevel = priceToLevel(destination.priceLevel);
  const distance = Math.abs(priceLevel - budgetLevel);
  const fitBoost = Math.max(0, 7 - distance * 2.2);
  const tooExpensivePenalty = priceLevel > budgetLevel ? (priceLevel - budgetLevel) * -4 : 0;
  const underBudgetPenalty = budgetLevel >= 4 && priceLevel <= 1 ? -3 : 0;
  const premiumBoost = budgetLevel >= 4 && priceLevel >= 3 ? 3.5 : 0;
  const valueBoost = budgetLevel <= 2 && priceLevel <= 2 ? 2.5 : 0;
  return fitBoost + tooExpensivePenalty + underBudgetPenalty + premiumBoost + valueBoost;
};

const dietaryScore = (destination: Destination, dietaryMode: RecommendationProfile["dietaryMode"]) => {
  if (dietaryMode === "None") {
    return 0;
  }

  const text = [destination.title, destination.description, destination.city, destination.country, destination.category, ...destination.tags]
    .join(" ")
    .toLowerCase();

  if (dietaryMode === "Vegetarian") {
    if (text.includes("panda") || text.includes("garden") || text.includes("nature") || text.includes("temple") || text.includes("tea")) {
      return 2.5;
    }
    if (destination.category === "Food" || destination.tags.includes("Foodie")) {
      return -2;
    }
  }

  if (dietaryMode === "Halal") {
    if (["dubai-marina", "maldives-villa", "singapore-gardens", "bangkok-temple"].includes(destination.id)) {
      return 3;
    }
    if (destination.category === "Food" || destination.tags.includes("Foodie")) {
      return -2.5;
    }
  }

  return 0;
};

export const scoreDestination = (
  destination: Destination,
  selectedTags: PreferenceTag[],
  weights: RecommendationWeights,
  savedIds: string[],
  profile?: RecommendationProfile,
) => {
  const tagScore = destination.tags.reduce((acc, tag) => acc + (selectedTags.includes(tag) ? weights[tag] * 3 : weights[tag]), 0);
  const savedBoost = savedIds.includes(destination.id) ? 6 : 0;
  const ratingBoost = destination.rating * 2;
  const budgetBoost = profile ? budgetScore(destination, profile.budgetLevel) : 0;
  const dietaryBoost = profile ? dietaryScore(destination, profile.dietaryMode) : 0;
  return tagScore + savedBoost + ratingBoost + budgetBoost + dietaryBoost;
};

export const sortDestinations = (
  destinations: Destination[],
  selectedTags: PreferenceTag[],
  weights: RecommendationWeights,
  savedIds: string[],
  profile?: RecommendationProfile,
) =>
  [...destinations].sort(
    (a, b) =>
      scoreDestination(b, selectedTags, weights, savedIds, profile) -
      scoreDestination(a, selectedTags, weights, savedIds, profile),
  );

export const filterDestinations = (
  destinations: Destination[],
  query: string,
  filter: DiscoveryFilter,
) =>
  destinations.filter((destination) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [destination.title, destination.city, destination.country, destination.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    const normalizedTags = destination.tags.map((tag) => tag.toLowerCase());
    const filterKey = filter.toLowerCase();
    const matchesBudget = filter === "Budget" ? destination.priceLevel === "$" || destination.priceLevel === "$$" : false;
    const matchesLuxury = filter === "Luxury" ? destination.priceLevel === "$$$" : false;
    const matchesWeekend = filter === "Weekend" || filter === "Short Trip"
      ? destination.etaMinutes <= 25
      : false;
    const matchesCouple = filter === "Couple"
      ? normalizedTags.includes("relaxation") || normalizedTags.includes("culture") || destination.category === "Beach"
      : false;
const matchesPhotoSpots = filter === "Photo Spots"
      ? normalizedTags.includes("nature") || normalizedTags.includes("culture")
      : false;
    const matchesDirect =
      destination.category === filter ||
      normalizedTags.includes(filterKey);
    const matchesFilter =
      filter === "All" ||
      matchesDirect ||
      matchesBudget ||
      matchesLuxury ||
      matchesWeekend ||
      matchesCouple ||
      matchesPhotoSpots;
    return matchesQuery && matchesFilter;
  });

export const filterDestinationsByFilters = (
  destinations: Destination[],
  query: string,
  filters: DiscoveryFilter[],
) => {
  const normalizedFilters = filters.filter((filter) => filter !== "All");
  if (normalizedFilters.length === 0) {
    return filterDestinations(destinations, query, "All");
  }

  const matched = normalizedFilters.flatMap((filter) => filterDestinations(destinations, query, filter));
  return Array.from(new Map(matched.map((destination) => [destination.id, destination])).values());
};
