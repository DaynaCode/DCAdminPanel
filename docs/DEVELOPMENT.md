---
title: Development
order: 101
description: Local development setup for django-unfold contributors — environment, dependencies, code style, debugging, and contribution workflow.
---

# Development Guide

This guide covers local development setup for contributors to the
Persian RTL fork of django-unfold.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Project Structure](#3-project-structure)
4. [Running the Test Server](#4-running-the-test-server)
5. [Code Style](#5-code-style)
6. [Pre-commit Hooks](#6-pre-commit-hooks)
7. [Debugging](#7-debugging)
8. [Writing Tests](#8-writing-tests)
9. [Contribution Workflow](#9-contribution-workflow)
10. [Releasing](#10-releasing)

---

## 1. Prerequisites

- **Python 3.12+** (3.13 or 3.14 also supported)
- **Node.js 18+** (only if you need to rebuild Tailwind CSS — see below)
- **Git 2.30+**
- **GNU gettext** (for `makemessages` — optional, only needed for translation work)
  - Debian/Ubuntu: `sudo apt install gettext`
  - macOS: `brew install gettext`
  - Windows: download from GNU

---

## 2. Quick Start

### 2.1 Clone the repository

```bash
git clone https://github.com/DaynaCode/DCAdminPanel.git
cd DCAdminPanel
git checkout feature/persian-rtl-jalali
```

### 2.2 Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
# On Windows: venv\Scripts\activate
```

### 2.3 Install dependencies

```bash
# Install hatchling (build backend) and unfold itself in editable mode
pip install hatchling
pip install -e . --no-deps

# Install dev dependencies
pip install -r <(python -c "
import tomllib
with open('pyproject.toml', 'rb') as f:
    data = tomllib.load(f)
for dep in data['dependency-groups']['dev']:
    print(dep)
")
```

Or, more simply, install the dev dependencies manually:

```bash
pip install \
    django \
    django-constance~=4.3.5 \
    django-crispy-forms~=2.6.0 \
    django-guardian~=3.3.3 \
    django-hijack~=3.7.8 \
    django-import-export~=4.4.1 \
    django-location-field~=2.7.3 \
    django-money~=3.6.1 \
    django-simple-history~=3.13.0 \
    django-waffle~=5.0.0 \
    pillow \
    pytest \
    pytest-django \
    pytest-factoryboy \
    pytest-mock \
    pytest-cov \
    factory-boy \
    six \
    polib \
    pre-commit
```

### 2.4 Run migrations and start the server

```bash
cd tests/server
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Open http://127.0.0.1:8000/admin/ and log in.

### 2.5 Switch to Persian

The default `LANGUAGE_CODE` is `en` (to keep existing tests green). To test
Persian, edit `tests/server/example/settings.py`:

```python
LANGUAGE_CODE = "fa"  # was "en"
```

Or use the language switcher in the top-right of the admin header.

### 2.6 Run tests

```bash
# From project root
pytest tests/ -v --no-cov

# Just the Persian RTL tests
pytest tests/test_persian_rtl.py -v --no-cov

# With coverage
pytest tests/ --cov=unfold --cov-report=html
open htmlcov/index.html
```

---

## 3. Project Structure

```
DCAdminPanel/
├── src/unfold/                  # Main package
│   ├── __init__.py
│   ├── admin.py                 # ModelAdmin base class
│   ├── apps.py                  # AppConfig
│   ├── checks.py                # System checks
│   ├── components.py            # UI components
│   ├── dataclasses.py
│   ├── decorators.py
│   ├── enums.py
│   ├── exceptions.py
│   ├── fields.py
│   ├── forms.py
│   ├── jalali.py                # Jalali calendar conversion (Python)
│   ├── layout.py
│   ├── mixins/                  # Admin mixins
│   ├── overrides.py
│   ├── paginator.py
│   ├── sections.py
│   ├── settings.py              # CONFIG_DEFAULTS
│   ├── sites.py                 # UnfoldAdminSite
│   ├── templatetags/
│   │   ├── unfold.py            # Main template tags
│   │   ├── unfold_list.py
│   │   └── jalali.py            # Jalali template filters
│   ├── templates/
│   │   ├── admin/               # Override of Django admin templates
│   │   ├── unfold/              # Unfold's own templates
│   │   │   ├── layouts/         # skeleton, base, base_simple, unauthenticated
│   │   │   ├── helpers/         # Reusable components
│   │   │   ├── widgets/         # Form widget templates
│   │   │   └── components/      # High-level components
│   │   ├── registration/        # Login, logout, password change
│   │   └── unfold_crispy/       # crispy-forms templates
│   ├── static/unfold/
│   │   ├── css/styles.css       # Compiled Tailwind CSS
│   │   ├── js/
│   │   │   ├── app.js           # Main JS (charts, widgets, etc.)
│   │   │   ├── jalali.js        # Jalali calendar widget (Persian)
│   │   │   ├── select2.init.js
│   │   │   ├── alpine/          # Alpine.js plugins
│   │   │   ├── htmx/
│   │   │   └── chart/
│   │   └── fonts/
│   │       ├── inter/           # Latin font
│   │       ├── vazirmatn/       # Persian font (RTL)
│   │       └── material-symbols/# Icon font
│   ├── locale/                  # Translation files
│   │   ├── en/LC_MESSAGES/
│   │   └── fa/LC_MESSAGES/      # Persian translations
│   ├── babel.cfg                # Translation extraction config
│   ├── widgets.py
│   └── contrib/                 # Optional integrations
│       ├── constance/
│       ├── filters/
│       ├── forms/               # Trix WYSIWYG editor
│       ├── guardian/
│       ├── hijack/
│       ├── import_export/
│       ├── inlines/
│       ├── location_field/
│       ├── simple_history/
│       └── waffle/
├── tests/                       # Test suite
│   ├── conftest.py
│   ├── factories.py             # Factory Boy factories
│   ├── fixtures.py
│   ├── test_persian_rtl.py      # Persian RTL tests (72 tests)
│   ├── test_*.py                # Other tests
│   └── server/                  # Example Django project for testing
│       └── example/
│           ├── settings.py
│           ├── urls.py
│           ├── models.py
│           └── ...
├── docs/                        # Documentation
│   ├── configuration/
│   │   ├── multi-language.md
│   │   └── rtl-and-jalali.md    # RTL & Jalali guide
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md           # This file
│   └── ...
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── nginx.conf
├── pyproject.toml
├── THIRD-PARTY-NOTICES.md
└── README.md
```

---

## 4. Running the Test Server

The test server is a small Django project in `tests/server/example/` that
exercises all Unfold features.

### 4.1 Start the server

```bash
cd tests/server
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 4.2 Access the admin

Open http://127.0.0.1:8000/admin/ and log in with your superuser credentials.

### 4.3 Test Persian RTL

Either:
- Change `LANGUAGE_CODE = "fa"` in `tests/server/example/settings.py`, OR
- Use the language switcher in the admin header (top-right corner)

### 4.4 Test specific features

- **Dashboard:** http://127.0.0.1:8000/admin/
- **Login page:** http://127.0.0.1:8000/admin/login/
- **User changelist:** http://127.0.0.1:8000/admin/auth/user/
- **User change form (with date fields):** click any user, look for date fields
- **Object history (Jalali dates):** click "History" on any object
- **Filters:** http://127.0.0.1:8000/admin/example/task/ (uses Unfold filters)
- **Command palette:** press `Cmd+K` (macOS) or `Ctrl+K` (Linux/Windows)

---

## 5. Code Style

### 5.1 Python

- **Linter:** Ruff (config in `pyproject.toml`)
- **Formatter:** Ruff format
- **Type checker:** ty (config in `pyproject.toml`)
- **Line length:** 88 characters
- **Target:** Python 3.12+

Run linters:

```bash
# Check
ruff check src/ tests/

# Auto-fix
ruff check --fix src/ tests/

# Format
ruff format src/ tests/
```

### 5.2 Templates (HTML)

- **Indentation:** 4 spaces (configured in `.pre-commit-config.yaml`)
- **Formatter:** djhtml
- **Always load i18n:** Any template using `{% trans %}` must have `{% load i18n %}`

Run djhtml:

```bash
djhtml -i tab src/unfold/templates/**/*.html
```

### 5.3 JavaScript

- **No build step** (vanilla JS, no TypeScript)
- **Indentation:** Tabs (matching existing style in `app.js`)
- **ES6+ features** are allowed (const, let, arrow functions, template literals)
- **No external dependencies** for the Jalali widget — it must remain self-contained

### 5.4 CSS

- **Framework:** Tailwind CSS v4 (source: `src/unfold/styles.css`)
- **Logical properties** are mandatory (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`)
- **Never use physical properties** (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`,
  `border-l`, `border-r`, `text-left`, `text-right`)
- The compiled CSS (`src/unfold/static/unfold/css/styles.css`) is committed to
  the repo because there's no build pipeline in the repo itself

### 5.5 Git commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation only
style: formatting, no code change
refactor: code change that neither fixes a bug nor adds a feature
test: adding missing tests or correcting existing tests
chore: build process, auxiliary tools, dependencies
```

Example:

```
feat: add Today button to Jalali calendar widget

Adds a "Today" button at the bottom of the calendar popup that jumps
to today's date and selects it. The button shows the full Persian date
for clarity (e.g. "امروز: ۱۲ شهریور ۱۴۰۵").

Closes #123
```

---

## 6. Pre-commit Hooks

Pre-commit runs automatically on every commit. To install:

```bash
pip install pre-commit
pre-commit install
```

Hooks configured (see `.pre-commit-config.yaml`):

| Hook | Purpose |
|------|---------|
| `ruff` | Lint Python code |
| `ruff-format` | Format Python code |
| `djhtml` | Format Django templates |
| `django-upgrade` | Upgrade Django syntax to newer versions |
| `zizmor` | Security audit for GitHub Actions |

To run all hooks manually:

```bash
pre-commit run --all-files
```

---

## 7. Debugging

### 7.1 Django Debug Toolbar

The test server has Debug Toolbar configured. To enable:

```bash
pip install django-debug-toolbar
```

Add to `tests/server/example/settings.py`:

```python
INSTALLED_APPS += ["debug_toolbar"]
MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
INTERNAL_IPS = ["127.0.0.1"]
```

And in `urls.py`:

```python
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
```

### 7.2 Logging

Add to `settings.py`:

```python
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "unfold": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
```

### 7.3 pdb / ipdb

Insert a breakpoint:

```python
import pdb; pdb.set_trace()
# Or with ipdb (prettier):
import ipdb; ipdb.set_trace()
# Or Python 3.7+:
breakpoint()
```

### 7.4 Browser DevTools

- **RTL debugging:** In Firefox, the `Layout` tab shows the `dir` attribute.
- **CSS logical properties:** In Chrome DevTools, the `Computed` tab shows
  both logical and physical values.
- **Jalali calendar:** Check the `Network` tab to ensure `jalali.js` is loaded
  only when `LANGUAGE_BIDI` is true.

---

## 8. Writing Tests

### 8.1 Test structure

Tests live in `tests/test_*.py`. Use pytest with pytest-django.

### 8.2 Example test

```python
# tests/test_my_feature.py
import pytest
from django.test import override_settings
from http import HTTPStatus


@pytest.mark.django_db
def test_my_feature(admin_client):
    response = admin_client.get("/admin/myapp/mymodel/")
    assert response.status_code == HTTPStatus.OK


@override_settings(LANGUAGE_CODE="fa", USE_I18N=True)
def test_persian_translation(admin_client):
    from django.utils.translation import activate
    activate("fa")
    response = admin_client.get("/admin/")
    assert response.status_code == 200
    assert "خوش آمدید" in response.content.decode("utf-8")
```

### 8.3 Test categories

| Category | File | What it tests |
|----------|------|---------------|
| Unit | `test_*.py` | Individual functions, classes |
| Integration | `test_pages.py` | Full page rendering |
| RTL | `test_persian_rtl.py` | Persian RTL, Jalali, translations |
| Widgets | `test_widgets.py` | Form widget rendering |
| Filters | `test_filters.py` | Admin filters |
| Actions | `test_actions.py` | Admin actions |

### 8.4 Fixtures

Shared fixtures live in `tests/fixtures.py` and `tests/factories.py`.

```python
# tests/factories.py
import factory
from example.models import User

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
```

```python
# Usage in tests
def test_user_creation(user_factory):
    user = user_factory()
    assert user.pk is not None
```

### 8.5 Running specific tests

```bash
# Single test file
pytest tests/test_persian_rtl.py -v

# Single test class
pytest tests/test_persian_rtl.py::TestJalaliConversion -v

# Single test method
pytest tests/test_persian_rtl.py::TestJalaliConversion::test_gregorian_to_jalali_all_cases -v

# By keyword
pytest tests/ -k "jalali" -v

# Stop on first failure
pytest tests/ -x

# Drop to pdb on failure
pytest tests/ --pdb
```

---

## 9. Contribution Workflow

### 9.1 Fork and clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/DCAdminPanel.git
cd DCAdminPanel
git remote add upstream https://github.com/DaynaCode/DCAdminPanel.git
```

### 9.2 Create a feature branch

```bash
git checkout -b feature/my-new-feature
```

### 9.3 Make changes

- Write code following the [Code Style](#5-code-style) guide
- Add tests for new features
- Update documentation if needed
- Run pre-commit hooks: `pre-commit run --all-files`
- Run tests: `pytest tests/`

### 9.4 Commit and push

```bash
git add .
git commit -m "feat: add my new feature

Detailed description of what this does and why.
"
git push origin feature/my-new-feature
```

### 9.5 Open a Pull Request

Go to https://github.com/DaynaCode/DCAdminPanel/pulls and open a PR against
the `main` branch (or `feature/persian-rtl-jalali` if your change is
Persian-specific).

### 9.6 Code review

Address review comments by pushing more commits to the same branch. Don't
squash — reviewers want to see the history of changes.

---

## 10. Releasing

(Maintainers only)

### 10.1 Bump version

```bash
# Edit pyproject.toml
# version = "0.105.0"  # was "0.104.1"

# Or use python-semantic-release (configured in pyproject.toml)
semantic-release version bump
```

### 10.2 Update changelog

```bash
# Edit CHANGELOG.md
```

### 10.3 Build and publish

```bash
# Clean previous builds
rm -rf dist/ build/ src/unfold.egg-info

# Build
python -m build

# Check
twine check dist/*

# Upload to PyPI
twine upload dist/*
```

### 10.4 Tag and push

```bash
git tag v0.105.0
git push origin main --tags
```

### 10.5 Create GitHub release

Go to https://github.com/DaynaCode/DCAdminPanel/releases/new and create
a release with the changelog entries.
