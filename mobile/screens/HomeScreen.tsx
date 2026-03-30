import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import api from '../services/api';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations }: any = data;
    const loc = locations[0];
    try {
      await api.post('/location-pings', {
        hex_id: '89618928cajff', // Mocked or calculated safely client-side usually
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy_radius: loc.coords.accuracy,
        mock_location_flag: loc.mocked || false
      });
    } catch(e) {
      console.log('Telemetry failed');
    }
  }
});

export default function HomeScreen({ navigation }: any) {
  const [policy, setPolicy] = useState<any>(null);
  const [dci_score, setDciScore] = useState<number>(0);
  
  useEffect(() => {
    (async () => {
      try {
        const polRes = await api.get('/workers/me/policy');
        setPolicy(polRes.data);
      } catch (e) {
        console.log("No policy");
      }
      
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15 * 60 * 1000, 
        });
      }
    })();
  }, []);

  const getDciColor = (score: number) => {
    if (score > 0.85) return 'red';
    if (score > 0.65) return 'orange';
    return 'green';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {policy ? (
        <View style={styles.card}>
          <Text style={styles.text}>Active Tier: {policy.tier}</Text>
          <Text style={styles.text}>Weekly Premium: ₹{policy.weekly_premium}</Text>
          <Text style={styles.text}>Coverage Cap: ₹{policy.coverage_cap_daily}</Text>
        </View>
      ) : (
        <Text>No Active Policy</Text>
      )}

      <View style={[styles.card, { backgroundColor: getDciColor(dci_score) }]}>
        <Text style={[styles.text, {color: 'white'}]}>Current Zone DCI: {dci_score.toFixed(2)}</Text>
      </View>

      <Button title="View Payouts" onPress={() => navigation.navigate('Payouts')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 20, borderRadius: 10, marginVertical: 10, backgroundColor: '#f0f0f0' },
  text: { fontSize: 16 }
});
