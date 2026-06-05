# thisfindsyou.com — Architecture Notes

Local planning document. Listed in `.gitignore` — never committed.

---

## Stack

Pure static HTML/CSS/JS. No framework, no build system, no dependencies.
Hosted on GitHub Pages with custom domain via `CNAME`.
Font: Google Fonts CDN — `Old Standard TT` (serif).

---

## Site Structure

```
website/
├── index.html              → / (Calendar — full month grid, defaults to June 2026)
├── portfolio.html          → /portfolio
├── blog.html               → /blog (Blog index)
├── january.html            → /january (Calendar + file explorer)
├── february.html           → /february (Calendar + file explorer)
├── march.html through
│   december.html           → /[month] (Calendar + file explorer for all 12 months)
├── blog/
│   ├── post-template.html  → starter template for new posts
│   └── YYYY-MM-DD-slug.html → individual posts, e.g. 2026-06-05-first-note.html
├── assets/
│   ├── images/
│   ├── audio/
│   └── data/
│       └── calendar.json   → date → files mapping for file explorer
├── CNAME                   → thisfindsyou.com
└── .gitignore              → ARCHITECTURE.md
```

---

## Nav Pattern (dropdown)

All pages share the same nav component. `thisfindsyou` sits fixed top-left.
On hover (desktop) or tap (mobile), a dropdown reveals four links in a file-system tree style.

```
┌─ thisfindsyou    ← button text + box border on hover/tap
├── calendar
├── portfolio
├── blog
└── contact
```

**HTML:**
```html
<nav class="site-nav" id="siteNav">
    <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-label="Menu">thisfindsyou</button>
    <div class="nav-dropdown" id="navDropdown">
        <a href="/">calendar</a>
        <a href="/portfolio">portfolio</a>
        <a href="/blog">blog</a>
        <a href="mailto:clovehitch@thisfindsyou.com">contact</a>
    </div>
</nav>
```

**Visual Design:**
- `.site-nav` has permanent `padding: 0.3rem 0.8rem 0.3rem 0.5rem` to keep layout stable (no jitter on hover)
- `.site-nav` position compensated: `top: calc(20px - 0.3rem); left: calc(20px - 0.5rem)` so the button text stays at original screen position
- On hover or `.open` state: background + backdrop-filter blur appear
- Tree lines drawn with CSS borders (no Unicode characters):
  - `::before` on each `<a>` — horizontal branch (`border-top`) at vertical midpoint
  - `::after` on each `<a>` — vertical stem (`border-left`), full height; half height on last item
- All border lines are `1px solid rgba(255,255,255,0.2)`
- Toggle text goes to `opacity: 1` when hovered or when dropdown is open (via `:has(.nav-dropdown.open)`)

**Behavior:**
- Desktop: CSS `:hover` reveals dropdown (gated behind `@media (hover: hover)`)
- Mobile: JS click toggle adds/removes `.open` class on `.nav-dropdown` — second tap closes it
- Clicking outside nav closes the dropdown
- `aria-expanded` attribute updated on toggle for accessibility

**JS (inline at bottom of each page's `<body>`):**
```js
(function() {
    var toggle = document.getElementById('navToggle');
    var dropdown = document.getElementById('navDropdown');
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#siteNav')) {
            dropdown.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
})();
```

---

## Blog Structure

### blog.html (index)

- Lists all posts in reverse-chronological order
- Each entry shows: date | type tag (post / note) | title | one-line excerpt
- "post" = longer form writing; "note" = shorter update
- Matches site aesthetic: `#111` bg, `Old Standard TT`, same nav + social footer

### Individual posts — `blog/YYYY-MM-DD-slug.html`

File naming convention: `blog/2026-06-05-first-note.html`

Each post contains:
- Same nav and social footer as all other pages
- Constrained-width reading column (~65ch max-width)
- Post header: date + type tag + title
- Body text
- Back link: `← blog` at the bottom

### Post types

| Type  | Description                         |
|-------|-------------------------------------|
| post  | Longer-form writing, 200+ words     |
| note  | Short update, thought, or fragment  |

---

## Adding a New Blog Post

1. Copy `blog/post-template.html` to `blog/YYYY-MM-DD-your-slug.html`
2. Fill in: date, type (post or note), title, excerpt (one line), body text
3. Add an entry to the top of the `<ul class="post-list">` in `blog.html`
4. Done — push to GitHub, GitHub Pages deploys automatically

Entry format for `blog.html`:
```html
<li class="post-entry">
    <div class="post-meta">
        <span class="post-date">Jun 05, 2026</span>
    </div>
    <a href="/blog/2026-06-05-your-slug" class="post-title">your title here</a>
</li>
```

---

## Calendar Feature (File Explorer)

### Overview

The calendar is now a **date-based audio file explorer**. Users can navigate through months and days, with files mapped to specific dates via `assets/data/calendar.json`.

**Key behaviors:**
- Homepage (`/`) defaults to June 2026 full calendar view
- Each month page (`/january`, `/february`, etc.) shows calendar grid + file player
- Arrow keys navigate between days with files (skips empty days)
- Month wraps seamlessly (December ↔ January)
- Selected day is highlighted on calendar
- Current file name displayed prominently

### Data Structure: `assets/data/calendar.json`

Maps dates to audio files:

```json
{
  "2026-01": [
    {
      "day": 4,
      "files": ["decaf.mp3", "twothousandand8.mp3", "hanging.mp3"]
    },
    {
      "day": 15,
      "files": ["another-file.mp3"]
    }
  ],
  "2026-02": [],
  ...
}
```

**Structure:**
- Top level: months as keys (format: `YYYY-MM`)
- `day`: numeric day of month (1-31)
- `files`: array of audio filenames in `assets/audio/`

### Adding Files to Calendar

1. Place audio file in `assets/audio/` with name: `YYYY-MM-DD-filename.mp3`
   - Example: `2026-01-15-my-demo.mp3`
2. Add entry to `assets/data/calendar.json`:
   ```json
   {
     "2026-01": [
       {"day": 15, "files": ["2026-01-15-my-demo.mp3"]}
     ]
   }
   ```
3. Day 15 will appear with white dot indicator on calendar
4. Files are auto-playable with arrow keys

### Month Pages Structure

All month pages (`january.html` through `december.html`) share the same structure:

**Template elements:**
- Calendar grid (7 columns, proper day positioning)
- Month navigation buttons (← Month Name →)
- Hero image with audio player
- File info display (date + filename)
- Previous/next audio track buttons
- Arrow key handlers:
  - `→`: Next day with files (auto-play)
  - `←`: Previous day with files (auto-play)
  - `SPACE`: Play/pause toggle
  - Auto-navigation to adjacent month on boundary

**Month-specific initialization:**
- `currentMonthIndex` set to 0-11 (0=January, 11=December)
- Image references month-specific artwork (if available)
- Loads calendar data from `assets/data/calendar.json`

### Creating New Month Artwork

When adding artwork for months without images:

1. Create artwork: ~1800px wide, 4:3 aspect ratio
2. Convert to WebP: `cwebp -q 82 artwork.jpg -o assets/images/[month].webp`
3. Month page will reference automatically (already configured in month templates)
4. Responsive image scaling handled by CSS

### Homepage Calendar (index.html)

The homepage shows a calendar grid defaulting to June 2026:

**Features:**
- Month navigation buttons cycle through all 12 months
- Day cells show white dot indicator if files exist
- Click any day with files to select it
- Selected day highlights (inverted colors)
- File info displays selected day + filename
- Random fortune quote at bottom
- Same responsive design as month pages

---

## File Naming Conventions

- Month pages: `[month].html` (lowercase, at root)
- Blog posts: `blog/YYYY-MM-DD-slug.html` (lowercase, hyphenated)
- Images: `assets/images/[name].webp` (WebP format; no `&` in filenames — use `sjar` not `s&jar`)
- Audio: `assets/audio/[trackname].mp3`

## Image Optimization

All images are converted to WebP for 94% smaller file sizes and better compression:

| Category | Format | Processing | Loading |
|---|---|---|---|
| Hero images (january, february) | WebP, 1800px wide | Resized from 4032px | `<link rel="preload">` in `<head>` |
| Calendar thumbnails | WebP, 600px wide | Resized from 4032px | `loading="lazy"` |
| Portfolio images | WebP, original dimensions or smaller | Converted, not resized | `loading="lazy"` |

**All `<img>` tags include:**
- `width` and `height` attributes matching the WebP's natural dimensions (prevents layout shift)
- `loading="lazy"` for images below the fold (portfolio grid, calendar thumbnails)
- Preload link for heroes: `<link rel="preload" as="image" href="assets/images/january.webp">`

**When adding new images:**
1. Export/save as PNG or JPG
2. Convert to WebP: `cwebp -q 82 original.jpg -o new.webp`
3. For large images (>2000px): resize before encoding: `sips -z 1800 1800 large.png --out resized.png && cwebp -q 82 resized.png -o output.webp`
4. Update `<img src>` to `.webp` filename
5. Add `width` and `height` attributes (get dimensions: `sips -g pixelWidth -g pixelHeight file.webp`)
6. Add `loading="lazy"` if below the fold

---

## Color Reference

| Page      | Accent Color | Background |
|-----------|-------------|------------|
| Calendar  | white        | #111       |
| Portfolio | white        | #111       |
| Blog      | white        | #111       |
| January   | #a8c1a2 (sage green) | #000 (dynamic) |
| February  | #da6851 (rust red)   | #000 (dynamic) |
