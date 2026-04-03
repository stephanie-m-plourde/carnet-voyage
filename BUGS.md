# Known Bugs

## BUG-001: "Invalid Date" on all article dates
- **Severity:** Critical
- **Where:** Home page article cards, Voyage detail article list, Article detail header
- **Affected sizes:** All (desktop, tablet, mobile)
- **Details:** The API returns valid ISO dates (e.g. `"2026-04-10T00:00:00.000Z"`) but the frontend displays "Invalid Date". The JavaScript date formatting function fails to convert the `article_date` field.
- **Status:** Open

## BUG-002: Hidden views block navigation clicks (z-index / pointer-events)
- **Severity:** Critical
- **Where:** Main nav bar links ("À propos", "Contact")
- **Affected sizes:** All
- **Details:** All SPA views (`view-home`, `view-voyage`, `view-article`, `view-apropos`, `view-contact`, `view-admin`) are rendered as `display: block`, `opacity: 1`, `pointer-events: auto` even when not the active view. The inactive views' breadcrumb navs stack on top of the main navigation bar, making "À propos" and "Contact" nav links unclickable. The `<nav class="breadcrumb" id="art-breadcrumb">` inside `view-article` is the specific element intercepting clicks. Inactive views should have `pointer-events: none` or `display: none`.
- **Status:** Open

## BUG-003: Nav bar shows stale breadcrumbs after view change
- **Severity:** Medium
- **Where:** Top nav bar when viewing About or Contact sections
- **Details:** After navigating to a voyage/article then to About or Contact, the nav bar still shows the article breadcrumb path ("ACCUEIL / JAPON 2026 / KYOTO ET LES CERISIERS EN FLEUR") instead of the normal nav links. Related to BUG-002 — the inactive views remain visible.
- **Status:** Open

## BUG-004: Formspree not configured warning on Contact form
- **Severity:** Low
- **Where:** Contact page, all sizes
- **Details:** Yellow banner: "Le formulaire n'est pas encore configuré. Allez dans Admin > À propos pour ajouter votre URL Formspree." Expected for local dev but should not appear in production.
- **Status:** Open
