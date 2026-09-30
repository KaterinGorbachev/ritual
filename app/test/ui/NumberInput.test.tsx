import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { createRef } from "react";
import { NumberInput } from "../../ui/NumberInput";

const field = (over: Partial<React.ComponentProps<typeof NumberInput>> = {}) => (
    <NumberInput label="Duration" unit="min" name="duration" {...over} />
);

/**
 * The input, found the way a screen reader would. The unit is a second label on
 * the same input, so it is part of the accessible name: "Duration min".
 */
const box = (screen: Awaited<ReturnType<typeof render>>, name = "Duration min") =>
    screen.getByRole("spinbutton", { name });

const inputOf = async (screen: Awaited<ReturnType<typeof render>>, name?: string) =>
    (await box(screen, name).element()) as HTMLInputElement;

describe("NumberInput", () => {
    describe("label and structure", () => {
        it("renders a real <input type=number> with the given name", async () => {
            const screen = await render(field());
            const el = await inputOf(screen);
            expect(el.tagName).toBe("INPUT");
            expect(el.type).toBe("number");
            expect(el.name).toBe("duration");
        });

        it("shows a visible label", async () => {
            const screen = await render(field({ label: "Length of the session" }));
            await expect.element(screen.getByText("Length of the session")).toBeVisible();
        });

        it("focuses the input when the label is clicked", async () => {
            const screen = await render(field());
            await userEvent.click(screen.getByText("Duration"));
            await expect.element(box(screen)).toHaveFocus();
        });

        it("keeps two instances independent", async () => {
            const screen = await render(
                <>
                    <NumberInput label="Duration" unit="min" name="d" />
                    <NumberInput label="Price" unit="€" name="p" />
                </>,
            );
            await userEvent.click(screen.getByText("Price"));
            await expect.element(box(screen, "Price €")).toHaveFocus();
            await expect.element(box(screen)).not.toHaveFocus();
        });

        it("honours an id supplied by the caller", async () => {
            const screen = await render(field({ id: "my-number" }));
            expect((await inputOf(screen)).id).toBe("my-number");
        });

        it("forwards a ref to the input so a form can focus the first invalid field", async () => {
            const ref = createRef<HTMLInputElement>();
            const screen = await render(field({ ref }));
            expect(ref.current).toBe(await inputOf(screen));
        });
    });

    describe("unit", () => {
        it("is shown beside the number", async () => {
            const screen = await render(field({ testId: "t" }));
            await expect.element(screen.getByTestId("t-unit")).toHaveTextContent("min");
        });

        it("comes after the number by default (60 min, 65 €)", async () => {
            const screen = await render(field({ testId: "t" }));
            const el = await inputOf(screen);
            const unit = screen.container.querySelector('[data-testid="t-unit"]')!;
            expect(el.compareDocumentPosition(unit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it('comes before the number with unitPosition="start" (€65)', async () => {
            const screen = await render(field({ unit: "€", unitPosition: "start", testId: "t" }));
            const el = await inputOf(screen, "Duration €");
            const unit = screen.container.querySelector('[data-testid="t-unit"]')!;
            expect(el.compareDocumentPosition(unit) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
        });

        it("is read as part of the field's name, not left as loose text", async () => {
            const screen = await render(field({ label: "Price", unit: "€" }));
            await expect.element(box(screen, "Price €")).toBeInTheDocument();
        });

        it("focuses the input when the unit itself is clicked", async () => {
            const screen = await render(field({ testId: "t" }));
            await userEvent.click(screen.getByTestId("t-unit"));
            await expect.element(box(screen)).toHaveFocus();
        });

        it("makes room for a long unit instead of clipping it (minutos, minutes)", async () => {
            const screen = await render(field({ unit: "minutos", testId: "t" }));
            await expect.element(screen.getByTestId("t-unit")).toBeVisible();
        });
    });

    describe("required", () => {
        it("is optional by default: no asterisk, not required", async () => {
            const screen = await render(field());
            expect((await inputOf(screen)).required).toBe(false);
            expect(screen.container.textContent).not.toContain("*");
        });

        it("shows a visible asterisk that assistive tech skips, and sets required", async () => {
            const screen = await render(field({ required: true }));
            expect((await inputOf(screen)).required).toBe(true);
            expect(screen.container.querySelector('[aria-hidden="true"]')?.textContent).toBe("*");
            // Name is unchanged by the asterisk.
            await expect.element(box(screen)).toBeInTheDocument();
        });

        it("empty + required is missing a value; empty + optional is fine", async () => {
            const req = await render(field({ required: true }));
            expect((await inputOf(req)).validity.valueMissing).toBe(true);
            const opt = await render(field({ label: "Other", unit: "u" }));
            expect((await inputOf(opt, "Other u")).validity.valueMissing).toBe(false);
        });
    });

    describe("min and max", () => {
        // Boundaries: min - 1, min, min + 1 … max - 1, max, max + 1.
        const range = { min: 5, max: 480, required: true };

        it.each([
            ["4", "rangeUnderflow"], // min - 1
            ["0", "rangeUnderflow"], // far below
            ["-10", "rangeUnderflow"], // negative
        ] as const)("rejects %s as below the minimum", async (typed, flag) => {
            const screen = await render(field(range));
            await userEvent.fill(box(screen), typed);
            expect((await inputOf(screen)).validity[flag]).toBe(true);
        });

        it.each(["5", "6", "60", "479", "480"])("accepts %s inside the range", async (typed) => {
            const screen = await render(field(range));
            await userEvent.fill(box(screen), typed);
            expect((await inputOf(screen)).validity.valid).toBe(true);
        });

        it.each([
            ["481", "rangeOverflow"], // max + 1
            ["9999", "rangeOverflow"], // far above
        ] as const)("rejects %s as above the maximum", async (typed, flag) => {
            const screen = await render(field(range));
            await userEvent.fill(box(screen), typed);
            expect((await inputOf(screen)).validity[flag]).toBe(true);
        });

        it("has no limits unless asked — any number is in range", async () => {
            const screen = await render(field());
            await userEvent.fill(box(screen), "123456");
            const el = await inputOf(screen);
            expect(el.validity.rangeOverflow).toBe(false);
            expect(el.validity.rangeUnderflow).toBe(false);
        });
    });

    describe("step: whole minutes versus cents", () => {
        it("minutes are whole numbers by default: 30 is fine, 30.5 is not", async () => {
            const screen = await render(field());
            await userEvent.fill(box(screen), "30");
            expect((await inputOf(screen)).validity.stepMismatch).toBe(false);
            await userEvent.fill(box(screen), "30.5");
            expect((await inputOf(screen)).validity.stepMismatch).toBe(true);
        });

        it('step="0.01" takes cents: 12.5 and 12.50 fit, 12.505 does not', async () => {
            const screen = await render(field({ label: "Price", unit: "€", step: "0.01" }));
            await userEvent.fill(box(screen, "Price €"), "12.5");
            expect((await inputOf(screen, "Price €")).validity.stepMismatch).toBe(false);
            await userEvent.fill(box(screen, "Price €"), "12.505");
            expect((await inputOf(screen, "Price €")).validity.stepMismatch).toBe(true);
        });

        it.each([
            [undefined, "numeric"],
            [1, "numeric"],
            ["5", "numeric"],
            ["0.01", "decimal"],
            [0.5, "decimal"],
            ["any", "decimal"],
        ] as const)("step=%s brings up the %s keypad on a phone", async (step, mode) => {
            const screen = await render(field({ step }));
            expect((await inputOf(screen)).inputMode).toBe(mode);
        });
    });

    describe("controlled use", () => {
        it("shows the value it is given", async () => {
            const screen = await render(field({ value: 45, onChange: () => { } }));
            expect((await inputOf(screen)).value).toBe("45");
        });

        it("shows a defaultValue when uncontrolled", async () => {
            const screen = await render(field({ defaultValue: 30 }));
            expect((await inputOf(screen)).value).toBe("30");
        });

        it("reports each edit through onChange", async () => {
            const seen: string[] = [];
            const onChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
                seen.push(event.target.value);
            });
            const screen = await render(field({ onChange }));
            await userEvent.fill(box(screen), "90");
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(seen).toEqual(["90"]);
        });
    });

    describe("mouse wheel", () => {
        it("lets go of focus on a wheel scroll, so the page scrolls instead of changing the number", async () => {
            const screen = await render(field({ defaultValue: 30 }));
            const el = await inputOf(screen);
            el.focus();
            expect(document.activeElement).toBe(el);
            el.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 100 }));
            expect(document.activeElement).not.toBe(el);
            expect(el.value).toBe("30");
        });
    });

    describe("hint", () => {
        it("is shown and read with the field", async () => {
            const screen = await render(field({ hint: "Between 5 and 480", testId: "t" }));
            await expect.element(screen.getByText("Between 5 and 480")).toBeVisible();
            const hint = screen.container.querySelector('[data-testid="t-hint"]')!;
            expect((await inputOf(screen)).getAttribute("aria-describedby")).toContain(hint.id);
        });

        it("renders nothing without one", async () => {
            const screen = await render(field({ testId: "t" }));
            expect(screen.container.querySelector('[data-testid="t-hint"]')).toBeNull();
        });
    });

    describe("error", () => {
        it("has no error state by default", async () => {
            const screen = await render(field({ testId: "t" }));
            const el = await inputOf(screen);
            expect(el.getAttribute("aria-invalid")).toBeNull();
            expect(screen.container.querySelector('[data-testid="t-error"]')).toBeNull();
            expect(el.getAttribute("aria-describedby")).toBeNull();
        });

        it("marks the field invalid, shows the message and ties it to the field", async () => {
            const screen = await render(field({ error: "Enter 5 to 480 minutes.", testId: "t" }));
            const el = await inputOf(screen);
            expect(el.getAttribute("aria-invalid")).toBe("true");
            await expect.element(screen.getByText("Enter 5 to 480 minutes.")).toBeVisible();
            const message = screen.container.querySelector('[data-testid="t-error"]')!;
            expect(el.getAttribute("aria-describedby")).toContain(message.id);
        });

        it("keeps hint and error both attached at once", async () => {
            const screen = await render(field({ hint: "A hint", error: "An error", testId: "t" }));
            const described = (await inputOf(screen)).getAttribute("aria-describedby") ?? "";
            for (const part of ["hint", "error"]) {
                const node = screen.container.querySelector(`[data-testid="t-${part}"]`)!;
                expect(described).toContain(node.id);
            }
        });

        it("drops the error state once the parent clears the message", async () => {
            const screen = await render(field({ error: "Too low.", testId: "t" }));
            await screen.rerender(field({ testId: "t" }));
            expect((await inputOf(screen)).getAttribute("aria-invalid")).toBeNull();
            expect(screen.container.querySelector('[data-testid="t-error"]')).toBeNull();
        });

        it("outlines the control in magenta only while invalid", async () => {
            const bad = await render(field({ error: "Nope.", testId: "bad" }));
            const badControl = bad.container.querySelector('[data-testid="bad-control"]')!;
            expect(badControl.className).toMatch(/(^|\s)border-magenta/);
            const ok = await render(field({ label: "Other", unit: "u", testId: "ok" }));
            const okControl = ok.container.querySelector('[data-testid="ok-control"]')!;
            expect(okControl.className).not.toMatch(/(^|\s)border-magenta/);
        });
    });

    describe("pass-through and test hooks", () => {
        it("passes disabled through", async () => {
            const screen = await render(field({ disabled: true }));
            await expect.element(box(screen)).toBeDisabled();
        });

        it("puts data-testid on the input and derived ids on its parts", async () => {
            const screen = await render(field({ testId: "service-duration", error: "x" }));
            for (const id of [
                "service-duration",
                "service-duration-field",
                "service-duration-control",
                "service-duration-unit",
                "service-duration-error",
            ]) {
                expect(screen.container.querySelector(`[data-testid="${id}"]`), id).not.toBeNull();
            }
            expect(
                screen.container.querySelector('input[data-testid="service-duration"]'),
            ).not.toBeNull();
        });
    });

    describe("accessibility and brand", () => {
        it("carries the 44px touch target and a mint focus ring on the control", async () => {
            const screen = await render(field({ testId: "t" }));
            const control = screen.container.querySelector('[data-testid="t-control"]')!;
            // Asserted as classes, not computed size: the browser test project
            // loads no stylesheet, so geometry would always read as unstyled.
            expect(control.className).toContain("min-h-11");
            expect(control.className).toContain("focus-within:border-mint");
            expect(control.className).toContain("focus-within:ring-mint");
        });

        it("hides the native spinner arrows, which are sub-44px and fiddly", async () => {
            const screen = await render(field());
            expect((await inputOf(screen)).className).toContain("[appearance:textfield]");
        });

        it("uses on-token shape: pill radius, cream surface, ink text", async () => {
            const screen = await render(field({ testId: "t" }));
            const control = screen.container.querySelector('[data-testid="t-control"]')!;
            expect(control.className).toContain("rounded-pill");
            expect(control.className).toContain("bg-cream");
            expect((await inputOf(screen)).className).toContain("text-ink");
            expect(control.className).not.toMatch(/rounded-\[|bg-white|text-black/);
        });
    });
});
