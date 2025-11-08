import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "../../components/ThemeProvider";
import api from "../../services/api";
import { useQueryClient } from "@tanstack/react-query";
import { CATEGORIES } from "../../data/index";
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
  type: "sell" | "exchange";
  label: string;
  currentType: "sell" | "exchange";
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

const { width } = Dimensions.get('window');

type ListingType = "sell" | "exchange";

export default function SellScreen() {
  const { theme } = useTheme();
  const [listingType, setListingType] = useState<ListingType>("sell");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
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
      images: []
    }
  });

  // Update images in form when state changes
  React.useEffect(() => {
    setValue('images', images);
  }, [images, setValue]);

  const onSubmit = async (data: ListingFormData) => {
    // Validate based on listing type
    if (listingType === 'sell' && (!data.price || data.price.trim() === '')) {
      Alert.alert("Erreur", "Le prix est requis pour une vente");
      return;
    }
    if (listingType === 'exchange' && (!data.wantedItems || data.wantedItems.trim() === '')) {
      Alert.alert("Erreur", "Veuillez indiquer ce que vous recherchez en échange");
      return;
    }
    try {
      setSubmitting(true);
      const payload: any = {
        title: data.title,
        description: data.description,
        price: listingType === 'sell' ? Number(data.price) : 0,
        condition: data.condition,
        category: data.category,
        location: 'Paris, 75001',
        images,
        listingType,
        exchangeDetails: listingType === 'exchange' ? data.wantedItems : undefined,
      };
      const created = await api.post<{ id: string }>("/api/products", payload);
      // refresh products list cache
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      Alert.alert(
        "Succès",
        listingType === 'sell'
          ? "Votre annonce de vente a été publiée !"
          : "Votre annonce d'\u00e9change a         t                             ",
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
        quality: 0.8,
        allowsMultipleSelection: false
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
        quality: 0.8
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
      
      {/* Header */}
      <View style={{
        backgroundColor: t.navBg + 'CC',
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{
            marginRight: 16,
            padding: 8
          }}
        >
          <Text style={{ fontSize: 18, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: t.heading,
          flex: 1
        }}>
          Publier une annonce
        </Text>
      </View>

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={80}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
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
            <TypeTabButton t={t} type="sell" currentType={listingType} label="💰 Vendre" onPress={() => setListingType('sell')} />
            <TypeTabButton t={t} type="exchange" currentType={listingType} label="🔄 Échanger" onPress={() => setListingType('exchange')} />
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
          {listingType === "sell" ? (
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
          ) : (
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
                : listingType === "sell" 
                  ? "Publier l'annonce de vente" 
                  : "Publier l'annonce d'échange"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}