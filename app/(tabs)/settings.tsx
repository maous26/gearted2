import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from "react";
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../components/ThemeProvider";
import { useUser } from "../../components/UserProvider";
import { THEMES, ThemeKey } from "../../themes";
import userService from "../../services/user";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, updateProfile, logout } = useUser();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [editTeamName, setEditTeamName] = useState(user?.teamName || "");
  const [isSaving, setIsSaving] = useState(false);
  
  const t = THEMES[theme];

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
      console.log('[Settings] Avatar selected:', avatarUri);
      
      setIsSaving(true);
      try {
        // Envoyer au backend
        const updatedUser = await userService.updateProfile({ avatar: avatarUri });
        console.log('[Settings] Avatar saved to backend');
        
        // Mettre à jour le state local
        await updateProfile({
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          location: updatedUser.location,
          phone: updatedUser.phone,
          bio: updatedUser.bio
        });
        
        Alert.alert("Succès", "Photo de profil mise à jour");
      } catch (error: any) {
        console.error('[Settings] Error saving avatar:', error);
        Alert.alert("Erreur", error.message || "Impossible de sauvegarder la photo");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const saveProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert("Erreur", "Le nom d'utilisateur ne peut pas être vide");
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('[Settings] Saving profile to backend');
      
      // Envoyer au backend
      const updatedUser = await userService.updateProfile({
        username: editUsername.trim(),
        // Note: teamName n'est pas encore dans le backend, on le garde local pour l'instant
      });
      
      console.log('[Settings] Profile saved to backend');
      
      // Mettre à jour le state local avec les données du backend
      await updateProfile({
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        teamName: editTeamName.trim() || "Sans équipe", // Garder teamName local
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        location: updatedUser.location,
        phone: updatedUser.phone,
        bio: updatedUser.bio
      });
      
      setIsEditingProfile(false);
      Alert.alert("Succès", "Profil mis à jour");
    } catch (error: any) {
      console.error('[Settings] Error saving profile:', error);
      Alert.alert("Erreur", error.message || "Impossible de sauvegarder le profil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
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
          onPress: () => {
            logout();
            router.replace('/login');
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
              <Text style={{ fontSize: 16, color: t.heading, fontWeight: '600' }}>
                {user?.username || "Non défini"}
              </Text>
            )}
          </View>

          {/* Team Name */}
          <View>
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

          {isEditingProfile && (
            <TouchableOpacity
              onPress={() => {
                setIsEditingProfile(false);
                setEditUsername(user?.username || "");
                setEditTeamName(user?.teamName || "");
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

        {/* Account Section */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: t.heading,
            marginBottom: 16 
          }}>
            Compte
          </Text>
          
          <TouchableOpacity style={{
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: t.cardBg,
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: t.border
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
              Profil utilisateur
            </Text>
            <Text style={{ fontSize: 14, color: t.muted, marginTop: 2 }}>
              Modifier vos informations personnelles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={{
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: t.cardBg,
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: t.border
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>
              Sécurité
            </Text>
            <Text style={{ fontSize: 14, color: t.muted, marginTop: 2 }}>
              Modifier votre mot de passe et paramètres de sécurité
            </Text>
          </TouchableOpacity>
        </View>

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