import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Landmark, Store, Users } from 'lucide-react-native';
import Dashboard from '../screens/Dashboard';
import Lending from '../screens/Lending';
import Marketplace from '../screens/Marketplace';
import DAO from '../screens/DAO';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopWidth: 0,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
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
