import React from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, SafeAreaView, StyleSheet, View } from "react-native";
import { AppProvider, useAppContext } from "./src/context/AppContext";
import { DiscoveryScreen } from "./src/screens/DiscoveryScreen";
import { ItineraryScreen } from "./src/screens/ItineraryScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SavedScreen } from "./src/screens/SavedScreen";
import { AppTab, TabBar } from "./src/components/TabBar";

const MainApp = () => {
  const { state, theme } = useAppContext();
  const isWeb = Platform.OS === "web";

  if (!state.session.isAuthenticated) {
    return (
      <View style={[styles.viewport, { backgroundColor: theme.colors.badge }]}>
        <View style={styles.backdropOrbOne} />
        <View style={styles.backdropOrbTwo} />
        <SafeAreaView style={[styles.safeArea, isWeb && styles.webPhoneFrame, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
          <OnboardingScreen />
        </SafeAreaView>
      </View>
    );
  }

  const renderScreen = () => {
    switch (state.activeTab) {
      case "discover":
        return <DiscoveryScreen />;
      case "itinerary":
        return <ItineraryScreen />;
      case "map":
        return <MapScreen />;
      case "saved":
        return <SavedScreen />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <DiscoveryScreen />;
    }
  };

  return (
    <View style={[styles.viewport, { backgroundColor: theme.colors.badge }]}>
      <View style={styles.backdropOrbOne} />
      <View style={styles.backdropOrbTwo} />
      <SafeAreaView style={[styles.safeArea, isWeb && styles.webPhoneFrame, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
        <View style={styles.appShell}>
          <View style={styles.content}>{renderScreen()}</View>
          <TabBar
            activeTab={state.activeTab}
            onChange={(tab: AppTab) => state.actions.setActiveTab(tab)}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    position: "relative",
    overflow: "hidden",
  },
  backdropOrbOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 138, 76, 0.28)",
    top: -80,
    right: -70,
  },
  backdropOrbTwo: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(97, 170, 186, 0.24)",
    bottom: -70,
    left: -80,
  },
  safeArea: {
    flex: 1,
    width: "100%",
  },
  webPhoneFrame: {
    width: "100%",
    maxWidth: 430,
    minHeight: "100%",
    borderWidth: 1,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.22)",
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  appShell: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
