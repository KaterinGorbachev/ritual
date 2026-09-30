import { Section } from "../../ui/Section";
import { DashboardPanel } from "../../ui/DashboardPanel";
import { getDictionary, toLocale } from "../dictionaries";
import { revalidatePath } from "next/cache";
import { getInfo, saveData, updateData, deleteData } from "@/app/lib/handleData";
import {
    toServiceRecord,
    validateService,
    type AddServiceResult,
    type ServiceRecord,
    type StoredService,
} from "@/app/lib/serviceValidation";

/** Result of the delete-service server action, in the data layer's `{ ok }` shape. */
type DeleteServiceResult = { ok: true; message: string } | { ok: false; message: string };

/** Firestore collection the catalogue lives in. */
const SERVICES_TABLE = "services";

// The editor must always show what is in Firestore right now, not a build-time copy.
export const dynamic = "force-dynamic";

/** A raw document from the "services" collection. */
type ServiceDoc = Partial<ServiceRecord> & {
    id: string;
    createdAt?: { toMillis?: () => number };
};

// Rebuild the Services page (new prices show right away) and this page (fresh list).
function refreshCatalogue() {
    revalidatePath("/[lang]/services", "page");
    revalidatePath("/[lang]/dashboard", "page");
}

// Server Function: DashboardPanel (client) calls it, the Firestore write happens here.
// The item is checked again because anything can be posted to a server action.
async function addService(item: ServiceRecord): Promise<AddServiceResult> {
    "use server";
    const errors = validateService(item);
    if (Object.keys(errors).length > 0) {
        return { ok: false, message: "Проверьте поля, отмеченные выше", errors };
    }

    const result = await saveData(toServiceRecord(item), SERVICES_TABLE);
    if (result.ok) refreshCatalogue();
    return result.ok
        ? { ok: true, message: "Услуга добавлена в каталог" }
        : { ok: false, message: result.message };
}

// Server Function: saves the edited fields of one existing service.
async function updateService(id: string, item: ServiceRecord): Promise<AddServiceResult> {
    "use server";
    if (typeof id !== "string" || id.trim() === "") {
        return { ok: false, message: "Не удалось определить услугу. Обновите страницу и выберите её снова" };
    }
    const errors = validateService(item);
    if (Object.keys(errors).length > 0) {
        return { ok: false, message: "Проверьте поля, отмеченные выше", errors };
    }

    const result = await updateData(SERVICES_TABLE, id, toServiceRecord(item));
    if (result.ok) refreshCatalogue();
    return result.ok
        ? { ok: true, message: "Изменения сохранены" }
        : { ok: false, message: result.message };
}

// Server Function: removes one existing service after the user confirms in the dialog.
async function deleteService(id: string): Promise<DeleteServiceResult> {
    "use server";
    if (typeof id !== "string" || id.trim() === "") {
        return { ok: false, message: "Не удалось определить услугу. Обновите страницу и выберите её снова" };
    }

    const result = await deleteData(SERVICES_TABLE, id);
    if (result.ok) refreshCatalogue();
    return result.ok
        ? { ok: true, message: "Услуга удалена из каталога" }
        : { ok: false, message: result.message };
}

export default async function DashboardPage({ params }: PageProps<"/[lang]/dashboard">) {
    const { lang } = await params;
    const locale = toLocale(lang);
    const dict = await getDictionary(locale);
    const page = dict.servicesPage;

    // Oldest first, like the Services page. Only plain fields cross to the
    // client component: toServiceRecord drops the Firestore Timestamp.
    const loaded = await getInfo(SERVICES_TABLE);
    if (!loaded.ok) console.error("DashboardPage: could not load services:", loaded.error);
    const services: StoredService[] = ((loaded.ok ? loaded.data ?? [] : []) as ServiceDoc[])
        .toSorted((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
        .map((doc) => ({ id: doc.id, ...toServiceRecord(doc as ServiceRecord) }));

    return (
        <Section>

            <div className="flex w-full flex-col items-center justify-center bg-cream/89 rounded-pill mb-8 lg:mb-10 ">
                {/* --- Page header: eyebrow, title, description, then the search bar --- */}
                <header className="flex w-full flex-col items-center gap-3 text-center  py-8 px-4 max-w-3xl">
                    <p className="font-handwriting text-3xl leading-none text-magenta"></p>
                    <h1 className="text-balance font-display text-[clamp(2.5rem,7vw,3rem)] font-semibold tracking-wider text-ink">
                        Управление контентом
                    </h1>
                    <button className="font-body font-bold text-base text-mauve tracking-wider px-6 py-3 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-mauve text-ink-60 rounded-pill border-2 cursor-pointer active:ring-magenta active:bg-magenta active:scale-95 hover:bg-mauve hover:text-ink">Выйти</button>


                </header>
            </div>
            {/** main page */}
            <DashboardPanel
                onAdd={addService}
                onUpdate={updateService}
                onDelete={deleteService}
                services={services}
                loadError={loaded.ok ? undefined : "Не удалось загрузить список услуг. Обновите страницу или попробуйте позже"}
            ></DashboardPanel>
            

        </Section>
    )
}