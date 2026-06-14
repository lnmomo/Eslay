import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HeroCard, Pill, Screen, SectionTitle, SegmentedControl, SoftCard } from "../components/Ui";
import { useAppContext } from "../context/AppContext";
import { radius, spacing } from "../theme/tokens";
import { t, tagText, textFor } from "../utils/i18n";

type ProfileService = "sms" | "apple" | "google" | "facebook" | "airline" | "chat" | "faq" | "prep";

type ProfileApiItem = {
  id: string;
  title: string;
  body: string;
  status: string;
};

const serviceTitle = (service: ProfileService, zh: boolean) =>
  zh
    ? ({
        sms: "SMS \u9a8c\u8bc1",
        apple: "Apple \u767b\u5f55",
        google: "Google \u767b\u5f55",
        facebook: "Facebook \u767b\u5f55",
        airline: "\u822a\u7a7a\u516c\u53f8\u652f\u6301",
        chat: "\u5728\u7ebf\u5ba2\u670d",
        faq: "\u5e2e\u52a9\u4e2d\u5fc3",
        prep: "\u51fa\u884c\u51c6\u5907",
      }[service])
    : ({
        sms: "SMS verification",
        apple: "Apple login",
        google: "Google login",
        facebook: "Facebook login",
        airline: "Airline support",
        chat: "Live chat",
        faq: "Help center",
        prep: "Preparation guides",
      }[service]);

const serviceCode = (service: ProfileService) =>
  ({
    sms: "OTP",
    apple: "APL",
    google: "GGL",
    facebook: "FB",
    airline: "AIR",
    chat: "MSG",
    faq: "FAQ",
    prep: "PREP",
  })[service];

const mockProfileApi = (service: ProfileService, zh: boolean): ProfileApiItem[] => {
  const data: Record<ProfileService, ProfileApiItem[]> = {
    sms: [
      {
        id: "sms-1",
        title: zh ? "\u53d1\u9001\u4e00\u6b21\u6027\u9a8c\u8bc1\u7801" : "Send one-time passcode",
        body: zh ? "\u5047\u63a5\u53e3\u8fd4\u56de 6 \u4f4d OTP\uff0c\u7528\u4e8e\u6f14\u793a\u767b\u5f55\u6d41\u7a0b\u3002" : "Mock endpoint returns a 6-digit OTP for demo login flow.",
        status: "200 OK",
      },
      {
        id: "sms-2",
        title: zh ? "\u7ed1\u5b9a\u624b\u673a\u98ce\u63a7" : "Phone risk check",
        body: zh ? "\u68c0\u67e5\u8bbe\u5907\u548c\u5f02\u5730\u767b\u5f55\u72b6\u6001\uff0c\u6f14\u793a\u5b89\u5168\u63d0\u9192\u3002" : "Checks device and location status for security reminder demo.",
        status: "200 OK",
      },
    ],
    apple: [
      {
        id: "apple-1",
        title: zh ? "Apple ID \u6388\u6743\u72b6\u6001" : "Apple ID authorization",
        body: zh ? "\u8fd4\u56de\u6388\u6743 token\u3001\u90ae\u7bb1\u9690\u79c1\u72b6\u6001\u548c\u767b\u5f55\u65f6\u95f4\u3002" : "Returns token, private relay status, and login timestamp.",
        status: "200 OK",
      },
    ],
    google: [
      {
        id: "google-1",
        title: zh ? "Google \u8d26\u53f7\u540c\u6b65" : "Google account sync",
        body: zh ? "\u6f14\u793a\u540c\u6b65\u5934\u50cf\u3001\u90ae\u7bb1\u548c\u884c\u7a0b\u63d0\u9192\u6743\u9650\u3002" : "Demo syncs avatar, email, and itinerary reminder permission.",
        status: "200 OK",
      },
    ],
    facebook: [
      {
        id: "facebook-1",
        title: zh ? "Facebook \u793e\u4ea4\u767b\u5f55" : "Facebook social login",
        body: zh ? "\u7528\u4e8e\u6f14\u793a\u7b2c\u4e09\u65b9\u767b\u5f55\u56de\u8c03\u548c\u7528\u6237\u8d44\u6599\u83b7\u53d6\u3002" : "Shows third-party login callback and profile fetch demo.",
        status: "200 OK",
      },
    ],
    airline: [
      {
        id: "airline-1",
        title: zh ? "\u822a\u73ed\u5ef6\u8bef\u4e0e\u6539\u7b7e" : "Delay and rebooking support",
        body: zh ? "\u8fd4\u56de\u822a\u53f8\u70ed\u7ebf\u3001\u6539\u7b7e\u7a97\u53e3\u548c\u5ef6\u8bef\u8865\u507f\u63d0\u793a\u3002" : "Returns hotline, rebooking window, and delay compensation hints.",
        status: "LIVE MOCK",
      },
      {
        id: "airline-2",
        title: zh ? "\u884c\u674e\u989d\u67e5\u8be2" : "Baggage allowance lookup",
        body: zh ? "\u6309\u822a\u53f8\u548c\u8231\u4f4d\u6f14\u793a\u884c\u674e\u989d\u3001\u8d85\u91cd\u8d39\u7528\u3002" : "Demo baggage allowance and overweight fee by airline and cabin.",
        status: "200 OK",
      },
    ],
    chat: [
      {
        id: "chat-1",
        title: zh ? "\u5ba2\u670d\u4f1a\u8bdd\u5df2\u5efa\u7acb" : "Support session opened",
        body: zh ? "\u8fd4\u56de\u5ba2\u670d\u6392\u961f\u4f4d\u7f6e\u3001\u9884\u4f30\u7b49\u5f85\u65f6\u95f4\u548c\u95ee\u9898\u5efa\u8bae\u3002" : "Returns queue position, estimated wait time, and suggested topics.",
        status: "QUEUE 03",
      },
    ],
    faq: [
      {
        id: "faq-1",
        title: zh ? "\u9884\u8ba2\u4e0e\u9000\u6539\u95ee\u9898" : "Booking and cancellation",
        body: zh ? "\u8986\u76d6\u673a\u7968\u3001\u9152\u5e97\u3001\u666f\u70b9\u7968\u7684\u9000\u6539\u89c4\u5219\u6f14\u793a\u3002" : "Demo FAQ for flights, hotels, and attraction ticket changes.",
        status: "8 DOCS",
      },
      {
        id: "faq-2",
        title: zh ? "\u8d26\u53f7\u4e0e\u9690\u79c1" : "Account and privacy",
        body: zh ? "\u5c55\u793a\u767b\u5f55\u3001\u751f\u7269\u8bc6\u522b\u548c\u6570\u636e\u5220\u9664\u7684\u5e2e\u52a9\u6587\u6863\u3002" : "Shows login, biometrics, and data deletion help docs.",
        status: "5 DOCS",
      },
    ],
    prep: [
      {
        id: "prep-1",
        title: zh ? "\u51fa\u53d1\u524d\u68c0\u67e5\u6e05\u5355" : "Pre-trip checklist",
        body: zh ? "\u6309\u76ee\u7684\u5730\u8fd4\u56de\u7b7e\u8bc1\u3001\u62a4\u7167\u3001\u4fdd\u9669\u548c\u884c\u674e\u5efa\u8bae\u3002" : "Returns visa, passport, insurance, and packing suggestions by destination.",
        status: "READY",
      },
      {
        id: "prep-2",
        title: zh ? "\u79bb\u7ebf\u8d44\u6e90\u5305" : "Offline resource pack",
        body: zh ? "\u6f14\u793a\u4e0b\u8f7d\u5730\u56fe\u3001\u8ba2\u5355\u3001\u7d27\u6025\u8054\u7cfb\u65b9\u5f0f\u3002" : "Demo download for maps, orders, and emergency contacts.",
        status: "CACHE",
      },
    ],
  };
  return data[service];
};

const ProfileServiceScreen = ({ service, onBack }: { service: ProfileService; onBack: () => void }) => {
  const { state, theme } = useAppContext();
  const zh = state.locale === "zh";
  const items = mockProfileApi(service, zh);

  return (
    <Screen>
      <View style={[styles.serviceHero, { backgroundColor: theme.colors.badge, borderColor: theme.colors.border }]}>
        <View style={[styles.serviceOrbit, { borderColor: theme.colors.accent }]} />
        <Pressable onPress={onBack} style={styles.serviceBack}>
          <Text style={styles.serviceBackText}>{zh ? "\u8fd4\u56de" : "Back"}</Text>
        </Pressable>
        <View style={styles.serviceCodePlate}>
          <Text style={styles.serviceCodeText}>{serviceCode(service)}</Text>
        </View>
        <Text style={styles.serviceKicker}>{zh ? "\u6211\u7684\u5047\u63a5\u53e3" : "PROFILE MOCK API"}</Text>
        <Text style={styles.serviceTitle}>{serviceTitle(service, zh)}</Text>
        <Text style={styles.serviceMeta}>
          GET /mock/profile/{service}  {items.length} {zh ? "\u6761\u8fd4\u56de" : "records"}
        </Text>
      </View>

      <View style={[styles.stack, styles.innerPad]}>
        {items.map((item, index) => (
          <SoftCard key={item.id}>
            <View style={[styles.serviceCardAura, { borderColor: theme.colors.border }]} />
            <View style={styles.serviceCardTop}>
              <Text style={[styles.serviceIndex, { color: theme.colors.accent }]}>0{index + 1}</Text>
              <View style={[styles.serviceStatus, { backgroundColor: theme.colors.accentSoft }]}>
                <Text style={[styles.serviceStatusText, { color: theme.colors.accent }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={[styles.heading, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.body, { color: theme.colors.subtext }]}>{item.body}</Text>
          </SoftCard>
        ))}
      </View>
    </Screen>
  );
};

const SettingRow = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) => {
  const { theme } = useAppContext();
  return (
    <Pressable onPress={onPress} style={[styles.settingRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={{ color: theme.colors.text, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: theme.colors.accent, fontWeight: "800" }}>{value}</Text>
    </Pressable>
  );
};

export const ProfileScreen = () => {
  const { state, theme, allTags } = useAppContext();
  const [activeService, setActiveService] = useState<ProfileService | null>(null);
  const profileOptions = ["account", "preferences", "system"] as const;
  const zh = state.locale === "zh";

  if (activeService) {
    return <ProfileServiceScreen service={activeService} onBack={() => setActiveService(null)} />;
  }

  return (
    <Screen>
      <HeroCard
        title={t(state.locale, "profileHeroTitle")}
        subtitle={t(state.locale, "profileHeroSub")}
        image="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80"
        rightBadge={t(state.locale, "customization")}
      />

      <View style={styles.innerPad}>
        <SegmentedControl
          options={profileOptions.map((option) => t(state.locale, option))}
          value={t(state.locale, state.profileView)}
          onChange={(value) => {
            const next = profileOptions.find((option) => t(state.locale, option) === value) ?? "account";
            state.actions.setProfileView(next);
          }}
        />
      </View>

      {state.profileView === "account" ? (
        <>
          <SectionTitle title={t(state.locale, "easyAccount")} hint={t(state.locale, "easyAccountHint")} />
          <View style={[styles.stack, styles.innerPad]}>
            <SoftCard>
              <Text style={[styles.heading, { color: theme.colors.text }]}>{t(state.locale, "currentSession")}</Text>
              <Text style={[styles.body, { color: theme.colors.subtext }]}>
                {state.session.phone || t(state.locale, "guestTraveler")}  {state.session.authMethod ?? t(state.locale, "mockSession")}
              </Text>
              <View style={styles.inlinePills}>
                <Pill label="SMS OTP" selected onPress={() => setActiveService("sms")} />
                <Pill label="Apple" onPress={() => setActiveService("apple")} />
                <Pill label="Google" onPress={() => setActiveService("google")} />
                <Pill label="Facebook" onPress={() => setActiveService("facebook")} />
              </View>
            </SoftCard>

            <SoftCard>
              <Text style={[styles.heading, { color: theme.colors.text }]}>{t(state.locale, "quickSupport")}</Text>
              <Text style={[styles.body, { color: theme.colors.subtext }]}>{t(state.locale, "quickSupportBody")}</Text>
              <View style={styles.supportLinks}>
                <Pressable onPress={() => setActiveService("airline")} style={[styles.supportLink, { borderColor: theme.colors.border }]}>
                  <Text style={{ color: theme.colors.accent, fontWeight: "800" }}>{t(state.locale, "callAirline")}</Text>
                </Pressable>
                <Pressable onPress={() => setActiveService("chat")} style={[styles.supportLink, { borderColor: theme.colors.border }]}>
                  <Text style={{ color: theme.colors.accent, fontWeight: "800" }}>{t(state.locale, "openChat")}</Text>
                </Pressable>
                <Pressable onPress={() => setActiveService("faq")} style={[styles.supportLink, { borderColor: theme.colors.border }]}>
                  <Text style={{ color: theme.colors.accent, fontWeight: "800" }}>{t(state.locale, "helpFaq")}</Text>
                </Pressable>
              </View>
            </SoftCard>
          </View>
        </>
      ) : null}

      {state.profileView === "preferences" ? (
        <>
          <SectionTitle title={t(state.locale, "travelPreferences")} hint={t(state.locale, "personalizationInputs")} />
          <View style={[styles.stack, styles.innerPad]}>
            <SoftCard>
              <Text style={[styles.heading, { color: theme.colors.text }]}>{t(state.locale, "interests")}</Text>
              <Text style={[styles.body, { color: theme.colors.subtext }]}>
                {zh
                  ? "点击标签即可添加或取消偏好，修改会立即影响首页、心情行程和 DIY 推荐排序。"
                  : "Tap tags to add or remove interests. Changes immediately affect Home, mood trips, and DIY ranking."}
              </Text>
              <View style={styles.inlinePills}>
                {allTags.map((tag) => (
                  <Pill
                    key={tag}
                    label={tagText(state.locale, tag)}
                    selected={state.selectedTags.includes(tag)}
                    onPress={() => state.actions.toggleTag(tag)}
                  />
                ))}
              </View>
            </SoftCard>
            <SoftCard>
              <View style={styles.preferenceHeadingRow}>
                <Text style={[styles.heading, { color: theme.colors.text }]}>{t(state.locale, "budgetLevel")}</Text>
                <Text style={[styles.budgetValue, { color: theme.colors.accent }]}>
                  {zh ? `${state.budgetLevel} 级` : `Level ${state.budgetLevel}`}
                </Text>
              </View>
              <View style={styles.budgetRow}>
                {[1, 2, 3, 4, 5].map((level) => {
                  const active = state.budgetLevel === level;
                  return (
                    <Pressable
                      key={level}
                      onPress={() => state.actions.setBudgetLevel(level as 1 | 2 | 3 | 4 | 5)}
                      style={[
                        styles.budgetStep,
                        {
                          backgroundColor: active ? theme.colors.accent : theme.colors.surfaceAlt,
                          borderColor: active ? theme.colors.accent : theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.budgetStepText, { color: active ? "#FFF7EC" : theme.colors.text }]}>{level}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.budgetExplanation, { color: theme.colors.subtext }]}>
                {zh
                  ? state.budgetLevel <= 2
                    ? "优先推荐高性价比目的地，并降低高消费地点的排序。数字越大，可接受的旅行预算越多。"
                    : state.budgetLevel === 3
                      ? "优先推荐价格与体验较均衡的目的地。数字越大，可接受的旅行预算越多。"
                      : "优先推荐高端度假、品质住宿和高消费体验。数字越大，可接受的旅行预算越多。"
                  : state.budgetLevel <= 2
                    ? "Prioritizes value destinations and lowers expensive options. A higher number means a larger travel budget."
                    : state.budgetLevel === 3
                      ? "Prioritizes destinations with a balanced price and experience. A higher number means a larger travel budget."
                      : "Prioritizes premium stays and higher-end experiences. A higher number means a larger travel budget."}
              </Text>
            </SoftCard>
            <SettingRow
              label={t(state.locale, "dietaryRequirement")}
              value={textFor(state.locale, state.dietaryMode)}
              onPress={() =>
                state.actions.setDietaryMode(
                  state.dietaryMode === "None" ? "Vegetarian" : state.dietaryMode === "Vegetarian" ? "Halal" : "None",
                )
              }
            />
          </View>
        </>
      ) : null}

      {state.profileView === "system" ? (
        <>
          <SectionTitle title={t(state.locale, "systemSettings")} hint={t(state.locale, "localePrivacySupport")} />
          <View style={[styles.stack, styles.innerPad]}>
            <SettingRow
              label={t(state.locale, "language")}
              value={state.locale === "zh" ? "\u4e2d\u6587" : "English"}
              onPress={() => state.actions.setLocale(state.locale === "zh" ? "en" : "zh")}
            />
            <SettingRow
              label={t(state.locale, "theme")}
              value={state.themeMode === "light" ? t(state.locale, "light") : t(state.locale, "dark")}
              onPress={() => state.actions.toggleTheme()}
            />
            <SettingRow
              label={t(state.locale, "offlineMode")}
              value={state.isOffline ? t(state.locale, "cachedMode") : t(state.locale, "liveMode")}
              onPress={() => state.actions.toggleOfflineMode()}
            />
            <SettingRow
              label={t(state.locale, "biometric")}
              value={state.session.biometricEnabled ? t(state.locale, "enabled") : t(state.locale, "disabled")}
              onPress={() => state.actions.toggleBiometric()}
            />
            <SettingRow
              label={t(state.locale, "mapPermission")}
              value={state.mapAvailable ? t(state.locale, "allowed") : t(state.locale, "fallback")}
              onPress={() => state.actions.toggleMapFallback()}
            />
            <SoftCard>
              <Text style={[styles.heading, { color: theme.colors.text }]}>{t(state.locale, "preparationGuides")}</Text>
              <Text style={[styles.body, { color: theme.colors.subtext }]}>{t(state.locale, "preparationGuidesBody")}</Text>
              <Pressable onPress={() => setActiveService("prep")} style={[styles.prepButton, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.prepButtonText}>{zh ? "\u6253\u5f00\u51c6\u5907\u63a5\u53e3" : "Open prep API"}</Text>
              </Pressable>
            </SoftCard>
            <Pressable
              onPress={() => state.actions.logout()}
              style={[styles.logout, { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border }]}
            >
              <Text style={{ color: theme.colors.danger, fontWeight: "800" }}>{t(state.locale, "logout")}</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  innerPad: {
    marginHorizontal: spacing.md,
  },
  stack: {
    gap: spacing.sm,
  },
  settingRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceHero: {
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: 34,
    padding: spacing.md,
    minHeight: 196,
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
  },
  serviceOrbit: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    right: -44,
    top: -54,
    opacity: 0.7,
  },
  serviceBack: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    backgroundColor: "rgba(255, 247, 236, 0.14)",
  },
  serviceBackText: { color: "#FFF7EC", fontWeight: "900", fontSize: 12 },
  serviceCodePlate: {
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
  serviceCodeText: { color: "#FFF7EC", fontSize: 16, fontWeight: "900", letterSpacing: 1.5 },
  serviceKicker: { color: "#FFB98E", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  serviceTitle: { color: "#FFF7EC", marginTop: 6, fontSize: 32, lineHeight: 36, fontWeight: "900", letterSpacing: -1 },
  serviceMeta: { color: "#FFD9C2", marginTop: 6, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  serviceCardAura: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    right: -38,
    top: -42,
    opacity: 0.42,
  },
  serviceCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  serviceIndex: { fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  serviceStatus: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  serviceStatusText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  heading: {
    fontSize: 16,
    fontWeight: "800",
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  inlinePills: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  preferenceHeadingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  budgetValue: { fontSize: 13, fontWeight: "900" },
  budgetRow: { marginTop: spacing.md, flexDirection: "row", gap: spacing.xs },
  budgetStep: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  budgetStepText: { fontSize: 14, fontWeight: "900" },
  budgetExplanation: { marginTop: spacing.sm, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  supportLinks: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  supportLink: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  prepButton: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  prepButtonText: { color: "#FFF7EC", fontSize: 13, fontWeight: "900" },
  logout: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
});
