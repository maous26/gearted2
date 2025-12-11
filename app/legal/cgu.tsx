import { router } from "expo-router";
import React from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../components/ThemeProvider";
import { THEMES } from "../../themes";

export default function CGUScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];

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
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ fontSize: 24, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: t.heading }}>
          Conditions Generales d'Utilisation
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 12, color: t.muted, marginBottom: 20 }}>
          Derniere mise a jour : 11 decembre 2024
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 1 - OBJET
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Les presentes Conditions Generales d'Utilisation (CGU) ont pour objet de definir les modalites et conditions d'utilisation de la plateforme GEARTED, accessible via l'application mobile et le site web gearted.com.
          {'\n\n'}
          GEARTED est une marketplace de mise en relation entre vendeurs et acheteurs de materiel d'airsoft d'occasion. La societe GEARTED SAS, au capital de 1 000 euros, immatriculee au RCS de Paris sous le numero [A COMPLETER], dont le siege social est situe au [ADRESSE A COMPLETER], agit en qualite d'intermediaire technique.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 2 - ACCEPTATION DES CGU
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          L'utilisation de la plateforme GEARTED implique l'acceptation pleine et entiere des presentes CGU. En creant un compte ou en utilisant nos services, vous reconnaissez avoir lu, compris et accepte l'integralite des presentes conditions.
          {'\n\n'}
          GEARTED se reserve le droit de modifier les CGU a tout moment. Les utilisateurs seront informes par notification dans l'application. La poursuite de l'utilisation apres modification vaut acceptation des nouvelles conditions.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 3 - INSCRIPTION ET COMPTE UTILISATEUR
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          3.1. Pour utiliser les services de GEARTED, l'utilisateur doit creer un compte en fournissant des informations exactes et a jour.
          {'\n\n'}
          3.2. L'utilisateur doit etre age d'au moins 18 ans ou disposer de l'autorisation d'un representant legal.
          {'\n\n'}
          3.3. Chaque utilisateur est responsable de la confidentialite de ses identifiants de connexion et de toute activite effectuee depuis son compte.
          {'\n\n'}
          3.4. En cas de suspicion d'utilisation frauduleuse, l'utilisateur doit en informer immediatement GEARTED a l'adresse : contact@gearted.com
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 4 - SERVICES PROPOSES
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          GEARTED propose les services suivants :
          {'\n\n'}
          - Publication d'annonces de vente de materiel d'airsoft
          {'\n'}- Recherche et consultation d'annonces
          {'\n'}- Messagerie securisee entre utilisateurs
          {'\n'}- Systeme de paiement securise via Stripe
          {'\n'}- Options premium : Boost d'annonce, Expertise Gearted, Assurance acheteur
          {'\n\n'}
          GEARTED n'est pas partie aux transactions entre vendeurs et acheteurs. La plateforme agit uniquement en tant qu'intermediaire technique.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 5 - OBLIGATIONS DES UTILISATEURS
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          5.1. Les utilisateurs s'engagent a :
          {'\n'}- Fournir des informations exactes et completes
          {'\n'}- Respecter la legislation en vigueur concernant la vente de materiel d'airsoft
          {'\n'}- Ne pas publier de contenu illegal, offensant ou contraire aux bonnes moeurs
          {'\n'}- Ne pas utiliser la plateforme a des fins frauduleuses
          {'\n'}- Respecter les autres utilisateurs
          {'\n\n'}
          5.2. Concernant le materiel d'airsoft, les utilisateurs doivent :
          {'\n'}- Etre majeurs (18 ans minimum)
          {'\n'}- S'assurer que le materiel vendu est conforme a la reglementation francaise
          {'\n'}- Ne pas vendre de repliques dont la puissance excede 2 joules
          {'\n'}- Ne pas vendre d'armes reelles ou de pieces permettant de transformer une replique en arme
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 6 - CONTENU DES ANNONCES
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          6.1. Le vendeur est seul responsable du contenu de ses annonces (textes, photos, prix).
          {'\n\n'}
          6.2. Les annonces doivent decrire de maniere exacte et complete l'etat du materiel vendu.
          {'\n\n'}
          6.3. GEARTED se reserve le droit de supprimer toute annonce ne respectant pas les presentes CGU ou la legislation en vigueur, sans preavis ni indemnite.
          {'\n\n'}
          6.4. Sont strictement interdits :
          {'\n'}- Les armes reelles ou munitions
          {'\n'}- Les repliques non conformes a la legislation
          {'\n'}- Les produits contrefaits
          {'\n'}- Tout materiel illegal
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 7 - TRANSACTIONS ET PAIEMENTS
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          7.1. Architecture de paiement :
          {'\n'}GEARTED utilise Stripe Connect en tant que plateforme de paiement. Ce systeme permet de :
          {'\n'}- Collecter les paiements des acheteurs de maniere securisee
          {'\n'}- Gerer les fonds en sequestre jusqu'a confirmation de la transaction
          {'\n'}- Verser les fonds aux vendeurs sur leur compte bancaire (IBAN)
          {'\n\n'}
          7.2. Role de GEARTED :
          {'\n'}GEARTED agit en qualite d'intermediaire de paiement. Les fonds des acheteurs sont collectes par GEARTED via Stripe, puis reverses aux vendeurs apres deduction des commissions. GEARTED ne stocke aucune donnee bancaire complete.
          {'\n\n'}
          7.3. Commissions :
          {'\n'}- Commission vendeur : 5% du prix de vente TTC (debitee lors du versement)
          {'\n'}- Frais de service acheteur : 5% du prix d'achat TTC (ajoutes au montant paye)
          {'\n'}- Total commission GEARTED : 10% par transaction
          {'\n\n'}
          7.4. Versement aux vendeurs :
          {'\n'}Le vendeur recoit le paiement sur son compte bancaire (IBAN renseigne dans son profil) :
          {'\n'}- Apres confirmation de reception par l'acheteur, ou
          {'\n'}- Automatiquement apres un delai de 14 jours sans signalement de probleme
          {'\n'}- Delai de virement : 2 a 5 jours ouvrables apres validation
          {'\n\n'}
          7.5. Obligations du vendeur :
          {'\n'}Pour recevoir les paiements, le vendeur doit :
          {'\n'}- Renseigner un IBAN valide dans son profil
          {'\n'}- Fournir les informations d'identite requises par Stripe (conformite KYC)
          {'\n'}- Maintenir ses informations a jour
          {'\n\n'}
          7.6. Sequestre et litiges :
          {'\n'}En cas de litige, GEARTED peut bloquer les fonds jusqu'a resolution. La decision de GEARTED concernant la liberation ou le remboursement des fonds est definitive sur la plateforme.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 8 - RESPONSABILITE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          8.1. GEARTED agit en tant qu'hebergeur au sens de l'article 6 de la Loi pour la Confiance dans l'Economie Numerique (LCEN).
          {'\n\n'}
          8.2. GEARTED n'est pas responsable :
          {'\n'}- Du contenu des annonces publiees par les utilisateurs
          {'\n'}- De la qualite, securite ou legalite des articles vendus
          {'\n'}- De l'exactitude des informations fournies par les utilisateurs
          {'\n'}- Des transactions realisees entre utilisateurs
          {'\n\n'}
          8.3. GEARTED s'engage a faire ses meilleurs efforts pour assurer la disponibilite de la plateforme mais ne garantit pas un acces ininterrompu.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 9 - PROPRIETE INTELLECTUELLE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          9.1. La marque GEARTED, le logo, et l'ensemble des elements de la plateforme (design, textes, images, code source) sont la propriete exclusive de GEARTED SAS.
          {'\n\n'}
          9.2. Toute reproduction, representation ou exploitation non autorisee est interdite et constitue une contrefacon sanctionnee par le Code de la propriete intellectuelle.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 10 - SUSPENSION ET RESILIATION
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          10.1. GEARTED peut suspendre ou supprimer un compte en cas de :
          {'\n'}- Non-respect des CGU
          {'\n'}- Activite frauduleuse ou suspicion de fraude
          {'\n'}- Signalements repetes d'autres utilisateurs
          {'\n'}- Violation de la legislation en vigueur
          {'\n\n'}
          10.2. L'utilisateur peut supprimer son compte a tout moment depuis les parametres de l'application.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 11 - DROIT APPLICABLE ET LITIGES
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          11.1. Les presentes CGU sont soumises au droit francais.
          {'\n\n'}
          11.2. En cas de litige, les parties s'efforceront de trouver une solution amiable. A defaut, les tribunaux de Paris seront seuls competents.
          {'\n\n'}
          11.3. Conformement a l'article L.612-1 du Code de la consommation, le consommateur peut recourir gratuitement au service de mediation MEDICYS : www.medicys.fr
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 12 - CONTACT
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 40 }}>
          Pour toute question concernant les presentes CGU :
          {'\n\n'}
          GEARTED SAS
          {'\n'}Email : contact@gearted.com
          {'\n'}Adresse : [A COMPLETER]
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
