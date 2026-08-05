"use client";

import { useState } from "react";
import { SlotGallery, type GallerySlot, type SlotGalleryNavLabels } from "./SlotGallery";
import { Modal } from "./Modal";
import { AppointmentForm, type AppointmentDetails, type AppointmentFormLabels } from "./AppointmentForm";
import { SuccessDialog, type SuccessDialogLabels } from "./SuccessDialog";
import type { Slot, SlotCardLabels } from "./SlotCard";

export type BookingSlotsLabels = {
    card: SlotCardLabels;
    nav: SlotGalleryNavLabels;
    form: AppointmentFormLabels;
    success: SuccessDialogLabels;
    /** Dialog title over the form, e.g. "Book your ritual". */
    formTitle: string;
    /** aria-label for the form dialog's close control. */
    close: string;
};

type BookingSlotsProps = {
    items: GallerySlot[];
    labels: BookingSlotsLabels;
    /**
     * Where the confirmed reservation is sent. Defaults to the booking route.
     * Pass `null` to skip the request entirely and go straight to the success
     * dialog — for previewing the flow before the backend exists.
     */
    endpoint?: string | null;
    className?: string;
};

/**
 * Wires the booking flow together: a horizontal gallery of bookable slots, the
 * appointment dialog opened by any card's Book button, and the success dialog
 * shown once a reservation has been sent.
 *
 * Owning `selected` here — rather than in each card — means one dialog serves
 * every slot in the gallery, and the chosen slot is simply the dialog's data.
 * `selected` is kept while the success dialog is up so the form's slot cannot
 * vanish mid-transition.
 *
 * The reservation is POSTed to a route handler rather than written from the
 * browser: the Firestore write and the WhatsApp notification to the
 * administrator both belong on the server, where credentials stay secret. A
 * failed send throws, which `AppointmentForm` catches and reports in words —
 * the form stays filled in so the client can retry.
 */
export function BookingSlots({
    items,
    labels,
    endpoint = "/api/reservations",
    className = "",
}: BookingSlotsProps) {
    const [selected, setSelected] = useState<Slot | null>(null);
    const [succeeded, setSucceeded] = useState(false);

    const handleConfirm = async (details: AppointmentDetails) => {
        if (endpoint) {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(details),
            });

            if (!response.ok) {
                // The route sends a human, already-translated sentence when it
                // can; AppointmentForm falls back to its own copy when it cannot.
                const body = await response.json().catch(() => null);
                throw new Error(body?.error ?? "");
            }
        }

        // Swap the form for the confirmation.
        setSelected(null);
        setSucceeded(true);
    };

    return (
        <div className={className}>
            <SlotGallery
                items={items}
                labels={labels.card}
                navLabels={labels.nav}
                onBook={setSelected}
            />

            {/* The form dialog. Keyed by slot so switching slots resets the
                fields instead of carrying the previous client's answers over. */}
            {selected ? (
                <Modal
                    key={selected.id}
                    open
                    onClose={() => setSelected(null)}
                    title={labels.formTitle}
                    subtitle={selected.service}
                    labels={{ close: labels.close }}
                    className="max-w-xl"
                >
                    <AppointmentForm
                        slot={selected}
                        labels={labels.form}
                        onConfirm={handleConfirm}
                        onCancel={() => setSelected(null)}
                    />
                </Modal>
            ) : null}

            <SuccessDialog
                open={succeeded}
                onClose={() => setSucceeded(false)}
                labels={labels.success}
            />
        </div>
    );
}
