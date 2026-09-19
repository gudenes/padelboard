# Padelboard playful direction — design QA

final result: passed

## Scope and visual target

A working interpretation of the user's supplied direction, in the existing Padelboard app. This is a local redesign and setup preview, not a production deployment or a pixel-exact image clone.

- Source: `docs/design/reference.png` (1536 × 1024 pixels).
- Final desktop: `docs/design/desktop-home.png` (1521 × 1014 pixels; browser viewport requested at 1536 × 1024 CSS pixels).
- Desktop controls: `docs/design/desktop-controls.png` (1536 × 1024).
- Phone: `docs/design/mobile-home.png` (375 × 812 capture, 390 × 844 requested CSS viewport); `docs/design/mobile-controls.png` (390 × 844).
- Narrow phone: `docs/design/mobile-320.png` (305 × 705 capture, 320 × 740 requested CSS viewport).
- Capture scaling: the in-app browser reduces some page screenshots proportionally to the content width excluding its 15px scrollbar. Comparison used matching desktop viewport and proportional whole-image framing; these differences are capture scaling, not page overflow. Desktop source and final implementation were opened together in one comparison call. Phone document scrollWidth equalled clientWidth (375 and 305 respectively).
- State: landing page at top, light theme, default yellow scoreboard. Additional captures cover customized names/pink color and practice controls.

## Findings and comparison history

1. Initial desktop inspection: [P2] yellow background on the generated ball formed a visible rectangular patch, and multiply blending tinted scoreboard numerals. Regenerated the illustration on white and moved it behind the scoreboard. Final desktop and phone captures show no rectangular boundary or tinted numerals.
2. Initial desktop inspection: [P2] the upper-right handwritten annotation touched the board. Moved the annotation upward; final desktop screenshot shows clear separation.
3. Responsive review: added spaces around display-only line breaks so the example heading remains readable when its breaks are hidden. Increased phone swatches and close controls to 44px and ensured the narrow header and CTA fit at 320px.
4. Final source-and-implementation comparison: no remaining actionable P0/P1/P2 findings for the agreed direction.

## Required fidelity surfaces

- Typography: locally hosted DM Sans with bold display hierarchy and Caveat handwriting. Three-line headline, large wordmark, clear body copy and bold CTA follow the reference. The scoreboard uses readable sans-serif text rather than the reference's condensed italic treatment; accepted for this direction.
- Layout: desktop navigation, two-column hero, angled scoreboard, main CTA, four-feature strip, and closing tagline preserve the reference's hierarchy. Phone layout stacks the hero and uses two feature columns. Phone scoring places the preview before the point controls.
- Colors: bright court yellow, near-black boards/buttons, cream supporting sections. Pink, mint and blue work as selectable score accents with dark foregrounds.
- Assets: generated ink-style padel ball, self-hosted fonts, Phosphor icons. The ball is a raster asset, not a CSS approximation. Omitted the mock's pale decorative backplates and extra scribbles as a deliberate simplification; preserved its main illustration and handwritten personality.
- Content: “No account needed to try” reflects the existing publishing auth requirement. Manual point entry replaces the ambiguous “live or manual” promise. Replaced third-party Premier branding with Padelboard. The setup explains practice mode and unavailable local publishing honestly.
- Full-view comparison was sufficient to read headline, labels, points and body text. Controls were additionally inspected at full resolution in desktop and mobile captures; no additional focused crops were required.

## Interaction verification

- Primary CTA opens a native modal with focus containment.
- Team names update in the preview; color selection updates immediately.
- Format selection and golden-point toggle work; single-set / advantage mode appears in the practice status.
- Added points to reach 30–15; Undo restored 30–0; Reset restored 0–0 and disabled Undo.
- Mobile preview and large point controls remain usable; body has no horizontal overflow at 390px or 320px.
- Escape closes the modal and returns focus; close button works.
- Examples navigation, color swatches and FAQ disclosure work.
- Console inspected: historical temporary missing-CSS errors occurred while the two source files were being created; none were added during final interaction checks after reload.
- `npm test`: 55 tests across 8 files passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

## Limits and follow-up

Live draft save, sign-in, publishing, and stream synchronization could not be exercised without database credentials. The saved draft path uses the existing create/PATCH endpoints and operator wizard. Practice scores intentionally do not carry over. The six new templates share their renderer between setup and published overlays. Legacy templates remain available.

The operator wizard also exposes doubles inputs, the new rules and custom template controls. Live integration still requires database credentials.

## Implementation checklist

- [x] Landing design, generated asset, locally hosted fonts and responsive layout.
- [x] Customize → practice scoring journey with honest publishing state.
- [x] Desktop/phone checks and source comparison.
- [x] Type check, existing tests and production build.
- [ ] Connect local credentials and verify the live publish journey in a later integration pass.

## Padel-specific follow-up — verified

- Four individual player fields create doubles names displayed inline as “Player / Player”. Boards now use compact rows, deliberately reducing the reference image’s original height per the user’s follow-up.
- Six selectable styles include Padelboard, Premier, FIP, APT, Roland-Garros and Custom. Tour styles are inspirations, without official logos.
- Custom editor controls colors (native picker and hex), typography, row height, name size, corner radius, overlay width and header visibility; reset restores defaults. The shared overlay renderer consumes the saved configuration.
- Desktop live color editing verified with #173f37; typography, row height and header controls checked. Captures: `docs/design/custom-editor.png`, `docs/design/mobile-custom.png`.
- At 390 × 844, the custom preview stays visible above the scrolling editor; document scrollWidth and clientWidth both equal 390. No horizontal overflow.
- Rules include advantage, golden point and Star Point, plus an explicit two-set format with a deciding 10-point super-tiebreak (win by two).
- Browser rally reached 40–40, used two shared advantage cycles, then displayed Star Point. The next point won the game; Undo restored Star Point. Capture: `docs/design/star-point.png`.
- Automated tests cover Star Point thresholds, resets, undo, legacy configuration, doubles serialization, custom design validation, and existing super-tiebreak behavior. 55 tests pass; TypeScript and production build pass.
- No remaining substantive visual findings in the follow-up. Publishing and cross-client synchronization remain untested locally without credentials.

## Dedicated custom step and enlarged preview

- Custom selection now replaces the template picker with an editor step; Back to templates preserves settings, and the primary action advances to match rules.
- Added a 260ms slide/fade entry transition, disabled for reduced-motion preferences.
- Bounded the settings panel height with internal scrolling so it does not elongate the form. Navigation stays outside that panel.
- Increased the dialog width and preview column, with a 12% preview magnification on desktop. Actual overlay output dimensions remain unchanged.
- Desktop screenshot inspected: larger board, readable inline pairs, editor controls and navigation visible. Return to template picker verified; rules step observed with the custom board retained.
- TypeScript and whitespace checks passed. Scoring logic is unchanged in this follow-up.

## Brand-inspired AI design

- Custom now contains Design with AI / Fine-tune modes. AI mode accepts a public site address or PNG/JPG/WebP logo and presents an editable proposal before application.
- Verified desktop source switching, missing-configuration state and return to manual controls. Screenshot: `docs/design/brand-generator.png`.
- Checked 390px phone layout: document scrollWidth equals clientWidth (390), sticky board remains visible, logo choice and manual mode accessible.
- The settings area remains bounded; the AI pane uses a 310px internal scroll area.
- 72 automated tests pass, including mocked OpenAI logo and website success, source evidence rejection, input validation, provider error handling and contrast correction. Production build and TypeScript pass.
- No OpenAI key is configured locally. Real provider generation, result quality, and the successful result's browser interaction remain unverified; the UI clearly disables generation instead of substituting a fake result. Setup and deployment notes are in `docs/ai-board-design.md`.

## Visual choice before templates

- Players now leads to two visual route cards: Pick a template / Create your own. Each includes real scoreboard previews.
- Predefined route lists five styles; Custom is removed from this picker and has a dedicated route to AI or manual design.
- Switching routes preserves separate custom and template colors. Browser check: custom accent #ff95c7 survived switching to templates and back.
- Desktop and 390px phone screenshots inspected; both route cards are readable, and document width equals scrollWidth at 390px.
- TypeScript and diff whitespace checks passed. No scoring or provider logic changed.

## Fixed preview, independent configuration scroll

- Dialog now has a viewport-bounded fixed frame and a persistent header. Only the configuration column scrolls; removed nested scrolling inside the custom editor.
- Desktop preview remains vertically centered. On phones it stays above the scrolling settings.
- Browser measurements confirmed no overflow in preview or dialog: desktop preview clientHeight/scrollHeight 746/746; mobile 179/179. The settings column alone has overflow (mobile 542/777).
- Desktop and 390px phone screenshots inspected. Navigation resets settings scroll to the top. TypeScript and whitespace checks pass.

## Compact creation without routine scrolling

- Reduced repeated headings, excessive spacing and card height; kept all actions available.
- Templates use two pages (four presets, then the remaining preset). Custom editing has Colors / Typography & layout panels, with Reset retained.
- AI result replaces the reference form and includes a return action, instead of appending an ever-longer result panel.
- Back/switch links share one navigation row. Practice controls and publish section are compact.
- Checked 1366×768 desktop and 390×844 mobile. Players, route choice, templates, AI reference modes, editor panels, rules and practice fit their available column height in the exercised states. Mobile rules measured 600/600 client/scroll height; custom and practice 568/568. Preview remains fixed.
- Overflow auto remains an accessibility fallback for unusually short viewports, enlarged text, long errors or custom boards larger than the tested defaults; content is not clipped to pretend it fits.
- OPENAI_API_KEY presence confirmed without displaying its value; economical model remains gpt-5.4-nano. No paid provider request was made in this layout pass.
- TypeScript and whitespace checks passed.

## Anchored step navigation

- Grouped wizard content beneath a stable title/progress header. Navigation now lives in a separate footer with a subtle divider and the primary action anchored to the bottom.
- The content body takes remaining space, keeping short forms aligned at the top rather than floating in the center. Preview remains centered independently.
- Desktop custom/rules footer bottom measured 850px in both steps. At 390×844, rules footer bottom measured 807px, with content fitting its 363px body. Tightened mobile rule cards and logo reference spacing.
- Visually checked the desktop custom screen and mobile rules screen. TypeScript and whitespace checks passed; overflow remains available for unusually tall content or short screens.

## Compact frame and website generation recovery

- Desktop dialog capped at 740px while preserving the viewport limit and bottom navigation. Result-panel spacing tightened; desktop body measured 429/429 client/scroll height with a real generated result.
- Generate button now has an animated spinner and a moving highlight while busy, remains disabled against duplicate submissions, and respects reduced-motion preferences.
- Maresme public HTML was accessible. Removed exclusive dependence on model web search: the server now supplies directly retrieved text and inline brand color tokens, with domain-restricted search retained as fallback.
- Live direct-reader regression passed for maresmepadelclub.com. Real generation through the UI succeeded with a source link and blue brand palette. No deployment made.
- TypeScript and whitespace checks passed. Full suite: 85 passed, 1 optional live check skipped (that live check was run separately and passed).

## Custom logos, header visibility and score hierarchy

- Fine-tune includes Logo & header: replace/restore logo, logo size, brand label, hide logo, and hide the first row. Compact raster logos persist within customDesign and use the shared preview/live overlay renderer.
- AI logo uploads are resized and retained; website generation attempts a bounded, validated raster fetch. The Maresme logo was recovered from a CSS background (the older inline logo URL returns 404).
- Custom set/point font size is explicit and editable, bounded by row height, so a wider preview no longer enlarges numbers independently. Both point cells use a distinct background with readable text; AI output and manual preview share the correction.
- Real Maresme generation returned a logo; applied it in Fine-tune and verified hiding/restoring the first row. Both points measured 22px. At 1280×720, compact layout and branding panels fit a 351px body without overflow.
- All 90 tests passed, including the live website/logo check. TypeScript and whitespace checks passed. No deployment made.

## Post-save workspace, operator and history

- Save & open controls leads to a board-ready sign-in page, preserving the saved design. Existing sessions automatically claim the token-protected draft; email links return to that same match. New /login and My matches entry point added.
- Operator uses shared board rendering, large pair scoring buttons, serving indication, persisted start/pause/resume clock, undo, separate finish/reset controls and stream link/timer visibility. Published operator pages require the owner session.
- Dashboard now filters active/history/all and displays pairs, set results, winner and duration. Clock and bounded undo history live in existing JSONB overlay data; no schema migration required.
- Clock/actions use server timestamps and updated_at compare-and-swap. API tests cover owner authorization, clock lifecycle and undo; claim tests check token and unowned draft constraints.
- Full suite passed 95 tests with one optional live-brand test skipped; two additional claim tests passed. Real database integration passed score/save, pause/resume/undo/finish, overlay access and realtime; temporary record removed.
- Login and operator screenshots reviewed using a temporary local fixture route (removed afterwards). Actual email delivery and clicking a magic link remain untested; no email sent. Sponsor overlays remain the agreed later phase.

## Playful workspace identity

- Matched the post-save sign-in page to the home: shared local DM Sans/Caveat fonts, vivid yellow canvas, 6/4 wordmark, handwritten notes, tilted board preview and existing ball illustration. Added a clear create/sign-in/play progress row.
- Extended the same visual system to login, operator and match history, using black outlines, offset shadows and yellow/pink scoring controls. Authentication and scoring logic unchanged.
- Reviewed home and ready-page screenshots side by side; checked ready page at desktop and 390px mobile widths with no horizontal overflow. Reviewed operator/history using a temporary read-only fixture, removed after verification. TypeScript and whitespace checks passed.

## Match controls and individual servers

- Replaced browser confirm popups for End/Reset with in-page confirmation and cancellation. Fixed the scoring engine reset guard for naturally completed matches.
- Added pair/player service selection with persisted four-player order, automatic game/tiebreak rotation and named serving marker in shared board/overlay. Fixed receiving pair starting the set after a tiebreak.
- Checked in-page confirmation and current server visually on NY4VBX without ending/resetting that match. Disposable authenticated database integration passed server selection, scoring, manual finish/reset, naturally completed reset, and scoring after reset; temporary match/user removed.
- TypeScript passed; full suite: 116 passed, one optional live test skipped.

## Signed-in new match and latest-board reuse

- Dashboard and empty-state creation links now open /dashboard/new, protected by the existing session/profile checks. The wizard renders in the workspace without the landing-page content.
- The newest match owned by the current user supplies design, players and rules. Runtime clock and scoring history are cleared; saving creates and claims a separate match, then opens its operator directly.
- Header offers a fresh board or return to latest-board defaults. Browser review confirmed both modes stay at /dashboard/new and the reused design is preselected. TypeScript and the reuse isolation test passed.

## Browser studio and saved scoreboard editing

- Added owner-only /m/[code]/studio and /m/[code]/edit, linked from match controls. Studio supports camera selection/start/stop, mirror, board placement/size, realtime scores, scoring controls and a clean fullscreen/tab view (Esc or double-tap to return). Video tracks stop on replacement/unmount; permission/device failures have actionable messages.
- This version composes a camera and board locally for tab sharing through another streaming service; it does not transmit directly to a platform. Microphone selection belongs to that service.
- Saved-board editor previews live points with unsaved visual changes; owner-only design PATCH accepts presentation fields only and retries concurrent score changes without replacing clock/history.
- Reviewed studio idle state and editor desktop/mobile screenshots. Physical camera capture and external tab broadcast still require manual verification with user permission; no camera was activated during automated review.
- Full suite: 130 passed, one optional live test skipped. TypeScript passed. Disposable authenticated database check confirmed design edits preserve points/clock/undo, and cleaned up its user/match.

## Compact scoreboard, Star Point notation and notices

- Tightened shared frame padding, row gaps, corners and score cells, with stronger default name typography; explicit custom font/row settings remain editable. Reviewed compact 420px examples against the user reference.
- Display notation: AD for ordinary advantage; AD1/AD2 for Star Point advantages; initial deuce remains 40/40, subsequent returns display D1 and D2. Scoring engine unchanged.
- Shared scoreboards now derive break/set/match notices alongside Star/Golden Point and animate an aligned strip with a gentle fade/slide/collapse. Supports reduced-motion preferences. Three-character point labels fit compact cells.
- Temporary fixture removed after screenshot review; no live match score changed.
