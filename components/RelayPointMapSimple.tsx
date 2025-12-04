import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import api from '../services/api';
import { THEMES } from '../themes';
import { useTheme } from './ThemeProvider';

interface RelayPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  distance: string;
  openingHours: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

interface RelayPointMapProps {
  visible: boolean;
  onClose: () => void;
  onSelectPoint: (point: RelayPoint) => void;
  postalCode?: string;
}

export default function RelayPointMap({
  visible,
  onClose,
  onSelectPoint,
  postalCode,
}: RelayPointMapProps) {
  const { theme } = useTheme();
  const t = THEMES[theme];

  const [loading, setLoading] = useState(true);
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<RelayPoint | null>(null);
  const [userPostalCode, setUserPostalCode] = useState<string>(postalCode || '75001');
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      requestLocationAndSearch();
    }
  }, [visible]);

  const requestLocationAndSearch = async () => {
    try {
      setLoading(true);
      setLocationError(null);

      // Demander la permission de géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Permission de géolocalisation refusée');
        // Utiliser le code postal fourni ou Paris par défaut
        await searchByPostalCode(userPostalCode);
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Rechercher les points relais à proximité
      await searchNearbyPoints(latitude, longitude);
    } catch (error: any) {
      console.error('[RelayPointMap] Location error:', error);
      setLocationError('Erreur de géolocalisation');
      await searchByPostalCode(userPostalCode);
    }
  };

  const searchNearbyPoints = async (latitude: number, longitude: number) => {
    try {
      // Reverse geocoding pour obtenir le code postal
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const cp = address?.postalCode || userPostalCode;
      setUserPostalCode(cp);

      await searchByPostalCode(cp);
    } catch (error) {
      console.error('[RelayPointMap] Reverse geocode error:', error);
      await searchByPostalCode(userPostalCode);
    }
  };

  const searchByPostalCode = async (cp: string) => {
    try {
      console.log('[RelayPointMap] Searching points for postal code:', cp);

      const response = await api.get<{
        success: boolean;
        pickupPoints: RelayPoint[];
      }>(`/api/mondialrelay/pickup-points?postalCode=${cp}&country=FR&weight=1000`);

      if (response.success && response.pickupPoints) {
        setRelayPoints(response.pickupPoints);
      }
    } catch (error: any) {
      console.error('[RelayPointMap] Search error:', error);
      Alert.alert('Erreur', 'Impossible de charger les points relais');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedPoint) {
      onSelectPoint(selectedPoint);
      onClose();
    }
  };

  const formatOpeningHours = (hours: RelayPoint['openingHours']) => {
    const days = [
      { key: 'monday', label: 'Lun' },
      { key: 'tuesday', label: 'Mar' },
      { key: 'wednesday', label: 'Mer' },
      { key: 'thursday', label: 'Jeu' },
      { key: 'friday', label: 'Ven' },
      { key: 'saturday', label: 'Sam' },
      { key: 'sunday', label: 'Dim' },
    ];

    return days.map(({ key, label }) => {
      const value = hours[key as keyof typeof hours];
      return {
        day: label,
        hours: value && value !== '0000' ? formatTimeRange(value) : 'Fermé',
      };
    });
  };

  const formatTimeRange = (timeStr: string) => {
    // Format: "0900 1200 1400 1900" → "09:00-12:00, 14:00-19:00"
    if (!timeStr || timeStr === '0000') return 'Fermé';
    
    const times = timeStr.split(' ').filter(t => t && t !== '0000');
    if (times.length === 0) return 'Fermé';

    const formatted: string[] = [];
    for (let i = 0; i < times.length; i += 2) {
      if (times[i] && times[i + 1]) {
        const start = times[i].substring(0, 2) + ':' + times[i].substring(2);
        const end = times[i + 1].substring(0, 2) + ':' + times[i + 1].substring(2);
        formatted.push(`${start}-${end}`);
      }
    }
    return formatted.join(', ') || 'Fermé';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: t.rootBg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: t.cardBg, borderBottomColor: t.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={t.heading} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.heading }]}>
            Points Relais Mondial Relay
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={t.primaryBtn} />
            <Text style={[styles.loadingText, { color: t.muted }]}>
              Recherche des points relais...
            </Text>
          </View>
        ) : (
          <>
            {/* Location info banner */}
            <View style={[styles.infoBanner, { backgroundColor: t.sectionLight }]}>
              <Ionicons name="location" size={20} color={t.primaryBtn} />
              <Text style={{ color: t.heading, marginLeft: 8, flex: 1 }}>
                Recherche autour du code postal: {userPostalCode}
              </Text>
            </View>

            {locationError && (
              <View style={[styles.errorBanner, { backgroundColor: '#FFF3CD' }]}>
                <Ionicons name="warning" size={20} color="#856404" />
                <Text style={{ color: '#856404', marginLeft: 8, flex: 1 }}>
                  {locationError}. Affichage basé sur le code postal.
                </Text>
              </View>
            )}

            {/* Points List */}
            <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
              <Text style={[styles.listTitle, { color: t.heading }]}>
                {relayPoints.length} points relais trouvés
              </Text>

              {relayPoints.map((point) => (
                <TouchableOpacity
                  key={point.id}
                  style={[
                    styles.pointCard,
                    {
                      backgroundColor: selectedPoint?.id === point.id ? t.sectionLight : t.cardBg,
                      borderColor: selectedPoint?.id === point.id ? t.primaryBtn : t.border,
                    },
                  ]}
                  onPress={() => setSelectedPoint(point)}
                >
                  <View style={styles.pointCardHeader}>
                    <View style={styles.pointIcon}>
                      <Ionicons 
                        name={selectedPoint?.id === point.id ? "checkmark-circle" : "location"} 
                        size={32} 
                        color={selectedPoint?.id === point.id ? t.primaryBtn : '#2196F3'} 
                      />
                    </View>
                    <View style={styles.pointInfo}>
                      <Text style={[styles.pointName, { color: t.heading }]}>
                        {point.name}
                      </Text>
                      <Text style={[styles.pointAddress, { color: t.muted }]}>
                        {point.address}
                      </Text>
                      <Text style={[styles.pointCity, { color: t.muted }]}>
                        {point.postalCode} {point.city}
                      </Text>
                      {point.distance && (
                        <View style={styles.distanceContainer}>
                          <Ionicons name="walk" size={14} color={t.primaryBtn} />
                          <Text style={[styles.distanceText, { color: t.primaryBtn }]}>
                            {(parseFloat(point.distance) / 1000).toFixed(1)} km
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Opening Hours - Show when selected */}
                  {selectedPoint?.id === point.id && (
                    <View style={styles.hoursContainer}>
                      <Text style={[styles.hoursTitle, { color: t.heading }]}>
                        Horaires d'ouverture
                      </Text>
                      <View style={styles.hoursGrid}>
                        {formatOpeningHours(point.openingHours).map(({ day, hours }) => (
                          <View key={day} style={styles.hoursRow}>
                            <Text style={[styles.hoursDay, { color: t.muted }]}>{day}</Text>
                            <Text style={[styles.hoursTime, { color: t.heading }]}>{hours}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Confirm Button */}
            {selectedPoint && (
              <View style={[styles.confirmContainer, { backgroundColor: t.cardBg, borderTopColor: t.border }]}>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: t.primaryBtn }]}
                  onPress={handleConfirmSelection}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.confirmButtonText}>
                    Choisir ce point relais
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  pointCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  pointCardHeader: {
    flexDirection: 'row',
  },
  pointIcon: {
    marginRight: 12,
  },
  pointInfo: {
    flex: 1,
  },
  pointName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  pointAddress: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  pointCity: {
    fontSize: 14,
    marginBottom: 6,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  hoursContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  hoursTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hoursRow: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 16,
    paddingVertical: 2,
  },
  hoursDay: {
    fontSize: 12,
    width: 30,
  },
  hoursTime: {
    fontSize: 12,
    flex: 1,
  },
  confirmContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
