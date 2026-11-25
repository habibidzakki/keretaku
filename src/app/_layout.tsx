import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DesignSystem } from "@/constants/theme";

const { colors } = DesignSystem;

function RootNavigationGuard() {
  const { user, isLoading, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const isAuthLoading = isLoading ?? loading ?? false;

  useEffect(() => {
    if (isAuthLoading) return;

    const currentRoute = (segments as string[])[0] || "";
    const isProtectedRoute =
      currentRoute === "pembayaran" || currentRoute === "profile";
    const isAuthRoute = currentRoute === "login";

    // Route Guard:
    // 1. Jika belum login dan mengakses halaman terproteksi, arahkan ke login
    if (!user && isProtectedRoute) {
      router.replace("/login" as any);
    }
    // 2. Jika user sudah login dan berada di halaman login, arahkan ke beranda (/)
    else if (user && isAuthRoute) {
      router.replace("/");
    }
  }, [user, isAuthLoading, segments, router]);

  // Saat loading === true, tampilkan layar loading tanpa melakukan redirect (mencegah flicker)
  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="detail" options={{ headerShown: false }} />
      <Stack.Screen name="pembayaran" options={{ headerShown: false }} />
      <Stack.Screen name="pilih-kursi" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="explore" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigationGuard />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
