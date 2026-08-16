import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "vitest-browser-react";

// Registration tests for app/ui/ModelContextTools.tsx.
//
// The tool *logic* is pure and covered in webmcp.db.test.tsx. What can only be
// checked by rendering is the registration contract itself: that every tool
// reaches document.modelContext, carries the annotations an agent relies on to
// decide whether to confirm with the user, and is withdrawn on unmount.
//
// document.modelContext is stubbed — no browser ships it by default, and the
// point is to observe exactly what the page hands the agent.

const push = vi.fn();
const chooseLocale = vi.fn();

vi.mock("next/navigation", () => ({
  default: {},
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/en",
}));

// chooseLocale writes the ritual:lang cookie. Mocked so the test can assert the
// tool persisted the choice, without touching document.cookie.
vi.mock("../../store/localeStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../store/localeStore")>();
  return {
    ...actual,
    useLocaleStore: Object.assign(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({ locale: "en", chooseLocale, setLocaleFromUrl: vi.fn() }),
      { getState: () => ({ locale: "en", chooseLocale }) },
    ),
  };
});

import { cleanupWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";
import { ModelContextTools } from "../../ui/ModelContextTools";
import { toContactFacts } from "../../lib/contactFacts";
import en from "../../[lang]/dictionaries/en.json";

/** The facts the layout parses on the server and passes straight down. */
const FACTS = toContactFacts([
  { id: "address", location: "Carrer de Sant Vicent Màrtir 12", coordinates: "39.4720, -0.3759" },
  { id: "workingHours", from: "10", to: "20", dayStart: "monday", dayEnd: "saturday" },
  { id: "messanger", telephone: "+34643987849" },
]);

// usewebmcp wraps our execute() in an MCP envelope before registering it, so
// what comes back is { content: [{ type: "text", text }], structuredContent }.
// structuredContent is the value our function actually returned.
type RegisteredTool = {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<{
    content: { type: string; text: string }[];
    structuredContent?: unknown;
    isError?: boolean;
  }>;
};

/** Call a registered tool and hand back what our own function returned. */
async function callTool<T>(tool: RegisteredTool, input: Record<string, unknown> = {}) {
  const result = await tool.execute(input);
  return (result.structuredContent ?? result) as T;
}

const home = JSON.parse(
  JSON.stringify({
    hero: en.hero,
    aboutStaff: en.aboutStaff,
    topServices: en.topServices,
    staff: en.staff,
    cosmetics: en.cosmetics,
    reviews: en.reviews,
    nav: en.nav,
    footer: en.footer,
    daysOfWeek: en.daysOfWeek,
    languagesSpoken: en.seo.languagesSpoken,
  }),
);

const registerTool = vi.fn();

/**
 * Render and hand back the tools that reached document.modelContext.
 *
 * usewebmcp registers inside an effect, so the tools do not exist synchronously
 * after render() — vi.waitFor is what lets the effects flush first.
 */
async function renderTools() {
  registerTool.mockClear();
  const result = render(<ModelContextTools home={home} locale="en" contact={FACTS} />);
  await vi.waitFor(() => expect(registerTool).toHaveBeenCalled());
  const tools = registerTool.mock.calls.map(([tool]) => tool as RegisteredTool);
  return { ...result, tools };
}

const byName = (tools: RegisteredTool[], name: string) =>
  tools.find((tool) => tool.name === name)!;

beforeEach(() => {
  push.mockClear();
  chooseLocale.mockClear();

  Object.defineProperty(document, "modelContext", {
    value: { registerTool },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  // The polyfill tracks whether it has installed in module-level state, so a
  // test that leaves it installed makes the next one a no-op. Reset both.
  cleanupWebMCPPolyfill();
  Reflect.deleteProperty(document, "modelContext");
});

describe("ModelContextTools", () => {
  it("registers every tool with document.modelContext", async () => {
    const { tools } = await renderTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual(
      [
        "findUs",
        "getAboutSalon",
        "getContactDetails",
        "getServiceDetails",
        "getSpokenLanguages",
        "getWorkingHours",
        "howToBook",
        "listClientReviews",
        "listCosmeticBrands",
        "listTeamMembers",
        "listTopServices",
        "scrollToSection",
        "switchLanguage",
      ].sort(),
    );
  });

  it("registers each tool exactly once", async () => {
    // Regression: locale and contact were read from their Zustand stores, which
    // start empty and fill in during hydration. Every dep change re-registers,
    // so each tool arrived twice — once carrying placeholder data. Both values
    // are props now, correct from the first render.
    const { tools } = await renderTools();

    const counts = new Map<string, number>();
    for (const tool of tools) counts.set(tool.name, (counts.get(tool.name) ?? 0) + 1);

    expect([...counts].filter(([, count]) => count > 1)).toEqual([]);
  });

  it("marks the information tools read-only so an agent need not interrupt", async () => {
    const { tools } = await renderTools();

    const readOnly = tools.filter((tool) => tool.annotations?.readOnlyHint === true);
    expect(readOnly).toHaveLength(11);
  });

  it("marks the navigation tools as changing state", async () => {
    const { tools } = await renderTools();

    for (const name of ["switchLanguage", "scrollToSection"]) {
      expect(byName(tools, name).annotations?.readOnlyHint).toBe(false);
    }
  });

  it("flags reviews as untrusted content", async () => {
    // Testimonials are written by other people. The hint tells the agent to
    // treat them as data to report, never as instructions to follow.
    const { tools } = await renderTools();

    expect(byName(tools, "listClientReviews").annotations?.untrustedContentHint).toBe(true);
  });

  it("keeps every description inside the 500-character budget", async () => {
    const { tools } = await renderTools();

    for (const tool of tools) {
      expect(tool.description.length, tool.name).toBeLessThanOrEqual(500);
      expect(tool.name.length).toBeLessThanOrEqual(30);
    }
  });

  it("withdraws the tools when the page unmounts", async () => {
    // usewebmcp registers with an AbortSignal and aborts it on unmount; if the
    // signal were missing, tools would outlive the page that answers them.
    await renderTools();

    const [, options] = registerTool.mock.calls[0];
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal.aborted).toBe(false);
  });

  describe("switchLanguage", () => {
    it("writes the cookie and navigates, keeping the current path", async () => {
      const { tools } = await renderTools();

      const result = await callTool<{ ok: boolean }>(byName(tools, "switchLanguage"), {
        language: "ru",
      });

      expect(result.ok).toBe(true);
      expect(chooseLocale).toHaveBeenCalledWith("ru");
      expect(push).toHaveBeenCalledWith("/ru");
    });

    it("refuses a language the site is not built in", async () => {
      const { tools } = await renderTools();

      const result = await callTool<{ ok: boolean }>(byName(tools, "switchLanguage"), {
        language: "de",
      });

      expect(result.ok).toBe(false);
      expect(push).not.toHaveBeenCalled();
      expect(chooseLocale).not.toHaveBeenCalled();
    });

    it("never navigates to a javascript: URL", async () => {
      // router.push executes javascript: URLs in page context, and tool
      // arguments are attacker-influenceable through prompt injection.
      const { tools } = await renderTools();

      await callTool(byName(tools, "switchLanguage"), { language: "javascript:alert(1)" });

      expect(push).not.toHaveBeenCalled();
    });
  });

  describe("scrollToSection", () => {
    it("scrolls the requested section into view", async () => {
      const scrollIntoView = vi.fn();
      const section = document.createElement("div");
      section.id = "reviews";
      section.scrollIntoView = scrollIntoView;
      document.body.append(section);

      const { tools } = await renderTools();
      const result = await callTool<{ ok: boolean }>(byName(tools, "scrollToSection"), {
        section: "reviews",
      });

      expect(result.ok).toBe(true);
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

      section.remove();
    });

    it("says so when the section is not on this page", async () => {
      // The tools are registered site-wide, but these ids only exist at home.
      const { tools } = await renderTools();

      const result = await callTool<{ ok: boolean; message: string }>(
        byName(tools, "scrollToSection"),
        { section: "reviews" },
      );

      expect(result.ok).toBe(false);
      expect(result.message).toMatch(/home page/);
    });

    it("refuses a section name that is not one of ours", async () => {
      const { tools } = await renderTools();

      const result = await callTool<{ ok: boolean }>(byName(tools, "scrollToSection"), {
        section: "__proto__",
      });

      expect(result.ok).toBe(false);
    });
  });

  it("answers from the contact store the layout seeded", async () => {
    const { tools } = await renderTools();

    const hours = await callTool<{ hours: string }>(byName(tools, "getWorkingHours"));
    expect(hours.hours).toContain("Monday");

    const contact = await callTool<{ whatsApp: string }>(byName(tools, "getContactDetails"));
    expect(contact.whatsApp).toBe("+34643987849");
  });
});

describe("on a browser without native WebMCP", () => {
  it("polyfills document.modelContext and still registers", async () => {
    // No stable browser ships document.modelContext yet — Chrome exposes it
    // only behind a flag, and not in every build. Removing the stub here leaves
    // the component in the position a real visitor is in, so what this asserts
    // is that the polyfill installs the API and the tools arrive anyway.
    Reflect.deleteProperty(document, "modelContext");
    registerTool.mockClear();

    expect(() =>
      render(<ModelContextTools home={home} locale="en" contact={FACTS} />),
    ).not.toThrow();

    await vi.waitFor(() => expect(document.modelContext).toBeDefined());

    const tools = await document.modelContext!.getTools();
    expect(tools.length).toBeGreaterThan(0);

    // The stub took no calls: registration went to the polyfill, not to us.
    expect(registerTool).not.toHaveBeenCalled();
  });

  it("leaves a native implementation alone when one exists", async () => {
    // beforeEach installs the stub, standing in for real Chrome. The polyfill
    // must not replace it — a browser's own implementation is the one an agent
    // is actually connected to.
    const native = document.modelContext;

    const { tools } = await renderTools();

    expect(document.modelContext).toBe(native);
    expect(tools).toHaveLength(13);
  });
});
