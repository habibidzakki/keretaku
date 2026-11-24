import { DesignSystem } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Booking, Schedule, Station, supabase } from "@/lib/supabase";
import { Stasiun } from "@/types";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { colors } = DesignSystem;

export type { Stasiun };

export interface TrainItem {
  id: number;
  schedule_id?: string;
  nama: string;
  waktu: string;
  durasi: number;
  harga: number;
  kelas: string;
  sisaKursi: number;
  asalKode?: string;
  tujuanKode?: string;
}

// Data Fallback Pilihan Stasiun Jawa Timur & Nasional
const DAFTAR_STASIUN_DEFAULT: Stasiun[] = [
  { kode: "SGU", nama: "Stasiun Surabaya Gubeng", kota: "Surabaya" },
  { kode: "ML", nama: "Stasiun Malang", kota: "Malang" },
  { kode: "KD", nama: "Stasiun Kediri", kota: "Kediri" },
  { kode: "YK", nama: "Stasiun Yogyakarta", kota: "Yogyakarta" },
  { kode: "GMR", nama: "Stasiun Gambir", kota: "Jakarta" },
  { kode: "BD", nama: "Stasiun Bandung", kota: "Bandung" },
  { kode: "SMT", nama: "Stasiun Semarang Tawang", kota: "Semarang" },
  { kode: "SLO", nama: "Stasiun Solo Balapan", kota: "Surakarta" },
  { kode: "BL", nama: "Stasiun Blitar", kota: "Blitar" },
  { kode: "MN", nama: "Stasiun Madiun", kota: "Madiun" },
  { kode: "JR", nama: "Stasiun Jember", kota: "Jember" },
  { kode: "BW", nama: "Stasiun Banyuwangi", kota: "Banyuwangi" },
  { kode: "SDA", nama: "Stasiun Sidoarjo", kota: "Sidoarjo" },
  { kode: "PS", nama: "Stasiun Pasuruan", kota: "Pasuruan" },
  { kode: "PB", nama: "Stasiun Probolinggo", kota: "Probolinggo" },
  { kode: "PSE", nama: "Stasiun Pasar Senen", kota: "Jakarta" },
  { kode: "CN", nama: "Stasiun Cirebon", kota: "Cirebon" },
];

// Data Kereta Realistis
const DATA_KERETA: TrainItem[] = [
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
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const isFetchingBookings = useRef(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dynamic Theme Palette tanpa mengubah konstanta theme utama
  const theme = {
    bg: isDarkMode ? "#0F172A" : colors.background,
    card: isDarkMode ? "#1E293B" : colors.card || "#FFFFFF",
    textPrimary: isDarkMode ? "#F8FAFC" : colors.textPrimary,
    textSecondary: isDarkMode ? "#94A3B8" : colors.textSecondary,
    border: isDarkMode ? "#334155" : "#EBF1F7",
    inputBg: isDarkMode ? "#0F172A" : "#F8FAFD",
    navBg: isDarkMode ? "#1E293B" : colors.primary,
  };

  // Navigation tab state (Beranda, Tiket Saya, Bantuan, Akun)
  const [activeTab, setActiveTab] = useState<
    "beranda" | "tiket" | "bantuan" | "akun"
  >("beranda");
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  // Sinkronisasi perpindahan tab dari navigasi params (?tab=tiket atau ?tab=akun)
  useEffect(() => {
    if (params.tab === "tiket") {
      setActiveTab("tiket");
      router.setParams({ tab: undefined });
    } else if (params.tab === "akun") {
      setActiveTab("akun");
      router.setParams({ tab: undefined });
    }
  }, [params.tab]);

  // State Data Stasiun dari Supabase (public.stations)
  const [daftarStasiun, setDaftarStasiun] = useState<Stasiun[]>(
    DAFTAR_STASIUN_DEFAULT,
  );
  const [loadingStasiun, setLoadingStasiun] = useState(false);

  // Booking Form States
  const [asal, setAsal] = useState<Stasiun>(DAFTAR_STASIUN_DEFAULT[0]); // Default Surabaya
  const [tujuan, setTujuan] = useState<Stasiun>(DAFTAR_STASIUN_DEFAULT[1]); // Default Malang
  const [tanggalPergi, setTanggalPergi] = useState("Rab, 21 Okt 2026");
  const [isPulangPergi, setIsPulangPergi] = useState(false);
  const [tanggalPulang, setTanggalPulang] = useState("Kam, 22 Okt 2026");
  const [jumlahPenumpang, setJumlahPenumpang] = useState<number>(1);
  const [kelasDipilih, setKelasDipilih] = useState("Semua");

  // Search results state & Supabase schedules
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [supabaseTrains, setSupabaseTrains] = useState<TrainItem[]>([]);

  // User Bookings state dari Supabase (public.bookings join schedules)
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // 1. Mengambil data stasiun dari tabel public.stations di Supabase
  useEffect(() => {
    let isMounted = true;
    setLoadingStasiun(true);

    const loadStations = async () => {
      try {
        const { data, error } = await supabase
          .from("stations")
          .select("*")
          .order("name", { ascending: true });

        if (!isMounted) return;

        // Map data dari Supabase
        const mappedStations: Stasiun[] =
          !error && data && data.length > 0
            ? data.map((item: any) => ({
                kode: (item.code || item.kode || "").toUpperCase(),
                nama: item.name || item.nama || "",
                kota: item.city || item.kota || "",
              }))
            : [];

        // Gabungkan daftar stasiun dari Supabase dengan daftar stasiun lokal secara unik berdasarkan kode stasiun
        const mapByCode = new Map<string, Stasiun>();
        // Masukkan stasiun lokal terlebih dahulu
        DAFTAR_STASIUN_DEFAULT.forEach((s) =>
          mapByCode.set(s.kode.toUpperCase(), s)
        );
        // Tambahkan / perbarui dengan data dari Supabase
        mappedStations.forEach((s) => {
          if (s.kode) mapByCode.set(s.kode.toUpperCase(), s);
        });

        const combinedStations = Array.from(mapByCode.values()).sort((a, b) =>
          a.nama.localeCompare(b.nama)
        );

        setDaftarStasiun(combinedStations);

        // Pertahankan stasiun yang sudah dipilih jika ada, jika belum gunakan default Surabaya & Malang
        setAsal((prev) => {
          if (prev && mapByCode.has(prev.kode.toUpperCase())) {
            return mapByCode.get(prev.kode.toUpperCase())!;
          }
          return (
            combinedStations.find((s) =>
              s.kota.toLowerCase().includes("surabaya")
            ) || combinedStations[0]
          );
        });

        setTujuan((prev) => {
          if (prev && mapByCode.has(prev.kode.toUpperCase())) {
            return mapByCode.get(prev.kode.toUpperCase())!;
          }
          return (
            combinedStations.find((s) =>
              s.kota.toLowerCase().includes("malang")
            ) ||
            combinedStations[1] ||
            combinedStations[0]
          );
        });
      } catch (err: any) {
        console.warn("Supabase stations fallback:", err);
        if (isMounted) {
          setDaftarStasiun(DAFTAR_STASIUN_DEFAULT);
        }
      } finally {
        if (isMounted) {
          setLoadingStasiun(false);
        }
      }
    };

    loadStations();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Mengambil riwayat tiket milik user aktif dari tabel public.bookings (RLS)
  const fetchUserBookings = useCallback(async () => {
    if (!userId) {
      setUserBookings([]);
      return;
    }
    if (isFetchingBookings.current) return;
    isFetchingBookings.current = true;
    setLoadingBookings(true);
    try {
      // 1. Coba query relasional dengan join schedules(*)
      let { data, error } = await supabase
        .from("bookings")
        .select("*, schedules(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // 2. Jika join schedules(*) gagal (misal schema cache PostgREST relasi belum aktif),
      // gunakan query aman select("*") agar tiket tetap berhasil diambil
      if (error) {
        console.warn("Relational select with schedules(*) failed:", error.message);
        const fallbackRes = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
          error = null;
        }
      }

      console.log("FETCH USER BOOKINGS RESULT:", {
        count: data?.length || 0,
        error: error ? error.message : null,
      });

      if (error) {
        console.warn("Gagal memuat tiket user:", error.message);
      } else if (data) {
        // Ambil data jadwal jika schedules bernilai null dan schedule_id tersedia
        const resolvedBookings = await Promise.all(
          data.map(async (bk: any) => {
            if (bk.schedules) return bk;
            if (bk.schedule_id) {
              try {
                const { data: schedData } = await supabase
                  .from("schedules")
                  .select("*")
                  .eq("id", bk.schedule_id)
                  .maybeSingle();
                if (schedData) {
                  return { ...bk, schedules: schedData };
                }
              } catch (_) {}
            }
            return bk;
          })
        );

        setUserBookings(resolvedBookings as Booking[]);
      }
    } catch (err: any) {
      console.warn("Exception get bookings:", err.message);
    } finally {
      isFetchingBookings.current = false;
      setLoadingBookings(false);
    }
  }, [userId]);

  // Pull-to-refresh state & handler
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserBookings();
    setRefreshing(false);
  }, [fetchUserBookings]);

  // useFocusEffect dari expo-router: hanya re-fetch tiket saat layar kembali aktif jika sedang di tab Tiket Saya
  useFocusEffect(
    useCallback(() => {
      if (activeTabRef.current === "tiket" && userId) {
        fetchUserBookings();
      }
    }, [userId, fetchUserBookings])
  );

  // Fetch tiket saat user membuka tab Tiket Saya
  useEffect(() => {
    if (activeTab === "tiket" && userId) {
      fetchUserBookings();
    }
  }, [activeTab, userId, fetchUserBookings]);

  // 3. Batalkan Tiket (UPDATE status='cancelled' dengan perlindungan RLS)
  const handleBatalkanTiket = (bookingId: string) => {
    const executeBatal = async () => {
      try {
        const { error } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId)
          .eq("user_id", userId || "");

        if (error) {
          if (Platform.OS === "web" && typeof window !== "undefined") {
            window.alert(`Gagal Membatalkan: ${error.message}`);
          } else {
            Alert.alert("Gagal Membatalkan", error.message);
          }
        } else {
          // Optimistic update agar status tiket langsung berubah di layar
          setUserBookings((prev) =>
            prev.map((b) =>
              b.id === bookingId ? { ...b, status: "cancelled" } : b
            )
          );
          if (Platform.OS === "web" && typeof window !== "undefined") {
            window.alert(
              "Tiket Berhasil Dibatalkan!\nStatus tiket Anda telah diperbarui menjadi dibatalkan."
            );
          } else {
            Alert.alert(
              "Tiket Dibatalkan",
              "Status tiket Anda telah diperbarui menjadi dibatalkan."
            );
          }
          await fetchUserBookings();
        }
      } catch (err: any) {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert(`Error: ${err.message}`);
        } else {
          Alert.alert("Error", err.message);
        }
      }
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Batalkan Tiket:\nApakah Anda yakin ingin membatalkan perjalanan ini?"
      );
      if (confirmed) {
        executeBatal();
      }
    } else {
      Alert.alert(
        "Batalkan Tiket",
        "Apakah Anda yakin ingin membatalkan perjalanan ini?",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Ya, Batalkan",
            style: "destructive",
            onPress: executeBatal,
          },
        ]
      );
    }
  };

  // 4. Hapus Riwayat Tiket (DELETE dengan perlindungan RLS)
  const handleHapusTiket = (bookingId: string) => {
    const executeHapus = async () => {
      try {
        const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", bookingId)
          .eq("user_id", userId || "");

        if (error) {
          if (Platform.OS === "web" && typeof window !== "undefined") {
            window.alert(`Gagal Menghapus: ${error.message}`);
          } else {
            Alert.alert("Gagal Menghapus", error.message);
          }
        } else {
          // Optimistic update agar tiket langsung hilang dari layar
          setUserBookings((prev) => prev.filter((b) => b.id !== bookingId));
          if (Platform.OS === "web" && typeof window !== "undefined") {
            window.alert("Tiket Dihapus:\nData tiket telah dihapus dari Supabase.");
          } else {
            Alert.alert(
              "Tiket Dihapus",
              "Data tiket telah dihapus dari Supabase."
            );
          }
          await fetchUserBookings();
        }
      } catch (err: any) {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert(`Error: ${err.message}`);
        } else {
          Alert.alert("Error", err.message);
        }
      }
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Hapus Riwayat Tiket:\nHapus data riwayat tiket ini secara permanen dari Supabase?"
      );
      if (confirmed) {
        executeHapus();
      }
    } else {
      Alert.alert(
        "Hapus Riwayat Tiket",
        "Hapus data riwayat tiket ini secara permanen dari Supabase?",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: executeHapus,
          },
        ]
      );
    }
  };

  // Modals state
  const [stationModalVisible, setStationModalVisible] = useState(false);
  const [pickingFor, setPickingFor] = useState<"asal" | "tujuan">("asal");
  const [stationSearchText, setStationSearchText] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("Semua");
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateModalType, setDateModalType] = useState<"pergi" | "pulang">(
    "pergi",
  );

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
    return daftarStasiun.filter((stasiun) => {
      const q = stationSearchText.trim().toLowerCase();
      const matchSearch =
        !q ||
        stasiun.nama.toLowerCase().includes(q) ||
        stasiun.kode.toLowerCase().includes(q) ||
        stasiun.kota.toLowerCase().includes(q);

      const matchCity =
        selectedCityFilter === "Semua" ||
        stasiun.kota.toLowerCase() === selectedCityFilter.toLowerCase() ||
        stasiun.kota.toLowerCase().includes(selectedCityFilter.toLowerCase());

      return matchSearch && matchCity;
    });
  }, [daftarStasiun, stationSearchText, selectedCityFilter]);

  // List filter kota unik untuk modal stasiun
  const availableCities = useMemo(() => {
    const cityList = ["Semua"];
    daftarStasiun.forEach((s) => {
      if (s.kota && !cityList.includes(s.kota)) {
        cityList.push(s.kota);
      }
    });
    return cityList;
  }, [daftarStasiun]);

  // Open modal stasiun
  const handleOpenStationModal = (type: "asal" | "tujuan") => {
    setPickingFor(type);
    setStationSearchText("");
    setSelectedCityFilter("Semua");
    setStationModalVisible(true);
  };

  // Select station
  const handleSelectStation = (item: Stasiun) => {
    const selected: Stasiun = {
      kode: item.kode.toUpperCase(),
      nama: item.nama,
      kota: item.kota,
    };
    if (pickingFor === "asal") {
      setAsal(selected);
    } else {
      setTujuan(selected);
    }
    setStationModalVisible(false);
  };

  // Trigger Pencarian Tiket Kereta dari tabel public.schedules di Supabase
  const handleCariTiket = async () => {
    if (asal.kode === tujuan.kode) {
      Alert.alert("Perhatian", "Stasiun asal dan tujuan tidak boleh sama!");
      return;
    }
    setSearching(true);
    setHasSearched(true);

    try {
      // 1. Ambil jadwal dari Supabase sesuai origin_code dan destination_code
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("origin_code", asal.kode)
        .eq("destination_code", tujuan.kode);

      // 2. Ambil fallback valid UUID dari schedules untuk foreign key jika rute belum di-seed di database
      let fallbackScheduleId: string | undefined = undefined;
      const { data: fallbackSched } = await supabase
        .from("schedules")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (fallbackSched?.id) {
        fallbackScheduleId = fallbackSched.id;
      }

      if (!error && data && data.length > 0) {
        const mapped: TrainItem[] = data.map((s: Schedule, idx: number) => {
          const [depH] = (s.departure_time || "08:00").split(":").map(Number);
          const [arrH] = (s.arrival_time || "12:00").split(":").map(Number);
          let durasi = (arrH || 0) - (depH || 0);
          if (durasi <= 0) durasi += 24;

          return {
            id: idx + 1,
            schedule_id: s.id,
            nama: s.train_name,
            waktu: s.departure_time?.slice(0, 5) || "08:00",
            durasi: durasi || 4,
            harga: Number(s.price) || 250000,
            kelas: s.train_class,
            sisaKursi: 14 + (idx * 3),
            asalKode: s.origin_code,
            tujuanKode: s.destination_code,
          };
        });
        setSupabaseTrains(mapped);
      } else {
        // Fallback dinamis jika rute spesifik belum ada di tabel Supabase
        // Buat jadwal dinamis berdasarkan stasiun asal dan tujuan yang dipilih pengguna
        const dynamicTrains: TrainItem[] = [
          {
            id: 1,
            schedule_id: fallbackScheduleId,
            nama: `Argo ${asal.kota.split(" ")[0]} Express`,
            waktu: "07:30",
            durasi: 5,
            harga: 420000,
            kelas: "Eksekutif",
            sisaKursi: 12,
            asalKode: asal.kode,
            tujuanKode: tujuan.kode,
          },
          {
            id: 2,
            schedule_id: fallbackScheduleId,
            nama: "Malioboro Ekspres",
            waktu: "10:15",
            durasi: 6,
            harga: 290000,
            kelas: "Ekonomi",
            sisaKursi: 28,
            asalKode: asal.kode,
            tujuanKode: tujuan.kode,
          },
          {
            id: 3,
            schedule_id: fallbackScheduleId,
            nama: "Jayabaya",
            waktu: "13:40",
            durasi: 5,
            harga: 320000,
            kelas: "Bisnis",
            sisaKursi: 19,
            asalKode: asal.kode,
            tujuanKode: tujuan.kode,
          },
          {
            id: 4,
            schedule_id: fallbackScheduleId,
            nama: "Gajayana",
            waktu: "17:25",
            durasi: 6,
            harga: 480000,
            kelas: "Eksekutif",
            sisaKursi: 8,
            asalKode: asal.kode,
            tujuanKode: tujuan.kode,
          },
          {
            id: 5,
            schedule_id: fallbackScheduleId,
            nama: "Matarmaja",
            waktu: "20:50",
            durasi: 7,
            harga: 180000,
            kelas: "Ekonomi",
            sisaKursi: 40,
            asalKode: asal.kode,
            tujuanKode: tujuan.kode,
          },
        ];
        setSupabaseTrains(dynamicTrains);
      }
    } catch (err: any) {
      console.warn("Gagal query schedules Supabase:", err.message);
      setSupabaseTrains([
        {
          id: 1,
          schedule_id: undefined,
          nama: `Ekspres ${asal.kode}-${tujuan.kode}`,
          waktu: "08:00",
          durasi: 5,
          harga: 350000,
          kelas: "Eksekutif",
          sisaKursi: 15,
          asalKode: asal.kode,
          tujuanKode: tujuan.kode,
        },
      ]);
    } finally {
      setSearching(false);
    }
  };

  // Navigasi ke Detail
  const handlePesanTiket = (item: TrainItem) => {
    if (!user) {
      Alert.alert(
        "Perlu Masuk Akun 🔐",
        "Silakan masuk ke akun Keretaku Anda terlebih dahulu untuk memesan tiket kereta.",
        [
          { text: "Nanti Saja", style: "cancel" },
          {
            text: "Masuk Sekarang",
            onPress: () => router.push("/login" as any),
          },
        ]
      );
      return;
    }

    router.push({
      pathname: "/detail",
      params: {
        schedule_id: item.schedule_id || "",
        nama: item.nama,
        waktu: item.waktu,
        harga: item.harga.toString(),
        kelas: item.kelas,
        asal: `${asal.kode} - ${asal.nama} (${asal.kota})`,
        tujuan: `${tujuan.kode} - ${tujuan.nama} (${tujuan.kota})`,
        asalKode: asal.kode,
        asalNama: asal.nama,
        asalKota: asal.kota,
        tujuanKode: tujuan.kode,
        tujuanNama: tujuan.nama,
        tujuanKota: tujuan.kota,
        jumlah: jumlahPenumpang.toString(),
        durasi: item.durasi.toString(),
        tanggal: tanggalPergi,
      },
    });
  };

  // Filter Kereta sesuai Kelas yang Dipilih
  const displayTrains = useMemo(() => {
    const list =
      hasSearched && supabaseTrains.length > 0 ? supabaseTrains : DATA_KERETA;
    if (kelasDipilih === "Semua") return list;
    return list.filter(
      (k) => k.kelas.toLowerCase() === kelasDipilih.toLowerCase(),
    );
  }, [kelasDipilih, hasSearched, supabaseTrains]);

  // Quick date options
  const dateOptions = [
    { label: "Hari Ini", date: "Sel, 20 Okt 2026" },
    { label: "Besok", date: "Rab, 21 Okt 2026" },
    { label: "Lusa", date: "Kam, 22 Okt 2026" },
    { label: "Akhir Pekan", date: "Sab, 24 Okt 2026" },
    { label: "Minggu Depan", date: "Sen, 26 Okt 2026" },
  ];

  return (
    <View style={[styles.outerWrapper, { backgroundColor: theme.bg }]}>
      {/* Container utama dengan constraint lebar untuk desktop / mobile */}
      <View style={[styles.responsiveContainer, { backgroundColor: theme.bg }]}>
        {/* NAVBAR */}
        <View
          style={[
            styles.navbar,
            {
              backgroundColor: theme.navBg,
              paddingTop: Math.max(insets.top, 14) + 6,
            },
          ]}
        >
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {activeTab === "beranda" && (
            <>
              {/* HERO SECTION */}
              <View
                style={[styles.heroSection, { backgroundColor: theme.navBg }]}
              >
                <View style={styles.heroOverlayCircle1} />
                <View style={styles.heroOverlayCircle2} />

                <View style={styles.heroContent}>
                  <View style={styles.heroTag}>
                    <Text style={styles.heroTagText}>
                      ⚡ PROMO TIKET RESMI KAI
                    </Text>
                  </View>
                  <Text style={styles.heroTitle}>Pesan Tiket Kereta</Text>
                  <Text style={styles.heroSubtitle}>
                    Harga terbaik untuk destinasi ke mana saja 🚆
                  </Text>
                </View>
              </View>

              {/* FORM PEMESANAN */}
              <View
                style={[
                  styles.formCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                {/* Rute Stasiun: Asal & Tujuan + Swap Button */}
                <View style={styles.routeContainer}>
                  {/* Origin Station */}
                  <TouchableOpacity
                    style={[
                      styles.stationTouchBox,
                      styles.stationTouchBoxLeft,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => handleOpenStationModal("asal")}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Pilih Stasiun Asal"
                  >
                    <View style={styles.stationHeaderRow}>
                      <View
                        style={[
                          styles.stationIndicator,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                      <Text
                        style={[
                          styles.stationLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Stasiun Asal
                      </Text>
                    </View>
                    <Text
                      style={[styles.stationCode, { color: theme.textPrimary }]}
                    >
                      {asal.kode}
                    </Text>
                    <Text
                      style={[styles.stationName, { color: theme.textPrimary }]}
                      numberOfLines={1}
                    >
                      {asal.nama}
                    </Text>
                    <Text
                      style={[
                        styles.stationCity,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {asal.kota}
                    </Text>
                  </TouchableOpacity>

                  {/* Tombol Swap Tengah */}
                  <View style={styles.swapButtonWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.swapButton,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                      ]}
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
                    style={[
                      styles.stationTouchBox,
                      styles.stationTouchBoxRight,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => handleOpenStationModal("tujuan")}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Pilih Stasiun Tujuan"
                  >
                    <View style={styles.stationHeaderRow}>
                      <View
                        style={[
                          styles.stationIndicator,
                          { backgroundColor: colors.activeOrange },
                        ]}
                      />
                      <Text
                        style={[
                          styles.stationLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Stasiun Tujuan
                      </Text>
                    </View>
                    <Text
                      style={[styles.stationCode, { color: theme.textPrimary }]}
                    >
                      {tujuan.kode}
                    </Text>
                    <Text
                      style={[styles.stationName, { color: theme.textPrimary }]}
                      numberOfLines={1}
                    >
                      {tujuan.nama}
                    </Text>
                    <Text
                      style={[
                        styles.stationCity,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {tujuan.kota}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.formDivider,
                    { backgroundColor: theme.border },
                  ]}
                />

                {/* Tanggal Pergi & Toggle Pulang-Pergi */}
                <View style={styles.dateSection}>
                  <View style={styles.dateHeaderRow}>
                    <View style={styles.dateColumnLeft}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: theme.textPrimary },
                        ]}
                      >
                        Tanggal Pergi
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.datePickerButton,
                          {
                            backgroundColor: theme.inputBg,
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() => {
                          setDateModalType("pergi");
                          setDateModalVisible(true);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Ubah Tanggal Pergi"
                      >
                        <Text style={styles.calendarIcon}>📅</Text>
                        <Text
                          style={[
                            styles.dateValueText,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {tanggalPergi}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Toggle Pulang-Pergi */}
                    <View style={styles.roundTripToggleWrapper}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: theme.textPrimary },
                        ]}
                      >
                        Pulang-Pergi?
                      </Text>
                      <View style={styles.switchRow}>
                        <Switch
                          value={isPulangPergi}
                          onValueChange={(val) => setIsPulangPergi(val)}
                          trackColor={{
                            false: theme.border,
                            true: colors.lightBlue,
                          }}
                          thumbColor={
                            isPulangPergi ? colors.primary : "#FFFFFF"
                          }
                          accessibilityLabel="Toggle Pulang-Pergi"
                        />
                        <Text
                          style={[
                            styles.switchLabel,
                            { color: theme.textSecondary },
                            isPulangPergi && styles.switchLabelActive,
                          ]}
                        >
                          {isPulangPergi ? "Ya" : "Tidak"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Tanggal Pulang */}
                  {isPulangPergi && (
                    <View style={styles.returnDateRow}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: theme.textPrimary },
                        ]}
                      >
                        Tanggal Pulang
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.datePickerButton,
                          {
                            backgroundColor: theme.inputBg,
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() => {
                          setDateModalType("pulang");
                          setDateModalVisible(true);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Ubah Tanggal Pulang"
                      >
                        <Text style={styles.calendarIcon}>📅</Text>
                        <Text
                          style={[
                            styles.dateValueText,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {tanggalPulang}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.formDivider,
                    { backgroundColor: theme.border },
                  ]}
                />

                {/* Counter Jumlah Penumpang */}
                <View style={styles.passengerSection}>
                  <View>
                    <Text
                      style={[styles.fieldLabel, { color: theme.textPrimary }]}
                    >
                      Jumlah Penumpang
                    </Text>
                    <Text
                      style={[
                        styles.passengerSubText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Usia 3 tahun ke atas
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.counterRow,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.counterBtn,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                        jumlahPenumpang <= 1 && styles.counterBtnDisabled,
                      ]}
                      disabled={jumlahPenumpang <= 1}
                      onPress={() =>
                        setJumlahPenumpang((prev) => Math.max(1, prev - 1))
                      }
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
                      <Text
                        style={[
                          styles.counterNumberText,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {jumlahPenumpang}
                      </Text>
                      <Text
                        style={[
                          styles.counterLabelText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Orang
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.counterBtn,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                        jumlahPenumpang >= 8 && styles.counterBtnDisabled,
                      ]}
                      disabled={jumlahPenumpang >= 8}
                      onPress={() =>
                        setJumlahPenumpang((prev) => Math.min(8, prev + 1))
                      }
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

                <View
                  style={[
                    styles.formDivider,
                    { backgroundColor: theme.border },
                  ]}
                />

                {/* Selector Kelas Kereta */}
                <View style={styles.classSection}>
                  <Text
                    style={[styles.fieldLabel, { color: theme.textPrimary }]}
                  >
                    Kelas Kereta
                  </Text>
                  <View style={styles.classChipsRow}>
                    {KELAS_OPTIONS.map((k) => {
                      const isSelected = kelasDipilih === k;
                      return (
                        <TouchableOpacity
                          key={k}
                          style={[
                            styles.classChip,
                            {
                              backgroundColor: theme.inputBg,
                              borderColor: theme.border,
                            },
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
                              { color: theme.textSecondary },
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

              {/* DAFTAR JADWAL KERETA TERSEDIA */}
              <View style={styles.resultsContainer}>
                {/* STATUS BACKEND SUPABASE POSTGRESQL */}
                {hasSearched && (
                  <View
                    style={[
                      styles.weatherCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.weatherHeaderRow}>
                      <View style={styles.weatherTitleBadge}>
                        <Text
                          style={[
                            styles.weatherBadgeText,
                            { color: colors.primary },
                          ]}
                        >
                          ⚡ DATABASE SUPABASE
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.weatherCityText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Rute: {asal.kode} ➔ {tujuan.kode}
                      </Text>
                    </View>
                    <View style={{ marginTop: 8 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: colors.primary,
                        }}
                      >
                        Jadwal Kereta & RLS Aktif
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.textSecondary,
                          marginTop: 3,
                        }}
                      >
                        Data stasiun & jadwal bersumber langsung dari Supabase tanpa perantara External API.
                      </Text>
                    </View>
                  </View>
                )}
                <View style={styles.resultsHeaderRow}>
                  <View>
                    <Text
                      style={[
                        styles.resultsTitle,
                        { color: theme.textPrimary },
                      ]}
                    >
                      Jadwal Kereta Tersedia
                    </Text>
                    <Text
                      style={[
                        styles.resultsSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {asal.kode} ➔ {tujuan.kode} • {tanggalPergi}
                    </Text>
                  </View>
                  <View style={styles.trainCountBadge}>
                    <Text style={styles.trainCountText}>
                      {displayTrains.length} Kereta
                    </Text>
                  </View>
                </View>

                {searching ? (
                  <View
                    style={[
                      styles.loadingContainer,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text
                      style={[
                        styles.loadingText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Mencari ketersediaan kursi...
                    </Text>
                  </View>
                ) : displayTrains.length === 0 ? (
                  <View
                    style={[
                      styles.emptyStateBox,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.emptyStateEmoji}>🚆</Text>
                    <Text
                      style={[
                        styles.emptyStateTitle,
                        { color: theme.textPrimary },
                      ]}
                    >
                      Tidak Ada Kereta Ditemukan
                    </Text>
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Coba ganti filter kelas atau stasiun untuk melihat jadwal
                      lainnya.
                    </Text>
                  </View>
                ) : (
                  displayTrains.map((item) => {
                    const waktuTiba = hitungWaktuTiba(item.waktu, item.durasi);
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.trainCard,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        {/* Header Kartu Kereta */}
                        <View style={styles.trainCardHeader}>
                          <View style={styles.trainNameGroup}>
                            <Text
                              style={[
                                styles.trainNameText,
                                { color: theme.textPrimary },
                              ]}
                            >
                              {item.nama}
                            </Text>
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

                        {/* Jadwal Perjalanan */}
                        <View style={styles.journeyRow}>
                          <View style={styles.journeyPoint}>
                            <Text
                              style={[
                                styles.journeyTime,
                                { color: theme.textPrimary },
                              ]}
                            >
                              {item.waktu}
                            </Text>
                            <Text
                              style={[
                                styles.journeyStation,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {item.asalKode || asal.kode}
                            </Text>
                          </View>

                          <View style={styles.journeyLineContainer}>
                            <Text
                              style={[
                                styles.durationText,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {item.durasi} jam
                            </Text>
                            <View style={styles.journeyTrack}>
                              <View style={styles.journeyTrackDot} />
                              <View
                                style={[
                                  styles.journeyTrackLine,
                                  { backgroundColor: theme.border },
                                ]}
                              />
                              <Text style={styles.journeyTrackTrain}>🚆</Text>
                              <View
                                style={[
                                  styles.journeyTrackLine,
                                  { backgroundColor: theme.border },
                                ]}
                              />
                              <View style={styles.journeyTrackDot} />
                            </View>
                            <Text style={styles.directText}>Langsung</Text>
                          </View>

                          <View
                            style={[
                              styles.journeyPoint,
                              { alignItems: "flex-end" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.journeyTime,
                                { color: theme.textPrimary },
                              ]}
                            >
                              {waktuTiba}
                            </Text>
                            <Text
                              style={[
                                styles.journeyStation,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {item.tujuanKode || tujuan.kode}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.cardDivider,
                            { backgroundColor: theme.border },
                          ]}
                        />

                        {/* Footer Kartu Kereta */}
                        <View style={styles.trainCardFooter}>
                          <View>
                            <Text
                              style={[
                                styles.pricePerPersonLabel,
                                { color: theme.textSecondary },
                              ]}
                            >
                              Harga per orang
                            </Text>
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
                            <Text style={styles.selectTrainBtnText}>
                              Pesan Tiket
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}

          {/* TAB TIKET SAYA */}
          {activeTab === "tiket" && (
            <View style={styles.tabContentContainer}>
              <View style={styles.tabContentHeader}>
                <Text
                  style={[styles.tabContentTitle, { color: theme.textPrimary }]}
                >
                  Tiket Saya
                </Text>
                <Text
                  style={[styles.tabContentSub, { color: theme.textSecondary }]}
                >
                  Daftar perjalanan & e-ticket resmi Anda
                </Text>
              </View>

              {!user ? (
                <View
                  style={[
                    styles.ticketEmptyCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={styles.ticketEmptyIcon}>🔐</Text>
                  <Text
                    style={[
                      styles.ticketEmptyTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    Masuk untuk Melihat E-Tiket
                  </Text>
                  <Text
                    style={[
                      styles.ticketEmptyText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Seluruh tiket yang Anda beli tersimpan aman di database Supabase dan dilindungi oleh Row Level Security (RLS).
                  </Text>
                  <TouchableOpacity
                    style={styles.tabActionButton}
                    onPress={() => router.push("/login" as any)}
                  >
                    <Text style={styles.tabActionButtonText}>
                      Masuk / Daftar Akun
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : loadingBookings ? (
                <View
                  style={[
                    styles.ticketEmptyCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[
                      styles.ticketEmptyText,
                      { color: theme.textSecondary, marginTop: 12 },
                    ]}
                  >
                    Memuat daftar tiket dari Supabase...
                  </Text>
                </View>
              ) : userBookings.length === 0 ? (
                <View
                  style={[
                    styles.ticketEmptyCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={styles.ticketEmptyIcon}>🎟️</Text>
                  <Text
                    style={[
                      styles.ticketEmptyTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    Belum Ada Tiket Aktif
                  </Text>
                  <Text
                    style={[
                      styles.ticketEmptyText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Perjalanan yang Anda pesan akan langsung tampil di sini dengan QR Code boarding pass dan status pembayaran.
                  </Text>
                  <TouchableOpacity
                    style={styles.tabActionButton}
                    onPress={() => setActiveTab("beranda")}
                  >
                    <Text style={styles.tabActionButtonText}>
                      Cari Tiket Sekarang
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ width: "100%" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: colors.primary,
                      }}
                    >
                      Ditemukan {userBookings.length} Tiket
                    </Text>
                    <TouchableOpacity
                      onPress={fetchUserBookings}
                      style={{
                        paddingVertical: 4,
                        paddingHorizontal: 10,
                        backgroundColor: "#EBF1F7",
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: colors.primary,
                        }}
                      >
                        🔄 Segarkan
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {userBookings.map((bk) => {
                    const isCancelled = bk.status === "cancelled";
                    const seatParts = (bk.seat_number || "").split(" • ");
                    const cleanSeat = seatParts[0]?.trim() || bk.seat_number;
                    const dynamicRoute = seatParts[1]?.trim() || null;
                    const dynamicTrain = seatParts[2]?.trim() || null;

                    const displayTrainName = dynamicTrain || bk.schedules?.train_name || "Kereta Api Express";
                    const displayRoute = dynamicRoute || (
                      bk.schedules?.origin_code && bk.schedules?.destination_code
                        ? `${bk.schedules.origin_code} ➔ ${bk.schedules.destination_code}`
                        : `${asal.kode} ➔ ${tujuan.kode}`
                    );

                    return (
                      <View
                        key={bk.id}
                        style={[
                          styles.trainCard,
                          {
                            backgroundColor: theme.card,
                            borderColor: isCancelled ? "#FECACA" : theme.border,
                            borderWidth: 1,
                            marginBottom: 14,
                          },
                        ]}
                      >
                        {/* Header Tiket */}
                        <View style={styles.trainCardHeader}>
                          <View>
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "800",
                                color: colors.primary,
                                letterSpacing: 0.5,
                              }}
                            >
                              PNR: KTK-{bk.id.slice(0, 8).toUpperCase()}
                            </Text>
                            <Text
                              style={[
                                styles.trainNameText,
                                { color: theme.textPrimary, marginTop: 2 },
                              ]}
                            >
                              {displayTrainName}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.classBadge,
                              isCancelled
                                ? { backgroundColor: "#FEE2E2" }
                                : { backgroundColor: "#DCFCE7" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.classBadgeText,
                                isCancelled
                                    ? { color: "#DC2626" }
                                    : { color: "#16A34A" },
                              ]}
                            >
                              {isCancelled ? "DIBATALKAN" : "LUNAS (PAID)"}
                            </Text>
                          </View>
                        </View>

                        {/* Rute & Tanggal */}
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 10,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            backgroundColor: theme.inputBg,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "700",
                              color: theme.textPrimary,
                            }}
                          >
                            {displayRoute}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.textSecondary,
                              fontWeight: "500",
                            }}
                          >
                            📅 {bk.travel_date}
                          </Text>
                        </View>

                        {/* Info Penumpang & Kursi */}
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: 10,
                          }}
                        >
                          <View>
                            <Text
                              style={{
                                fontSize: 11,
                                color: theme.textSecondary,
                              }}
                            >
                              Nama Penumpang
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: theme.textPrimary,
                              }}
                            >
                              {bk.passenger_name}
                            </Text>
                          </View>
                          <View style={{ alignItems: "center" }}>
                            <Text
                              style={{
                                fontSize: 11,
                                color: theme.textSecondary,
                              }}
                            >
                              Nomor Kursi
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: colors.primary,
                              }}
                            >
                              {cleanSeat}
                            </Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text
                              style={{
                                fontSize: 11,
                                color: theme.textSecondary,
                              }}
                            >
                              Total Bayar
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "800",
                                color: colors.activeOrange,
                              }}
                            >
                              {formatRupiah(bk.total_price)}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.cardDivider,
                            { backgroundColor: theme.border, marginVertical: 12 },
                          ]}
                        />

                        {/* Tombol Aksi CRUD Tiket */}
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "flex-end",
                          }}
                        >
                          {!isCancelled ? (
                            <TouchableOpacity
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 14,
                                backgroundColor: "#FEE2E2",
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: "#FCA5A5",
                              }}
                              onPress={() => handleBatalkanTiket(bk.id)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "700",
                                  color: "#DC2626",
                                }}
                              >
                                Batalkan Tiket (UPDATE)
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 14,
                                backgroundColor: "#F1F5F9",
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: "#CBD5E1",
                              }}
                              onPress={() => handleHapusTiket(bk.id)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: "#64748B",
                                }}
                              >
                                Hapus Riwayat (DELETE)
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* TAB BANTUAN */}
          {activeTab === "bantuan" && (
            <View style={styles.tabContentContainer}>
              <View style={styles.tabContentHeader}>
                <Text
                  style={[styles.tabContentTitle, { color: theme.textPrimary }]}
                >
                  Pusat Bantuan
                </Text>
                <Text
                  style={[styles.tabContentSub, { color: theme.textSecondary }]}
                >
                  Layanan 24/7 Keretaku Customer Care
                </Text>
              </View>

              <View style={styles.helpCardsList}>
                <View
                  style={[
                    styles.helpCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={styles.helpCardIcon}>📞</Text>
                  <View style={styles.helpCardContent}>
                    <Text
                      style={[
                        styles.helpCardTitle,
                        { color: theme.textPrimary },
                      ]}
                    >
                      Contact Center 121
                    </Text>
                    <Text
                      style={[
                        styles.helpCardDesc,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Bebas pulsa untuk keluhan dan info jadwal
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.helpCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={styles.helpCardIcon}>💬</Text>
                  <View style={styles.helpCardContent}>
                    <Text
                      style={[
                        styles.helpCardTitle,
                        { color: theme.textPrimary },
                      ]}
                    >
                      Live Chat WhatsApp
                    </Text>
                    <Text
                      style={[
                        styles.helpCardDesc,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Respon cepat admin 24 jam
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.helpCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={styles.helpCardIcon}>❓</Text>
                  <View style={styles.helpCardContent}>
                    <Text
                      style={[
                        styles.helpCardTitle,
                        { color: theme.textPrimary },
                      ]}
                    >
                      Panduan Reschedule & Refund
                    </Text>
                    <Text
                      style={[
                        styles.helpCardDesc,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Tata cara pembatalan dan ubah jadwal
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TAB AKUN */}
          {activeTab === "akun" && (
            <View style={styles.tabContentContainer}>
              <View style={styles.tabContentHeader}>
                <Text
                  style={[styles.tabContentTitle, { color: theme.textPrimary }]}
                >
                  Profil Akun
                </Text>
                <Text
                  style={[styles.tabContentSub, { color: theme.textSecondary }]}
                >
                  Kelola data penumpang & tampilan
                </Text>
              </View>

              <View
                style={[
                  styles.profileCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>
                    {user
                      ? (
                          user.user_metadata?.full_name ||
                          user.email ||
                          "KT"
                        )
                          .slice(0, 2)
                          .toUpperCase()
                      : "?"}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text
                    style={[styles.profileName, { color: theme.textPrimary }]}
                  >
                    {user
                      ? user.user_metadata?.full_name ||
                        user.email?.split("@")[0] ||
                        "Pengguna Keretaku"
                      : "Mode Tamu"}
                  </Text>
                  <Text
                    style={[
                      styles.profileEmail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {user ? user.email : "Belum masuk ke akun"}
                  </Text>
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>
                      {user ? "Akun Supabase Terverifikasi" : "Tamu"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* TOMBOL LOGIN / LOGOUT SUPABASE */}
              <View style={{ marginBottom: 16 }}>
                {user ? (
                  <TouchableOpacity
                    style={[
                      styles.tabActionButton,
                      {
                        backgroundColor: "#FEE2E2",
                        borderWidth: 1,
                        borderColor: "#FCA5A5",
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS === "web" && typeof window !== "undefined") {
                        const confirmed = window.confirm(
                          "Keluar dari Akun:\nApakah Anda yakin ingin keluar?"
                        );
                        if (confirmed) {
                          signOut().then(() => setActiveTab("beranda"));
                        }
                        return;
                      }
                      Alert.alert(
                        "Keluar dari Akun",
                        "Apakah Anda yakin ingin keluar?",
                        [
                          { text: "Batal", style: "cancel" },
                          {
                            text: "Keluar",
                            style: "destructive",
                            onPress: async () => {
                              await signOut();
                              setActiveTab("beranda");
                            },
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabActionButtonText,
                        { color: "#DC2626", fontWeight: "700" },
                      ]}
                    >
                      🚪 Keluar dari Akun (Logout)
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.tabActionButton}
                    onPress={() => router.push("/login" as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tabActionButtonText}>
                      🔐 Masuk / Daftar Akun Keretaku
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* TOGGLE SWITCH DARK MODE */}
              <View
                style={[
                  styles.profileCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 22, marginRight: 12 }}>
                      {isDarkMode ? "🌙" : "☀️"}
                    </Text>
                    <View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: theme.textPrimary,
                        }}
                      >
                        Mode Gelap (Dark Mode)
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: theme.textSecondary }}
                      >
                        {isDarkMode
                          ? "Tampilan gelap aktif"
                          : "Tampilan terang aktif"}
                      </Text>
                    </View>
                  </View>

                  <Switch
                    value={isDarkMode}
                    onValueChange={(val) => setIsDarkMode(val)}
                    trackColor={{ false: "#CBD5E1", true: colors.primary }}
                    thumbColor={isDarkMode ? colors.activeOrange : "#FFFFFF"}
                    accessibilityLabel="Toggle Dark Mode"
                  />
                </View>
              </View>

              <View
                style={[
                  styles.accountMenuWrapper,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                {[
                  "Daftar Penumpang Tersimpan",
                  "Riwayat Transaksi",
                  "Pengaturan Bahasa",
                  "Tentang Aplikasi Keretaku",
                ].map((menu, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.accountMenuItem,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.accountMenuText,
                        { color: theme.textPrimary },
                      ]}
                    >
                      {menu}
                    </Text>
                    <Text
                      style={[
                        styles.accountMenuChevron,
                        { color: theme.textSecondary },
                      ]}
                    >
                      ›
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View
          style={[
            styles.bottomNavContainer,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 10),
            },
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
              {activeTab === "beranda" && (
                <View style={styles.activeTabIndicatorDot} />
              )}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                { color: theme.textSecondary },
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
              {activeTab === "tiket" && (
                <View style={styles.activeTabIndicatorDot} />
              )}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                { color: theme.textSecondary },
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
              {activeTab === "bantuan" && (
                <View style={styles.activeTabIndicatorDot} />
              )}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                { color: theme.textSecondary },
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
              {activeTab === "akun" && (
                <View style={styles.activeTabIndicatorDot} />
              )}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                { color: theme.textSecondary },
                activeTab === "akun" && styles.bottomNavLabelActive,
              ]}
            >
              Akun
            </Text>
          </TouchableOpacity>
        </View>

        {/* MODAL PEMILIHAN STASIUN */}
        <Modal
          visible={stationModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setStationModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text
                    style={[
                      styles.modalTitleText,
                      { color: theme.textPrimary },
                    ]}
                  >
                    Pilih Stasiun {pickingFor === "asal" ? "Asal" : "Tujuan"}
                  </Text>
                  <Text
                    style={[
                      styles.modalSubtitleText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Cari berdasarkan nama stasiun, kota, atau kode
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.modalCloseCircle,
                    { backgroundColor: theme.inputBg },
                  ]}
                  onPress={() => setStationModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Tutup Modal Stasiun"
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: theme.textPrimary },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Pencarian Stasiun */}
              <View
                style={[
                  styles.modalSearchBox,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                ]}
              >
                <Text style={styles.modalSearchIcon}>🔍</Text>
                <TextInput
                  style={[
                    styles.modalSearchInput,
                    { color: theme.textPrimary },
                  ]}
                  placeholder="Contoh: Pasar Senen, SGU, Bandung..."
                  placeholderTextColor={theme.textSecondary}
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
                {availableCities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.cityFilterChip,
                      { backgroundColor: theme.inputBg },
                      selectedCityFilter === city &&
                        styles.cityFilterChipActive,
                    ]}
                    onPress={() => setSelectedCityFilter(city)}
                  >
                    <Text
                      style={[
                        styles.cityFilterChipText,
                        { color: theme.textSecondary },
                        selectedCityFilter === city &&
                          styles.cityFilterChipTextActive,
                      ]}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* List Stasiun */}
              {loadingStasiun ? (
                <View
                  style={{
                    padding: 24,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: theme.textSecondary,
                    }}
                  >
                    Memuat stasiun Jawa Timur dari API Wilayah...
                  </Text>
                </View>
              ) : (
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
                          { borderBottomColor: theme.border },
                          isCurrent && styles.stationListItemCurrent,
                        ]}
                        onPress={() => handleSelectStation(stasiun)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.stationListItemLeft}>
                          <View
                            style={[
                              styles.stationCodeBadge,
                              { backgroundColor: theme.inputBg },
                            ]}
                          >
                            <Text style={styles.stationCodeBadgeText}>
                              {stasiun.kode}
                            </Text>
                          </View>
                          <View style={styles.stationNameInfo}>
                            <Text
                              style={[
                                styles.stationItemName,
                                { color: theme.textPrimary },
                              ]}
                            >
                              {stasiun.nama}
                            </Text>
                            <Text
                              style={[
                                styles.stationItemCity,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {stasiun.kota}
                            </Text>
                          </View>
                        </View>
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>
                              Terpilih
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* MODAL PEMILIHAN TANGGAL CEPAT */}
        <Modal
          visible={dateModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDateModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[styles.dateModalCard, { backgroundColor: theme.card }]}
            >
              <View style={styles.modalHeaderRow}>
                <Text
                  style={[styles.modalTitleText, { color: theme.textPrimary }]}
                >
                  Pilih Tanggal {dateModalType === "pergi" ? "Pergi" : "Pulang"}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.modalCloseCircle,
                    { backgroundColor: theme.inputBg },
                  ]}
                  onPress={() => setDateModalVisible(false)}
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: theme.textPrimary },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateOptionsList}>
                {dateOptions.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dateOptionItem,
                      { borderBottomColor: theme.border },
                    ]}
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
                      <Text
                        style={[
                          styles.dateOptionLabel,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.dateOptionValue,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {opt.date}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.dateOptionArrow,
                        { color: theme.textSecondary },
                      ]}
                    >
                      ›
                    </Text>
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

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    alignItems: "center",
  },
  responsiveContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    position: "relative",
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 95,
  },

  // NAVBAR
  navbar: {
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

  // HERO SECTION
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 46,
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

  // FORM PEMESANAN
  formCard: {
    marginHorizontal: 16,
    marginTop: -26,
    borderRadius: 24,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
      },
    }),
    borderWidth: 1,
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
    borderRadius: 16,
    borderWidth: 1,
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
    fontWeight: "600",
    textTransform: "uppercase",
  },
  stationCode: {
    fontSize: 22,
    fontWeight: "800",
  },
  stationName: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
  stationCity: {
    fontSize: 11,
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
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
    marginBottom: 6,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
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
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
  },
  counterBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  counterBtnDisabled: {
    opacity: 0.4,
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
  },
  counterLabelText: {
    fontSize: 10,
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
    borderWidth: 1,
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

  // RESULTS SECTION
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
  },
  resultsSubtitle: {
    fontSize: 12,
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
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
    fontWeight: "500",
  },
  emptyStateBox: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
  },
  emptyStateEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 12,
    textAlign: "center",
  },

  // Train Card
  trainCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
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
  },
  journeyStation: {
    fontSize: 12,
    fontWeight: "600",
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
    marginVertical: 12,
  },
  trainCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pricePerPersonLabel: {
    fontSize: 10,
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

  // BOTTOM NAVIGATION
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 8,
    zIndex: 100,
  },
  bottomNavItem: {
    flex: 1,
    minHeight: 52,
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
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: colors.activeOrange,
    fontWeight: "700",
  },

  // TAB CONTENT
  tabContentContainer: {
    padding: 20,
  },
  tabContentHeader: {
    marginBottom: 20,
  },
  tabContentTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  tabContentSub: {
    fontSize: 13,
    marginTop: 3,
  },
  ticketEmptyCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
  },
  ticketEmptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  ticketEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  ticketEmptyText: {
    fontSize: 13,
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
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
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
  },
  helpCardDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  profileCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 14,
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
  },
  profileEmail: {
    fontSize: 12,
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
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  accountMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  accountMenuText: {
    fontSize: 14,
    fontWeight: "600",
  },
  accountMenuChevron: {
    fontSize: 18,
  },

  // MODALS
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
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
  },
  modalSubtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
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
  },
  cityFilterChipActive: {
    backgroundColor: colors.primary,
  },
  cityFilterChipText: {
    fontSize: 12,
    fontWeight: "600",
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
  },
  stationItemCity: {
    fontSize: 12,
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
  },
  dateOptionLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  dateOptionValue: {
    fontSize: 12,
    marginTop: 2,
  },
  dateOptionArrow: {
    fontSize: 18,
  },

  // Weather Widget Styles
  weatherCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
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
      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      },
    }),
  },
  weatherHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weatherTitleBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  weatherCityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  weatherBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weatherTempContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: 10,
  },
  weatherTempText: {
    fontSize: 28,
    fontWeight: "800",
  },
  weatherConditionContainer: {
    flex: 1,
    marginLeft: 12,
  },
  weatherConditionText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
    flexWrap: "wrap",
  },
  weatherDescText: {
    fontSize: 11,
    marginTop: 2,
  },
  weatherHumidityText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
    textAlign: "left",
    flexWrap: "wrap",
  },
});
