import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { compatibilityApi, CompatibilityResult, CompatiblePart } from "../services/compatibility";
import { ThemeKey, THEMES } from "../themes";

const { height: screenHeight } = Dimensions.get('window');

interface CompatDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  theme: ThemeKey;
  weaponType?: string;
  manufacturer?: string;
}

export function CompatDrawer({ 
  isVisible, 
  onClose, 
  theme,
  weaponType = "ASSAULT_RIFLE",
  manufacturer = "Tokyo Marui"
}: CompatDrawerProps) {
  const t = THEMES[theme];
  const [compatibilityData, setCompatibilityData] = useState<CompatibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible && manufacturer && weaponType) {
      fetchCompatibility();
    }
  }, [isVisible, manufacturer, weaponType]);

  const fetchCompatibility = async () => {
    setIsLoading(true);
    try {
      const data = await compatibilityApi.checkCompatibility(manufacturer, weaponType);
      setCompatibilityData(data);
    } catch (error) {
      console.error('Error fetching compatibility:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCompatibilityColor = (percentage: string) => {
    const num = parseInt(percentage);
    if (num >= 95) return "#22c55e"; // green
    if (num >= 85) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: t.rootBg,
      }}>
        {/* Header */}
        <View style={{
          backgroundColor: t.navBg,
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: t.heading,
                fontSize: 18,
                fontWeight: 'bold',
              }}>
                Compatibility Results
              </Text>
              <Text style={{
                color: t.muted,
                fontSize: 14,
                marginTop: 2,
              }}>
                {compatibilityData?.manufacturer} - {compatibilityData?.weaponType.replace(/_/g, ' ')}
                {compatibilityData?.weaponModel && ` (${compatibilityData.weaponModel})`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: t.border,
                borderRadius: 20,
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: t.heading, fontSize: 16, fontWeight: 'bold' }}>
                ×
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
        >
          {isLoading ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={t.primaryBtn} />
              <Text style={{ color: t.muted, marginTop: 16 }}>
                Finding compatible parts...
              </Text>
            </View>
          ) : compatibilityData ? (
            <>
              <Text style={{
                color: t.muted,
                fontSize: 14,
                textAlign: 'center',
                marginBottom: 24,
              }}>
                Compatible parts for your {compatibilityData.manufacturer} {compatibilityData.weaponType.replace(/_/g, ' ')}
              </Text>

              {Object.entries(compatibilityData.compatibility).map(([category, items], categoryIndex) => (
                <View key={categoryIndex} style={{ marginBottom: 24 }}>
                  <Text style={{
                    color: t.heading,
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 12,
                  }}>
                    {category}
                  </Text>

                  {items.map((item: CompatiblePart, itemIndex: number) => (
                    <View
                      key={itemIndex}
                      style={{
                        backgroundColor: t.cardBg,
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: t.border,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          color: t.heading,
                          fontSize: 14,
                          fontWeight: '500',
                          marginBottom: 4,
                        }}>
                          {item.name}
                        </Text>
                        <Text style={{
                          color: t.muted,
                          fontSize: 12,
                          marginBottom: 4,
                        }}>
                          by {item.manufacturer}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            backgroundColor: getCompatibilityColor(item.compatibility),
                            borderRadius: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            marginRight: 8,
                          }}>
                            <Text style={{
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 'bold',
                            }}>
                              {item.compatibility}
                            </Text>
                          </View>
                          <Text style={{
                            color: t.muted,
                            fontSize: 12,
                          }}>
                            Compatibility
                          </Text>
                        </View>
                        {item.requiresModification && (
                          <Text style={{
                            color: '#eab308',
                            fontSize: 11,
                            marginTop: 4,
                            fontStyle: 'italic',
                          }}>
                            ⚠️ May require modification
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{
                          color: t.heading,
                          fontSize: 16,
                          fontWeight: 'bold',
                        }}>
                          {item.price}
                        </Text>
                        <TouchableOpacity
                          style={{
                            backgroundColor: t.primaryBtn,
                            borderRadius: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            marginTop: 4,
                          }}
                        >
                          <Text style={{
                            color: t.white,
                            fontSize: 12,
                            fontWeight: '600',
                          }}>
                            View
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: t.muted, textAlign: 'center' }}>
                No compatibility data available
              </Text>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}