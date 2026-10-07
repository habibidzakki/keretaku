import { View, Text, StyleSheet, FlatList, Pressable, Platform } from 'react-native';

// 1. Menerapkan Type / Interface
interface TiketKereta {
  id: string;
  namaKereta: string;
  kelas: string;
  jamBerangkat: string;
  harga: number;
}

// 2. Menerapkan Array of Objects
const daftarTiket: TiketKereta[] = [
  { id: '1', namaKereta: 'Argo Bromo Anggrek', kelas: 'Eksekutif', jamBerangkat: '08:00', harga: 450000 },
  { id: '2', namaKereta: 'Matarmaja', kelas: 'Ekonomi', jamBerangkat: '10:30', harga: 150000 },
  { id: '3', namaKereta: 'Gajayana', kelas: 'Eksekutif', jamBerangkat: '15:00', harga: 550000 },
  { id: '4', namaKereta: 'Pasundan', kelas: 'Ekonomi', jamBerangkat: '18:15', harga: 120000 },
];

export default function Index() {
  // 3. Menerapkan Custom Function
  const renderTicketCard = ({ item }: { item: TiketKereta }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.trainName}>{item.namaKereta}</Text>
        {/* 4. Menerapkan Inline Style: Warna berubah otomatis tergantung kelas kereta */}
        <Text style={[styles.trainClass, { color: item.kelas === 'Eksekutif' ? '#f59e0b' : '#3b82f6' }]}>
          {item.kelas}
        </Text>
      </View>
      
      <Text style={styles.time}>Berangkat: {item.jamBerangkat}</Text>
      <Text style={styles.price}>Rp {item.harga.toLocaleString('id-ID')}</Text>
      
      <Pressable style={styles.button} onPress={() => alert(`Tiket ${item.namaKereta} dipilih!`)}>
        <Text style={styles.buttonText}>Pesan Tiket</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aplikasi Keretaku</Text>
      
      {/* 5. Menerapkan Loop menggunakan FlatList (Lebih optimal dari .map untuk daftar panjang) */}
      <FlatList
        data={daftarTiket}
        keyExtractor={(item) => item.id}
        renderItem={renderTicketCard}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

// 6. Menerapkan External Style
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f1f5f9',
    // Memberikan jarak 80px khusus web agar tidak tertutup header, dan 40px untuk HP
    paddingTop: Platform.OS === 'web' ? 80 : 40,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20, 
    color: '#0f172a' 
  },
  listContainer: { 
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: { 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16, 
    elevation: 3, // Shadow untuk Android
    shadowColor: '#000', // Shadow untuk iOS
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  trainName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  trainClass: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  time: { 
    fontSize: 14, 
    color: '#64748b', 
    marginBottom: 12 
  },
  price: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#10b981', 
    marginBottom: 16 
  },
  button: { 
    backgroundColor: '#2563eb', 
    paddingVertical: 10, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});