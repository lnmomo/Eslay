import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Input, Pill, PrimaryButton, Screen, SectionTitle, SegmentedControl, SoftCard } from "../components/Ui";
import { useAppContext } from "../context/AppContext";
import { radius, spacing } from "../theme/tokens";
import { t, tagText, textFor } from "../utils/i18n";

export const OnboardingScreen = () => {
  const { state, theme, allTags } = useAppContext();
  const [showLogin, setShowLogin] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [phone, setPhone] = useState(state.session.phone || "13800138000");
  const [otp, setOtp] = useState(state.session.otp === "******" ? "246810" : state.session.otp || "");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (otp.length >= 6) {
      setShowPreferences(true);
    }
  }, [otp]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const canContinue = state.selectedTags.length >= 3;
  const completeOnboarding = () => state.actions.loginWithOtp(phone, otp || "246810");
  const socialContinue = (method: "apple" | "google") => {
    setPhone(method === "apple" ? "Apple User" : "Google User");
    setOtp("******");
    setShowPreferences(true);
  };

  if (!showLogin) {
    const zh = state.locale === "zh";
    return (
      <View style={styles.coverPage}>
        <View style={styles.coverShell}>
          <View style={styles.coverSun} />
          <View style={styles.coverOrbit} />
          <View style={styles.coverOrbitSmall} />
          <View style={styles.coverPassport}>
            <Text style={styles.coverPassportText}>ESLAY</Text>
          </View>
          <View style={styles.coverTopLine}>
            <Text style={styles.coverKicker}>{zh ? "\u54c1\u724c\u8d77\u70b9" : "BRAND ORIGIN"}</Text>
            <View style={styles.languageSwitch}>
              <Pressable
                onPress={() => state.actions.setLocale("zh")}
                style={[styles.languageButton, state.locale === "zh" && styles.languageButtonActive]}
              >
                <Text style={[styles.languageText, state.locale === "zh" && styles.languageTextActive]}>中</Text>
              </Pressable>
              <Pressable
                onPress={() => state.actions.setLocale("en")}
                style={[styles.languageButton, state.locale === "en" && styles.languageButtonActive]}
              >
                <Text style={[styles.languageText, state.locale === "en" && styles.languageTextActive]}>EN</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.coverMain}>
            <Text style={styles.coverWordmark}>Eslay</Text>
            <Text style={styles.coverTitle}>
              {zh ? "Escape + Lay\uff0c\u628a\u5fc3\u653e\u8fdb\u65c5\u9014\u91cc\u3002" : "Escape + Lay, a name for leaving noise behind."}
            </Text>
            <Text style={styles.coverBody}>
              {zh
                ? "Eslay \u662f\u4e00\u4e2a\u539f\u521b\u54c1\u724c\u8bcd\uff0c\u7531 Escape \u548c Lay \u7ec4\u5408\u800c\u6765\u3002\u5b83\u610f\u5473\u7740\u4ece\u7410\u788e\u65e5\u5e38\u4e2d\u77ed\u6682\u51fa\u9003\uff0c\u5411\u8fdc\u65b9\u6f2b\u6e38\uff0c\u5e76\u628a\u81ea\u5df1\u7684\u5fc3\u5b89\u653e\u5728\u65c5\u7a0b\u91cc\u3002"
                : "The name Eslay is an original brand word combined with Escape and Lay. It means escape from trivial daily life, wander toward the distance, and lay your heart in the journey."}
            </Text>
          </View>
          <View style={styles.coverFeatureGrid}>
            {[
              zh ? "\u9003\u79bb\u7410\u788e" : "Escape daily noise",
              zh ? "\u5411\u8fdc\u65b9\u6f2b\u6e38" : "Wander outward",
              zh ? "\u628a\u5fc3\u5b89\u653e" : "Lay your heart",
              zh ? "\u751f\u6210\u65c5\u7a0b" : "Shape the route",
            ].map((item, index) => (
              <View key={item} style={styles.coverFeature}>
                <Text style={styles.coverFeatureIndex}>0{index + 1}</Text>
                <Text style={styles.coverFeatureText}>{item}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={() => setShowLogin(true)} style={styles.coverButton}>
            <Text style={styles.coverButtonText}>{zh ? "\u8fdb\u5165 Eslay" : "Enter Eslay"}</Text>
          </Pressable>
          <Text style={styles.coverFootnote}>
            {zh ? "\u4e0b\u4e00\u6b65\uff1a\u767b\u5f55\u5e76\u8bbe\u7f6e\u4f60\u7684\u65c5\u884c\u504f\u597d" : "Next: sign in and tune your travel profile"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      {!showPreferences ? (
        <>
          <View style={[styles.loginHeader, styles.innerPad, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.loginKicker, { color: theme.colors.accent }]}>ESLAY LOGIN</Text>
            <Text style={[styles.loginTitle, { color: theme.colors.text }]}>
              {state.locale === "zh" ? "\u767b\u5f55\u540e\u518d\u8bbe\u7f6e\u4f60\u7684\u65c5\u884c\u504f\u597d" : "Sign in, then tune your travel profile"}
            </Text>
            <Text style={[styles.loginBody, { color: theme.colors.subtext }]}>
              {state.locale === "zh" ? "\u8f93\u5165\u624b\u673a\u53f7\u548c\u9a8c\u8bc1\u7801\uff0c\u4e0b\u4e00\u6b65\u4f1a\u8fdb\u5165\u504f\u597d\u9009\u62e9\u9875\u3002" : "Enter your phone and OTP. Preferences come next and can be skipped."}
            </Text>
          </View>
          <SectionTitle title={t(state.locale, "authentication")} hint={t(state.locale, "authenticationHint")} />
          <View style={[styles.stack, styles.innerPad]}>
            <Input value={phone} onChangeText={setPhone} placeholder={t(state.locale, "phoneLabel")} keyboardType="number-pad" />
            <View style={styles.otpRow}>
              <View style={{ flex: 1 }}>
                <Input value={otp} onChangeText={setOtp} placeholder={t(state.locale, "otpLabel")} keyboardType="number-pad" />
              </View>
              <View style={[styles.countdown, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.text, fontWeight: "800" }}>{countdown}s</Text>
              </View>
            </View>
            <View style={styles.socialRow}>
              <Pressable onPress={() => socialContinue("apple")} style={[styles.socialButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.text, fontWeight: "700" }}>Apple</Text>
              </Pressable>
              <Pressable onPress={() => socialContinue("google")} style={[styles.socialButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.text, fontWeight: "700" }}>Google</Text>
              </Pressable>
            </View>
            <PrimaryButton label={state.locale === "zh" ? "\u4e0b\u4e00\u6b65" : "Next"} disabled={otp.length < 6} onPress={() => setShowPreferences(true)} />
          </View>
        </>
      ) : (
        <>
          <View style={[styles.loginHeader, styles.innerPad, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.loginKicker, { color: theme.colors.accent }]}>TRAVEL PROFILE</Text>
            <Text style={[styles.loginTitle, { color: theme.colors.text }]}>
              {state.locale === "zh" ? "\u9009\u62e9\u504f\u597d\uff0c\u4e5f\u53ef\u4ee5\u5148\u8df3\u8fc7" : "Choose preferences, or skip for now"}
            </Text>
            <Text style={[styles.loginBody, { color: theme.colors.subtext }]}>
              {state.locale === "zh" ? "\u8fd9\u4e9b\u4fe1\u53f7\u4f1a\u5f71\u54cd\u9996\u9875\u63a8\u8350\u3001Mood \u884c\u7a0b\u548c DIY \u7b5b\u9009\u6392\u5e8f\u3002" : "These signals shape Home recommendations, mood trips, and DIY ranking."}
            </Text>
          </View>
          <SectionTitle title={t(state.locale, "selectTags")} hint={`${state.selectedTags.length}/8`} />
          <View style={[styles.tags, styles.innerPad]}>
            {allTags.map((tag) => (
              <Pill key={tag} label={tagText(state.locale, tag)} selected={state.selectedTags.includes(tag)} onPress={() => state.actions.toggleTag(tag)} />
            ))}
          </View>
          <SectionTitle title={t(state.locale, "travelPreferenceDetails")} hint={t(state.locale, "budgetDietary")} />
          <View style={[styles.stack, styles.innerPad]}>
            <SoftCard>
              <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{t(state.locale, "budgetLevel")}</Text>
              <View style={styles.sliderRow}>
                {[1, 2, 3, 4, 5].map((level) => {
                  const active = state.budgetLevel === level;
                  return (
                    <Pressable
                      key={level}
                      onPress={() => state.actions.setBudgetLevel(level as 1 | 2 | 3 | 4 | 5)}
                      style={[
                        styles.sliderStep,
                        {
                          backgroundColor: active ? theme.colors.accent : theme.colors.surfaceAlt,
                          borderColor: active ? theme.colors.accent : theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? "#F6FDFF" : theme.colors.text, fontWeight: "800" }}>{level}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.helper, { color: theme.colors.subtext }]}>{t(state.locale, "sliderHelper")}</Text>
            </SoftCard>
            <SoftCard>
              <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{t(state.locale, "dietaryMode")}</Text>
              <View style={{ marginTop: spacing.sm }}>
                <SegmentedControl
                  options={["None", "Vegetarian", "Halal"].map((value) => textFor(state.locale, value))}
                  value={textFor(state.locale, state.dietaryMode)}
                  onChange={(value) => {
                    const modes = ["None", "Vegetarian", "Halal"] as const;
                    const next = modes.find((mode) => textFor(state.locale, mode) === value) ?? "None";
                    state.actions.setDietaryMode(next);
                  }}
                />
              </View>
            </SoftCard>
          </View>
          <View style={[styles.preferenceActions, styles.innerPad]}>
            <Pressable onPress={completeOnboarding} style={[styles.skipButton, { borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.text, fontWeight: "900" }}>{state.locale === "zh" ? "\u8df3\u8fc7" : "Skip"}</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={canContinue ? t(state.locale, "continue") : t(state.locale, "select3Tags")}
                disabled={!canContinue}
                onPress={completeOnboarding}
              />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  innerPad: {
    marginHorizontal: spacing.md,
  },
  coverPage: {
    flex: 1,
    backgroundColor: "#FBF7EF",
    padding: spacing.md,
  },
  coverShell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(240, 90, 42, 0.18)",
    borderRadius: 38,
    padding: spacing.lg,
    overflow: "hidden",
    justifyContent: "space-between",
    position: "relative",
    backgroundColor: "#FFFEFA",
    shadowColor: "rgba(91, 55, 28, 0.22)",
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 20 },
    elevation: 10,
  },
  coverSun: {
    position: "absolute",
    width: 196,
    height: 196,
    borderRadius: 98,
    right: -72,
    top: 82,
    backgroundColor: "rgba(255, 232, 216, 0.86)",
  },
  coverOrbit: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    borderWidth: 1,
    borderColor: "rgba(240, 90, 42, 0.28)",
    right: -118,
    top: 16,
    transform: [{ rotate: "-18deg" }],
  },
  coverOrbitSmall: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: "rgba(24, 41, 45, 0.16)",
    left: -42,
    bottom: 138,
  },
  coverPassport: {
    position: "absolute",
    right: spacing.lg,
    bottom: 104,
    borderWidth: 1,
    borderColor: "rgba(240, 90, 42, 0.26)",
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    transform: [{ rotate: "-8deg" }],
    backgroundColor: "rgba(255, 232, 216, 0.46)",
  },
  coverPassportText: {
    color: "#18292D",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2.2,
  },
  coverTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverKicker: {
    color: "#F05A2A",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  languageSwitch: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(240, 90, 42, 0.22)",
    borderRadius: 999,
    padding: 3,
    backgroundColor: "rgba(255, 232, 216, 0.38)",
  },
  languageButton: {
    minWidth: 42,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center",
  },
  languageButtonActive: {
    backgroundColor: "#18292D",
  },
  languageText: {
    color: "#796755",
    fontSize: 11,
    fontWeight: "900",
  },
  languageTextActive: {
    color: "#FFF9EA",
  },
  coverMain: {
    marginTop: 44,
    gap: spacing.sm,
  },
  coverWordmark: {
    color: "#18292D",
    fontSize: 66,
    lineHeight: 68,
    fontWeight: "900",
    letterSpacing: -3.8,
  },
  coverTitle: {
    color: "#18292D",
    fontSize: 31,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -1.5,
    maxWidth: "92%",
  },
  coverBody: {
    color: "#796755",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    maxWidth: "94%",
  },
  coverFeatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  coverFeature: {
    width: "47.5%",
    minHeight: 70,
    borderWidth: 1,
    borderColor: "rgba(240, 90, 42, 0.22)",
    borderRadius: 22,
    padding: spacing.sm,
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 232, 216, 0.34)",
  },
  coverFeatureIndex: {
    color: "#F05A2A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  coverFeatureText: {
    color: "#18292D",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  coverButton: {
    marginTop: spacing.md,
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: "#FF6F3C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,0,0,0.35)",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  coverButtonText: {
    color: "#FFF7EC",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  coverFootnote: {
    color: "#796755",
    marginTop: spacing.xs,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  stack: {
    gap: spacing.sm,
  },
  loginHeader: {
    borderWidth: 1,
    borderRadius: 30,
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: "hidden",
  },
  loginKicker: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  loginTitle: {
    fontSize: 28,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -1,
  },
  loginBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  otpRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  countdown: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  socialRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  socialButton: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  preferenceActions: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  skipButton: {
    minHeight: 52,
    minWidth: 96,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  sliderRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
  },
  sliderStep: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  helper: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
  },
});
