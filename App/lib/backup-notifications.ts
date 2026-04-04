import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const BACKUP_REMINDER_NOTIFICATION_KEY = 'backup_reminder_notification_id_v1';
const BACKUP_CHANNEL_ID = 'backup-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function initializeBackupNotifications(): Promise<void> {
  if (process.env.EXPO_OS === 'android') {
    await Notifications.setNotificationChannelAsync(BACKUP_CHANNEL_ID, {
      name: 'Backup reminders',
      description: 'Daily reminders to keep your reader data backed up.',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
    });
  }
}

async function ensurePermission(): Promise<boolean> {
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function cancelBackupReminderNotification(): Promise<void> {
  const existing = await AsyncStorage.getItem(BACKUP_REMINDER_NOTIFICATION_KEY);
  if (!existing) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(existing);
  await AsyncStorage.removeItem(BACKUP_REMINDER_NOTIFICATION_KEY);
}

export async function scheduleBackupReminderNotification(): Promise<boolean> {
  const granted = await ensurePermission();
  if (!granted) {
    return false;
  }

  await cancelBackupReminderNotification();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Backup reminder',
      body: 'Save a fresh backup to Google Drive to protect your reading data.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 20,
      minute: 0,
      repeats: true,
      channelId: process.env.EXPO_OS === 'android' ? BACKUP_CHANNEL_ID : undefined,
    },
  });

  await AsyncStorage.setItem(BACKUP_REMINDER_NOTIFICATION_KEY, notificationId);
  return true;
}