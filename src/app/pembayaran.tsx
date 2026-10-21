import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignSystem } from "@/constants/theme";

const { colors } = DesignSystem;

type PaymentCategory = "qris" | "va" | "ewallet" | "retail";

interface VABankOption {
  id: string;
  name: string;
  vaNumber: string;
  badge: string;
}

export default function PembayaranScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const namaKereta = (params.nama as string) || "Kereta Api";
  const kelasKereta = (params.kelas as string) || "Eksekutif";
  const totalHarga = Number(params.totalHarga) || 0;
  const jumlahTiket = Number(params.jumlah) || 1;
  const gerbong = (params.gerbong as string) || "Eksekutif 1";
  const kursi = (params.kursi as string) || "3A";
  const asal = (params.asal as string) || "Asal";
  const tujuan = (params.tujuan as string) || "Tujuan";
  const tanggal = (params.tanggal as string) || "Hari ini";
  const waktu = (params.waktu as string) || "08:00";

  // Kode Pembayaran Unik / Booking Code
  const kodeBooking = useMemo(() => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `KAI-${randomNum}`;
  }, []);

  // Format Mata Uang IDR
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // ==========================================
  // COUNTDOWN TIMER (15 Menit = 900 Detik)
  // ==========================================
  const [timeLeft, setTimeLeft] = useState(900);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ==========================================
  // STATE METODE PEMBAYARAN
  // ==========================================
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory>("qris");
  const [selectedBank, setSelectedBank] = useState("BCA");
  const [selectedEwallet, setSelectedEwallet] = useState("GoPay");
  const [selectedRetail, setSelectedRetail] = useState("Indomaret");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Data Bank Virtual Account
  const bankOptions: VABankOption[] = [
    { id: "BCA", name: "BCA Virtual Account", vaNumber: "8801908234918231", badge: "Otomatis" },
    { id: "Mandiri", name: "Mandiri Virtual Account", vaNumber: "8992108234918231", badge: "Otomatis" },
    { id: "BRI", name: "BRI Virtual Account (BRIVA)", vaNumber: "1284108234918231", badge: "Otomatis" },
    { id: "BNI", name: "BNI Virtual Account", vaNumber: "9882108234918231", badge: "Otomatis" },
  ];

  const currentVa = bankOptions.find((b) => b.id === selectedBank)?.vaNumber || bankOptions[0].vaNumber;

  // Handle Salin Text
  const handleCopy = (text: string, label: string) => {
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // ==========================================
  // SIMULASI PROSES PEMBAYARAN
  // ==========================================
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const handleSimulatePayment = () => {
    if (isExpired) {
      Alert.alert("Kedaluwarsa", "Waktu pembayaran telah habis. Silakan buat pesanan baru.");
      return;
    }

    setIsProcessing(true);

    // Simulasi respons bank / gateway pembayaran selama 1.5 detik
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccessModalVisible(true);
    }, 1500);
  };

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ========================================================
              COUNTDOWN TIMER BANNER
             ======================================================== */}
          <View style={[styles.timerBanner, isExpired && styles.timerBannerExpired]}>
            <View style={styles.timerLeftCol}>
              <Text style={styles.timerTitle}>
                {isExpired ? "Waktu Pembayaran Habis!" : "Selesaikan Pembayaran Dalam"}
              </Text>
              <Text style={styles.timerSubtitle}>
                {isExpired
                  ? "Pemesanan otomatis dibatalkan sistem"
                  : "Agar tiket Anda tidak otomatis dibatalkan"}
              </Text>
            </View>
            <View style={[styles.timerBadge, isExpired && styles.timerBadgeExpired]}>
              <Text style={styles.timerIcon}>{isExpired ? "⚠️" : "⏳"}</Text>
              <Text style={styles.timerValue}>{formatTimer(timeLeft)}</Text>
            </View>
          </View>

          {/* ========================================================
              KARTU RINGKASAN TAGIHAN
             ======================================================== */}
          <View style={styles.billCard}>
            <View style={styles.billRowHeader}>
              <View>
                <Text style={styles.billLabel}>Total Pembayaran</Text>
                <Text style={styles.billAmount}>{formatRupiah(totalHarga)}</Text>
              </View>
              <View style={styles.pnrContainer}>
                <Text style={styles.pnrLabel}>KODE BOOKING</Text>
                <Text style={styles.pnrCode}>{kodeBooking}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Rincian Singkat Tiket */}
            <View style={styles.ticketSummaryBox}>
              <View style={styles.summaryTrainRow}>
                <Text style={styles.summaryTrainName}>{namaKereta}</Text>
                <Text style={styles.summaryTrainClass}>{kelasKereta}</Text>
              </View>
              <Text style={styles.summaryRoute}>
                {asal.split("-")[0].trim()} ➔ {tujuan.split("-")[0].trim()} • {tanggal} ({waktu} WIB)
              </Text>
              <View style={styles.summarySeatRow}>
                <Text style={styles.summarySeatText}>
                  Gerbong: <Text style={styles.highlightText}>{gerbong}</Text> • Kursi:{" "}
                  <Text style={styles.highlightText}>{kursi}</Text> ({jumlahTiket} Penumpang)
                </Text>
              </View>
            </View>
          </View>

          {/* ========================================================
              TAB PILIHAN KATEGORI PEMBAYARAN
             ======================================================== */}
          <Text style={styles.sectionTitle}>PILIH METODE PEMBAYARAN</Text>
          <View style={styles.paymentMethodTabs}>
            <TouchableOpacity
              style={[
                styles.methodTab,
                selectedCategory === "qris" && styles.methodTabActive,
              ]}
              onPress={() => setSelectedCategory("qris")}
              activeOpacity={0.8}
            >
              <Text style={styles.methodTabIcon}>📱</Text>
              <Text
                style={[
                  styles.methodTabTitle,
                  selectedCategory === "qris" && styles.methodTabTitleActive,
                ]}
              >
                QRIS
              </Text>
              <Text style={styles.methodTabSub}>Instan / Bebas Biaya</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodTab,
                selectedCategory === "va" && styles.methodTabActive,
              ]}
              onPress={() => setSelectedCategory("va")}
              activeOpacity={0.8}
            >
              <Text style={styles.methodTabIcon}>🏦</Text>
              <Text
                style={[
                  styles.methodTabTitle,
                  selectedCategory === "va" && styles.methodTabTitleActive,
                ]}
              >
                Virtual Account
              </Text>
              <Text style={styles.methodTabSub}>BCA, Mandiri, BRI, BNI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodTab,
                selectedCategory === "ewallet" && styles.methodTabActive,
              ]}
              onPress={() => setSelectedCategory("ewallet")}
              activeOpacity={0.8}
            >
              <Text style={styles.methodTabIcon}>👛</Text>
              <Text
                style={[
                  styles.methodTabTitle,
                  selectedCategory === "ewallet" && styles.methodTabTitleActive,
                ]}
              >
                E-Wallet
              </Text>
              <Text style={styles.methodTabSub}>GoPay, OVO, Dana</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodTab,
                selectedCategory === "retail" && styles.methodTabActive,
              ]}
              onPress={() => setSelectedCategory("retail")}
              activeOpacity={0.8}
            >
              <Text style={styles.methodTabIcon}>🏪</Text>
              <Text
                style={[
                  styles.methodTabTitle,
                  selectedCategory === "retail" && styles.methodTabTitleActive,
                ]}
              >
                Gerai Retail
              </Text>
              <Text style={styles.methodTabSub}>Indomaret / Alfamart</Text>
            </TouchableOpacity>
          </View>

          {/* ========================================================
              KONTEN METODE 1: QRIS DINAMIS
             ======================================================== */}
          {selectedCategory === "qris" && (
            <View style={styles.methodDetailsCard}>
              <View style={styles.qrisHeaderRow}>
                <View style={styles.qrisLogoBadge}>
                  <Text style={styles.qrisLogoText}>QRIS</Text>
                </View>
                <Text style={styles.gpnText}>GPN • Standar Pembayaran Nasional</Text>
              </View>

              <Text style={styles.qrisMerchantName}>PT KERETAKU INDONESIA (PERSERO)</Text>
              <Text style={styles.qrisNmid}>NMID: ID10202688192301</Text>

              {/* Simulasi Tampilan QR Code */}
              <View style={styles.qrCodeWrapper}>
                <View style={styles.qrCodeBox}>
                  {/* Visual Pattern Matrix QR Code */}
                  <View style={styles.qrPatternGrid}>
                    <View style={styles.qrCornerBlock} />
                    <View style={styles.qrMiddleDots}>
                      <Text style={styles.qrIconOverlay}>🚆</Text>
                    </View>
                    <View style={[styles.qrCornerBlock, { alignSelf: "flex-end" }]} />
                  </View>
                  <Text style={styles.qrHelperText}>Scan QR ini dengan aplikasi pembayaran apapun</Text>
                </View>
              </View>

              <View style={styles.paymentGuideBox}>
                <Text style={styles.guideTitle}>Dapat dibayar dengan:</Text>
                <Text style={styles.guideText}>
                  • GoPay, OVO, Dana, ShopeePay, LinkAja{"\n"}
                  • BCA Mobile, Livin' by Mandiri, BRImo, BNI Mobile, Seabank, Jago, dll.
                </Text>
              </View>
            </View>
          )}

          {/* ========================================================
              KONTEN METODE 2: VIRTUAL ACCOUNT
             ======================================================== */}
          {selectedCategory === "va" && (
            <View style={styles.methodDetailsCard}>
              <Text style={styles.methodSubheading}>Pilih Bank Penerbit VA:</Text>
              <View style={styles.bankGrid}>
                {bankOptions.map((bank) => {
                  const isSelected = selectedBank === bank.id;
                  return (
                    <TouchableOpacity
                      key={bank.id}
                      style={[
                        styles.bankButton,
                        isSelected && styles.bankButtonSelected,
                      ]}
                      onPress={() => setSelectedBank(bank.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.bankName,
                          isSelected && styles.bankNameSelected,
                        ]}
                      >
                        {bank.name}
                      </Text>
                      <View style={styles.bankBadge}>
                        <Text style={styles.bankBadgeText}>{bank.badge}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.vaDisplayContainer}>
                <Text style={styles.vaLabel}>Nomor Virtual Account ({selectedBank}):</Text>
                <View style={styles.vaNumberRow}>
                  <Text style={styles.vaNumberText}>{currentVa}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopy(currentVa, "Nomor VA")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.copyButtonText}>
                      {copiedText === "Nomor VA" ? "✓ Tersalin" : "Salin"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.paymentGuideBox}>
                <Text style={styles.guideTitle}>Petunjuk Pembayaran ATM / m-Banking:</Text>
                <Text style={styles.guideText}>
                  1. Masuk ke menu Transfer &gt; Virtual Account pada m-Banking Anda.{"\n"}
                  2. Masukkan nomor VA di atas: {currentVa}.{"\n"}
                  3. Pastikan nama merchant adalah PT KERETAKU dan total tagihan sesuai.{"\n"}
                  4. Masukkan PIN transaksi Anda dan pembayaran terverifikasi otomatis.
                </Text>
              </View>
            </View>
          )}

          {/* ========================================================
              KONTEN METODE 3: E-WALLET
             ======================================================== */}
          {selectedCategory === "ewallet" && (
            <View style={styles.methodDetailsCard}>
              <Text style={styles.methodSubheading}>Pilih E-Wallet Anda:</Text>
              <View style={styles.ewalletRow}>
                {["GoPay", "OVO", "DANA", "ShopeePay"].map((ew) => {
                  const isSelected = selectedEwallet === ew;
                  return (
                    <TouchableOpacity
                      key={ew}
                      style={[
                        styles.ewalletButton,
                        isSelected && styles.ewalletButtonSelected,
                      ]}
                      onPress={() => setSelectedEwallet(ew)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.ewalletName,
                          isSelected && styles.ewalletNameSelected,
                        ]}
                      >
                        {ew}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.phoneInputContainer}>
                <Text style={styles.inputLabel}>Nomor Handphone Terdaftar ({selectedEwallet}):</Text>
                <TextInput
                  style={styles.phoneInput}
                  defaultValue="0812-3456-7890"
                  keyboardType="phone-pad"
                  placeholder="08xxxxxxxxxx"
                />
              </View>

              <View style={styles.paymentGuideBox}>
                <Text style={styles.guideTitle}>Panduan Pembayaran:</Text>
                <Text style={styles.guideText}>
                  Notifikasi pembayaran akan langsung dikirim ke aplikasi {selectedEwallet} di ponsel Anda.
                  Buka aplikasi dan konfirmasi pembayaran dalam 15 menit.
                </Text>
              </View>
            </View>
          )}

          {/* ========================================================
              KONTEN METODE 4: GERAI RETAIL
             ======================================================== */}
          {selectedCategory === "retail" && (
            <View style={styles.methodDetailsCard}>
              <Text style={styles.methodSubheading}>Pilih Gerai Retail:</Text>
              <View style={styles.ewalletRow}>
                {["Indomaret", "Alfamart"].map((ret) => {
                  const isSelected = selectedRetail === ret;
                  return (
                    <TouchableOpacity
                      key={ret}
                      style={[
                        styles.ewalletButton,
                        isSelected && styles.ewalletButtonSelected,
                      ]}
                      onPress={() => setSelectedRetail(ret)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.ewalletName,
                          isSelected && styles.ewalletNameSelected,
                        ]}
                      >
                        {ret}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.vaDisplayContainer}>
                <Text style={styles.vaLabel}>Kode Pembayaran Kasir:</Text>
                <View style={styles.vaNumberRow}>
                  <Text style={styles.vaNumberText}>KTK-8921-3091</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopy("KTK-8921-3091", "Kode Kasir")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.copyButtonText}>
                      {copiedText === "Kode Kasir" ? "✓ Tersalin" : "Salin"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.paymentGuideBox}>
                <Text style={styles.guideTitle}>Petunjuk Pembayaran di Kasir:</Text>
                <Text style={styles.guideText}>
                  1. Datangi kasir {selectedRetail} terdekat.{"\n"}
                  2. Sampaikan ingin membayar tiket Keretaku / KAI.{"\n"}
                  3. Tunjukkan Kode Pembayaran KTK-8921-3091 kepada kasir.{"\n"}
                  4. Bayar sesuai total tagihan dan simpan struk pembayaran.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ========================================================
            BOTTOM FLOATING ACTION BAR
           ======================================================== */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.bottomBarCol}>
            <Text style={styles.bottomTotalLabel}>Total Tagihan:</Text>
            <Text style={styles.bottomTotalAmount}>{formatRupiah(totalHarga)}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.paySimulateButton,
              (isExpired || isProcessing) && styles.payButtonDisabled,
            ]}
            onPress={handleSimulatePayment}
            disabled={isExpired || isProcessing}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.paySimulateButtonText}>
                {isExpired ? "Waktu Habis" : "Bayar Sekarang (Simulasi)"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ========================================================
            MODAL PEMBAYARAN BERHASIL (SUCCESS MODAL)
           ======================================================== */}
        <Modal
          visible={isSuccessModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModalCard}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successCheckmark}>✓</Text>
              </View>

              <Text style={styles.successTitle}>Pembayaran Berhasil!</Text>
              <Text style={styles.successSubtitle}>
                Transaksi Anda telah lunas dan tiket perjalanan resmi diterbitkan.
              </Text>

              <View style={styles.successDetailBox}>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Kode Booking (PNR):</Text>
                  <Text style={styles.successValBold}>{kodeBooking}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Nama Kereta:</Text>
                  <Text style={styles.successVal}>{namaKereta}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Gerbong & Kursi:</Text>
                  <Text style={styles.successVal}>
                    {gerbong} ({kursi})
                  </Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Total Bayar:</Text>
                  <Text style={[styles.successValBold, { color: colors.success }]}>
                    {formatRupiah(totalHarga)}
                  </Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successLabel}>Metode:</Text>
                  <Text style={styles.successVal}>
                    {selectedCategory === "qris"
                      ? "QRIS Dinamis (GPN)"
                      : selectedCategory === "va"
                      ? `Virtual Account ${selectedBank}`
                      : selectedCategory === "ewallet"
                      ? `E-Wallet ${selectedEwallet}`
                      : `Gerai ${selectedRetail}`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.successActionBtn}
                onPress={() => {
                  setIsSuccessModalVisible(false);
                  router.replace("/");
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.successActionBtnText}>Selesai & Kembali ke Beranda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  timerBanner: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timerBannerExpired: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  timerLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  timerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B45309",
  },
  timerSubtitle: {
    fontSize: 11,
    color: "#78350F",
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timerBadgeExpired: {
    backgroundColor: colors.danger,
  },
  timerIcon: {
    fontSize: 14,
  },
  timerValue: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  billCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  billRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  billLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  billAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.activeOrange,
    marginTop: 2,
  },
  pnrContainer: {
    alignItems: "flex-end",
  },
  pnrLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  pnrCode: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 14,
  },
  ticketSummaryBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryTrainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryTrainName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  summaryTrainClass: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
  },
  summaryRoute: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summarySeatRow: {
    marginTop: 2,
  },
  summarySeatText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  highlightText: {
    fontWeight: "700",
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  paymentMethodTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  methodTab: {
    width: "48.5%",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
  },
  methodTabActive: {
    borderColor: colors.primary,
    backgroundColor: "#F0F7FF",
  },
  methodTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  methodTabTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  methodTabTitleActive: {
    color: colors.primary,
  },
  methodTabSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  methodDetailsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  qrisHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  qrisLogoBadge: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qrisLogoText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },
  gpnText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  qrisMerchantName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  qrisNmid: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qrCodeWrapper: {
    alignItems: "center",
    marginVertical: 18,
  },
  qrCodeBox: {
    width: 200,
    height: 200,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  qrPatternGrid: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  qrCornerBlock: {
    width: 44,
    height: 44,
    backgroundColor: "#1E293B",
    borderRadius: 6,
  },
  qrMiddleDots: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  qrIconOverlay: {
    fontSize: 20,
  },
  qrHelperText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },
  methodSubheading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  bankGrid: {
    gap: 8,
    marginBottom: 16,
  },
  bankButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bankButtonSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: colors.primary,
  },
  bankName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  bankNameSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  bankBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bankBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803D",
  },
  vaDisplayContainer: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  vaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 6,
  },
  vaNumberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vaNumberText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 1.2,
  },
  copyButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  ewalletRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  ewalletButton: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  ewalletButtonSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: colors.primary,
  },
  ewalletName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  ewalletNameSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  phoneInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 6,
  },
  phoneInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  paymentGuideBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  guideText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
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
  bottomBarCol: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  bottomTotalAmount: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.activeOrange,
    marginTop: 1,
  },
  paySimulateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
  },
  payButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  paySimulateButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successCheckmark: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.success,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 18,
  },
  successDetailBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    gap: 8,
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  successVal: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  successValBold: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  successActionBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  successActionBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
});

