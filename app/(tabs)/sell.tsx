import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useTheme } from "../../components/ThemeProvider";
import { useUser } from "../../components/UserProvider";
import { SHIPPING_CATEGORIES } from "../../constants/shipping";
import { CATEGORIES } from "../../data/index";
import { usePublicSettings } from "../../hooks/useProducts";
import api from "../../services/api";
import { useProductsStore } from "../../stores/productsStore";
import { THEMES } from "../../themes";

// Helper function to convert file:// URI to base64
const convertImageToBase64 = async (uri: string): Promise<string> => {
  // If already a valid URL, return as-is
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // Convert file:// URI to base64
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    // Determine extension from URI
    const extension = uri.toLowerCase().includes('.png') ? 'png' : 'jpeg';
    return `data:image/${extension};base64,${base64}`;
  } catch (error) {
    console.error('[Sell] Error converting image to base64:', error);
    throw error;
  }
};

// Upload images to server and return public URLs
const uploadImagesToServer = async (imageUris: string[]): Promise<string[]> => {
  const base64Images: string[] = [];

  // Convert all images to base64
  for (const uri of imageUris) {
    const base64 = await convertImageToBase64(uri);
    base64Images.push(base64);
  }

  // Upload to server
  const response = await api.post<{ success: boolean; urls: string[]; count: number }>(
    '/api/uploads/images',
    { images: base64Images }
  );

  if (!response.success || !response.urls) {
    throw new Error('Failed to upload images');
  }

  return response.urls;
};

type ThemeTokens = typeof THEMES["ranger"];

// Zod validation schema for sale listings
const listingSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères").max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères").max(1000, "La description ne peut pas dépasser 1000 caractères"),
  category: z.string().min(1, "La catégorie est requise"),
  condition: z.string().min(1, "L'état est requis"),
  brand: z.string().optional(),
  price: z.string().min(1, "Le prix est requis").refine(
    (val) => {
      const priceNum = Number(val);
      return !isNaN(priceNum) && priceNum > 0;
    },
    { message: "Le prix doit être un nombre positif" }
  ),
  images: z.array(z.string()).min(1, "Au moins une photo est requise").max(5, "Maximum 5 photos"),
  handDelivery: z.boolean().optional(),
  boost: z.boolean().optional(),
  // Catégorie d'expédition (obligatoire si pas de remise en main propre)
  shippingCategory: z.string().optional(),
  // Dimensions personnalisées (uniquement pour CAT_VOLUMINEUX)
  customParcelLength: z.string().optional(),
  customParcelWidth: z.string().optional(),
  customParcelHeight: z.string().optional(),
  customParcelWeight: z.string().optional(),
}).refine(
  (data) => {
    // Si remise en main propre, pas besoin de catégorie d'expédition
    if (data.handDelivery) return true;
    // Sinon, la catégorie d'expédition est obligatoire
    return data.shippingCategory && data.shippingCategory.length > 0;
  },
  { message: "La catégorie d'expédition est requise", path: ["shippingCategory"] }
).refine(
  (data) => {
    // Si catégorie volumineux, les dimensions sont obligatoires
    if (data.shippingCategory === 'CAT_VOLUMINEUX') {
      return data.customParcelLength && data.customParcelWidth &&
             data.customParcelHeight && data.customParcelWeight;
    }
    return true;
  },
  { message: "Les dimensions sont requises pour un colis volumineux", path: ["customParcelLength"] }
);

type ListingFormData = z.infer<typeof listingSchema>;

// Stable components (defined outside SellScreen) to prevent remounts on keystroke
function FormInputField({
  t,
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default" as any,
  error
}: {
  t: ThemeTokens;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: any;
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
  placeholder,
  error
}: {
  t: ThemeTokens;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  placeholder: string;
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

const BRANDS = [
  "Tokyo Marui",
  "G&G",
  "VFC",
  "WE Tech",
  "KWA",
  "Krytac",
  "ASG",
  "Cyma",
  "LCT",
  "E&L",
  "APS",
  "Ares",
  "Classic Army",
  "ICS",
  "Marui",
  "Other"
];

export default function SellScreen() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const addProduct = useProductsStore((state) => state.addProduct);
  
  // Récupérer les paramètres publics (boost activé ou non)
  const { data: publicSettings } = usePublicSettings();
  const isBoostEnabled = publicSettings?.boost?.enabled ?? false;

  const t = THEMES[theme];

  // React Hook Form setup
  const { control, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      category: "",
      condition: "",
      brand: "",
      images: [],
      handDelivery: false,
      boost: false,
      shippingCategory: "",
      customParcelLength: "",
      customParcelWidth: "",
      customParcelHeight: "",
      customParcelWeight: ""
    }
  });

  // Watch handDelivery to show/hide parcel dimensions
  const handDeliveryEnabled = watch("handDelivery");

  // Update images in form when state changes
  React.useEffect(() => {
    setValue('images', images);
  }, [images, setValue]);

  const onSubmit = async (data: ListingFormData) => {
    try {
      setSubmitting(true);
      const wantsBoost = Boolean(data.boost);

      // Upload images to server first
      console.log('[Sell] Uploading images to server...');
      let uploadedImageUrls: string[] = [];
      try {
        uploadedImageUrls = await uploadImagesToServer(images);
        console.log('[Sell] Images uploaded successfully:', uploadedImageUrls.length);
      } catch (uploadError) {
        console.error('[Sell] Failed to upload images:', uploadError);
        Alert.alert('Erreur', 'Impossible d\'uploader les images. Veuillez réessayer.');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: data.title,
        description: data.description,
        price: Number(data.price),
        condition: data.condition,
        category: data.category,
        location: 'Paris, 75001',
        images: uploadedImageUrls, // Use uploaded URLs instead of local file:// URIs
        handDelivery: Boolean(data.handDelivery),
        featured: false, // Le boost sera activé après paiement
        // Catégorie d'expédition (obligatoire si pas de remise en main propre)
        shippingCategory: data.shippingCategory || null,
        // Dimensions personnalisées (uniquement pour CAT_VOLUMINEUX)
        customParcelLength: data.customParcelLength ? Number(data.customParcelLength) : null,
        customParcelWidth: data.customParcelWidth ? Number(data.customParcelWidth) : null,
        customParcelHeight: data.customParcelHeight ? Number(data.customParcelHeight) : null,
        customParcelWeight: data.customParcelWeight ? Number(data.customParcelWeight) : null,
      };
      const created = await api.post<{ id: string }>("/api/products", {
        ...payload,
        seller: user?.username,
        sellerId: user?.id,
      }, {
        headers: user?.username ? { 'x-user': user.username } : undefined
      });

      // Add to local store for persistence
      addProduct({
        id: created.id,
        title: data.title,
        description: data.description,
        price: payload.price,
        condition: data.condition,
        category: data.category,
        location: 'Paris, 75001',
        seller: user?.username || 'Utilisateur',
        sellerId: user?.id || 'user-1',
        rating: 4.5,
        images: uploadedImageUrls, // Use uploaded URLs
        featured: false,
        createdAt: new Date().toISOString(),
        handDelivery: Boolean(data.handDelivery),
      });

      // refresh products list cache
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Si l'utilisateur veut booster, rediriger vers l'écran de paiement
      if (wantsBoost) {
        reset();
        setImages([]);
        router.replace({
          pathname: '/boost-payment' as any,
          params: {
            productId: created.id,
            productTitle: data.title,
            boostType: 'BOOST_7D',
          },
        });
        return;
      }

      // Sinon, afficher le message de succès normal
      Alert.alert(
        "Succès",
        "Votre annonce a été publiée!",
        [
          {
            text: "Voir",
            onPress: () => {
              reset();
              setImages([]);
              router.replace(`/product/${created.id}`);
            },
          },
          {
            text: "OK",
            onPress: () => {
              reset();
              setImages([]);
              router.back();
            },
            style: 'cancel',
          },
        ]
      );
    } catch (e: any) {
      console.error('[Sell] Product creation failed:', e);

      // Check for session expiration
      const errorMessage = e?.message || e?.response?.data?.error || '';
      if (errorMessage.includes('Session expired') || e?.response?.status === 401) {
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter pour publier votre annonce.',
          [
            {
              text: 'Se reconnecter',
              onPress: () => router.replace('/login'),
            },
            { text: 'Annuler', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Erreur', `Impossible de publier votre annonce: ${errorMessage || 'Erreur inconnue'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pickImage = async () => {
    try {
      // Demander permission pour accéder à la galerie
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission requise", "Veuillez autoriser l'accès à vos photos pour ajouter des images");
        return;
      }

      // Afficher les options de sélection
      Alert.alert(
        "Ajouter une photo",
        "Choisissez une option",
        [
          {
            text: "Galerie",
            onPress: () => selectFromGallery()
          },
          {
            text: "Appareil photo",
            onPress: () => takePicture()
          },
          {
            text: "Annuler",
            style: "cancel"
          }
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
        quality: 0.7, // Réduit de 0.8 à 0.7 pour des fichiers plus légers
        allowsMultipleSelection: false,
        exif: false, // Retire les métadonnées pour réduire la taille
      });

      if (!result.canceled && result.assets[0]) {
        if (images.length < 5) {
          setImages([...images, result.assets[0].uri]);
        } else {
          Alert.alert("Limite atteinte", "Vous ne pouvez ajouter que 5 photos maximum");
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
        quality: 0.7, // Réduit de 0.8 à 0.7 pour des fichiers plus légers
        exif: false, // Retire les métadonnées
      });

      if (!result.canceled && result.assets[0]) {
        if (images.length < 5) {
          setImages([...images, result.assets[0].uri]);
        } else {
          Alert.alert("Limite atteinte", "Vous ne pouvez ajouter que 5 photos maximum");
        }
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de prendre une photo");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Toggle field for Remise en main propre
  const HandDeliveryToggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 8 }}>
        Remise en main propre
      </Text>
      <TouchableOpacity
        onPress={() => onChange(!value)}
        style={{
          backgroundColor: value ? t.primaryBtn : t.cardBg,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: value ? t.primaryBtn : t.border,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: value ? t.white : t.heading, fontWeight: '600' }}>
          {value ? '✅ Activée' : 'Activer la remise en main propre'}
        </Text>
      </TouchableOpacity>
      <Text style={{ color: t.muted, fontSize: 12, marginTop: 6 }}>
        Si activée, l'acheteur devra récupérer l'article en personne.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={80}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Form */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>

          {/* Progress Steps (Visual only) */}
          <View style={{ flexDirection: 'row', marginBottom: 24, paddingHorizontal: 8 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.primaryBtn, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>1</Text>
              </View>
              <Text style={{ fontSize: 12, color: t.heading, fontWeight: '600' }}>Détails</Text>
            </View>
            <View style={{ width: 40, height: 2, backgroundColor: t.border, marginTop: 15 }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: images.length > 0 ? t.primaryBtn : t.cardBg, borderWidth: 1, borderColor: images.length > 0 ? t.primaryBtn : t.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: images.length > 0 ? 'white' : t.muted, fontWeight: 'bold' }}>2</Text>
              </View>
              <Text style={{ fontSize: 12, color: images.length > 0 ? t.heading : t.muted, fontWeight: '600' }}>Photos</Text>
            </View>
            <View style={{ width: 40, height: 2, backgroundColor: t.border, marginTop: 15 }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.cardBg, borderWidth: 1, borderColor: t.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: t.muted, fontWeight: 'bold' }}>3</Text>
              </View>
              <Text style={{ fontSize: 12, color: t.muted, fontWeight: '600' }}>Prix</Text>
            </View>
          </View>

          {/* Section 1: Détails */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.heading, marginBottom: 16 }}>
              📝 Détails de l'annonce
            </Text>
            {/* Title */}
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <FormInputField
                  t={t}
                  label="Titre de l'annonce"
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
                  placeholder="Décrivez votre matériel, son état, ses caractéristiques..."
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
                  placeholder="Sélectionnez une catégorie"
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
                  placeholder="État du matériel"
                  error={errors.condition?.message}
                />
              )}
            />

            {/* Brand */}
            <Controller
              control={control}
              name="brand"
              render={({ field: { onChange, value } }) => (
                <FormSelectField
                  t={t}
                  label="Marque"
                  value={value || ""}
                  options={BRANDS.map((b: string) => ({ label: b, value: b }))}
                  onSelect={onChange}
                  placeholder="Marque du produit"
                />
              )}
            />



          </View>

          {/* Section 2: Photos */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.heading, marginBottom: 8 }}>
              📸 Photos
            </Text>
            <View style={{ backgroundColor: t.primaryBtn + '10', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: t.primaryBtn, fontSize: 13 }}>
                💡 Conseil : Ajoutez au moins 3 photos sous différents angles pour vendre 2x plus vite !
              </Text>
            </View>
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: t.heading,
                marginBottom: 8
              }}>
                Photos ({images.length}/5)
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
                  padding: 32,
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
                  {images.length >= 5 ? 'Limite de 5 photos atteinte' : 'Ajouter des photos'}
                  {images.length < 5 && `\n(${5 - images.length} restantes)`}
                </Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Section 3: Prix & Livraison */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.heading, marginBottom: 16 }}>
              💰 Prix & Livraison
            </Text>

            {/* Price */}
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, value } }) => (
                <FormInputField
                  t={t}
                  label="Prix"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: 250.00"
                  keyboardType="numeric"
                  error={errors.price?.message}
                />
              )}
            />

            {/* Remise en main propre */}
            <Controller
              control={control}
              name="handDelivery"
              render={({ field: { value, onChange } }) => (
                <HandDeliveryToggle value={!!value} onChange={onChange} />
              )}
            />

            {/* Catégorie d'expédition - visible uniquement si pas de remise en main propre */}
            {!handDeliveryEnabled && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 8 }}>
                  Catégorie d'expédition <Text style={{ color: '#FF6B6B' }}>*</Text>
                </Text>

                {/* Info box explicatif */}
                <View style={{ backgroundColor: '#3498db' + '15', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ color: '#2980b9', fontSize: 13, lineHeight: 18 }}>
                    📦 Choisissez la catégorie correspondant au poids de votre colis. Les frais de port seront calculés automatiquement.
                  </Text>
                </View>

                {/* Shipping category selector */}
                <Controller
                  control={control}
                  name="shippingCategory"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      {SHIPPING_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => onChange(cat.id)}
                          style={{
                            backgroundColor: value === cat.id ? t.primaryBtn + '15' : t.cardBg,
                            borderRadius: 12,
                            padding: 14,
                            marginBottom: 10,
                            borderWidth: 2,
                            borderColor: value === cat.id ? t.primaryBtn : (errors.shippingCategory ? '#FF6B6B' : t.border),
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 24, marginRight: 12 }}>{cat.icon}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: value === cat.id ? t.primaryBtn : t.heading,
                                marginBottom: 2
                              }}>
                                {cat.name}
                              </Text>
                              <Text style={{ fontSize: 13, color: t.muted }}>
                                {cat.weightRange} • {cat.description}
                              </Text>
                              <Text style={{ fontSize: 12, color: t.muted, marginTop: 4, fontStyle: 'italic' }}>
                                Ex: {cat.examples.slice(0, 2).join(', ')}
                              </Text>
                            </View>
                            {value === cat.id && (
                              <View style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: t.primaryBtn,
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                      {errors.shippingCategory && (
                        <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4 }}>
                          {errors.shippingCategory.message}
                        </Text>
                      )}
                    </View>
                  )}
                />

                {/* Dimensions personnalisées pour CAT_VOLUMINEUX */}
                {watch('shippingCategory') === 'CAT_VOLUMINEUX' && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.heading, marginBottom: 12 }}>
                      Dimensions du colis volumineux <Text style={{ color: '#FF6B6B' }}>*</Text>
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Controller
                          control={control}
                          name="customParcelLength"
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
                                  borderColor: errors.customParcelLength ? '#FF6B6B' : t.border,
                                  fontSize: 16,
                                  color: t.heading,
                                }}
                                value={value}
                                onChangeText={onChange}
                                placeholder="100"
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
                          name="customParcelWidth"
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
                                placeholder="50"
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
                          name="customParcelHeight"
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
                                placeholder="40"
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
                          name="customParcelWeight"
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
                                placeholder="10"
                                placeholderTextColor={t.muted}
                                keyboardType="decimal-pad"
                              />
                            </View>
                          )}
                        />
                      </View>
                    </View>

                    {errors.customParcelLength && (
                      <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 8 }}>
                        {errors.customParcelLength.message}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Section 4: Options Premium - Seulement si boost activé dans les paramètres */}
          {isBoostEnabled && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: t.heading, marginBottom: 8 }}>
                ⭐ Booster mon annonce
              </Text>
              <View style={{ backgroundColor: '#FFB800' + '15', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: '#B8860B', fontSize: 13 }}>
                  🚀 Une annonce boostée apparaît en priorité dans "À la une" et en tête des résultats de recherche !
                </Text>
              </View>

              <Controller
                control={control}
                name="boost"
                render={({ field: { value, onChange } }) => (
                  <View style={{ marginBottom: 16 }}>
                    <TouchableOpacity
                      onPress={() => onChange(!value)}
                      style={{
                        backgroundColor: value ? '#FFB800' : t.cardBg,
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 2,
                        borderColor: value ? '#FFB800' : t.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          color: value ? '#1a1a1a' : t.heading,
                          fontWeight: '700',
                          fontSize: 16,
                          marginBottom: 4
                        }}>
                          {value ? '⭐ Annonce boostée' : '🚀 Booster cette annonce'}
                        </Text>
                        <Text style={{ color: value ? '#333' : t.muted, fontSize: 13 }}>
                          Visibilité maximale pendant 7 jours
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: value ? '#1a1a1a' : t.primaryBtn,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8
                      }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                          2,99 €
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              />

              <Text style={{ color: t.muted, fontSize: 11, marginBottom: 16, textAlign: 'center' }}>
                Le paiement du boost (4,99 €) sera demande avant la publication
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <View style={{ marginBottom: 24 }}>
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
                {submitting ? 'Publication...' : "Publier l'annonce"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}