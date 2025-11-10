import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';

export default function LinkConsume() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_LINK_API}/mobile/link/consume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error('link/consume failed');
        const { app_token } = await res.json();
        await SecureStore.setItemAsync('app_token', app_token);
        router.replace('/'); // ou '/dashboard'
      } catch (e) {
        router.replace('/'); // affiche un toast d'erreur si tu en as un
      }
    })();
  }, [token]);

  return null;
}
