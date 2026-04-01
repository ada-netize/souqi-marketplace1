import 'react-native-gesture-handler';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  I18nManager,
  ActivityIndicator,
  LogBox,
  AppState,
  Platform,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { request } from './src/api';
import { AuthContext } from './src/auth-context';
import { colors, radius, shadow, spacing } from './src/theme';
import { registerPushToken } from './src/notifications';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OtpAuthScreen from './src/screens/auth/OtpAuthScreen';

import HomeScreen from './src/screens/main/HomeScreen';
import SearchScreen from './src/screens/main/SearchScreen';
import AddEditListingScreen from './src/screens/listings/AddEditListingScreen';
import ListingDetailsScreen from './src/screens/listings/ListingDetailsScreen';
import MessagesScreen from './src/screens/messages/MessagesScreen';
import ConversationScreen from './src/screens/messages/ConversationScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import FavoritesScreen from './src/screens/profile/FavoritesScreen';
import SellerProfileScreen from './src/screens/profile/SellerProfileScreen';
import PlansScreen from './src/screens/profile/PlansScreen';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);
I18nManager.allowRTL(true);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

function SplashScreenView() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashOrbTop} />
      <View style={styles.splashOrbBottom} />
      <View style={styles.splashBadge}>
        <Text style={styles.splashBadgeText}>SOUQI</Text>
      </View>
      <Text style={styles.splashTitle}>سوقي</Text>
      <Text style={styles.splashText}>منصة إعلانات عربية أنيقة، سريعة، وتفاعلية.</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: 18 }} />
    </View>
  );
}

function getTabIcon(routeName, color, focused) {
  const size = focused ? 23 : 21;
  if (routeName === 'Home') return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
  if (routeName === 'Search') return <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />;
  if (routeName === 'MessagesHub') return <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={size} color={color} />;
  if (routeName === 'ProfileHub') return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
  return <Ionicons name={'ellipse'} size={size} color={color} />;
}

function FloatingTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarWrap}>
      <View style={styles.tabBarShell}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          if (route.name === 'Add') {
            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.95}
                onPress={() => navigation.navigate('Add')}
                style={styles.centerAddButton}
              >
                <View style={styles.centerAddInner}>
                  <Ionicons name="add" size={28} color={colors.white} />
                </View>
                <Text style={styles.centerAddText}>إضافة</Text>
              </TouchableOpacity>
            );
          }

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.9}
              accessibilityRole="button"
              onPress={onPress}
              style={styles.tabItem}
            >
              <View style={[styles.tabIconBox, isFocused && styles.tabIconBoxActive]}>
                {getTabIcon(route.name, isFocused ? colors.primary : colors.textMuted, isFocused)}
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'الرئيسية' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'البحث' }} />
      <Tab.Screen name="Add" component={AddEditListingScreen} options={{ title: 'إضافة' }} />
      <Tab.Screen name="MessagesHub" component={MessagesScreen} options={{ title: 'الرسائل' }} />
      <Tab.Screen name="ProfileHub" component={ProfileScreen} options={{ title: 'حسابي' }} />
    </Tab.Navigator>
  );
}

function AuthFlow() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OtpAuth" component={OtpAuthScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState('');
  const [bootstrap, setBootstrap] = useState(null);
  const [profile, setProfile] = useState(null);
  const pushRegisteredRef = useRef(false);

  const persistToken = async (value) => {
    setToken(value || '');
    pushRegisteredRef.current = false;
    if (value) await AsyncStorage.setItem('user_token', value);
    else await AsyncStorage.removeItem('user_token');
  };

  const refreshBootstrap = async (cityId) => {
    try {
      const suffix = cityId ? `?cityId=${cityId}` : '';
      const data = await request(`/api/public/bootstrap${suffix}`);
      setBootstrap(data);
      return data;
    } catch {
      const fallback = {
        categories: [],
        cities: [],
        featured: [],
        latest: [],
        nearby: [],
        sponsoredHome: [],
        pinnedTop: [],
        settings: { platformName: 'سوقي', primaryTagline: 'منصة إعلانات عربية أنيقة للتواصل المباشر' },
      };
      setBootstrap(fallback);
      return fallback;
    }
  };

  const clearSession = async () => {
    await persistToken('');
    setProfile(null);
  };

  const refreshProfile = async (currentToken = token) => {
    if (!currentToken) {
      setProfile(null);
      return null;
    }

    try {
      const data = await request('/api/user/profile', {}, currentToken);
      setProfile(data);
      return data;
    } catch (error) {
      const msg = String(error?.message || '');
      const authRelated =
        msg.includes('401') ||
        msg.includes('403') ||
        msg.includes('Unauthorized') ||
        msg.includes('غير مصرح') ||
        msg.includes('تم حظر هذا الحساب') ||
        msg.includes('المستخدم غير موجود');

      if (authRelated) {
        await clearSession();
        return null;
      }

      return profile;
    }
  };

  const registerDeviceForPush = async (currentToken = token) => {
    if (!currentToken || pushRegisteredRef.current) return;
    try {
      const result = await registerPushToken(currentToken);
      if (result?.ok) pushRegisteredRef.current = true;
    } catch {
      // ignore push errors in local/dev scenarios
    }
  };

  const hydrateAfterAuth = async (nextToken) => {
    const prof = await refreshProfile(nextToken);
    await refreshBootstrap(prof?.user?.city_id);
    await registerDeviceForPush(nextToken);
    return prof;
  };

  const login = async (email, password) => {
    const data = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    await persistToken(data.token);
    await hydrateAfterAuth(data.token);
  };

  const register = async (form) => {
    const data = await request('/api/auth/register', { method: 'POST', body: form });
    await persistToken(data.token);
    await hydrateAfterAuth(data.token);
  };

  const requestOtp = async (phone) => request('/api/auth/send-otp', { method: 'POST', body: { phone } });

  const verifyOtp = async (form) => {
    const data = await request('/api/auth/verify-otp', { method: 'POST', body: form });
    await persistToken(data.token);
    await hydrateAfterAuth(data.token);
  };

  const logout = async () => {
    await clearSession();
  };

  const favoriteToggle = async (listingId) => {
    if (!token) throw new Error('سجل الدخول أولًا');
    await request(`/api/user/favorites/${listingId}`, { method: 'POST' }, token);
    await refreshProfile();
  };

  const markNotificationsRead = async () => {
    if (!token) return;
    await request('/api/user/notifications/read-all', { method: 'POST' }, token);
    await refreshProfile();
  };

  const startConversation = async (listingId, message) => {
    const conv = await request('/api/user/conversations/start', { method: 'POST', body: { listingId, message } }, token);
    await refreshProfile();
    return conv;
  };

  const sendOffer = async (listingId, amount) => {
    const res = await request('/api/user/offers', { method: 'POST', body: { listingId, amount: Number(amount) } }, token);
    await refreshProfile();
    return res;
  };

  const respondToOffer = async (offerId, action, counterAmount = null) => {
    const payload = { action };
    if (counterAmount !== null && counterAmount !== undefined) payload.counterAmount = Number(counterAmount);
    const res = await request(`/api/user/offers/${offerId}`, { method: 'PUT', body: payload }, token);
    await refreshProfile();
    await refreshBootstrap(profile?.user?.city_id);
    return res;
  };

  const activateCatalogProduct = async ({ productKey, listingId = null, store = 'app-review', metadata = {} }) => {
    const res = await request('/api/user/iap/activate', { method: 'POST', body: { productKey, listingId, store, metadata } }, token);
    await refreshProfile();
    await refreshBootstrap(profile?.user?.city_id);
    return res;
  };

  const boostListing = async (listingId, days) => {
    const res = await request(`/api/user/listings/${listingId}/boost`, { method: 'POST', body: { days: Number(days) } }, token);
    await refreshProfile();
    await refreshBootstrap(profile?.user?.city_id);
    return res;
  };

  const sponsorHome = async (listingId, days) => {
    const res = await request(`/api/user/listings/${listingId}/sponsor-home`, { method: 'POST', body: { days: Number(days) } }, token);
    await refreshProfile();
    await refreshBootstrap(profile?.user?.city_id);
    return res;
  };

  const pinTop = async (listingId, days) => {
    const res = await request(`/api/user/listings/${listingId}/pin-top`, { method: 'POST', body: { days: Number(days) } }, token);
    await refreshProfile();
    await refreshBootstrap(profile?.user?.city_id);
    return res;
  };

  const markSold = async (listingId, soldPrice) => {
    const res = await request(`/api/user/listings/${listingId}/mark-sold`, { method: 'POST', body: { soldPrice: Number(soldPrice) } }, token);
    await refreshProfile();
    await refreshBootstrap(profile?.user?.city_id);
    return res;
  };

  useEffect(() => {
    (async () => {
      try {
        const boot = await refreshBootstrap();
        const storedToken = await AsyncStorage.getItem('user_token');
        if (storedToken) {
          setToken(storedToken);
          const prof = await refreshProfile(storedToken);
          if (prof?.user?.city_id) await refreshBootstrap(prof.user.city_id);
          else if (!prof) await refreshBootstrap(boot?.settings?.defaultCityId);
          await registerDeviceForPush(storedToken);
        }
      } finally {
        setTimeout(() => setBooting(false), 420);
      }
    })();
  }, []);

  useEffect(() => {
    let notificationListener;
    let responseListener;

    try {
      notificationListener = Notifications.addNotificationReceivedListener(async () => {
        if (token) await refreshProfile(token);
      });

      responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
        const data = response?.notification?.request?.content?.data || {};
        const conversationId = data?.conversationId ? Number(data.conversationId) : null;
        const listingId = data?.listingId ? Number(data.listingId) : null;

        if (token) await refreshProfile(token);

        if (!navigationRef.isReady()) return;
        if (conversationId) navigationRef.navigate('Conversation', { id: conversationId });
        else if (listingId) navigationRef.navigate('ListingDetails', { id: listingId });
      });
    } catch {
      // expo go limitations
    }

    return () => {
      notificationListener?.remove?.();
      responseListener?.remove?.();
    };
  }, [token]);

  useEffect(() => {
    const refreshAll = async () => {
      try {
        const latestProfile = token ? await refreshProfile(token) : null;
        await refreshBootstrap(latestProfile?.user?.city_id || bootstrap?.settings?.defaultCityId);
      } catch {
        // no-op
      }
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshAll();
        registerDeviceForPush(token);
      }
    });

    const interval = setInterval(() => {
      if (token) refreshAll();
    }, 30000);

    return () => {
      sub?.remove?.();
      clearInterval(interval);
    };
  }, [token, bootstrap?.settings?.defaultCityId]);

  const contextValue = useMemo(
    () => ({
      token,
      bootstrap,
      profile,
      login,
      register,
      requestOtp,
      verifyOtp,
      logout,
      refreshBootstrap,
      refreshProfile,
      favoriteToggle,
      markNotificationsRead,
      startConversation,
      sendOffer,
      respondToOffer,
      activateCatalogProduct,
      boostListing,
      sponsorHome,
      pinTop,
      markSold,
    }),
    [token, bootstrap, profile]
  );

  if (booting) return <SplashScreenView />;

  return (
    <AuthContext.Provider value={contextValue}>
      <NavigationContainer
        ref={navigationRef}
        theme={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.bg,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
          },
        }}
      >
        <StatusBar style="dark" />
        {token ? (
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '900', fontSize: 17 },
              cardStyle: { backgroundColor: colors.bg },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} options={{ title: 'تفاصيل الإعلان' }} />
            <Stack.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: 'صفحة البائع' }} />
            <Stack.Screen name="AddEditListing" component={AddEditListingScreen} options={{ title: 'إدارة الإعلان' }} />
            <Stack.Screen name="Conversation" component={ConversationScreen} options={{ title: 'المحادثة' }} />
            <Stack.Screen name="FavoritesHub" component={FavoritesScreen} options={{ title: 'المفضلة' }} />
            <Stack.Screen name="ProfileHub" component={ProfileScreen} options={{ title: 'حسابي' }} />
            <Stack.Screen name="PlansHub" component={PlansScreen} options={{ title: 'الباقات والترقيات' }} />
          </Stack.Navigator>
        ) : (
          <AuthFlow />
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    overflow: 'hidden',
  },
  splashOrbTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  splashOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  splashBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  splashBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  splashTitle: { color: colors.white, fontSize: 38, fontWeight: '900', textAlign: 'center' },
  splashText: { marginTop: 10, color: '#eafff2', fontSize: 15, textAlign: 'center' },
  tabBarWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.OS === 'ios' ? 12 : 10,
  },
  tabBarShell: {
    minHeight: 82,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
    ...shadow,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 14,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBoxActive: {
    backgroundColor: colors.primarySofter,
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  centerAddButton: {
    marginTop: -28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  centerAddInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.white,
    ...shadow,
    shadowOpacity: 0.16,
  },
  centerAddText: {
    marginTop: 4,
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
  },
});
