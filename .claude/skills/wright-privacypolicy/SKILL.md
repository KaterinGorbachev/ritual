---
name: wright-privacypolicy
description: Write the GDPR/LOPDGDD privacy policy for the Ritual salon — the trilingual JSON content (ru, es, en) plus the /[lang]/privacy page built with Legal Design. Use whenever creating, updating, translating or reviewing the privacy policy, its legal basis table, its WhatsApp/Google Calendar disclosures, or the page that renders it.
---

# wright-privacypolicy — the Ritual privacy policy, content + page

Two deliverables, in this order:

1. **Content** — a `privacy` block added to each of the three dictionaries
   (`app/[lang]/dictionaries/{ru,es,en}.json`), same shape in all three.
2. **Page** — `app/[lang]/privacy/page.tsx`, a Server Component that renders
   that block using Legal Design (numbered layered sections, sticky nav, plain
   words).

Ritual is a **massage and facial salon in Valencia, Spain**, run as a small
business. It books clients over **WhatsApp** and stores data in **Firebase
(Firestore)**. Both are US-owned processors and the business touches
**health-adjacent data** — that is what makes this policy non-trivial, and those
are the parts a reader (and the AEPD) will actually look for. A **Google
Calendar** integration is described in `CLAUDE.md` but **does not exist in the
code**; verify before naming it as a recipient, and never list a processor the
app does not actually use.

## The one rule that outranks the rest: be short

**Write the shortest policy that is still complete and true.** A policy nobody
finishes protects nobody, and every extra sentence is another claim that must
stay true as the code changes. Concretely, and enforced by tests:

- **Two sentences per `body` paragraph**, at most 4 paragraphs per section. The
  sole exception is `cookies`, which doubles as a full cookie policy.
- **Say what the salon does. Do not catalogue what it does not do.** One
  "we do not sell your data" is worth keeping; "we have no DPO", "we use no
  analytics, no pixels, no heatmaps", "we do not ask for your ID or address"
  are not — listing what *is* collected already tells the reader what is not.
- **A fact does not earn a section.** If it needs fewer than three sentences,
  fold it into a `table` column, a `list` row or a `note`. Never delete a
  required disclosure to shorten — relocate it.
- **No reassurance, no salesmanship, no meta-commentary.** DESIGN.md's warm
  marketing voice does **not** apply to legal text.

The reference register is
[T-Systems' Spanish privacy policy](https://www.t-systems.com/es/es/data-privacy):
scannable headings, short declarative statements, legal bases cited inline as
`(art. 6.1.f RGPD)` rather than explained at length, and a table doing the work
that paragraphs would otherwise do. Full detail in *Writing rules for the
values* below.

## Before writing a word

1. **Search the web for the current state of the law.** Do not write from
   memory — the fines, the guidance and the transfer mechanism all move.
   Check, at minimum: the latest AEPD guidance on messaging apps and on
   *responsabilidad proactiva*; the current status of the **EU–US Data Privacy
   Framework** (is it still valid? are Meta and Google still certified? check
   `dataprivacyframework.gov`); and any 2026 amendments to **LOPDGDD 3/2018**
   or the RGPD. Cite what you find in your summary to the user.
2. **Read [`V2026-guide-to-privacy-by-design.pdf`](V2026-guide-to-privacy-by-design.pdf)**
   in this folder — it drives the *design* decisions (data minimisation,
   layered notice, defaults) as much as the wording.
3. **Read [`whatsapp-gdpr-compliance-note.md`](whatsapp-gdpr-compliance-note.md)**
   in this folder. It is the sharpest constraint on this policy. The load-bearing
   points: art. 28 requires a **DPA with every processor**, and a personal
   WhatsApp Messenger account has none; the **Business app is the minimum**,
   **Cloud API is the defensible option**; art. 13 requires a **first-layer
   notice in the very first WhatsApp reply**, with a link to this policy; opt-in
   must be **evidenced with a timestamp in a database**, not left in a chat log;
   art. 12.3 gives **one month** to execute an erasure request; real AEPD fines
   here run **4.000–42.000 €**.
4. **Find out which WhatsApp product Ritual actually uses.** Read
   [`app/lib/whatsappNotify.ts`](../../../app/lib/whatsappNotify.ts) and
   [`app/ui/WhatsAppButton.tsx`](../../../app/ui/WhatsAppButton.tsx). If it is a
   `wa.me` deep link to a personal number, **say so in your report to the user
   and flag the art. 28 gap** — write the policy describing the real setup, and
   do not claim a DPA that does not exist.
5. **Trace how consent is captured and stored today**, before describing it:
   the `consent` checkbox and `marketingOptIn` in
   [`app/ui/AppointmentForm.tsx`](../../../app/ui/AppointmentForm.tsx), and what
   [`app/api/reservations/route.ts`](../../../app/api/reservations/route.ts)
   actually persists to Firestore. Write what is true. **Known gap at the time of
   writing: `consent` is validated in the browser but never sent to the API or
   written to the reservation document, while `marketingOptIn` is stored as a
   bare boolean with no timestamp or policy version.** Re-check whether that is
   still the case, and report it — see *Explicit consent* below.
6. **Read what the site already collects** before describing it:
   [`app/ui/AppointmentForm.tsx`](../../../app/ui/AppointmentForm.tsx),
   [`app/ui/ContactServiceForm.tsx`](../../../app/ui/ContactServiceForm.tsx),
   [`app/ui/BookingSelectForm.tsx`](../../../app/ui/BookingSelectForm.tsx),
   [`app/lib/bookingValidation.ts`](../../../app/lib/bookingValidation.ts),
   [`app/lib/handleData.js`](../../../app/lib/handleData.js). **Every field in
   those forms must appear in `dataCollection`, and nothing that isn't collected
   may be listed.** A policy that describes a different app than the one shipped
   is worse than none.
7. **Inventory the browser storage** for the `cookies` section, by grepping
   rather than assuming: `document.cookie`, `localStorage`, `sessionStorage`,
   `cookies()`. Today that is `ritual:lang` in
   [`app/store/localeStore.ts`](../../../app/store/localeStore.ts) (1 year,
   `SameSite=Lax`, `Secure` over HTTPS) and `ritual:motion-off` in
   [`app/ui/MotionContext.tsx`](../../../app/ui/MotionContext.tsx). Record each
   one's **real name, purpose and duration** — those go straight into the cookie
   table, and a guessed expiry is a false statement.

**Never invent a legal identity.** The `responsiblePerson` section needs a real
registered name, NIF/CIF, postal address and contact email. If you do not have
them, use the literal placeholder `"[[PENDING: legal name]]"` etc., and tell the
user in your summary exactly which values they must supply before the page can
go live. Do not guess, and do not ship a plausible-looking fake NIF.

## Explicit consent for WhatsApp communication

This is the part the AEPD fines people for, so treat it as a first-class subject
of the policy rather than a line inside the WhatsApp section.

### Writing to us on WhatsApp is a *request*, not a *consent*

When a client opens a chat and asks about a treatment or a time, Ritual may
lawfully use their **phone number, name and the content of that message** to
reply, quote, arrange, confirm or reschedule. Say this plainly and early in
`data-whatsapp-usage` — clients genuinely worry that messaging a business is
risky, and the honest answer is reassuring. One sentence, not a paragraph.

But **do not call it consent.** The basis is **art. 6.1.b**: processing
necessary to take steps *at the request of the data subject* before entering
into a contract, and then to perform that contract. The client's message **is**
that request; nothing further is needed to make the reply lawful. Three reasons
this framing is stronger for Ritual, not weaker — put the substance of them in
the policy:

- **Consent is withdrawable at any time (art. 7.3).** If the policy claims the
  booking runs on consent, a client could withdraw it mid-arrangement and the
  salon would lose its basis to even answer. A contractual basis cannot be
  switched off that way — though the client can still object, erase and
  cancel.
- **Consent must be proven (art. 7.1).** Basing the whole service on consent
  means holding evidence for every person who ever wrote. Under 6.1.b there is
  nothing to prove: the incoming message is the request, and it is its own
  record.
- **Consent inferred from conduct is not valid consent** (art. 4.11 — it must be
  a *specific, unambiguous, affirmative act*). "You messaged us, so you
  consented" is exactly the reasoning the AEPD rejects. Calling it consent
  would therefore give Ritual a basis that fails on its own terms, where 6.1.b
  simply holds.

The limits belong in the same breath, because they are what make the claim
true — the request covers **that enquiry and the service around it**, and
nothing more:

- it does **not** authorise marketing (see below), adding the number to a
  broadcast list or a group, or passing it to anyone outside section 5;
- it does **not** cover health details volunteered in the chat — those need
  explicit consent under art. 9.2.a, which is why the policy asks clients not to
  send them (section 4);
- data from an enquiry that never becomes a booking is kept only as long as the
  enquiry is live, then deleted per section 8;
- the client keeps every right in section 10, including **objection (art. 21)**
  and **erasure (art. 17)** — a contractual basis is not a permanent one.

**Never write that a client "accepts this policy by writing to us."** A privacy
policy is *information* under art. 13, not a contract needing acceptance; the
duty it creates is Ritual's duty to inform, discharged by the first-layer
message linking here. Wording that demands acceptance-by-conduct is both
unnecessary and the kind of clause that reads as a red flag in an inspection.

### Separate the three consents — never bundle them

Art. 7.2 requires each purpose to be **separable**, and art. 4.11 requires
consent to be **freely given, specific, informed and unambiguous** — a single
"I accept everything" tick is void, and a pre-ticked box is void (*Planet49*,
C-673/17). Ritual has three distinct asks, and the policy must describe them as
three:

| Consent | Purpose | Basis | Required to book? |
|---|---|---|---|
| **Service messages** | Replying to the enquiry, quoting, confirming, rescheduling or reminding about *this* appointment over WhatsApp | Art. 6.1.b (request + contract) — **not** consent | No tick at all; the client's own message is the request |
| **Marketing messages** | Offers, promotions, news over WhatsApp | Art. 6.1.a consent **+ LSSI-CE art. 21** (prior express consent for commercial messages) | **No — strictly optional** |
| **Health details** | Notes on pregnancy, injuries, allergies, skin conditions | Art. 9.2.a **explicit** consent | Only if the salon collects them at all |

State plainly in the policy that **refusing marketing does not affect the
booking** (art. 7.4 — no conditionality), and that the two can be withdrawn
independently.

### What "explicit" adds for health data

Art. 9 data needs *explicit* consent, which is a higher bar than ordinary
consent: a clear affirmative statement about that specific data, not an
inference from the client having filled in a form. The policy must say **which
affirmative act** counts (a distinct ticked box, or a specific written reply in
the chat), and that the client can give the treatment without it — or that the
salon simply does not collect it. **Recommend the second.** Health notes
arriving in a WhatsApp thread with no DPA is the highest-risk data flow in this
system; the safest honest policy says *do not send us health details by
WhatsApp — tell us in the salon.*

### Withdrawal must be as easy as giving it

Art. 7.3. The policy must name the concrete mechanisms and promise they cost
nothing:

- a **keyword in the chat** — `PARAR` / `STOP` / `СТОП` — that stops marketing
  messages, honoured for the number, not just the thread;
- **an email** to the privacy address for anything else;
- withdrawal is **not retroactive** (it does not undo lawful past processing)
  but it stops all future marketing **immediately**, and in any case within the
  art. 12.3 one month;
- withdrawal of marketing consent **never cancels a booking**.

### Consent must be evidenced, not merely obtained

Art. 7.1 puts the burden of proof on the salon. "The client ticked a box" is not
evidence unless something recorded it. The policy should describe the record —
and the record must exist. For each consent, store alongside the reservation:

```jsonc
{
  "consent": {
    "policyAccepted": true,
    "policyVersion": "2026-08-11",   // meta.dateLastModification at time of tick
    "acceptedAt": "<serverTimestamp>",
    "locale": "es",                  // which language they actually read
    "source": "booking-form"         // or "whatsapp-optin"
  },
  "marketingOptIn": {
    "value": true,
    "changedAt": "<serverTimestamp>",
    "source": "booking-form",
    "withdrawnAt": null
  }
}
```

Two rules that follow, and that the policy's own wording depends on:

- **Record the policy version and the locale.** Proving consent means proving
  *what text* they agreed to, in *which language* — that is why
  `meta.dateLastModification` is identical across the three dictionaries.
- **A boolean with no timestamp proves nothing.** If the code still stores a
  bare `marketingOptIn` — or drops the `consent` tick before it reaches
  Firestore — **do not write prose claiming consent is recorded.** Describe
  what is true and raise it as a finding.

### Consent that starts in WhatsApp

When a client writes first over WhatsApp rather than through the form, art. 13
still applies at that moment. The policy must describe the flow the salon
actually runs: a **first-layer welcome message** naming the controller, the
purpose, the basis, the rights and the link to this page; then, for marketing
only, an explicit reply such as **ACEPTO** logged with its timestamp. Per
[`whatsapp-gdpr-compliance-note.md`](whatsapp-gdpr-compliance-note.md), an
"ACEPTO" that lives only in a chat history the salon can delete is **not**
evidence — it has to land in the database.

Everything above is described in `data-whatsapp-usage` and cross-referenced from
`data-usage` and `user-rights`; the health-consent specifics belong in
`health-data`. Refer to sections **by `id`, never by number** — numbers shift
whenever a section is folded away, and a stale "see §7" in this file will be
copied straight into the policy.

Say it in **four `body` paragraphs at most**. The reasoning above is background
for you, not copy for the reader: they need the rule and its limits, not the
argument for why 6.1.b beats consent.

## The JSON schema

Add a top-level `privacy` key to each dictionary. Keys are identical across
`ru` / `es` / `en`; only values are translated. `es` is the legally
authoritative version (Spain is the establishment) — write `es` first, then
translate, and say so in `meta.authoritativeLanguage`.

```jsonc
"privacy": {
  "meta": {
    "title": "…",              // <h1> + <title>; ≤ 60 chars
    "description": "…",        // meta description; ≤ 155 chars
    "eyebrow": "…",            // Caveat handwriting line above the h1
    "intro": "…",              // EXACTLY 2 sentences, plain language, no legalese
    "dateLastModification": "2026-08-11",   // ISO 8601, same in all 3 files
    "authoritativeLanguage": "es",
    "tocLabel": "…",           // aria-label + visible heading of the sticky nav
    "summaryLabel": "…",       // "In short" — optional label for the lead-in box
    // NOTE: there is no "detailsLabel" — the body is never collapsed.
    "updatedLabel": "…",       // "Last updated" — precedes the date
    "authoritativeNote": "…",  // one sentence: which language is binding
    "printLabel": "…"          // label of the print button
  },
  "sections": [
    {
      "number": 1,                  // 1..N, sequential, no gaps, SAME in all 3 files
      "id": "responsible-person",   // kebab-case, IDENTICAL across languages
      "icon": "…",                  // key into the page's icon map
      "heading": "…",               // WITHOUT the number — the page renders it
      "summary": "…",               // layer 1: ONE sentence, ≤ 160 chars
      "body": ["…", "…"],           // full text: paragraphs, always visible
      "list": [{ "term": "…", "detail": "…" }],   // optional
      "table": {                     // optional, used by legal-basis + retention
        "columns": ["…", "…", "…"],
        "rows": [["…", "…", "…"]]
      },
      "note": "…"                    // optional callout
    }
  ]
}
```

`sections` is an **ordered array**, not an object — the page renders it in order
and builds the sticky nav from it, so adding a section is a content-only change.

**Numbering.** Every section carries an explicit `number`. It is stored in the
JSON (not derived from array index) because clients and the salon will cite
sections by number — "see §7" has to mean the same thing in Russian, Spanish and
English, and it must not shift when a section is inserted. The page renders it
as `{number}. {heading}` in both the ToC and the `h2`; `body` paragraphs may
cross-reference other sections by number. Sub-points inside `list` are numbered
`{number}.1`, `{number}.2` by the component, never hand-typed into the strings.

### Required sections, in this order

`number` and `id` are both fixed — the `id` is a URL fragment people link to and
share, the `number` is how they cite it:

| # | `id` | Must cover |
|---|---|---|
| 1 | `responsible-person` | Legal name, NIF/CIF, salon address in Valencia, contact email, and that clients may complain to the **AEPD** (`aepd.es`) — with the link. |
| 2 | `data-collection` | Every field really collected, grouped by source: booking form, contact form, WhatsApp chat, Google Calendar entry, and any cookie/analytics. Name each field. |
| 3 | `data-usage` | Purpose ↔ **legal basis under art. 6** as a `table`: **replying to a WhatsApp enquiry → 6.1.b, steps taken at the client's own request** (see above — not consent); booking → contract (6.1.b); reminders → contract or legitimate interest; marketing messages → consent (6.1.a) + **LSSI-CE art. 21**; health notes → explicit consent (9.2.a); legal/accounting records → legal obligation (6.1.c). Add a column stating **whether each is optional** and what happens if refused — for everything consent-based the answer is "nothing; the booking is unaffected". |
| 4 | `health-data` | **Do not omit.** Any note about skin conditions, pregnancy, injuries or allergies is **art. 9 special-category data**: it needs **explicit** consent (art. 9.2.a — name the affirmative act that gives it), is kept only as long as the treatment relationship needs it, and is never sent over an unencrypted channel. State whether the salon collects it at all — if the forms don't, say plainly that clients should not send health details by WhatsApp. |
| 5 | `data-sharing` | Named processors only: **Meta Platforms Ireland** (WhatsApp), **Google/Firebase** (Firestore hosting), the hosting provider. For each: what it receives, why, and whether a **DPA (art. 28)** is in place. No vague "trusted third parties". **International transfers live here too**, as a third table column — which processors' parents sit outside the EEA and the mechanism relied on (**DPF certification** and/or **SCCs**), with the status you verified above. Art. 13.1.f still requires the disclosure, but it is two sentences, not a section. |
| 6 | `data-whatsapp-usage` | Open with **what a client's own message authorises**: writing to Ritual is a request under art. 6.1.b, so the salon may use the number, name and message to reply and arrange the service — with the limits that make that true (no marketing, no groups, no health data). Then: which WhatsApp product; that copies live on Meta infrastructure and on both phones, and the salon cannot delete the client's copy. **Then the consent split** — marketing is a separate unticked box, refusing never blocks a booking (art. 7.4), each opt-in is evidenced (timestamp + policy version + locale, art. 7.1), and withdrawal is **PARAR/STOP/СТОП** or email, free and immediate (art. 7.3). Four `body` paragraphs, no more. |
| 7 | `data-retention` | A `table` of category → period → trigger. Booking records tied to invoicing follow the **Código de Comercio art. 30 (6 years)** and tax rules (**LGT, 4 years**) — verify both online. Marketing consent lasts until withdrawn. |
| 8 | `cookies` | **Doubles as the full cookie policy** — the one section exempt from the 4-paragraph cap. It has its own spec: see *The cookies section* below. |
| 9 | `user-rights` | The rights that apply, as a `list` — one line each, not a paragraph each. State once, in `body`, **how to exercise them** (the email), and that the salon answers within **one month (art. 12.3)**. Withdrawal of consent (art. 7.3) names the **PARAR/STOP/СТОП** keyword. |
| 10 | `security` | Art. 32 in plain words: what actually protects the data — transport encryption, server-side writes, who has access. Claim only what is true. |
| 11 | `minors` | Under-18 clients need a parent/guardian; **under 14, consent must come from the holder of parental authority (LOPDGDD art. 7)**. |
| 12 | `changes` | That the date at the top is authoritative, and that material changes are announced. |
| 13 | `contact-information` | The email and postal address for privacy matters, plus the AEPD route again. |

A section only exists if it has **more than two sentences of real substance**. If
it does not, fold the fact into the section it belongs to — as a `list` row, a
`table` column, or a `note`. A required disclosure is never deleted, but it does
not earn a heading of its own.

### The cookies section

Spain treats the cookie policy as its own document, so `cookies` carries a
complete one rather than a paragraph. It is the **only section exempt from the
two-sentence / four-paragraph limits** — a reader who opens it has a specific
question ("what is stored, and how do I get rid of it?") and deserves the whole
answer. The model is
[Lerium's cookie policy](https://lerium.es/en/cookie-policy); write these six
parts, in this order:

1. **What a cookie is** — one sentence, plain words: a small text file a site
   stores in your browser to remember something between visits.
2. **How they are classified** — the three axes, one clause each, so the reader
   can place ours:
   - *by who manages them* — **first-party** (our own domain) vs **third-party**
     (another entity, e.g. social networks or embedded content);
   - *by how long they last* — **session** (deleted when the browser closes) vs
     **persistent** (a set expiry date);
   - *by purpose* — **strictly necessary**, **analytics/optimisation**,
     **personalisation**, **behavioural advertising**.
3. **Which ones we actually set**, as a `table`: name → type + purpose →
   duration. **Read this from the code, never from memory** (step 7 of *Before
   writing a word*). Today: `ritual:lang` (first-party, persistent, strictly
   necessary, 1 year) and `ritual:motion-off` (first-party `localStorage`,
   strictly necessary, until browser data is cleared).
4. **Legal basis** — strictly necessary storage rests on **art. 22.2 of Ley
   34/2002 (LSSI-CE)**, which exempts it from prior consent, so there is no
   banner. Analytics, personalisation and advertising cookies would instead need
   **consent under art. 6.1.a RGPD**, withdrawable at any time. State the
   conditional even when none are set: it tells the reader what would change.
5. **Retention** — kept while needed for the stated purpose or until the reader
   deletes them, and the honest warning that **a persistent cookie can sit there
   for years** if nobody removes it.
6. **How to block and delete them** — the part most policies skimp on and the
   reason people open this section at all. Give the **menu path and a support
   link for each major browser** (Chrome, Firefox, Safari, Edge, Opera), note
   that mobile hides the same option in the browser app's settings, and say
   **what the reader loses** by blocking them — here, only the saved language and
   the animation preference; the site still works. If analytics are ever added,
   link the relevant opt-out (e.g. Google's Analytics Opt-out Add-on) too.

Two things not to copy from the reference:

- **Do not list purpose categories the site does not use.** Lerium describes its
  analytics and advertising cookies because it sets them. Ritual sets none, so
  those appear only in the *classification* (step 2) and in the conditional in
  step 4 — never as a description of what is installed.
- **Do not claim cookie data is "completely anonymous" or "never associated with
  an identified user".** That is false of cookies in general and specifically of
  a persistent first-party identifier; the AEPD treats such wording as a
  misleading statement, and it is not needed to reassure anyone.

**Verify every browser link before shipping it** — a 404 in a legal document is
both careless and useless to the reader, and these support URLs move.

### Writing rules for the values

**Brevity is the first rule, not a polish pass.** A policy nobody finishes
protects nobody, and every extra sentence is another claim that has to stay true
as the code changes. Write the short version first; do not write a long draft
intending to cut it.

Four hard limits, all enforced by the parity test:

- **Two sentences per `body` paragraph. No exceptions.** If a third sentence
  wants in, it is either a new paragraph or it does not belong. This single rule
  does more for readability than any amount of rewording. 
- **At most 4 `body` paragraphs per section**, and most sections need 2. The one
  exception is `cookies`, which carries a whole cookie policy — see *The cookies
  section*.
- **`summary` is one sentence, ≤ 160 characters**, and carries no article
  numbers.
- **`intro` is two sentences.** It says what the page contains and how to read
  it — nothing about the business, nothing reassuring, no welcome.

**Say what you do. Never catalogue what you do not do.**
"We do not sell your data" earns its place because it answers the question every
reader has. Beyond that one line, absence is not information: sentences like
"we have no Data Protection Officer", "we make no automated decisions", "we do
not ask for your ID, your address or your date of birth", "we do not use Google
Analytics, Meta pixels, heatmaps or advertising cookies" cost the reader time and
tell them nothing they can act on. **State the positive fact and stop** — listing
what is collected already establishes what is not. The one exception is where a
negative *is* the operative instruction: *do not send us health details by
WhatsApp*.

**Cut these on sight:**

- Reassurance and salesmanship — "we think that is worth more than any traffic
  report", "it is a deliberate decision", "that is a selling point". A privacy
  policy is not a marketing surface; DESIGN.md's warm voice does **not** apply
  here.
- Explaining the reasoning behind a legal basis at length. Name the basis, state
  what follows for the reader, move on. One paragraph of "why 6.1.b and not
  consent" is right; four is a law-review article.
- Restating in `body` what the `table` or `list` already says.
- Meta-commentary about the document — "as we explained above", "this may sound
  like a technicality", "with honesty".
- Incidental technical trivia that is true of every website and that the reader
  cannot act on — an image host receiving an IP because an image was loaded, a
  server writing ordinary request logs. It reads as padding, and it displaces
  the thing they came for. Disclose a third party when it **sets storage,
  receives personal data, or acts as a processor**; not merely because a request
  reached it.
- Any sentence that survives being deleted without the reader losing a fact.

**Prefer structure to prose.** A `table` row or a `list` item is read; a
paragraph containing the same fact is skimmed. When a section starts listing
things in sentences, convert it.

**Where the reader needs to DO something, be specific.** Brevity means cutting
padding, not cutting instructions. Naming the menu path in five browsers, or the
exact keyword that stops the messages, is worth more words than any amount of
explaining — that is the part of the page a person actually arrived to use.

- **Plain language.** Short sentences. Second person ("your data", "tu email").
  Article numbers belong in `body`, never in `summary`.
- **Never contradict the app.** Every claim must be true of the code as shipped;
  when in doubt, read the file and write what it does.
- **No dead placeholders in prose.** Emails, phone numbers and addresses come
  from the copy you were given or the `contactData` Firestore docs — not invented.
- **Translate, don't transliterate.** `ru` reads as native Russian legal-plain
  style, not calqued Spanish. Keep proper nouns (AEPD, RGPD/GDPR, Meta
  Platforms Ireland Ltd.) in their official form, with the local gloss on first
  use.
- **Identical structure.** Same number of `sections`, same `number`s and `id`s in
  the same order, same number of `body` paragraphs and `table` rows in all three
  files — the page renders one component for all locales, and a mismatch shows up
  as a broken layout in one language only.
- **Never bake the number into `heading`.** `"heading": "1. Responsable"` breaks
  renumbering and reads twice on screen. The component composes it.
- **Dates as ISO 8601** in JSON; format for display in the component.

## The page — Legal Design

`app/[lang]/privacy/page.tsx`, an **async Server Component**. Follow
[`app/[lang]/services/page.tsx`](../../../app/[lang]/services/page.tsx) for the
shape: `await params` → `toLocale(lang)` → `getDictionary(locale)` → pass
strings down as props.

**Invoke the [`create-ui`](../create-ui/SKILL.md) skill and read its `DESIGN.md`
before writing markup.** All brand rules there apply here — tokens only, no
white, `blush` never as text, padding/gap never margins, 44px targets, `mint`
focus rings. MUST NOT hide any text, all texts must be visible, no acordeon elements. 

### Structure

- **Two-column on `lg`, single column below.** Left: a `sticky top-…` table of
  contents built from `sections[]`, each entry rendered as `{number}. {heading}`.
  Right: the sections. Use the full page width — this is a document, not a
  marketing column; cap body text at a comfortable measure (`max-w-prose`)
  inside a wide container.
- **The contents nav is sticky at every width, and collapsed below `lg`.**
  On a phone an open list of 13 links fills the screen, so it becomes a
  `<details>` bar pinned to the top of the viewport — closed in the markup and
  forced open again at `lg` through
  `.legal-toc-details::details-content { content-visibility: visible; block-size: auto }`.
  (Overriding the child's own `display` does nothing: a closed `<details>` hides
  its children through `::details-content`.)

  **Making sticky actually stick** is the part that goes wrong twice. A sticky
  element can only travel inside its own containing block, so **its wrapper must
  be taller than it is**:
  - put `sticky` **and `self-start`** on the wrapping column — as a flex child it
    otherwise stretches to the full row height and has nowhere to go;
  - and make sure the wrapper is not merely as tall as the nav itself. A 50px
    collapsed bar inside a 50px wrapper scrolls straight off the top. Wrap it
    against the whole two-column row instead.

  Cap the list with `max-h-[60vh] overflow-y-auto` so a long one scrolls inside
  itself. **Verify by measurement, not by eye**: scroll ~2200px at 320, 390, 768
  and 1440 and assert `getBoundingClientRect().top` still equals the offset.
- **A print button** in the header, beside the last-updated date: a `"use
  client"` component calling `window.print()`, labelled from `meta.printLabel`
  and hidden in print. Prefer this to linking a stored PDF — the browser dialog
  prints the live text (and offers "Save as PDF"), so the sheet can never go
  stale against the policy, and it needs no build step.
- **ALL the text is visible. Nothing about the policy collapses.**
  This overrides any reading of "layered notice" that hides substance. A privacy
  policy exists to be read: text behind a disclosure triangle is text most people
  never see, it defeats the art. 12.1 duty to inform in an *easily accessible*
  form, and it breaks Ctrl+F, deep links to a subsection, and skimming for the
  one clause that matters. **Do not put `body`, `list`, `table` or `note` inside
  a `<details>`.**

  Layer the information with **typography instead of visibility**:
  - *Layer 0* — the page header: eyebrow, `h1`, `intro`, last-updated date,
    print button.
  - *Layer 1* — each section opens with its `summary` in a tinted lead-in box
    set a size larger than body copy and marked by the section icon (or by
    `meta.summaryLabel`, if the design shows a label). A reader can skim only
    these and still get the whole policy. MUST NOT use frases as "Каждый раздел начинается с краткого содержания в одну фразу." or similar that describes the text style. 
  - *Layer 2* — the `body` / `list` / `table` follows **immediately below, always
    on screen**, at body size. Both layers are visible at once; the contrast in
    size and background is what separates them.

  The only acceptable `<details>` on the page is the **mobile table-of-contents
  bar** — navigation, not content.
- **The number is visible, not decorative.** Render it in the `h2` as text (a
  `<span>` inside the heading), so it is copied with the heading and read by a
  screen reader. Do not use a CSS counter — the number lives in the data.
- **Tables become one card per row below `lg`.** A three-column legal table
  cannot be read at 320px, and a horizontal scroller is not an answer — it makes
  the reader pan back and forth to pair each value with its heading.

  Keep a real `<table>` with `<caption>` and `<th scope="col">`, then switch its
  layout in CSS up to 1023px: `display: block` on table/tbody/tr/td, hide the
  `<thead>`, and give every `<td>` a `data-label={columns[i]}` that the card view
  prints via `td::before { content: attr(data-label) }`. Only the `display`
  changes, so the semantics a screen reader uses survive intact. Set the label
  above its value, not beside it — these cells hold prose, not numbers.

  Two things that are easy to miss: any `min-w-*` on the table must be
  `lg:`-prefixed, or it forces a horizontal scroll on a phone anyway; and the
  print stylesheet has to `display: revert` the card rules and null the
  `::before`, or printing from a narrow window yields stacked cards with
  duplicated labels.
- **Icons** are decorative → `aria-hidden="true"`. Map `section.icon` to an SVG
  in the component; an unknown key renders no icon rather than throwing.

### Components to create (DRY)

Put them in [`app/ui/`](../../../app/ui/) so the future terms-of-service and
cookie pages reuse them:

- `LegalSection.tsx` — number + heading + anchor + the lead-in summary + the
  full body, list, table and note, **all always visible**.
- `LegalTableOfContents.tsx` — sticky numbered nav, collapsed below `lg`. Stays a
  Server Component: plain anchors plus a native `<details>` need no JavaScript,
  and add `"use client"` **only if** you add scroll-spy — prefer not to.
- `LegalTable.tsx` — the accessible, horizontally scrollable table.
- `PrintButton.tsx` — `"use client"`, calls `window.print()`, `print:hidden`.

Reuse `Section` and the existing type scale rather than inventing new ones.
(`CreamCard` is a marquee `<li>` — not a general-purpose card; build the layer-1
callout inline instead of bending it.)

### The print stylesheet

Goes in `app/globals.css` under `@media print`, **not** in a throwaway script:
the Print button uses the browser's own dialog, so these rules *are* the paper
document. Two things matter most, and both are easy to get wrong:

1. **Undo the small-screen card view.** Paper is always wide enough for the real
   table, so `display: revert !important` the `.legal-table` block rules and null
   the `td::before`. Otherwise printing from a narrow window produces stacked
   cards with every label duplicated.
2. **Flatten the brand.** Cream/blush washes eat toner and lower contrast on
   paper. Set `background: #fff`, strip `background-image`, `box-shadow` and
   `backdrop-filter` globally, and keep the brand only in heading rules.

Nothing needs forcing open: the policy text is never collapsed on screen. Hide
any remaining `<details>` (the mobile contents bar) outright rather than
expanding it.

Also: `@page { size: A4; margin: 18mm 16mm }`; hide the header, footer, canvas,
ToC and print button; `thead { display: table-header-group }` so table headers
repeat across pages; `tr { break-inside: avoid }`; give tables real printed
borders and unset the `overflow-x-auto` wrapper so no column is clipped; and
`break-after: avoid` on headings so none is orphaned from its section.

To produce a **file** (for a shopfront folder), drive the same page through
Chromium rather than maintaining a second stylesheet:
`page.emulateMedia({media:'print'})` → `page.pdf({format:'A4'})`. Regenerate it
whenever the policy changes; a stored PDF is a snapshot that silently goes
stale, which is exactly why the on-page button is the primary route.

### Accessibility (WCAG 2.2 AA — non-negotiable)

- One `h1`; sections are `h2`; nothing skips a level.
- Every section is `<section id={id} aria-labelledby={…}>` so the ToC anchors
  land on a labelled landmark.
- `scroll-margin-top` on each section so the sticky header never covers the
  heading you just jumped to.
- The ToC is `<nav aria-label={meta.tocLabel}>`.
- Visible `mint` focus on every ToC link and on the mobile contents `<summary>`.
- Reading it with `prefers-reduced-motion` on must lose nothing (no scroll
  animation carrying meaning).
- Print stylesheet: ToC hidden, tables back to real tables. People print
  policies — see *The print stylesheet* above.
- The print button is a real `<button>` with a text label (never icon-only) and
  the 44px target every control gets.

## Wiring it up — do not stop at the page

1. **Footer link.** `dict.footer.privacyPolicy` already exists in all three
   dictionaries — point it at `/{locale}/privacy` in
   [`app/ui/FooterContactDetails.tsx`](../../../app/ui/FooterContactDetails.tsx)
   (check where it currently points; it may be a dead `#`).
2. **Metadata.** Export `generateMetadata` from the page (never a static
   `metadata` object) reading `dict.privacy.meta`, and emit
   `alternates.languages` for all three locales plus `canonical`. Use
   `absUrl()` from [`app/lib/site.ts`](../../../app/lib/site.ts) — never a
   hardcoded domain.
3. **Sitemap.** Add `{ path: "/privacy", priority: 0.3, changeFrequency: "yearly" }`
   to `ROUTES` in [`app/sitemap.ts`](../../../app/sitemap.ts); it expands across
   locales automatically.
4. **`robots.ts`** — leave it crawlable. A privacy policy should be indexed.
5. **JSON-LD.** Optionally add a `WebPage` node with `@id` and `isPartOf`
   `WEBSITE_ID` via [`app/lib/jsonLd.tsx`](../../../app/lib/jsonLd.tsx). Standing
   rule from `CLAUDE.md`: **anything claimed in JSON-LD must be visible on the
   page.**
6. **The WhatsApp first-layer notice.** Art. 13 is not satisfied by the page
   alone. Check whether the WhatsApp opening message carries the short notice +
   link; if not, flag it to the user as a required operational change (it is a
   message template, not code).
7. **The consent record.** The policy promises consent is evidenced, so the code
   has to keep that promise. Check that the required `consent` tick reaches
   [`app/api/reservations/route.ts`](../../../app/api/reservations/route.ts) and
   is persisted with `policyVersion`, `acceptedAt` and `locale`, and that
   `marketingOptIn` carries a timestamp and a `withdrawnAt` field. **If it does
   not, either fix it in the same change or report it as a blocking finding** —
   never let the prose describe a record that isn't written. The consent
   checkbox label must link to `/{locale}/privacy`, and the marketing tick must
   stay a separate, unticked, optional control (art. 7.2 / 7.4).

## Check it

Follow the TDD rule from `create-ui` — tests first, red, then green.

- **A `.test.tsx` under [`app/test/ui/`](../../../app/test/ui/)** for
  `LegalSection` — the number renders inside the `h2`, the heading is level 2,
  and **every body paragraph, list item, table cell and note is visible with no
  interaction**. Assert `container.querySelector("details")` is `null`: that is
  what stops the collapsing from creeping back. And for `LegalTable`: caption,
  `scope="col"`, and a `data-label` on every `<td>` matching its column.
- **Responsive checks by measurement.** Drive Playwright at **320, 390, 768 and
  1440** and assert, at each: `document.documentElement.scrollWidth` does not
  exceed `clientWidth` (no horizontal overflow — the bug the card view exists to
  prevent); `<td>` computed `display` is `flex` below `lg` and `table-cell` at
  `lg`; `td::before` `content` resolves to the column name below `lg`; and after
  scrolling ~2200px the contents nav's `top` still equals its sticky offset.
  Eyeballing a screenshot does not catch a sticky element with no room to
  travel — it looks fine until you scroll.
- **A parity test** asserting all three dictionaries have the same `privacy`
  section `id`s and `number`s in the same order, that `number`s are `1..N` with
  no gaps or duplicates, the same `dateLastModification`, and no empty strings.
  This is the single highest-value test here — it catches the failure mode that
  actually happens.
- **Brevity tests, in that same file.** Prose limits that are only written down
  get ignored on the next edit; these keep them true:
  - every `body` paragraph is **≤ 2 sentences**;
  - every `summary` is **≤ 160 characters** and cites no article number;
  - `meta.title` ≤ 60 and `meta.description` ≤ 155 characters.

  Counting sentences needs care in three languages: normalise `EE. UU.`, the
  abbreviations (`art.`, `arts.`, `ст.`, `Ltd.`) and article numbers (`6.1.b`,
  `9.2.a`) **before** splitting on `[.!?]`, and note that `\b` does not work
  against Cyrillic — anchor the alternation on the literal words instead.
  Otherwise the test fails on correct two-sentence prose.
- **A disclosure test** for anything folded out of its own section: if the
  `data-international-transfer` section is gone, assert the transfer safeguard
  still appears somewhere in `data-sharing`. Shortening must never silently drop
  a required art. 13 disclosure — that is the one risk this rewrite carries.
- **A test that no `[[PENDING:` placeholder survives** in any dictionary, so an
  incomplete policy cannot ship silently.
- **Consent tests on `AppointmentForm`**, if you touch the consent path: the
  marketing tick defaults to **unchecked** and submitting without it succeeds
  (it is optional); submitting without the required policy tick fails and moves
  focus to it; and the payload posted to the API carries the consent record with
  its `policyVersion` and `locale`. Pre-ticked marketing is a bug, not a default.
- `npx vitest run app/test/ui/LegalSection.test.tsx`, then `npm run lint` and
  `npm run build`.
- Add `data-testid` to the ToC, each section and each `<details>` for later
  Playwright E2E.

Do not `git stash` and do not revert on failure — report the failing output and
say exactly where it broke.

## Report back

When done, tell the user in plain terms:

- which laws/sources you verified online, and their date;
- **every `[[PENDING:]]` value they must fill in** before publishing;
- **every compliance gap you found in the real system** — a `wa.me` link with no
  DPA, health notes stored without explicit consent, a consent tick that never
  reaches the database, an opt-in with no timestamp or policy version, bundled
  consents, a missing first-layer WhatsApp notice, no working `PARAR`/`STOP`
  path — as findings, not as things you silently papered over in the prose;
- and the plain reminder that this is a well-researched draft, not legal advice:
  a Spanish data-protection lawyer should review it before it goes live.
