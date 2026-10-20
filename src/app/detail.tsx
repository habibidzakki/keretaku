import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function DetailTiket() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const hargaPerTiket = Number(params.harga) || 0;
  const jumlahTiket = Number(params.jumlah) || 1;
  const totalHarga = hargaPerTiket * jumlahTiket;

  // Kursi & Gerbong
  const defaultWagonId = params.kelas?.toString().toLowerCase().includes("ekonomi")
    ? "EKO-1"
    : params.kelas?.toString().toLowerCase().includes("bisnis")
    ? "BIS-1"
    : "EKS-1";
  const gerbongDipilih = (params.gerbong as string) || defaultWagonId;
  const labelGerbong = gerbongDipilih
    .replace("EKS-", "Eksekutif ")
    .replace("EKO-", "Ekonomi ")
    .replace("BIS-", "Bisnis ");

  const defaultSeats = Array.from({ length: jumlahTiket }, (_, i) => `3${String.fromCharCode(65 + i)}`).join(", ");
  const kursiDipilih = (params.kursi as string) || defaultSeats;
  const daftarKursi = kursiDipilih.split(",").map((s) => s.trim());
  const isKursiManual = Boolean(params.kursi);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // Fungsi menghitung waktu tiba berdasarkan durasi perjalanan
  const hitungWaktuTiba = (waktuBerangkat?: string, durasiJam?: number) => {
    if (!waktuBerangkat) return "";
    const [jam, menit] = waktuBerangkat.split(":");
    let jamTiba = parseInt(jam || "0") + Number(durasiJam || 0);

    if (jamTiba >= 24) {
      jamTiba = jamTiba % 24;
    }

    const jamFormat = jamTiba.toString().padStart(2, "0");
    return `${jamFormat}:${menit || "00"}`;
  };

  const waktuTiba = hitungWaktuTiba(
    params.waktu as string,
    Number(params.durasi),
  );

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
          {/* Header Banner */}
          <View style={styles.topCard}>
            <View style={styles.ticketBadge}>
              <Text style={styles.ticketBadgeText}>E-TIKET RESMI</Text>
            </View>
            <Text style={styles.headerTitle}>Konfirmasi Pemesanan</Text>
            <Text style={styles.headerSubtitle}>
              Periksa rincian perjalanan sebelum melanjutkan pembayaran
            </Text>
          </View>

          {/* Kartu Detail Rute & Tiket */}
          <View style={styles.card}>
            {/* Nama Kereta & Kelas */}
            <View style={styles.trainHeaderRow}>
              <View>
                <Text style={styles.trainName}>{params.nama || "Kereta Api"}</Text>
                <Text style={styles.trainClass}>{params.kelas || "Eksekutif"}</Text>
              </View>
              <View style={styles.trainLogoCircle}>
                <Text style={styles.trainEmoji}>🚆</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Rute Berangkat - Tiba */}
            <View style={styles.routeTimeline}>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTime}>{params.waktu || "08:00"} WIB</Text>
                  <Text style={styles.timelineStation}>{params.asal || "Stasiun Asal"}</Text>
                  <Text style={styles.timelineDate}>{params.tanggal || "Keberangkatan"}</Text>
                </View>
              </View>

              <View style={styles.timelineConnector} />

              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: colors.activeOrange }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTime}>{waktuTiba} WIB</Text>
                  <Text style={styles.timelineStation}>{params.tujuan || "Stasiun Tujuan"}</Text>
                  <Text style={styles.timelineDate}>Durasi: {params.durasi || "4"} Jam</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Detail Penumpang & Kursi */}
            <View style={styles.passengerSummary}>
              <View style={styles.passengerHeaderRow}>
                <Text style={styles.sectionHeading}>Data Penumpang & Kursi</Text>
                <TouchableOpacity
                  style={styles.changeSeatButton}
                  onPress={() => {
                    router.push({
                      pathname: "/pilih-kursi",
                      params: {
                        ...params,
                        kursi: kursiDipilih,
                        gerbong: gerbongDipilih,
                      },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeSeatButtonText}>💺 Ubah Kursi</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passengerRow}>
                <Text style={styles.passengerLabel}>Jumlah Penumpang:</Text>
                <Text style={styles.passengerValue}>{jumlahTiket} Orang (Dewasa)</Text>
              </View>

              <View style={styles.passengerRow}>
                <Text style={styles.passengerLabel}>Gerbong Kereta:</Text>
                <Text style={styles.passengerValue}>{labelGerbong}</Text>
              </View>

              {/* Tampilan Tag Nomor Kursi Tiap Penumpang */}
              <View style={styles.seatBadgeList}>
                {daftarKursi.map((kursiItem, idx) => (
                  <View key={idx} style={styles.seatBadge}>
                    <Text style={styles.seatBadgeLabel}>P{idx + 1}:</Text>
                    <Text style={styles.seatBadgeValue}>{kursiItem}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.seatNoteText}>
                {isKursiManual
                  ? "✓ Kursi telah dipilih secara manual oleh Anda"
                  : "* Kursi dipilih otomatis oleh sistem. Klik 'Ubah Kursi' untuk memilih denah."}
              </Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Rincian Biaya */}
            <View style={styles.priceSummary}>
              <Text style={styles.sectionHeading}>Rincian Pembayaran</Text>
              <View style={styles.row}>
                <Text style={styles.feeLabel}>Tarif Dewasa (x{jumlahTiket})</Text>
                <Text style={styles.feeValue}>{formatRupiah(hargaPerTiket * jumlahTiket)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.feeLabel}>Biaya Layanan</Text>
                <Text style={[styles.feeValue, { color: colors.success }]}>Gratis</Text>
              </View>

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>Total Pembayaran</Text>
                  <Text style={styles.taxIncludeText}>Sudah termasuk PPN & Asuransi</Text>
                </View>
                <Text style={styles.totalPriceText}>{formatRupiah(totalHarga)}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => {
              alert(
                `Pemesanan ${params.nama} (${jumlahTiket} tiket)\n` +
                `Gerbong: ${labelGerbong}\n` +
                `Kursi: ${kursiDipilih}\n` +
                `Total: ${formatRupiah(totalHarga)}\n\n` +
                `Pembayaran berhasil diproses!`
              );
              router.replace("/");
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.payButtonText}>Lanjutkan Pembayaran</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonBack}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonBackText}>← Ubah Pencarian Jadwal</Text>
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
  topCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  ticketBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 217, 0, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.yellow,
    marginBottom: 8,
  },
  ticketBadgeText: {
    color: colors.yellow,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.lightBlue,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EBF1F7",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      },
    }),
  },
  trainHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trainName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  trainClass: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  trainLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  trainEmoji: {
    fontSize: 22,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },
  routeTimeline: {},
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  timelineConnector: {
    width: 2,
    height: 28,
    backgroundColor: "#CBD5E1",
    marginLeft: 4,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  timelineStation: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 1,
  },
  timelineDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  passengerSummary: {},
  passengerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  changeSeatButton: {
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  changeSeatButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  seatBadgeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  seatBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  seatBadgeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  seatBadgeValue: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  seatNoteText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 4,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  passengerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  passengerValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  priceSummary: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  feeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  taxIncludeText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  totalPriceText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.activeOrange,
  },
  payButton: {
    backgroundColor: colors.activeOrange,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.activeOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 12px rgba(255, 121, 0, 0.3)",
      },
    }),
  },
  payButtonText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 16,
  },
  buttonBack: {
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.divider,
  },
  buttonBackText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
});
