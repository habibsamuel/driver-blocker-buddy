import { Shield, Database, MapPin, Bell, Lock, UserCheck, Mail, Trash2 } from "lucide-react";
import { DeleteAccount } from "@/components/DeleteAccount";


const UPDATED = "5 septembre 2026";

export function Confidentialite() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold uppercase tracking-widest">
          <Shield className="h-3.5 w-3.5" /> Vie privée
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : {UPDATED}</p>
      </header>

      <Section icon={UserCheck} title="1. Qui est responsable de vos données">
        <p>
          Taxi Proxi est une application de mise en relation entre passagers et chauffeurs à Yaoundé
          (Cameroun), éditée par DEUS Corporation. En tant que responsable du traitement, nous décidons
          des finalités et des moyens du traitement de vos données personnelles.
        </p>
        <p>Contact : <a className="text-primary underline" href="mailto:contact@taxiproxi.cm">contact@taxiproxi.cm</a></p>
      </Section>

      <Section icon={Database} title="2. Données que nous collectons">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Compte</strong> : nom, numéro de téléphone, quartier, adresse e-mail si vous en fournissez une.</li>
          <li><strong>Courses</strong> : point de départ, destination, distance, durée, tarif, mode de paiement, notes et commentaires.</li>
          <li><strong>Chauffeurs</strong> : plaque, véhicule, zone, documents justificatifs (permis, carte grise, assurance, pièce d'identité) et statut de vérification.</li>
          <li><strong>Localisation</strong> : position GPS pendant l'utilisation, en temps réel pour les chauffeurs en ligne.</li>
          <li><strong>Technique</strong> : identifiant d'appareil pour les notifications, journaux de connexion et d'erreurs.</li>
        </ul>
      </Section>

      <Section icon={MapPin} title="3. Pourquoi nous les utilisons">
        <ul className="list-disc pl-5 space-y-1">
          <li>Vous géolocaliser et calculer l'itinéraire, la durée et le prix de la course.</li>
          <li>Attribuer la course au chauffeur vérifié le plus proche et permettre le suivi en direct.</li>
          <li>Assurer la sécurité des trajets : code PIN, historique, signalement d'incident.</li>
          <li>Vérifier l'éligibilité des chauffeurs et gérer leur abonnement.</li>
          <li>Gérer le parrainage, l'assistance client et l'amélioration du service.</li>
        </ul>
        <p>
          Base légale : l'exécution du contrat de service, votre consentement (localisation, notifications),
          notre intérêt légitime (sécurité, prévention de la fraude) et nos obligations légales.
        </p>
      </Section>

      <Section icon={Bell} title="4. Localisation et notifications">
        <p>
          La localisation n'est utilisée que lorsque l'application est ouverte, sauf pour un chauffeur qui se
          déclare « en ligne » afin de recevoir des courses. Vous pouvez retirer l'autorisation GPS ou les
          notifications à tout moment dans les réglages de votre téléphone ; certaines fonctions (commande,
          suivi du taxi, appel de course) deviennent alors indisponibles.
        </p>
      </Section>

      <Section icon={Lock} title="5. Partage des données">
        <p>
          Lors d'une course, le chauffeur voit votre prénom, votre point de départ et votre destination ; vous
          voyez le nom du chauffeur, sa plaque, son véhicule et sa note. Nous ne vendons jamais vos données.
          Elles peuvent être communiquées à nos prestataires techniques (hébergement, cartographie, envoi de
          notifications) qui agissent sur nos instructions, ou aux autorités compétentes sur réquisition légale.
        </p>
      </Section>

      <Section icon={Database} title="6. Durée de conservation">
        <ul className="list-disc pl-5 space-y-1">
          <li>Compte actif : pendant toute la durée d'utilisation, puis 12 mois après la dernière activité.</li>
          <li>Historique des courses : 5 ans (preuve, litiges, obligations comptables).</li>
          <li>Documents chauffeurs : durée de l'activité puis 3 ans.</li>
          <li>Positions GPS détaillées : 30 jours.</li>
        </ul>
      </Section>

      <Section icon={UserCheck} title="7. Vos droits">
        <p>
          Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation et de
          portabilité de vos données, ainsi que du droit de retirer votre consentement. Écrivez-nous à{" "}
          <a className="text-primary underline" href="mailto:contact@taxiproxi.cm">contact@taxiproxi.cm</a> ; nous
          répondons sous 30 jours. Vous pouvez saisir l'autorité compétente en cas de désaccord.
        </p>
      </Section>

      <Section icon={Shield} title="8. Sécurité">
        <p>
          Les données sont hébergées sur des serveurs sécurisés, les accès sont restreints par des règles
          d'autorisation par utilisateur, les codes PIN sont stockés sous forme chiffrée et les échanges sont
          chiffrés en HTTPS.
        </p>
      </Section>

      <Section icon={Mail} title="9. Mineurs et modifications">
        <p>
          Le service est réservé aux personnes de 18 ans et plus. Toute modification de la présente politique
          sera publiée sur cette page avec une nouvelle date de mise à jour.
        </p>
      </Section>

      <Section icon={Trash2} title="10. Supprimer votre compte et vos données">
        <p>
          Vous pouvez supprimer votre compte à tout moment, directement depuis l'application. Votre profil,
          vos courses, vos parrainages et vos documents sont alors effacés définitivement. Les informations
          que la loi nous oblige à conserver (facturation, litiges) le sont pour la durée légale, sous accès
          restreint.
        </p>
        <DeleteAccount />
      </Section>

    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl p-5 sm:p-6 ring-1 ring-border space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="bg-primary/10 text-primary rounded-lg p-1.5"><Icon className="h-4 w-4" /></span>
        {title}
      </h2>
      <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}
