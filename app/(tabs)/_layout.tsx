import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../components/ThemeProvider';
import { useClientOnlyValue } from '../../components/useClientOnlyValue';
import api from '../../services/api';
import { useMessagesStore } from '../../stores/messagesStore';
import { THEMES } from '../../themes';

import { useUser } from '../../components/UserProvider';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function MessagesIcon({ color }: { color: string }) {
  const { user } = useUser();
  const { unreadCount, loadFromStorage, refreshUnreadCount } = useMessagesStore();

  useEffect(() => {
    // Charger les données depuis le storage au démarrage
    loadFromStorage();
  }, []);

  useEffect(() => {
    // Fetch conversations et rafraîchir le compteur
    const fetchConversations = async () => {
      try {
        if (!user) {
          // Sans utilisateur, juste rafraîchir avec Hugo
          refreshUnreadCount([]);
          return;
        }

        const conversations = await api.get<any[]>('/api/messages/conversations');
        const conversationIds = Array.isArray(conversations) 
          ? conversations.map((c: any) => c.id) 
          : [];
        
        refreshUnreadCount(conversationIds);
      } catch (error) {
        // En cas d'erreur, juste rafraîchir avec Hugo
        refreshUnreadCount([]);
      }
    };

    fetchConversations();
    // Refresh every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <View style={{ position: 'relative' }}>
      <TabBarIcon name="comments" color={color} />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -6,
            top: -3,
            backgroundColor: '#EF4444',
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const t = THEMES[theme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.primaryBtn,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: {
          backgroundColor: t.navBg,
          borderTopColor: t.border,
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Vendre',
          tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MessagesIcon color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
