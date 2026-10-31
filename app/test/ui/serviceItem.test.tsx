import { describe, it, expect } from "vitest";
import { serviceFromForm } from "../../lib/serviceItem";

/** A FormData built the way the browser would from the dashboard form. */
const formData = (fields: Record<string, string>) => {
    const data = new FormData();
    for (const [name, value] of Object.entries(fields)) data.set(name, value);
    return data;
};

const FULL = {
    title_ru: "Массаж лица",
    title_en: "Facial massage",
    title_es: "Masaje facial",
    description_ru: "Расслабляющий массаж лица",
    description_en: "A relaxing facial massage",
    description_es: "Un masaje facial relajante",
    duration: "60",
    price: "45.50",
};

describe("serviceFromForm", () => {
    describe("mapping", () => {
        it("maps every form field onto its property", () => {
            expect(serviceFromForm(formData(FULL), "face")).toEqual({
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

        it("takes the type from the argument, not from the form (the select has no name)", () => {
            expect(serviceFromForm(formData(FULL), "body").type).toBe("body");
            expect(serviceFromForm(formData({ ...FULL, type: "nails" }), "body").type).toBe("body");
        });

        it("returns exactly these nine properties and nothing else", () => {
            const item = serviceFromForm(formData({ ...FULL, stray: "x" }), "face");
            expect(Object.keys(item).sort()).toEqual(
                [
                    "descriptionEN", "descriptionES", "descriptionRU",
                    "nameEN", "nameES", "nameRU",
                    "price", "time", "type",
                ].sort(),
            );
        });
    });

    describe("text", () => {
        it("trims the space around what was typed", () => {
            const item = serviceFromForm(formData({ ...FULL, title_ru: "  Массаж лица \n" }), "face");
            expect(item.nameRU).toBe("Массаж лица");
        });

        it("keeps the space inside a sentence and line breaks in the middle of a description", () => {
            const item = serviceFromForm(
                formData({ ...FULL, description_en: "First line.\nSecond  line." }),
                "face",
            );
            expect(item.descriptionEN).toBe("First line.\nSecond  line.");
        });

        it("an empty field is an empty string", () => {
            expect(serviceFromForm(formData({ ...FULL, title_es: "" }), "face").nameES).toBe("");
        });

        it("a field missing from the form is also an empty string, not 'null' or 'undefined'", () => {
            const { title_es: _omitted, ...rest } = FULL;
            expect(serviceFromForm(formData(rest), "face").nameES).toBe("");
        });

        it("a file where text was expected is ignored rather than printed as [object File]", () => {
            const data = formData(FULL);
            data.set("title_ru", new File(["x"], "x.txt"));
            expect(serviceFromForm(data, "face").nameRU).toBe("");
        });
    });

    describe("numbers", () => {
        it.each([
            ["60", 60],
            ["5", 5], // the smallest duration the form allows
            ["480", 480], // the largest
            [" 60 ", 60],
        ])("duration %j becomes the number %d", (typed, expected) => {
            expect(serviceFromForm(formData({ ...FULL, duration: typed }), "face").time).toBe(expected);
        });

        it.each([
            ["45", 45],
            ["45.5", 45.5],
            ["45.50", 45.5],
            ["0.01", 0.01],
            ["1000", 1000],
        ])("price %j becomes the number %d", (typed, expected) => {
            expect(serviceFromForm(formData({ ...FULL, price: typed }), "face").price).toBe(expected);
        });

        it("an empty number is NaN — never a silent 0, which would be a free service", () => {
            const item = serviceFromForm(formData({ ...FULL, price: "", duration: "" }), "face");
            expect(item.price).toBeNaN();
            expect(item.time).toBeNaN();
        });

        it("a missing number is NaN too", () => {
            const { price: _omitted, ...rest } = FULL;
            expect(serviceFromForm(formData(rest), "face").price).toBeNaN();
        });

        it("something that is not a number is NaN", () => {
            expect(serviceFromForm(formData({ ...FULL, price: "abc" }), "face").price).toBeNaN();
        });
    });
});
