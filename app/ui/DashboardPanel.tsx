"use client";
import { useEffect, useRef, useState } from "react";
import { TextArea } from "./TextArea";
import { NumberInput } from "./NumberInput";
import { SelectCategory } from "./SelectCategory";
import {
  EMPTY_SERVICE_ITEM,
  SERVICE_FIELD_ORDER,
  SERVICE_LANGUAGES as LANGUAGES,
  SERVICE_TYPES as options,
  toServiceDraft,
  toServiceRecord,
  validateService,
  type AddServiceResult,
  type ServiceDraft,
  type ServiceErrors,
  type ServiceRecord,
  type StoredService,
} from "../lib/serviceValidation";
import { HorizontalGallery } from "./HorizontalGallery";
import { ServiceItemCard } from "./ServiceItemCard";
import { Modal } from "./Modal";
import { getInfo, saveData, updateData, deleteData } from "../lib/handleData";

type Menu = "add" | "change" | "delete";

/** Which saved service the edit form is open for, if any. */
type ChangeService = { state: "open"; id: string } | { state: "close" };

/** Which saved service the delete confirmation dialog is open for, if any. */
type DeleteTarget = { state: "open"; id: string; name: string } | { state: "close" };

/** Result of the delete server action, in the data layer's `{ ok }` shape. */
type DeleteServiceResult = { ok: true; message: string } | { ok: false; message: string };

const priceFormat = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "EUR",
  trailingZeroDisplay: "stripIfInteger",
});

type SaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

/** Firestore collection the catalogue lives in. */
const SERVICES_TABLE = "services";

/** A raw document from the "services" collection. */
type ServiceDoc = Partial<ServiceRecord> & {
  id: string;
  createdAt?: { toMillis?: () => number };
};

/**
 * What to say when Firestore refuses a write.
 *
 * `permission-denied` here almost always means the session expired rather than
 * that the owner lacks rights, so the message says what to do about it. The
 * data layer's own Spanish string would be wrong in this Russian panel.
 */
function messageForWriteError(result: { code?: string; message?: string }) {
  if (result.code === "permission-denied") {
    return "Нет прав на это действие. Возможно, сеанс истёк — войдите заново";
  }
  return result.message ?? "Не удалось сохранить изменения. Попробуйте ещё раз";
}

type DashboardPanelProps = {
  /**
   * Overrides the built-in Firestore write. Present so tests can inject a spy;
   * in the app this is left undefined and the default below is used.
   */
  onAdd?: (
    item: ServiceRecord,
  ) => Promise<AddServiceResult | void> | AddServiceResult | void;
  /** Overrides the built-in update. See `onAdd`. */
  onUpdate?: (
    id: string,
    item: ServiceRecord,
  ) => Promise<AddServiceResult | void> | AddServiceResult | void;
  /** Overrides the built-in delete. See `onAdd`. */
  onDelete?: (
    id: string,
  ) => Promise<DeleteServiceResult | void> | DeleteServiceResult | void;
  /**
   * The catalogue. When omitted the panel loads it itself, as the signed-in
   * admin — which is the real path; passing it is for tests.
   */
  services?: StoredService[];
  /** Human message when the catalogue could not be loaded. */
  loadError?: string;
  /** Server action that revalidates the public Services page after a write. */
  onSaved?: () => void | Promise<void>;
};

/**
 * The CMS panel: add, edit and delete services.
 *
 * ## Why this component talks to Firestore directly
 *
 * It used to receive three server actions as props. Those ran on the Node
 * server, where the Firebase client SDK has no signed-in user, so every write
 * reached Firestore anonymously — and for them to work at all, the security
 * rules had to permit anonymous writes to `services`.
 *
 * Here in the browser the owner's Firebase identity is real, so
 * `firestore.rules` can require `/admins/{uid}` and enforce it itself. A write
 * from anyone else is rejected by the database, not by code.
 *
 * The props survive as optional overrides so the existing tests can inject
 * spies without a Firestore mock.
 */
export function DashboardPanel({
  onAdd,
  onUpdate,
  onDelete,
  services: servicesProp,
  loadError: loadErrorProp,
  onSaved,
}: DashboardPanelProps) {
  // When the caller supplies a catalogue (tests), use it as-is and never fetch.
  const isControlled = servicesProp !== undefined;
  const [loaded, setLoaded] = useState<StoredService[]>([]);
  const [loadFailure, setLoadFailure] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const services = isControlled ? servicesProp : loaded;
  const loadError = isControlled ? loadErrorProp : loadFailure;

  useEffect(() => {
    if (isControlled) return;
    let active = true;

    (async () => {
      const result = await getInfo(SERVICES_TABLE);
      if (!active) return;

      if (!result.ok) {
        console.error("DashboardPanel: could not load services:", result.error);
        setLoadFailure(
          "Не удалось загрузить список услуг. Обновите страницу или попробуйте позже",
        );
        return;
      }

      setLoadFailure(undefined);
      // Oldest first, like the Services page. Only plain fields are kept:
      // toServiceRecord drops the Firestore Timestamp, which cannot be
      // rendered directly.
      setLoaded(
        ((result.data ?? []) as ServiceDoc[])
          .toSorted(
            (a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0),
          )
          .map((doc) => ({ id: doc.id, ...toServiceRecord(doc as ServiceRecord) })),
      );
    })();

    return () => {
      active = false;
    };
  }, [isControlled, reloadKey]);

  /** Re-read the catalogue and refresh the public page after a write. */
  async function afterWrite() {
    setReloadKey((n) => n + 1);
    try {
      await onSaved?.();
    } catch (error) {
      // A failed revalidate means the public page is briefly stale — worth
      // logging, but not worth telling the owner their save failed.
      console.error("DashboardPanel: could not revalidate:", error);
    }
  }

  // Default handlers: the real write path, running as the signed-in admin.
  const addService =
    onAdd ??
    (async (item: ServiceRecord): Promise<AddServiceResult> => {
      const result = await saveData(toServiceRecord(item), SERVICES_TABLE);
      if (!result.ok) return { ok: false, message: messageForWriteError(result) };
      await afterWrite();
      return { ok: true, message: "Услуга добавлена в каталог" };
    });

  const updateService =
    onUpdate ??
    (async (id: string, item: ServiceRecord): Promise<AddServiceResult> => {
      const result = await updateData(SERVICES_TABLE, id, toServiceRecord(item));
      if (!result.ok) return { ok: false, message: messageForWriteError(result) };
      await afterWrite();
      return { ok: true, message: "Изменения сохранены" };
    });

  const deleteService =
    onDelete ??
    (async (id: string): Promise<DeleteServiceResult> => {
      const result = await deleteData(SERVICES_TABLE, id);
      if (!result.ok) return { ok: false, message: messageForWriteError(result) };
      await afterWrite();
      return { ok: true, message: "Услуга удалена из каталога" };
    });

  const [selected, setSelected] = useState<Menu>("add");
  const [toChange, setToChange] = useState<ChangeService>({ state: "close" });
  const [toDelete, setToDelete] = useState<DeleteTarget>({ state: "close" });
  const [newServiceItem, setNewServiceItem] =
    useState<ServiceDraft>(EMPTY_SERVICE_ITEM);
  const [editServiceItem, setEditServiceItem] =
    useState<ServiceDraft>(EMPTY_SERVICE_ITEM);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<ServiceErrors>({});
  const [status, setStatus] = useState<SaveStatus>({ state: "idle" });
  const [deleteStatus, setDeleteStatus] = useState<SaveStatus>({ state: "idle" });
  const editHeadingRef = useRef<HTMLHeadingElement>(null);

  // Both forms share the handlers below; the open menu decides which draft they fill.
  const isEdit = selected === "change";
  const draft = isEdit ? editServiceItem : newServiceItem;
  const setDraft = isEdit ? setEditServiceItem : setNewServiceItem;
  const uiValue = options.find((o) => o.value === draft.type) ?? null;

  // Search by name in any of the three languages.
  const query = search.trim().toLocaleLowerCase();
  const foundServices = query
    ? services.filter((s) =>
        [s.nameRU, s.nameEN, s.nameES].some((name) =>
          name.toLocaleLowerCase().includes(query),
        ),
      )
    : services;

  // When the edit form opens, move focus to it so keyboard and screen-reader
  // users know it appeared below the gallery.
  const editingId = toChange.state === "open" ? toChange.id : null;
  useEffect(() => {
    if (editingId) editHeadingRef.current?.focus();
  }, [editingId]);

  // The forms share errors and the save message, so each menu starts clean.
  function selectMenu(menu: Menu) {
    if (menu === selected) return;
    setSelected(menu);
    setErrors({});
    setStatus({ state: "idle" });
  }

  // Fill every field of the edit form with the saved values of that service.
  function openEdit(service: StoredService) {
    setEditServiceItem(toServiceDraft(service));
    setErrors({});
    setStatus({ state: "idle" });
    setToChange({ state: "open", id: service.id });
  }

  // Opens the confirmation dialog instead of deleting right away.
  function openDeleteConfirm(service: StoredService) {
    setDeleteStatus({ state: "idle" });
    setToDelete({ state: "open", id: service.id, name: service.nameRU });
  }

  function closeDeleteConfirm() {
    setToDelete({ state: "close" });
  }

  async function confirmDelete() {
    if (toDelete.state !== "open") return;
    const id = toDelete.id;
    setDeleteStatus({ state: "saving" });
    let result: DeleteServiceResult | void;
    try {
      result = await deleteService(id);
    } catch {
      // onDelete itself never throws; this is the network or server being down.
      result = {
        ok: false,
        message:
          "Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз",
      };
    }

    if (!result || result.ok) {
      setToDelete({ state: "close" });
      setDeleteStatus({ state: "idle" });
    } else {
      setDeleteStatus({ state: "error", message: result.message });
    }
  }

  function updateField(name: keyof ServiceDraft, value: string) {
    setDraft((prev) => ({ ...prev, [name]: value }));
    // Clear the message as soon as the field is touched again.
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    if (status.state === "success" || status.state === "error")
      setStatus({ state: "idle" });
  }

  // One handler for every text and number field. The input's `name` is the key to update.
  function handleChange(
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) {
    const { name, value } = e.target;
    updateField(name as keyof ServiceDraft, value);
  }

  // Move focus to the first problem so keyboard and screen-reader users land on it.
  function focusFirstError(form: HTMLFormElement, found: ServiceErrors) {
    const first = SERVICE_FIELD_ORDER.find((key) => found[key]);
    if (!first) return false;
    const target =
      first === "type"
        ? document.getElementById("booking-category")
        : form.elements.namedItem(first);
    if (target instanceof HTMLElement) target.focus();
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // otherwise the page reloads
    if (status.state === "saving") return;
    const form = e.currentTarget;

    const found = validateService(draft);
    setErrors(found);
    if (focusFirstError(form, found)) return;

    const save = isEdit
      ? editingId
        ? (item: ServiceRecord) => updateService(editingId, item)
        : undefined
      : addService;
    if (!save) return;
    setStatus({ state: "saving" });
    let result: AddServiceResult | void;
    try {
      result = await save(toServiceRecord(draft));
    } catch {
      // The action itself never throws; this is the network or server being down.
      result = {
        ok: false,
        message:
          "Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз",
      };
    }

    if (!result) {
      setStatus({ state: "idle" });
    } else if (result.ok) {
      // A new item empties the form; an edited one stays on screen as saved.
      if (!isEdit) setNewServiceItem(EMPTY_SERVICE_ITEM);
      setStatus({ state: "success", message: result.message });
    } else {
      setStatus({ state: "error", message: result.message });
      if (result.errors) {
        setErrors(result.errors);
        focusFirstError(form, result.errors);
      }
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-16 justify-between w-full min-h-screen items-start max-w-[1024px] px-4">
      <div className="flex lg:flex-col flex-row gap-2">
        <button
          type="button"
          name="addService"
          onClick={() => selectMenu("add")}
          className={`font-body font-bold text-base tracking-wider px-4 py-2 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-blush text-ink-60 rounded-pill border-2 cursor-pointer active:ring-blush active:bg-blush active:scale-95 hover:bg-blush/50  disabled:bg-mauve disabled:text-mauve ${selected === "add" ? "bg-blush" : "bg-transparent"}`}
        >
          Добавить
        </button>
        <button
          type="button"
          name="changeService"
          onClick={() => selectMenu("change")}
          className={`font-body font-bold text-base tracking-wider px-4 py-2 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-blush text-ink-60 rounded-pill border-2 cursor-pointer active:ring-blush active:bg-blush active:scale-95 hover:bg-blush/50  disabled:bg-mauve disabled:text-mauve ${selected === "change" ? "bg-blush" : "bg-transparent"}`}
        >
          Изменить
        </button>
        <button
          type="button"
          name="deleteService"
          onClick={() => selectMenu("delete")}
          className={`font-body font-bold text-base tracking-wider px-4 py-2 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-blush text-ink-60 rounded-pill border-2 cursor-pointer active:ring-blush active:bg-blush active:scale-95 hover:bg-blush/50  disabled:bg-mauve disabled:text-mauve ${selected === "delete" ? "bg-blush" : "bg-transparent"}`}
        >
          Удалить
        </button>
      </div>
      {/* w-full + min-w-0, not min-w-full: the parent uses items-start, so a
                min width alone lets the gallery track stretch this past the viewport. */}
      <div className="flex w-full min-w-0 lg:w-[60%] lg:flex-1 py-6 lg:pb-12 lg:pt-0">
        {selected === "add" && (
          // noValidate: the browser's own bubbles can't be translated, so the
          // checks in validateService show Russian messages under each field.
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-6 "
          >
            <h2 className="text-balance font-handwriting text-[clamp(0.9rem,2vw,1.7rem)] font-semibold tracking-wider text-magenta/70 pb-5">
              Добавьте новую услугу в каталог, обязательно введите тексты на
              русском, английском и испанском
            </h2>
            <div className="flex flex-col items-start justify-start gap-2 mb-4">
              <label
                htmlFor="booking-category"
                className="pb-3 text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80"
              >
                Выберите тип услуги *
              </label>
              <SelectCategory
                inputId="booking-category"
                ariaLabel=""
                placeholder=""
                options={options}
                value={uiValue}
                onChange={(o) => updateField("type", o?.value ?? "")}
              ></SelectCategory>
              {errors.type ? (
                <p
                  id="booking-category-error"
                  role="alert"
                  data-testid="service-category-error"
                  className="font-body text-sm font-semibold text-magenta"
                >
                  {errors.type}
                </p>
              ) : null}
            </div>

            <fieldset className="flex min-w-0 flex-col gap-2">
              <legend className="pb-3 text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80">
                Название услуги от 2 до 150 символов
              </legend>
              {LANGUAGES.map(({ code, label }) => (
                <TextArea
                  key={code}
                  label={label}
                  name={`name${label}`}
                  testId={`service-title-${code}`}
                  value={draft[`name${label}`]}
                  error={errors[`name${label}`]}
                  rows={2}
                  minLength={2}
                  maxLength={150}
                  required
                  onChange={handleChange}
                />
              ))}
            </fieldset>
            <fieldset className="flex min-w-0 flex-col gap-4">
              <legend className="pb-3 text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80">
                Описание услуги от 10 до 500 символов
              </legend>
              {LANGUAGES.map(({ code, label }) => (
                <TextArea
                  key={code}
                  label={label}
                  name={`description${label}`}
                  testId={`service-description-${code}`}
                  value={draft[`description${label}`]}
                  error={errors[`description${label}`]}
                  rows={5}
                  minLength={10}
                  maxLength={500}
                  required
                  onChange={handleChange}
                />
              ))}
            </fieldset>
            <NumberInput
              label="Продолжительность услуги в минутах"
              unit="мин"
              name="time"
              testId="service-duration"
              value={draft.time}
              error={errors.time}
              min={5}
              max={480}
              required
              onChange={handleChange}
            />
            <NumberInput
              label="Стоимость услуги в евро"
              unit="€"
              name="price"
              testId="service-price"
              value={draft.price}
              error={errors.price}
              step="0.01"
              min={1}
              max={1000}
              required
              onChange={handleChange}
            />

            <button
              className="mt-4 mb-4 font-body font-bold text-[1.2em] tracking-wider px-6 py-3 min-h-11 min-w-9 border-mint  bg-mint transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint text-ink-60 rounded-pill border-2 cursor-pointer active:ring-magenta active:bg-magenta active:scale-95 hover:brightness-105  disabled:bg-mauve disabled:text-mauve lg:max-w-[300px]"
              type="submit"
              data-testid="service-submit"
              disabled={status.state === "saving"}
            >
              {status.state === "saving" ? "Сохраняем…" : "Добавить"}
            </button>
            {/* Always in the DOM so screen readers pick up the text when it changes. */}
            <p
              role="status"
              data-testid="service-save-status"
              className={`font-body text-[1.2rem] font-semibold   text-center leading-10 rounded-card transition-all duration-500 opacity-0 ${status.state === "error" ? "text-magenta border-magenta opacity-100 border-2 shadow-sm" : status.state === "success" ? "text-ink/80 border-mauve opacity-100 border-2 shadow-sm" : ""}`}
            >
              {status.state === "success" || status.state === "error"
                ? status.message
                : ""}
            </p>
          </form>
        )}
        {selected === "change" && (
          <div className="flex w-full min-w-0 flex-col gap-8">
            <div className="flex w-full gap-2 flex-col">
              <h2 className="text-balance font-handwriting text-[clamp(0.9rem,3vw,1.7rem)] font-semibold tracking-wider text-magenta/70 pb-5 ">
                Выберите услугу для изменения
              </h2>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="service-search"
                  className="text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80"
                >
                  Поиск по названию
                </label>
                <input
                  id="service-search"
                  type="search"
                  placeholder="Начните ввод"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="service-search"
                  className="min-h-11 w-full rounded-pill border-2 border-blush bg-cream px-4 py-2 font-body text-base text-ink placeholder:text-ink/60 focus:border-mint focus:outline-none"
                />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-4 w-full">
              {/* Always in the DOM so screen readers hear when the list empties. */}
              <p
                role="status"
                data-testid="service-search-status"
                className="font-body text-base font-semibold text-ink/80 empty:hidden"
              >
                {loadError
                  ? ""
                  : services.length === 0
                    ? "В каталоге пока нет услуг"
                    : foundServices.length === 0
                      ? "Услуга с таким названием не найдена"
                      : ""}
              </p>
              {loadError ? (
                <p
                  role="alert"
                  data-testid="service-load-error"
                  className="font-body text-base font-semibold text-magenta"
                >
                  {loadError}
                </p>
              ) : null}
              <HorizontalGallery
                labels={{
                  previous: "Предыдущие услуги",
                  next: "Следующие услуги",
                  track: "Услуги каталога",
                }}
                data-testid="service-edit-gallery"
                className="bg-blush/20 py-2 px-4 rounded-card"
              >
                {foundServices.map((service) => (
                  <ServiceItemCard
                    key={service.id}
                    as="div"
                    name={service.nameRU}
                    description={service.descriptionRU}
                    duration={`${service.time} мин`}
                    from=""
                    price={priceFormat.format(service.price)}
                    durationLabel="Продолжительность"
                    className={
                      toChange.state === "open" && toChange.id === service.id
                        ? "border border-magenta"
                        : ""
                    }
                  >
                    {/* Opens the form below, filled with this service's saved values. */}
                    <button
                      type="button"
                      onClick={() => openEdit(service)}
                      aria-label={`Изменить: ${service.nameRU}`}
                      aria-controls={
                        editingId ? "service-edit-form" : undefined
                      }
                      data-testid="service-edit-open"
                      className="shrink-0 font-body font-bold text-sm tracking-wider px-4 py-2 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-blush bg-blush text-ink rounded-pill border-2 cursor-pointer active:scale-95 hover:bg-blush/50"
                    >
                      Изменить
                    </button>
                  </ServiceItemCard>
                ))}
              </HorizontalGallery>
            </div>
            {toChange.state === "open" && (
              // noValidate: the browser's own bubbles can't be translated, so the
              // checks in validateService show Russian messages under each field.
              <form
                id="service-edit-form"
                onSubmit={handleSubmit}
                noValidate
                className="flex w-full min-w-0 flex-col gap-6 "
              >
                <h2
                  ref={editHeadingRef}
                  tabIndex={-1}
                  className="text-balance font-handwriting text-[clamp(0.9rem,2vw,1.7rem)] font-semibold tracking-wider text-magenta/70 pb-5 focus:outline-none"
                >
                  Измените услугу «
                  {services.find((s) => s.id === toChange.id)?.nameRU ?? ""}»,
                  обязательно заполните тексты на русском, английском и
                  испанском
                </h2>
                <div className="flex flex-col items-start justify-start gap-2 mb-4">
                  <label
                    htmlFor="booking-category"
                    className="pb-3 text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80"
                  >
                    Выберите тип услуги *
                  </label>
                  <SelectCategory
                    inputId="booking-category"
                    ariaLabel=""
                    placeholder=""
                    options={options}
                    value={uiValue}
                    onChange={(o) => updateField("type", o?.value ?? "")}
                  ></SelectCategory>
                  {errors.type ? (
                    <p
                      id="booking-category-error"
                      role="alert"
                      data-testid="service-category-error"
                      className="font-body text-sm font-semibold text-magenta"
                    >
                      {errors.type}
                    </p>
                  ) : null}
                </div>

                <fieldset className="flex min-w-0 flex-col gap-2">
                  <legend className="pb-3 text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80">
                    Название услуги от 2 до 150 символов
                  </legend>
                  {LANGUAGES.map(({ code, label }) => (
                    <TextArea
                      key={code}
                      label={label}
                      name={`name${label}`}
                      testId={`service-title-${code}`}
                      value={draft[`name${label}`]}
                      error={errors[`name${label}`]}
                      rows={2}
                      minLength={2}
                      maxLength={150}
                      required
                      onChange={handleChange}
                    />
                  ))}
                </fieldset>
                <fieldset className="flex min-w-0 flex-col gap-4">
                  <legend className="pb-3 text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80">
                    Описание услуги от 10 до 500 символов
                  </legend>
                  {LANGUAGES.map(({ code, label }) => (
                    <TextArea
                      key={code}
                      label={label}
                      name={`description${label}`}
                      testId={`service-description-${code}`}
                      value={draft[`description${label}`]}
                      error={errors[`description${label}`]}
                      rows={5}
                      minLength={10}
                      maxLength={500}
                      required
                      onChange={handleChange}
                    />
                  ))}
                </fieldset>
                <NumberInput
                  label="Продолжительность услуги в минутах"
                  unit="мин"
                  name="time"
                  testId="service-duration"
                  value={draft.time}
                  error={errors.time}
                  min={5}
                  max={480}
                  required
                  onChange={handleChange}
                />
                <NumberInput
                  label="Стоимость услуги в евро"
                  unit="€"
                  name="price"
                  testId="service-price"
                  value={draft.price}
                  error={errors.price}
                  step="0.01"
                  min={1}
                  max={1000}
                  required
                  onChange={handleChange}
                />

                <button
                  className="mt-4 mb-4 font-body font-bold text-[1.2em] tracking-wider px-6 py-3 min-h-11 min-w-9 border-mint  bg-mint transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint text-ink-60 rounded-pill border-2 cursor-pointer active:ring-magenta active:bg-magenta active:scale-95 hover:brightness-105  disabled:bg-mauve disabled:text-mauve lg:max-w-[300px]"
                  type="submit"
                  data-testid="service-submit"
                  disabled={status.state === "saving"}
                >
                  {status.state === "saving"
                    ? "Сохраняем…"
                    : "Сохранить изменения"}
                </button>
                {/* Always in the DOM so screen readers pick up the text when it changes. */}
                <p
                  role="status"
                  data-testid="service-save-status"
                  className={`font-body text-[1.2rem] font-semibold   text-center leading-10 rounded-card transition-all duration-500 opacity-0 ${status.state === "error" ? "text-magenta border-magenta opacity-100 border-2 shadow-sm" : status.state === "success" ? "text-ink/80 border-mauve opacity-100 border-2 shadow-sm" : ""}`}
                >
                  {status.state === "success" || status.state === "error"
                    ? status.message
                    : ""}
                </p>
              </form>
            )}
          </div>
        )}
        {selected === "delete" && (
          <div className="flex w-full min-w-0 flex-col gap-8">
            <div className="flex w-full gap-2 flex-col">
              <h2 className="text-balance font-handwriting text-[clamp(0.9rem,3vw,1.7rem)] font-semibold tracking-wider text-magenta/70 pb-5 ">
                Выберите услугу для изменения
              </h2>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="service-search"
                  className="text-[clamp(1rem,2vw,1.2rem)] font-body text-base font-semibold text-ink/80"
                >
                  Поиск по названию
                </label>
                <input
                  id="service-search"
                  type="search"
                  placeholder="Начните ввод"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="service-search"
                  className="min-h-11 w-full rounded-pill border-2 border-blush bg-cream px-4 py-2 font-body text-base text-ink placeholder:text-ink/60 focus:border-mint focus:outline-none"
                />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-4 w-full">
              {/* Always in the DOM so screen readers hear when the list empties. */}
              <p
                role="status"
                data-testid="service-search-status"
                className="font-body text-base font-semibold text-ink/80 empty:hidden"
              >
                {loadError
                  ? ""
                  : services.length === 0
                    ? "В каталоге пока нет услуг"
                    : foundServices.length === 0
                      ? "Услуга с таким названием не найдена"
                      : ""}
              </p>
              {loadError ? (
                <p
                  role="alert"
                  data-testid="service-load-error"
                  className="font-body text-base font-semibold text-magenta"
                >
                  {loadError}
                </p>
              ) : null}
              <div className="flex flex-col w-full gap-4">
              
                {foundServices.map((service) => (
                  <ServiceItemCard
                    key={service.id}
                    as="div"
                    name={service.nameRU}
                    description={service.descriptionRU}
                    duration={`${service.time} мин`}
                    from=""
                    price={priceFormat.format(service.price)}
                    durationLabel="Продолжительность"
                    className={`min-w-[40%]  ${
                      toDelete.state === "open" && toDelete.id === service.id
                        ? "border border-magenta"
                        : "border-2 border-mauve/30"
                    }`}
                  >
                    {/* Opens the confirmation dialog below, instead of deleting right away */}
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(service)}
                      aria-label={`Удалить: ${service.nameRU}`}
                      aria-haspopup="dialog"
                      data-testid="service-delete-open"
                      className="shrink-0 font-body font-bold text-sm tracking-wider px-4 py-2 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-blush bg-blush text-ink rounded-pill border-2 cursor-pointer active:scale-95 hover:bg-blush/50"
                    >
                      Удалить
                    </button>
                  </ServiceItemCard>

                ))}
                </div>

            </div>
            <Modal
              open={toDelete.state === "open"}
              onClose={closeDeleteConfirm}
              title="Удалить услугу?"
              labels={{ close: "Закрыть окно" }}
              className="max-w-md"
            >
              <div data-testid="delete-confirm-dialog" className="flex flex-col gap-6">
                <p className="font-body text-base leading-relaxed text-ink/80">
                  Услуга «{toDelete.state === "open" ? toDelete.name : ""}» будет
                  безвозвратно удалена из каталога. Это действие нельзя отменить.
                </p>
                {/* Always in the DOM so screen readers pick up the text when it changes. */}
                <p
                  role="alert"
                  data-testid="service-delete-status"
                  className={`font-body text-sm font-semibold text-magenta empty:hidden`}
                >
                  {deleteStatus.state === "error" ? deleteStatus.message : ""}
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteConfirm}
                    data-testid="delete-confirm-cancel"
                    disabled={deleteStatus.state === "saving"}
                    className="font-body font-bold text-sm tracking-wider px-6 py-3 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-mauve bg-transparent text-ink rounded-pill border-2 cursor-pointer active:scale-95 hover:bg-mauve/20 disabled:bg-mauve disabled:text-mauve"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    data-testid="delete-confirm-confirm"
                    disabled={deleteStatus.state === "saving"}
                    className="font-body font-bold text-sm tracking-wider px-6 py-3 min-h-11 min-w-9 transition duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream focus:ring-mint border-magenta bg-magenta text-cream rounded-pill border-2 cursor-pointer active:scale-95 hover:brightness-105 disabled:bg-mauve disabled:text-mauve disabled:border-mauve"
                  >
                    {deleteStatus.state === "saving" ? "Удаляем…" : "Удалить"}
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </div>
    </div>
  );
}
