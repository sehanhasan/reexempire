
import { shareViaWhatsApp } from "@/utils/mobileShare";

export function ShareDocument() {
  const shareDocument = (viewUrl: string, message: string) => {
    shareViaWhatsApp(`${message}\n\nView: ${viewUrl}`);
  };

  return shareDocument;
}
