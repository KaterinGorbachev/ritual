import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { createRef } from "react";
import { TextArea } from "../../ui/TextArea";

const area = (over: Partial<React.ComponentProps<typeof TextArea>> = {}) => (
    <TextArea label="RU" name="title_ru" {...over} />
);

/** The textarea rendered by `area()`, found the way a screen reader would. */
const box = (screen: Awaited<ReturnType<typeof render>>, name = "RU") =>
    screen.getByRole("textbox", { name });

describe("TextArea", () => {
    describe("label and structure", () => {
        it("renders a real <textarea> with the given name", async () => {
            const screen = await render(area());
            const el = await box(screen).element();
            expect(el.tagName).toBe("TEXTAREA");
            expect(el.getAttribute("name")).toBe("title_ru");
        });

        it("names the field with a visible <label>, not a placeholder", async () => {
            const screen = await render(area({ label: "Service title" }));
            await expect
                .element(screen.getByRole("textbox", { name: "Service title" }))
                .toBeInTheDocument();
            // The label is on screen as text, so a sighted user sees it too.
            await expect.element(screen.getByText("Service title")).toBeVisible();
        });

        it("focuses the textarea when its label is clicked", async () => {
            const screen = await render(area());
            await userEvent.click(screen.getByText("RU"));
            await expect.element(box(screen)).toHaveFocus();
        });

        it("keeps two instances independent — each label drives its own textarea", async () => {
            const screen = await render(
                <>
                    <TextArea label="RU" name="ru" />
                    <TextArea label="EN" name="en" />
                </>,
            );
            await userEvent.click(screen.getByText("EN"));
            await expect.element(box(screen, "EN")).toHaveFocus();
            await expect.element(box(screen, "RU")).not.toHaveFocus();
        });

        it("honours an id supplied by the caller", async () => {
            const screen = await render(area({ id: "my-area" }));
            const el = await box(screen).element();
            expect(el.id).toBe("my-area");
            expect(screen.container.querySelector('label[for="my-area"]')).not.toBeNull();
        });

        it("forwards a ref to the textarea so a form can focus the first invalid field", async () => {
            const ref = createRef<HTMLTextAreaElement>();
            const screen = await render(area({ ref }));
            const el = await box(screen).element();
            expect(ref.current).toBe(el);
        });

        it("defaults to 3 rows and lets the caller change that", async () => {
            const screen = await render(area());
            expect((await box(screen).element()).getAttribute("rows")).toBe("3");
            const screen2 = await render(area({ rows: 6, label: "ES" }));
            expect((await box(screen2, "ES").element()).getAttribute("rows")).toBe("6");
        });
    });

    describe("required marker", () => {
        it("is a plain optional field by default: no asterisk, not required", async () => {
            const screen = await render(area());
            const el = await box(screen).element();
            expect(el.hasAttribute("required")).toBe(false);
            expect(screen.container.textContent).not.toContain("*");
        });

        it("shows a visible asterisk but keeps it out of the accessible name", async () => {
            const screen = await render(area({ required: true }));
            // Name is still exactly "RU" — the asterisk is aria-hidden, and the
            // native `required` attribute is what a screen reader announces.
            const el = await box(screen).element();
            expect(el.hasAttribute("required")).toBe(true);
            expect(screen.container.textContent).toContain("*");
            const star = screen.container.querySelector('[aria-hidden="true"]');
            expect(star?.textContent).toBe("*");
        });
    });

    describe("character counter", () => {
        it("is absent when there is no maxLength (nothing to count towards)", async () => {
            const screen = await render(area({ testId: "t" }));
            expect(screen.container.querySelector('[data-testid="t-counter"]')).toBeNull();
        });

        it("starts at 0 / max for an empty field", async () => {
            const screen = await render(area({ maxLength: 150, testId: "t" }));
            await expect.element(screen.getByTestId("t-counter")).toHaveTextContent("0 / 150");
        });

        it("counts what is typed", async () => {
            const screen = await render(area({ maxLength: 150, testId: "t" }));
            await userEvent.fill(box(screen), "Ab");
            await expect.element(screen.getByTestId("t-counter")).toHaveTextContent("2 / 150");
        });

        it("counts a defaultValue from the very first render (uncontrolled)", async () => {
            const screen = await render(area({ maxLength: 10, defaultValue: "abc", testId: "t" }));
            await expect.element(screen.getByTestId("t-counter")).toHaveTextContent("3 / 10");
        });

        it("boundary max - 1: one character of room left", async () => {
            const screen = await render(area({ maxLength: 5, testId: "t" }));
            await userEvent.fill(box(screen), "abcd");
            await expect.element(screen.getByTestId("t-counter")).toHaveTextContent("4 / 5");
        });

        it("boundary max: the last allowed character is accepted", async () => {
            const screen = await render(area({ maxLength: 5, testId: "t" }));
            await userEvent.fill(box(screen), "abcde");
            await expect.element(screen.getByTestId("t-counter")).toHaveTextContent("5 / 5");
            expect((await box(screen).element() as HTMLTextAreaElement).value).toBe("abcde");
        });

        it("boundary max + 1: the extra character is refused, the count stops at max", async () => {
            const screen = await render(area({ maxLength: 5, testId: "t" }));
            await userEvent.click(box(screen));
            await userEvent.keyboard("abcdef");
            await expect.element(screen.getByTestId("t-counter")).toHaveTextContent("5 / 5");
            expect((await box(screen).element() as HTMLTextAreaElement).value).toBe("abcde");
        });

        it("turns bold at the limit, so the refused keystroke is explained by more than colour", async () => {
            const screen = await render(area({ maxLength: 5, testId: "t" }));
            const counter = screen.container.querySelector('[data-testid="t-counter"]')!;
            await userEvent.fill(box(screen), "abcd"); // max - 1
            expect(counter.className).not.toContain("font-bold");
            await userEvent.fill(box(screen), "abcde"); // max
            expect(counter.className).toContain("font-bold");
        });

        it("is described-by the textarea so it is read with the field", async () => {
            const screen = await render(area({ maxLength: 5, testId: "t" }));
            const el = await box(screen).element();
            const counter = screen.container.querySelector('[data-testid="t-counter"]')!;
            expect(el.getAttribute("aria-describedby")).toContain(counter.id);
        });

        it("is not a live region — it must not announce on every keystroke", async () => {
            const screen = await render(area({ maxLength: 5, testId: "t" }));
            const counter = screen.container.querySelector('[data-testid="t-counter"]')!;
            expect(counter.getAttribute("aria-live")).toBeNull();
            expect(counter.getAttribute("role")).toBeNull();
        });
    });

    describe("controlled use", () => {
        it("shows the value it is given", async () => {
            const screen = await render(area({ value: "Hola", onChange: () => { } }));
            expect((await box(screen).element() as HTMLTextAreaElement).value).toBe("Hola");
        });

        it("reports each edit through onChange", async () => {
            // Read the value *during* the call: the parent never updates `value`
            // here, so React snaps the live node back to "" straight afterwards.
            const seen: string[] = [];
            const onChange = vi.fn((event: React.ChangeEvent<HTMLTextAreaElement>) => {
                seen.push(event.target.value);
            });
            const screen = await render(area({ value: "", onChange }));
            await userEvent.fill(box(screen), "a");
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(seen).toEqual(["a"]);
        });

        it("counts the value prop, not what was typed, when the parent refuses the edit", async () => {
            const screen = await render(
                area({ value: "abc", onChange: () => { }, maxLength: 10, testId: "t" }),
            );
            await userEvent.click(box(screen));
            await userEvent.keyboard("d");
            // The parent never updated `value`, so React snaps the box back.
            expect((await box(screen).element() as HTMLTextAreaElement).value).toBe("abc");
            await expect.element(screen.getByTestId("t-counter")).toHaveTextContent("3 / 10");
        });

        it("still calls onChange in uncontrolled use", async () => {
            const onChange = vi.fn();
            const screen = await render(area({ onChange }));
            await userEvent.fill(box(screen), "x");
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });

    describe("hint", () => {
        it("is shown and read with the field", async () => {
            const screen = await render(area({ hint: "From 2 to 150 characters", testId: "t" }));
            await expect.element(screen.getByText("From 2 to 150 characters")).toBeVisible();
            const el = await box(screen).element();
            const hint = screen.container.querySelector('[data-testid="t-hint"]')!;
            expect(el.getAttribute("aria-describedby")).toContain(hint.id);
        });

        it("renders nothing when there is no hint", async () => {
            const screen = await render(area({ testId: "t" }));
            expect(screen.container.querySelector('[data-testid="t-hint"]')).toBeNull();
        });
    });

    describe("error", () => {
        it("has no error state by default", async () => {
            const screen = await render(area({ testId: "t" }));
            const el = await box(screen).element();
            expect(el.getAttribute("aria-invalid")).toBeNull();
            expect(screen.container.querySelector('[data-testid="t-error"]')).toBeNull();
        });

        it("marks the field invalid and shows the message", async () => {
            const screen = await render(area({ error: "Add at least 2 characters.", testId: "t" }));
            const el = await box(screen).element();
            expect(el.getAttribute("aria-invalid")).toBe("true");
            await expect.element(screen.getByText("Add at least 2 characters.")).toBeVisible();
        });

        it("ties the message to the field with aria-describedby", async () => {
            const screen = await render(area({ error: "Too short.", testId: "t" }));
            const el = await box(screen).element();
            const message = screen.container.querySelector('[data-testid="t-error"]')!;
            expect(el.getAttribute("aria-describedby")).toContain(message.id);
        });

        it("keeps hint, counter and error all attached at once", async () => {
            const screen = await render(
                area({ hint: "A hint", error: "An error", maxLength: 9, testId: "t" }),
            );
            const described = (await box(screen).element()).getAttribute("aria-describedby") ?? "";
            for (const part of ["hint", "error", "counter"]) {
                const node = screen.container.querySelector(`[data-testid="t-${part}"]`)!;
                expect(described).toContain(node.id);
            }
        });

        it("does not state the problem with colour alone — the message is text", async () => {
            const screen = await render(area({ error: "Too short.", testId: "t" }));
            expect(screen.container.querySelector('[data-testid="t-error"]')!.textContent).toBe(
                "Too short.",
            );
        });

        it("drops the error state once the parent clears the message", async () => {
            const screen = await render(area({ error: "Too short.", testId: "t" }));
            await screen.rerender(area({ testId: "t" }));
            const el = await box(screen).element();
            expect(el.getAttribute("aria-invalid")).toBeNull();
            expect(screen.container.querySelector('[data-testid="t-error"]')).toBeNull();
        });
    });

    describe("pass-through and test hooks", () => {
        it("passes disabled through", async () => {
            const screen = await render(area({ disabled: true }));
            await expect.element(box(screen)).toBeDisabled();
        });

        it("puts data-testid on the textarea, derived ids on its parts", async () => {
            const screen = await render(area({ testId: "service-title-ru", maxLength: 9 }));
            expect(
                screen.container.querySelector('textarea[data-testid="service-title-ru"]'),
            ).not.toBeNull();
            expect(
                screen.container.querySelector('[data-testid="service-title-ru-counter"]'),
            ).not.toBeNull();
        });
    });

    describe("accessibility", () => {
        it("carries the 44px touch-target class and a mint focus affordance", async () => {
            const screen = await render(area());
            // Asserted as classes, not computed size: the browser test project
            // loads no stylesheet, so geometry would always read as unstyled.
            const el = await box(screen).element();
            expect(el.className).toContain("min-h-11");
            expect(el.className).toContain("focus:border-mint");
            // Never `outline: none` without a replacement ring.
            expect(el.className).toContain("focus:ring-mint");
        });

        it("uses on-token shape: card radius, cream surface, ink text", async () => {
            const screen = await render(area());
            const el = await box(screen).element();
            expect(el.className).toContain("rounded-card");
            expect(el.className).toContain("bg-cream");
            expect(el.className).toContain("text-ink");
            expect(el.className).not.toMatch(/rounded-\[|bg-white|text-black/);
        });
    });
});
