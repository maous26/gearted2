import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from './ThemeProvider';
import { THEMES } from '../themes';
import api from '../services/api';

interface ParcelTemplate {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  weaponTypes?: string[];
}

interface ParcelDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface ParcelDimensionsFormProps {
  productCategory?: string;
  weaponType?: string;
  onDimensionsSet?: (dimensions: ParcelDimensions) => void;
  initialDimensions?: ParcelDimensions;
}

export default function ParcelDimensionsForm({
  productCategory,
  weaponType,
  onDimensionsSet,
  initialDimensions,
}: ParcelDimensionsFormProps) {
  const { theme } = useTheme();
  const t = THEMES[theme];

  const [mode, setMode] = useState<'template' | 'manual'>('template');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<{
    replicas: ParcelTemplate[];
    accessories: ParcelTemplate[];
  }>({ replicas: [], accessories: [] });

  // Manual input states
  const [length, setLength] = useState(initialDimensions?.length.toString() || '');
  const [width, setWidth] = useState(initialDimensions?.width.toString() || '');
  const [height, setHeight] = useState(initialDimensions?.height.toString() || '');
  const [weight, setWeight] = useState(initialDimensions?.weight.toString() || '');

  const [selectedTemplate, setSelectedTemplate] = useState<ParcelTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // Try to auto-select template based on weapon type
    if (weaponType && templates.replicas.length > 0) {
      const matching = templates.replicas.find((t) =>
        t.weaponTypes?.includes(weaponType)
      );
      if (matching) {
        selectTemplate(matching);
      }
    }
  }, [weaponType, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/shipments/parcel-templates');
      setTemplates({
        replicas: response.data.replicas || [],
        accessories: response.data.accessories || [],
      });
    } catch (error) {
      console.error('[ParcelDimensionsForm] Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template: ParcelTemplate) => {
    setSelectedTemplate(template);
    setLength(template.length.toString());
    setWidth(template.width.toString());
    setHeight(template.height.toString());
    setWeight(template.weight.toString());

    if (onDimensionsSet) {
      onDimensionsSet({
        length: template.length,
        width: template.width,
        height: template.height,
        weight: template.weight,
      });
    }
  };

  const validateAndSave = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const wg = parseFloat(weight);

    if (isNaN(l) || isNaN(w) || isNaN(h) || isNaN(wg)) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs numériques valides');
      return;
    }

    if (l <= 0 || w <= 0 || h <= 0 || wg <= 0) {
      Alert.alert('Erreur', 'Les dimensions doivent être supérieures à zéro');
      return;
    }

    if (onDimensionsSet) {
      onDimensionsSet({
        length: l,
        width: w,
        height: h,
        weight: wg,
      });
    }

    Alert.alert('Succès', 'Dimensions enregistrées');
  };

  return (
    <View style={{ marginVertical: 16 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: t.heading,
          marginBottom: 12,
        }}
      >
        📦 Dimensions du colis
      </Text>

      {/* Mode Selector */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: t.cardBg,
          borderRadius: 8,
          padding: 4,
          marginBottom: 16,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 6,
            backgroundColor: mode === 'template' ? t.primaryBtn : 'transparent',
          }}
          onPress={() => setMode('template')}
        >
          <Text
            style={{
              textAlign: 'center',
              color: mode === 'template' ? t.white : t.muted,
              fontWeight: '600',
            }}
          >
            Catalogue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 6,
            backgroundColor: mode === 'manual' ? t.primaryBtn : 'transparent',
          }}
          onPress={() => setMode('manual')}
        >
          <Text
            style={{
              textAlign: 'center',
              color: mode === 'manual' ? t.white : t.muted,
              fontWeight: '600',
            }}
          >
            Manuel
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator color={t.primaryBtn} />
        </View>
      )}

      {/* Template Mode */}
      {!loading && mode === 'template' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          {[...templates.replicas, ...templates.accessories].map((template) => (
            <TouchableOpacity
              key={template.id}
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: 16,
                marginRight: 12,
                width: 200,
                borderWidth: 2,
                borderColor:
                  selectedTemplate?.id === template.id ? t.primaryBtn : t.border,
              }}
              onPress={() => selectTemplate(template)}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: t.heading,
                  marginBottom: 8,
                }}
              >
                {template.name}
              </Text>

              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 12, color: t.muted }}>
                  📏 {template.length} × {template.width} × {template.height} cm
                </Text>
                <Text style={{ fontSize: 12, color: t.muted }}>
                  ⚖️ {template.weight} kg
                </Text>
              </View>

              {selectedTemplate?.id === template.id && (
                <View
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: t.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: t.primaryBtn,
                      fontWeight: '600',
                    }}
                  >
                    ✓ Sélectionné
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ color: t.muted, marginBottom: 6, fontSize: 12 }}>
              Longueur (cm) *
            </Text>
            <TextInput
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: t.border,
                color: t.heading,
              }}
              value={length}
              onChangeText={setLength}
              placeholder="Ex: 85"
              placeholderTextColor={t.muted}
              keyboardType="decimal-pad"
            />
          </View>

          <View>
            <Text style={{ color: t.muted, marginBottom: 6, fontSize: 12 }}>
              Largeur (cm) *
            </Text>
            <TextInput
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: t.border,
                color: t.heading,
              }}
              value={width}
              onChangeText={setWidth}
              placeholder="Ex: 30"
              placeholderTextColor={t.muted}
              keyboardType="decimal-pad"
            />
          </View>

          <View>
            <Text style={{ color: t.muted, marginBottom: 6, fontSize: 12 }}>
              Hauteur (cm) *
            </Text>
            <TextInput
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: t.border,
                color: t.heading,
              }}
              value={height}
              onChangeText={setHeight}
              placeholder="Ex: 10"
              placeholderTextColor={t.muted}
              keyboardType="decimal-pad"
            />
          </View>

          <View>
            <Text style={{ color: t.muted, marginBottom: 6, fontSize: 12 }}>
              Poids (kg) *
            </Text>
            <TextInput
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: t.border,
                color: t.heading,
              }}
              value={weight}
              onChangeText={setWeight}
              placeholder="Ex: 3.5"
              placeholderTextColor={t.muted}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: t.primaryBtn,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 8,
            }}
            onPress={validateAndSave}
          >
            <Text style={{ color: t.white, fontSize: 14, fontWeight: '600' }}>
              Enregistrer les dimensions
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Current Dimensions Summary */}
      {(length || width || height || weight) && (
        <View
          style={{
            backgroundColor: t.pillBg,
            borderRadius: 8,
            padding: 12,
            marginTop: 16,
          }}
        >
          <Text style={{ fontSize: 12, color: t.muted, marginBottom: 4 }}>
            Dimensions actuelles :
          </Text>
          <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600' }}>
            📦 {length} × {width} × {height} cm • ⚖️ {weight} kg
          </Text>
        </View>
      )}
    </View>
  );
}

