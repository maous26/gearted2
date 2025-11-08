import React, { useState } from "react";
import {
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { THEMES } from "../themes";
import { useTheme } from "./ThemeProvider";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  sellerName: string;
}

export default function RatingModal({
  visible,
  onClose,
  onSubmit,
  sellerName
}: RatingModalProps) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Veuillez sélectionner une note");
      return;
    }
    onSubmit(rating, comment);
    setRating(0);
    setComment("");
    onClose();
  };

  const StarButton = ({ index }: { index: number }) => (
    <TouchableOpacity
      onPress={() => setRating(index)}
      style={{ padding: 4 }}
    >
      <Text style={{ fontSize: 40 }}>
        {index <= rating ? "⭐" : "☆"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
      }}>
        <View style={{
          backgroundColor: t.cardBg,
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          borderWidth: 1,
          borderColor: t.border
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: t.heading
            }}>
              Noter le vendeur
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: t.muted }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Seller Name */}
          <Text style={{
            fontSize: 16,
            color: t.heading,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            {sellerName}
          </Text>

          {/* Stars */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 24
          }}>
            {[1, 2, 3, 4, 5].map((index) => (
              <StarButton key={index} index={index} />
            ))}
          </View>

          {/* Rating Labels */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 24,
            paddingHorizontal: 8
          }}>
            <Text style={{ fontSize: 12, color: t.muted }}>Très mauvais</Text>
            <Text style={{ fontSize: 12, color: t.muted }}>Excellent</Text>
          </View>

          {/* Comment */}
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: t.heading,
            marginBottom: 8
          }}>
            Commentaire (optionnel)
          </Text>
          <TextInput
            style={{
              backgroundColor: t.rootBg,
              borderRadius: 12,
              padding: 12,
              fontSize: 16,
              color: t.heading,
              borderWidth: 1,
              borderColor: t.border,
              minHeight: 100,
              textAlignVertical: 'top',
              marginBottom: 24
            }}
            placeholder="Partagez votre expérience avec ce vendeur..."
            value={comment}
            onChangeText={setComment}
            placeholderTextColor={t.muted}
            multiline
            maxLength={500}
          />

          {/* Character count */}
          <Text style={{
            fontSize: 12,
            color: t.muted,
            textAlign: 'right',
            marginBottom: 16
          }}>
            {comment.length}/500
          </Text>

          {/* Buttons */}
          <View style={{
            flexDirection: 'row',
            gap: 12
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: t.cardBg,
                borderRadius: 12,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: t.border
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: t.heading,
                textAlign: 'center'
              }}>
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={{
                flex: 1,
                backgroundColor: t.primaryBtn,
                borderRadius: 12,
                paddingVertical: 14
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF',
                textAlign: 'center'
              }}>
                Envoyer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
