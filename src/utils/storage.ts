import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "../types";

const STORAGE_KEY = "eslay-app-state";

export const loadPersistedState = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<AppState>) : null;
  } catch {
    return null;
  }
};

export const savePersistedState = async (state: Partial<AppState>) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent fallback preserves UX even when local storage is unavailable.
  }
};
