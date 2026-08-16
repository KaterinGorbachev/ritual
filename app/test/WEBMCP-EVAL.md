# WebMCP manual eval

Deterministic tests prove a tool returns the right answer **when called**. They
say nothing about whether a model *calls it* — and that is what decides whether
a visitor's agent can answer a question about Ritual.

Running this by hand needs no API key. You act as the model: read only what a
model can see (tool names and descriptions), pick a tool, then check yourself.

Do this whenever a tool name, description or input schema changes. Those three
strings are the model's entire basis for choosing.

## Setup

```bash
npm run dev
```

Open `http://localhost:3000/en`, DevTools → Console. Print exactly what an agent
receives:

```js
console.table(
  (await document.modelContext.getTools()).map(t => ({
    name: t.name,
    description: t.description,
  }))
);
```

**Read only that table while scoring.** The moment you look at the source you
stop being a fair judge — you know what the tools do; a model only knows what
you wrote.

## How to score

For each question below: pick the tool from the table, then compare with the
expected answer.

- **Hit** — you picked the expected tool without hesitating.
- **Slow** — you got there, but had to re-read or weigh two candidates.
- **Miss** — you picked something else, or could not choose.

A *slow* is a real finding. If the description makes you hesitate, a model
hesitates too, and hesitation is where wrong tool calls come from.

To confirm the answer is actually usable, run the tool:

```js
const tools = await document.modelContext.getTools();
const call = (name, args = "{}") =>
  document.modelContext.executeTool(tools.find(t => t.name === name), args);

await call("getWorkingHours");
await call("getServiceDetails", '{"serviceId":"microcurrent"}');
```

## Part 1 — direct questions

The tool is nearly named. These are the baseline; a miss here is serious.

| # | Visitor asks | Expected tool | Score |
|---|---|---|---|
| 1 | "What are Ritual's opening hours?" | `getWorkingHours` | |
| 2 | "Where is the salon?" | `findUs` | |
| 3 | "What treatments do they offer?" | `listTopServices` | |
| 4 | "What's their WhatsApp number?" | `getContactDetails` | |
| 5 | "Show me the reviews" | `listClientReviews` | |
| 6 | "Switch this site to Russian" | `switchLanguage` | |
| 7 | "Who works at the salon?" | `listTeamMembers` | |
| 8 | "What products do they use?" | `listCosmeticBrands` | |

## Part 2 — open-ended questions

The tool is implied, not named. **This is where real failures live** — the model
has to reason about what the visitor means.

| # | Visitor asks | Expected tool | What it tests | Score |
|---|---|---|---|---|
| 9 | "Can I come by on Sunday?" | `getWorkingHours` | A day question is an hours question | |
| 10 | "Is this place any good?" | `listClientReviews` | "good" → reviews, not services | |
| 11 | "How do I get an appointment?" | `howToBook` | Not `findUs`, despite "get" | |
| 12 | "Do they speak Russian?" | `getSpokenLanguages` | A question about staff — **not** `switchLanguage`, which changes the site | |
| 13 | "I don't speak Spanish" | `switchLanguage` | A statement implying an action | |
| 14 | "Tell me about this place" | `getAboutSalon` | Generic → the about tool, not a list | |
| 15 | "Something for tired skin after a long week" | `listTopServices` → `getServiceDetails` | **Chaining — see below** | |
| 16 | "Are they open right now?" | `getWorkingHours` | Model reports hours; it cannot know the time | |
| 17 | "Take me to the reviews on this page" | `scrollToSection` | Navigation, not data | |
| 18 | "What's RF lifting?" | `listTopServices` → `getServiceDetails` | Needs an id it does not have yet | |

## Part 3 — the chaining case

**The single most important check, and the one no unit test can catch.**

`getServiceDetails` requires a `serviceId`. A model has no way to know that
`"microcurrent"` is valid — the only source is `listTopServices`. So Q15 and Q18
require two calls in order:

```
listTopServices  →  read the ids  →  getServiceDetails({serviceId: "rf-lifting"})
```

Judge it strictly. Reading only `listTopServices`' description:

> "List the treatments Ritual offers, as ids and names. Use when someone asks
> what the salon does, what treatments are available, or what they could book.
> Call getServiceDetails with an id for the full description."

**Is it obvious the ids returned are meant to be passed to `getServiceDetails`?**

If not, a model will invent an id like `"rf_lifting"` or `"RF lifting"`, the call
returns `found: false`, and the visitor gets nothing — while **both tools pass
every deterministic test**, because each works fine in isolation.

The real ids are camelCase, which makes guessing genuinely likely to fail:

```
pressotherapyFacial, microcurrent, rfLifting, liftingMassage,
carboxytherapy, bodySculpture, bodyVShaping, bodyDetoxWrap
```

A model asked "what's RF lifting?" that skips `listTopServices` will try
`rf-lifting` or `rf_lifting` — neither exists. Confirm the failure is graceful
rather than silent:

```js
await call("getServiceDetails", '{"serviceId":"rf_lifting"}');
// → { found: false, message: "No treatment with that id. Call listTopServices…" }

await call("getServiceDetails", '{"serviceId":"rfLifting"}');
// → { found: true, name: "RF lifting", description: … }
```

The `found: false` branch is what lets a model recover: it names the tool to
call next, so a second attempt can succeed. Verified working.

**If chaining is unclear, fix the description — never the logic.** The logic is
correct; the wording is what failed.

## Part 4 — the other two languages

Repeat Q1, Q9, Q12 and Q15 on `/es` and `/ru`.

Descriptions are in English while content is localised, so this checks a model
handles the mismatch: a Russian question must select the same tool as its English
twin, and the *answer* must come back in Russian.

```js
// on http://localhost:3000/ru
await call("getWorkingHours");
// → "Часы работы: Понедельник–Воскресенье, 10–20. Только по предварительной записи."
```

Any English leaking into a Russian or Spanish answer is a bug — that exact fault
was found and fixed once already, in the hours sentence.

## Reading the results

- **Any miss in Part 1** — the description does not say plainly what the tool
  does. Rewrite it before anything else.
- **Misses clustered on two tools** — their descriptions overlap. Q12 vs Q13 is
  the pair to watch: `getSpokenLanguages` and `switchLanguage` both concern
  language, and one answers while the other acts. Each description should say
  what the *other* is for.
- **Part 3 unclear** — strengthen the pointer from `listTopServices` to
  `getServiceDetails`.
- **All hits** — the descriptions are doing their job. Re-run after any edit to
  a name, description or schema.

## When this stops being enough

This is a fair proxy, but you are not a model: you wrote the tools, and you
cannot fully un-know that. Automated evals — sending these same questions to a
real model with the tools attached and asserting the choice — remove that bias
and can run on every change.

They need `@anthropic-ai/sdk` and an `ANTHROPIC_API_KEY`, and cost a few cents a
run. Keep them **out** of `npm test`: model output is non-deterministic, and a
flaky red build teaches everyone to ignore it. Run them when tool metadata
changes, and read the report.
