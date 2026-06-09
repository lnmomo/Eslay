import React, { useMemo, useState } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PoiImageBackground } from "../components/PoiImageBackground";
import { DestinationCard, HeroCard, Input, Pill, Screen, SearchBar, SectionTitle, SoftCard } from "../components/Ui";
import { useAppContext } from "../context/AppContext";
import { discoveryFilters } from "../data/mockData";
import { buildRealCityDestinations, getPoiImage, getRealCityPois } from "../data/realCityPois";
import { radius, spacing } from "../theme/tokens";
import { Destination, DiscoveryFilter } from "../types";
import { filterDestinationsByFilters, sortDestinations } from "../utils/recommendations";
import { filterText, t, tagText, textFor } from "../utils/i18n";
import { placeText } from "../utils/placeNames";

type PlanningMode = "mood" | "diy";
type BusinessService = "flights" | "hotels" | "attractions" | "food" | "guides";
type BusinessApiItem = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  meta: string;
  badge: string;
};

const cn = {
  heroTitle: "\u4f60\u60f3\u600e\u4e48\u5f00\u59cb\u8fd9\u6b21\u65c5\u884c\uff1f",
  heroSub: "\u5148\u9009\u5fc3\u60c5\uff0c\u518d\u9009\u57ce\u5e02\u3001\u51fa\u53d1\u65e5\u671f\u548c\u6e38\u73a9\u5929\u6570\uff1b\u6216\u8fdb\u5165 DIY\uff0c\u7528\u8be6\u7ec6\u7b5b\u9009\u81ea\u5df1\u642d\u884c\u7a0b\u3002",
  moodMode: "\u6839\u636e\u5fc3\u60c5\u751f\u6210",
  diyMode: "\u81ea\u5df1 DIY \u884c\u7a0b",
  moodSub: "\u9009\u57ce\u5e02\u540e\u4e00\u952e\u751f\u6210",
  diySub: "\u641c\u7d22\u548c\u8be6\u7ec6\u7b5b\u9009",
  pickMood: "\u9009\u62e9\u4eca\u5929\u7684\u65c5\u884c\u5fc3\u60c5",
  pickCity: "\u4ece\u5339\u914d\u57ce\u5e02\u4e2d\u9009\u4e00\u4e2a",
  datePlan: "\u9009\u62e9\u51fa\u53d1\u65e5\u671f\u548c\u6301\u7eed\u5929\u6570",
  startDate: "\u51fa\u53d1\u65e5\u671f",
  duration: "\u6e38\u73a9\u5929\u6570",
  days: "\u5929",
  preview: "\u5c06\u751f\u6210\u7684\u666f\u70b9\u884c\u7a0b",
  generate: "\u4e00\u952e\u751f\u6210",
  selectedCity: "\u5df2\u9009\u57ce\u5e02",
  serviceEntry: "\u9009\u62e9\u4e1a\u52a1\u5165\u53e3",
  results: "\u4e2a\u7ed3\u679c",
  preferencePilot: "\u504f\u597d\u9a7e\u9a76\u4eea",
  routeSignal: "\u8def\u7ebf\u4fe1\u53f7",
  moodAtlas: "\u60c5\u7eea\u661f\u56fe",
};

const businessEntries: Array<{
  label: string;
  code: string;
  filter: DiscoveryFilter;
  caption: string;
  zhCaption: string;
  service: BusinessService;
}> = [
  { label: "Flights", code: "AIR", filter: "Budget", caption: "Low fare", zhCaption: "\u4f4e\u4ef7\u51fa\u884c", service: "flights" },
  { label: "Hotels", code: "HTL", filter: "Luxury", caption: "Stay well", zhCaption: "\u4f4f\u5f97\u66f4\u597d", service: "hotels" },
  { label: "Tickets", code: "POI", filter: "Culture", caption: "Attractions", zhCaption: "\u666f\u70b9\u95e8\u7968", service: "attractions" },
  { label: "Food", code: "FOOD", filter: "Foodie", caption: "Local eats", zhCaption: "\u5f53\u5730\u7f8e\u98df", service: "food" },
  { label: "Guides", code: "GUIDE", filter: "Short Trip", caption: "Ideas", zhCaption: "\u653b\u7565\u7075\u611f", service: "guides" },
];

const businessTitle = (service: BusinessService, zh: boolean) =>
  zh
    ? ({
        flights: "\u673a\u7968",
        hotels: "\u9152\u5e97",
        attractions: "\u666f\u70b9\u95e8\u7968",
        food: "\u7f8e\u98df",
        guides: "\u653b\u7565",
      }[service])
    : ({
        flights: "Flights",
        hotels: "Hotels",
        attractions: "Attractions",
        food: "Food",
        guides: "Guides",
      }[service]);

const businessGlyph = (service: BusinessService) =>
  ({
    flights: "AIR",
    hotels: "BED",
    attractions: "POI",
    food: "EAT",
    guides: "MAP",
  })[service];

const mockBusinessApi = (service: BusinessService, city: string, zh: boolean): BusinessApiItem[] => {
  const cityName = city ? placeText(zh ? "zh" : "en", city) : (zh ? "\u76ee\u7684\u5730" : "Selected destination");
  const data: Record<BusinessService, BusinessApiItem[]> = {
    flights: [
      {
        id: "flight-1",
        title: zh ? `${cityName}\u7279\u60e0\u5f80\u8fd4` : `${cityName} saver round trip`,
        subtitle: zh ? `\u524d\u5f80${cityName}\u7684\u4fbf\u6377\u822a\u7ebf\uff0c\u542b\u884c\u674e\u989d\u4e0e\u53ef\u6539\u7b7e\u65f6\u6bb5` : `Convenient route to ${cityName}, baggage included with a flexible change window`,
        price: zh ? "\u00a5 1280 \u8d77" : "$178+",
        meta: zh ? `${cityName}  \u76f4\u98de\u4f18\u5148` : `${cityName}  direct-first`,
        badge: zh ? "\u7279\u60e0" : "DEAL",
      },
      {
        id: "flight-2",
        title: zh ? `${cityName}\u591c\u95f4\u62b5\u8fbe\u65b9\u6848` : `${cityName} late-arrival option`,
        subtitle: zh ? `\u9002\u5408\u4e0b\u73ed\u540e\u51fa\u53d1\uff0c\u62b5\u8fbe${cityName}\u540e\u7b2c\u4e8c\u5929\u76f4\u63a5\u5f00\u73a9` : `After-work departure, arrive in ${cityName} and start exploring the next morning`,
        price: zh ? "\u00a5 960 \u8d77" : "$132+",
        meta: zh ? `${cityName}  \u7ecf\u6d4e\u8212\u9002` : `${cityName}  value comfort`,
        badge: zh ? "\u63a8\u8350" : "PICK",
      },
    ],
    hotels: [
      {
        id: "hotel-1",
        title: zh ? `${cityName}\u57ce\u5e02\u4e2d\u5fc3\u8bbe\u8ba1\u9152\u5e97` : `${cityName} central design hotel`,
        subtitle: zh ? `\u4f4d\u4e8e${cityName}\u6838\u5fc3\u533a\uff0c\u6b65\u884c\u53ef\u5230\u4e3b\u8981\u666f\u70b9\uff0c\u65e9\u9910\u8bc4\u5206\u9ad8` : `Central ${cityName} stay, walkable to major stops with a strong breakfast rating`,
        price: zh ? "\u00a5 680 /\u665a" : "$96 / night",
        meta: zh ? `${cityName}  4.8 \u5206` : `${cityName}  4.8 rating`,
        badge: zh ? "\u4f4f\u5f97\u8fd1" : "NEAR ROUTE",
      },
      {
        id: "hotel-2",
        title: zh ? `${cityName}\u666f\u89c2\u9732\u53f0\u5ea6\u5047\u9152\u5e97` : `${cityName} view terrace resort stay`,
        subtitle: zh ? `\u9002\u5408${cityName}\u653e\u677e\u578b\u884c\u7a0b\uff0c\u542b\u63a5\u9001\u670d\u52a1` : `Best for slower ${cityName} routes, transfer service included`,
        price: zh ? "\u00a5 1180 /\u665a" : "$166 / night",
        meta: zh ? `${cityName}  4.9 \u5206` : `${cityName}  4.9 rating`,
        badge: zh ? "\u9ad8\u7ea7\u611f" : "PREMIUM",
      },
    ],
    attractions: [
      {
        id: "poi-1",
        title: zh ? `${cityName}\u70ed\u95e8\u666f\u70b9\u901a\u7968` : `${cityName} attraction pass`,
        subtitle: zh ? `\u8986\u76d6${cityName}\u70ed\u95e8\u666f\u70b9\uff0c\u9002\u5408\u4e00\u5929\u5185\u7ec4\u5408\u6e38\u73a9` : `Covers popular ${cityName} attractions for a one-day bundled route`,
        price: zh ? "\u00a5 168 \u8d77" : "$24+",
        meta: zh ? `${cityName}  \u7535\u5b50\u7968` : `${cityName}  e-ticket`,
        badge: zh ? "\u95e8\u7968" : "TICKET",
      },
      {
        id: "poi-2",
        title: zh ? `${cityName}\u534a\u65e5\u57ce\u5e02\u5bfc\u89c8` : `${cityName} half-day guided walk`,
        subtitle: zh ? `\u4e13\u4eba\u5e26\u8def\u8d70\u8fc7${cityName}\u7cbe\u534e\u7247\u533a\uff0c\u9002\u5408\u7b2c\u4e00\u6b21\u5230\u8bbf` : `Hosted route through ${cityName} highlights, ideal for first-time visitors`,
        price: zh ? "\u00a5 260 /\u4eba" : "$36 / person",
        meta: zh ? `${cityName}  3h \u5c0f\u56e2` : `${cityName}  3h small group`,
        badge: zh ? "\u5bfc\u89c8" : "GUIDED",
      },
    ],
    food: [
      {
        id: "food-1",
        title: zh ? `${cityName}\u5fc5\u5403\u672c\u5730\u5c0f\u5403\u7ebf` : `${cityName} local bite trail`,
        subtitle: zh ? `\u6309\u4f60\u7684\u996e\u98df\u504f\u597d\u63a8\u8350${cityName}\u9910\u5385\u548c\u5c0f\u5403\u8857` : `Restaurant and street-food picks in ${cityName} aligned with your diet profile`,
        price: zh ? "\u00a5 88 \u8d77" : "$12+",
        meta: zh ? `${cityName}  \u665a\u9910\u65f6\u6bb5` : `${cityName}  dinner window`,
        badge: zh ? "\u7f8e\u98df" : "EATS",
      },
      {
        id: "food-2",
        title: zh ? `${cityName}\u65e9\u5348\u9910\u5496\u5561\u5730\u56fe` : `${cityName} brunch and cafe map`,
        subtitle: zh ? `${cityName}\u6162\u8282\u594f\u65e5\u7a0b\u53ef\u7528\uff0c\u9002\u5408\u52a0\u5165\u4e0a\u5348\u6216\u4e0b\u5348\u884c\u7a0b` : `Slow-day friendly ${cityName} cafe picks, ready for morning or afternoon routes`,
        price: zh ? "\u00a5 58 \u8d77" : "$8+",
        meta: zh ? `${cityName}  \u4eba\u6c14\u5e97` : `${cityName}  popular spots`,
        badge: zh ? "\u5496\u5561" : "CAFE",
      },
    ],
    guides: [
      {
        id: "guide-1",
        title: zh ? `${cityName} 24 \u5c0f\u65f6\u5feb\u901f\u653b\u7565` : `${cityName} 24-hour quick guide`,
        subtitle: zh ? `\u9002\u5408${cityName}\u77ed\u9014\u6216\u4e2d\u8f6c\uff0c\u4f18\u5148\u7cbe\u534e\u70b9` : `For short ${cityName} trips or layovers, highlights first`,
        price: zh ? "\u514d\u8d39" : "Free",
        meta: zh ? `${cityName}  8 \u4e2a\u6a21\u5757` : `${cityName}  8 modules`,
        badge: zh ? "\u653b\u7565" : "GUIDE",
      },
      {
        id: "guide-2",
        title: zh ? `${cityName}\u907f\u5751\u4e0e\u9884\u7ea6\u63d0\u9192` : `${cityName} booking and timing reminders`,
        subtitle: zh ? `${cityName}\u5f00\u653e\u65f6\u95f4\u3001\u9ad8\u5cf0\u671f\u548c\u9884\u7ea6\u8282\u70b9` : `${cityName} opening hours, peak windows, and reservation notes`,
        price: zh ? "\u514d\u8d39" : "Free",
        meta: zh ? `${cityName}  \u5b9e\u7528\u63d0\u9192` : `${cityName}  practical alerts`,
        badge: zh ? "\u63d0\u9192" : "ALERTS",
      },
    ],
  };
  return data[service];
};

const moodLanes: Array<{
  label: string;
  zhLabel: string;
  sub: string;
  zhSub: string;
  filter: DiscoveryFilter;
  code: string;
}> = [
  {
    label: "I want sea air",
    zhLabel: "\u60f3\u5439\u6d77\u98ce",
    sub: "Beach, resort, slow coastline",
    zhSub: "\u6d77\u5c9b\u3001\u5ea6\u5047\u3001\u6162\u8282\u594f\u6d77\u5cb8\u7ebf",
    filter: "Beach",
    code: "SEA",
  },
  {
    label: "Feed me well",
    zhLabel: "\u60f3\u5403\u5f97\u5f88\u597d",
    sub: "Markets, local food, night walks",
    zhSub: "\u5e02\u96c6\u3001\u672c\u5730\u7f8e\u98df\u3001\u591c\u95f4\u6f2b\u6e38",
    filter: "Foodie",
    code: "EAT",
  },
  {
    label: "Give me wonder",
    zhLabel: "\u60f3\u770b\u89c1\u5947\u8ff9",
    sub: "Culture, heritage, iconic views",
    zhSub: "\u6587\u5316\u9057\u4ea7\u3001\u7ecf\u5178\u666f\u89c2\u3001\u57ce\u5e02\u8bb0\u5fc6",
    filter: "Culture",
    code: "WOW",
  },
  {
    label: "Hide me away",
    zhLabel: "\u60f3\u8eb2\u8fdb\u677e\u5f1b\u611f",
    sub: "Nature, quiet stays, reset routes",
    zhSub: "\u81ea\u7136\u3001\u5b89\u9759\u4f4f\u5bbf\u3001\u6062\u590d\u80fd\u91cf",
    filter: "Relaxation",
    code: "SLO",
  },
  {
    label: "Take the kids somewhere easy",
    zhLabel: "\u5e26\u5b69\u5b50\u8f7b\u677e\u73a9",
    sub: "Family routes, gentle pace, safe stops",
    zhSub: "\u4eb2\u5b50\u8def\u7ebf\u3001\u8282\u594f\u8f7b\u677e\u3001\u505c\u7559\u70b9\u5b89\u5fc3",
    filter: "Family",
    code: "FAM",
  },
  {
    label: "Give me adrenaline",
    zhLabel: "\u60f3\u8981\u4e00\u70b9\u523a\u6fc0",
    sub: "Mountains, trails, movement",
    zhSub: "\u5c71\u91ce\u3001\u5f92\u6b65\u3001\u8fd0\u52a8\u611f\u884c\u7a0b",
    filter: "Adventure",
    code: "RUN",
  },
  {
    label: "I need a city weekend",
    zhLabel: "\u60f3\u6765\u4e2a\u57ce\u5e02\u5468\u672b",
    sub: "Short breaks, cafes, galleries",
    zhSub: "\u77ed\u9014\u5468\u672b\u3001\u5496\u5561\u9986\u3001\u5c55\u89c8\u4e0e\u8857\u533a",
    filter: "City Break",
    code: "CTY",
  },
  {
    label: "Make it feel premium",
    zhLabel: "\u60f3\u8981\u9ad8\u7ea7\u611f",
    sub: "Luxury stays, polished evenings",
    zhSub: "\u9ad8\u7aef\u4f4f\u5bbf\u3001\u7cbe\u81f4\u591c\u665a\u3001\u4eea\u5f0f\u611f",
    filter: "Luxury",
    code: "LUX",
  },
  {
    label: "I want beautiful photos",
    zhLabel: "\u60f3\u62cd\u51fa\u597d\u7167\u7247",
    sub: "Iconic views, color, golden hour",
    zhSub: "\u6807\u5fd7\u666f\u89c2\u3001\u8272\u5f69\u3001\u9ec4\u91d1\u65f6\u523b",
    filter: "Photo Spots",
    code: "PIC",
  },
  {
    label: "Put me back in nature",
    zhLabel: "\u60f3\u56de\u5230\u81ea\u7136\u91cc",
    sub: "Lakes, forests, quiet air",
    zhSub: "\u6e56\u6cca\u3001\u68ee\u6797\u3001\u5b89\u9759\u7a7a\u6c14",
    filter: "Nature",
    code: "NAT",
  },
];

const ctripStyleFilterGroups: Array<{ title: string; items: DiscoveryFilter[] }> = [
  { title: "Popular", items: ["Weekend", "Short Trip", "Beach", "City Break", "Food"] },
  { title: "Travel Style", items: ["Adventure", "Nature", "Culture", "Relaxation", "Photo Spots"] },
  { title: "Budget", items: ["Budget", "Luxury"] },
  { title: "Companion", items: ["Family", "Couple", "Foodie"] },
];

const groupTitle = (zh: boolean, title: string) =>
  zh
    ? ({
        Popular: "\u70ed\u95e8",
        "Travel Style": "\u65c5\u884c\u65b9\u5f0f",
        Budget: "\u9884\u7b97",
        Companion: "\u540c\u884c\u4eba",
        "Trip Length": "\u65c5\u884c\u65f6\u957f",
        "Rating Priority": "\u504f\u597d\u91cd\u70b9",
      }[title] ?? title)
    : title;

const filterMeta = (zh: boolean, item: DiscoveryFilter) =>
  zh
    ? ({
        Weekend: "\u5468\u672b\u5feb\u9003",
        "Short Trip": "2-3 \u5929\u8ba1\u5212",
        Beach: "\u6d77\u8fb9\u4e0e\u5ea6\u5047",
        "City Break": "\u57ce\u5e02\u8def\u7ebf",
        Food: "\u5f53\u5730\u7f8e\u98df",
        Adventure: "\u6237\u5916\u80fd\u91cf",
        Nature: "\u81ea\u7136\u7597\u6108",
        Culture: "\u535a\u7269\u9986\u4e0e\u9057\u4ea7",
        Relaxation: "\u6162\u8282\u594f\u5ea6\u5047",
        "Photo Spots": "\u51fa\u7247\u5730\u70b9",
        Budget: "\u4f18\u5148\u6027\u4ef7\u6bd4",
        Luxury: "\u9ad8\u7aef\u4f53\u9a8c",
        Family: "\u4eb2\u5b50\u53cb\u597d",
        Couple: "\u6d6a\u6f2b\u8282\u594f",
        Foodie: "\u5473\u89c9\u8def\u7ebf",
      } as Partial<Record<DiscoveryFilter, string>>)[item] ?? item
    : ({
        Weekend: "Fast escapes",
        "Short Trip": "2-3 day plans",
        Beach: "Sea & resort",
        "City Break": "Urban routes",
        Food: "Local eats",
        Adventure: "Outdoor energy",
        Nature: "Scenic calm",
        Culture: "Museums & heritage",
        Relaxation: "Spa & slow stays",
        "Photo Spots": "Visual picks",
        Budget: "Value-first",
        Luxury: "Premium stays",
        Family: "Parent-child",
        Couple: "Romantic pace",
        Foodie: "Taste trails",
      } as Partial<Record<DiscoveryFilter, string>>)[item] ?? item;

const moodMatch = (mood: DiscoveryFilter) => (destination: Destination) => {
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
  return moodDestinationIds[mood]?.includes(destination.id) ?? true;
};

const previewDistanceKm = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) => {
  const earthRadiusKm = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildCityPreviewStops = (destination: Destination | undefined, durationDays: number) => {
  if (!destination) {
    return [];
  }
  const stopsPerDay = 4;
  const count = durationDays * stopsPerDay;
  const pois = getRealCityPois(destination.city).slice(0, count);
  return pois.map((poi, index) => {
    const previous = index === 0 ? destination.coordinates : pois[index - 1];
    const distance = previewDistanceKm(
      { latitude: previous.latitude, longitude: previous.longitude },
      { latitude: poi.latitude, longitude: poi.longitude },
    );
    return {
      id: poi.id,
      title: poi.title,
      image: getPoiImage(poi.title, destination.city, destination.image),
      address: poi.address,
      transfer: index % stopsPerDay === 0 ? "" : `${distance.toFixed(1)} km \u00b7 ${Math.max(8, Math.round(distance * 7))} min`,
      optional: index % stopsPerDay === stopsPerDay - 1,
    };
  });
};

const normalizeResultKey = (destination: Destination) =>
  `${destination.city}::${destination.title}`
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");

const uniqueDestinations = (destinations: Destination[]) => {
  const seen = new Set<string>();
  return destinations.filter((destination) => {
    const key = normalizeResultKey(destination);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const BusinessServiceScreen = ({
  service,
  city,
  onBack,
}: {
  service: BusinessService;
  city: string;
  onBack: () => void;
}) => {
  const { state, theme } = useAppContext();
  const zh = state.locale === "zh";
  const items = mockBusinessApi(service, city, zh);
  const cityLabel = city ? placeText(state.locale, city) : (zh ? "\u76ee\u7684\u5730" : "Selected destination");

  return (
    <Screen>
      <View style={[styles.businessHero, { backgroundColor: theme.colors.badge, borderColor: theme.colors.border }]}>
        <View style={[styles.businessHeroOrbit, { borderColor: theme.colors.accent }]} />
        <View style={[styles.businessHeroGlow, { backgroundColor: theme.colors.accent }]} />
        <Pressable onPress={onBack} style={[styles.backButton, { backgroundColor: "rgba(255, 247, 236, 0.14)" }]}>
          <Text style={styles.backButtonText}>{zh ? "\u8fd4\u56de" : "Back"}</Text>
        </Pressable>
        <View style={styles.businessGlyphPlate}>
          <Text style={styles.businessGlyphText}>{businessGlyph(service)}</Text>
        </View>
        <Text style={styles.businessHeroKicker}>{zh ? "\u57ce\u5e02\u670d\u52a1\u5339\u914d" : "CITY SERVICE MATCH"}</Text>
        <Text style={styles.businessHeroTitle}>{businessTitle(service, zh)}</Text>
        <Text style={styles.businessHeroMeta}>
          {cityLabel}  {items.length} {zh ? "\u6761\u7ed3\u679c" : "results"}
        </Text>
      </View>

      <View style={styles.innerPad}>
        <View style={[styles.apiConsole, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.apiPulse, { backgroundColor: theme.colors.success }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.businessApiTitle, { color: theme.colors.text }]}>
              {zh ? "\u5df2\u4e3a\u4f60\u5339\u914d" : "Matched for you"}
            </Text>
            <Text style={[styles.businessApiBody, { color: theme.colors.subtext }]}>
              {zh
                ? `${cityLabel}\u7684${businessTitle(service, true)}\u7ed3\u679c\u5df2\u6309\u5f53\u524d\u641c\u7d22\u548c\u504f\u597d\u66f4\u65b0`
                : `${businessTitle(service, false)} results for ${cityLabel} are updated from your current search and preferences`}
            </Text>
          </View>
          <Text style={[styles.apiStatus, { color: theme.colors.success }]}>200</Text>
        </View>
      </View>

      <View style={[styles.businessResultList, styles.innerPad]}>
        {items.map((item, index) => (
          <SoftCard key={item.id}>
            <View style={[styles.businessCardAura, { borderColor: theme.colors.border }]} />
            <View style={styles.businessResultTop}>
              <Text style={[styles.businessResultIndex, { color: theme.colors.accent }]}>0{index + 1}</Text>
              <View style={[styles.businessResultBadge, { backgroundColor: theme.colors.accentSoft }]}>
                <Text style={[styles.businessResultBadgeText, { color: theme.colors.accent }]}>{item.badge}</Text>
              </View>
            </View>
            <Text style={[styles.businessResultTitle, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.businessResultSub, { color: theme.colors.subtext }]}>{item.subtitle}</Text>
            <View style={styles.businessResultFooter}>
              <Text style={[styles.businessResultPrice, { color: theme.colors.accent }]}>{item.price}</Text>
              <Text style={[styles.businessResultMeta, { color: theme.colors.subtext }]}>{item.meta}</Text>
            </View>
          </SoftCard>
        ))}
      </View>
    </Screen>
  );
};

export const DiscoveryScreen = () => {
  const { state, theme } = useAppContext();
  const [planningMode, setPlanningMode] = useState<PlanningMode>("mood");
  const [selectedMood, setSelectedMood] = useState<DiscoveryFilter>("Beach");
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [durationDays, setDurationDays] = useState(3);
  const [activeBusinessService, setActiveBusinessService] = useState<BusinessService | null>(null);
  const zh = state.locale === "zh";

  const ranked = sortDestinations(
    state.destinations,
    state.selectedTags,
    state.interactionWeights,
    state.savedDestinationIds,
    {
      budgetLevel: state.budgetLevel,
      dietaryMode: state.dietaryMode,
    },
  );
  const diySearchPool = useMemo(() => {
    if (state.searchQuery.trim().length === 0) {
      return ranked;
    }
    const cityAnchors = uniqueDestinations(ranked).filter(
      (destination, index, self) => self.findIndex((item) => item.city === destination.city) === index,
    );
    const poiDestinations = cityAnchors.flatMap((destination) =>
      buildRealCityDestinations(destination, `search-${destination.id}`, 12),
    );
    return uniqueDestinations([...poiDestinations, ...ranked]);
  }, [ranked, state.searchQuery]);
  const diyDestinations = uniqueDestinations(filterDestinationsByFilters(diySearchPool, state.searchQuery, state.activeDiscoveryFilters));
  const moodDestinations = useMemo(() => {
    const matches = ranked.filter(moodMatch(selectedMood)).slice(0, 10);
    return matches;
  }, [ranked, selectedMood]);
  const selectedDestination = moodDestinations.find((destination) => destination.id === selectedDestinationId) ?? moodDestinations[0];
  const cityPreviewStops = useMemo(
    () => buildCityPreviewStops(selectedDestination, durationDays),
    [selectedDestination, durationDays],
  );
  const selectedFilterDisplay =
    state.activeDiscoveryFilters.length === 0
      ? filterText(state.locale, "All")
      : state.activeDiscoveryFilters.map((filter) => filterText(state.locale, filter)).join(", ");
  const businessCity = state.searchQuery.trim().length > 0 ? diyDestinations[0]?.city ?? "" : "";

  if (activeBusinessService) {
    return (
      <BusinessServiceScreen
        service={activeBusinessService}
        city={businessCity}
        onBack={() => setActiveBusinessService(null)}
      />
    );
  }

  return (
    <Screen>
      <HeroCard
        title={zh ? cn.heroTitle : "How do you want to build this trip?"}
        subtitle={
          zh
            ? cn.heroSub
            : "Choose a mood, then pick the city, departure date, and trip length. Or enter DIY mode to build with detailed filters."
        }
        image={(planningMode === "mood" ? selectedDestination?.image : diyDestinations[0]?.image) ?? ranked[0].image}
        rightBadge={planningMode === "mood" ? (zh ? cn.moodMode : "Mood builder") : (zh ? cn.diyMode : "DIY planner")}
      />

      <View style={[styles.modeSwitch, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View pointerEvents="none" style={[styles.modeOrbit, { borderColor: theme.colors.border }]} />
        <View pointerEvents="none" style={[styles.modeGlow, { backgroundColor: theme.colors.accentSoft }]} />
        <Pressable
          onPress={() => setPlanningMode("mood")}
          style={[
            styles.modeCard,
            {
              backgroundColor: planningMode === "mood" ? theme.colors.accent : theme.colors.surfaceAlt,
              borderColor: planningMode === "mood" ? theme.colors.accent : theme.colors.border,
            },
          ]}
        >
          <View style={[styles.modeNeedle, { backgroundColor: planningMode === "mood" ? "#FFF7EC" : theme.colors.accent }]} />
          <Text style={[styles.modeKicker, { color: planningMode === "mood" ? "#FFF7EC" : theme.colors.accent }]}>01</Text>
          <Text style={[styles.modeTitle, { color: planningMode === "mood" ? "#FFF7EC" : theme.colors.text }]}>
            {zh ? cn.moodMode : "Generate by mood"}
          </Text>
          <Text style={[styles.modeSub, { color: planningMode === "mood" ? "#FFE5D3" : theme.colors.subtext }]}>
            {zh ? cn.moodSub : "Pick city, date, and duration"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPlanningMode("diy")}
          style={[
            styles.modeCard,
            {
              backgroundColor: planningMode === "diy" ? theme.colors.accent : theme.colors.surfaceAlt,
              borderColor: planningMode === "diy" ? theme.colors.accent : theme.colors.border,
            },
          ]}
        >
          <View style={[styles.modeNeedle, { backgroundColor: planningMode === "diy" ? "#FFF7EC" : theme.colors.accent }]} />
          <Text style={[styles.modeKicker, { color: planningMode === "diy" ? "#FFF7EC" : theme.colors.accent }]}>02</Text>
          <Text style={[styles.modeTitle, { color: planningMode === "diy" ? "#FFF7EC" : theme.colors.text }]}>
            {zh ? cn.diyMode : "DIY itinerary"}
          </Text>
          <Text style={[styles.modeSub, { color: planningMode === "diy" ? "#FFE5D3" : theme.colors.subtext }]}>
            {zh ? cn.diySub : "Search and use detailed filters"}
          </Text>
        </Pressable>
      </View>

      {planningMode === "mood" ? (
        <>
          <View style={[styles.signalDeck, styles.innerPad, { backgroundColor: theme.colors.badge, borderColor: theme.colors.border }]}>
            <View style={[styles.signalHalo, { borderColor: theme.colors.accent }]} />
            <View style={styles.signalCopy}>
              <Text style={styles.signalEyebrow}>{zh ? cn.preferencePilot : "PREFERENCE PILOT"}</Text>
              <Text style={styles.signalTitle}>{zh ? cn.moodAtlas : "Mood atlas is listening"}</Text>
              <Text style={styles.signalMeta}>
                {zh
                  ? `AI \u5c06\u9884\u7b97\u3001\u996e\u98df\u548c\u504f\u597d\u8f6c\u6210\u57ce\u5e02\u4fe1\u53f7`
                  : "AI turns budget, diet, and taste into city signals"}
              </Text>
            </View>
            <View style={styles.signalStats}>
              <Text style={styles.signalStatValue}>{state.budgetLevel}</Text>
              <Text style={styles.signalStatLabel}>{zh ? "\u9884\u7b97" : "BUDGET"}</Text>
            </View>
          </View>
          <View style={[styles.profileSignal, styles.innerPad, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.profileSignalTitle, { color: theme.colors.text }]}>
              {zh ? "\u5df2\u4f7f\u7528\u4f60\u7684\u504f\u597d" : "Your preferences are active"}
            </Text>
            <Text style={[styles.profileSignalBody, { color: theme.colors.subtext }]}>
              {zh
                ? `\u9884\u7b97 ${state.budgetLevel} \u7ea7 \u00b7 ${textFor(state.locale, state.dietaryMode)} \u00b7 ${state.selectedTags.map((tag) => tagText(state.locale, tag)).join(", ")}`
                : `Budget level ${state.budgetLevel} \u00b7 ${textFor(state.locale, state.dietaryMode)} \u00b7 ${state.selectedTags.join(", ")}`}
            </Text>
          </View>
          <SectionTitle title={zh ? cn.pickMood : "Pick the mood first"} hint={zh ? "\u4e0b\u4e00\u6b65\u9009\u57ce\u5e02" : "Then choose a city"} />
          <View style={[styles.moodGrid, styles.innerPad]}>
            {moodLanes.map((lane, index) => {
              const active = selectedMood === lane.filter;
              return (
                <Pressable
                  key={lane.filter}
                  onPress={() => {
                    setSelectedMood(lane.filter);
                    setSelectedDestinationId("");
                  }}
                  style={[
                    styles.moodCard,
                    index === 1 && styles.moodCardDrop,
                    {
                      backgroundColor: active ? theme.colors.accent : theme.colors.surface,
                      borderColor: active ? theme.colors.accent : theme.colors.border,
                    },
                  ]}
                >
                  <View style={[styles.moodOrb, { borderColor: active ? "#FFF7EC" : theme.colors.accent }]} />
                  <View style={[styles.moodSpark, { backgroundColor: active ? "#FFF7EC" : theme.colors.accentSoft }]} />
                  <Text style={[styles.moodCode, { color: active ? "#FFF7EC" : theme.colors.accent }]}>{lane.code}</Text>
                  <Text style={[styles.moodTitle, { color: active ? "#FFF7EC" : theme.colors.text }]}>
                    {zh ? lane.zhLabel : lane.label}
                  </Text>
                  <Text style={[styles.moodSub, { color: active ? "#FFE5D3" : theme.colors.subtext }]}>
                    {zh ? lane.zhSub : lane.sub}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionTitle title={zh ? cn.pickCity : "Choose one matched city"} hint={`${moodDestinations.length} ${zh ? "\u4e2a\u5339\u914d" : "matches"}`} />
          <View style={[styles.cityGrid, styles.innerPad]}>
            {moodDestinations.map((destination) => {
              const active = selectedDestination?.id === destination.id;
              return (
                <Pressable
                  key={destination.id}
                  onPress={() => setSelectedDestinationId(destination.id)}
                  style={[
                    styles.cityCard,
                    {
                      backgroundColor: active ? theme.colors.badge : theme.colors.surface,
                      borderColor: active ? theme.colors.accent : theme.colors.border,
                    },
                  ]}
                >
                  <View style={[styles.cityRouteDash, { backgroundColor: active ? "#FFB98E" : theme.colors.accentSoft }]} />
                  <View style={styles.cityTopline}>
                    <Text style={[styles.cityIndex, { color: active ? "#FFDDC6" : theme.colors.accent }]}>
                      {destination.country.slice(0, 2).toUpperCase()}
                    </Text>
                    <View style={[styles.cityCategoryPill, { backgroundColor: active ? "rgba(255, 247, 236, 0.14)" : theme.colors.accentSoft }]}>
                      <Text style={[styles.cityCategoryText, { color: active ? "#FFF7EC" : theme.colors.accent }]}>
                        {filterText(state.locale, destination.category)}
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text style={[styles.cityName, { color: active ? "#FFF7EC" : theme.colors.text }]}>{placeText(state.locale, destination.city)}</Text>
                    <Text style={[styles.cityMeta, { color: active ? "#FFD9C2" : theme.colors.subtext }]}>
                      {placeText(state.locale, destination.country)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.innerPad}>
            <SoftCard>
              <View style={[styles.composerCompass, { borderColor: theme.colors.border }]} />
              <View style={[styles.composerDot, { backgroundColor: theme.colors.accent }]} />
              <Text style={[styles.generatedTitle, { color: theme.colors.text }]}>{zh ? cn.datePlan : "Choose date and duration"}</Text>
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Input value={startDate} onChangeText={setStartDate} placeholder={zh ? cn.startDate : "Start date"} />
                </View>
                <View style={styles.dayChoices}>
                  {[2, 3, 4, 5].map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => setDurationDays(day)}
                      style={[
                        styles.dayChoice,
                        {
                          backgroundColor: durationDays === day ? theme.colors.accent : theme.colors.surfaceAlt,
                          borderColor: durationDays === day ? theme.colors.accent : theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: durationDays === day ? "#FFF7EC" : theme.colors.text, fontWeight: "900" }}>
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Text style={[styles.generatedMeta, { color: theme.colors.subtext }]}>
                {zh
                  ? `${cn.selectedCity}\uff1a${selectedDestination ? placeText(state.locale, selectedDestination.city) : "-"} \u00b7 ${durationDays} ${cn.days}`
                  : `Selected city: ${selectedDestination ? placeText(state.locale, selectedDestination.city) : "-"} \u00b7 ${durationDays} days`}
              </Text>

              <View style={styles.generatedHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.generatedTitle, { color: theme.colors.text }]}>{zh ? cn.preview : "Preview itinerary"}</Text>
                  <Text style={[styles.generatedMeta, { color: theme.colors.subtext }]}>
                    {zh
                      ? `\u56f4\u7ed5 ${selectedDestination ? placeText(state.locale, selectedDestination.city) : "-"} \u751f\u6210 ${durationDays} \u5929\u6e38\u73a9\u8def\u7ebf`
                      : `Builds a ${durationDays}-day route around ${selectedDestination ? placeText(state.locale, selectedDestination.city) : "-"}`}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    state.actions.generateMoodTrip(selectedMood, {
                      anchorDestinationId: selectedDestination?.id,
                      startDate,
                      durationDays,
                    })
                  }
                  style={[styles.generateButton, { backgroundColor: theme.colors.accent }]}
                >
                  <Text style={styles.generateButtonText}>{zh ? cn.generate : "Generate"}</Text>
                </Pressable>
              </View>
              <View style={styles.previewStack}>
                {selectedDestination ? (
                  <ImageBackground
                    source={{ uri: selectedDestination.image }}
                    style={styles.cityPreviewHero}
                    imageStyle={{ borderRadius: 28 }}
                  >
                    <View style={styles.cityPreviewOverlay}>
                      <View style={styles.cityPreviewTop}>
                        <Text style={styles.cityPreviewBadge}>{zh ? "\u771f\u5b9e\u666f\u70b9" : "REAL POIS"}</Text>
                        <Text style={styles.cityPreviewBadge}>
                          {cityPreviewStops.length} {zh ? "\u7ad9" : "stops"}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.cityPreviewCity}>{placeText(state.locale, selectedDestination.city)}</Text>
                        <Text style={styles.cityPreviewMeta}>
                          {placeText(state.locale, selectedDestination.country)}  {durationDays} {zh ? cn.days : "days"}
                        </Text>
                      </View>
                    </View>
                  </ImageBackground>
                ) : null}
                {cityPreviewStops.map((stop, index) => (
                  <View key={stop.id} style={[styles.previewRow, { borderBottomColor: theme.colors.border }]}>
                    <PoiImageBackground
                      title={stop.title}
                      city={selectedDestination?.city ?? ""}
                      fallbackImage={stop.image}
                      style={styles.previewThumb}
                      imageStyle={{ borderRadius: 16 }}
                    >
                      <View style={styles.previewThumbShade}>
                        <Text style={styles.previewThumbText}>0{index + 1}</Text>
                      </View>
                    </PoiImageBackground>
                    <View style={{ flex: 1 }}>
                      {stop.transfer ? (
                        <Text style={[styles.transferLine, { color: theme.colors.accent }]}>
                          {zh ? `\u4e0a\u4e00\u7ad9\u5230\u8fd9\u91cc ${stop.transfer}` : `From previous stop \u00b7 ${stop.transfer}`}
                        </Text>
                      ) : null}
                      <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
                        {placeText(state.locale, stop.title)}{stop.optional ? (zh ? "\uff08\u53ef\u9009\u53bb\uff09" : " (Optional)") : ""}
                      </Text>
                      <Text style={[styles.previewMeta, { color: theme.colors.subtext }]}>
                        {stop.address}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </SoftCard>
          </View>
        </>
      ) : (
        <>
          <View style={[styles.innerPad, styles.diySearchDock]}>
            <SearchBar value={state.searchQuery} onChangeText={state.actions.setSearchQuery} placeholder={t(state.locale, "searchPlaceholder")} />
          </View>

          <View style={[styles.profileSignal, styles.innerPad, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.profileSignalTitle, { color: theme.colors.text }]}>
              {zh ? "\u6392\u5e8f\u5df2\u63a5\u5165\u504f\u597d" : "Ranking uses your profile"}
            </Text>
            <Text style={[styles.profileSignalBody, { color: theme.colors.subtext }]}>
              {zh
                ? `\u9884\u7b97 ${state.budgetLevel} \u7ea7 \u00b7 ${textFor(state.locale, state.dietaryMode)}`
                : `Budget level ${state.budgetLevel} \u00b7 ${textFor(state.locale, state.dietaryMode)}`}
            </Text>
          </View>

          <View style={[styles.businessPanel, styles.innerPad, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.businessPanelTitle, { color: theme.colors.text }]}>
              {zh ? "\u76f8\u5173\u4e1a\u52a1\u8df3\u8f6c\u670d\u52a1" : "Related service shortcuts"}
            </Text>
            <View style={styles.businessGrid}>
              {businessEntries.map((entry, index) => (
                <Pressable
                  key={entry.label}
                  onPress={() => setActiveBusinessService(entry.service)}
                  style={[
                    styles.businessItem,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={[styles.businessItemGlow, { backgroundColor: theme.colors.accentSoft }]} />
                  <Text style={[styles.businessCode, { color: theme.colors.subtext }]}>0{index + 1}</Text>
                  <View style={[styles.businessMiniIcon, { borderColor: theme.colors.border }]}>
                    <Text style={[styles.businessMiniIconText, { color: theme.colors.subtext }]}>
                      {entry.code.slice(0, 2)}
                    </Text>
                  </View>
                  <Text style={[styles.businessLabel, { color: theme.colors.text }]}>{textFor(state.locale, entry.label)}</Text>
                  <Text style={[styles.businessCaption, { color: theme.colors.subtext }]}>{zh ? entry.zhCaption : entry.caption}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.chipRow, styles.innerPad]}>
            {discoveryFilters.map((filter) => (
              <Pill
                key={filter}
                label={filterText(state.locale, filter)}
                selected={filter === "All" ? state.activeDiscoveryFilters.length === 0 : state.activeDiscoveryFilters.includes(filter)}
                onPress={() => state.actions.toggleDiscoveryFilter(filter)}
              />
            ))}
          </View>

          <View style={[styles.moreFilterBar, styles.innerPad, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.moreFilterTitle, { color: theme.colors.text }]}>{t(state.locale, "selectedFilters")}</Text>
              <Text style={[styles.moreFilterMeta, { color: theme.colors.subtext }]}>
                {zh ? `\u7b5b\u9009\u7ed3\u679c\u6570\uff1a${diyDestinations.length}` : `Filtered results: ${diyDestinations.length}`}
              </Text>
            </View>
          </View>

          <SectionTitle title={t(state.locale, "recommended")} hint={`${diyDestinations.length} ${t(state.locale, "cards")}`} />
          <Text style={[styles.caption, { color: theme.colors.subtext, marginHorizontal: spacing.md }]}>{t(state.locale, "resultsHint")}</Text>
          <View style={[styles.feed, styles.innerPad]}>
            {diyDestinations.map((destination) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                saved={state.savedDestinationIds.includes(destination.id)}
                onSave={() => state.actions.toggleSaveDestination(destination)}
                onOpenMap={() => state.actions.viewDestinationRoute(destination)}
              />
            ))}
          </View>
        </>
      )}

    </Screen>
  );
};

const styles = StyleSheet.create({
  innerPad: { marginHorizontal: spacing.md },
  diySearchDock: {
    position: "relative",
    zIndex: 3,
    elevation: 3,
  },
  modeSwitch: {
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: 38,
    padding: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
    overflow: "hidden",
    position: "relative",
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  modeOrbit: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    right: -88,
    top: -88,
    transform: [{ rotate: "-18deg" }],
  },
  modeGlow: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    left: -28,
    bottom: -36,
    opacity: 0.72,
  },
  modeCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 31,
    padding: spacing.lg,
    minHeight: 152,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    transform: [{ rotate: "-1deg" }],
  },
  modeNeedle: {
    position: "absolute",
    width: 54,
    height: 3,
    right: -12,
    top: 20,
    borderRadius: 4,
    transform: [{ rotate: "-18deg" }],
  },
  modeKicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  modeTitle: { fontSize: 22, lineHeight: 25, fontWeight: "900", letterSpacing: -0.9 },
  modeSub: { fontSize: 12, lineHeight: 17, fontWeight: "800" },
  signalDeck: {
    borderWidth: 1,
    borderRadius: 40,
    padding: spacing.lg,
    minHeight: 148,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    position: "relative",
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 9,
  },
  signalHalo: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    right: -48,
    top: -42,
    opacity: 0.72,
  },
  signalCopy: { flex: 1, gap: 6 },
  signalEyebrow: { color: "#FFB98E", fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  signalTitle: { color: "#FFF7EC", fontSize: 29, lineHeight: 31, fontWeight: "900", letterSpacing: -1.2 },
  signalMeta: { color: "#FFD9C2", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  signalStats: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: "rgba(255, 247, 236, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "7deg" }],
  },
  signalStatValue: { color: "#FFF7EC", fontSize: 28, fontWeight: "900", lineHeight: 31 },
  signalStatLabel: { color: "#FFB98E", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  profileSignal: {
    borderWidth: 1,
    borderRadius: 28,
    padding: spacing.lg,
    gap: 4,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  profileSignalTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  profileSignalBody: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingTop: 4 },
  moodCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 34,
    padding: spacing.lg,
    minHeight: 156,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  moodCardDrop: { transform: [{ translateY: 14 }, { rotate: "1.5deg" }] },
  moodOrb: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    right: -28,
    bottom: -30,
    opacity: 0.76,
  },
  moodSpark: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    right: 24,
    top: 20,
  },
  moodCode: { fontSize: 11, fontWeight: "900", letterSpacing: 1.8 },
  moodTitle: { fontSize: 22, lineHeight: 25, fontWeight: "900", letterSpacing: -0.9 },
  moodSub: { fontSize: 12, lineHeight: 17, fontWeight: "800" },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingTop: 2 },
  cityCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 30,
    padding: spacing.lg,
    minHeight: 122,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cityRouteDash: {
    position: "absolute",
    width: 86,
    height: 4,
    borderRadius: 3,
    right: -14,
    top: 18,
    transform: [{ rotate: "-18deg" }],
  },
  cityTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  cityIndex: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  cityCategoryPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 5,
    maxWidth: 88,
  },
  cityCategoryText: { fontSize: 10, fontWeight: "900" },
  cityName: { fontSize: 23, lineHeight: 26, fontWeight: "900", letterSpacing: -0.9 },
  cityMeta: { marginTop: 5, fontSize: 12, lineHeight: 16, fontWeight: "800" },
  dateRow: { marginTop: spacing.md, flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  dayChoices: { flexDirection: "row", gap: spacing.xs },
  dayChoice: { width: 42, height: 52, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  composerCompass: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    right: -42,
    top: -38,
    opacity: 0.62,
  },
  composerDot: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    right: 34,
    top: 34,
  },
  generatedHeader: { marginTop: spacing.lg, flexDirection: "row", gap: spacing.md, alignItems: "center" },
  generatedTitle: { fontSize: 23, lineHeight: 27, fontWeight: "900", letterSpacing: -0.7 },
  generatedMeta: { marginTop: 5, fontSize: 13, lineHeight: 18 },
  generateButton: { borderRadius: 22, paddingHorizontal: spacing.lg, paddingVertical: 16, transform: [{ rotate: "-2deg" }] },
  generateButtonText: { color: "#FFF7EC", fontSize: 14, fontWeight: "900" },
  previewStack: { marginTop: spacing.md },
  cityPreviewHero: {
    height: 210,
    borderRadius: 34,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  cityPreviewOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: "rgba(10, 22, 28, 0.22)",
  },
  cityPreviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cityPreviewBadge: {
    color: "#FFF7EC",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: "rgba(8, 20, 24, 0.34)",
  },
  cityPreviewCity: {
    color: "#FFF7EC",
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "900",
    letterSpacing: -1.6,
  },
  cityPreviewMeta: {
    color: "#FFD9C2",
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
  },
  previewRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  previewThumb: {
    width: 66,
    height: 66,
    overflow: "hidden",
  },
  previewThumbShade: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8, 20, 24, 0.28)",
  },
  previewThumbText: {
    color: "#FFF7EC",
    fontSize: 12,
    fontWeight: "900",
  },
  previewIndex: { fontSize: 13, fontWeight: "900" },
  previewTitle: { fontSize: 16, lineHeight: 20, fontWeight: "900", letterSpacing: -0.2 },
  previewMeta: { marginTop: 3, fontSize: 12 },
  transferLine: { marginBottom: 4, fontSize: 11, fontWeight: "900" },
  businessPanel: { borderWidth: 1, borderRadius: 34, padding: spacing.lg, gap: spacing.sm },
  businessPanelTitle: { fontSize: 21, fontWeight: "900", letterSpacing: -0.6 },
  businessGrid: { flexDirection: "row", gap: spacing.xs },
  businessItem: {
    flex: 1,
    minHeight: 118,
    borderWidth: 1,
    borderRadius: 26,
    paddingHorizontal: 6,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
  },
  businessItemGlow: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    right: -20,
    bottom: -18,
    opacity: 0.55,
  },
  businessCode: { fontSize: 10, fontWeight: "900" },
  businessMiniIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  businessMiniIconText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  businessLabel: { fontSize: 13, fontWeight: "900", lineHeight: 17 },
  businessCaption: { fontSize: 10, lineHeight: 13, textAlign: "center" },
  businessHero: {
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: 34,
    padding: spacing.md,
    minHeight: 190,
    overflow: "hidden",
    justifyContent: "flex-end",
    gap: spacing.xs,
    position: "relative",
  },
  businessHeroOrbit: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    right: -48,
    top: -54,
    opacity: 0.68,
  },
  businessHeroGlow: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 59,
    right: -30,
    bottom: -40,
    opacity: 0.22,
  },
  businessGlyphPlate: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "rgba(255, 247, 236, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "8deg" }],
  },
  businessGlyphText: { color: "#FFF7EC", fontSize: 16, fontWeight: "900", letterSpacing: 1.6 },
  backButton: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  backButtonText: { color: "#FFF7EC", fontSize: 12, fontWeight: "900" },
  businessHeroKicker: { color: "#FFB98E", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  businessHeroTitle: { color: "#FFF7EC", fontSize: 38, lineHeight: 41, fontWeight: "900", letterSpacing: -1.2 },
  businessHeroMeta: { color: "#FFD9C2", fontSize: 13, lineHeight: 18, fontWeight: "800" },
  apiConsole: {
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  apiPulse: { width: 12, height: 12, borderRadius: 6 },
  apiStatus: { fontSize: 18, fontWeight: "900" },
  businessApiTitle: { fontSize: 16, fontWeight: "900" },
  businessApiBody: { marginTop: 6, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  businessResultList: { gap: spacing.sm },
  businessCardAura: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    right: -38,
    top: -42,
    opacity: 0.42,
  },
  businessResultTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  businessResultIndex: { fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  businessResultBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  businessResultBadgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  businessResultTitle: { marginTop: spacing.sm, fontSize: 20, lineHeight: 24, fontWeight: "900", letterSpacing: -0.5 },
  businessResultSub: { marginTop: 6, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  businessResultFooter: { marginTop: spacing.md, flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  businessResultPrice: { fontSize: 18, fontWeight: "900" },
  businessResultMeta: { flex: 1, textAlign: "right", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  moreFilterBar: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  moreFilterTitle: { fontSize: 13, fontWeight: "800" },
  moreFilterMeta: { marginTop: 4, fontSize: 12, lineHeight: 16 },
  moreButton: { borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, minWidth: 88, alignItems: "center" },
  moreButtonText: { color: "#F6FDFF", fontWeight: "800", fontSize: 13 },
  filterGroups: { gap: spacing.sm },
  filterGroupBlock: { gap: spacing.xs },
  groupTitle: { fontSize: 15, fontWeight: "800", marginBottom: spacing.xs },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filterTile: { width: "48%", borderWidth: 1, borderRadius: 24, padding: spacing.sm, minHeight: 88, justifyContent: "space-between" },
  filterTileCode: { alignSelf: "flex-end", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  filterTileTitle: { fontSize: 14, fontWeight: "800" },
  filterTileMeta: { fontSize: 12, lineHeight: 16 },
  caption: { fontSize: 14, lineHeight: 20 },
  feed: { gap: spacing.md },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(2, 12, 16, 0.36)" },
  filterSheet: { maxHeight: "82%", borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, padding: spacing.md },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  sheetTitle: { fontSize: 20, fontWeight: "800" },
  sheetClose: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sheetContent: { paddingVertical: spacing.md, gap: spacing.md },
  sheetSection: { gap: spacing.sm },
  sheetSectionTitle: { fontSize: 15, fontWeight: "800" },
  sheetPills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  sheetActions: { flexDirection: "row", gap: spacing.sm, paddingTop: spacing.sm },
  sheetSecondary: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  sheetPrimary: { flex: 1, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  sheetPrimaryText: { color: "#F6FDFF", fontWeight: "800" },
});
