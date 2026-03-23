import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

import { safeAsyncStorage } from '@/utils/safe-storage';

const REMINDER_ENABLED_KEY = 'reminderEnabled';
const REMINDER_ID_KEY = 'reminderId';

const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let handlerReady = false;
const isExpoGo = Constants.appOwnership === 'expo';

const getNotifications = async (): Promise<NotificationsModule | null> => {
  if (isExpoGo) return null;
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }
  if (notificationsModule && !handlerReady) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerReady = true;
  }
  return notificationsModule;
};

const ensureNotificationChannel = async (Notifications: NotificationsModule) => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('daily-reminders', {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const requestPermissions = async (Notifications: NotificationsModule) => {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
};

const scheduleReminder = async (Notifications: NotificationsModule) => {
  await ensureNotificationChannel(Notifications);
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
      const stored = await safeAsyncStorage.getItem(REMINDER_ENABLED_KEY);
      setEnabled(stored === 'true');
      setLoading(false);
    };
    load();
  }, []);

  const toggleReminder = useCallback(async (nextValue: boolean) => {
    const Notifications = await getNotifications();
    if (!Notifications) {
      Alert.alert(
        'Reminders Unavailable',
        'Daily reminders need a development build (not Expo Go).'
      );
      return false;
    }

    if (nextValue) {
      const granted = await requestPermissions(Notifications);
      if (!granted) {
        Alert.alert('Notifications Disabled', 'Enable notifications to receive daily reminders.');
        return false;
      }
      const reminderId = await scheduleReminder(Notifications);
      await safeAsyncStorage.setItem(REMINDER_ID_KEY, reminderId);
      await safeAsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
      setEnabled(true);
      return true;
    }

    const existingId = await safeAsyncStorage.getItem(REMINDER_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }
    await safeAsyncStorage.removeItem(REMINDER_ID_KEY);
    await safeAsyncStorage.removeItem(REMINDER_ENABLED_KEY);
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
