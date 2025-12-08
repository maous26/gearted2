import { zodResolver } from "@hookform/resolvers/zod";
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useTheme } from "../components/ThemeProvider";
import { useProduct, useUpdateProduct } from "../hooks/useProducts";
import { CATEGORIES } from "../data/index";
import { THEMES } from "../themes";
import api from "../services/api";

// Helper function to convert file:// URI to base64
const convertImageToBase64 = async (uri: string): Promise<string> => {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const extension = uri.toLowerCase().includes('.png') ? 'png' : 'jpeg';
    return `data:image/${extension};base64,${base64}`;
  } catch (error) {
    console.error('[EditProduct] Error converting image to base64:', error);
    throw error;
  }
};

// Upload images to server and return public URLs
const uploadImagesToServer = async (imageUris: string[]): Promise<string[]> => {
  const base64Images: string[] = [];
  for (const uri of imageUris) {
    // Skip already uploaded URLs
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      base64Images.push(uri);
      continue;
    }
    const base64 = await convertImageToBase64(uri);
    base64Images.push(base64);
  }

  // Only upload if there are new images (base64)
  const newImages = base64Images.filter(img => img.startsWith('data:'));
  const existingUrls = base64Images.filter(img => img.startsWith('http'));

  if (newImages.length === 0) {
    return existingUrls;
  }

  const response = await api.post<{ success: boolean; urls: string[]; count: number }>(
    '/api/uploads/images',
    { images: newImages }
  );

  if (!response.success || !response.urls) {
    throw new Error('Failed to upload images');
  }

  return [...existingUrls, ...response.urls];
};

type ThemeTokens = typeof THEMES["ranger"];

// Zod validation schema
const editListingSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères").max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères").max(1000, "La description ne peut pas dépasser 1000 caractères"),
  category: z.string().min(1, "La catégorie est requise"),
  condition: z.string().min(1, "L'état est requis"),
  price: z.string().min(1, "Le prix est requis").refine(
    (val) => {
      const priceNum = Number(val);
      return !isNaN(priceNum) && priceNum > 0;
    },
    { message: "Le prix doit être un nombre positif" }
  ),
  images: z.array(z.string()).min(1, "Au moins une photo est requise").max(5, "Maximum 5 photos"),
  parcelLength: z.string().optional(),
  parcelWidth: z.string().optional(),
  parcelHeight: z.string().optional(),
  parcelWeight: z.string().optional(),
});

type EditListingFormData = z.infer<typeof editListingSchema>;

// Form components
function FormInputField({
  t,
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default" as any,
  error,
  required = true
}: {
  t: ThemeTokens;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: any;
  error?: string;
  required?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: t.heading,
        marginBottom: 8
      }}>
        {label} {required && <Text style={{ color: '#FF6B6B' }}>*</Text>}
      </Text>
      <TextInput
        style={{
          backgroundColor: t.cardBg,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: error ? '#FF6B6B' : t.border,
          fontSize: 16,
          color: t.heading,
          minHeight: multiline ? 100 : 50,
          textAlignVertical: multiline ? 'top' : 'center'
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        blurOnSubmit={false}
        returnKeyType={multiline ? "default" : "next"}
        autoCorrect={false}
        autoCapitalize="sentences"
      />
      {error && (
        <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

function FormSelectField({
  t,
  label,
  value,
  options,
  onSelect,
  error
}: {
  t: ThemeTokens;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  error?: string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: t.heading,
        marginBottom: 8
      }}>
        {label} <Text style={{ color: '#FF6B6B' }}>*</Text>
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: value === option.value ? t.primaryBtn : t.cardBg,
                borderWidth: 1,
                borderColor: value === option.value ? t.primaryBtn : (error ? '#FF6B6B' : t.border)
              }}
              onPress={() => onSelect(option.value)}
            >
              <Text style={{
                color: value === option.value ? t.white : t.heading,
                fontWeight: '500',
                fontSize: 14
              }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {error && (
        <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

const CONDITIONS = [
  "Neuf",
  "Excellent",
  "Très bon",
  "Bon",
  "Correct",
  "Pièces"
];

export default function EditProductScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const productId = String(params.productId || "");

  const { data: product, isLoading: isLoadingProduct } = useProduct(productId);
  const updateProductMutation = useUpdateProduct();

  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const t = THEMES[theme];

  const { control, handleSubmit, formState: { errors }, setValue, reset } = useForm<EditListingFormData>({
    resolver: zodResolver(editListingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      category: "",
      condition: "",
      images: [],
      parcelLength: "",
      parcelWidth: "",
      parcelHeight: "",
      parcelWeight: ""
    }
  });

  // Initialize form with product data
  useEffect(() => {
    if (product && !initialized) {
      reset({
        title: product.title || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        category: product.category || "",
        condition: product.condition || "",
        images: product.images || [],
        parcelLength: "",
        parcelWidth: "",
        parcelHeight: "",
        parcelWeight: ""
      });
      setImages(product.images || []);
      setInitialized(true);
    }
  }, [product, initialized, reset]);

  // Update images in form when state changes
  useEffect(() => {
    setValue('images', images);
  }, [images, setValue]);

  const onSubmit = async (data: EditListingFormData) => {
    try {
      setSubmitting(true);

      // Upload any new images to server first
      let uploadedImageUrls: string[] = [];
      try {
        console.log('[EditProduct] Uploading images...', images.length);
        uploadedImageUrls = await uploadImagesToServer(images);
        console.log('[EditProduct] Images uploaded:', uploadedImageUrls.length);
      } catch (uploadError) {
        console.error('[EditProduct] Image upload failed:', uploadError);
        Alert.alert('Erreur', 'Impossible d\'uploader les images. Veuillez réessayer.');
        setSubmitting(false);
        return;
      }

      const updateData: any = {
        title: data.title,
        description: data.description,
        price: Number(data.price),
        condition: data.condition,
        category: data.category,
        images: uploadedImageUrls,
      };

      // Add parcel dimensions if provided
      if (data.parcelLength && data.parcelWidth && data.parcelHeight && data.parcelWeight) {
        updateData.parcelLength = Number(data.parcelLength);
        updateData.parcelWidth = Number(data.parcelWidth);
        updateData.parcelHeight = Number(data.parcelHeight);
        updateData.parcelWeight = Number(data.parcelWeight);
      }

      await updateProductMutation.mutateAsync({
        id: productId,
        data: updateData
      });

      Alert.alert(
        "Succès",
        "Votre annonce a été mise à jour!",
        [
          {
            text: "Voir l'annonce",
            onPress: () => router.replace(`/product/${productId}`),
          },
        ]
      );
    } catch (e: any) {
      console.error('[EditProduct] Update failed:', e);
      Alert.alert('Erreur', e?.message || 'Impossible de mettre à jour l\'annonce');
    } finally {
      setSubmitting(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission requise", "Veuillez autoriser l'accès à vos photos");
        return;
      }

      Alert.alert(
        "Ajouter une photo",
        "Choisissez une option",
        [
          { text: "Galerie", onPress: () => selectFromGallery() },
          { text: "Appareil photo", onPress: () => takePicture() },
          { text: "Annuler", style: "cancel" }
        ]
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'accéder aux photos");
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        allowsMultipleSelection: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        if (images.length < 5) {
          setImages([...images, result.assets[0].uri]);
        } else {
          Alert.alert("Limite atteinte", "Maximum 5 photos");
        }
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const takePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "L'accès à la caméra est nécessaire");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        if (images.length < 5) {
          setImages([...images, result.assets[0].uri]);
        } else {
          Alert.alert("Limite atteinte", "Maximum 5 photos");
        }
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de prendre une photo");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  if (isLoadingProduct) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 16 }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 16 }}>Annonce non trouvée</Text>
        <TouchableOpacity
          style={{ marginTop: 16, padding: 12, backgroundColor: t.primaryBtn, borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: t.white }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      {/* Header */}
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
          style={{ padding: 8 }}
        >
          <Text style={{ fontSize: 20, color: t.heading }}>←</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: t.heading, textAlign: 'center' }}>
          Modifier l'annonce
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={80}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>

          {/* Section: Détails */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.heading, marginBottom: 16 }}>
              Détails de l'annonce
            </Text>

            {/* Title */}
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <FormInputField
                  t={t}
                  label="Titre"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: AK-74 Kalashnikov réplique"
                  error={errors.title?.message}
                />
              )}
            />

            {/* Description */}
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <FormInputField
                  t={t}
                  label="Description"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Décrivez votre matériel..."
                  multiline={true}
                  error={errors.description?.message}
                />
              )}
            />

            {/* Category */}
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <FormSelectField
                  t={t}
                  label="Catégorie"
                  value={value}
                  options={CATEGORIES.map(cat => ({ label: cat.label, value: cat.slug }))}
                  onSelect={onChange}
                  error={errors.category?.message}
                />
              )}
            />

            {/* Condition */}
            <Controller
              control={control}
              name="condition"
              render={({ field: { onChange, value } }) => (
                <FormSelectField
                  t={t}
                  label="État"
                  value={value}
                  options={CONDITIONS.map((cond: string) => ({ label: cond, value: cond }))}
                  onSelect={onChange}
                  error={errors.condition?.message}
                />
              )}
            />
          </View>

          {/* Section: Photos */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.heading, marginBottom: 8 }}>
              Photos
            </Text>

            {/* Photos sélectionnées */}
            {images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
                keyboardShouldPersistTaps="handled"
              >
                <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                  {images.map((imageUri, index) => (
                    <View key={index} style={{ position: 'relative' }}>
                      <Image
                        source={{ uri: imageUri }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          backgroundColor: t.cardBg
                        }}
                      />
                      <TouchableOpacity
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#FF6B6B',
                          borderRadius: 12,
                          width: 24,
                          height: 24,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onPress={() => removeImage(index)}
                      >
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Bouton d'ajout */}
            <TouchableOpacity
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 8,
                padding: 24,
                borderWidth: 2,
                borderColor: t.border,
                borderStyle: 'dashed',
                alignItems: 'center',
                opacity: images.length >= 5 ? 0.5 : 1
              }}
              onPress={pickImage}
              disabled={images.length >= 5}
            >
              <Text style={{ fontSize: 24, marginBottom: 8 }}>📷</Text>
              <Text style={{ color: t.muted, textAlign: 'center' }}>
                {images.length >= 5 ? 'Limite de 5 photos atteinte' : `Ajouter des photos (${images.length}/5)`}
              </Text>
            </TouchableOpacity>
            {errors.images && (
              <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4 }}>
                {errors.images.message}
              </Text>
            )}
          </View>

          {/* Section: Prix */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.heading, marginBottom: 16 }}>
              Prix
            </Text>

            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, value } }) => (
                <FormInputField
                  t={t}
                  label="Prix (€)"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: 250.00"
                  keyboardType="numeric"
                  error={errors.price?.message}
                />
              )}
            />
          </View>

          {/* Section: Dimensions du colis */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.heading, marginBottom: 8 }}>
              Dimensions du colis
            </Text>
            <Text style={{ color: t.muted, fontSize: 13, marginBottom: 16 }}>
              Optionnel - Nécessaire pour calculer les frais de livraison
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="parcelLength"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>Longueur (cm)</Text>
                      <TextInput
                        style={{
                          backgroundColor: t.cardBg,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderWidth: 1,
                          borderColor: t.border,
                          fontSize: 16,
                          color: t.heading,
                        }}
                        value={value}
                        onChangeText={onChange}
                        placeholder="30"
                        placeholderTextColor={t.muted}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="parcelWidth"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>Largeur (cm)</Text>
                      <TextInput
                        style={{
                          backgroundColor: t.cardBg,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderWidth: 1,
                          borderColor: t.border,
                          fontSize: 16,
                          color: t.heading,
                        }}
                        value={value}
                        onChangeText={onChange}
                        placeholder="20"
                        placeholderTextColor={t.muted}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="parcelHeight"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>Hauteur (cm)</Text>
                      <TextInput
                        style={{
                          backgroundColor: t.cardBg,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderWidth: 1,
                          borderColor: t.border,
                          fontSize: 16,
                          color: t.heading,
                        }}
                        value={value}
                        onChangeText={onChange}
                        placeholder="15"
                        placeholderTextColor={t.muted}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="parcelWeight"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <Text style={{ fontSize: 14, color: t.muted, marginBottom: 4 }}>Poids (kg)</Text>
                      <TextInput
                        style={{
                          backgroundColor: t.cardBg,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderWidth: 1,
                          borderColor: t.border,
                          fontSize: 16,
                          color: t.heading,
                        }}
                        value={value}
                        onChangeText={onChange}
                        placeholder="2.5"
                        placeholderTextColor={t.muted}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  )}
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={{
              backgroundColor: t.primaryBtn,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 32,
              opacity: submitting ? 0.6 : 1
            }}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
          >
            <Text style={{
              color: t.white,
              fontWeight: 'bold',
              fontSize: 18
            }}>
              {submitting ? 'Mise à jour...' : "Enregistrer les modifications"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
