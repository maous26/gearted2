import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../components/ThemeProvider';
import { useClientOnlyValue } from '../../components/useClientOnlyValue';
import api from '../../services/api';
import { THEMES } from '../../themes';

import { useUser } from '../../components/UserProvider';

const UNREAD_MESSAGES_KEY = '@gearted_unread_messages';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function MessagesIcon({ color }: { color: string }) {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread messages count
    const fetchUnreadMessages = async () => {
      try {
        // Récupérer les IDs des messages lus depuis le storage
        const readMessagesJson = await AsyncStorage.getItem(UNREAD_MESSAGES_KEY);
        const readMessageIds: string[] = readMessagesJson ? JSON.parse(readMessagesJson) : [];
        
        // Vérifier si le message de Hugo a été lu
        const hugoRead = readMessageIds.includes('gearted-welcome');
        
        if (!user) {
          // Si pas connecté, afficher 1 seulement si Hugo n'est pas lu
          setUnreadCount(hugoRead ? 0 : 1);
          return;
        }

        // Récupérer les conversations
        const conversations = await api.get<any[]>('/api/messages/conversations');
        const conversationList = Array.isArray(conversations) ? conversations : [];
        
        // Compter les conversations non lues (celles qui ne sont pas dans readMessageIds)
        let unread = 0;
        
        // Hugo non lu ?
        if (!hugoRead) unread++;
        
        // Conversations non lues
        conversationList.forEach((conv: any) => {
          if (!readMessageIds.includes(conv.id)) {
            unread++;
          }
        });
        
        setUnreadCount(unread);
      } catch (error) {
        setUnreadCount(0);
      }
    };

    fetchUnreadMessages();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadMessages, 30000);
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
