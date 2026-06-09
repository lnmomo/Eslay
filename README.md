# Eslay Travel Mobile App

Eslay is a frontend-focused mobile travel planner implemented from the supplied SRS. The app is structured around four primary modules:

- `F1` Onboarding & authentication with OTP and mock Apple/Google login
- `F2` Discovery feed with adaptive recommendation weights
- `F3` Itinerary timeline with long-press rearrange mode and local-first persistence
- `F4` Interactive route map with sequential markers, route ETA, and list fallback

## Tech stack

- Expo
- React Native
- TypeScript
- AsyncStorage for local persistence

## Included product capabilities

- Preference-based onboarding
- Mock OTP countdown and auto-login on sixth digit entry
- Personalized destination feed using tag-weight scoring
- Saved destinations and recommendation feedback loop
- Itinerary timeline grouped by day
- Route visualization and contextual location details
- Offline/read-only mode switch
- Light/dark theme support
- Chinese/English language toggle
- Biometric quick-login preference toggle

## Run locally

1. Install dependencies
   - `npm.cmd install`
2. Start Expo
   - `npm.cmd run start`
3. Open on device or emulator through Expo

## Notes

- The project uses mock destination and itinerary data to match the SRS requirement for a frontend-first build.
- If you want a production-grade map SDK, the next step is replacing the visual mock map in `src/screens/MapScreen.tsx` with Google Maps or Mapbox.

## Android Beta Version
- https://expo.dev/artifacts/eas/sYPJw3SU5kQYkbLRaYD3Tq.apk
