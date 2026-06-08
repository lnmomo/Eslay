import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Pill, Screen, SearchBar, SoftCard } from "../components/Ui";
import { useAppContext } from "../context/AppContext";
import { radius, spacing } from "../theme/tokens";
import { placeLineText, placeText } from "../utils/placeNames";

const positionForIndex = (index: number, total: number) => {
  const progress = total <= 1 ? 0.5 : index / (total - 1);
  const wave = Math.sin(progress * Math.PI * 2) * 34;
  return {
    left: 34 + progress * 260,
    top: 72 + index * 42 + wave,
  };
};

export const MapScreen = () => {
  const { state, activeTrip, destinationsById, theme } = useAppContext();
  const zh = state.locale === "zh";
  const stops = activeTrip.stops
    .map((stop, index) => ({
      ...stop,
      sequence: index + 1,
      destination: destinationsById[stop.destinationId],
    }))
    .filter((stop) => Boolean(stop.destination));

  const routeDestinationIds = useMemo(() => new Set(stops.map((stop) => stop.destinationId)), [stops]);
  const highlighted =
    (state.highlightedDestinationId && routeDestinationIds.has(state.highlightedDestinationId)
      ? destinationsById[state.highlightedDestinationId]
      : undefined) ?? stops[0]?.destination;
  const activeCity = stops[0]?.destination.city ?? activeTrip.location;
  const activeCityLabel = placeLineText(state.locale, activeCity);
  const totalDistance = stops.reduce((sum, stop) => sum + stop.destination.distanceKm, 0).toFixed(1);
  const totalEta = stops.reduce((sum, stop) => sum + stop.destination.etaMinutes, 0);

  if (!highlighted || stops.length === 0) {
    return (
      <Screen>
        <View style={styles.mapArea}>
          <SoftCard>
            <Text style={{ color: theme.colors.text }}>
              {zh ? "\u6682\u65e0\u5f53\u524d\u884c\u7a0b\u5730\u56fe\u6570\u636e\u3002" : "No current itinerary map data yet."}
            </Text>
          </SoftCard>
        </View>
      </Screen>
    );
  }

  return (
    <Screen flush>
      <View style={[styles.mapShell, { backgroundColor: theme.colors.surfaceAlt }]}>
        <View style={styles.floatingSearch}>
          <SearchBar
            value={state.searchQuery}
            onChangeText={state.actions.setSearchQuery}
            placeholder={zh ? "\u641c\u7d22\u5f53\u524d\u884c\u7a0b\u666f\u70b9" : "Search current itinerary stops"}
          />
        </View>

        <View style={[styles.tripHeader, { backgroundColor: theme.colors.badge, borderColor: theme.colors.border }]}>
          <Text style={styles.tripHeaderKicker}>{zh ? "\u5f53\u524d\u884c\u7a0b\u5730\u56fe" : "CURRENT TRIP MAP"}</Text>
          <Text style={styles.tripHeaderTitle}>{activeCityLabel}</Text>
          <Text style={styles.tripHeaderMeta}>
            {placeText(state.locale, activeTrip.title)}  {stops.length} {zh ? "\u4e2a\u57ce\u5e02\u5185\u666f\u70b9" : "in-city stops"}
          </Text>
        </View>

        <View style={styles.mapArea}>
          <View style={[styles.canvas, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.mapAuraOne, { backgroundColor: theme.colors.accentSoft }]} />
            <View style={[styles.mapAuraTwo, { borderColor: theme.colors.border }]} />
            <View style={[styles.routeRail, { backgroundColor: theme.colors.accentSoft }]} />
            {stops.map((stop, index) => {
              const active = stop.destinationId === highlighted.id;
              const position = positionForIndex(index, stops.length);
              return (
                <Pressable
                  key={stop.id}
                  onPress={() => state.actions.setHighlightedDestination(stop.destinationId)}
                  style={[
                    styles.mapNode,
                    {
                      left: `${Math.min(82, Math.max(8, (position.left / 360) * 100))}%`,
                      top: Math.min(350, position.top),
                      backgroundColor: active ? theme.colors.accent : theme.colors.badge,
                      borderColor: active ? theme.colors.accent : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={styles.mapNodeText}>{stop.sequence}</Text>
                </Pressable>
              );
            })}
            <View style={styles.fullscreenBadge}>
              <Text style={styles.fullscreenBadgeText}>
                {activeCityLabel}  {stops.length} {zh ? "\u4e2a\u666f\u70b9" : "stops"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stopStrip}>
          {stops.map((stop) => (
            <Pressable
              key={stop.id}
              onPress={() => state.actions.setHighlightedDestination(stop.destinationId)}
              style={[
                styles.stopChip,
                {
                  backgroundColor: stop.destinationId === highlighted.id ? theme.colors.accent : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: stop.destinationId === highlighted.id ? "#F6FDFF" : theme.colors.text,
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                {stop.sequence}. {placeText(state.locale, stop.destination.title)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomSheet}>
          <SoftCard>
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />
            </View>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{placeText(state.locale, highlighted.title)}</Text>
                <Text style={[styles.sheetSub, { color: theme.colors.subtext }]}>{highlighted.address}</Text>
              </View>
            </View>
            <View style={styles.sheetStats}>
              <Pill label={zh ? `${stops.length} \u4e2a\u884c\u7a0b\u666f\u70b9` : `${stops.length} trip stops`} />
              <Pill label={zh ? `${totalDistance} km \u8def\u7ebf` : `${totalDistance} km route`} />
              <Pill label={zh ? `${totalEta} \u5206\u949f\u9884\u8ba1` : `${totalEta} min ETA`} />
              <Pill label={highlighted.hours} />
            </View>
            <Text style={[styles.sheetBody, { color: theme.colors.subtext }]}>
              {zh
                ? "\u5b89\u5353\u9884\u89c8\u7248\u4f7f\u7528\u8f7b\u91cf\u8def\u7ebf\u56fe\uff0c\u4ec5\u5c55\u793a\u5f53\u524d\u884c\u7a0b\u57ce\u5e02\u5185\u666f\u70b9\u3002"
                : "The Android preview uses a lightweight route map and only shows stops from the current itinerary city."}
            </Text>
          </SoftCard>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  mapShell: {
    minHeight: 760,
    paddingTop: spacing.md,
  },
  floatingSearch: {
    marginHorizontal: spacing.md,
  },
  tripHeader: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: 28,
    padding: spacing.md,
    overflow: "hidden",
  },
  tripHeaderKicker: { color: "#FFB98E", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  tripHeaderTitle: { color: "#FFF7EC", marginTop: 5, fontSize: 28, lineHeight: 31, fontWeight: "900" },
  tripHeaderMeta: { color: "#FFD9C2", marginTop: 5, fontSize: 13, lineHeight: 18, fontWeight: "800" },
  mapArea: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
  canvas: {
    height: 460,
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
  },
  mapAuraOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -82,
    top: -58,
    opacity: 0.8,
  },
  mapAuraTwo: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    left: -120,
    bottom: -90,
    opacity: 0.7,
  },
  routeRail: {
    position: "absolute",
    left: "18%",
    right: "18%",
    top: 104,
    height: 244,
    borderRadius: 999,
    transform: [{ rotate: "-18deg" }],
    opacity: 0.78,
  },
  mapNode: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  mapNodeText: {
    color: "#F6FDFF",
    fontWeight: "900",
  },
  fullscreenBadge: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: "rgba(12, 32, 38, 0.68)",
  },
  fullscreenBadgeText: { color: "#F6FDFF", fontWeight: "900", fontSize: 12 },
  stopStrip: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  stopChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
  },
  bottomSheet: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  sheetHandleWrap: { alignItems: "center", marginBottom: spacing.sm },
  sheetHandle: { width: 44, height: 5, borderRadius: 3 },
  sheetHeader: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  sheetTitle: { fontSize: 22, lineHeight: 26, fontWeight: "900", letterSpacing: -0.4 },
  sheetSub: { marginTop: 6, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  sheetStats: { marginTop: spacing.md, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  sheetBody: { marginTop: spacing.md, fontSize: 13, lineHeight: 19, fontWeight: "700" },
});
