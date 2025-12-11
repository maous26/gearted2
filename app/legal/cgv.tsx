import { router } from "expo-router";
import React from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../components/ThemeProvider";
import { THEMES } from "../../themes";

export default function CGVScreen() {
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
          Conditions Generales de Vente
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 12, color: t.muted, marginBottom: 20 }}>
          Derniere mise a jour : 11 decembre 2024
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          PREAMBULE
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          Les presentes Conditions Generales de Vente (CGV) regissent les relations contractuelles entre :
          {'\n\n'}
          - GEARTED, edite par un auto-entrepreneur immatricule en France (SIRET : [A COMPLETER]), ci-apres "GEARTED" ou "la Plateforme"
          {'\n\n'}
          - Et toute personne physique ou morale utilisant les services payants de la plateforme, ci-apres "l'Utilisateur"
          {'\n\n'}
          GEARTED est une marketplace permettant la mise en relation entre vendeurs et acheteurs de materiel d'airsoft d'occasion. Les transactions sont effectuees directement entre vendeurs et acheteurs via Stripe Connect.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 1 - SERVICES PROPOSES ET TARIFS
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          1.1. Services gratuits :
          {'\n'}- Creation de compte
          {'\n'}- Publication d'annonces (limite : 10 annonces actives)
          {'\n'}- Consultation des annonces
          {'\n'}- Messagerie
          {'\n\n'}
          1.2. Commission sur les ventes :
          {'\n'}- Commission GEARTED : 10% du prix de vente TTC
          {'\n'}- La commission est automatiquement prelevee lors du paiement
          {'\n'}- Le vendeur recoit 90% du prix de vente directement sur son compte Stripe
          {'\n\n'}
          1.3. Options premium (facultatives, a venir) :
          {'\n'}- Boost d'annonce : 2,99 EUR TTC (visibilite accrue pendant 7 jours)
          {'\n\n'}
          1.4. GEARTED se reserve le droit de modifier ses tarifs. Les modifications seront communiquees aux utilisateurs avec un preavis de 30 jours.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 2 - PROCESSUS DE VENTE
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          2.1. Le vendeur cree un compte Stripe Connect (verification d'identite requise par Stripe).
          {'\n\n'}
          2.2. Le vendeur publie une annonce decrivant precisement l'article a vendre.
          {'\n\n'}
          2.3. L'acheteur interesse procede au paiement securise via la plateforme.
          {'\n\n'}
          2.4. Le paiement est transfere directement sur le compte Stripe du vendeur (moins la commission GEARTED de 10%).
          {'\n\n'}
          2.5. Le vendeur est notifie de la vente et doit expedier l'article sous 5 jours ouvrables.
          {'\n\n'}
          2.6. L'acheteur et le vendeur communiquent via la messagerie GEARTED pour le suivi.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 3 - PAIEMENT ET FLUX FINANCIERS
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          3.1. Infrastructure de paiement :
          {'\n'}GEARTED utilise Stripe Connect Standard comme infrastructure de paiement. Cette solution permet des paiements directs entre acheteurs et vendeurs, sans que GEARTED ne detienne les fonds.
          {'\n\n'}
          3.2. Moyens de paiement acceptes :
          {'\n'}- Cartes bancaires (Visa, Mastercard, CB, American Express)
          {'\n'}- Apple Pay
          {'\n'}- Google Pay
          {'\n\n'}
          3.3. Flux de paiement :
          {'\n'}- L'acheteur paye le prix de l'article + frais de livraison
          {'\n'}- Le paiement est directement transfere sur le compte Stripe du vendeur
          {'\n'}- La commission GEARTED (10%) est automatiquement prelevee
          {'\n'}- Le vendeur recoit 90% du prix de vente
          {'\n\n'}
          3.4. Versement au vendeur :
          {'\n'}Les fonds sont disponibles sur le compte Stripe du vendeur immediatement apres paiement. Le vendeur peut ensuite virer ses fonds vers son compte bancaire selon les delais Stripe (generalement 2-7 jours ouvrables).
          {'\n\n'}
          3.5. Obligations du vendeur :
          {'\n'}- Creer et maintenir un compte Stripe Connect actif
          {'\n'}- Completer la verification d'identite Stripe (KYC)
          {'\n'}- Configurer son compte bancaire dans Stripe pour les virements
          {'\n\n'}
          3.6. Important :
          {'\n'}GEARTED n'intervient pas dans le flux de paiement et ne detient pas les fonds. Les transactions sont directes entre acheteurs et vendeurs via Stripe. GEARTED agit uniquement en tant qu'intermediaire technique.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 4 - LIVRAISON
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          4.1. Le processus de livraison est organise comme suit :
          {'\n'}- Le VENDEUR renseigne les dimensions et le poids du colis lors de la creation de l'annonce (ou ulterieurement avant achat)
          {'\n'}- L'ACHETEUR choisit le mode de livraison et paye les frais de transport lors de l'achat
          {'\n'}- Le VENDEUR genere l'etiquette d'expedition via la plateforme GEARTED
          {'\n'}- Le VENDEUR emballe et depose le colis au point de collecte indique
          {'\n\n'}
          4.2. Le vendeur doit :
          {'\n'}- Renseigner les dimensions et le poids du colis lors de la creation de l'annonce ou avant la finalisation de l'achat
          {'\n'}- Generer l'etiquette d'expedition une fois l'achat finalise
          {'\n'}- Emballer soigneusement l'article
          {'\n'}- Deposer le colis dans les 5 jours ouvrables suivant la generation de l'etiquette
          {'\n\n'}
          4.3. L'acheteur doit :
          {'\n'}- Renseigner son adresse de livraison
          {'\n'}- Choisir le mode de livraison parmi les options proposees
          {'\n'}- Payer les frais de transport lors de l'achat
          {'\n'}- L'achat ne peut etre finalise que si le vendeur a renseigne les dimensions du colis
          {'\n\n'}
          4.4. Modes de livraison possibles :
          {'\n'}- Point relais (Mondial Relay)
          {'\n'}- Livraison a domicile
          {'\n'}- Remise en main propre (aux risques des parties, sans frais de transport)
          {'\n\n'}
          4.5. En cas de perte ou dommage pendant le transport, l'assurance du transporteur s'applique. GEARTED n'est pas responsable des incidents de livraison.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 5 - DROIT DE RETRACTATION
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          5.1. Conformement a l'article L.221-18 du Code de la consommation, les transactions entre particuliers ne sont pas soumises au droit de retractation.
          {'\n\n'}
          5.2. Pour les ventes realisees par des professionnels sur la plateforme, l'acheteur dispose d'un delai de 14 jours a compter de la reception pour exercer son droit de retractation, sans avoir a justifier de motif.
          {'\n\n'}
          5.3. Ce droit ne s'applique pas aux :
          {'\n'}- Articles personnalises
          {'\n'}- Articles descelles apres livraison (hygiene, securite)
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 6 - GARANTIES
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          6.1. Garantie des vices caches (article 1641 du Code civil) :
          Le vendeur est tenu de la garantie des vices caches rendant l'article impropre a l'usage auquel on le destine.
          {'\n\n'}
          6.2. Garantie de conformite (articles L.217-4 et suivants du Code de la consommation) :
          Pour les ventes professionnelles, le vendeur est tenu de livrer un bien conforme a la description.
          {'\n\n'}
          6.3. Assurance Acheteur GEARTED (optionnelle) :
          Cette protection couvre les defauts non signales dans l'annonce, constatables a reception. Elle ne couvre pas l'usure normale ni les degradations post-reception.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 7 - LITIGES ET RECLAMATIONS
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          7.1. En cas de litige entre acheteur et vendeur, les parties doivent d'abord tenter de trouver une solution amiable via la messagerie GEARTED.
          {'\n\n'}
          7.2. GEARTED peut servir de mediateur mais ne detient pas les fonds. Les remboursements eventuels doivent etre effectues directement entre les parties ou via les mecanismes de contestation Stripe.
          {'\n\n'}
          7.3. GEARTED se reserve le droit de :
          {'\n'}- Demander des preuves (photos, videos, documents)
          {'\n'}- Suspendre les comptes des utilisateurs en cas de comportement frauduleux
          {'\n'}- Exclure definitivement les utilisateurs ne respectant pas les CGU/CGV
          {'\n\n'}
          7.4. Les parties conservent la possibilite de recourir aux tribunaux competents ou aux mecanismes de contestation de Stripe pour les problemes de paiement.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 8 - REMBOURSEMENTS
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          8.1. Les remboursements sont geres directement entre l'acheteur et le vendeur, ou via Stripe :
          {'\n'}- Le vendeur peut effectuer un remboursement depuis son compte Stripe
          {'\n'}- L'acheteur peut ouvrir une contestation (chargeback) aupres de sa banque ou via Stripe
          {'\n\n'}
          8.2. GEARTED ne detenant pas les fonds, ne peut pas proceder directement aux remboursements.
          {'\n\n'}
          8.3. En cas de retour accepte, les frais de retour sont a la charge de l'acheteur, sauf accord contraire entre les parties.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 9 - RESPONSABILITE
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          9.1. GEARTED agit en qualite d'intermediaire et ne peut etre tenue responsable :
          {'\n'}- De la qualite ou conformite des articles vendus
          {'\n'}- Du comportement des utilisateurs
          {'\n'}- Des litiges survenant entre vendeurs et acheteurs
          {'\n'}- Des dommages directs ou indirects lies a l'utilisation de la plateforme
          {'\n\n'}
          9.2. La responsabilite de GEARTED est en tout etat de cause limitee au montant des commissions percues sur la transaction concernee.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 10 - PROPRIETE INTELLECTUELLE
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          10.1. En publiant du contenu sur GEARTED (photos, descriptions), l'utilisateur garantit qu'il dispose des droits necessaires.
          {'\n\n'}
          10.2. L'utilisateur accorde a GEARTED une licence non exclusive d'utilisation du contenu publie, aux fins de fonctionnement et promotion de la plateforme.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 11 - DROIT APPLICABLE
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 20 }}>
          11.1. Les presentes CGV sont soumises au droit francais.
          {'\n\n'}
          11.2. En cas de litige, les tribunaux de Paris sont seuls competents, sous reserve des dispositions protectrices du Code de la consommation en faveur des consommateurs.
          {'\n\n'}
          11.3. Mediation de la consommation :
          Conformement aux articles L.611-1 et suivants du Code de la consommation, le consommateur peut recourir gratuitement au mediateur MEDICYS pour tout litige non resolu :
          {'\n'}- Site : www.medicys.fr
          {'\n'}- Adresse : 73 Boulevard de Clichy, 75009 Paris
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 12 - CONTACT
        </Text>
        <Text style={{ fontSize: 14, color: t.heading, lineHeight: 22, marginBottom: 40 }}>
          GEARTED
          {'\n'}Email : contact@gearted.com
          {'\n'}Site web : gearted.eu
          {'\n\n'}
          Service client disponible par email.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
