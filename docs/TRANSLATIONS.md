# Translations Guide

This guide covers translating django-unfold into new languages and updating
existing translations.

## Current Languages

| Language | Code | BIDI | Translation % | Notes |
|----------|------|------|---------------|-------|
| English | `en` | No | 100% (source) | Source language |
| Persian | `fa` | Yes | 100% | Complete with RTL support |

## File Locations

Translation files live in `src/unfold/locale/`:

```
src/unfold/locale/
├── en/
│   └── LC_MESSAGES/
│       ├── django.po    # English source strings
│       └── django.mo    # Compiled binary
└── fa/
    └── LC_MESSAGES/
        ├── django.po    # Persian translations
        └── django.mo    # Compiled binary
```

## Adding a New Language

### 1. Add the language to Django settings

In your project's `settings.py`:

```python
LANGUAGES = (
    ("fa", _("Persian")),
    ("ar", _("Arabic")),   # New language
    ("en", _("English")),
)
```

For RTL languages (Arabic, Hebrew, Urdu), also add to `UNFOLD["LANGUAGES"]["navigation"]`:

```python
UNFOLD = {
    "SHOW_LANGUAGES": True,
    "LANGUAGES": {
        "navigation": [
            {"bidi": True, "code": "fa", "name": "Persian", "name_local": "فارسی", "name_translated": "Persian"},
            {"bidi": True, "code": "ar", "name": "Arabic", "name_local": "العربية", "name_translated": "Arabic"},
            {"bidi": False, "code": "en", "name": "English", "name_local": "English", "name_translated": "English"},
        ],
    },
}
```

### 2. Extract strings

#### Option A: Using GNU gettext (recommended)

```bash
cd src/unfold/
django-admin makemessages -l ar --no-location
```

This requires `gettext` to be installed:
- Debian/Ubuntu: `sudo apt install gettext`
- macOS: `brew install gettext`
- Windows: download from GNU

#### Option B: Using the bundled script (no gettext required)

```bash
python3 /home/z/my-project/scripts/build_locale.py
```

This uses the `polib` Python library to extract strings and generate `.po` files.

### 3. Translate the strings

Open `src/unfold/locale/ar/LC_MESSAGES/django.po` in a text editor or a
translation tool like [Poedit](https://poedit.net/) or
[Weblate](https://weblate.org/).

For each `msgid` entry, fill in the `msgstr`:

```po
msgid "Welcome"
msgstr "مرحبا"

msgid "Filters"
msgstr "مرشحات"

msgid "All applications"
msgstr "كل التطبيقات"
```

### 4. Compile translations

```bash
cd src/unfold/
django-admin compilemessages
```

Or with the bundled script:

```bash
python3 /home/z/my-project/scripts/build_locale.py
```

This generates `.mo` binary files that Django reads at runtime.

### 5. Test

```bash
# Change LANGUAGE_CODE in settings.py
LANGUAGE_CODE = "ar"

# Restart the server
python manage.py runserver

# Visit the admin and verify translations
open http://127.0.0.1:8000/admin/
```

## Updating Existing Translations

When new strings are added to templates or Python code:

### 1. Re-extract strings

```bash
cd src/unfold/
django-admin makemessages -l fa --no-location
django-admin makemessages -l en --no-location
```

This updates the `.po` files with new `msgid` entries (with empty `msgstr`).

### 2. Translate new strings

Open the `.po` file and fill in `msgstr` for entries marked `#, fuzzy` or
with empty `msgstr`.

### 3. Compile

```bash
django-admin compilemessages
```

### 4. Test

Restart the server and verify the new translations appear.

## Translation Guidelines

### Persian (Farsi)

- Use formal tone (شما not تو)
- Use Persian digits (۰-۹) in user-facing strings
- Keep technical terms in English when appropriate (e.g., "API", "URL")
- Translate UI labels concisely (avoid long phrases in buttons)
- For ambiguous English words, choose the Persian equivalent based on context:
  - "Save" → "ذخیره" (not "نگه‌داشتن")
  - "Delete" → "حذف" (not "پاک کردن" — which means "clean")
  - "Cancel" → "انصراف" (not "لغو" — which is more formal)
  - "Submit" → "ثبت" (not "ارسال" — which means "send")
  - "Filter" → "فیلتر" (loanword, common in Persian tech)
  - "Search" → "جستجو" (not " searching" transliterated)

### Plural forms

Persian has only one plural form. The `.po` header should have:

```po
"Plural-Forms: nplurals=1; plural=0;\n"
```

For English (two plural forms):

```po
"Plural-Forms: nplurals=2; plural=(n != 1);\n"
```

### Placeholders

Preserve Python placeholders exactly:

```po
msgid "Found %(counter)s result in %(seconds)s seconds."
msgstr "%(counter)s نتیجه در %(seconds)s ثانیه پیدا شد."
```

Don't translate `%(counter)s` or `%(seconds)s` — they're variables.

### HTML entities

Preserve HTML entities:

```po
msgid "This item will be deleted."
msgstr "این مورد حذف خواهد شد."
```

Don't add HTML tags unless they're in the source string.

## Translation Tools

### Poedit

Cross-platform GUI for editing `.po` files.
- Download: https://poedit.net/
- Free for basic use, paid for advanced features (translation memory, etc.)

### Weblate

Self-hosted or hosted translation platform with review workflow.
- Hosted: https://weblate.org/
- Self-hosted: `docker-compose up` from https://github.com/WeblateOrg/weblate

### GNU gettext utilities

Command-line tools for working with `.po` files:

```bash
# Show translation statistics
msgfmt --statistics fa/LC_MESSAGES/django.po

# Merge new strings into existing translations
msgmerge --update --no-location fa/LC_MESSAGES/django.po django.pot

# Check for errors
msgfmt -c -v -o /dev/null fa/LC_MESSAGES/django.po
```

## Translation Memory

To speed up translation of similar strings, use translation memory:

### With Poedit

1. Edit → Preferences → Translation Memory
2. Enable "Use translation memory"
3. Poedit will suggest similar translations from your previous work

### With Weblate

Weblate has built-in translation memory that suggests similar strings
across all projects.

## Quality Checks

### Mandatory checks before submitting translations

1. **Compile without errors:**
   ```bash
   django-admin compilemessages
   ```
   Should produce no errors.

2. **No empty msgstr:**
   ```bash
   grep -c 'msgstr ""$' src/unfold/locale/fa/LC_MESSAGES/django.po
   ```
   Should return only the header count (1), not additional entries.

3. **No fuzzy entries:**
   ```bash
   grep -c '#, fuzzy' src/unfold/locale/fa/LC_MESSAGES/django.po
   ```
   Should return 0.

4. **Placeholder preservation:**
   ```bash
   # Extract all msgid lines with placeholders
   grep 'msgid ".*%(' src/unfold/locale/fa/LC_MESSAGES/django.po
   # Verify each has matching placeholders in msgstr
   ```

5. **Test in browser:**
   - Switch to the language
   - Visit every admin page
   - Verify no English text leaks through

## Strings Shared with Django Admin

Some strings in Unfold are also in Django's bundled admin translations:
- "Save", "Delete", "Log in", "Log out", "History", "View on site",
  "Change password", etc.

For these strings, Django's bundled `fa` translations take precedence
(unless you explicitly translate them in Unfold's `.po` file).

To use Django's translations, leave the `msgstr` empty in Unfold's `.po`:

```po
msgid "Save"
msgstr ""  # Will use Django's bundled translation
```

To override Django's translation, fill in the `msgstr`:

```po
msgid "Save"
msgstr "ذخیره کردن"  # Overrides Django's "ذخیره"
```

## Bundled Scripts

The following scripts in `/home/z/my-project/scripts/` help with translation:

### `build_locale.py`

Extracts translatable strings from Python and template files, generates
`.po` files for `en` and `fa`, and compiles `.mo` files. Does not require
GNU gettext.

```bash
python3 /home/z/my-project/scripts/build_locale.py
```

### `translate_fa.py`

Fills in Persian translations for Unfold-specific strings (phase 1: 87 strings).

```bash
python3 /home/z/my-project/scripts/translate_fa.py
```

### `translate_fa_phase6.py`

Fills in Persian translations for remaining strings (phase 6: 78 strings).

```bash
python3 /home/z/my-project/scripts/translate_fa_phase6.py
```

### `extract_translations.py`

Uses Django's `makemessages` command (requires GNU gettext).

```bash
python3 /home/z/my-project/scripts/extract_translations.py
```

## Contributing Translations

If you want to contribute translations for a new language:

1. Fork the repository
2. Follow the steps in [Adding a New Language](#adding-a-new-language)
3. Translate all strings
4. Add tests in `tests/test_persian_rtl.py` (or a new `test_<lang>_rtl.py`)
5. Open a pull request

We welcome translations for:
- Arabic (`ar`)
- Hebrew (`he`)
- Urdu (`ur`)
- Kurdish (`ckb`)
- Azerbaijani (`az`)
- And any other language!

## RTL Language Support

For RTL languages, in addition to translations, you need:

1. **Font:** Bundle an appropriate font in `src/unfold/static/unfold/fonts/`
2. **CSS override:** Add a `[dir="rtl"][lang="<code>"]` rule in `styles.css`:
   ```css
   [dir="rtl"][lang="ar"] {
     --font-sans: 'Noto Naskh Arabic', 'Inter', sans-serif;
   }
   ```
3. **Test:** Verify the layout works in RTL mode

See the [RTL & Persian (Jalali) Support](./configuration/rtl-and-jalali.md)
guide for details on how RTL is implemented.
