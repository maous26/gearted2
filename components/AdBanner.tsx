import React from 'react';
import { View, Platform } from 'react-native';
import { AdMobBanner } from 'expo-ads-admob';

interface AdBannerProps {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle' | 'fullBanner' | 'leaderboard' | 'smartBannerPortrait' | 'smartBannerLandscape';
}

// IDs de production AdMob pour Gearted
const PRODUCTION_IDS = {
  ios: 'ca-app-pub-8221572393786359/7672412394',
  android: 'ca-app-pub-8221572393786359/7672412394',
};

export const AdBanner: React.FC<AdBannerProps> = ({ size = 'banner' }) => {
  const adUnitID = Platform.select(PRODUCTION_IDS);

  if (!adUnitID) {
    return null;
  }

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <AdMobBanner
        bannerSize={size}
        adUnitID={adUnitID}
        servePersonalizedAds={false} // Respecte le RGPD
        onDidFailToReceiveAdWithError={(error) => {
          console.log('AdMob error:', error);
        }}
      />
    </View>
  );
};
