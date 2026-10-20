import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignSystem } from "@/constants/theme";

const { colors } = DesignSystem;

// Definisi Interface Stasiun
export interface Stasiun {
  kode: string;
  nama: string;
  kota: string;
}

// Data Pilihan Stasiun Populer Indonesia
const DAFTAR_STASIUN: Stasiun[] = [
  { kode: "PSE", nama: "Pasar Senen", kota: "Jakarta" },
  { kode: "GMR", nama: "Gambir", kota: "Jakarta" },
  { kode: "SGU", nama: "Surabaya Gubeng", kota: "Surabaya" },
  { kode: "SBI", nama: "Surabaya Pasarturi", kota: "Surabaya" },
  { kode: "BD", nama: "Bandung", kota: "Bandung" },
  { kode: "YK", nama: "Yogyakarta", kota: "Yogyakarta" },
  { kode: "LPN", nama: "Lempuyangan", kota: "Yogyakarta" },
  { kode: "SLO", nama: "Solo Balapan", kota: "Surakarta" },
  { kode: "SMT", nama: "Semarang Tawang", kota: "Semarang" },
  { kode: "ML", nama: "Malang", kota: "Malang" },
  { kode: "CN", nama: "Cirebon", kota: "Cirebon" },
];

// Data Kereta Realistis
const DATA_KERETA = [
  {
    id: 1,
    nama: "Argo Bromo Anggrek",
    waktu: "08:20",
    durasi: 9,
    harga: 510000,
    kelas: "Eksekutif",
    sisaKursi: 14,
  },
  {
    id: 2,
    nama: "Jayabaya",
    waktu: "11:45",
    durasi: 11,
    harga: 260000,
    kelas: "Ekonomi",
    sisaKursi: 32,
  },
  {
    id: 3,
    nama: "Gajayana",
    waktu: "18:40",
    durasi: 12,
    harga: 580000,
    kelas: "Eksekutif",
    sisaKursi: 6,
  },
  {
    id: 4,
    nama: "Lodaya",
    waktu: "07:05",
    durasi: 8,
    harga: 320000,
    kelas: "Bisnis",
    sisaKursi: 20,
  },
  {
    id: 5,
    nama: "Matarmaja",
    waktu: "10:30",
    durasi: 14,
    harga: 160000,
    kelas: "Ekonomi",
    sisaKursi: 45,
  },
  {
    id: 6,
    nama: "Bima",
    waktu: "17:10",
    durasi: 10,
    harga: 530000,
    kelas: "Eksekutif",
    sisaKursi: 8,
  },
];

const KELAS_OPTIONS = ["Semua", "Ekonomi", "Bisnis", "Eksekutif"];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Navigation tab state (Beranda, Tiket Saya, Bantuan, Akun)
  const [activeTab, setActiveTab] = useState<"beranda" | "tiket" | "bantuan" | "akun">("beranda");

  // Booking Form States
  const [asal, setAsal] = useState<Stasiun>(DAFTAR_STASIUN[0]); // Default PSE
  const [tujuan, setTujuan] = useState<Stasiun>(DAFTAR_STASIUN[2]); // Default SGU
  const [tanggalPergi, setTanggalPergi] = useState("Rab, 21 Okt 2026");
  const [isPulangPergi, setIsPulangPergi] = useState(false);
  const [tanggalPulang, setTanggalPulang] = useState("Kam, 22 Okt 2026");
  const [jumlahPenumpang, setJumlahPenumpang] = useState(1);
  const [kelasDipilih, setKelasDipilih] = useState("Semua");

  // Search results state
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  // Modals state
  const [stationModalVisible, setStationModalVisible] = useState(false);
  const [pickingFor, setPickingFor] = useState<"asal" | "tujuan">("asal");
  const [stationSearchText, setStationSearchText] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("Semua");
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateModalType, setDateModalType] = useState<"pergi" | "pulang">("pergi");

  // Notification state
  const [hasNotification, setHasNotification] = useState(true);

  // Format currency IDR
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // Hitung waktu tiba
  const hitungWaktuTiba = (waktuBerangkat: string, durasiJam: number) => {
    if (!waktuBerangkat) return "";
    const [jam, menit] = waktuBerangkat.split(":").map(Number);
    const jamTiba = (jam + durasiJam) % 24;
    return `${jamTiba.toString().padStart(2, "0")}:${(menit || 0).toString().padStart(2, "0")}`;
  };

  // Swap Asal & Tujuan
  const handleSwapStations = () => {
    const temp = asal;
    setAsal(tujuan);
    setTujuan(temp);
  };

  // Filter Stasiun di Modal
  const filteredStations = useMemo(() => {
    return DAFTAR_STASIUN.filter((stasiun) => {
      const matchSearch =
        stasiun.nama.toLowerCase().includes(stationSearchText.toLowerCase()) ||
        stasiun.kode.toLowerCase().includes(stationSearchText.toLowerCase()) ||
        stasiun.kota.toLowerCase().includes(stationSearchText.toLowerCase());

      const matchCity =
        selectedCityFilter === "Semua" || stasiun.kota.toLowerCase() === selectedCityFilter.toLowerCase();

      return matchSearch && matchCity;
    });
  }, [stationSearchText, selectedCityFilter]);

  // Open modal stasiun
  const handleOpenStationModal = (type: "asal" | "tujuan") => {
    setPickingFor(type);
    setStationSearchText("");
    setSelectedCityFilter("Semua");
    setStationModalVisible(true);
  };

  // Select station
  const handleSelectStation = (item: Stasiun) => {
    if (pickingFor === "asal") {
      setAsal(item);
    } else {
      setTujuan(item);
    }
    setStationModalVisible(false);
  };

  // Trigger Pencarian Tiket Kereta
  const handleCariTiket = () => {
    if (asal.kode === tujuan.kode) {
      alert("Stasiun asal dan tujuan tidak boleh sama!");
      return;
    }
    setSearching(true);
    setHasSearched(true);
    setTimeout(() => {
      setSearching(false);
    }, 400);
  };

  // Navigasi ke Detail
  const handlePesanTiket = (item: typeof DATA_KERETA[0]) => {
    router.push({
      pathname: "/detail",
      params: {
        nama: item.nama,
        waktu: item.waktu,
        harga: item.harga.toString(),
        kelas: item.kelas,
        asal: `${asal.kode} - ${asal.nama} (${asal.kota})`,
        tujuan: `${tujuan.kode} - ${tujuan.nama} (${tujuan.kota})`,
        jumlah: jumlahPenumpang.toString(),
        durasi: item.durasi.toString(),
        tanggal: tanggalPergi,
      },
    });
  };

  // Filter Kereta sesuai Kelas yang Dipilih
  const displayTrains = useMemo(() => {
    if (kelasDipilih === "Semua") return DATA_KERETA;
    return DATA_KERETA.filter((k) => k.kelas.toLowerCase() === kelasDipilih.toLowerCase());
  }, [kelasDipilih]);

  // Quick date options
  const dateOptions = [
    { label: "Hari Ini", date: "Sel, 20 Okt 2026" },
    { label: "Besok", date: "Rab, 21 Okt 2026" },
    { label: "Lusa", date: "Kam, 22 Okt 2026" },
    { label: "Akhir Pekan", date: "Sab, 24 Okt 2026" },
    { label: "Minggu Depan", date: "Sen, 26 Okt 2026" },
  ];

  return (
    <View style={styles.outerWrapper}>
      {/* Container utama dengan constraint lebar untuk desktop / mobile */}
      <View style={styles.responsiveContainer}>
        {/* ========================================================
            TAHAP 3: NAVBAR
            Logo kiri, lonceng notifikasi kanan.
            Background biru (#087CF0) menyatu dengan hero
           ======================================================== */}
        <View style={[styles.navbar, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
          <View style={styles.navBrand}>
            <View>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandText}>Keretaku</Text>
                <View style={styles.brandDot} />
              </View>
              <Text style={styles.brandSubText}>Aman & Terpercaya</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.75}
            onPress={() => setHasNotification(!hasNotification)}
            accessibilityRole="button"
            accessibilityLabel="Lonceng Notifikasi"
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {hasNotification && <View style={styles.notifBadge} />}
          </TouchableOpacity>
        </View>

        {/* Content body with Bottom Nav spacing */}
        <ScrollView
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "beranda" && (
            <>
              {/* ========================================================
                  TAHAP 3: HERO SECTION
                  Gradasi biru, Judul "Pesan Tiket Kereta" (kuning, shadow tipis),
                  Subjudul "Harga terbaik untuk destinasi ke mana saja 🚆" (putih)
                 ======================================================== */}
              <View style={styles.heroSection}>
                {/* Background decorative layers */}
                <View style={styles.heroOverlayCircle1} />
                <View style={styles.heroOverlayCircle2} />

                <View style={styles.heroContent}>
                  <View style={styles.heroTag}>
                    <Text style={styles.heroTagText}>⚡ PROMO TIKET RESMI KAI</Text>
                  </View>
                  <Text style={styles.heroTitle}>Pesan Tiket Kereta</Text>
                  <Text style={styles.heroSubtitle}>
                    Harga terbaik untuk destinasi ke mana saja 🚆
                  </Text>
                </View>
              </View>

              {/* ========================================================
                  TAHAP 2 & 3: FORM PEMESANAN (PUTIH, ROUNDED CORNERS)
                  - Total penghapusan SpeedCash (e-wallet)
                  - Input stasiun asal (PSE) & tujuan (SGU) dengan tombol swap
                  - Tanggal pergi & toggle pulang-pergi
                  - Counter jumlah penumpang
                  - Radio/dropdown kelas kereta (Ekonomi/Bisnis/Eksekutif)
                  - Tombol utama "Cari Tiket Kereta"
                 ======================================================== */}
              <View style={styles.formCard}>
                {/* Rute Stasiun: Asal & Tujuan + Swap Button */}
                <View style={styles.routeContainer}>
                  {/* Origin Station */}
                  <TouchableOpacity
                    style={[styles.stationTouchBox, styles.stationTouchBoxLeft]}
                    onPress={() => handleOpenStationModal("asal")}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Pilih Stasiun Asal"
                  >
                    <View style={styles.stationHeaderRow}>
                      <View style={[styles.stationIndicator, { backgroundColor: colors.primary }]} />
                      <Text style={styles.stationLabel}>Stasiun Asal</Text>
                    </View>
                    <Text style={styles.stationCode}>{asal.kode}</Text>
                    <Text style={styles.stationName} numberOfLines={1}>
                      {asal.nama}
                    </Text>
                    <Text style={styles.stationCity}>{asal.kota}</Text>
                  </TouchableOpacity>

                  {/* Tombol Swap Tengah */}
                  <View style={styles.swapButtonWrapper}>
                    <TouchableOpacity
                      style={styles.swapButton}
                      onPress={handleSwapStations}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Tukar Stasiun Asal dan Tujuan"
                    >
                      <Text style={styles.swapIconText}>⇄</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Destination Station */}
                  <TouchableOpacity
                    style={[styles.stationTouchBox, styles.stationTouchBoxRight]}
                    onPress={() => handleOpenStationModal("tujuan")}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Pilih Stasiun Tujuan"
                  >
                    <View style={styles.stationHeaderRow}>
                      <View style={[styles.stationIndicator, { backgroundColor: colors.activeOrange }]} />
                      <Text style={styles.stationLabel}>Stasiun Tujuan</Text>
                    </View>
                    <Text style={styles.stationCode}>{tujuan.kode}</Text>
                    <Text style={styles.stationName} numberOfLines={1}>
                      {tujuan.nama}
                    </Text>
                    <Text style={styles.stationCity}>{tujuan.kota}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formDivider} />

                {/* Tanggal Pergi & Toggle Pulang-Pergi */}
                <View style={styles.dateSection}>
                  <View style={styles.dateHeaderRow}>
                    <View style={styles.dateColumnLeft}>
                      <Text style={styles.fieldLabel}>Tanggal Pergi</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => {
                          setDateModalType("pergi");
                          setDateModalVisible(true);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Ubah Tanggal Pergi"
                      >
                        <Text style={styles.calendarIcon}>📅</Text>
                        <Text style={styles.dateValueText}>{tanggalPergi}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Toggle Pulang-Pergi */}
                    <View style={styles.roundTripToggleWrapper}>
                      <Text style={styles.fieldLabel}>Pulang-Pergi?</Text>
                      <View style={styles.switchRow}>
                        <Switch
                          value={isPulangPergi}
                          onValueChange={(val) => setIsPulangPergi(val)}
                          trackColor={{ false: colors.divider, true: colors.lightBlue }}
                          thumbColor={isPulangPergi ? colors.primary : "#FFFFFF"}
                          accessibilityLabel="Toggle Pulang-Pergi"
                        />
                        <Text style={[styles.switchLabel, isPulangPergi && styles.switchLabelActive]}>
                          {isPulangPergi ? "Ya" : "Tidak"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Tanggal Pulang (Muncul jika toggle diaktifkan) */}
                  {isPulangPergi && (
                    <View style={styles.returnDateRow}>
                      <Text style={styles.fieldLabel}>Tanggal Pulang</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => {
                          setDateModalType("pulang");
                          setDateModalVisible(true);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Ubah Tanggal Pulang"
                      >
                        <Text style={styles.calendarIcon}>📅</Text>
                        <Text style={styles.dateValueText}>{tanggalPulang}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.formDivider} />

                {/* Counter Jumlah Penumpang */}
                <View style={styles.passengerSection}>
                  <View>
                    <Text style={styles.fieldLabel}>Jumlah Penumpang</Text>
                    <Text style={styles.passengerSubText}>Usia 3 tahun ke atas</Text>
                  </View>

                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={[
                        styles.counterBtn,
                        jumlahPenumpang <= 1 && styles.counterBtnDisabled,
                      ]}
                      disabled={jumlahPenumpang <= 1}
                      onPress={() => setJumlahPenumpang((prev) => Math.max(1, prev - 1))}
                      accessibilityRole="button"
                      accessibilityLabel="Kurangi Jumlah Penumpang"
                    >
                      <Text
                        style={[
                          styles.counterBtnText,
                          jumlahPenumpang <= 1 && styles.counterBtnTextDisabled,
                        ]}
                      >
                        −
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.counterDisplay}>
                      <Text style={styles.counterNumberText}>{jumlahPenumpang}</Text>
                      <Text style={styles.counterLabelText}>Orang</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.counterBtn,
                        jumlahPenumpang >= 8 && styles.counterBtnDisabled,
                      ]}
                      disabled={jumlahPenumpang >= 8}
                      onPress={() => setJumlahPenumpang((prev) => Math.min(8, prev + 1))}
                      accessibilityRole="button"
                      accessibilityLabel="Tambah Jumlah Penumpang"
                    >
                      <Text
                        style={[
                          styles.counterBtnText,
                          jumlahPenumpang >= 8 && styles.counterBtnTextDisabled,
                        ]}
                      >
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formDivider} />

                {/* Radio / Selector Kelas Kereta */}
                <View style={styles.classSection}>
                  <Text style={styles.fieldLabel}>Kelas Kereta</Text>
                  <View style={styles.classChipsRow}>
                    {KELAS_OPTIONS.map((k) => {
                      const isSelected = kelasDipilih === k;
                      return (
                        <TouchableOpacity
                          key={k}
                          style={[
                            styles.classChip,
                            isSelected && styles.classChipSelected,
                          ]}
                          onPress={() => setKelasDipilih(k)}
                          activeOpacity={0.7}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.classChipText,
                              isSelected && styles.classChipTextSelected,
                            ]}
                          >
                            {k}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Tombol Utama "Cari Tiket Kereta" */}
                <TouchableOpacity
                  style={styles.searchCtaButton}
                  onPress={handleCariTiket}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Cari Tiket Kereta"
                >
                  <Text style={styles.searchCtaIcon}>🔍</Text>
                  <Text style={styles.searchCtaText}>Cari Tiket Kereta</Text>
                </TouchableOpacity>
              </View>

              {/* ========================================================
                  DAFTAR JADWAL KERETA TERSEDIA
                 ======================================================== */}
              <View style={styles.resultsContainer}>
                <View style={styles.resultsHeaderRow}>
                  <View>
                    <Text style={styles.resultsTitle}>Jadwal Kereta Tersedia</Text>
                    <Text style={styles.resultsSubtitle}>
                      {asal.kode} ➔ {tujuan.kode} • {tanggalPergi}
                    </Text>
                  </View>
                  <View style={styles.trainCountBadge}>
                    <Text style={styles.trainCountText}>{displayTrains.length} Kereta</Text>
                  </View>
                </View>

                {searching ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Mencari ketersediaan kursi...</Text>
                  </View>
                ) : displayTrains.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Text style={styles.emptyStateEmoji}>🚆</Text>
                    <Text style={styles.emptyStateTitle}>Tidak Ada Kereta Ditemukan</Text>
                    <Text style={styles.emptyStateText}>
                      Coba ganti filter kelas atau stasiun untuk melihat jadwal lainnya.
                    </Text>
                  </View>
                ) : (
                  displayTrains.map((item) => {
                    const waktuTiba = hitungWaktuTiba(item.waktu, item.durasi);
                    return (
                      <View key={item.id} style={styles.trainCard}>
                        {/* Header Kartu Kereta */}
                        <View style={styles.trainCardHeader}>
                          <View style={styles.trainNameGroup}>
                            <Text style={styles.trainNameText}>{item.nama}</Text>
                            <View style={styles.seatsBadge}>
                              <Text style={styles.seatsBadgeText}>
                                Sisa {item.sisaKursi} kursi
                              </Text>
                            </View>
                          </View>
                          <View
                            style={[
                              styles.classBadge,
                              item.kelas === "Eksekutif"
                                ? styles.classBadgeEksekutif
                                : item.kelas === "Bisnis"
                                ? styles.classBadgeBisnis
                                : styles.classBadgeEkonomi,
                            ]}
                          >
                            <Text
                              style={[
                                styles.classBadgeText,
                                item.kelas === "Eksekutif"
                                  ? styles.classBadgeTextEksekutif
                                  : item.kelas === "Bisnis"
                                  ? styles.classBadgeTextBisnis
                                  : styles.classBadgeTextEkonomi,
                              ]}
                            >
                              {item.kelas}
                            </Text>
                          </View>
                        </View>

                        {/* Jadwal Perjalanan Waktu & Rute */}
                        <View style={styles.journeyRow}>
                          <View style={styles.journeyPoint}>
                            <Text style={styles.journeyTime}>{item.waktu}</Text>
                            <Text style={styles.journeyStation}>{asal.kode}</Text>
                          </View>

                          <View style={styles.journeyLineContainer}>
                            <Text style={styles.durationText}>{item.durasi} jam</Text>
                            <View style={styles.journeyTrack}>
                              <View style={styles.journeyTrackDot} />
                              <View style={styles.journeyTrackLine} />
                              <Text style={styles.journeyTrackTrain}>🚆</Text>
                              <View style={styles.journeyTrackLine} />
                              <View style={styles.journeyTrackDot} />
                            </View>
                            <Text style={styles.directText}>Langsung</Text>
                          </View>

                          <View style={[styles.journeyPoint, { alignItems: "flex-end" }]}>
                            <Text style={styles.journeyTime}>{waktuTiba}</Text>
                            <Text style={styles.journeyStation}>{tujuan.kode}</Text>
                          </View>
                        </View>

                        <View style={styles.cardDivider} />

                        {/* Footer Kartu Kereta: Harga & Pesan */}
                        <View style={styles.trainCardFooter}>
                          <View>
                            <Text style={styles.pricePerPersonLabel}>Harga per orang</Text>
                            <Text style={styles.trainPriceText}>
                              {formatRupiah(item.harga)}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.selectTrainBtn}
                            onPress={() => handlePesanTiket(item)}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel={`Pesan tiket ${item.nama}`}
                          >
                            <Text style={styles.selectTrainBtnText}>Pesan Tiket</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}

          {/* ========================================================
              TAB TIKET SAYA
             ======================================================== */}
          {activeTab === "tiket" && (
            <View style={styles.tabContentContainer}>
              <View style={styles.tabContentHeader}>
                <Text style={styles.tabContentTitle}>Tiket Saya</Text>
                <Text style={styles.tabContentSub}>Daftar perjalanan & e-ticket Anda</Text>
              </View>
              <View style={styles.ticketEmptyCard}>
                <Text style={styles.ticketEmptyIcon}>🎟️</Text>
                <Text style={styles.ticketEmptyTitle}>Belum Ada Tiket Aktif</Text>
                <Text style={styles.ticketEmptyText}>
                  Perjalanan yang Anda pesan akan langsung tampil di sini dengan QR Code boarding pass.
                </Text>
                <TouchableOpacity
                  style={styles.tabActionButton}
                  onPress={() => setActiveTab("beranda")}
                >
                  <Text style={styles.tabActionButtonText}>Cari Tiket Sekarang</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ========================================================
              TAB BANTUAN
             ======================================================== */}
          {activeTab === "bantuan" && (
            <View style={styles.tabContentContainer}>
              <View style={styles.tabContentHeader}>
                <Text style={styles.tabContentTitle}>Pusat Bantuan</Text>
                <Text style={styles.tabContentSub}>Layanan 24/7 Keretaku Customer Care</Text>
              </View>

              <View style={styles.helpCardsList}>
                <View style={styles.helpCard}>
                  <Text style={styles.helpCardIcon}>📞</Text>
                  <View style={styles.helpCardContent}>
                    <Text style={styles.helpCardTitle}>Contact Center 121</Text>
                    <Text style={styles.helpCardDesc}>Bebas pulsa untuk keluhan dan info jadwal</Text>
                  </View>
                </View>
                <View style={styles.helpCard}>
                  <Text style={styles.helpCardIcon}>💬</Text>
                  <View style={styles.helpCardContent}>
                    <Text style={styles.helpCardTitle}>Live Chat WhatsApp</Text>
                    <Text style={styles.helpCardDesc}>Respon cepat admin 24 jam</Text>
                  </View>
                </View>
                <View style={styles.helpCard}>
                  <Text style={styles.helpCardIcon}>❓</Text>
                  <View style={styles.helpCardContent}>
                    <Text style={styles.helpCardTitle}>Panduan Reschedule & Refund</Text>
                    <Text style={styles.helpCardDesc}>Tata cara pembatalan dan ubah jadwal</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ========================================================
              TAB AKUN
             ======================================================== */}
          {activeTab === "akun" && (
            <View style={styles.tabContentContainer}>
              <View style={styles.tabContentHeader}>
                <Text style={styles.tabContentTitle}>Profil Akun</Text>
                <Text style={styles.tabContentSub}>Kelola data penumpang & keamanan</Text>
              </View>

              <View style={styles.profileCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>KT</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>Pengguna Keretaku</Text>
                  <Text style={styles.profileEmail}>penumpang@keretaku.id</Text>
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>Member Terverifikasi</Text>
                  </View>
                </View>
              </View>

              <View style={styles.accountMenuWrapper}>
                {["Daftar Penumpang Tersimpan", "Riwayat Transaksi", "Pengaturan Bahasa", "Tentang Aplikasi Keretaku"].map(
                  (menu, i) => (
                    <TouchableOpacity key={i} style={styles.accountMenuItem}>
                      <Text style={styles.accountMenuText}>{menu}</Text>
                      <Text style={styles.accountMenuChevron}>›</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* ========================================================
            TAHAP 3: BOTTOM NAVIGATION
            - Beranda (Active: Oranye #FF7900)
            - Tiket Saya, Bantuan, Akun (Inactive: Abu-abu #888888)
            - Area sentuh yang luas (WCAG minimum 48x48dp target)
           ======================================================== */}
        <View
          style={[
            styles.bottomNavContainer,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          {/* Tab 1: Beranda */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab("beranda")}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "beranda" }}
            accessibilityLabel="Tab Beranda"
          >
            <View style={styles.tabIconWrapper}>
              <Text
                style={[
                  styles.tabIconText,
                  activeTab === "beranda" && styles.tabIconTextActive,
                ]}
              >
                🏠
              </Text>
              {activeTab === "beranda" && <View style={styles.activeTabIndicatorDot} />}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                activeTab === "beranda" && styles.bottomNavLabelActive,
              ]}
            >
              Beranda
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Tiket Saya */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab("tiket")}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "tiket" }}
            accessibilityLabel="Tab Tiket Saya"
          >
            <View style={styles.tabIconWrapper}>
              <Text
                style={[
                  styles.tabIconText,
                  activeTab === "tiket" && styles.tabIconTextActive,
                ]}
              >
                🎫
              </Text>
              {activeTab === "tiket" && <View style={styles.activeTabIndicatorDot} />}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                activeTab === "tiket" && styles.bottomNavLabelActive,
              ]}
            >
              Tiket Saya
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Bantuan */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab("bantuan")}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "bantuan" }}
            accessibilityLabel="Tab Bantuan"
          >
            <View style={styles.tabIconWrapper}>
              <Text
                style={[
                  styles.tabIconText,
                  activeTab === "bantuan" && styles.tabIconTextActive,
                ]}
              >
                💬
              </Text>
              {activeTab === "bantuan" && <View style={styles.activeTabIndicatorDot} />}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                activeTab === "bantuan" && styles.bottomNavLabelActive,
              ]}
            >
              Bantuan
            </Text>
          </TouchableOpacity>

          {/* Tab 4: Akun */}
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab("akun")}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "akun" }}
            accessibilityLabel="Tab Akun"
          >
            <View style={styles.tabIconWrapper}>
              <Text
                style={[
                  styles.tabIconText,
                  activeTab === "akun" && styles.tabIconTextActive,
                ]}
              >
                👤
              </Text>
              {activeTab === "akun" && <View style={styles.activeTabIndicatorDot} />}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                activeTab === "akun" && styles.bottomNavLabelActive,
              ]}
            >
              Akun
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================
            MODAL PEMILIHAN STASIUN
           ======================================================== */}
        <Modal
          visible={stationModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setStationModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitleText}>
                    Pilih Stasiun {pickingFor === "asal" ? "Asal" : "Tujuan"}
                  </Text>
                  <Text style={styles.modalSubtitleText}>
                    Cari berdasarkan nama stasiun, kota, atau kode
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseCircle}
                  onPress={() => setStationModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Tutup Modal Stasiun"
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Input Pencarian Stasiun */}
              <View style={styles.modalSearchBox}>
                <Text style={styles.modalSearchIcon}>🔍</Text>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Contoh: Pasar Senen, SGU, Bandung..."
                  placeholderTextColor={colors.textSecondary}
                  value={stationSearchText}
                  onChangeText={setStationSearchText}
                  autoFocus={true}
                  clearButtonMode="while-editing"
                />
              </View>

              {/* Filter Kota Cepat */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.cityFilterScroll}
                contentContainerStyle={styles.cityFilterContent}
              >
                {["Semua", "Jakarta", "Surabaya", "Bandung", "Yogyakarta", "Malang"].map(
                  (city) => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.cityFilterChip,
                        selectedCityFilter === city && styles.cityFilterChipActive,
                      ]}
                      onPress={() => setSelectedCityFilter(city)}
                    >
                      <Text
                        style={[
                          styles.cityFilterChipText,
                          selectedCityFilter === city && styles.cityFilterChipTextActive,
                        ]}
                      >
                        {city}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              {/* List Stasiun */}
              <ScrollView style={styles.stationListScroll}>
                {filteredStations.map((stasiun) => {
                  const isCurrent =
                    (pickingFor === "asal" && asal.kode === stasiun.kode) ||
                    (pickingFor === "tujuan" && tujuan.kode === stasiun.kode);
                  return (
                    <TouchableOpacity
                      key={stasiun.kode}
                      style={[
                        styles.stationListItem,
                        isCurrent && styles.stationListItemCurrent,
                      ]}
                      onPress={() => handleSelectStation(stasiun)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.stationListItemLeft}>
                        <View style={styles.stationCodeBadge}>
                          <Text style={styles.stationCodeBadgeText}>{stasiun.kode}</Text>
                        </View>
                        <View style={styles.stationNameInfo}>
                          <Text style={styles.stationItemName}>{stasiun.nama}</Text>
                          <Text style={styles.stationItemCity}>{stasiun.kota}</Text>
                        </View>
                      </View>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Terpilih</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ========================================================
            MODAL PEMILIHAN TANGGAL CEPAT
           ======================================================== */}
        <Modal
          visible={dateModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDateModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.dateModalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitleText}>
                  Pilih Tanggal {dateModalType === "pergi" ? "Pergi" : "Pulang"}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseCircle}
                  onPress={() => setDateModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateOptionsList}>
                {dateOptions.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.dateOptionItem}
                    onPress={() => {
                      if (dateModalType === "pergi") {
                        setTanggalPergi(opt.date);
                      } else {
                        setTanggalPulang(opt.date);
                      }
                      setDateModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={styles.dateOptionLabel}>{opt.label}</Text>
                      <Text style={styles.dateOptionValue}>{opt.date}</Text>
                    </View>
                    <Text style={styles.dateOptionArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

// ========================================================
// STYLESHEET (DESIGN SYSTEM & ACCESSIBILITY)
// ========================================================
const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center", // Untuk centering tampilan di desktop/web
  },
  responsiveContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 520, // Mobile-first vertical layout rapi di desktop tanpa stretch
    backgroundColor: colors.background,
    position: "relative",
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 95, // Jarak agar tidak terpotong bottom navigation
  },

  // --------------------------------------------------------
  // NAVBAR
  // --------------------------------------------------------
  navbar: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  navBrand: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoIcon: {
    fontSize: 20,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.5,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.yellow,
    marginLeft: 4,
    marginTop: 2,
  },
  brandSubText: {
    fontSize: 11,
    color: colors.lightBlue,
    fontWeight: "500",
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  bellIcon: {
    fontSize: 19,
  },
  notifBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.activeOrange,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  // --------------------------------------------------------
  // HERO SECTION
  // --------------------------------------------------------
  heroSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 46, // Space ekstra untuk overlap form pemesanan
    position: "relative",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroOverlayCircle1: {
    position: "absolute",
    top: -50,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondaryBlue,
    opacity: 0.35,
  },
  heroOverlayCircle2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroContent: {
    zIndex: 2,
  },
  heroTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 217, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 217, 0, 0.4)",
  },
  heroTagText: {
    color: colors.yellow,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: colors.yellow,
    textShadowColor: "rgba(0, 0, 0, 0.22)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "500",
    opacity: 0.95,
  },

  // --------------------------------------------------------
  // FORM PEMESANAN (PUTIH, MELENGKUNG DI TENGAH)
  // --------------------------------------------------------
  formCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: -26, // Overlap ke hero section secara seimbang tanpa e-wallet
    borderRadius: 24,
    padding: 18,
    // Box Shadow halus & elevasi
    ...Platform.select({
      ios: {
        shadowColor: "#087CF0",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 8px 24px rgba(8, 124, 240, 0.12)",
      },
    }),
    borderWidth: 1,
    borderColor: "#EBF1F7",
    zIndex: 5,
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  stationTouchBox: {
    flex: 1,
    backgroundColor: "#F8FAFD",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EEF5",
    paddingVertical: 12,
  },
  stationTouchBoxLeft: {
    paddingLeft: 14,
    paddingRight: 24,
    marginRight: 6,
  },
  stationTouchBoxRight: {
    paddingLeft: 28,
    paddingRight: 14,
    marginLeft: 6,
  },
  stationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stationIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  stationLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  stationCode: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  stationName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 1,
  },
  stationCity: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  swapButtonWrapper: {
    position: "absolute",
    left: "50%",
    marginLeft: -17,
    zIndex: 10,
  },
  swapButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DCEEFF",
    ...Platform.select({
      ios: {
        shadowColor: "#087CF0",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 2px 8px rgba(8, 124, 240, 0.15)",
      },
    }),
  },
  swapIconText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  formDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 14,
  },

  // Date Section
  dateSection: {},
  dateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateColumnLeft: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFD",
    borderWidth: 1,
    borderColor: "#E8EEF5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  calendarIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  dateValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  roundTripToggleWrapper: {
    alignItems: "flex-end",
    marginLeft: 14,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginLeft: 6,
  },
  switchLabelActive: {
    color: colors.primary,
  },
  returnDateRow: {
    marginTop: 12,
  },

  // Passenger Section
  passengerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  passengerSubText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFD",
    borderWidth: 1,
    borderColor: "#E8EEF5",
    borderRadius: 12,
    padding: 3,
  },
  counterBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.divider,
  },
  counterBtnDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  counterBtnTextDisabled: {
    color: colors.textSecondary,
  },
  counterDisplay: {
    alignItems: "center",
    paddingHorizontal: 14,
  },
  counterNumberText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  counterLabelText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // Class Section
  classSection: {},
  classChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  classChip: {
    flex: 1,
    minWidth: 65,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#F8FAFD",
    borderWidth: 1,
    borderColor: "#E8EEF5",
    alignItems: "center",
    justifyContent: "center",
  },
  classChipSelected: {
    backgroundColor: colors.lightBlue,
    borderColor: colors.primary,
  },
  classChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  classChipTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },

  // Main Search CTA Button
  searchCtaButton: {
    backgroundColor: colors.activeOrange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 18,
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
  searchCtaIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchCtaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // --------------------------------------------------------
  // RESULTS SECTION
  // --------------------------------------------------------
  resultsContainer: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  resultsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  resultsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trainCountBadge: {
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trainCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  loadingContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBF1F7",
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    fontWeight: "500",
  },
  emptyStateBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBF1F7",
  },
  emptyStateEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Train Card
  trainCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
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
  trainCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  trainNameGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  trainNameText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginRight: 8,
  },
  seatsBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seatsBadgeText: {
    fontSize: 10,
    color: "#D97706",
    fontWeight: "700",
  },
  classBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  classBadgeEksekutif: {
    backgroundColor: "#EFF6FF",
  },
  classBadgeBisnis: {
    backgroundColor: "#FDF2F8",
  },
  classBadgeEkonomi: {
    backgroundColor: "#F0FDF4",
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  classBadgeTextEksekutif: {
    color: colors.primary,
  },
  classBadgeTextBisnis: {
    color: "#DB2777",
  },
  classBadgeTextEkonomi: {
    color: "#16A34A",
  },

  // Journey Row
  journeyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  journeyPoint: {
    width: 60,
  },
  journeyTime: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  journeyStation: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },
  journeyLineContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  journeyTrack: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  journeyTrackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  journeyTrackLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#CBD5E1",
  },
  journeyTrackTrain: {
    fontSize: 12,
    marginHorizontal: 3,
  },
  directText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "600",
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  trainCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pricePerPersonLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  trainPriceText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.activeOrange,
    marginTop: 1,
  },
  selectTrainBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  selectTrainBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  // --------------------------------------------------------
  // BOTTOM NAVIGATION
  // Area sentuh luas (min 48dp), Beranda active orange
  // --------------------------------------------------------
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: "0 -3px 12px rgba(0,0,0,0.06)",
      },
    }),
  },
  bottomNavItem: {
    flex: 1,
    minHeight: 52, // WCAG Touch Target Compliance (> 48x48dp)
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabIconText: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconTextActive: {
    opacity: 1,
  },
  activeTabIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.activeOrange,
    marginTop: 2,
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: colors.activeOrange,
    fontWeight: "700",
  },

  // --------------------------------------------------------
  // TAB CONTENT: TIKET SAYA, BANTUAN, AKUN
  // --------------------------------------------------------
  tabContentContainer: {
    padding: 20,
  },
  tabContentHeader: {
    marginBottom: 20,
  },
  tabContentTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  tabContentSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  ticketEmptyCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBF1F7",
  },
  ticketEmptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  ticketEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  ticketEmptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  tabActionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabActionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  helpCardsList: {
    gap: 12,
  },
  helpCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBF1F7",
  },
  helpCardIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  helpCardContent: {
    flex: 1,
  },
  helpCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  helpCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBF1F7",
    marginBottom: 18,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  memberBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  accountMenuWrapper: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EBF1F7",
    overflow: "hidden",
  },
  accountMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  accountMenuText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  accountMenuChevron: {
    fontSize: 18,
    color: colors.textSecondary,
  },

  // --------------------------------------------------------
  // MODALS
  // --------------------------------------------------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  modalSubtitleText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFD",
    borderWidth: 1,
    borderColor: "#E8EEF5",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  modalSearchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: colors.textPrimary,
  },
  cityFilterScroll: {
    marginBottom: 12,
    maxHeight: 36,
  },
  cityFilterContent: {
    gap: 8,
  },
  cityFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  cityFilterChipActive: {
    backgroundColor: colors.primary,
  },
  cityFilterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  cityFilterChipTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  stationListScroll: {
    maxHeight: 350,
  },
  stationListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    borderRadius: 8,
  },
  stationListItemCurrent: {
    backgroundColor: colors.lightBlue,
  },
  stationListItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stationCodeBadge: {
    width: 44,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stationCodeBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },
  stationNameInfo: {
    flex: 1,
  },
  stationItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  stationItemCity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  currentBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },

  // Date Modal
  dateModalCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
  },
  dateOptionsList: {
    marginTop: 8,
  },
  dateOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dateOptionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dateOptionValue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateOptionArrow: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});
