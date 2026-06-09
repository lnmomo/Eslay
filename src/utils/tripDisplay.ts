import { Locale, Trip } from "../types";
import { placeLineText } from "./placeNames";

const hasChinese = (value: string) => /[\u4e00-\u9fa5]/.test(value);

const cleanEnglishLocation = (value: string) => {
  if (!value || hasChinese(value)) {
    return "Selected destination";
  }
  return placeLineText("en", value);
};

export const tripDisplayLocation = (locale: Locale, trip: Pick<Trip, "location">) => {
  if (locale === "zh") {
    return placeLineText(locale, trip.location);
  }
  return cleanEnglishLocation(trip.location);
};

export const tripDisplayTitle = (locale: Locale, trip: Pick<Trip, "title" | "location" | "status">) => {
  if (locale === "zh" || !hasChinese(trip.title)) {
    return trip.title;
  }
  const location = cleanEnglishLocation(trip.location);
  if (trip.status === "Draft") {
    return `${location} draft itinerary`;
  }
  return `${location} itinerary`;
};

export const tripDisplayDateRange = (locale: Locale, trip: Pick<Trip, "dateRange">) => {
  if (locale === "zh") {
    return trip.dateRange;
  }
  return trip.dateRange
    .replace(/自选日期/g, "Custom date")
    .replace(/待规划/g, "To be planned")
    .replace(/即时预览/g, "Instant preview")
    .replace(/(\d+)\s*天/g, "$1 days");
};

export const tripDisplayNote = (locale: Locale, trip: Pick<Trip, "travelerNote" | "status">) => {
  if (locale === "zh" || !hasChinese(trip.travelerNote)) {
    return trip.travelerNote;
  }
  if (trip.status === "Draft") {
    return "This draft itinerary is ready to edit. Add saved places or generate a fresh route from Discover.";
  }
  return "This itinerary was generated from your travel preferences and can be refined in the timeline.";
};
