import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Pill, Screen, SoftCard } from "../components/Ui";
import { useAppContext } from "../context/AppContext";
import { radius, spacing } from "../theme/tokens";
import { placeLineText, placeText } from "../utils/placeNames";
import { tripDisplayTitle } from "../utils/tripDisplay";

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
  const markerLat = highlighted?.coordinates.latitude ?? stops[0]?.destination.coordinates.latitude ?? 35.0116;
  const markerLng = highlighted?.coordinates.longitude ?? stops[0]?.destination.coordinates.longitude ?? 135.7681;
  const markerName = encodeURIComponent(highlighted ? placeText(state.locale, highlighted.title) : activeCityLabel);
  const embedUrl = `https://maps.google.com/maps?q=${markerLat},${markerLng}(${markerName})&z=13&output=embed`;

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
        <View style={[styles.tripHeader, { backgroundColor: theme.colors.badge, borderColor: theme.colors.border }]}>
          <Text style={styles.tripHeaderKicker}>{zh ? "GOOGLE \u5730\u56fe\u8def\u7ebf" : "GOOGLE MAP ROUTE"}</Text>
          <Text style={styles.tripHeaderTitle}>{activeCityLabel}</Text>
          <Text style={styles.tripHeaderMeta}>
            {tripDisplayTitle(state.locale, activeTrip)}  {stops.length} {zh ? "\u4e2a\u57ce\u5e02\u5185\u666f\u70b9" : "in-city stops"}
          </Text>
        </View>

        <View style={styles.mapArea}>
          <View style={[styles.mapCard, { borderColor: theme.colors.border }]}>
            <iframe title="Eslay Google current trip map" src={embedUrl} style={styles.iframe} />
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
                ? "\u5730\u56fe\u4ec5\u5c55\u793a\u5f53\u524d\u884c\u7a0b\u7684\u57ce\u5e02\u5185\u666f\u70b9\uff0c\u4e0d\u518d\u6df7\u5165\u5176\u4ed6\u57ce\u5e02\u3002"
                : "The map only shows in-city stops from the current itinerary, without mixing in other cities."}
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
  tripHeader: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: 28,
    padding: spacing.md,
  },
  tripHeaderKicker: { color: "#FFB98E", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  tripHeaderTitle: { color: "#FFF7EC", marginTop: 5, fontSize: 28, lineHeight: 31, fontWeight: "900" },
  tripHeaderMeta: { color: "#FFD9C2", marginTop: 5, fontSize: 13, lineHeight: 18, fontWeight: "800" },
  mapArea: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
  mapCard: {
    height: 460,
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    backgroundColor: "#DDEEF1",
  },
  iframe: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
  },
  fullscreenBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(7, 21, 26, 0.42)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fullscreenBadgeText: {
    color: "#EAF9FB",
    fontWeight: "800",
    fontSize: 12,
  },
  stopStrip: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
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
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
  },
  sheetHandleWrap: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sheetHandle: {
    width: 56,
    height: 6,
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: "800",
  },
  sheetSub: {
    marginTop: 4,
    fontSize: 13,
  },
  sheetStats: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  sheetBody: {
    marginTop: spacing.md,
    fontSize: 14,
    lineHeight: 20,
  },
});
