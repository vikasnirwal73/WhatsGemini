# WhatsGemini: Roleplay Platform Roadmap

This document outlines the phased plan to transform **WhatsGemini** from a standard AI
chat interface into a fully-fledged, immersive roleplay platform (similar to
Character.ai, SillyTavern, or JanitorAI).

Phases are ordered to front-load small, low-risk wins that build directly on
infrastructure the app already has, before tackling the larger schema changes later on.
Each phase is scoped to be shippable and independently useful on its own.

---

## Foundations already in place

Worth knowing before reading the phases below, so they aren't accidentally re-built:

- **Conversation tree, not a flat log.** `src/features/chat/messageTree.ts` is a full
  parent/child message DAG (`addChildNode`, `updateNodeMessage`, `deleteBranch`,
  `getSiblingInfo`, `findDefaultLeafFrom`). Editing your own last message and
  Regenerate both already create sibling branches under the same parent
  (`src/pages/ChatPage.tsx`); `deleteBranch` already removes a node *and every
  descendant that followed it* — that's the primitive Phase 1 below builds on.
- **Provider adapter registry.** `src/features/ai/providers/registry.ts` supports
  Gemini, OpenAI, Anthropic, DeepSeek, Qwen, Kimi, and Ollama for chat (plus Gemini/
  OpenAI/local SD WebUI for images) behind one shared `ChatProviderAdapter` interface,
  with a `ProviderCapabilities` flag system (`requiresApiKey`, `requiresBaseUrl`,
  `supportsImageGen`, Gemini-only safety settings) already used to gate Settings UI per
  provider. Any new per-provider capability (Phase 6) should follow this same pattern.
- **Context-length management, by message count.** `compressThreshold` auto-summarizes
  aged-out history into one pinned message (`autoCompressChat`,
  `src/features/aiSlice.ts`), `maxChatLength` hard-truncates the oldest messages
  (`truncateHistory`, `src/features/ai/utils/chatHistoryUtils.ts`), and
  `replyLengthLimit` caps output length via a prompt directive. All three trigger on
  message *count*, not token count — that gap is exactly what Phase 2 closes.
- **Post-hoc token/cost display.** After each reply, `MessageInput.tsx` shows tokens
  used and an estimated cost, read from the provider's own `usageMetadata` and
  `MODEL_PRICING` (`src/utils/constants.ts`). This is reactive, not predictive — nothing
  today estimates tokens *before* a send.
- **Character-initiated follow-ups, voice, auto-selfies, safety settings** already
  exist per character (`Chat.autoReply`, `Character.voiceURI`, `Character.autoSelfie`,
  global `AISafetySettings`) — not revisited below.
- **A single global user persona already exists** — `UserProfileSettings.tsx`, just
  `{ name, bio }`, read directly out of `localStorage` inside `promptComposition.ts`
  rather than passed in as data. Phase 4 builds on this.
- **Custom character JSON import/export already exists** (`CharacterPage.tsx`) but is
  WhatsGemini's own ad-hoc shape — it shares no fields with the TavernAI/SillyTavern
  "Character Card V2" spec that most community characters are distributed in. Phase 7
  is about closing that gap, not adding import/export from scratch.

---

## Phase 1: Message Timeline Controls
*Rewind, delete, and continue — all built on the conversation tree that already exists,
so this is mostly UI plus a couple of small new code paths, not new data-model work.*

- [ ] **Delete a Message:** Let any message be deleted, not just a losing variant.
  Today `ChatMessage.tsx`'s delete action only appears when a message already has
  sibling variants (`siblingInfo.total > 1`), because it's wired straight to
  `deleteBranch` via the branching UI. Relaxing that guard and adding a plain "Delete"
  entry to every message's menu (with a confirmation, since it also removes everything
  that came after it) covers this with the primitive that already exists.
- [ ] **Rewind / Truncate Chat:** "Roll back to here" is the exact same
  `deleteBranch(tree, nodeId)` call as message deletion above, just framed as a
  chat-level action rather than a per-message one (e.g. a control in the chat header
  or a long-press on any message). No new primitive needed — Phase 1's two items are
  really one feature with two entry points.
- [ ] **"Continue" Generation:** Re-invoke the model to keep writing from where it left
  off, instead of requiring a new user turn. New work needed: a prompt path that sends
  history ending on the last AI message plus a "continue, don't repeat yourself"
  instruction, then appends the result via `addChildNode` under *that same node*
  (not as a sibling) so it reads as one continued reply rather than a regenerated one.
- [x] *Message Editing (Already Implemented)*
- [x] *Regenerate Response (Already Implemented)*

---

## Phase 2: Token-Aware Context Budget
*Making the context-management machinery that already exists (auto-compress, max chat
length) token-accurate instead of message-count-accurate, plus a pre-send estimate.*

- [ ] **Client-Side Token Estimator:** Add a lightweight token-count approximation
  (a tiktoken-style heuristic is enough to start; a provider's real `countTokens` call,
  where available, can replace it later) for the assembled system prompt + history.
- [ ] **Token-Aware Compression/Truncation:** Extend `compressThreshold` and
  `maxChatLength` (or add token-based siblings to them) so history management responds
  to actual context size rather than an arbitrary message count — a threshold of "50
  messages" means very different things depending on how long those messages are.
- [ ] **Pre-Send Budget Indicator:** Surface the estimate in `MessageInput.tsx` (near
  the existing post-reply token/cost readout) so a user can see they're approaching a
  model's context window *before* sending, not just find out after.

---

## Phase 3: Character Depth — Structured Fields
*Splitting the character's single freeform "prompt" field into the distinct fields a
real persona needs, and fixing a real bug found along the way. All additive to the
`Character` type, and `buildSystemInstruction`/`buildTurnContext`
(`src/features/ai/utils/promptComposition.ts`) are the one place that needs to grow to
consume them.*

- [ ] **Fix the "Example Dialogue" mislabel:** `promptComposition.ts` currently sends
  `character.prompt` to the model labeled as `"Example dialogue: ..."`, while the
  Character editor UI labels that same field "Character Prompt (Personality, Style,
  etc.)" — the model is being told the wrong thing about what it's reading. Fix this as
  part of the split below rather than patching the label in isolation.
- [ ] **Personality / Instructions field:** What `character.prompt` should have meant
  all along — style, voice, and behavioral instructions, sent to the model correctly
  labeled as instructions rather than as example dialogue.
- [ ] **Example Dialogues field:** A real, separate few-shot field so creators can show
  (not just tell) the model how the character talks — this is what most improves
  in-character consistency and formatting (`*actions*` vs "speech") in practice.
- [ ] **First Message / Greeting (per character):** Today only a global
  `LS_INITIAL_MESSAGES` pair seeds *any* fresh chat. Add a character-specific greeting
  that's used instead when starting a chat with that character, establishing the scene
  in their own voice rather than a generic opener.
- [ ] **Scenario field:** A short "current situation" field injected into the system
  prompt alongside personality/description — separate from the persona itself so the
  same character can be dropped into different settings without editing their core
  definition.

---

## Phase 4: User Persona Expansion
*The single global `{ name, bio }` persona is real but thin. Round it out and make it
data-driven instead of a direct `localStorage` read.*

- [ ] **Richer Persona Fields:** Add appearance and backstory alongside the existing
  name/bio.
- [ ] **Pass Persona as Data:** Refactor `buildSystemInstruction` to accept the active
  persona as a parameter instead of reading `LS_USER_PROFILE` from `localStorage`
  directly — required groundwork for the next item, and a general code-health win
  (makes prompt assembly testable and predictable from its inputs alone).
- [ ] **Multiple Personas:** Support more than one saved persona (e.g. "Myself" vs. a
  fictional self-insert) with a way to pick the active one globally or per chat.

---

## Phase 5: Impersonation
*Small and self-contained: let the user occasionally speak *as* the character to steer
a scene, rather than only ever replying as themselves.*

- [ ] **Impersonate:** An input mode where the text the user writes gets saved with
  `role: "model"` (the AI role — already a plain string on `Message.role`, no schema
  change needed) via the existing `addChildNode`/tree flow, instead of `role: "user"`.
  The main design question is UI: a mode toggle vs. a distinct "send as character"
  action, and whether the real AI should be allowed to react to an impersonated line on
  the next turn (it should, since the tree treats it like any other node in history).

---

## Phase 6: Advanced Generation Settings
*Larger than it looks: today only `temperature` and `maxOutputTokens` exist anywhere in
the stack — state, the `ChatCallOptions` adapter contract, and every adapter body. This
phase is "widen one shared interface and every implementation of it," not just "add
sliders to Settings."*

- [ ] **Widen the Adapter Contract:** Add `topP`/`topK`/penalty fields to
  `ChatCallOptions` (`src/features/ai/providers/types.ts`) and wire them through the
  Gemini adapter (the underlying `@google/genai` SDK already supports `topP`/`topK`,
  they're just not passed today) and the shared OpenAI-compatible adapter (which maps
  cleanly to `top_p`, but has no `top_k` equivalent — needs the same
  provider-capability-gating already used for Gemini-only `safetySettings`, not a
  one-size-fits-all field set).
- [ ] **Global Settings UI:** Expose the newly-supported params in Settings, gated per
  provider the same way `requiresBaseUrl`/`supportsImageGen` already gate other
  controls.
- [ ] **Per-Character Overrides:** Add optional generation-param overrides to the
  `Character` type itself, consumed when building `turnConfig` in `aiSlice.ts` (which
  currently sources it solely from global `state.settings`) so a chaotic character can
  run hotter than a precise one without a global settings change.

---

## Phase 7: Character Card Portability
*WhatsGemini's own JSON export already works for backing up/restoring your own
characters — this phase is about interoperating with the wider community character
ecosystem, which standardizes on the TavernAI / SillyTavern "Character Card V2" JSON
shape (`name`, `description`, `personality`, `scenario`, `first_mes`, `mes_example`,
`alternate_greetings`, `creator_notes`, etc., often embedded in a PNG's `tEXt` chunk).*

- [ ] **Field Mapping:** Map V2 spec fields onto WhatsGemini's (by then, post-Phase-3)
  richer `Character` shape — most map directly once personality/scenario/first-message/
  example-dialogue exist as distinct fields.
- [ ] **V2 JSON Import/Export:** Read and write plain `.json` V2 cards first — no new
  binary handling required, and this alone makes most community characters usable.
- [ ] **PNG Card Import/Export (stretch):** Many community cards are distributed as a
  character-art PNG with the JSON embedded in a `tEXt` chunk. Reading these requires a
  small PNG chunk parser; writing them means embedding JSON into an exported PNG. Worth
  doing once JSON import/export is solid, since it's the more common distribution
  format in practice, but it's meaningfully more work than plain JSON and shouldn't
  block shipping the JSON path first.

---

## Phase 8: Lorebooks / World Info
*Confirmed nowhere in the codebase today — fully new, self-contained feature.*

- [ ] **World Info Entries:** A per-character (or global) list of `{ keywords[],
  content }` entries.
- [ ] **Keyword-Triggered Injection:** Scan recent chat history for entry keywords each
  turn; inject matched entries' `content` into the system prompt (via a new
  `extraDirectives`-style section in `buildSystemInstruction`, which already supports
  appending conditional sections) only when triggered, keeping untriggered lore out of
  the token budget entirely.
- [ ] **Entry Management UI:** Create/edit/delete entries from the character editor,
  with a token-cost-aware entry list once Phase 2's estimator exists.

---

## Phase 9: Multi-Character Chatrooms — Data Model
*The real hard part, split into two phases so the risky schema migration ships and
stabilizes before the UI work on top of it. Today a chat is hard-enforced 1:1 with a
character: `Chat.characterId` is a scalar field, indexed as a scalar in Dexie
(`src/services/dbService.ts`), and `getChatByCharacterId()` returns only the first
match — `CharacterPage.tsx` relies on exactly that assumption to decide whether to
reuse or create a chat.*

- [ ] **Schema Migration:** `Chat.characterId` (scalar) → `Chat.characterIds: number[]`.
  Add a `speakerId` to `Message` for AI turns (there's already an unused-for-routing
  `Message.characterId` field to repurpose or rename). Write a Dexie migration for
  existing 1-character chats.
- [ ] **Speaker-Labeled History:** Rewrite `buildChatHistory`/`buildSystemInstruction`
  (currently built around exactly one `Character`) to prefix each turn with its
  speaker's name (`User: hello`, `Bot A: hi`, `Bot B: greetings`) so the model can tell
  characters apart in a shared history.
- [ ] **Backward Compatibility:** Every single-character code path (image generation
  context, memory extraction, auto-selfie, voice) currently assumes one character per
  chat — audit and update each to handle the multi-character case before UI work
  begins, so Phase 10 isn't blocked mid-stream by a missed assumption.

---

## Phase 10: Multi-Character Chatrooms — Room UI
*Builds on Phase 9's data model. This is genuinely new UI, not a reskin of anything
that exists today.*

- [ ] **Room Creation UI:** Create a room, set a topic, and select multiple existing
  characters into it.
- [ ] **Turn Routing:** Controls for who replies next — manual "request a reply from
  this bot" buttons, plus an `@BotName` mention trigger in the composer.
- [ ] **Room Management:** Per-character mute toggles and a "force this character to
  reply now" action.
