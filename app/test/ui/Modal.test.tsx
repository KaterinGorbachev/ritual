import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { Modal } from "../../ui/Modal";

const labels = { close: "Close dialog" };

/** The <dialog> element under test. */
const dialogEl = () => document.querySelector("dialog") as HTMLDialogElement;

describe("Modal", () => {
    it("stays closed until asked to open", async () => {
        await render(
            <Modal open={false} onClose={() => { }} title="Booking" labels={labels}>
                <p>body</p>
            </Modal>
        );
        expect(dialogEl().open).toBe(false);
    });

    it("opens as a modal dialog, so the browser lifts it into the top layer", async () => {
        await render(
            <Modal open onClose={() => { }} title="Booking" labels={labels}>
                <p>body</p>
            </Modal>
        );
        const dialog = dialogEl();
        expect(dialog.open).toBe(true);
        // Only showModal() sets a top-layer match; dialog.show() does not.
        expect(dialog.matches(":modal")).toBe(true);
    });

    it("is named by its title for assistive tech", async () => {
        const screen = await render(
            <Modal open onClose={() => { }} title="Booking" labels={labels}>
                <p>body</p>
            </Modal>
        );
        await expect
            .element(screen.getByRole("dialog", { name: "Booking" }))
            .toBeInTheDocument();
    });

    it("describes itself with the subtitle when one is given", async () => {
        await render(
            <Modal open onClose={() => { }} title="Booking" subtitle="Lifting facial" labels={labels}>
                <p>body</p>
            </Modal>
        );
        const dialog = dialogEl();
        const describedBy = dialog.getAttribute("aria-describedby")!;
        expect(document.getElementById(describedBy)?.textContent).toBe("Lifting facial");
    });

    it("closes on Escape", async () => {
        const onClose = vi.fn();
        await render(
            <Modal open onClose={onClose} title="Booking" labels={labels}>
                <p>body</p>
            </Modal>
        );
        await userEvent.keyboard("{Escape}");
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes from the labelled close control", async () => {
        const onClose = vi.fn();
        const screen = await render(
            <Modal open onClose={onClose} title="Booking" labels={labels}>
                <p>body</p>
            </Modal>
        );
        await userEvent.click(screen.getByRole("button", { name: labels.close }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not close on a click inside the panel", async () => {
        const onClose = vi.fn();
        const screen = await render(
            <Modal open onClose={onClose} title="Booking" labels={labels}>
                <button type="button">inside</button>
            </Modal>
        );
        await userEvent.click(screen.getByRole("button", { name: "inside" }));
        expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on a click on the backdrop", async () => {
        const onClose = vi.fn();
        await render(
            <Modal open onClose={onClose} title="Booking" labels={labels}>
                <p>body</p>
            </Modal>
        );
        // A backdrop click is delivered to the <dialog> element itself; the
        // panel inside stops propagation for its own clicks.
        dialogEl().click();
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("moves focus into the dialog when it opens", async () => {
        await render(
            <Modal open onClose={() => { }} title="Booking" labels={labels}>
                <button type="button">inside</button>
            </Modal>
        );
        expect(dialogEl().contains(document.activeElement)).toBe(true);
    });

    it("restores focus to the control that opened it on close", async () => {
        function Harness() {
            const [open, setOpen] = useState(false);
            return (
                <>
                    <button type="button" onClick={() => setOpen(true)}>
                        opener
                    </button>
                    <Modal open={open} onClose={() => setOpen(false)} title="Booking" labels={labels}>
                        <p>body</p>
                    </Modal>
                </>
            );
        }

        const screen = await render(<Harness />);
        const opener = screen.getByRole("button", { name: "opener" });
        await userEvent.click(opener);
        await userEvent.click(screen.getByRole("button", { name: labels.close }));
        expect(document.activeElement).toBe(await opener.element());
    });
});
