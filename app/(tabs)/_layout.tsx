import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getTheme } from '@/constants/theme-utils';
import { useTheme } from '@/hooks/use-theme';

type TabIconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  activeName,
  color,
  focused,
  inactiveName,
}: {
  activeName: TabIconName;
  color: string;
  focused: boolean;
  inactiveName: TabIconName;
}) {
  return <Ionicons name={focused ? activeName : inactiveName} size={focused ? 22 : 20} color={color} />;
}

export default function TabsLayout() {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.body,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          marginVertical: 8,
          borderRadius: 18,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 18,
          height: 78,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopWidth: 0,
          borderRadius: 28,
          backgroundColor: theme.colors.surface,
          ...theme.shadows.card,
        },
        tabBarBackground: () => null,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              activeName="sparkles"
              color={color}
              focused={focused}
              inactiveName="sparkles-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wins"
        options={{
          title: 'Moments',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              activeName="albums"
              color={color}
              focused={focused}
              inactiveName="albums-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              activeName="calendar"
              color={color}
              focused={focused}
              inactiveName="calendar-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              activeName="person-circle"
              color={color}
              focused={focused}
              inactiveName="person-circle-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}
