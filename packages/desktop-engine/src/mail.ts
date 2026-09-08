export interface MailMessage {
  id: string;
  from: string;
  subject: string;
  /** Display date, already in the era's convention. */
  date: string;
  body: string;
}

export interface Mailbox {
  address: string;
  messages: MailMessage[];
}

const mailboxes: Record<string, Mailbox> = {
  "1998": {
    address: "vous@timemachine.fr",
    messages: [
      {
        id: "welcome",
        from: "Time Machine <bienvenue@timemachine.fr>",
        subject: "Bienvenue en 1998",
        date: "01/01/1998 09:41",
        body: [
          "Bonjour,",
          "",
          "Votre machine de 1998 est prête. Le Web compte quelques millions de sites,",
          "AltaVista est le moteur de recherche de référence et un nouveau venu,",
          "Google, vient d'ouvrir ses portes en septembre.",
          "",
          "Ouvrez Time Browser pour commencer votre visite.",
          "",
          "— L'équipe Time Machine",
        ].join("\n"),
      },
      {
        id: "fai",
        from: "Service client <support@fournisseur-acces.fr>",
        subject: "Votre abonnement 56k est activé",
        date: "20/01/1998 21:05",
        body: [
          "Madame, Monsieur,",
          "",
          "Votre accès Internet par modem 56k est désormais actif.",
          "Rappel : la connexion occupe votre ligne téléphonique et est facturée",
          "au tarif d'une communication locale.",
          "",
          "Pensez à vous déconnecter après usage.",
        ].join("\n"),
      },
      {
        id: "chain",
        from: "Un ami <ami@multimania.com>",
        subject: "Fwd: Fwd: Fwd: Incroyable !!!",
        date: "14/03/1998 23:12",
        body: [
          "Transfère ce message à 10 personnes ou ta connexion sera coupée !!!",
          "",
          "(Ceci est un exemple de chaîne d'e-mails, très répandues en 1998.)",
        ].join("\n"),
      },
    ],
  },
};

export function getMailbox(eraId: string): Mailbox {
  return mailboxes[eraId] ?? { address: "vous@timemachine.fr", messages: [] };
}
