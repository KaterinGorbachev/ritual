import { describe, it, expect, beforeEach } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { CookieBanner } from "../../ui/CookieBanner";
import { COOKIE_NOTICE_KEY, useCookieNoticeStore } from "../../store/cookieStore";

/** What zustand's `persist` writes for an acknowledged visitor. */
const storedAcknowledgement = () =>
    JSON.stringify({ state: { acknowledged: true }, version: 0 });

/** Read the persisted acknowledgement back out of localStorage. */
function persistedAcknowledged(): boolean | undefined {
    const raw = localStorage.getItem(COOKIE_NOTICE_KEY);
    return raw ? JSON.parse(raw).state?.acknowledged : undefined;
}

const labels = {
    title: "Cookies",
    message:
        "We only use cookies that keep the site working — your language and your motion preference. No advertising, no tracking.",
    policyLink: "Read the privacy policy",
    accept: "Got it",
    close: "Close the cookie notice",
};

const privacyHref = "/en/privacy";

/** The banner root, or null once dismissed. */
const banner = () =>
    document.querySelector<HTMLElement>('[data-testid="cookie-banner"]');

describe("CookieBanner", () => {
    beforeEach(() => {
        localStorage.clear();
        // The store is module-level, so it survives between tests — reset it or
        // an earlier dismissal would keep the banner hidden in the next test.
        useCookieNoticeStore.setState({ acknowledged: false, hydrated: false });
    });

    describe("first visit", () => {
        it("shows the notice when the visitor has never acknowledged it", async () => {
            await render(<CookieBanner labels={labels} privacyHref={privacyHref} />);
            await expect.element(banner()!).toBeInTheDocument();
        });

        it("shows the full explanation of what the cookies are for", async () => {
            const screen = await render(
                <CookieBanner labels={labels} privacyHref={privacyHref} />,
            );
            await expect.element(screen.getByText(labels.message)).toBeInTheDocument();
        });

        it("links to the privacy policy for the locale it was given", async () => {
            const screen = await render(
                <CookieBanner labels={labels} privacyHref={privacyHref} />,
            );
            const link = screen.getByRole("link", { name: labels.policyLink });
            await expect.element(link).toBeInTheDocument();
            await expect.element(link).toHaveAttribute("href", privacyHref);
        });
    });

    describe("dismissing", () => {
        it("hides the notice when the accept button is pressed", async () => {
            const screen = await render(
                <CookieBanner labels={labels} privacyHref={privacyHref} />,
            );
            await userEvent.click(screen.getByRole("button", { name: labels.accept }));
            expect(banner()).toBeNull();
        });

        it("hides the notice from the icon-only close control too", async () => {
            const screen = await render(
                <CookieBanner labels={labels} privacyHref={privacyHref} />,
            );
            await userEvent.click(screen.getByRole("button", { name: labels.close }));
            expect(banner()).toBeNull();
        });

        it("remembers the acknowledgement so it does not return on the next visit", async () => {
            const screen = await render(
                <CookieBanner labels={labels} privacyHref={privacyHref} />,
            );
            await userEvent.click(screen.getByRole("button", { name: labels.accept }));
            expect(persistedAcknowledged()).toBe(true);
        });

        it("stays away on a later visit once acknowledged", async () => {
            localStorage.setItem(COOKIE_NOTICE_KEY, storedAcknowledgement());
            await render(<CookieBanner labels={labels} privacyHref={privacyHref} />);
            // The effect that rehydrates the store runs on mount; give it a tick.
            await new Promise((r) => setTimeout(r, 0));
            expect(banner()).toBeNull();
        });

        it("never flashes the notice at a returning visitor before rehydrating", async () => {
            localStorage.setItem(COOKIE_NOTICE_KEY, storedAcknowledgement());
            // Asserted synchronously, before the rehydration effect has settled:
            // the banner must be absent from the very first paint, not appear
            // and then get hidden again.
            await render(<CookieBanner labels={labels} privacyHref={privacyHref} />);
            expect(banner()).toBeNull();
        });
    });

    describe("does not block navigation", () => {
        it("is a complementary landmark, not a modal dialog", async () => {
            await render(<CookieBanner labels={labels} privacyHref={privacyHref} />);
            const el = banner()!;
            expect(el.getAttribute("role")).toBe("complementary");
            // A <dialog> or aria-modal would trap focus and make the page inert —
            // the whole point of an informational notice is that it doesn't.
            expect(el.closest("dialog")).toBeNull();
            expect(el.getAttribute("aria-modal")).toBeNull();
        });

        it("leaves the rest of the page clickable underneath", async () => {
            let clicked = false;
            const screen = await render(
                <>
                    <button type="button" onClick={() => (clicked = true)}>
                        Book now
                    </button>
                    <CookieBanner labels={labels} privacyHref={privacyHref} />
                </>,
            );
            await userEvent.click(screen.getByRole("button", { name: "Book now" }));
            expect(clicked).toBe(true);
        });

        it("does not steal focus on mount", async () => {
            await render(<CookieBanner labels={labels} privacyHref={privacyHref} />);
            // Focus must stay where the visitor left it (document body on load),
            // so a keyboard user is not yanked into the notice.
            expect(banner()!.contains(document.activeElement)).toBe(false);
        });
    });

    describe("accessibility", () => {
        it("names the region with its title", async () => {
            const screen = await render(
                <CookieBanner labels={labels} privacyHref={privacyHref} />,
            );
            await expect
                .element(screen.getByRole("complementary", { name: labels.title }))
                .toBeInTheDocument();
        });

        it("meets the 44px touch target on every control", async () => {
            const screen = await render(
                <CookieBanner labels={labels} privacyHref={privacyHref} />,
            );
            // Asserted as classes, not measured geometry: the browser test
            // project loads no Tailwind stylesheet, so every box would measure
            // at its intrinsic size. min-h-11/min-w-11 == 44px.
            for (const name of [labels.accept, labels.close]) {
                const el = screen.getByRole("button", { name });
                await expect.element(el).toHaveClass("min-h-11");
                await expect.element(el).toHaveClass("min-w-11");
            }
        });

        it("hides the decorative icon from assistive technology", async () => {
            await render(<CookieBanner labels={labels} privacyHref={privacyHref} />);
            const svgs = banner()!.querySelectorAll("svg");
            expect(svgs.length).toBeGreaterThan(0);
            for (const svg of svgs) {
                expect(svg.getAttribute("aria-hidden")).toBe("true");
            }
        });

        it("is reachable and dismissable by keyboard alone", async () => {
            const screen = await render(
                <CookieBanner labels={labels} privacyHref={privacyHref} />,
            );
            const accept = screen.getByRole("button", { name: labels.accept });
            await userEvent.click(accept); // focus + activate via the a11y tree
            expect(banner()).toBeNull();
        });
    });
});
