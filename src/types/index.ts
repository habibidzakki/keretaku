export interface Stasiun {
  kode: string;
  nama: string;
  kota: string;
}

export interface RegencyResponse {
  id: string;
  province_id: string;
  name: string;
}

export interface WeatherData {
  kota: string;
  temp: number;
  kondisi: string;
  deskripsi: string;
  kelembaban?: number;
  icon?: string;
}

export interface OpenWeatherApiResponse {
  coord?: { lon: number; lat: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  main: {
    temp: number;
    feels_like?: number;
    temp_min?: number;
    temp_max?: number;
    pressure?: number;
    humidity: number;
  };
  name: string;
  cod: number | string;
  message?: string;
}

export interface PaymentRequest {
  namaKereta: string;
  totalHarga: number;
  jumlahTiket: number;
  asal: string;
  tujuan: string;
  gerbong?: string;
  kursi?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
  timestamp: string;
  totalBayar: number;
}

export interface Kereta {
  id: number;
  nama: string;
  waktu: string;
  durasi: number;
  harga: number;
  kelas: string;
  sisaKursi: number;
}
