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
          Derniere mise a jour : 5 decembre 2024
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          PREAMBULE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          Les presentes Conditions Generales de Vente (CGV) regissent les relations contractuelles entre :
          {'\n\n'}
          - GEARTED SAS, societe par actions simplifiee au capital de 1 000 euros, immatriculee au RCS de Paris sous le numero [A COMPLETER], dont le siege social est situe au [ADRESSE], ci-apres "GEARTED" ou "la Plateforme"
          {'\n\n'}
          - Et toute personne physique ou morale utilisant les services payants de la plateforme, ci-apres "l'Utilisateur"
          {'\n\n'}
          GEARTED est une marketplace permettant la mise en relation entre vendeurs et acheteurs de materiel d'airsoft d'occasion.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 1 - SERVICES PROPOSES ET TARIFS
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          1.1. Services gratuits :
          {'\n'}- Creation de compte
          {'\n'}- Publication d'annonces (limite : 10 annonces actives)
          {'\n'}- Consultation des annonces
          {'\n'}- Messagerie
          {'\n\n'}
          1.2. Commissions sur les ventes :
          {'\n'}- Commission vendeur : 5% du prix de vente TTC
          {'\n'}- Frais de service acheteur : 5% du prix d'achat TTC
          {'\n'}- Total commission GEARTED : 10% par transaction
          {'\n\n'}
          1.3. Options premium (facultatives) :
          {'\n'}- Boost d'annonce : 2,99 EUR TTC (visibilite accrue pendant 7 jours)
          {'\n'}- Expertise Gearted : 19,90 EUR TTC (verification de l'article par un expert)
          {'\n'}- Assurance Acheteur : 4,99 EUR TTC (protection contre les defauts non signales)
          {'\n\n'}
          1.4. GEARTED se reserve le droit de modifier ses tarifs. Les modifications seront communiquees aux utilisateurs avec un preavis de 30 jours.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 2 - PROCESSUS DE VENTE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          2.1. Le vendeur publie une annonce decrivant precisement l'article a vendre.
          {'\n\n'}
          2.2. L'acheteur interesse procede au paiement securise via la plateforme.
          {'\n\n'}
          2.3. Le vendeur est notifie de la vente et doit expedier l'article sous 5 jours ouvrables.
          {'\n\n'}
          2.4. L'acheteur dispose de 48 heures apres reception pour signaler tout probleme.
          {'\n\n'}
          2.5. Passe ce delai, ou apres validation de l'acheteur, les fonds sont verses au vendeur (sous deduction de la commission).
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 3 - PAIEMENT
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          3.1. Les paiements sont traites par notre prestataire Stripe, certifie PCI-DSS niveau 1.
          {'\n\n'}
          3.2. Moyens de paiement acceptes :
          {'\n'}- Cartes bancaires (Visa, Mastercard, CB)
          {'\n'}- Apple Pay
          {'\n'}- Google Pay
          {'\n\n'}
          3.3. Le montant total comprend :
          {'\n'}- Prix de l'article
          {'\n'}- Frais de service (5%)
          {'\n'}- Options premium eventuelles
          {'\n'}- Frais de livraison (si applicable)
          {'\n\n'}
          3.4. Les fonds sont sequestres par GEARTED jusqu'a la confirmation de reception par l'acheteur.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 4 - LIVRAISON
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          4.1. La livraison est assuree par le vendeur, sous sa responsabilite.
          {'\n\n'}
          4.2. Le vendeur doit :
          {'\n'}- Emballer soigneusement l'article
          {'\n'}- Utiliser un mode d'expedition avec suivi
          {'\n'}- Fournir le numero de suivi dans les 48h suivant l'expedition
          {'\n\n'}
          4.3. Modes de livraison possibles :
          {'\n'}- Envoi postal avec suivi
          {'\n'}- Point relais
          {'\n'}- Remise en main propre (aux risques des parties)
          {'\n\n'}
          4.4. En cas de perte ou dommage pendant le transport, l'assurance du transporteur s'applique. GEARTED n'est pas responsable des incidents de livraison.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 5 - DROIT DE RETRACTATION
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
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
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
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
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          7.1. En cas de litige entre acheteur et vendeur, les parties doivent d'abord tenter de trouver une solution amiable via la messagerie GEARTED.
          {'\n\n'}
          7.2. Si aucun accord n'est trouve sous 7 jours, l'une des parties peut ouvrir un litige aupres de GEARTED.
          {'\n\n'}
          7.3. GEARTED se reserve le droit de :
          {'\n'}- Demander des preuves (photos, videos, documents)
          {'\n'}- Bloquer les fonds pendant l'enquete
          {'\n'}- Statuer sur le litige et proceder au remboursement si necessaire
          {'\n\n'}
          7.4. La decision de GEARTED est definitive concernant les fonds detenus sur la plateforme. Les parties conservent la possibilite de recourir aux tribunaux competents.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 8 - REMBOURSEMENTS
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          8.1. En cas de remboursement valide par GEARTED :
          {'\n'}- L'acheteur est rembourse du prix de l'article et des frais de service
          {'\n'}- Les frais de livraison ne sont rembourses que si l'article n'a pas ete expedie
          {'\n'}- Les options premium (expertise, assurance) ne sont pas remboursables
          {'\n\n'}
          8.2. Le remboursement est effectue sous 14 jours par le meme moyen de paiement que celui utilise pour l'achat.
          {'\n\n'}
          8.3. En cas de retour, les frais de retour sont a la charge de l'acheteur, sauf si le vendeur a commis une faute (article non conforme, defaut cache).
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 9 - RESPONSABILITE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
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
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
          10.1. En publiant du contenu sur GEARTED (photos, descriptions), l'utilisateur garantit qu'il dispose des droits necessaires.
          {'\n\n'}
          10.2. L'utilisateur accorde a GEARTED une licence non exclusive d'utilisation du contenu publie, aux fins de fonctionnement et promotion de la plateforme.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '700', color: t.heading, marginBottom: 12 }}>
          ARTICLE 11 - DROIT APPLICABLE
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 20 }}>
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
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 22, marginBottom: 40 }}>
          GEARTED SAS
          {'\n'}Email : contact@gearted.com
          {'\n'}Adresse : [A COMPLETER]
          {'\n'}Numero de TVA : [A COMPLETER]
          {'\n\n'}
          Service client disponible du lundi au vendredi, 9h-18h.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
