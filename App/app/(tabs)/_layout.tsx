import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import TopHeader from '@/components/TopHeader';
import MobileSidebar from '@/components/MobileSidebar';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0F141B' : '#F4F7FB' }}>
      <TopHeader title="Adaptive Reader" onMenuPress={() => setSidebarOpen(true)} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="reader" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="profile" />
      </Stack>
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </View>
  );
}
