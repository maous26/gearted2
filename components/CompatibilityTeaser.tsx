import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { compatibilityApi, SearchItem, VerifiedCompatibility } from "../services/compatibility";
import { ThemeKey, THEMES } from "../themes";
import { ItemSearch } from "./ItemSearch";

export function CompatibilityTeaser({ 
  theme,
  onOpenDrawer 
}: { 
  theme: ThemeKey;
  onOpenDrawer?: (item1: SearchItem, item2: SearchItem, result: VerifiedCompatibility) => void;
}) {
  const [item1, setItem1] = useState<SearchItem | null>(null);
  const [item2, setItem2] = useState<SearchItem | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<VerifiedCompatibility | null>(null);
  const t = THEMES[theme];

  const handleCheckCompatibility = async () => {
    if (!item1 || !item2) return;

    setChecking(true);
    setResult(null);

    try {
      const compatResult = await compatibilityApi.checkItemCompatibility(item1.id, item2.id);
      setResult(compatResult);
      
      if (compatResult && onOpenDrawer) {
        onOpenDrawer(item1, item2, compatResult);
      }
    } catch (error) {
      console.error('Compatibility check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const canCheck = item1 && item2;

  return (
    <View style={{
      backgroundColor: t.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <Text style={{
        color: t.heading,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center'
      }}>
        🔧 Quick Compatibility Check
      </Text>
      
      <Text style={{
        color: t.muted,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16
      }}>
        Check if two airsoft items are compatible
      </Text>

      <View style={{ marginBottom: 12 }}>
        <Text style={{
          color: t.muted,
          fontSize: 12,
          marginBottom: 6,
          fontWeight: '500'
        }}>
          First Item
        </Text>
        <ItemSearch
          placeholder="Search for first item..."
          onSelectItem={setItem1}
          excludeItemId={item2?.id}
        />
        {item1 && (
          <View style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: t.rootBg,
            borderRadius: 6,
          }}>
            <Text style={{ color: t.heading, fontSize: 12, fontWeight: '600' }}>
              {item1.name}
            </Text>
            <Text style={{ color: t.muted, fontSize: 10 }}>
              {item1.manufacturer} • {item1.reference} • {item1.type}
            </Text>
          </View>
        )}
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{
          color: t.muted,
          fontSize: 12,
          marginBottom: 6,
          fontWeight: '500'
        }}>
          Second Item
        </Text>
        <ItemSearch
          placeholder="Search for second item..."
          onSelectItem={setItem2}
          excludeItemId={item1?.id}
        />
        {item2 && (
          <View style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: t.rootBg,
            borderRadius: 6,
          }}>
            <Text style={{ color: t.heading, fontSize: 12, fontWeight: '600' }}>
              {item2.name}
            </Text>
            <Text style={{ color: t.muted, fontSize: 10 }}>
              {item2.manufacturer} • {item2.reference} • {item2.type}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={handleCheckCompatibility}
        disabled={!canCheck || checking}
        style={{
          backgroundColor: canCheck ? t.primaryBtn : t.border,
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        {checking ? (
          <ActivityIndicator size="small" color={t.white} />
        ) : (
          <Text style={{
            color: canCheck ? t.white : t.muted,
            fontSize: 14,
            fontWeight: '600'
          }}>
            {canCheck ? "Check Compatibility" : "Select two items to check"}
          </Text>
        )}
      </TouchableOpacity>

      {result && !checking && (
        <View style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: result.compatible ? '#E7F6ED' : '#FFE5E5',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: result.compatible ? '#4CAF50' : '#F44336',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>
              {result.compatible ? '✅' : '❌'}
            </Text>
            <Text style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: result.compatible ? '#2E7D32' : '#C62828',
            }}>
              {result.compatible ? 'Compatible' : 'Not Compatible'}
            </Text>
          </View>

          {result.verified === false && (
            <View style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: '#FFF9E6',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#FFB300',
            }}>
              <Text style={{ fontSize: 12, color: '#F57C00', fontWeight: '600' }}>
                ⚠️ No verified compatibility data available
              </Text>
              <Text style={{ fontSize: 10, color: '#E65100', marginTop: 4 }}>
                We cannot confirm compatibility between these items. Only purchase if you have verified compatibility yourself.
              </Text>
            </View>
          )}

          {result.compatible && result.verified && (
            <>
              {result.score && (
                <Text style={{ fontSize: 12, color: '#2E7D32', marginTop: 4 }}>
                  Compatibility Score: {result.score}%
                </Text>
              )}
              {result.requiresModification && (
                <Text style={{ fontSize: 11, color: '#F57C00', marginTop: 4 }}>
                  ⚠️ May require modification for proper fit
                </Text>
              )}
              {result.notes && (
                <Text style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
                  Note: {result.notes}
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}
