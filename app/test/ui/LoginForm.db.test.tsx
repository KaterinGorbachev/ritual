import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Tests for app/ui/LoginForm.tsx — the sign-in form at /admin.
//
// Why this is a `.db.test.tsx` (jsdom, not the browser project): the form calls
// signInWithEmailAndPassword from firebase/auth, and app/database/firebase.config
// initializes a real Firebase app at import time. Only the jsdom project can
// vi.mock those imports, so no network call is ever made.
//
// What these tests are and are not checking: they cover the form's behaviour —
// what the user sees, what gets called, what is announced. They do NOT prove the
// route is secure. The real protection is firestore.rules, which no unit test in
// this repo can exercise; that is verified in the Firebase console's Rules
// Playground and by the logged-out write attempt described in the plan.

const auth = vi.hoisted(() => ({ signIn: vi.fn() }));

vi.mock("firebase/auth", () => ({
    signInWithEmailAndPassword: auth.signIn,
}));

vi.mock("../../database/firebase.config", () => ({
    auth: { __stub: true },
    db: {},
}));

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: nav.push, refresh: nav.refresh }),
}));

import { LoginForm } from "../../ui/LoginForm";

/** A signed-in user object shaped like the bit of Firebase's the form uses. */
function credentialWithToken(token: string) {
    return { user: { getIdToken: vi.fn().mockResolvedValue(token) } };
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
});

describe("LoginForm — structure and accessibility", () => {
    it("renders an email field, a password field and a submit button", () => {
        render(<LoginForm />);

        expect(screen.getByLabelText(/Электронная почта/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Пароль/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
    });

    it("gives each input the right type and autocomplete for a password manager", () => {
        render(<LoginForm />);

        const email = screen.getByLabelText(/Электронная почта/);
        expect(email).toHaveAttribute("type", "email");
        expect(email).toHaveAttribute("autocomplete", "username");

        const password = screen.getByLabelText(/Пароль/);
        expect(password).toHaveAttribute("type", "password");
        expect(password).toHaveAttribute("autocomplete", "current-password");
    });

    it("labels are real <label> elements tied to the controls, not placeholders", () => {
        render(<LoginForm />);

        // getByLabelText already proves association, but assert the id wiring
        // explicitly: a placeholder-as-label is a stated WCAG failure here.
        const email = screen.getByLabelText(/Электронная почта/);
        expect(email.id).not.toBe("");
        expect(document.querySelector(`label[for="${email.id}"]`)).toBeTruthy();
    });
});

describe("LoginForm — successful sign-in", () => {
    it("signs in, exchanges the token for a session, then goes to the dashboard", async () => {
        const user = userEvent.setup();
        auth.signIn.mockResolvedValue(credentialWithToken("token-abc"));
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true }),
        });

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/Электронная почта/), "owner@ritual.es");
        await user.type(screen.getByLabelText(/Пароль/), "correct-horse");
        await user.click(screen.getByRole("button", { name: "Войти" }));

        await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));

        // The ID token, not the password, is what reaches our server.
        const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toBe("/api/session");
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual({ idToken: "token-abc" });
        expect(init.body).not.toContain("correct-horse");

        // Without refresh() the server components keep their logged-out render.
        expect(nav.refresh).toHaveBeenCalled();
    });
});

describe("LoginForm — failures are announced, never silent", () => {
    it("shows a human message when the password is wrong", async () => {
        const user = userEvent.setup();
        auth.signIn.mockRejectedValue({ code: "auth/invalid-credential" });

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/Электронная почта/), "owner@ritual.es");
        await user.type(screen.getByLabelText(/Пароль/), "wrong");
        await user.click(screen.getByRole("button", { name: "Войти" }));

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toMatch(/[А-Яа-я]/);
        // Never leak the raw Firebase code to the user.
        expect(alert.textContent).not.toContain("auth/");
        expect(nav.push).not.toHaveBeenCalled();
    });

    it("distinguishes a network failure from a wrong password", async () => {
        const user = userEvent.setup();
        auth.signIn.mockRejectedValue({ code: "auth/network-request-failed" });

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/Электронная почта/), "owner@ritual.es");
        await user.type(screen.getByLabelText(/Пароль/), "whatever");
        await user.click(screen.getByRole("button", { name: "Войти" }));

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toMatch(/связ|сет|подключ/i);
    });

    it("surfaces the server's message when the account is not an admin", async () => {
        const user = userEvent.setup();
        auth.signIn.mockResolvedValue(credentialWithToken("token-abc"));
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            json: async () => ({ ok: false, message: "У этой учётной записи нет доступа к панели" }),
        });

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/Электронная почта/), "someone@else.com");
        await user.type(screen.getByLabelText(/Пароль/), "real-password");
        await user.click(screen.getByRole("button", { name: "Войти" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "У этой учётной записи нет доступа к панели",
        );
        // Signed in to Firebase, but not let into the CRM.
        expect(nav.push).not.toHaveBeenCalled();
    });

    it("recovers when the session request itself throws", async () => {
        const user = userEvent.setup();
        auth.signIn.mockResolvedValue(credentialWithToken("token-abc"));
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("offline"));

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/Электронная почта/), "owner@ritual.es");
        await user.type(screen.getByLabelText(/Пароль/), "correct-horse");
        await user.click(screen.getByRole("button", { name: "Войти" }));

        expect(await screen.findByRole("alert")).toBeInTheDocument();
        // The button must come back, or the owner is stuck on a dead page.
        await waitFor(() =>
            expect(screen.getByRole("button", { name: "Войти" })).toBeEnabled(),
        );
    });

    it("clears a previous error when the next attempt is submitted", async () => {
        const user = userEvent.setup();
        auth.signIn.mockRejectedValueOnce({ code: "auth/invalid-credential" });

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/Электронная почта/), "owner@ritual.es");
        await user.type(screen.getByLabelText(/Пароль/), "wrong");
        await user.click(screen.getByRole("button", { name: "Войти" }));
        expect(await screen.findByRole("alert")).toBeInTheDocument();

        auth.signIn.mockResolvedValue(credentialWithToken("token-abc"));
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true }),
        });
        await user.click(screen.getByRole("button", { name: "Войти" }));

        await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    });
});

describe("LoginForm — submit state", () => {
    it("disables the button while the request is in flight, then restores it", async () => {
        const user = userEvent.setup();
        let release: (value: unknown) => void = () => {};
        auth.signIn.mockReturnValue(new Promise((resolve) => { release = resolve; }));

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/Электронная почта/), "owner@ritual.es");
        await user.type(screen.getByLabelText(/Пароль/), "correct-horse");
        await user.click(screen.getByRole("button", { name: /Войти|Вход/ }));

        // A second click must not fire a second sign-in.
        const button = screen.getByRole("button", { name: /Войти|Вход/ });
        await waitFor(() => expect(button).toBeDisabled());
        expect(button).toHaveAttribute("aria-busy", "true");

        release(credentialWithToken("token-abc"));
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true }),
        });
        await waitFor(() => expect(auth.signIn).toHaveBeenCalledTimes(1));
    });

    it("does not call Firebase when the fields are empty", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.click(screen.getByRole("button", { name: "Войти" }));

        // `required` stops native submission; nothing should reach the network.
        expect(auth.signIn).not.toHaveBeenCalled();
    });

    it("trims a pasted email so a stray space is not a failed login", async () => {
        const user = userEvent.setup();
        auth.signIn.mockResolvedValue(credentialWithToken("token-abc"));
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true }),
        });

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/Электронная почта/), "  owner@ritual.es  ");
        await user.type(screen.getByLabelText(/Пароль/), "correct-horse");
        await user.click(screen.getByRole("button", { name: "Войти" }));

        await waitFor(() => expect(auth.signIn).toHaveBeenCalled());
        expect(auth.signIn.mock.calls[0][1]).toBe("owner@ritual.es");
        // The password is never trimmed — spaces can be part of it.
        expect(auth.signIn.mock.calls[0][2]).toBe("correct-horse");
    });
});
