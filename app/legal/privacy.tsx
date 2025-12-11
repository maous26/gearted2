import { router } from "expo-router";
import React from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../components/ThemeProvider";
import { THEMES } from "../../themes";

export default function PrivacyScreen() {
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
          Politique de Confidentialite
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 12, color: t.muted, marginBottom: 20 }}>
          Derniere mise a jour : 11 decembre 2024
        </Text>

        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          GEARTED s'engage a proteger la vie privee de ses utilisateurs. Cette politique de confidentialite explique comment nous collectons, utilisons, stockons et protegeons vos donnees personnelles conformement au Reglement General sur la Protection des Donnees (RGPD) et a la loi Informatique et Libertes.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          1. RESPONSABLE DU TRAITEMENT
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Le responsable du traitement de vos donnees personnelles est :
          {'\n\n'}
          OULARE ISMAEL
          {'\n'}Entrepreneur Individuel
          {'\n'}SIRET : 88250756900011
          {'\n'}Adresse : 75 AVENUE LAPLACE 94110
          {'\n'}Email : contact@gearted.eu
          {'\n'}Site web : www.gearted.eu
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          2. DONNEES COLLECTEES
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          2.1. Donnees fournies directement par l'utilisateur :
          {'\n'}- Identite : nom, prenom, nom d'utilisateur
          {'\n'}- Coordonnees : email, adresse postale, telephone
          {'\n'}- Donnees de compte : mot de passe (crypte), photo de profil
          {'\n'}- Donnees de paiement : traitees directement par Stripe (nous ne stockons aucune donnee bancaire)
          {'\n\n'}
          2.2. Donnees collectees automatiquement :
          {'\n'}- Donnees de connexion : adresse IP, type de navigateur, systeme d'exploitation
          {'\n'}- Donnees d'utilisation : pages visitees, actions effectuees, horaires de connexion
          {'\n'}- Donnees de geolocalisation : localisation approximative (si autorisee)
          {'\n'}- Identifiants de l'appareil : modele, identifiant publicitaire
          {'\n\n'}
          2.3. Donnees issues de tiers :
          {'\n'}- Donnees Discord (si connexion via Discord) : identifiant Discord, email, avatar, pseudo
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          3. FINALITES ET BASES LEGALES
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Vos donnees sont traitees pour les finalites suivantes :
          {'\n\n'}
          3.1. Execution du contrat (CGU/CGV) :
          {'\n'}- Gestion de votre compte utilisateur
          {'\n'}- Publication et gestion des annonces
          {'\n'}- Mise en relation vendeurs/acheteurs
          {'\n'}- Traitement des paiements et commissions
          {'\n'}- Service de messagerie
          {'\n'}- Service client
          {'\n\n'}
          3.2. Interet legitime de GEARTED :
          {'\n'}- Securite et prevention de la fraude
          {'\n'}- Amelioration des services
          {'\n'}- Statistiques et analyses (anonymisees)
          {'\n'}- Moderation du contenu
          {'\n\n'}
          3.3. Obligations legales :
          {'\n'}- Conservation des donnees de transaction (10 ans)
          {'\n'}- Reponse aux requisitions judiciaires
          {'\n'}- Declarations fiscales
          {'\n\n'}
          3.4. Consentement (optionnel) :
          {'\n'}- Newsletters et communications commerciales
          {'\n'}- Geolocalisation precise
          {'\n'}- Cookies non essentiels
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          4. DESTINATAIRES DES DONNEES
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Vos donnees peuvent etre communiquees aux destinataires suivants :
          {'\n\n'}
          4.1. Services internes de GEARTED :
          {'\n'}- Equipe technique
          {'\n'}- Service client
          {'\n'}- Service moderation
          {'\n'}- Direction
          {'\n\n'}
          4.2. Sous-traitants :
          {'\n'}- Stripe Connect Standard (paiements) - Certifie PCI-DSS niveau 1
          {'\n'}  * Les vendeurs creent leur propre compte Stripe
          {'\n'}  * Les donnees de paiement sont gerees directement par Stripe
          {'\n'}  * GEARTED ne stocke aucune donnee bancaire
          {'\n'}- Railway (hebergement) - Localisation UE
          {'\n'}- Cloudinary (stockage images)
          {'\n'}- Discord (authentification optionnelle)
          {'\n\n'}
          Tous nos sous-traitants sont soumis a des obligations contractuelles de confidentialite et de securite conformes au RGPD.
          {'\n\n'}
          4.3. Autres utilisateurs :
          {'\n'}- Informations publiques de votre profil (pseudo, avatar, note)
          {'\n'}- Informations de vos annonces
          {'\n\n'}
          4.4. Autorites :
          En cas de requisition legale ou pour la protection de nos droits.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          5. TRANSFERTS HORS UE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Certains de nos sous-traitants peuvent etre situes hors de l'Union Europeenne. Dans ce cas, les transferts sont encadres par :
          {'\n\n'}
          - Des clauses contractuelles types (CCT) approuvees par la Commission europeenne
          {'\n'}- Le Data Privacy Framework (pour les transferts vers les USA)
          {'\n'}- Ou des garanties equivalentes assurant un niveau de protection adequat
          {'\n\n'}
          Vous pouvez obtenir une copie des garanties sur demande : contact@gearted.eu
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          6. DUREE DE CONSERVATION
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Vos donnees sont conservees selon les durees suivantes :
          {'\n\n'}
          - Donnees de compte : pendant la duree d'utilisation du service + 3 ans apres suppression
          {'\n'}- Donnees de transaction : 10 ans (obligations comptables et fiscales)
          {'\n'}- Donnees de connexion : 1 an (obligations legales)
          {'\n'}- Messages : 3 ans apres la derniere activite sur la conversation
          {'\n'}- Logs de securite : 1 an
          {'\n'}- Donnees de prospection commerciale : 3 ans apres le dernier contact
          {'\n\n'}
          A l'issue de ces periodes, vos donnees sont supprimees ou anonymisees de maniere irreversible.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          7. VOS DROITS
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Conformement au RGPD, vous disposez des droits suivants :
          {'\n\n'}
          7.1. Droit d'acces :
          Obtenir la confirmation que vos donnees sont traitees et en recevoir une copie.
          {'\n\n'}
          7.2. Droit de rectification :
          Corriger des donnees inexactes ou incompletes.
          {'\n\n'}
          7.3. Droit a l'effacement ("droit a l'oubli") :
          Demander la suppression de vos donnees (sous reserve des obligations legales de conservation).
          {'\n\n'}
          7.4. Droit a la limitation :
          Demander la suspension du traitement de vos donnees.
          {'\n\n'}
          7.5. Droit a la portabilite :
          Recevoir vos donnees dans un format structure et lisible par machine.
          {'\n\n'}
          7.6. Droit d'opposition :
          Vous opposer au traitement de vos donnees pour motif legitime, ou a la prospection commerciale.
          {'\n\n'}
          7.7. Directives post-mortem :
          Definir des directives relatives au sort de vos donnees apres votre deces.
          {'\n\n'}
          Pour exercer vos droits, contactez-nous :
          {'\n'}- Email : contact@gearted.eu
          {'\n'}- Adresse : 75 AVENUE LAPLACE 94110
          {'\n\n'}
          Nous repondons sous 1 mois maximum (prolongeable de 2 mois en cas de complexite).
          {'\n\n'}
          7.8. Droit de reclamation :
          Si vous estimez que vos droits ne sont pas respectes, vous pouvez introduire une reclamation aupres de la CNIL :
          {'\n'}- Site : www.cnil.fr
          {'\n'}- Adresse : 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          8. SECURITE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          GEARTED met en oeuvre des mesures techniques et organisationnelles appropriees pour proteger vos donnees :
          {'\n\n'}
          - Chiffrement des donnees en transit (HTTPS/TLS)
          {'\n'}- Chiffrement des mots de passe (bcrypt)
          {'\n'}- Acces restreint aux donnees (principe du moindre privilege)
          {'\n'}- Sauvegardes regulieres et chiffrees
          {'\n'}- Tests de securite reguliers
          {'\n'}- Formation du personnel
          {'\n'}- Procedures de gestion des incidents
          {'\n\n'}
          En cas de violation de donnees susceptible d'engendrer un risque eleve pour vos droits et libertes, vous serez informe dans les meilleurs delais.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          9. COOKIES ET TRACEURS
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          9.1. Cookies essentiels (pas de consentement requis) :
          {'\n'}- Authentification
          {'\n'}- Securite
          {'\n'}- Preferences utilisateur
          {'\n\n'}
          9.2. Cookies analytiques (consentement requis) :
          {'\n'}- Mesure d'audience
          {'\n'}- Performance de l'application
          {'\n\n'}
          9.3. Cookies publicitaires :
          Non utilises actuellement.
          {'\n\n'}
          Vous pouvez gerer vos preferences de cookies dans les parametres de l'application.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          10. MINEURS
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          L'utilisation de GEARTED est reservee aux personnes majeures (18 ans et plus). Nous ne collectons pas sciemment de donnees de mineurs. Si nous decouvrons qu'un compte a ete cree par un mineur, celui-ci sera suspendu et les donnees supprimees.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          11. MODIFICATIONS
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Cette politique de confidentialite peut etre modifiee. En cas de modification substantielle, vous serez informe par email ou notification dans l'application au moins 30 jours avant l'entree en vigueur des modifications.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          12. CONTACT
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 40 }}>
          Pour toute question relative a cette politique ou a vos donnees personnelles :
          {'\n\n'}
          Contact :
          {'\n'}OULARE ISMAEL
          {'\n'}Email : contact@gearted.eu
          {'\n'}Adresse : 75 AVENUE LAPLACE 94110
          {'\n'}Site : www.gearted.eu
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
