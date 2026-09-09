import { createMessengerCatalog } from "./catalog";

import contacts from "../../../content/messenger/contacts.json";
import conversations from "../../../content/messenger/conversations.json";
import presenceEvents from "../../../content/messenger/presence-events.json";

export const messengerCatalog = createMessengerCatalog({ contacts, conversations, presenceEvents });
