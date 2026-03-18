import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const REMINDER_ENABLED_KEY = 'reminderEnabled';
const REMINDER_ID_KEY = 'reminderId';

const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ensureNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('daily-reminders', {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const requestPermissions = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
};

const scheduleReminder = async () => {
  await ensureNotificationChannel();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to log a small win',
      body: 'Take 30 seconds to celebrate your progress today.',
    },
    trigger: {
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
      repeats: true,
      channelId: Platform.OS === 'android' ? 'daily-reminders' : undefined,
    },
  });
};

export function useReminder() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
      setEnabled(stored === 'true');
      setLoading(false);
    };
    load();
  }, []);

  const toggleReminder = useCallback(async (nextValue: boolean) => {
    if (nextValue) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Notifications Disabled', 'Enable notifications to receive daily reminders.');
        return false;
      }
      const reminderId = await scheduleReminder();
      await AsyncStorage.setItem(REMINDER_ID_KEY, reminderId);
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
      setEnabled(true);
      return true;
    }

    const existingId = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }
    await AsyncStorage.multiRemove([REMINDER_ID_KEY, REMINDER_ENABLED_KEY]);
    setEnabled(false);
    return true;
  }, []);

  return {
    enabled,
    loading,
    toggleReminder,
    reminderTimeLabel: 'Daily at 8:00 PM',
  };
}
