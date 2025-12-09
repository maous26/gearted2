import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../../components/ThemeProvider";
import { useUser } from "../../components/UserProvider";
import { UserBadge } from "../../components/UserBadge";
import userService from "../../services/user";
import { THEMES, ThemeKey } from "../../themes";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, updateProfile, logout, isLoaded } = useUser();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const t = THEMES[theme];

  // Synchroniser les champs d'édition quand l'utilisateur change
  React.useEffect(() => {
    if (user) {
      setEditUsername(user.username || "");
      setEditTeamName(user.teamName || "");
      setEditLocation(user.location || "");
    }
  }, [user]);

  const selectAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "L'accès à la galerie est nécessaire");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && user) {
      const avatarUri = result.assets[0].uri;
  // Avatar sélectionné
      
      try {
  // L'avatar est stocké uniquement en local (upload backend à venir)
        await updateProfile({ 
          ...user,
          avatar: avatarUri 
        });
  // Avatar sauvegardé localement
        Alert.alert("Succès", "Photo de profil mise à jour");
      } catch (error: any) {
        console.error('[Settings] Error saving avatar:', error);
        Alert.alert("Erreur", "Impossible de sauvegarder la photo");
      }
    }
  };

  const requestGeolocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "L'accès à la localisation est nécessaire");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocoding pour obtenir l'adresse
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (addresses.length > 0) {
        const address = addresses[0];
        const locationString = `${address.city || ''}, ${address.postalCode || ''}`.trim().replace(/^,\s*/, '');
        setEditLocation(locationString);
        Alert.alert("Localisation détectée", locationString);
      }
    } catch (error: any) {
      console.error('[Settings] Error getting location:', error);
      Alert.alert("Erreur", "Impossible d'obtenir votre localisation");
    }
  };

  const saveProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert("Erreur", "Le nom d'utilisateur ne peut pas être vide");
      return;
    }
    
    setIsSaving(true);
    try {
  // Sauvegarde du profil vers le backend
      
      // Essayer d'envoyer au backend, mais continuer même si ça échoue
      let backendSuccess = false;
      try {
        const updatedUser = await userService.updateProfile({
          username: editUsername.trim(),
          location: editLocation.trim() || undefined,
        });
  // Profil sauvegardé sur le backend
        backendSuccess = true;
        
        // Fusionner les propriétés locales (avatar, teamName) avec celles du backend
        await updateProfile({
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          avatar: user?.avatar ?? updatedUser.avatar ?? null,
          teamName: editTeamName.trim() || user?.teamName || "Sans équipe",
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          location: updatedUser.location,
          phone: updatedUser.phone,
          bio: updatedUser.bio
        });
      } catch (backendError: any) {
        console.warn('[Settings] Backend unavailable, saving locally only:', backendError.message);
        
        // Sauvegarder localement même si le backend échoue
        await updateProfile({
          ...user!,
          username: editUsername.trim(),
          teamName: editTeamName.trim() || "Sans équipe",
        });
      }
      
      setIsEditingProfile(false);
      
      // Informer l'utilisateur du résultat
      if (backendSuccess) {
        Alert.alert("Succès", "Profil mis à jour");
      } else {
        Alert.alert(
          "Sauvegardé localement", 
          "Les modifications sont sauvegardées sur cet appareil. Elles seront synchronisées avec le serveur lors de la prochaine connexion."
        );
      }
    } catch (error: any) {
      console.error('[Settings] Error saving profile:', error);
      Alert.alert("Erreur", error.message || "Impossible de sauvegarder le profil");
    } finally {
      setIsSaving(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (isLoggingOut) return; // Prevent double-tap

    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            if (isLoggingOut) return; // Double-check
            setIsLoggingOut(true);

            console.log('[Settings] Starting logout...');
            // Clear data first
            await logout();
            console.log('[Settings] Logout complete, navigating to landing...');
            // Navigate to landing page with retry mechanism
            // Use longer delay for Discord accounts which have more complex auth state
            setTimeout(() => {
              try {
                // Use replace to clear navigation history
                router.replace('/landing');
              } catch (navError) {
                console.warn('[Settings] Navigation error on first attempt:', navError);
                // Retry with push as fallback
                setTimeout(() => {
                  try {
                    router.push('/landing');
                  } catch (retryError) {
                    console.error('[Settings] Navigation retry failed:', retryError);
                  }
                }, 200);
              }
            }, 500);
          }
        }
      ]
    );
  };

  const ThemeSelector = () => (
    <View style={{ marginTop: 16 }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: '600', 
        color: t.heading,
        marginBottom: 12 
      }}>
        Thème de l'application
      </Text>
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: t.cardBg, 
        borderRadius: 12, 
        padding: 4,
        borderWidth: 1,
        borderColor: t.border
      }}>
        {(['ranger', 'desert', 'night'] as ThemeKey[]).map((themeKey) => (
          <TouchableOpacity
            key={themeKey}
            onPress={() => setTheme(themeKey)}
            style={{
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: theme === themeKey ? t.primaryBtn : 'transparent'
            }}
          >
            <Text style={{ 
              fontSize: 14, 
              color: theme === themeKey ? t.white : t.muted,
              textAlign: 'center',
              textTransform: 'capitalize',
              fontWeight: theme === themeKey ? '600' : '400'
            }}>
              {themeKey === 'night' ? 'Night Ops' : themeKey}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange 
  }: { 
    title: string; 
    subtitle?: string; 
    value: boolean; 
    onValueChange: (value: boolean) => void; 
  }) => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: t.border
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 14, color: t.muted, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: t.border, true: t.primaryBtn + '80' }}
        thumbColor={value ? t.primaryBtn : t.cardBg}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      {/* Header avec flèche retour */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: t.border
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={t.heading} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: t.heading }}>
          Paramètres
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
      >
        {/* Profile Section */}
        <View style={{
          backgroundColor: t.cardBg,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: t.border
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: t.heading
            }}>
              Mon Profil
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (isEditingProfile) {
                  saveProfile();
                } else {
                  setEditUsername(user?.username || "");
                  setEditTeamName(user?.teamName || "");
                  setEditLocation(user?.location || "");
                  setIsEditingProfile(true);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={t.primaryBtn} />
              ) : (
                <Text style={{ fontSize: 14, color: t.primaryBtn, fontWeight: '600' }}>
                  {isEditingProfile ? "Enregistrer" : "Modifier"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={selectAvatar}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: t.border,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: t.primaryBtn
              }}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ fontSize: 48 }}>👤</Text>
                )}
              </View>
              <View style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: t.primaryBtn,
                borderRadius: 15,
                width: 30,
                height: 30,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 16 }}>📷</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Username */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>
              Nom d'utilisateur
            </Text>
            {isEditingProfile ? (
              <TextInput
                style={{
                  backgroundColor: t.rootBg,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: t.border
                }}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Votre pseudo"
                placeholderTextColor={t.muted}
                maxLength={20}
                autoFocus={false}
              />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: t.heading, fontWeight: '600' }}>
                  {user?.username || "Non défini"}
                </Text>
                <UserBadge role={user?.role} badge={user?.badge} size="medium" />
              </View>
            )}
          </View>

          {/* Team Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>
              Équipe
            </Text>
            {isEditingProfile ? (
              <TextInput
                style={{
                  backgroundColor: t.rootBg,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: t.border
                }}
                value={editTeamName}
                onChangeText={setEditTeamName}
                placeholder="Nom de votre équipe"
                placeholderTextColor={t.muted}
                maxLength={30}
                autoFocus={false}
              />
            ) : (
              <Text style={{ fontSize: 16, color: t.heading }}>
                {user?.teamName || "Sans équipe"}
              </Text>
            )}
          </View>

          {/* Location */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, color: t.muted }}>
                📍 Localisation
              </Text>
              {isEditingProfile && (
                <TouchableOpacity
                  onPress={requestGeolocation}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: t.primaryBtn,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6
                  }}
                >
                  <Ionicons name="location" size={14} color={t.white} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: t.white, fontWeight: '500' }}>
                    Me localiser
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {isEditingProfile ? (
              <TextInput
                style={{
                  backgroundColor: t.rootBg,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: t.heading,
                  borderWidth: 1,
                  borderColor: t.border
                }}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Ville, Code postal"
                placeholderTextColor={t.muted}
                maxLength={50}
                autoFocus={false}
              />
            ) : (
              <Text style={{ fontSize: 16, color: t.heading }}>
                {user?.location || "Non défini"}
              </Text>
            )}
          </View>

          {/* Modifier le mot de passe - Seulement pour les comptes non-Discord */}
          {user?.provider !== 'discord' && (
            <TouchableOpacity
              onPress={() => router.push("/change-password" as any)}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: t.rootBg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="lock-closed" size={18} color={t.primaryBtn} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: t.heading }}>
                  Modifier le mot de passe
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.muted} />
            </TouchableOpacity>
          )}

          {isEditingProfile && (
            <TouchableOpacity
              onPress={() => {
                setIsEditingProfile(false);
                setEditUsername(user?.username || "");
                setEditTeamName(user?.teamName || "");
                setEditLocation(user?.location || "");
              }}
              style={{ marginTop: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, color: t.muted }}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Settings Options */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: t.heading,
            marginBottom: 16 
          }}>
            Préférences
          </Text>
          
          <SettingRow
            title="Notifications"
            subtitle="Recevoir des notifications pour les nouveaux messages et offres"
            value={notifications}
            onValueChange={setNotifications}
          />
          
          <SettingRow
            title="Mode sombre automatique"
            subtitle="Basculer automatiquement selon l'heure du système"
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>

        {/* Modifier le mot de passe - Seulement pour les comptes non-Discord */}
        {user?.provider !== 'discord' && (
          <View style={{ marginTop: 32 }}>
            <TouchableOpacity
              onPress={() => router.push("/change-password" as any)}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: t.cardBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
                  Modifier le mot de passe
                </Text>
                <Text style={{ fontSize: 14, color: t.muted, marginTop: 2 }}>
                  Changer votre mot de passe de connexion
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={t.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity 
          onPress={handleLogout}
          style={{
          marginTop: 32,
          marginBottom: 32,
          paddingVertical: 16,
          paddingHorizontal: 16,
          backgroundColor: '#ff4757',
          borderRadius: 12,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
            Se déconnecter
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}