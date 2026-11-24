import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { DesignSystem } from "@/constants/theme";

const { colors } = DesignSystem;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Perhatian", "Email dan kata sandi wajib diisi.");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      Alert.alert("Perhatian", "Nama lengkap wajib diisi untuk pendaftaran.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          Alert.alert("Gagal Masuk", error.message || "Email atau kata sandi salah.");
        } else {
          Alert.alert("Berhasil Masuk! 🎉", "Selamat datang kembali di Keretaku.", [
            {
              text: "Lanjutkan",
              onPress: () => router.replace("/"),
            },
          ]);
        }
      } else {
        const { data, error } = await signUp(email, password, fullName);
        if (error) {
          Alert.alert("Gagal Mendaftar", error.message || "Pendaftaran tidak dapat diproses.");
        } else {
          const hasSession = !!data?.session;
          if (hasSession) {
            Alert.alert("Pendaftaran Berhasil! 🎉", "Akun Anda telah aktif dan siap digunakan.", [
              {
                text: "Masuk ke Aplikasi",
                onPress: () => router.replace("/"),
              },
            ]);
          } else {
            Alert.alert(
              "Pendaftaran Terkirim! ✉️",
              "Tautan verifikasi telah dikirim ke email Anda. Silakan verifikasi email lalu masuk.",
              [
                {
                  text: "Mengerti",
                  onPress: () => setMode("signin"),
                },
              ]
            );
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Terjadi Kesalahan", err.message || "Koneksi ke Supabase gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.outerWrapper}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top, 24) + 16,
                paddingBottom: Math.max(insets.bottom, 24) + 24,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/")}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>← Beranda Keretaku</Text>
            </TouchableOpacity>

            {/* Brand Logo & Title */}
            <View style={styles.brandContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🚆</Text>
              </View>
              <Text style={styles.brandTitle}>KERETAKU</Text>
              <Text style={styles.brandSubtitle}>
                Platform Pemesanan Tiket Kereta Api Terpadu
              </Text>
            </View>

            {/* Segmented Tab Switcher */}
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[styles.tabButton, mode === "signin" && styles.tabButtonActive]}
                onPress={() => setMode("signin")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    mode === "signin" && styles.tabButtonTextActive,
                  ]}
                >
                  Masuk
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, mode === "signup" && styles.tabButtonActive]}
                onPress={() => setMode("signup")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    mode === "signup" && styles.tabButtonTextActive,
                  ]}
                >
                  Daftar Akun
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {mode === "signin"
                  ? "Masuk ke Akun Anda"
                  : "Buat Akun Penumpang Baru"}
              </Text>
              <Text style={styles.cardDesc}>
                {mode === "signin"
                  ? "Gunakan email dan kata sandi Anda untuk mengakses e-tiket & riwayat pemesanan."
                  : "Daftar untuk kemudahan memesan tiket, memilih kursi, dan menyimpan e-boarding pass."}
              </Text>

              {mode === "signup" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nama Lengkap (Sesuai KTP/Identitas)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Budi Santoso"
                    placeholderTextColor="#94A3B8"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Alamat Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="nama@email.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kata Sandi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <View style={styles.submittingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Memproses ke Supabase...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === "signin" ? "Masuk Sekarang" : "Daftar Akun Keretaku"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Guest / Bypass Button */}
              <TouchableOpacity
                style={styles.guestButton}
                onPress={() => router.replace("/")}
                activeOpacity={0.7}
              >
                <Text style={styles.guestButtonText}>
                  Lanjut sebagai Tamu (Cari Jadwal Dulu)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Supabase Security Badge */}
            <View style={styles.securityBadge}>
              <Text style={styles.securityBadgeIcon}>🔒</Text>
              <Text style={styles.securityBadgeText}>
                Autentikasi & Penyimpanan Data Dilindungi oleh Supabase Auth & PostgreSQL Row Level Security (RLS).
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  outerWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#EBF1F7",
    borderRadius: 8,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EBF4FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#D0E4FC",
  },
  logoEmoji: {
    fontSize: 34,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  guestButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
  },
  securityBadgeIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  securityBadgeText: {
    flex: 1,
    fontSize: 11,
    color: "#166534",
    lineHeight: 16,
    fontWeight: "500",
  },
});
