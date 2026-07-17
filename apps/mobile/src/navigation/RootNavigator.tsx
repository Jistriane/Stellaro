import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ArrowLeftRight, History, LayoutDashboard, MessageCircle } from 'lucide-react-native';
import Dashboard from '../screens/Dashboard';
import Trade from '../screens/Trade';
import HistoryScreen from '../screens/History';
import Support from '../screens/Support';
import { theme } from '../lib/theme';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.bg2,
          borderTopWidth: 1,
          borderTopColor: theme.colors.rule,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: theme.colors.inkDim,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.mono,
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tab.Screen 
        name="Início" 
        component={Dashboard} 
        options={{
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Trade" 
        component={Trade} 
        options={{
          tabBarIcon: ({ color, size }) => <ArrowLeftRight size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Histórico" 
        component={HistoryScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Suporte" 
        component={Support} 
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}
