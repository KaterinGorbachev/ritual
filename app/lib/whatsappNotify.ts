// Server-only. Notifies the salon administrator on WhatsApp that a slot has
// been held and is waiting for confirmation.
//
// This module must never be imported into a client component: it reads the
// WhatsApp access token, and anything a client component imports is bundled
// into the page. `server-only` turns that mistake into a build error rather
// than a leaked credential.
import "server-only";

type ReservationNotice = {
    name: string;
    phone: string;
    /** The client's preferred language, e.g. "es". */
    language: string;
    slotId: string;
};

/**
 * WhatsApp Business Cloud API credentials, all server-side.
 *
 * - `WHATSAPP_TOKEN` — permanent access token from the Meta app.
 * - `WHATSAPP_PHONE_NUMBER_ID` — the sending number's id (not the number).
 * - `WHATSAPP_ADMIN_NUMBER` — the administrator's number in E.164, digits only.
 * - `WHATSAPP_TEMPLATE_NAME` — an approved template; Meta requires one for a
 *   business-initiated message outside the 24-hour customer service window,
 *   which a booking notification always is.
 * - `WHATSAPP_TEMPLATE_LANGUAGE` — the template's registered locale.
 */
const GRAPH_VERSION = "v21.0";

/**
 * Send the administrator a WhatsApp message about a new held slot.
 *
 * Throws on a missing configuration or a non-2xx response. The caller decides
 * what that means: the reservations route deliberately swallows it, because the
 * slot is already held and the client is owed their confirmation screen either
 * way — a notification failure is the salon's problem to see in the logs, not
 * the client's to see on screen.
 *
 * The client's phone number is passed as a template variable, so the
 * administrator can reply to them directly from the notification.
 */
export async function notifyAdminOfReservation({
    name,
    phone,
    language,
    slotId,
}: ReservationNotice): Promise<void> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "es";

    if (!token || !phoneNumberId || !adminNumber || !templateName) {
        throw new Error(
            "WhatsApp notification is not configured (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ADMIN_NUMBER, WHATSAPP_TEMPLATE_NAME)."
        );
    }

    const response = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: adminNumber,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: templateLanguage },
                    components: [
                        {
                            type: "body",
                            // Order must match the {{1}}…{{4}} placeholders in
                            // the approved template.
                            parameters: [
                                { type: "text", text: name },
                                { type: "text", text: phone },
                                { type: "text", text: language },
                                { type: "text", text: slotId },
                            ],
                        },
                    ],
                },
            }),
        }
    );

    if (!response.ok) {
        // Read the body for the log — Meta explains refusals here (an expired
        // token, an unapproved template). Never surfaced to the client.
        const detail = await response.text().catch(() => "");
        throw new Error(`WhatsApp API responded ${response.status}: ${detail}`);
    }
}
