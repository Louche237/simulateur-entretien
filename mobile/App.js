import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors } from './src/theme';
import { getToken, getUser } from './src/utils/api';

import AuthScreen from './src/screens/AuthScreen';
import Dashboard from './src/screens/Dashboard';
import Simulation from './src/screens/Simulation';
import Entretien from './src/screens/Entretien';
import AnalyseCV from './src/screens/AnalyseCV';
import Historique from './src/screens/Historique';
import Parametres from './src/screens/Parametres';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const TabIcon = ({ focused, icon, label }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', top: 2 }}>
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>{icon}</Text>
    <Text style={{
      fontSize: 10,
      color: focused ? colors.primary : colors.textLight,
      marginTop: 2,
      fontWeight: focused ? '700' : '500',
    }}>{label}</Text>
  </View>
);

const AppTabs = () => (
  <Tabs.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        height: 64,
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingBottom: 8,
        paddingTop: 6,
      },
    }}
  >
    <Tabs.Screen
      name="Dashboard"
      component={Dashboard}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🏠" label="Accueil" />,
      }}
    />
    <Tabs.Screen
      name="Simulation"
      component={Simulation}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🎙️" label="Entretien" />,
      }}
    />
    <Tabs.Screen
      name="AnalyseCV"
      component={AnalyseCV}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📄" label="CV" />,
      }}
    />
    <Tabs.Screen
      name="Historique"
      component={Historique}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📜" label="Historique" />,
      }}
    />
    <Tabs.Screen
      name="Parametres"
      component={Parametres}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="⚙️" label="Paramètres" />,
      }}
    />
  </Tabs.Navigator>
);

const SplashScreen = () => (
  <View style={splashStyles.container}>
    <View style={splashStyles.logo}>
      <Text style={splashStyles.logoText}>JM</Text>
    </View>
    <Text style={splashStyles.title}>JobMentor</Text>
    <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} size="large" />
  </View>
);

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  logoText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  title: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Auth');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [token, user] = await Promise.all([getToken(), getUser()]);
        if (token && user) {
          setInitialRoute('AppTabs');
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    const t = setTimeout(checkAuth, 600);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="AppTabs" component={AppTabs} />
          <Stack.Screen
            name="Entretien"
            component={Entretien}
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
