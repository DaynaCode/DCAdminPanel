---
title: RTL & Persian (Jalali) Support
order: 15
description: Complete guide for enabling right-to-left layout, Persian (Vazirmatn) font, and Jalali (Persian Solar) calendar in Django Unfold admin panel.
---

# RTL & Persian (Jalali) Calendar Support

Unfold ships with first-class support for right-to-left (RTL) languages, including Persian (Farsi), Arabic, Hebrew, and Urdu. This guide covers everything you need to set up a fully-localized Persian admin panel, including:

- Automatic RTL layout switching via the `dir` attribute on `<html>`
- Persian (Vazirmatn) font loaded only when the document is RTL
- Logical CSS properties throughout the codebase (no manual CSS overrides needed)
- Jalali (Persian Solar) calendar widget for date inputs
- Jalali date/datetime display in history pages, recent actions, and date hierarchy
- Persian translations for all Unfold-specific strings

## Quick start (Persian)

Add the following to your `settings.py`:

```python
# settings.py

LANGUAGE_CODE = "fa"  # Default language: Persian

USE_I18N = True
USE_L10N = True

LANGUAGES = (
    ("fa", _("Persian")),
    ("en", _("English")),
)

MIDDLEWARE = [
    # ... other middleware ...
    "django.middleware.locale.LocaleMiddleware",  # Required for language switching
    # ...
]

LOCALE_PATHS = [
    # Add Unfold's locale directory so its translations are loaded
    BASE_DIR / "path/to/unfold/locale",
]

UNFOLD = {
    "SHOW_LANGUAGES": True,
    "LANGUAGES": {
        "navigation": [
            {
                "bidi": True,       # ← KEY: marks this as an RTL language
                "code": "fa",
                "name": "Persian",
                "name_local": "فارسی",
                "name_translated": "Persian",
            },
            {
                "bidi": False,
                "code": "en",
                "name": "English",
                "name_local": "English",
                "name_translated": "English",
            },
        ],
    },
}
```

Then in `urls.py`, expose the language-switching endpoint:

```python
# urls.py

from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Language switch endpoint — must NOT be inside i18n_patterns
    path("i18n/", include("django.conf.urls.i18n")),
]

# Optional: wrap admin URLs with i18n_patterns for /fa/admin/, /en/admin/ URLs
# urlpatterns += i18n_patterns(path("admin/", admin.site.urls))

# Or keep admin URLs un-prefixed (language is set via session/cookie):
urlpatterns += [path("admin/", admin.site.urls)]
```

Visit `/admin/` — you should now see the panel in Persian with RTL layout.

## How RTL detection works

Unfold's `skeleton.html` (the root layout template) uses Django's built-in
`get_current_language_bidi` template tag to detect the document direction:

```django
{% load i18n static unfold %}

{% get_current_language as LANGUAGE_CODE %}
{% get_current_language_bidi as LANGUAGE_BIDI %}

<html lang="{{ LANGUAGE_CODE|default:"en-us" }}"
      dir="{{ LANGUAGE_BIDI|yesno:"rtl,ltr,auto" }}">
```

When `LANGUAGE_CODE` is set to a BIDI language (Persian, Arabic, Hebrew, Urdu),
Django's `get_current_language_bidi` returns `True`, which makes `dir="rtl"`.
The `<body>` element and all children inherit this direction.

## Font substitution

Unfold bundles two fonts:

| Font | License | Used for | When loaded |
|------|---------|----------|-------------|
| **Inter** | SIL OFL 1.1 | Latin, Cyrillic, Greek text | Always |
| **Vazirmatn** | SIL OFL 1.1 | Persian/Arabic text | Always (CSS handles fallback) |
| **Material Symbols** | Apache 2.0 | Icons | Always |

The CSS `@theme` block sets `--font-sans: 'Inter', 'Vazirmatn', sans-serif` by default.
When `[dir="rtl"]` is active, this is overridden to `'Vazirmatn', 'Inter', sans-serif`
so that Persian glyphs use Vazirmatn first.

Vazirmatn is loaded with `unicode-range` declarations, so browsers only fetch
the Persian glyphs when needed — there is no performance penalty for LTR users.

## CSS logical properties

Unfold's CSS uses **logical properties** (Tailwind's `ms-`, `me-`, `ps-`, `pe-`,
`start-`, `end-`, `border-s`, `border-e`, `text-start`, `text-end`) instead of
physical ones (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `border-l`,
`border-r`, `text-left`, `text-right`). This means the layout automatically
mirrors when `dir="rtl"` is set, with no additional configuration.

For cases where logical properties alone aren't enough (e.g., directional
icons like `arrow_forward` that should flip to `arrow_back` in RTL), Unfold
ships an `@layer rtl-overrides` block at the end of `styles.css` that
explicitly handles these cases under the `[dir="rtl"]` selector.

## Jalali calendar widget

When `LANGUAGE_BIDI` is true (i.e., the active language is RTL), Unfold loads
`jalali.js` — a self-contained Persian datepicker widget (~15 KB, no external
dependencies).

### How it works

1. Date input fields with `type="text"` get the `data-jalali-datepicker` attribute.
2. When the user focuses the field, a Persian calendar popup appears.
3. The user picks a date in Jalali (e.g., ۱۴۰۳/۰۶/۱۵).
4. The visible input shows the Jalali date, but the **submitted value** is the
   ISO Gregorian date (e.g., `2024-09-05`).

This means the server always receives Gregorian dates, so your database
storage and query logic don't need to change.

### Jalali conversion utilities (Python)

For server-side Jalali date formatting, Unfold provides the `unfold.jalali`
module:

```python
from datetime import date
from unfold.jalali import (
    gregorian_to_jalali,
    jalali_to_gregorian,
    format_jalali_date,
    format_jalali_datetime,
    parse_jalali_date,
    is_jalali_leap_year,
    to_persian_digits,
)

# Convert Gregorian -> Jalali
jy, jm, jd = gregorian_to_jalali(2026, 9, 3)
# (1405, 6, 12)

# Convert Jalali -> Gregorian
gy, gm, gd = jalali_to_gregorian(1405, 6, 12)
# (2026, 9, 3)

# Format a date with Persian month name and digits
format_jalali_date(date(2026, 9, 3), "%d %B %Y")
# '۱۲ شهریور ۱۴۰۵'

# Parse a Jalali string into a Gregorian date
parse_jalali_date("۱۴۰۵/۰۶/۱۲")
# datetime.date(2026, 9, 3)

# Check leap year
is_jalali_leap_year(1403)  # True
is_jalali_leap_year(1404)  # False

# Convert digits
to_persian_digits("1403/06/15")
# '۱۴۰۳/۰۶/۱۵'
```

### Jalali template filters

Load the filters with `{% load jalali %}` in any template:

```django
{% load jalali %}

{# Format a date as Jalali (auto-detects RTL/LTR) #}
{{ some_date|jalali_date }}
{# Renders: ۱۴۰۵/۰۶/۱۲ (in RTL mode) #}

{# Custom format #}
{{ some_date|jalali_date:"%d %B %Y" }}
{# Renders: ۱۲ شهریور ۱۴۰۵ #}

{# Datetime with time #}
{{ some_datetime|jalali_datetime }}
{# Renders: ۱۴۰۵/۰۶/۱۲ - ۱۴:۳۰ #}

{# Latin digits (for machine-readable fields) #}
{{ some_date|jalali_date_latin }}
{# Renders: 1405/06/12 #}

{# Parse a Jalali string back to Gregorian #}
{{ "1405/06/12"|jalali_parse|date:"Y-m-d" }}
{# Renders: 2026-09-03 #}

{# Template tags #}
{% jalali_today %}
{% jalali_year some_date %}
{% jalali_month_name some_date %}
```

These filters are **no-ops in LTR mode** — they fall back to Django's default
`date` filter formatting. So you can safely use them in templates that are
shared between LTR and RTL languages.

### Supported format codes

| Code | Meaning | Example |
|------|---------|---------|
| `%Y` | 4-digit Jalali year | 1405 |
| `%y` | 2-digit Jalali year | 05 |
| `%m` | 2-digit Jalali month (01-12) | 06 |
| `%n` | 1-digit Jalali month (1-12) | 6 |
| `%d` | 2-digit Jalali day (01-31) | 12 |
| `%e` | 1-digit Jalali day (1-31) | 12 |
| `%B` | Full Persian month name | شهریور |
| `%b` | Short Persian month name | شه |
| `%A` | Full Persian weekday name | شنبه |
| `%a` | Short Persian weekday name | ش |
| `%H` | 24-hour hour (00-23) | 14 |
| `%i` | Minutes (00-59) | 30 |
| `%s` | Seconds (00-59) | 45 |

## Persian translations

Unfold ships with a complete Persian translation file at
`src/unfold/locale/fa/LC_MESSAGES/django.po` (compiled to `.mo` at build time).

All 165 Unfold-specific strings are translated, including:

- Sidebar navigation items
- Header and toolbar labels
- Login page text
- Form widget labels (Date, Time, Value, etc.)
- Filter labels (All, Yes, No, From, To)
- Command palette strings (Type to search, No results found)
- Action labels (Save, Delete, Cancel, Run)
- Modal dialogs and confirmations

Strings shared with Django admin (e.g., "Log in", "Save", "Delete") use
Django's bundled `fa` translations automatically.

### Re-extracting and updating translations

To extract new strings after modifying templates or Python code:

```bash
cd src/unfold/
django-admin makemessages -l fa --no-location
django-admin compilemessages
```

Or use the bundled script (if GNU gettext is not installed):

```bash
python3 /path/to/scripts/build_locale.py
python3 /path/to/scripts/translate_fa.py
```

## Adding a new RTL language

To add another RTL language (e.g., Arabic):

1. Add it to `LANGUAGES`:

   ```python
   LANGUAGES = (
       ("fa", _("Persian")),
       ("ar", _("Arabic")),
       ("en", _("English")),
   )
   ```

2. Add it to `UNFOLD["LANGUAGES"]["navigation"]` with `bidi: True`:

   ```python
   UNFOLD = {
       "SHOW_LANGUAGES": True,
       "LANGUAGES": {
           "navigation": [
               {"bidi": True, "code": "fa", "name": "Persian", "name_local": "فارسی", "name_translated": "Persian"},
               {"bidi": True, "code": "ar", "name": "Arabic", "name_local": "العربية", "name_translated": "Arabic"},
               {"bidi": False, "code": "en", "name": "English", "name_local": "English", "name_translated": "English"},
           ]
       }
   }
   ```

3. Extract and translate strings:

   ```bash
   cd src/unfold/
   django-admin makemessages -l ar
   # Edit locale/ar/LC_MESSAGES/django.po
   django-admin compilemessages
   ```

4. (Optional) If the language uses a different script, bundle an appropriate
   font in `src/unfold/static/unfold/fonts/<fontname>/` and add a
   `[dir="rtl"][lang="<code>"]` CSS override.

## Known limitations

1. **Date input widget**: The Jalali datepicker is JavaScript-based and
   requires JavaScript to be enabled. Without JS, the input falls back to a
   plain text field where users can type a Jalali date manually.

2. **Time picker**: The time picker still uses Django's standard 24-hour
   `clockbox` widget. Times themselves are not localized (e.g., "14:30" stays
   the same in both LTR and RTL).

3. **Chart.js axes**: Chart axes are LTR by default. To flip them, you may
   need to set `Chart.defaults.rtl = true` in your own JS.

4. **Custom Unfold extensions**: If you've written custom `unfold.contrib.*`
   modules or template overrides, you'll need to migrate any physical CSS
   properties (`left-`, `right-`, `ml-`, `mr-`) to logical equivalents
   (`start-`, `end-`, `ms-`, `me-`) yourself.

## Testing RTL

Unfold's test suite includes comprehensive RTL tests in
`tests/test_persian_rtl.py`. To run them:

```bash
pytest tests/test_persian_rtl.py -v
```

The tests cover:
- HTML `dir` attribute rendering
- Vazirmatn font loading
- Jalali calendar conversion accuracy (9 known reference dates)
- Jalali template filters
- Persian translations
- CSS logical properties (no physical properties remaining)
- THIRD-PARTY-NOTICES completeness

## Third-party licenses

See [`THIRD-PARTY-NOTICES.md`](https://github.com/DaynaCode/DCAdminPanel/blob/main/THIRD-PARTY-NOTICES.md)
for a complete list of bundled third-party components and their licenses,
including:

- **Vazirmatn Font** (SIL OFL 1.1) — Persian font by Saber Rastikerdar
- **Inter Font** (SIL OFL 1.1) — Latin font by The Inter Project Authors
- **Material Symbols** (Apache 2.0) — Icon font by Google
- **Jalali Algorithm** (MIT) — Based on jalaali-js by Behnood Hodai
- **Alpine.js, htmx, Chart.js, Trix** — various MIT/BSD licenses
