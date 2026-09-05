import { Scale, Car, Wallet, AlertTriangle, Gavel, UserCheck } from "lucide-react";

const UPDATED = "5 septembre 2026";

export function Conditions() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold uppercase tracking-widest">
          <Scale className="h-3.5 w-3.5" /> Cadre juridique
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Conditions générales d'utilisation</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : {UPDATED}</p>
      </header>

      <Section icon={UserCheck} title="1. Objet et acceptation">
        <p>
          Taxi Proxi, édité par DEUS Corporation (Yaoundé, Cameroun), est une plateforme de mise en relation
          entre des passagers et des chauffeurs indépendants. En créant un compte ou en commandant une course,
          vous acceptez sans réserve les présentes conditions.
        </p>
      </Section>

      <Section icon={Car} title="2. Rôle de la plateforme">
        <p>
          Taxi Proxi n'est ni un transporteur ni l'employeur des chauffeurs. Le contrat de transport est conclu
          directement entre le passager et le chauffeur, seul responsable de son véhicule, de ses documents, de
          son assurance et du respect du code de la route.
        </p>
      </Section>

      <Section icon={UserCheck} title="3. Compte et éligibilité">
        <ul className="list-disc pl-5 space-y-1">
          <li>Être âgé d'au moins 18 ans et fournir des informations exactes.</li>
          <li>Un seul compte par personne ; les identifiants et codes PIN sont strictement personnels.</li>
          <li>Les chauffeurs doivent transmettre leurs documents et n'accèdent aux courses qu'après validation.</li>
        </ul>
      </Section>

      <Section icon={Wallet} title="4. Prix et paiement">
        <p>
          Le prix est estimé avant la commande selon la distance, la durée et la catégorie du véhicule, dans une
          fourchette de 750 à 3 000 XAF. Le paiement s'effectue <strong>en espèces, directement au chauffeur</strong>,
          à la fin de la course. La plateforme n'encaisse aucun montant de la course ; seuls les abonnements
          chauffeurs font l'objet d'un règlement à Taxi Proxi.
        </p>
      </Section>

      <Section icon={AlertTriangle} title="5. Obligations et comportements interdits">
        <ul className="list-disc pl-5 space-y-1">
          <li>Refuser de payer une course effectuée, dégrader un véhicule ou menacer un utilisateur.</li>
          <li>Créer de fausses commandes, usurper une identité ou contourner le système de vérification.</li>
          <li>Transporter des marchandises illicites ou dangereuses.</li>
        </ul>
        <p>Tout manquement peut entraîner la suspension immédiate et définitive du compte.</p>
      </Section>

      <Section icon={AlertTriangle} title="6. Annulation et responsabilité">
        <p>
          Une course peut être annulée avant la prise en charge. Taxi Proxi met tout en œuvre pour assurer la
          disponibilité du service mais ne garantit pas l'absence d'interruption (réseau, GPS, maintenance) et
          ne peut être tenue responsable des dommages survenus pendant le trajet, qui relèvent du chauffeur et
          de son assurance.
        </p>
      </Section>

      <Section icon={Gavel} title="7. Réclamations et droit applicable">
        <p>
          Toute réclamation doit être adressée à{" "}
          <a className="text-primary underline" href="mailto:contact@taxiproxi.cm">contact@taxiproxi.cm</a> dans les
          30 jours suivant la course. Les présentes conditions sont régies par le droit camerounais ; à défaut de
          solution amiable, les tribunaux compétents de Yaoundé sont seuls saisis.
        </p>
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
