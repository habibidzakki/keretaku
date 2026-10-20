import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignSystem } from "@/constants/theme";

const { colors } = DesignSystem;

interface SeatPosition {
  wagonId: string;
  seatNumber: string;
}

export default function PilihKursiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const namaKereta = (params.nama as string) || "Kereta Api";
  const kelasKereta = (params.kelas as string) || "Eksekutif";
  const jumlahPenumpang = Math.max(1, Number(params.jumlah) || 1);
  const ruteAsal = (params.asal as string) || "Asal";
  const ruteTujuan = (params.tujuan as string) || "Tujuan";
  const tanggal = (params.tanggal as string) || "Tanggal Keberangkatan";

  // Konfigurasi Layout Gerbong berdasarkan Kelas
  const isEkonomi = kelasKereta.toLowerCase().includes("ekonomi");
  const isBisnis = kelasKereta.toLowerCase().includes("bisnis");

  // Definisi Gerbong
  const wagons = useMemo(() => {
    if (isEkonomi) {
      return [
        { id: "EKO-1", label: "Ekonomi 1", available: 18 },
        { id: "EKO-2", label: "Ekonomi 2", available: 24 },
        { id: "EKO-3", label: "Ekonomi 3", available: 12 },
        { id: "EKO-4", label: "Ekonomi 4", available: 30 },
      ];
    }
    if (isBisnis) {
      return [
        { id: "BIS-1", label: "Bisnis 1", available: 15 },
        { id: "BIS-2", label: "Bisnis 2", available: 8 },
        { id: "BIS-3", label: "Bisnis 3", available: 20 },
      ];
    }
    // Eksekutif default
    return [
      { id: "EKS-1", label: "Eksekutif 1", available: 14 },
      { id: "EKS-2", label: "Eksekutif 2", available: 8 },
      { id: "EKS-3", label: "Eksekutif 3", available: 21 },
      { id: "EKS-4", label: "Eksekutif 4", available: 10 },
    ];
  }, [isEkonomi, isBisnis]);

  const [activeWagon, setActiveWagon] = useState(
    (params.gerbong as string) || wagons[0].id
  );

  // Baris dan Kolom Kursi
  // Ekonomi: 12 baris, konfigurasi 3-2 (A, B, C [LORONG] D, E)
  // Eksekutif/Bisnis: 10 baris, konfigurasi 2-2 (A, B [LORONG] C, D)
  const totalRows = isEkonomi ? 12 : 10;
  const leftCols = isEkonomi ? ["A", "B", "C"] : ["A", "B"];
  const rightCols = isEkonomi ? ["D", "E"] : ["C", "D"];

  // Simulasi Kursi yang sudah terisi (Occupied)
  const occupiedSeatsByWagon: Record<string, string[]> = useMemo(() => {
    return {
      "EKS-1": ["1A", "1B", "2C", "3D", "4A", "5B", "6C", "6D", "7A", "9C", "10D"],
      "EKS-2": ["1C", "2A", "2B", "3A", "4C", "4D", "5A", "7B", "8C", "9A", "9B"],
      "EKS-3": ["1A", "2D", "3B", "5C", "6A", "8D", "9C"],
      "EKS-4": ["1B", "1D", "2A", "3C", "4B", "5A", "6D", "7C", "8B", "10A"],
      "BIS-1": ["1A", "2B", "3C", "4D", "5A", "6B", "7C", "8D"],
      "BIS-2": ["1B", "2C", "3A", "4B", "5D", "6A", "7B"],
      "BIS-3": ["1C", "2A", "3D", "4C", "5B", "6D"],
      "EKO-1": ["1A", "1B", "1C", "2D", "2E", "3A", "4C", "5D", "6B", "7A", "8E", "9C", "10D", "11A"],
      "EKO-2": ["1D", "1E", "2A", "2B", "3C", "4D", "5E", "6A", "7C", "8B", "9D", "10E"],
      "EKO-3": ["1A", "1C", "2D", "3B", "4A", "5C", "6E", "7D", "8A", "9B", "10C", "11E"],
      "EKO-4": ["1B", "2E", "3A", "4D", "5B", "6C", "7E", "8D"],
    };
  }, []);

  // Parse initial seats dari params jika ada
  const initialSeats = useMemo<SeatPosition[]>(() => {
    if (params.kursi && typeof params.kursi === "string") {
      const seatList = params.kursi.split(",").map((s) => s.trim());
      return seatList.map((sn) => ({
        wagonId: activeWagon,
        seatNumber: sn,
      }));
    }
    // Default: belum memilih atau beri rekomendasi default
    const wagonOccupied = occupiedSeatsByWagon[activeWagon] || [];
    const defaults: SeatPosition[] = [];
    for (let r = 2; r <= totalRows; r++) {
      for (const col of [...leftCols, ...rightCols]) {
        const testCode = `${r}${col}`;
        if (!wagonOccupied.includes(testCode)) {
          defaults.push({ wagonId: activeWagon, seatNumber: testCode });
          if (defaults.length === jumlahPenumpang) break;
        }
      }
      if (defaults.length === jumlahPenumpang) break;
    }
    return defaults;
  }, []);

  const [selectedSeats, setSelectedSeats] = useState<SeatPosition[]>(initialSeats);

  // Helper cek apakah kursi terisi
  const isOccupied = (wagonId: string, seatNumber: string) => {
    return (occupiedSeatsByWagon[wagonId] || []).includes(seatNumber);
  };

  // Helper cek apakah kursi sedang dipilih pengguna
  const isSelected = (wagonId: string, seatNumber: string) => {
    return selectedSeats.some(
      (s) => s.wagonId === wagonId && s.seatNumber === seatNumber
    );
  };

  // Handle Klik Kursi
  const handleSeatPress = (seatNumber: string) => {
    if (isOccupied(activeWagon, seatNumber)) {
      Alert.alert(
        "Kursi Tidak Tersedia",
        `Kursi ${seatNumber} di ${activeWagon} sudah terisi oleh penumpang lain. Silakan pilih kursi lain yang tersedia.`
      );
      return;
    }

    const alreadyIndex = selectedSeats.findIndex(
      (s) => s.wagonId === activeWagon && s.seatNumber === seatNumber
    );

    if (alreadyIndex >= 0) {
      // Hapus pilihan kursi
      const updated = [...selectedSeats];
      updated.splice(alreadyIndex, 1);
      setSelectedSeats(updated);
    } else {
      // Tambah pilihan kursi
      if (selectedSeats.length >= jumlahPenumpang) {
        // Jika sudah mencapai batas jumlah penumpang, gantikan pilihan pertama atau alert
        if (jumlahPenumpang === 1) {
          // Ganti langsung untuk 1 penumpang
          setSelectedSeats([{ wagonId: activeWagon, seatNumber }]);
        } else {
          Alert.alert(
            "Maksimum Kursi Tercapai",
            `Anda telah memilih ${jumlahPenumpang} kursi sesuai jumlah penumpang. Hapus salah satu kursi terlebih dahulu untuk memilih kursi baru.`
          );
        }
      } else {
        setSelectedSeats([
          ...selectedSeats,
          { wagonId: activeWagon, seatNumber },
        ]);
      }
    }
  };

  // Simpan Kursi dan kembali ke Detail
  const handleConfirmSeats = () => {
    if (selectedSeats.length < jumlahPenumpang) {
      Alert.alert(
        "Kursi Belum Lengkap",
        `Silakan pilih ${jumlahPenumpang - selectedSeats.length} kursi lagi agar sesuai dengan total ${jumlahPenumpang} penumpang.`
      );
      return;
    }

    // Format kursi
    const seatString = selectedSeats.map((s) => s.seatNumber).join(", ");
    const wagonSummary = selectedSeats[0]?.wagonId || activeWagon;

    router.replace({
      pathname: "/detail",
      params: {
        ...params,
        kursi: seatString,
        gerbong: wagonSummary,
      },
    });
  };

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.container}>
        {/* Info Header Kereta */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTrainName}>{namaKereta}</Text>
              <Text style={styles.headerRoute}>
                {ruteAsal.split("-")[0].trim()} ➔ {ruteTujuan.split("-")[0].trim()} • {kelasKereta}
              </Text>
            </View>
            <View style={styles.passengerQuotaBadge}>
              <Text style={styles.passengerQuotaText}>
                {selectedSeats.length}/{jumlahPenumpang} Kursi
              </Text>
            </View>
          </View>
          <Text style={styles.headerDate}>{tanggal}</Text>
        </View>

        {/* Gerbong Selector Tabs */}
        <View style={styles.wagonSelectorContainer}>
          <Text style={styles.wagonSelectorTitle}>PILIH GERBONG</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.wagonTabsScroll}
          >
            {wagons.map((w) => {
              const isActive = activeWagon === w.id;
              const seatsInWagon = selectedSeats.filter(
                (s) => s.wagonId === w.id
              ).length;

              return (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.wagonTab,
                    isActive && styles.wagonTabActive,
                  ]}
                  onPress={() => setActiveWagon(w.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.wagonTabLabel,
                      isActive && styles.wagonTabLabelActive,
                    ]}
                  >
                    {w.label}
                  </Text>
                  {seatsInWagon > 0 ? (
                    <View style={styles.wagonSelectedBadge}>
                      <Text style={styles.wagonSelectedBadgeText}>
                        {seatsInWagon} Dipilih
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.wagonTabSub,
                        isActive && styles.wagonTabSubActive,
                      ]}
                    >
                      {w.available} sisa
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Legend / Keterangan Warna */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatSelected]} />
            <Text style={styles.legendText}>Dipilih</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatAvailable]} />
            <Text style={styles.legendText}>Tersedia</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatOccupied]} />
            <Text style={styles.legendText}>Terisi</Text>
          </View>
        </View>

        {/* Kabin Gerbong Kursi */}
        <ScrollView
          style={styles.carriageScroll}
          contentContainerStyle={[
            styles.carriageScrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Ujung Depan Gerbong (Arah Laju) */}
          <View style={styles.trainFront}>
            <Text style={styles.trainDirectionText}>
              ▲ Arah Perjalanan Kereta (Lokomotif)
            </Text>
            <View style={styles.carriageDoors}>
              <View style={styles.carriageDoor}>
                <Text style={styles.doorText}>Pintu Masuk</Text>
              </View>
              <View style={styles.carriageDoor}>
                <Text style={styles.doorText}>Toilet 🚻</Text>
              </View>
            </View>
          </View>

          {/* Kolom Header Huruf */}
          <View style={styles.seatColumnsHeader}>
            <View style={styles.colGroup}>
              {leftCols.map((c) => (
                <Text key={c} style={styles.columnLabel}>
                  {c}
                </Text>
              ))}
            </View>
            <View style={styles.aisleHeaderSpacer}>
              <Text style={styles.aisleLabel}>Lorong</Text>
            </View>
            <View style={styles.colGroup}>
              {rightCols.map((c) => (
                <Text key={c} style={styles.columnLabel}>
                  {c}
                </Text>
              ))}
            </View>
          </View>

          {/* Baris-Baris Kursi */}
          <View style={styles.seatsContainer}>
            {Array.from({ length: totalRows }, (_, i) => i + 1).map((rowNum) => (
              <View key={rowNum} style={styles.seatRow}>
                {/* Sisi Kiri */}
                <View style={styles.colGroup}>
                  {leftCols.map((col) => {
                    const seatId = `${rowNum}${col}`;
                    const occupied = isOccupied(activeWagon, seatId);
                    const selected = isSelected(activeWagon, seatId);

                    return (
                      <Pressable
                        key={seatId}
                        style={[
                          styles.seatButton,
                          occupied && styles.seatOccupied,
                          selected && styles.seatSelected,
                        ]}
                        onPress={() => handleSeatPress(seatId)}
                        android_ripple={{ color: colors.lightBlue }}
                      >
                        <Text
                          style={[
                            styles.seatText,
                            occupied && styles.seatTextOccupied,
                            selected && styles.seatTextSelected,
                          ]}
                        >
                          {seatId}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Lorong Tengah dengan Nomor Baris */}
                <View style={styles.aisle}>
                  <Text style={styles.rowNumberText}>{rowNum}</Text>
                </View>

                {/* Sisi Kanan */}
                <View style={styles.colGroup}>
                  {rightCols.map((col) => {
                    const seatId = `${rowNum}${col}`;
                    const occupied = isOccupied(activeWagon, seatId);
                    const selected = isSelected(activeWagon, seatId);

                    return (
                      <Pressable
                        key={seatId}
                        style={[
                          styles.seatButton,
                          occupied && styles.seatOccupied,
                          selected && styles.seatSelected,
                        ]}
                        onPress={() => handleSeatPress(seatId)}
                        android_ripple={{ color: colors.lightBlue }}
                      >
                        <Text
                          style={[
                            styles.seatText,
                            occupied && styles.seatTextOccupied,
                            selected && styles.seatTextSelected,
                          ]}
                        >
                          {seatId}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Ujung Belakang Gerbong */}
          <View style={styles.trainBack}>
            <View style={styles.carriageDoors}>
              <View style={styles.carriageDoor}>
                <Text style={styles.doorText}>Bordess ➔</Text>
              </View>
              <View style={styles.carriageDoor}>
                <Text style={styles.doorText}>Pintu Keluar</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Floating Bar */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.bottomBarInfo}>
            <Text style={styles.bottomBarLabel}>Kursi Terpilih:</Text>
            <Text style={styles.bottomBarValue}>
              {selectedSeats.length > 0
                ? selectedSeats
                    .map((s) => `${s.wagonId.replace("EKS-", "Eks ").replace("EKO-", "Eko ").replace("BIS-", "Bis ")} / ${s.seatNumber}`)
                    .join(", ")
                : "Belum memilih kursi"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              selectedSeats.length !== jumlahPenumpang &&
                styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmSeats}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmButtonText}>
              Simpan Kursi ({selectedSeats.length}/{jumlahPenumpang})
            </Text>
          </TouchableOpacity>
        </View>
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
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.background,
  },
  headerBanner: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTrainName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerRoute: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerDate: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 6,
  },
  passengerQuotaBadge: {
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  passengerQuotaText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  wagonSelectorContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wagonSelectorTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  wagonTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  wagonTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    minWidth: 105,
  },
  wagonTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  wagonTabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  wagonTabLabelActive: {
    color: colors.white,
  },
  wagonTabSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  wagonTabSubActive: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  wagonSelectedBadge: {
    marginTop: 2,
    backgroundColor: colors.activeOrange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  wagonSelectedBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  carriageScroll: {
    flex: 1,
  },
  carriageScrollContent: {
    padding: 16,
  },
  trainFront: {
    backgroundColor: "#E2E8F0",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  trainDirectionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  carriageDoors: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  carriageDoor: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  doorText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  trainBack: {
    backgroundColor: "#E2E8F0",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginTop: 12,
  },
  seatColumnsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#CBD5E1",
  },
  colGroup: {
    flexDirection: "row",
    gap: 8,
  },
  columnLabel: {
    width: 44,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  aisleHeaderSpacer: {
    width: 44,
    alignItems: "center",
  },
  aisleLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  seatsContainer: {
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 10,
  },
  seatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aisle: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  rowNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  seatButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#93C5FD",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  seatAvailable: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#93C5FD",
  },
  seatSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seatOccupied: {
    backgroundColor: "#E2E8F0",
    borderColor: "#CBD5E1",
  },
  seatText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  seatTextSelected: {
    color: colors.white,
  },
  seatTextOccupied: {
    color: "#94A3B8",
  },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  bottomBarValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
});

