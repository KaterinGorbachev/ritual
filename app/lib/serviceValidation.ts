// Checks for a new catalogue service. Shared on purpose: the dashboard form runs
// them to show messages under each field, and the server action runs them again
// before anything reaches Firestore, because a client-side check can be skipped.

/** Service categories, in the order the dashboard select lists them. */
export const SERVICE_TYPES = [
    { label: "Лицо", value: "face" },
    { label: "Тело", value: "body" },
    { label: "Ногти", value: "nails" },
    { label: "Другое", value: "other" },
];

/** The three locales every service text must be entered in. */
export const SERVICE_LANGUAGES = [
    { code: "ru", label: "RU" },
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
] as const;

// Inputs hand back strings, so the draft keeps time and price as typed text;
// they become numbers only once they pass `validateService`.
export type ServiceDraft = {
    nameRU: string; nameEN: string; nameES: string;
    descriptionRU: string; descriptionEN: string; descriptionES: string;
    time: string;
    price: string;
    type: string;
};

/** What is written to Firestore. */
export type ServiceRecord = Omit<ServiceDraft, "time" | "price"> & {
    time: number;
    price: number;
};

/** A catalogue service read back from Firestore, with its document id. */
export type StoredService = ServiceRecord & { id: string };

export type ServiceErrors =Partial<Record<keyof ServiceDraft, string>>;

/** Result of the add-service server action, in the data layer's `{ ok }` shape. */
export type AddServiceResult =
    | { ok: true; message: string }
    | { ok: false; message: string; errors?: ServiceErrors };

export const EMPTY_SERVICE_ITEM: ServiceDraft = {
    nameRU: "", nameEN: "", nameES: "",
    descriptionRU: "", descriptionEN: "", descriptionES: "",
    time: "", price: "",
    type: "face",
};

// Same order as the fields on screen, so the first error is the first field.
export const SERVICE_FIELD_ORDER: (keyof ServiceDraft)[] = [
    "type",
    "nameRU", "nameEN", "nameES",
    "descriptionRU", "descriptionEN", "descriptionES",
    "time", "price",
];

// A server action receives whatever the caller sends, not what the type says.
function asText(value: unknown): string {
    if (typeof value === "number") return String(value);
    return typeof value === "string" ? value : "";
}

function checkText(value: string, min: number, max: number): string | undefined {
    const length = value.trim().length;
    if (length === 0) return "Заполните это поле";
    if (length < min) return `Минимум ${min} символов, сейчас ${length}`;
    if (length > max) return `Максимум ${max} символов, сейчас ${length}`;
    return undefined;
}

function checkNumber(value: string, min: number, max: number, unit: string, maxDecimals: number): string | undefined {
    if (value.trim() === "") return "Заполните это поле";
    const n = Number(value);
    if (!Number.isFinite(n)) return "Введите число";
    if (n < min || n > max) return `Допустимо от ${min} до ${max} ${unit}`;
    const decimals = value.split(".")[1]?.length ?? 0;
    if (decimals > maxDecimals) {
        return maxDecimals === 0 ? "Введите целое число" : `Не больше ${maxDecimals} знаков после запятой`;
    }
    return undefined;
}

/**
 * Human, Russian messages keyed by field. No keys means the item is valid.
 * Takes the form draft (typed strings) or the finished record (numbers), so the
 * server can re-check exactly what the client sent.
 */
export function validateService(item: ServiceDraft | ServiceRecord): ServiceErrors {
    const errors: ServiceErrors = {};
    if (!SERVICE_TYPES.some((o) => o.value === item.type)) errors.type = "Выберите тип услуги";
    for (const { label } of SERVICE_LANGUAGES) {
        errors[`name${label}`] = checkText(asText(item[`name${label}`]), 2, 150);
        errors[`description${label}`] = checkText(asText(item[`description${label}`]), 10, 500);
    }
    errors.time = checkNumber(asText(item.time), 5, 480, "мин", 0);
    errors.price = checkNumber(asText(item.price), 1, 1000, "€", 2);
    return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as ServiceErrors;
}

/**
 * Trimmed texts and real numbers, with only the known keys — anything extra a
 * caller slipped in is dropped. Call only after `validateService` passed.
 */
export function toServiceRecord(item: ServiceDraft | ServiceRecord): ServiceRecord {
    return {
        type: asText(item.type),
        nameRU: asText(item.nameRU).trim(),
        nameEN: asText(item.nameEN).trim(),
        nameES: asText(item.nameES).trim(),
        descriptionRU: asText(item.descriptionRU).trim(),
        descriptionEN: asText(item.descriptionEN).trim(),
        descriptionES: asText(item.descriptionES).trim(),
        time: Number(item.time),
        price: Number(item.price),
    };
}

/** The reverse of `toServiceRecord`: a saved service as form text, to edit it. */
export function toServiceDraft(item: ServiceRecord): ServiceDraft {
    return {
        type: asText(item.type),
        nameRU: asText(item.nameRU),
        nameEN: asText(item.nameEN),
        nameES: asText(item.nameES),
        descriptionRU: asText(item.descriptionRU),
        descriptionEN: asText(item.descriptionEN),
        descriptionES: asText(item.descriptionES),
        time: asText(item.time),
        price: asText(item.price),
    };
}
