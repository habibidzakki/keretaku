import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DesignSystem } from "@/constants/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: DesignSystem.colors.primary,
          },
          headerTintColor: DesignSystem.colors.white,
          headerTitleStyle: {
            fontWeight: "700",
          },
          contentStyle: {
            backgroundColor: DesignSystem.colors.background,
          },
        }}
      >
        {/* Halaman Home: Header custom navbar menyatu dengan hero */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        {/* Halaman Detail */}
        <Stack.Screen
          name="detail"
          options={{
            title: "Detail Pemesanan",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="explore"
          options={{
            title: "Eksplorasi",
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}
