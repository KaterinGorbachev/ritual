import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { AppointmentForm } from "../../ui/AppointmentForm";
import { isValidPhone, isValidName } from "../../lib/bookingValidation";

const slot = {
    id: "s1",
    service: "Lifting facial massage",
    duration: "60 min",
    date: "Mon 12 Aug · 10:00",
    price: "€65",
};

const labels = {
    heading: "Your appointment",
    duration: "Duration",
    date: "Date and time",
    price: "Price",
    name: "Your name",
    phone: "Phone number",
    phoneHint: "Include your country code, e.g. +34 600 000 000",
    language: "Preferred language",
    languageOptions: [
        { value: "es", label: "Español" },
        { value: "en", label: "English" },
        { value: "ru", label: "Русский" },
    ],
    consent: "I am 18 years old and agree with the Privacy Policy",
    marketing: "I would like to receive information about services and discounts",
    confirm: "Confirm",
    /** Replaces the confirm label while the reservation is being sent. */
    sending: "Sending…",
    later: "Maybe later",
    errors: {
        name: "Please tell us the name we should book under.",
        phone: "Please add a phone number with a country code, e.g. +34 600 000 000.",
        consent: "Please confirm you are 18 and agree with the Privacy Policy to continue.",
        /** Human fallback when the reservation could not be sent. */
        submit: "We could not send your booking just now. Please check your connection and try again.",
    },
};

const form = (over: Partial<React.ComponentProps<typeof AppointmentForm>> = {}) => (
    <AppointmentForm
        slot={slot}
        labels={labels}
        onConfirm={() => { }}
        onCancel={() => { }}
        {...over}
    />
);

/** Fill every required field with valid data, leaving the given field out. */
async function fillValid(
    screen: Awaited<ReturnType<typeof render>>,
    skip: "name" | "phone" | "consent" | null = null
) {
    if (skip !== "name") await userEvent.fill(screen.getByLabelText(labels.name), "Marina");
    if (skip !== "phone") await userEvent.fill(screen.getByLabelText(labels.phone), "+34600000000");
    if (skip !== "consent") await userEvent.click(screen.getByLabelText(labels.consent));
}

describe("bookingValidation", () => {
    describe("isValidName", () => {
        // Boundary: minimum accepted length is 2 characters.
        it.each([
            ["", false],
            ["A", false],
            ["Al", true],
            ["Marina", true],
            ["  Al  ", true],
            ["   ", false],
        ])("isValidName(%j) === %s", (input, expected) => {
            expect(isValidName(input)).toBe(expected);
        });
    });

    describe("isValidPhone", () => {
        // Equivalence partitions: too short / valid / too long / non-numeric.
        it.each([
            ["+3460000000", true],
            ["+34 600 000 000", true],
            ["0034600000000", true],
            ["600000000", true],
            ["", false],
            ["+34", false],
            ["abcdefghi", false],
            ["+34-600-000-000", true],
        ])("isValidPhone(%j) === %s", (input, expected) => {
            expect(isValidPhone(input)).toBe(expected);
        });

        // Boundaries: 8 digits is too short, 9 is the minimum, 15 is the ITU
        // maximum, 16 is too long.
        it("rejects 8 digits and accepts 9 (lower boundary)", () => {
            expect(isValidPhone("1".repeat(8))).toBe(false);
            expect(isValidPhone("1".repeat(9))).toBe(true);
        });

        it("accepts 15 digits and rejects 16 (upper boundary)", () => {
            expect(isValidPhone("1".repeat(15))).toBe(true);
            expect(isValidPhone("1".repeat(16))).toBe(false);
        });
    });
});

describe("AppointmentForm", () => {
    it("shows the service, duration, date and price being booked", async () => {
        const screen = await render(form());
        await expect.element(screen.getByText(slot.service)).toBeInTheDocument();
        await expect.element(screen.getByText(slot.duration)).toBeInTheDocument();
        await expect.element(screen.getByText(slot.date)).toBeInTheDocument();
        await expect.element(screen.getByText(slot.price)).toBeInTheDocument();
    });

    it("gives every input a visible associated label", async () => {
        const screen = await render(form());
        await expect.element(screen.getByLabelText(labels.name)).toBeInTheDocument();
        await expect.element(screen.getByLabelText(labels.phone)).toBeInTheDocument();
        await expect.element(screen.getByLabelText(labels.language)).toBeInTheDocument();
        await expect.element(screen.getByLabelText(labels.consent)).toBeInTheDocument();
        await expect.element(screen.getByLabelText(labels.marketing)).toBeInTheDocument();
    });

    it("uses a tel input mode so mobile keyboards show digits", async () => {
        const screen = await render(form());
        await expect.element(screen.getByLabelText(labels.phone)).toHaveAttribute("type", "tel");
    });

    it("leaves the marketing checkbox unchecked and optional by default", async () => {
        const screen = await render(form());
        const marketing = screen.getByLabelText(labels.marketing);
        await expect.element(marketing).not.toBeChecked();
        await expect.element(marketing).not.toBeRequired();
    });

    it("does not confirm when the required consent checkbox is unticked", async () => {
        const onConfirm = vi.fn();
        const screen = await render(form({ onConfirm }));
        await fillValid(screen, "consent");
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
        expect(onConfirm).not.toHaveBeenCalled();
        await expect.element(screen.getByText(labels.errors.consent)).toBeInTheDocument();
    });

    it("does not confirm on an empty name and ties the message to the field", async () => {
        const onConfirm = vi.fn();
        const screen = await render(form({ onConfirm }));
        await fillValid(screen, "name");
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
        expect(onConfirm).not.toHaveBeenCalled();

        const input = await screen.getByLabelText(labels.name).element();
        expect(input.getAttribute("aria-invalid")).toBe("true");
        const describedBy = input.getAttribute("aria-describedby") ?? "";
        const message = describedBy
            .split(" ")
            .map((id) => document.getElementById(id)?.textContent ?? "")
            .join(" ");
        expect(message).toContain(labels.errors.name);
    });

    it("does not confirm on a too-short phone number", async () => {
        const onConfirm = vi.fn();
        const screen = await render(form({ onConfirm }));
        await userEvent.fill(screen.getByLabelText(labels.name), "Marina");
        await userEvent.fill(screen.getByLabelText(labels.phone), "+34");
        await userEvent.click(screen.getByLabelText(labels.consent));
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
        expect(onConfirm).not.toHaveBeenCalled();
        await expect.element(screen.getByText(labels.errors.phone)).toBeInTheDocument();
    });

    it("confirms with the trimmed details once every required field is valid", async () => {
        const onConfirm = vi.fn();
        const screen = await render(form({ onConfirm }));
        await userEvent.fill(screen.getByLabelText(labels.name), "  Marina  ");
        await userEvent.fill(screen.getByLabelText(labels.phone), "+34 600 000 000");
        await userEvent.click(screen.getByLabelText(labels.consent));
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith(
            expect.objectContaining({
                slotId: slot.id,
                name: "Marina",
                phone: "+34 600 000 000",
                marketingOptIn: false,
            })
        );
    });

    it("carries the marketing opt-in through when the client ticks it", async () => {
        const onConfirm = vi.fn();
        const screen = await render(form({ onConfirm }));
        await fillValid(screen);
        await userEvent.click(screen.getByLabelText(labels.marketing));
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
        expect(onConfirm).toHaveBeenCalledWith(
            expect.objectContaining({ marketingOptIn: true })
        );
    });

    it("submits the preferred language, defaulting to the first option", async () => {
        const onConfirm = vi.fn();
        const screen = await render(form({ onConfirm }));
        await fillValid(screen);
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
        expect(onConfirm).toHaveBeenCalledWith(
            expect.objectContaining({ language: labels.languageOptions[0].value })
        );
    });

    it("submits the language the client picks", async () => {
        const onConfirm = vi.fn();
        const screen = await render(form({ onConfirm }));
        await fillValid(screen);
        await userEvent.selectOptions(screen.getByLabelText(labels.language), "ru");
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
        expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ language: "ru" }));
    });

    it("cancels without confirming from the maybe-later button", async () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        const screen = await render(form({ onConfirm, onCancel }));
        await userEvent.click(screen.getByRole("button", { name: labels.later }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("clears a field's error as soon as the client corrects it", async () => {
        const screen = await render(form());
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
        await expect.element(screen.getByText(labels.errors.name)).toBeInTheDocument();

        await userEvent.fill(screen.getByLabelText(labels.name), "Marina");
        const input = await screen.getByLabelText(labels.name).element();
        expect(input.getAttribute("aria-invalid")).not.toBe("true");
    });

    it("reports every invalid field at once, not one at a time", async () => {
        const screen = await render(form());
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
        await expect.element(screen.getByText(labels.errors.name)).toBeInTheDocument();
        await expect.element(screen.getByText(labels.errors.phone)).toBeInTheDocument();
        await expect.element(screen.getByText(labels.errors.consent)).toBeInTheDocument();
    });

    it("moves focus to the first invalid field so a keyboard user lands on it", async () => {
        const screen = await render(form());
        await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
        expect(document.activeElement).toBe(await screen.getByLabelText(labels.name).element());
    });

    describe("while the reservation is being sent", () => {
        /** A confirm handler that stays pending until the test resolves it. */
        function deferred() {
            let resolve!: () => void;
            let reject!: (reason?: unknown) => void;
            const promise = new Promise<void>((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        }

        it("swaps the confirm label and disables the button so a slot cannot be double-booked", async () => {
            const pending = deferred();
            const onConfirm = vi.fn(() => pending.promise);
            const screen = await render(form({ onConfirm }));
            await fillValid(screen);
            await userEvent.click(screen.getByRole("button", { name: labels.confirm }));

            const button = screen.getByRole("button", { name: labels.sending });
            await expect.element(button).toBeInTheDocument();
            await expect.element(button).toBeDisabled();

            pending.resolve();
        });

        it("ignores a second submit while the first is still in flight", async () => {
            const pending = deferred();
            const onConfirm = vi.fn(() => pending.promise);
            const screen = await render(form({ onConfirm }));
            await fillValid(screen);

            await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
            const button = (await screen
                .getByRole("button", { name: labels.sending })
                .element()) as HTMLButtonElement;
            button.click();
            button.click();

            expect(onConfirm).toHaveBeenCalledTimes(1);
            pending.resolve();
        });

        it("shows a human message and re-enables confirm when sending fails", async () => {
            const onConfirm = vi.fn(() => Promise.reject(new Error("network")));
            const screen = await render(form({ onConfirm }));
            await fillValid(screen);
            await userEvent.click(screen.getByRole("button", { name: labels.confirm }));

            await expect.element(screen.getByText(labels.errors.submit)).toBeInTheDocument();
            // The client must be able to try again.
            await expect
                .element(screen.getByRole("button", { name: labels.confirm }))
                .toBeEnabled();
        });

        it("announces a send failure to assistive tech as an alert", async () => {
            const onConfirm = vi.fn(() => Promise.reject(new Error("network")));
            const screen = await render(form({ onConfirm }));
            await fillValid(screen);
            await userEvent.click(screen.getByRole("button", { name: labels.confirm }));

            await expect.element(screen.getByRole("alert")).toBeInTheDocument();
        });

        it("still works with a plain synchronous confirm handler", async () => {
            const onConfirm = vi.fn();
            const screen = await render(form({ onConfirm }));
            await fillValid(screen);
            await userEvent.click(screen.getByRole("button", { name: labels.confirm }));
            expect(onConfirm).toHaveBeenCalledTimes(1);
        });
    });
});
