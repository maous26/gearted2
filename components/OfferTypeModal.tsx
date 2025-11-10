import React from "react";
import {
    Alert,
    Dimensions,
    Modal,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { THEMES } from "../themes";
import { useTheme } from "./ThemeProvider";

const { width } = Dimensions.get('window');

interface OfferTypeModalProps {
  visible: boolean;
  onClose: () => void;
  productTitle: string;
  price: number;
  tradeFor?: string;
  onBuy: () => void;
  onTrade: () => void;
}

export default function OfferTypeModal({
  visible,
  onClose,
  productTitle,
  price,
  tradeFor,
  onBuy,
  onTrade,
}: OfferTypeModalProps) {
  const { theme } = useTheme();
  const t = THEMES[theme];

  const handleBuy = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        "Achat confirmé",
        `Vous avez choisi d'acheter "${productTitle}" pour ${price.toFixed(2)} €`,
        [{ text: "OK", onPress: onBuy }]
      );
    }, 300);
  };

  const handleTrade = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        "Proposition d'échange",
        `Vous souhaitez proposer un échange pour "${productTitle}". Le vendeur recherche : ${tradeFor}`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Proposer", onPress: onTrade }
        ]
      );
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            width: width - 48,
            backgroundColor: t.cardBg,
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={{ marginBottom: 24, alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: t.heading,
              textAlign: 'center',
              marginBottom: 8,
            }}>
              Comment souhaitez-vous procéder ?
            </Text>
            <Text style={{
              fontSize: 14,
              color: t.muted,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              Ce vendeur accepte l'achat et l'échange
            </Text>
          </View>

          {/* Product Info */}
          <View style={{
            backgroundColor: t.sectionLight,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: t.border,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8,
            }}>
              {productTitle}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 12, color: t.muted, marginBottom: 4 }}>
                  Prix d'achat
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: t.primaryBtn }}>
                  {price.toFixed(2)} €
                </Text>
              </View>
              {tradeFor && (
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{ fontSize: 12, color: t.muted, marginBottom: 4 }}>
                    Recherche en échange
                  </Text>
                  <Text style={{ fontSize: 13, color: t.heading, lineHeight: 18 }} numberOfLines={2}>
                    {tradeFor}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View>
            {/* Buy Button */}
            <TouchableOpacity
              style={{
                backgroundColor: t.primaryBtn,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                marginBottom: 12,
              }}
              onPress={handleBuy}
            >
              <Text style={{ fontSize: 20, marginRight: 8 }}>💰</Text>
              <View>
                <Text style={{
                  color: t.white,
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                  Acheter maintenant
                </Text>
                <Text style={{
                  color: t.white + 'DD',
                  fontSize: 12,
                }}>
                  {price.toFixed(2)} €
                </Text>
              </View>
            </TouchableOpacity>

            {/* Trade Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#4ECDC4',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                marginBottom: 12,
              }}
              onPress={handleTrade}
            >
              <Text style={{ fontSize: 20, marginRight: 8 }}>🔄</Text>
              <View>
                <Text style={{
                  color: t.white,
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                  Proposer un échange
                </Text>
                <Text style={{
                  color: t.white + 'DD',
                  fontSize: 12,
                }} numberOfLines={1}>
                  {tradeFor ? tradeFor.substring(0, 30) + (tradeFor.length > 30 ? '...' : '') : 'Voir détails'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: t.border,
              }}
              onPress={onClose}
            >
              <Text style={{
                color: t.muted,
                fontSize: 15,
                fontWeight: '600',
              }}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
