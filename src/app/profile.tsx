import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignSystem } from "@/constants/theme";

const { colors } = DesignSystem;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.responsiveContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>KT</Text>
            </View>
            <Text style={styles.userName}>Pengguna Keretaku</Text>
            <Text style={styles.userEmail}>penumpang@keretaku.id</Text>
            <View style={styles.badgeWrapper}>
              <Text style={styles.badgeText}>Member Gold</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Perjalanan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>2.450</Text>
              <Text style={styles.statLabel}>Poin KAI</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Voucher</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Informasi Data Diri</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Lengkap</Text>
              <Text style={styles.infoValue}>Budi Santoso</Text>
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Telepon</Text>
              <Text style={styles.infoValue}>+62 812-3456-7890</Text>
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Identitas (NIK)</Text>
              <Text style={styles.infoValue}>3578012345670001</Text>
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipe Identitas</Text>
              <Text style={styles.infoValue}>KTP Elektronik</Text>
            </View>
          </View>

          <View style={styles.menuCard}>
            <Text style={styles.sectionTitle}>Akun & Preferensi</Text>
            
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <Text style={styles.menuText}>Riwayat Pemesanan Tiket</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.rowDivider} />

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <Text style={styles.menuText}>Daftar Penumpang Tersimpan</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.rowDivider} />

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <Text style={styles.menuText}>Pusat Bantuan & Kebijakan Privasi</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  responsiveContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileHeaderCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: colors.lightBlue,
    marginBottom: 10,
  },
  badgeWrapper: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E293B",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EBF1F7",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      },
    }),
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EBF1F7",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EBF1F7",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  menuChevron: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  backButton: {
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.divider,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
20240370110180

