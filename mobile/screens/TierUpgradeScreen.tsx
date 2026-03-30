import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import api from '../services/api';

export default function TierUpgradeScreen({ navigation }: any) {
  const handleUpgrade = async () => {
    try {
      await api.post('/policies/upgrade-tier');
      Alert.alert('Success', 'Tier upgraded successfully for next week.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not upgrade tier.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Predictive Risk Alert</Text>
      <Text style={styles.text}>Your zone's DCI forecast is elevated for next week.</Text>
      <Text style={styles.text}>Upgrade your Tier to increase daily coverage caps.</Text>
      
      <View style={styles.card}>
        <Button title="Upgrade Policy Tier Now" onPress={handleUpgrade} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: 'orange' },
  text: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
  card: { marginTop: 30 }
});
