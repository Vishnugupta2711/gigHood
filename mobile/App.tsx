import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";

import OnboardingScreen from "./screens/OnboardingScreen";
import HomeScreen from "./screens/HomeScreen";
import PayoutHistoryScreen from "./screens/PayoutHistoryScreen";
import TierUpgradeScreen from "./screens/TierUpgradeScreen";
import api from "./services/api";

const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  useEffect(() => {
    // Attempt setting up listener manually
    const setupFCM = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Enable notifications for payouts.");
        return;
      }

      try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        // Optionally bind this to backend if JWT already exists
        await api
          .post("/workers/me/device-token", { device_token: token })
          .catch(() => {});
      } catch (error) {
        console.error("FCM Token Fetch Error", error);
      }
    };

    setupFCM();

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        Alert.alert("gigHood Update", notification.request.content.body || "");
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding">
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "gigHood Dashboard" }}
        />
        <Stack.Screen
          name="Payouts"
          component={PayoutHistoryScreen}
          options={{ title: "History" }}
        />
        <Stack.Screen
          name="TierUpgrade"
          component={TierUpgradeScreen}
          options={{ title: "Upgrade Tier" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
