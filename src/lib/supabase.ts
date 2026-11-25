import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ==========================================
// SUPABASE DATABASE TYPES & SCHEMAS
// ==========================================

export interface Station {
  id: string;
  code: string;
  name: string;
  city: string;
}

export interface Schedule {
  id: string;
  train_name: string;
  train_class: string;
  origin_code: string;
  destination_code: string;
  departure_time: string;
  arrival_time: string;
  price: number;
}

export interface Booking {
  id: string;
  user_id: string;
  schedule_id?: string | null;
  passenger_name: string;
  seat_number: string;
  travel_date: string;
  total_price: number;
  status: "paid" | "confirmed" | "cancelled" | "pending";
  created_at?: string;
  // Relational join dengan tabel schedules
  schedules?: Schedule | null;
}

// Storage Adapter: expo-secure-store untuk native mobile, localStorage untuk web
const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        return Promise.resolve(window.localStorage.getItem(key));
      }
      return Promise.resolve(null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] EXPO_PUBLIC_SUPABASE_URL atau EXPO_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan pada .env."
  );
}

// Singleton Client Instance: Mencegah duplikasi GoTrueClient
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
