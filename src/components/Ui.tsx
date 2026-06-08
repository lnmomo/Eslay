import React, { useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppContext } from "../context/AppContext";
import { Destination } from "../types";
import { radius, spacing } from "../theme/tokens";
import { filterText, t, tagText } from "../utils/i18n";
import { placeText } from "../utils/placeNames";

export const Screen = ({
  children,
  flush,
}: {
  children: React.ReactNode;
  flush?: boolean;
}) => {
  const { theme } = useAppContext();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.screenBlobOne, { backgroundColor: theme.colors.accentSoft }]} />
      <View style={[styles.screenBlobTwo, { borderColor: theme.colors.border }]} />
      <View style={[styles.screenGrid, { borderColor: theme.colors.border }]} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: flush ? 0 : spacing.md,
          paddingTop: flush ? 0 : spacing.md,
          paddingBottom: 120,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
};

export const SoftCard = ({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) => {
  const { theme, state } = useAppContext();
  return (
    <View
      style={[
        styles.softCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          padding: padded ? spacing.md : 0,
        },
      ]}
    >
      {children}
    </View>
  );
};

export const HeroCard = ({
  title,
  subtitle,
  image,
  rightBadge,
}: {
  title: string;
  subtitle: string;
  image: string;
  rightBadge?: string;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const heroContent = (
    <View style={styles.heroOverlay}>
      <View style={styles.heroSun} />
      <View style={styles.heroRouteLine} />
      <View style={styles.heroRouteLineSmall} />
      <View style={styles.heroPerforation}>
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={index} style={styles.heroPerfDot} />
        ))}
      </View>
      <View style={styles.heroStamp}>
        <Text style={styles.heroStampText}>ESLAY</Text>
      </View>
      <View style={styles.heroTop}>
        {rightBadge ? (
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{rightBadge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.heroBottom}>
        <View style={styles.heroCoordinatePlate}>
          <Text style={styles.heroCoordinateText}>LIVE ROUTE / POI RADAR</Text>
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  if (imageFailed) {
    return <View style={[styles.hero, styles.heroFallback]}>{heroContent}</View>;
  }

  return (
    <ImageBackground
      source={{ uri: image }}
      style={styles.hero}
      imageStyle={{ borderRadius: 36 }}
      onError={() => setImageFailed(true)}
    >
      {heroContent}
    </ImageBackground>
  );
};

export const SectionTitle = ({ title, hint }: { title: string; hint?: string }) => {
  const { theme } = useAppContext();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {hint ? <Text style={[styles.sectionHint, { color: theme.colors.subtext }]}>{hint}</Text> : null}
    </View>
  );
};

export const Pill = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) => {
  const { theme } = useAppContext();
  const displayLabel = label;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? theme.colors.accent : theme.colors.surfaceAlt,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
        },
      ]}
    >
      <Text style={{ color: selected ? "#F5FEFF" : theme.colors.text, fontSize: 12, fontWeight: "700" }}>
        {displayLabel}
      </Text>
    </Pressable>
  );
};

export const SegmentedControl = ({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const { theme, state } = useAppContext();
  return (
    <View style={[styles.segmentWrap, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.segmentItem,
              {
                backgroundColor: active ? theme.colors.surface : "transparent",
              },
            ]}
          >
            <Text style={{ color: active ? theme.colors.text : theme.colors.subtext, fontWeight: "700", fontSize: 12 }}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const Input = ({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
}) => {
  const { theme } = useAppContext();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.subtext}
      keyboardType={keyboardType}
      style={[
        styles.input,
        {
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    />
  );
};

export const SearchBar = ({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) => {
  const { theme } = useAppContext();
  return (
    <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[styles.searchGlyph, { borderColor: theme.colors.accent }]}>
        <Text style={[styles.searchIcon, { color: theme.colors.accent }]}>GO</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.subtext}
        style={[styles.searchInput, { color: theme.colors.text }]}
      />
      <View style={[styles.voicePill, { backgroundColor: theme.colors.accentSoft }]}>
        <Text style={{ color: theme.colors.accent, fontWeight: "900", fontSize: 12 }}>AI</Text>
      </View>
    </View>
  );
};

export const PrimaryButton = ({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const { theme } = useAppContext();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.primaryButton,
        {
          backgroundColor: disabled ? theme.colors.border : theme.colors.accent,
        },
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
};

export const QuietButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={[styles.quietButton, { borderColor: theme.colors.border }]}>
      <Text style={{ color: theme.colors.text, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
};

export const InfoCard = ({ title, value, hint }: { title: string; value: string; hint?: string }) => {
  const { theme } = useAppContext();
  return (
    <SoftCard>
      <Text style={[styles.infoTitle, { color: theme.colors.subtext }]}>{title}</Text>
      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{value}</Text>
      {hint ? <Text style={[styles.infoHint, { color: theme.colors.subtext }]}>{hint}</Text> : null}
    </SoftCard>
  );
};

export const DestinationCard = ({
  destination,
  saved,
  onSave,
  onOpenMap,
}: {
  destination: Destination;
  saved: boolean;
  onSave: () => void;
  onOpenMap: () => void;
}) => {
  const { theme, state } = useAppContext();
  const [imageFailed, setImageFailed] = useState(false);
  const destinationArtwork = (
    <View style={styles.destinationImageOverlay}>
      <View style={styles.portalRingOuter} />
      <View style={styles.portalRingInner} />
      <View style={styles.vinylDisc}>
        <View style={styles.vinylHole} />
      </View>
      <View style={styles.destinationIndexPlate}>
        <Text style={styles.destinationIndexText}>{destination.country.slice(0, 3).toUpperCase()}</Text>
      </View>
      <View style={styles.cardRouteTag}>
            <Text style={styles.cardRouteTagText}>{t(state.locale, "curatedRoute")}</Text>
      </View>
      <View style={styles.topMetaRow}>
        <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{filterText(state.locale, destination.category)}</Text>
        </View>
        <Pressable onPress={onSave} style={[styles.saveBubble, { backgroundColor: saved ? theme.colors.accent : "rgba(12,32,38,0.42)" }]}>
          <Text style={{ color: "#F3FDFF", fontWeight: "800", fontSize: 12 }}>
            {saved ? t(state.locale, "savedWord") : t(state.locale, "save")}
          </Text>
        </Pressable>
      </View>
      {imageFailed ? (
        <View style={styles.fallbackPlaceName}>
          <Text style={styles.fallbackPlaceCity}>{placeText(state.locale, destination.city)}</Text>
          <Text style={styles.fallbackPlaceCountry}>{placeText(state.locale, destination.country)}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SoftCard padded={false}>
      {imageFailed ? (
        <View style={[styles.destinationImage, styles.destinationFallback]}>{destinationArtwork}</View>
      ) : (
        <ImageBackground
          source={{ uri: destination.image }}
          style={styles.destinationImage}
          imageStyle={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          onError={() => setImageFailed(true)}
        >
          {destinationArtwork}
        </ImageBackground>
      )}
      <View style={styles.destinationBody}>
        <View style={[styles.ticketNotchLeft, { backgroundColor: theme.colors.background }]} />
        <View style={[styles.ticketNotchRight, { backgroundColor: theme.colors.background }]} />
        <View style={[styles.ticketDash, { borderColor: theme.colors.border }]} />
        <View style={styles.destinationHeading}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.destinationKicker, { color: theme.colors.accent }]}>
              {t(state.locale, "destinationPortal")}
            </Text>
            <Text style={[styles.destinationTitle, { color: theme.colors.text }]}>{placeText(state.locale, destination.title)}</Text>
            <Text style={[styles.destinationMeta, { color: theme.colors.subtext }]}>
              {placeText(state.locale, destination.city)}, {placeText(state.locale, destination.country)}
            </Text>
          </View>
          <Text style={[styles.destinationRating, { color: theme.colors.accent }]}>{destination.rating.toFixed(1)}</Text>
        </View>
        <Text style={[styles.destinationDescription, { color: theme.colors.subtext }]}>{destination.description}</Text>
        <View style={styles.tagRow}>
          {destination.tags.slice(0, 3).map((tag) => (
            <Pill key={tag} label={tagText(state.locale, tag)} />
          ))}
        </View>
        <View style={styles.coordinateRow}>
          <Text style={[styles.coordinateText, { color: theme.colors.subtext }]}>
            {destination.coordinates.latitude.toFixed(2)}N
          </Text>
          <Text style={[styles.coordinateText, { color: theme.colors.subtext }]}>
            {destination.coordinates.longitude.toFixed(2)}E
          </Text>
          <Text style={[styles.coordinateText, { color: theme.colors.accent }]}>
            {destination.etaMinutes}MIN
          </Text>
        </View>
        <View style={styles.recordSleeveRow}>
          <View style={[styles.recordDot, { backgroundColor: theme.colors.accent }]} />
          <Text style={[styles.recordSleeveText, { color: theme.colors.subtext }]}>
            {t(state.locale, "saveFeeling")}
          </Text>
        </View>
        <View style={styles.actionsRow}>
          <QuietButton label={t(state.locale, "viewRoute")} onPress={onOpenMap} />
          <PrimaryButton label={saved ? t(state.locale, "inWishlist") : t(state.locale, "saveToWishlist")} onPress={onSave} />
        </View>
      </View>
    </SoftCard>
  );
};

const styles = StyleSheet.create({
  screenBlobOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -82,
    top: -72,
    opacity: 0.55,
  },
  screenBlobTwo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    left: -132,
    top: 210,
    opacity: 0.55,
  },
  screenGrid: {
    position: "absolute",
    left: 26,
    right: 26,
    top: 72,
    height: 1,
    borderTopWidth: 1,
    opacity: 0.42,
  },
  softCard: {
    borderRadius: 30,
    borderWidth: 1,
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  hero: {
    height: 326,
    borderRadius: 36,
    overflow: "hidden",
    marginHorizontal: spacing.md,
  },
  heroFallback: {
    backgroundColor: "#12323B",
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: "rgba(7, 18, 22, 0.18)",
    position: "relative",
  },
  heroSun: {
    position: "absolute",
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: "rgba(255, 111, 60, 0.68)",
    right: -42,
    top: 24,
  },
  heroRouteLine: {
    position: "absolute",
    width: 238,
    height: 238,
    borderRadius: 119,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.36)",
    right: -78,
    top: -2,
    transform: [{ rotate: "-24deg" }],
  },
  heroRouteLineSmall: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    left: -28,
    bottom: 92,
    transform: [{ rotate: "18deg" }],
  },
  heroPerforation: {
    position: "absolute",
    left: 12,
    top: 18,
    bottom: 18,
    justifyContent: "space-between",
  },
  heroPerfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 250, 240, 0.68)",
  },
  heroStamp: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    transform: [{ rotate: "-10deg" }],
  },
  heroStampText: {
    color: "#FFF6EA",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  heroTop: {
    alignItems: "flex-start",
  },
  heroBottom: {
    gap: spacing.xs,
  },
  heroCoordinatePlate: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 247, 236, 0.24)",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: 2,
  },
  heroCoordinateText: {
    color: "#FFF8ED",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  heroBadge: {
    backgroundColor: "rgba(246, 251, 252, 0.24)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroBadgeText: {
    color: "#F4FDFF",
    fontWeight: "700",
    fontSize: 12,
  },
  heroTitle: {
    color: "#FFF9EF",
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 44,
    letterSpacing: -1.8,
  },
  heroSubtitle: {
    color: "#FFECD7",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: "88%",
    fontWeight: "700",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: "700",
  },
  pill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  segmentWrap: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  input: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  searchGlyph: {
    minWidth: 46,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: {
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 24,
  },
  voicePill: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryButton: {
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    flex: 1,
  },
  primaryButtonText: {
    color: "#F6FEFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  quietButton: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  infoHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  destinationImage: {
    height: 238,
    justifyContent: "space-between",
  },
  destinationFallback: {
    backgroundColor: "#18323B",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: "hidden",
  },
  destinationImageOverlay: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: "rgba(8,22,27,0.08)",
    justifyContent: "space-between",
  },
  portalRingOuter: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
    left: -42,
    bottom: -72,
    transform: [{ rotate: "16deg" }],
  },
  portalRingInner: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1,
    borderColor: "rgba(255, 144, 80, 0.66)",
    left: -6,
    bottom: -34,
  },
  vinylDisc: {
    position: "absolute",
    right: -42,
    bottom: -42,
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: "rgba(12, 20, 24, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  vinylHole: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 144, 80, 0.82)",
    borderWidth: 7,
    borderColor: "rgba(255,255,255,0.2)",
  },
  destinationIndexPlate: {
    position: "absolute",
    right: spacing.md,
    top: 66,
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "rgba(255, 247, 236, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "11deg" }],
  },
  destinationIndexText: {
    color: "#1F2930",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  cardRouteTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(20, 28, 28, 0.52)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  cardRouteTagText: {
    color: "#FFF7EC",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  topMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveBubble: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fallbackPlaceName: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    maxWidth: "62%",
  },
  fallbackPlaceCity: {
    color: "#FFF7EC",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  fallbackPlaceCountry: {
    color: "#FFD5B9",
    marginTop: 3,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  destinationBody: {
    padding: spacing.lg,
    gap: spacing.sm,
    position: "relative",
  },
  ticketNotchLeft: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    left: -11,
    top: 24,
  },
  ticketNotchRight: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    right: -11,
    top: 24,
  },
  ticketDash: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    marginTop: 2,
    marginBottom: 2,
  },
  destinationHeading: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  destinationKicker: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  destinationTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  destinationMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  destinationRating: {
    fontSize: 20,
    fontWeight: "900",
  },
  destinationDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  coordinateRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  coordinateText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  recordSleeveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  recordDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  recordSleeveText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
