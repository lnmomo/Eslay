import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../context/AppContext";
import { AppTab as TabKey } from "../types";
import { radius, spacing } from "../theme/tokens";
import { t } from "../utils/i18n";

export type AppTab = TabKey;

const labels: Record<AppTab, string> = {
  discover: "01",
  itinerary: "02",
  map: "03",
  saved: "04",
  profile: "05",
};

export const TabBar = ({
  activeTab,
  onChange,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}) => {
  const { theme, state } = useAppContext();
  const tabs: AppTab[] = ["discover", "itinerary", "map", "saved", "profile"];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: "transparent",
        },
      ]}
    >
      <View style={[styles.rail, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
      <View style={[styles.railComet, { backgroundColor: theme.colors.accentSoft }]} />
      <View style={[styles.railTrack, { borderColor: theme.colors.border }]} />
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={[
              styles.item,
              {
                backgroundColor: isActive ? theme.colors.accentSoft : "transparent",
              },
            ]}
          >
            {isActive ? (
              <>
                <View style={[styles.activeDot, { backgroundColor: theme.colors.accent }]} />
                <View style={[styles.activeHalo, { borderColor: theme.colors.accent }]} />
              </>
            ) : null}
            <Text style={[styles.short, { color: isActive ? theme.colors.accent : theme.colors.subtext }]}>
              {labels[tab]}
            </Text>
            <Text style={[styles.caption, { color: isActive ? theme.colors.text : theme.colors.subtext }]}>
              {t(state.locale, tab)}
            </Text>
          </Pressable>
        );
      })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: 16,
  },
  rail: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 34,
    padding: 7,
    gap: spacing.xs,
    shadowOpacity: 0.24,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
    overflow: "hidden",
    position: "relative",
  },
  railComet: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -44,
    bottom: -70,
    opacity: 0.42,
  },
  railTrack: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 18,
    borderTopWidth: 1,
    opacity: 0.8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    paddingVertical: 12,
    gap: 2,
    position: "relative",
  },
  activeDot: {
    position: "absolute",
    width: 22,
    height: 5,
    borderRadius: 3,
    top: 6,
  },
  activeHalo: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    opacity: 0.3,
  },
  short: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  caption: {
    fontSize: 12,
    fontWeight: "700",
  },
});
