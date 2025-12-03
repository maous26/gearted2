import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useTheme } from './ThemeProvider';
import api from '../services/api';
import { THEMES } from '../themes';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

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
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<RelayPoint | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 48.8566, // Paris par défaut
    longitude: 2.3522,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
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
        // Utiliser le code postal si fourni, sinon Paris
        if (postalCode) {
          await searchByPostalCode(postalCode);
        } else {
          await searchByPostalCode('75001');
        }
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });

      // Rechercher les points relais à proximité
      await searchNearbyPoints(latitude, longitude);
    } catch (error: any) {
      console.error('[RelayPointMap] Location error:', error);
      setLocationError('Erreur de géolocalisation');
      if (postalCode) {
        await searchByPostalCode(postalCode);
      } else {
        await searchByPostalCode('75001');
      }
    }
  };

  const searchNearbyPoints = async (latitude: number, longitude: number) => {
    try {
      // Reverse geocoding pour obtenir le code postal
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const cp = address?.postalCode || postalCode || '75001';

      await searchByPostalCode(cp, latitude, longitude);
    } catch (error) {
      console.error('[RelayPointMap] Reverse geocode error:', error);
      await searchByPostalCode(postalCode || '75001');
    }
  };

  const searchByPostalCode = async (cp: string, lat?: number, lng?: number) => {
    try {
      console.log('[RelayPointMap] Searching points for postal code:', cp);

      const response = await api.get<{
        success: boolean;
        pickupPoints: RelayPoint[];
      }>(`/api/mondialrelay/pickup-points?postalCode=${cp}&country=FR&weight=1000`);

      if (response.success && response.pickupPoints) {
        setRelayPoints(response.pickupPoints);

        // Si on a des points, centrer sur le premier
        if (response.pickupPoints.length > 0 && !lat) {
          const firstPoint = response.pickupPoints[0];
          const pointLat = parseFloat(firstPoint.latitude.replace(',', '.'));
          const pointLng = parseFloat(firstPoint.longitude.replace(',', '.'));
          
          if (!isNaN(pointLat) && !isNaN(pointLng)) {
            setRegion({
              latitude: pointLat,
              longitude: pointLng,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
          }
        }
      }
    } catch (error: any) {
      console.error('[RelayPointMap] Search error:', error);
      Alert.alert('Erreur', 'Impossible de charger les points relais');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (point: RelayPoint) => {
    setSelectedPoint(point);
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

  const getCoordinates = (point: RelayPoint) => {
    const lat = parseFloat(point.latitude.replace(',', '.'));
    const lng = parseFloat(point.longitude.replace(',', '.'));
    return { latitude: lat, longitude: lng };
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
            {/* Map */}
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={region}
              region={region}
              showsUserLocation={true}
              showsMyLocationButton={true}
              onRegionChangeComplete={setRegion}
            >
              {relayPoints.map((point) => {
                const coords = getCoordinates(point);
                if (isNaN(coords.latitude) || isNaN(coords.longitude)) return null;

                return (
                  <Marker
                    key={point.id}
                    coordinate={coords}
                    title={point.name}
                    description={point.address}
                    onPress={() => handleMarkerPress(point)}
                    pinColor={selectedPoint?.id === point.id ? '#FF6B35' : '#2196F3'}
                  />
                );
              })}
            </MapView>

            {/* Location error banner */}
            {locationError && (
              <View style={[styles.errorBanner, { backgroundColor: '#FFF3CD' }]}>
                <Ionicons name="warning" size={20} color="#856404" />
                <Text style={{ color: '#856404', marginLeft: 8, flex: 1 }}>
                  {locationError}. Affichage basé sur le code postal.
                </Text>
              </View>
            )}

            {/* Points List */}
            <View style={[styles.listContainer, { backgroundColor: t.cardBg }]}>
              <Text style={[styles.listTitle, { color: t.heading }]}>
                {relayPoints.length} points relais trouvés
              </Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listScrollContent}
              >
                {relayPoints.map((point) => (
                  <TouchableOpacity
                    key={point.id}
                    style={[
                      styles.pointCard,
                      {
                        backgroundColor: selectedPoint?.id === point.id ? t.sectionLight : t.rootBg,
                        borderColor: selectedPoint?.id === point.id ? t.primaryBtn : t.border,
                      },
                    ]}
                    onPress={() => {
                      handleMarkerPress(point);
                      const coords = getCoordinates(point);
                      if (!isNaN(coords.latitude) && !isNaN(coords.longitude)) {
                        mapRef.current?.animateToRegion({
                          ...coords,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01 * ASPECT_RATIO,
                        });
                      }
                    }}
                  >
                    <View style={styles.pointIcon}>
                      <Ionicons 
                        name="location" 
                        size={24} 
                        color={selectedPoint?.id === point.id ? t.primaryBtn : '#2196F3'} 
                      />
                    </View>
                    <View style={styles.pointInfo}>
                      <Text 
                        style={[styles.pointName, { color: t.heading }]}
                        numberOfLines={1}
                      >
                        {point.name}
                      </Text>
                      <Text 
                        style={[styles.pointAddress, { color: t.muted }]}
                        numberOfLines={2}
                      >
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
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Selected Point Details */}
            {selectedPoint && (
              <View style={[styles.detailsContainer, { backgroundColor: t.cardBg, borderTopColor: t.border }]}>
                <View style={styles.detailsHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailsName, { color: t.heading }]}>
                      {selectedPoint.name}
                    </Text>
                    <Text style={[styles.detailsAddress, { color: t.muted }]}>
                      {selectedPoint.address}, {selectedPoint.postalCode} {selectedPoint.city}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setSelectedPoint(null)}
                    style={styles.closeDetails}
                  >
                    <Ionicons name="close-circle" size={24} color={t.muted} />
                  </TouchableOpacity>
                </View>

                {/* Opening Hours */}
                <View style={styles.hoursContainer}>
                  <Text style={[styles.hoursTitle, { color: t.heading }]}>
                    Horaires d'ouverture
                  </Text>
                  <View style={styles.hoursGrid}>
                    {formatOpeningHours(selectedPoint.openingHours).map(({ day, hours }) => (
                      <View key={day} style={styles.hoursRow}>
                        <Text style={[styles.hoursDay, { color: t.muted }]}>{day}</Text>
                        <Text style={[styles.hoursTime, { color: t.heading }]}>{hours}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Confirm Button */}
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
  map: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 60,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  listContainer: {
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listScrollContent: {
    paddingHorizontal: 12,
  },
  pointCard: {
    width: 200,
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    marginHorizontal: 4,
  },
  pointIcon: {
    marginRight: 10,
  },
  pointInfo: {
    flex: 1,
  },
  pointName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  pointAddress: {
    fontSize: 12,
    lineHeight: 16,
  },
  pointCity: {
    fontSize: 12,
    marginTop: 2,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailsName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailsAddress: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeDetails: {
    padding: 4,
  },
  hoursContainer: {
    marginBottom: 16,
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
