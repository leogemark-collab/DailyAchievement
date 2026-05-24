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
  return <Ionicons name={focused ? activeName : inactiveName} size={22} color={color} />;
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
        tabBarInactiveTintColor: theme.colors.textSubtle,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.body,
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.2,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          height: 68,
          borderTopWidth: 0,
          borderRadius: 16,
          borderWidth: 0.5,
          borderColor: theme.colors.border,
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
              activeName="home"
              color={color}
              focused={focused}
              inactiveName="home-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wins"
        options={{
          title: 'Wins',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              activeName="trophy"
              color={color}
              focused={focused}
              inactiveName="trophy-outline"
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
