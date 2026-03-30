import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../services/api';

export default function PayoutHistoryScreen() {
  const [claims, setClaims] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/claims');
        setClaims(res.data);
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Claim & Payout History</Text>
      <FlatList
        data={claims}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>Amount: ₹{item.payout_amount || 0}</Text>
            <Text style={styles.text}>Status: {item.status}</Text>
            <Text style={styles.text}>Path: {item.resolution_path}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  text: { fontSize: 16 }
});
