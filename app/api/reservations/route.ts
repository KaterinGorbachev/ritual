import { NextResponse } from "next/server";
import { doc, addDoc, collection, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../../database/firebase.config";
import { isValidName, isValidPhone } from "../../lib/bookingValidation";
import { notifyAdminOfReservation } from "../../lib/whatsappNotify";

// This route writes to Firestore and calls the WhatsApp API, so it must run
// per-request — never cached, never evaluated at build time.
export const dynamic = "force-dynamic";

type ReservationBody = {
    slotId?: unknown;
    name?: unknown;
    phone?: unknown;
    language?: unknown;
    marketingOptIn?: unknown;
    consent?: unknown;
};

/** The locales the policy exists in; anything else is not a version we served. */
const KNOWN_LOCALES = ["es", "en", "ru"];

/**
 * Collections this route touches.
 *
 * NOTE: `slots` does not exist in Firestore yet — `contactData` is currently
 * the only collection in use. Each slot document is expected to carry a
 * `status` field (see below) alongside the service, date, duration and price
 * the gallery displays.
 */
const SLOTS = "slots";
const RESERVATIONS = "reservations";

/**
 * Slot lifecycle.
 *
 * `held` exists so a submitted-but-unconfirmed slot is not mistaken for a
 * confirmed booking. Submitting sets `held`, never `reserved`: the salon
 * confirms on WhatsApp and only then does the slot become `reserved`. A held
 * slot is released manually from the CRM, so nothing expires on its own.
 *
 * The consequence to be aware of: a hold that nobody ever answers keeps that
 * time unbookable until a person releases it. That is deliberate — but it makes
 * the `heldAt` timestamp below load-bearing, since it is what lets the CRM list
 * stale holds for review.
 */
const SLOT_HELD = "held";
const SLOT_RESERVED = "reserved";

/**
 * `POST /api/reservations` — hold a slot pending confirmation.
 *
 * ## Why this is a route handler and not part of a layout or page
 *
 * `layout.tsx` and `page.tsx` are Server Components: they run when someone
 * *loads* a page, to produce HTML, and nothing re-runs them when a client
 * presses Confirm minutes later. A booking is an event at an arbitrary moment,
 * so it needs an endpoint that is listening for a request — which is exactly
 * what a `route.ts` file is. The folder path is the URL, so
 * `app/api/reservations/route.ts` answers `POST /api/reservations`, and it sits
 * outside `[lang]` because an endpoint has no locale of its own.
 *
 * ## Why this work belongs on the server
 *
 * - The WhatsApp API token must never reach the browser; here only the response
 *   is sent to the client, so `process.env` stays secret.
 * - The slot status must be un-forgeable. Written from the browser, anyone
 *   could POST a fabricated status straight to Firestore.
 * - The read-then-write must be atomic, or two clients take the same time.
 *
 * The client's own validation is re-run here: a request can arrive from
 * anywhere, not only from our form, so the browser's checks are a convenience
 * and never the guarantee.
 *
 * Responds with a plain `{ error }` sentence on failure. `AppointmentForm`
 * shows that text verbatim, so it must stay human and free of Firestore codes.
 */
export async function POST(request: Request) {
    let body: ReservationBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const slotId = typeof body.slotId === "string" ? body.slotId : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const language = typeof body.language === "string" ? body.language : "";
    const marketingOptIn = body.marketingOptIn === true;

    if (!slotId || !isValidName(name) || !isValidPhone(phone)) {
        return NextResponse.json(
            { error: "Some details are missing or look incomplete. Please check and try again." },
            { status: 400 }
        );
    }

    // The privacy policy promises that acceptance is recorded with the policy
    // version and the language it was read in — art. 7.1 puts the burden of
    // proving consent on the salon, and a bare boolean proves nothing. So the
    // record is validated here rather than trusted: a booking that cannot be
    // evidenced is refused instead of being written unprovable.
    const consentInput =
        typeof body.consent === "object" && body.consent !== null
            ? (body.consent as Record<string, unknown>)
            : null;

    const policyVersion =
        typeof consentInput?.policyVersion === "string" ? consentInput.policyVersion : "";
    const consentLocale =
        typeof consentInput?.locale === "string" ? consentInput.locale : "";

    if (
        consentInput?.policyAccepted !== true ||
        // ISO 8601 date, matching `privacy.meta.dateLastModification`.
        !/^\d{4}-\d{2}-\d{2}$/.test(policyVersion) ||
        !KNOWN_LOCALES.includes(consentLocale)
    ) {
        return NextResponse.json(
            { error: "Please confirm you are 18 and accept the Privacy Policy to continue." },
            { status: 400 }
        );
    }

    let reservationId: string;
    try {
        // A transaction is what stops two clients taking the same slot: the
        // read and the status write happen atomically, so the second request
        // sees the hold and is turned away rather than overwriting the first.
        await runTransaction(db, async (transaction) => {
            const slotRef = doc(db, SLOTS, slotId);
            const slotSnapshot = await transaction.get(slotRef);

            if (!slotSnapshot.exists()) {
                throw new Error("SLOT_MISSING");
            }

            const status = slotSnapshot.data().status;
            if (status === SLOT_RESERVED || status === SLOT_HELD) {
                throw new Error("SLOT_TAKEN");
            }

            // Held, not reserved: this is a request awaiting the salon's reply,
            // not a confirmed booking. Promotion to `reserved` happens when the
            // salon confirms; release back to free happens from the CRM.
            transaction.update(slotRef, {
                status: SLOT_HELD,
                // Lets the CRM surface holds nobody has answered yet.
                heldAt: serverTimestamp(),
            });
        });

        const reservation = await addDoc(collection(db, RESERVATIONS), {
            slotId,
            name,
            phone,
            language,
            // Evidence of the required privacy-policy acceptance. `acceptedAt`
            // is the SERVER's clock, not the browser's — a timestamp the client
            // could set would prove nothing about when consent was given.
            consent: {
                policyAccepted: true,
                policyVersion,
                locale: consentLocale,
                source: "booking-form",
                acceptedAt: serverTimestamp(),
            },
            // Marketing is a separate, independently withdrawable permission
            // (art. 7.2/7.3), so it carries its own timestamps rather than
            // riding on the consent record. `withdrawnAt` starts null and is
            // stamped when the client sends PARAR/STOP/СТОП or emails us.
            marketingOptIn: {
                value: marketingOptIn,
                changedAt: serverTimestamp(),
                source: "booking-form",
                withdrawnAt: null,
            },
            // always send reserved and to reactivate the slot - add it manually again
            status: "reserved",
            createdAt: serverTimestamp(),
        });
        reservationId = reservation.id;
    } catch (error) {
        const code = error instanceof Error ? error.message : "";

        if (code === "SLOT_TAKEN") {
            return NextResponse.json(
                { error: "Sorry, that time was just taken. Please choose another slot." },
                { status: 409 }
            );
        }
        if (code === "SLOT_MISSING") {
            return NextResponse.json(
                { error: "That slot is no longer available. Please choose another time." },
                { status: 404 }
            );
        }

        console.error("Reservation write failed:", error);
        return NextResponse.json(
            { error: "We could not save your booking just now. Please try again in a moment." },
            { status: 500 }
        );
    }

    // The slot is held and the client is owed a reply, so a failed notification
    // must not fail the request — the hold is real either way. It is logged
    // loudly instead, for the salon to pick up.
    try {
        await notifyAdminOfReservation({ name, phone, language, slotId });
    } catch (error) {
        console.error("Admin WhatsApp notification failed:", error);
    }

    return NextResponse.json({ ok: true, id: reservationId }, { status: 201 });
}
