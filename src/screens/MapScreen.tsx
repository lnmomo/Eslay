import React, { useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Pill, Screen, SearchBar, SoftCard } from "../components/Ui";
import { useAppContext } from "../context/AppContext";
import { radius, spacing } from "../theme/tokens";
import { placeLineText, placeText } from "../utils/placeNames";

const buildRegion = (points: Array<{ latitude: number; longitude: number }>) => {
  if (points.length === 0) {
    return {
      latitude: 35.0116,
      longitude: 135.7681,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.08),
    longitudeDelta: Math.max((maxLng - minLng) * 1.7, 0.08),
  };
};

export const MapScreen = () => {
  const { state, activeTrip, destinationsById, theme } = useAppContext();
  const mapRef = useRef<MapView | null>(null);
  const zh = state.locale === "zh";
  const stops = activeTrip.stops
    .map((stop, index) => ({
      ...stop,
      sequence: index + 1,
      destination: destinationsById[stop.destinationId],
    }))
    .filter((stop) => Boolean(stop.destination));

  const routeCoordinates = useMemo(
    () =>
      stops.map((stop) => ({
        latitude: stop.destination.coordinates.latitude,
        longitude: stop.destination.coordinates.longitude,
      })),
    [stops],
  );
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
          {state.mapAvailable ? (
            <View style={styles.canvas}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={buildRegion(routeCoordinates)}
                onMapReady={() => {
                  if (routeCoordinates.length > 1) {
                    mapRef.current?.fitToCoordinates?.(routeCoordinates, {
                      edgePadding: { top: 80, right: 60, bottom: 220, left: 60 },
                      animated: true,
                    });
                  }
                }}
              >
                {routeCoordinates.length > 1 ? (
                  <Polyline coordinates={routeCoordinates} strokeColor={theme.colors.accent} strokeWidth={4} />
                ) : null}
                {stops.map((stop) => (
                  <Marker
                    key={stop.id}
                    coordinate={stop.destination.coordinates}
                    title={`${stop.sequence}. ${placeText(state.locale, stop.destination.title)}`}
                    description={stop.destination.address}
                    onPress={() => state.actions.setHighlightedDestination(stop.destinationId)}
                  >
                    <View
                      style={[
                        styles.markerBubble,
                        {
                          backgroundColor: stop.destinationId === highlighted.id ? theme.colors.accent : theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: stop.destinationId === highlighted.id ? "#F6FDFF" : theme.colors.text, fontWeight: "900" }}>
                        {stop.sequence}
                      </Text>
                    </View>
                  </Marker>
                ))}
              </MapView>
              <View style={styles.fullscreenBadge}>
                <Text style={styles.fullscreenBadgeText}>
                  {activeCityLabel}  {stops.length} {zh ? "\u4e2a\u666f\u70b9" : "stops"}
                </Text>
              </View>
            </View>
          ) : (
            <SoftCard>
              <Text style={[styles.fallbackTitle, { color: theme.colors.text }]}>
                {zh ? "\u5f53\u524d\u884c\u7a0b\u666f\u70b9\u5217\u8868" : "Current itinerary stop list"}
              </Text>
              {stops.map((stop) => (
                <View key={stop.id} style={[styles.fallbackRow, { borderBottomColor: theme.colors.border }]}>
                  <Text style={{ color: theme.colors.accent, fontWeight: "900" }}>{stop.sequence}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: "800" }}>{placeText(state.locale, stop.destination.title)}</Text>
                    <Text style={{ color: theme.colors.subtext }}>{stop.destination.address}</Text>
                  </View>
                  <Text style={{ color: theme.colors.subtext }}>{stop.destination.etaMinutes}m</Text>
                </View>
              ))}
            </SoftCard>
          )}
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
              <Pressable onPress={() => state.actions.toggleMapFallback()} style={[styles.failureToggle, { backgroundColor: theme.colors.accentSoft }]}>
                <Text style={{ color: theme.colors.accent, fontWeight: "800", fontSize: 12 }}>
                  {state.mapAvailable ? (zh ? "\u5217\u8868" : "List") : (zh ? "\u5730\u56fe" : "Map")}
                </Text>
              </Pressable>
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
  },
  markerBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
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
  fallbackTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },
  fallbackRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    alignItems: "center",
  },
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
  failureToggle: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  sheetStats: { marginTop: spacing.md, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  sheetBody: { marginTop: spacing.md, fontSize: 13, lineHeight: 19, fontWeight: "700" },
});
