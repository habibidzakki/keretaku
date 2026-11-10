import {
  OpenWeatherApiResponse,
  PaymentRequest,
  PaymentResult,
  RegencyResponse,
  Stasiun,
  WeatherData,
} from "@/types";

const STASIUN_KODE_MAP: Record<string, string> = {
  SURABAYA: "SGU",
  MALANG: "ML",
  BANYUWANGI: "BW",
  JEMBER: "JR",
  MADIUN: "MN",
  KEDIRI: "KD",
  BLITAR: "BL",
  PASURUAN: "PS",
  PROBOLINGGO: "PB",
  SIDOARJO: "SDA",
  MOJOKERTO: "MR",
  JOMBANG: "JG",
  LAMONGAN: "LMG",
  BOJONEGORO: "BJ",
  TULUNGAGUNG: "TA",
};

export const fetchStasiunWilayah = (): Promise<Stasiun[]> => {
  return new Promise<Stasiun[]>((resolve, reject) => {
    // API Wilayah Indonesia - Kabupaten/Kota di Jawa Timur (Provinsi ID: 35)
    // Menggunakan endpoint resmi https://www.emsifa.com/api-wilayah-indonesia/api/regencies/35.json
    // yang mendukung CORS (Access-Control-Allow-Origin: *) dan SSL penuh untuk Web & Mobile.
    const url =
      "https://www.emsifa.com/api-wilayah-indonesia/api/regencies/35.json";

    fetch(url)
      .then((response: Response) => {
        if (!response.ok) {
          throw new Error(
            `Gagal mengambil data wilayah Jawa Timur: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data: RegencyResponse[]) => {
        if (!Array.isArray(data) || data.length === 0) {
          return reject(
            new Error("Format data API Wilayah kosong atau tidak sesuai")
          );
        }

        const seen = new Set<string>();
        const daftarStasiun: Stasiun[] = [];

        data.forEach((item) => {
          const rawCity = item.name
            .replace(/^(KABUPATEN|KOTA)\s+/i, "")
            .trim();

          const upperRaw = rawCity.toUpperCase();
          if (seen.has(upperRaw)) {
            return;
          }
          seen.add(upperRaw);

          const formattedCity = rawCity
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          const kode =
            STASIUN_KODE_MAP[upperRaw] ||
            rawCity.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() ||
            "STN";

          daftarStasiun.push({
            kode,
            nama: `Stasiun ${formattedCity}`,
            kota: formattedCity,
          });
        });

        resolve(daftarStasiun);
      })
      .catch((error: Error) => {
        console.warn("fetchStasiunWilayah fallback aktif:", error.message);
        reject(error);
      });
  });
};

export const fetchCuacaKota = (kota: string): Promise<WeatherData> => {
  return new Promise<WeatherData>((resolve, reject) => {
    if (!kota || kota.trim() === "") {
      return reject(new Error("Parameter kota tujuan tidak boleh kosong"));
    }

    const cleanCity = kota
      .replace(/^(Stasiun|Kabupaten|Kota)\s+/i, "")
      .replace(/\s*\([^)]*\)/g, "")
      .trim();

    const API_KEY = "bd5e378503939ddaee76f12ad7a97608";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      cleanCity
    )},ID&units=metric&appid=${API_KEY}`;

    fetch(url)
      .then((res: Response) => res.json())
      .then((data: OpenWeatherApiResponse) => {
        if (data.cod !== 200 && data.cod !== "200") {
          const fallbackData: WeatherData = {
            kota: cleanCity,
            temp: 29 + Math.floor(Math.random() * 4),
            kondisi: "Cerah Berawan",
            deskripsi: "Perkiraan cuaca cerah untuk perjalanan kereta",
            kelembaban: 72,
            icon: "⛅",
          };
          return resolve(fallbackData);
        }

        const rawCondition = data.weather[0]?.main || "Cerah";
        let icon = "☀️";
        if (rawCondition.toLowerCase().includes("rain")) icon = "🌧️";
        else if (rawCondition.toLowerCase().includes("cloud")) icon = "⛅";
        else if (rawCondition.toLowerCase().includes("thunder")) icon = "⛈️";

        const weatherResult: WeatherData = {
          kota: data.name || cleanCity,
          temp: Math.round(data.main.temp),
          kondisi: data.weather[0]?.main || "Cerah",
          deskripsi: data.weather[0]?.description || "Cerah",
          kelembaban: data.main.humidity,
          icon,
        };

        resolve(weatherResult);
      })
      .catch((err: Error) => {
        console.warn("fetchCuacaKota fallback triggered:", err.message);
        const offlineData: WeatherData = {
          kota: cleanCity,
          temp: 30,
          kondisi: "Cerah",
          deskripsi: "Cuaca normal terpantau aman untuk bepergian",
          kelembaban: 68,
          icon: "☀️",
        };
        resolve(offlineData);
      });
  });
};

export const fetchCuacaKotaAsync = async (
  kota: string
): Promise<WeatherData> => {
  try {
    const data = await fetchCuacaKota(kota);
    return data;
  } catch (error) {
    throw error;
  }
};

export const prosesSimulasiPembayaran = (
  request: PaymentRequest
): Promise<PaymentResult> => {
  return new Promise<PaymentResult>((resolve, reject) => {
    if (!request || request.totalHarga <= 0 || request.jumlahTiket <= 0) {
      return reject(
        new Error(
          "Validasi pembayaran gagal: Jumlah tiket atau total harga tidak valid!"
        )
      );
    }

    setTimeout(() => {
      const isSuccess = true;

      if (isSuccess) {
        const result: PaymentResult = {
          success: true,
          transactionId: `KAI-PAY-${Date.now()}-${Math.floor(
            1000 + Math.random() * 9000
          )}`,
          message: `Pembayaran tiket kereta ${request.namaKereta} (${request.jumlahTiket} penumpang) berhasil diverifikasi.`,
          timestamp: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          totalBayar: request.totalHarga,
        };
        resolve(result);
      } else {
        reject(
          new Error(
            "Pembayaran ditolak: Koneksi payment gateway terputus atau saldo tidak mencukupi."
          )
        );
      }
    }, 2000);
  });
};
