# Testing Guide

This guide covers running and writing tests for django-unfold.

## Quick Start

```bash
# Install test dependencies
pip install pytest pytest-django pytest-factoryboy pytest-mock pytest-cov factory-boy polib

# Run all tests
pytest tests/

# Run with verbose output
pytest tests/ -v --no-cov

# Run Persian RTL tests only
pytest tests/test_persian_rtl.py -v
```

## Test Categories

| File | Tests | What it covers |
|------|-------|----------------|
| `test_persian_rtl.py` | 89 | Persian RTL, Vazirmatn font, Jalali calendar, translations |
| `test_pages.py` | ~30 | Basic page rendering |
| `test_widgets.py` | ~20 | Form widgets |
| `test_filters.py` | ~15 | Admin filters |
| `test_actions.py` | ~10 | Admin actions |
| `test_inlines.py` | ~10 | Inline admin |
| `test_tags.py` | ~20 | Template tags |
| `test_*.py` | others | Various features |

**Total: 525 tests** (436 existing + 89 new Persian RTL)

## Persian RTL Tests

The `tests/test_persian_rtl.py` file contains 89 tests organized into classes:

### TestBaseSiteI18n
Verifies `admin/base_site.html` loads the `i18n` template tag library.

### TestSettingsConfig
Verifies the test server settings have proper i18n infrastructure:
- `USE_I18N = True`
- `LANGUAGES` includes `fa`
- `LOCALE_PATHS` is configured
- `LocaleMiddleware` is present

### TestVazirmatnFont
Verifies the Vazirmatn font is properly bundled:
- All 8 woff2 files exist (4 weights × 2 subsets)
- LICENSE file exists and references SIL OFL
- `styles.css` exists with proper @font-face declarations
- `skeleton.html` loads the font CSS

### TestCSSLogicalProperties
Verifies CSS uses logical properties (not physical):
- Source CSS has at least 10 logical property occurrences
- No physical utility classes (`ml-`, `mr-`, `pl-`, `pr-`, etc.)
- `@layer rtl-overrides` block exists
- Compiled CSS has the RTL patch markers
- Compiled CSS has Vazirmatn font directive

### TestLocaleFiles
Verifies translation files:
- `.po` and `.mo` files exist for both `en` and `fa`
- Persian `.po` has at least 80 translated entries
- Metadata is correct (Language, Language-Team)

### TestPersianTranslations
Verifies key Persian translations are active:
- `gettext("Welcome")` returns `"خوش آمدید"`
- `gettext("Filters")` returns `"فیلترها"`
- `gettext("All applications")` returns `"همه برنامه‌ها"`
- And more...

### TestSkeletonHTMLRendering
Verifies HTML rendering:
- `dir="rtl"` for Persian, `dir="ltr"` for English
- `skeleton.html` uses `LANGUAGE_BIDI` for `dir` attribute
- `jalali.js` is conditionally loaded

### TestJalaliConversion
Verifies the Jalali calendar conversion algorithm:
- 9 known reference dates (Gregorian → Jalali)
- 9 round-trip conversions (Jalali → Gregorian)
- Leap year detection (1399, 1403, 1408 = leap; 1400, 1401, 1402, 1404 = non-leap)
- Month length (Esfand has 30 days in leap years, 29 otherwise)
- Date formatting with Persian digits
- Date formatting with month names
- Date parsing (Latin and Persian digits)
- Datetime formatting
- `to_persian_digits()` function
- `get_jalali_today()` function

### TestJalaliJS
Verifies the JavaScript Jalali widget:
- File exists and is at least 5KB
- Exposes `window.UnfoldJalali` API
- Has Persian month names
- Has calendar popup HTML
- Has Persian digit conversion

### TestPersianAdminRendering
Verifies admin page rendering in Persian:
- Login page has Persian text
- Login page has `dir="rtl"` for Persian, `dir="ltr"` for English
- Login page loads Vazirmatn font CSS
- Dashboard renders in Persian with `dir="rtl"`
- Dashboard loads `jalali.js` only in RTL mode
- Dashboard does NOT load `jalali.js` in LTR mode

### TestJalaliTemplateFilters
Verifies the `{% load jalali %}` template filters:
- `|jalali_date` in RTL and LTR modes
- `|jalali_datetime` in RTL mode
- `|jalali_date_latin` (always Latin digits)
- `{% jalali_today %}` tag
- `{% jalali_year %}` tag
- `{% jalali_month_name %}` tag
- `|jalali_parse` filter (Latin and Persian digits)
- `|is_jalali_leap` filter

### TestJalaliJSEnhanced
Verifies enhanced calendar features:
- Today button
- Clear button
- Year/month dropdown selectors
- Prev/Next year navigation
- Prev/Next month navigation
- Friday highlighting
- Keyboard navigation (Arrow keys, Escape, Enter)
- Gregorian tooltip
- Dark mode support
- Persian placeholder
- htmx support
- Full weekday names
- Responsive design
- `toLatinDigits()` helper
- `closePopup()` public API
- Popup width is 340px

### TestThirdPartyNotices
Verifies `THIRD-PARTY-NOTICES.md`:
- File exists
- Covers Vazirmatn
- Covers all bundled fonts (Inter, Material Symbols, Vazirmatn)
- Covers all JS libraries (Alpine.js, htmx, Chart.js, Trix)
- Covers Jalali algorithm
- Has license compatibility notes
- Has update procedure

## Running Tests

### All tests

```bash
pytest tests/ -v
```

### Specific test class

```bash
pytest tests/test_persian_rtl.py::TestJalaliConversion -v
```

### Specific test method

```bash
pytest tests/test_persian_rtl.py::TestJalaliConversion::test_gregorian_to_jalali_all_cases -v
```

### By keyword

```bash
pytest tests/ -k "jalali" -v
```

### With coverage

```bash
pytest tests/ --cov=unfold --cov-report=html
open htmlcov/index.html
```

### Stop on first failure

```bash
pytest tests/ -x
```

### Drop to pdb on failure

```bash
pytest tests/ --pdb
```

### Run in parallel (faster)

```bash
pip install pytest-xdist
pytest tests/ -n auto
```

## Writing New Tests

### Test file naming

- `test_<feature>.py` for feature-specific tests
- `test_<module>.py` for module-specific tests

### Test class naming

- `Test<Feature>` — e.g., `TestJalaliConversion`
- Use descriptive names

### Test method naming

- `test_<what_it_tests>` — e.g., `test_gregorian_to_jalali_all_cases`
- Use snake_case

### Example

```python
import pytest
from django.test import override_settings
from http import HTTPStatus


@pytest.mark.django_db
class TestMyFeature:
    """Tests for my new feature."""

    def test_basic_functionality(self, admin_client):
        """Test the basic happy path."""
        response = admin_client.get("/admin/")
        assert response.status_code == HTTPStatus.OK

    @override_settings(LANGUAGE_CODE="fa", USE_I18N=True)
    def test_persian_translation(self, admin_client):
        """Test that the feature works in Persian."""
        from django.utils.translation import activate
        activate("fa")
        response = admin_client.get("/admin/")
        assert "خوش آمدید" in response.content.decode("utf-8")
```

### Using factories

```python
from tests.factories import UserFactory

def test_user_creation():
    user = UserFactory(username="testuser")
    assert user.username == "testuser"
```

### Using fixtures

```python
@pytest.fixture
def persian_settings(settings):
    settings.LANGUAGE_CODE = "fa"
    settings.USE_I18N = True
    yield
    # Reset happens automatically with override_settings

def test_with_persian(persian_settings, admin_client):
    response = admin_client.get("/admin/")
    assert "خوش آمدید" in response.content.decode("utf-8")
```

## Continuous Integration

Tests run automatically on GitHub Actions on every push and pull request.
See `.github/workflows/test.yml` for the configuration.

The CI matrix runs tests on:
- Python 3.12, 3.13, 3.14
- Django 5.2, 6.0, 6.1, main

## Test Coverage

Current coverage: ~95.5% (see `pyproject.toml` `[tool.coverage.report]`).

To check coverage:

```bash
pytest tests/ --cov=unfold --cov-report=term-missing
```

Look for files with low coverage and add tests for missing lines.
