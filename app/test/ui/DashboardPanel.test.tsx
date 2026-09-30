import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { DashboardPanel } from "../../ui/DashboardPanel";

type Screen = Awaited<ReturnType<typeof render>>;

/** Fill every required field with valid data. */
async function fillValid(screen: Screen) {
    const say = (id: string, text: string) => userEvent.fill(screen.getByTestId(id), text);
    await say("service-title-ru", "Массаж лица");
    await say("service-title-en", "Facial massage");
    await say("service-title-es", "Masaje facial");
    await say("service-description-ru", "Расслабляющий массаж лица");
    await say("service-description-en", "A relaxing facial massage");
    await say("service-description-es", "Un masaje facial relajante");
    await say("service-duration", "60");
    await say("service-price", "45.50");
}

const submit = (screen: Screen) => userEvent.click(screen.getByTestId("service-submit"));

describe("DashboardPanel — add-service form", () => {
    it("hands the typed values over as one service item", async () => {
        const onAdd = vi.fn();
        const screen = await render(<DashboardPanel onAdd={onAdd} />);
        await fillValid(screen);
        await submit(screen);
        await vi.waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
        expect(onAdd).toHaveBeenCalledWith({
            nameRU: "Массаж лица",
            nameEN: "Facial massage",
            nameES: "Masaje facial",
            descriptionRU: "Расслабляющий массаж лица",
            descriptionEN: "A relaxing facial massage",
            descriptionES: "Un masaje facial relajante",
            time: 60,
            price: 45.5,
            type: "face",
        });
    });

    it("starts on the face category, so a type is always chosen unless cleared", async () => {
        const screen = await render(<DashboardPanel onAdd={() => { }} />);
        await expect.element(screen.getByText("Лицо")).toBeVisible();
    });

    it("hands over the category the user picked", async () => {
        const onAdd = vi.fn();
        const screen = await render(<DashboardPanel onAdd={onAdd} />);
        await fillValid(screen);
        await userEvent.click(screen.getByRole("combobox"));
        await userEvent.click(screen.getByRole("option", { name: "Тело" }));
        // exact: react-select's live region also says "option Тело, selected."
        await expect.element(screen.getByText("Тело", { exact: true })).toBeVisible();
        await submit(screen);
        await vi.waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
        expect(onAdd.mock.calls[0][0].type).toBe("body");
    });

    it("does not send an empty form — the browser stops it on the required fields", async () => {
        const onAdd = vi.fn();
        const screen = await render(<DashboardPanel onAdd={onAdd} />);
        await submit(screen);
        expect(onAdd).not.toHaveBeenCalled();
    });

    it.each([
        ["service-duration", "4", "one minute under the 5 minimum"],
        ["service-duration", "481", "one minute over the 480 maximum"],
        ["service-price", "0.99", "one cent under the 1 € minimum"],
        ["service-price", "1000.01", "one cent over the 1000 € maximum"],
    ])("does not send when %s is %s (%s)", async (id, typed) => {
        const onAdd = vi.fn();
        const screen = await render(<DashboardPanel onAdd={onAdd} />);
        await fillValid(screen);
        await userEvent.fill(screen.getByTestId(id), typed);
        await submit(screen);
        expect(onAdd).not.toHaveBeenCalled();
    });

    it("says so and sends nothing when the category was cleared", async () => {
        const onAdd = vi.fn();
        const screen = await render(<DashboardPanel onAdd={onAdd} />);
        await fillValid(screen);
        await userEvent.click(screen.getByRole("combobox"));
        await userEvent.keyboard("{Backspace}"); // empty search box + Backspace clears the value
        await submit(screen);
        await expect.element(screen.getByRole("alert")).toHaveTextContent("Выберите тип услуги");
        expect(onAdd).not.toHaveBeenCalled();
    });

    it("clears the category message once a category is chosen again", async () => {
        const onAdd = vi.fn();
        const screen = await render(<DashboardPanel onAdd={onAdd} />);
        await fillValid(screen);
        await userEvent.click(screen.getByRole("combobox"));
        await userEvent.keyboard("{Backspace}");
        await submit(screen);
        await expect.element(screen.getByRole("alert")).toBeVisible();
        await userEvent.click(screen.getByRole("combobox"));
        await userEvent.click(screen.getByRole("option", { name: "Ногти" }));
        expect(screen.container.querySelector('[role="alert"]')).toBeNull();
        await submit(screen);
        await vi.waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
        expect(onAdd.mock.calls[0][0].type).toBe("nails");
    });

    it("works with no onAdd supplied yet (nothing to call, nothing breaks)", async () => {
        const screen = await render(<DashboardPanel />);
        await fillValid(screen);
        await expect.element(screen.getByTestId("service-submit")).toBeEnabled();
        await submit(screen);
        await expect.element(screen.getByTestId("service-submit")).toBeVisible();
    });
});

const SAVED = [
    {
        id: "doc-face",
        type: "face",
        nameRU: "Массаж лица", nameEN: "Facial massage", nameES: "Masaje facial",
        descriptionRU: "Расслабляющий массаж лица", descriptionEN: "A relaxing facial massage", descriptionES: "Un masaje facial relajante",
        time: 60,
        price: 45.5,
    },
    {
        id: "doc-body",
        type: "body",
        nameRU: "Массаж спины", nameEN: "Back massage", nameES: "Masaje de espalda",
        descriptionRU: "Глубокий массаж спины", descriptionEN: "A deep back massage", descriptionES: "Un masaje profundo de espalda",
        time: 90,
        price: 70,
    },
];

async function openChangeMenu(screen: Screen) {
    await userEvent.click(screen.getByRole("button", { name: "Изменить", exact: true }));
}

describe("DashboardPanel — change-service form", () => {
    it("shows a card for every saved service", async () => {
        const screen = await render(<DashboardPanel services={SAVED} />);
        await openChangeMenu(screen);
        await expect.element(screen.getByText("Массаж лица")).toBeVisible();
        await expect.element(screen.getByText("Массаж спины")).toBeVisible();
    });

    it("fills every field with the saved values of the chosen service", async () => {
        const screen = await render(<DashboardPanel services={SAVED} />);
        await openChangeMenu(screen);
        await userEvent.click(screen.getByRole("button", { name: "Изменить: Массаж спины" }));
        await expect.element(screen.getByTestId("service-title-ru")).toHaveValue("Массаж спины");
        await expect.element(screen.getByTestId("service-title-en")).toHaveValue("Back massage");
        await expect.element(screen.getByTestId("service-title-es")).toHaveValue("Masaje de espalda");
        await expect.element(screen.getByTestId("service-description-ru")).toHaveValue("Глубокий массаж спины");
        await expect.element(screen.getByTestId("service-description-en")).toHaveValue("A deep back massage");
        await expect.element(screen.getByTestId("service-description-es")).toHaveValue("Un masaje profundo de espalda");
        await expect.element(screen.getByTestId("service-duration")).toHaveValue(90);
        await expect.element(screen.getByTestId("service-price")).toHaveValue(70);
        await expect.element(screen.getByText("Тело", { exact: true })).toBeVisible();
    });

    it("saves the edited item under its own id", async () => {
        const onUpdate = vi.fn();
        const onAdd = vi.fn();
        const screen = await render(<DashboardPanel services={SAVED} onAdd={onAdd} onUpdate={onUpdate} />);
        await openChangeMenu(screen);
        await userEvent.click(screen.getByRole("button", { name: "Изменить: Массаж лица" }));
        await userEvent.fill(screen.getByTestId("service-price"), "50");
        await submit(screen);
        await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
        const { id, ...saved } = SAVED[0];
        expect(onUpdate).toHaveBeenCalledWith(id, { ...saved, price: 50 });
        expect(onAdd).not.toHaveBeenCalled();
    });

    it("finds a service by its name in any language", async () => {
        const screen = await render(<DashboardPanel services={SAVED} />);
        await openChangeMenu(screen);
        await userEvent.fill(screen.getByTestId("service-search"), "back");
        await expect.element(screen.getByText("Массаж спины")).toBeVisible();
        expect(screen.container.textContent).not.toContain("Массаж лица");
    });

    it("says so when no service matches the search", async () => {
        const screen = await render(<DashboardPanel services={SAVED} />);
        await openChangeMenu(screen);
        await userEvent.fill(screen.getByTestId("service-search"), "педикюр");
        await expect.element(screen.getByTestId("service-search-status")).toHaveTextContent("Услуга с таким названием не найдена");
    });
});
