import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Dimensions,
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
import { CATEGORIES } from "../../data/index";
import api from "../../services/api";
import { useProductsStore } from "../../stores/productsStore";
import { THEMES } from "../../themes";

type ThemeTokens = typeof THEMES["ranger"];

// Combined Zod validation schema
const listingSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères").max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères").max(1000, "La description ne peut pas dépasser 1000 caractères"),
  category: z.string().min(1, "La catégorie est requise"),
  condition: z.string().min(1, "L'état est requis"),
  brand: z.string().optional(),
  price: z.string().optional(),
  wantedItems: z.string().optional(),
  exchangeValue: z.string().optional(),
  images: z.array(z.string()).min(1, "Au moins une photo est requise").max(5, "Maximum 5 photos"),
  handDelivery: z.boolean().optional(),
}).refine(
  (data) => {
    // For sell type, price is required and must be valid
    if (data.price !== undefined && data.price.trim() !== '') {
      const priceNum = Number(data.price);
      return !isNaN(priceNum) && priceNum > 0;
    }
    return true;
  },
  { message: "Le prix doit être un nombre positif", path: ["price"] }
).refine(
  (data) => {
    // For exchange type, wantedItems is required
    if (data.wantedItems !== undefined && data.wantedItems.trim() !== '') {
      return data.wantedItems.length >= 10;
    }
    return true;
  },
  { message: "Décrivez ce que vous recherchez (min. 10 caractères)", path: ["wantedItems"] }
);

type ListingFormData = z.infer<typeof listingSchema>;

// Stable components (defined outside SellScreen) to prevent remounts on keystroke
function TypeTabButton({
  t,
  type,
  label,
  currentType,
  onPress,
}: {
  t: ThemeTokens;
  type: "SALE" | "TRADE" | "BOTH";
  label: string;
  currentType: "SALE" | "TRADE" | "BOTH";
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={{
        flex: 1,
        paddingVertical: 12,
        backgroundColor: currentType === type ? t.primaryBtn : t.cardBg,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: currentType === type ? t.primaryBtn : t.border
      }}
      onPress={onPress}
    >
      <Text style={{
        color: currentType === type ? t.white : t.heading,
        fontWeight: '600',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

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
        blurOnSubmit={true}
        returnKeyType="done"
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

const { width } = Dimensions.get('window');

type ListingType = "SALE" | "TRADE" | "BOTH";

export default function SellScreen() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [listingType, setListingType] = useState<ListingType>("SALE");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const addProduct = useProductsStore((state) => state.addProduct);
  
  const t = THEMES[theme];

  // React Hook Form setup
  const { control, handleSubmit, formState: { errors }, setValue, reset } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      category: "",
      condition: "",
      brand: "",
      wantedItems: "",
      exchangeValue: "",
  images: [],
  handDelivery: false
    }
  });

  // Update images in form when state changes
  React.useEffect(() => {
    setValue('images', images);
  }, [images, setValue]);

  const onSubmit = async (data: ListingFormData) => {
    // Validate based on listing type
    if (listingType === 'SALE' && (!data.price || data.price.trim() === '')) {
      Alert.alert("Erreur", "Le prix est requis pour une vente");
      return;
    }
    if ((listingType === 'TRADE' || listingType === 'BOTH') && (!data.wantedItems || data.wantedItems.trim() === '')) {
      Alert.alert("Erreur", "Veuillez indiquer ce que vous recherchez en échange");
      return;
    }
    try {
      setSubmitting(true);
      const payload: any = {
        title: data.title,
        description: data.description,
        price: (listingType === 'SALE' || listingType === 'BOTH') ? Number(data.price) : 0,
        condition: data.condition,
        category: data.category,
        location: 'Paris, 75001',
        images,
        listingType,
        tradeFor: (listingType === 'TRADE' || listingType === 'BOTH') ? data.wantedItems : undefined,
        handDelivery: Boolean(data.handDelivery),
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
        images,
        featured: false,
        createdAt: new Date().toISOString(),
        handDelivery: Boolean(data.handDelivery),
        listingType,
        tradeFor: payload.tradeFor,
      });
      
      // refresh products list cache
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      Alert.alert(
        "Succès",
        listingType === 'SALE'
          ? "Votre annonce de vente a été publiée !"
          : listingType === 'TRADE'
          ? "Votre annonce d'échange a été publiée !"
          : "Votre annonce a été publiée !",
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
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible de publier votre annonce");
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

  const TabButton = ({ type, label }: { type: ListingType; label: string }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        paddingVertical: 12,
        backgroundColor: listingType === type ? t.primaryBtn : t.cardBg,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: listingType === type ? t.primaryBtn : t.border
      }}
      onPress={() => setListingType(type)}
    >
      <Text style={{
        color: listingType === type ? t.white : t.heading,
        fontWeight: '600',
        fontSize: 16
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    multiline = false,
    keyboardType = "default" as any
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    keyboardType?: any;
  }) => (
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
          borderColor: t.border,
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
    </View>
  );

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
        Si activée, l’acheteur devra récupérer l’article en personne.
      </Text>
    </View>
  );

  const SelectField = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    placeholder 
  }: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onSelect: (value: string) => void;
    placeholder: string;
  }) => (
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
                borderColor: value === option.value ? t.primaryBtn : t.border
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
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={120}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll={true}
      >
        {/* Type Selection */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 16
          }}>
            Type d'annonce
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <TypeTabButton t={t} type="SALE" currentType={listingType} label="💰 Vente" onPress={() => setListingType('SALE')} />
            <TypeTabButton t={t} type="TRADE" currentType={listingType} label="🔄 Échange" onPress={() => setListingType('TRADE')} />
            <TypeTabButton t={t} type="BOTH" currentType={listingType} label="💰🔄 Les deux" onPress={() => setListingType('BOTH')} />
          </View>
        </View>

        {/* Form */}
        <View style={{ paddingHorizontal: 16 }}>
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

          {/* Price or Exchange */}
          {listingType === "SALE" ? (
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, value } }) => (
                <FormInputField 
                  t={t}
                  label="Prix"
                  value={value || ""}
                  onChangeText={onChange}
                  placeholder="Ex: 250.00"
                  keyboardType="numeric"
                  error={(errors as any).price?.message}
                />
              )}
            />
          ) : listingType === "TRADE" ? (
            <>
              <Controller
                control={control}
                name="wantedItems"
                render={({ field: { onChange, value } }) => (
                  <FormInputField 
                    t={t}
                    label="Recherche en échange"
                    value={value || ""}
                    onChangeText={onChange}
                    placeholder="Décrivez ce que vous recherchez..."
                    multiline={true}
                    error={(errors as any).wantedItems?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="exchangeValue"
                render={({ field: { onChange, value } }) => (
                  <FormInputField 
                    t={t}
                    label="Valeur estimée (optionnel)"
                    value={value || ""}
                    onChangeText={onChange}
                    placeholder="Ex: 200.00"
                    keyboardType="numeric"
                  />
                )}
              />
            </>
          ) : (
            <>
              {/* BOTH: Show both price and wanted items */}
              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, value } }) => (
                  <FormInputField 
                    t={t}
                    label="Prix de vente"
                    value={value || ""}
                    onChangeText={onChange}
                    placeholder="Ex: 250.00"
                    keyboardType="numeric"
                    error={(errors as any).price?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="wantedItems"
                render={({ field: { onChange, value } }) => (
                  <FormInputField 
                    t={t}
                    label="Ou accepte en échange"
                    value={value || ""}
                    onChangeText={onChange}
                    placeholder="Décrivez ce que vous recherchez..."
                    multiline={true}
                    error={(errors as any).wantedItems?.message}
                  />
                )}
              />
            </>
          )}


          {/* Images Section */}
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

          {/* Remise en main propre */}
          <Controller
            control={control}
            name="handDelivery"
            render={({ field: { value, onChange } }) => (
              <HandDeliveryToggle value={!!value} onChange={onChange} />
            )}
          />

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
              {submitting
                ? 'Publication...'
                : listingType === "SALE" 
                  ? "Publier l'annonce de vente" 
                  : listingType === "TRADE"
                  ? "Publier l'annonce d'échange"
                  : "Publier l'annonce"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}