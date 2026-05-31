import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Landmark, Store, Users } from 'lucide-react-native';
import Dashboard from '../screens/Dashboard';
import Lending from '../screens/Lending';
import Marketplace from '../screens/Marketplace';
import DAO from '../screens/DAO';
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
        name="Lending" 
        component={Lending} 
        options={{
          tabBarIcon: ({ color, size }) => <Landmark size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Mercado" 
        component={Marketplace} 
        options={{
          tabBarIcon: ({ color, size }) => <Store size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="DAO" 
        component={DAO} 
        options={{
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}
