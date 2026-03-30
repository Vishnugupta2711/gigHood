import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { sendOtp, verifyOtp, register } from '../services/auth';

export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    dark_store_zone: '',
    avg_daily_earnings: '500',
    upi_id: '',
  });

  const handleSendOtp = async () => {
    try {
      await sendOtp(phone);
      setStep('otp');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      // Stub check: in our mock, verifying new user sends them to register
      const res = await verifyOtp(phone, otp);
      if (res.is_new_user) {
        setStep('register');
      } else {
        navigation.replace('Home');
      }
    } catch (e: any) {
      // In MVP assume they are new worker for demo
      setStep('register');
    }
  };

  const handleRegister = async () => {
    try {
      await register({
        phone,
        ...formData,
        avg_daily_earnings: Number(formData.avg_daily_earnings),
        device_model: 'generic_android',
        device_os_version: '12',
      });
      navigation.replace('Home');
    } catch (e: any) {
      Alert.alert('Error', 'Registration Failed');
    }
  };

  if (step === 'phone') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to gigHood</Text>
        <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button title="Send OTP" onPress={handleSendOtp} />
      </View>
    );
  }

  if (step === 'otp') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enter OTP</Text>
        <TextInput style={styles.input} placeholder="OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
        <Button title="Verify" onPress={handleVerifyOtp} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Profile</Text>
      <TextInput style={styles.input} placeholder="Name" value={formData.name} onChangeText={(t) => setFormData({ ...formData, name: t })} />
      <TextInput style={styles.input} placeholder="City" value={formData.city} onChangeText={(t) => setFormData({ ...formData, city: t })} />
      <TextInput style={styles.input} placeholder="Dark Store Zone" value={formData.dark_store_zone} onChangeText={(t) => setFormData({ ...formData, dark_store_zone: t })} />
      <TextInput style={styles.input} placeholder="UPI ID" value={formData.upi_id} onChangeText={(t) => setFormData({ ...formData, upi_id: t })} />
      <TextInput style={styles.input} placeholder="Avg Daily Earnings" value={formData.avg_daily_earnings} onChangeText={(t) => setFormData({ ...formData, avg_daily_earnings: t })} keyboardType="numeric" />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }
});
