# Third-Party Notices

This file lists all third-party software, fonts, and other assets bundled
within the **django-unfold** package (including this Persian RTL fork),
along with their license information and source URLs.

The django-unfold package itself is licensed under the MIT License
(see `LICENSE.md`). The third-party components retain their original licenses.

---

## Summary Table

| Component | Version | License | Purpose | Bundled Path |
|-----------|---------|---------|---------|--------------|
| [Inter Font](#1-inter-font) | 4.0 | SIL OFL 1.1 | Default LTR UI font | `src/unfold/static/unfold/fonts/inter/` |
| [Vazirmatn Font](#2-vazirmatn-font) | 33.003 | SIL OFL 1.1 | Persian (RTL) UI font | `src/unfold/static/unfold/fonts/vazirmatn/` |
| [Material Symbols](#3-material-symbols) | Variable | Apache 2.0 | Icon font | `src/unfold/static/unfold/fonts/material-symbols/` |
| [Alpine.js](#4-alpinejs) | 3.x | MIT | Reactive UI framework | `src/unfold/static/unfold/js/alpine/` |
| [htmx](#5-htmx) | 1.x / 2.x | 0BSD | AJAX / partial page updates | `src/unfold/static/unfold/js/htmx/` |
| [Chart.js](#6-chartjs) | 4.x | MIT | Data visualization charts | `src/unfold/static/unfold/js/chart/` |
| [Trix](#7-trix) | 2.x | MIT | Rich text editor (WYSIWYG) | `src/unfold/contrib/forms/static/unfold/forms/js/trix/` |
| [Select2](#8-select2) | 4.x | MIT | Custom select dropdowns | Loaded from Django admin static |
| [Jalali Calendar Algorithm](#9-jalali-calendar-algorithm) | — | MIT | Persian date conversion | `src/unfold/jalali.py` + `src/unfold/static/unfold/js/jalali.js` |

---

## 1. Inter Font

- **Project:** Inter — A typeface specially designed for computer screens
- **Version:** 4.0
- **Author:** The Inter Project Authors (https://github.com/rsms/inter)
- **License:** SIL Open Font License 1.1
- **Source:** https://github.com/rsms/inter
- **Bundled at:** `src/unfold/static/unfold/fonts/inter/`
- **License file:** `src/unfold/static/unfold/fonts/inter/LICENSE`
- **Usage:** Default UI font for LTR (left-to-right) text. Loaded via
  `src/unfold/static/unfold/fonts/inter/styles.css`.

### License Excerpt

```
Copyright (c) 2016 The Inter Project Authors (https://github.com/rsms/inter)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
```

---

## 2. Vazirmatn Font

- **Project:** Vazirmatn — Persian/Arabic font
- **Version:** 33.003 (subsetted via @fontsource/vazirmatn 5.1.0)
- **Author:** Saber Rastikerdar and the Vazirmatn Project Authors
- **License:** SIL Open Font License 1.1
- **Source:** https://github.com/rastikerdar/vazirmatn
- **Bundled at:** `src/unfold/static/unfold/fonts/vazirmatn/`
- **License file:** `src/unfold/static/unfold/fonts/vazirmatn/LICENSE`
- **Usage:** Persian UI font for RTL (right-to-left) text. Loaded via
  `src/unfold/static/unfold/fonts/vazirmatn/styles.css`. Activated when the
  document direction is RTL via `[dir="rtl"]` CSS selector.

### Bundled Files

- `Vazirmatn-arabic-400.woff2` — Regular weight, Arabic subset
- `Vazirmatn-arabic-500.woff2` — Medium weight, Arabic subset
- `Vazirmatn-arabic-600.woff2` — SemiBold weight, Arabic subset
- `Vazirmatn-arabic-700.woff2` — Bold weight, Arabic subset
- `Vazirmatn-latin-400.woff2` — Regular weight, Latin subset
- `Vazirmatn-latin-500.woff2` — Medium weight, Latin subset
- `Vazirmatn-latin-600.woff2` — SemiBold weight, Latin subset
- `Vazirmatn-latin-700.woff2` — Bold weight, Latin subset
- `styles.css` — @font-face declarations
- `LICENSE` — SIL OFL 1.1 full text

### License Excerpt

```
Copyright (C) 2017-2024, Saber Rastikerdar and Vazirmatn Project Authors
(https://github.com/rastikerdar/vazirmatn)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
```

---

## 3. Material Symbols

- **Project:** Material Symbols — Google's open-source icon font
- **Version:** Variable
- **Author:** Google LLC
- **License:** Apache License 2.0
- **Source:** https://github.com/google/material-design-icons
- **Bundled at:** `src/unfold/static/unfold/fonts/material-symbols/`
- **License file:** `src/unfold/static/unfold/fonts/material-symbols/LICENSE`
- **Usage:** Icon font used throughout the admin UI. Loaded via
  `src/unfold/static/unfold/fonts/material-symbols/styles.css`.
  Note: This font requires `direction: ltr` even in RTL documents because
  ligature-based icon rendering breaks under RTL text direction.

### License Excerpt

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   Copyright 2020 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0
```

---

## 4. Alpine.js

- **Project:** Alpine.js — A rugged, minimal tool for composing JavaScript behavior in markup
- **Version:** 3.x
- **Author:** Caleb Porzio and contributors
- **License:** MIT License
- **Source:** https://github.com/alpinejs/alpine
- **Bundled at:** `src/unfold/static/unfold/js/alpine/`
- **License file:** `src/unfold/static/unfold/js/alpine/LICENSE`
- **Usage:** Reactive UI framework powering sidebar toggle, tabs, modals,
  command palette, theme switching, and many other interactive elements.

### Bundled Files

- `alpine.js` — Core runtime
- `alpine.persist.js` — `$persist` magic (theme persistence)
- `alpine.anchor.js` — `x-anchor` directive (dropdowns)
- `alpine.sort.js` — `x-sort` directive (drag-and-drop sorting)
- `alpine.focus.js` — Focus management
- `alpine.resize.js` — `x-resize` directive

### License Excerpt

```
MIT License

Copyright © 2019-2021 Caleb Porzio and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, ...
```

---

## 5. htmx

- **Project:** htmx — high power tools for HTML
- **Version:** 1.x / 2.x
- **Author:** Big Sky Software
- **License:** Zero-Clause BSD (0BSD)
- **Source:** https://github.com/bigskysoftware/htmx
- **Bundled at:** `src/unfold/static/unfold/js/htmx/`
- **License file:** `src/unfold/static/unfold/js/htmx/LICENSE`
- **Usage:** Powers AJAX-driven partial page updates (filter actions,
  inline editing, infinite scroll pagination).

### License Excerpt

```
Zero-Clause BSD
=============

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED “AS IS” AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE...
```

---

## 6. Chart.js

- **Project:** Chart.js — Simple yet flexible JavaScript charting
- **Version:** 4.x
- **Author:** Chart.js Contributors
- **License:** MIT License
- **Source:** https://github.com/chartjs/Chart.js
- **Bundled at:** `src/unfold/static/unfold/js/chart/`
- **License file:** `src/unfold/static/unfold/js/chart/LICENSE`
- **Usage:** Renders bar, line, and cohort charts in the dashboard and
  list views. Chart.js font family is set dynamically based on document
  direction (Vazirmatn for RTL, Inter for LTR) — see
  `src/unfold/static/unfold/js/app.js`.

### License Excerpt

```
The MIT License (MIT)

Copyright (c) 2014-2024 Chart.js Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, ...
```

---

## 7. Trix

- **Project:** Trix — A rich text editor for everyday writing
- **Version:** 2.x
- **Author:** 37signals, LLC
- **License:** MIT License
- **Source:** https://github.com/basecamp/trix
- **Bundled at:** `src/unfold/contrib/forms/static/unfold/forms/js/trix/`
  and `src/unfold/contrib/forms/static/unfold/forms/css/trix/`
- **License file:** `src/unfold/contrib/forms/static/unfold/forms/js/trix/LICENSE`
  (also `.../css/trix/LICENSE`)
- **Usage:** Rich text WYSIWYG editor for the `UnfoldAdminTrixWidget` in
  the `unfold.contrib.forms` module.

### License Excerpt

```
Copyright (c) 37signals, LLC

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, ...
```

---

## 8. Select2

- **Project:** Select2 — The jQuery replacement for select boxes
- **Version:** 4.x
- **Author:** Select2 Contributors
- **License:** MIT License
- **Source:** https://github.com/select2/select2
- **Bundled at:** Not directly bundled — loaded from Django admin's static
  files (`django/contrib/admin/static/admin/js/vendor/select2/`)
- **Usage:** Powers autocomplete select widgets. Unfold ships
  `src/unfold/static/unfold/js/select2.init.js` for initialization hooks,
  but the Select2 library itself comes from Django admin.

### License Excerpt

```
Copyright (c) 2012-2017 Kevin Brown, Igor Vaynberg, and Select2 contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, ...
```

---

## 9. Jalali Calendar Algorithm

- **Project:** Jalaali JS — Jalali (Persian Solar) calendar conversion
- **Algorithm author:** Behnood Hodai (jalaali-js contributors)
- **License:** MIT License
- **Source:** https://github.com/jalaali/jalaali-js
- **Bundled at (Python):** `src/unfold/jalali.py` (server-side conversion)
- **Bundled at (JavaScript):** `src/unfold/static/unfold/js/jalali.js`
  (client-side datepicker widget)
- **Usage:** Converts between Gregorian and Jalali (Persian Solar) dates.
  Used to display Jalali dates in admin forms and to render a Persian
  calendar popup for date inputs when `LANGUAGE_BIDI` is true.

### Attribution

The conversion algorithm (`div`, `gregorianToJalali`, `jalaliToGregorian`,
`isLeapYear`) is a faithful port of the jalaali-js algorithm to Python and
JavaScript. The jalaali-js project is MIT-licensed.

```
The MIT License (MIT)

Copyright (c) 2014-2017 Behnood Hodai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, ...
```

The Persian month names and weekday names bundled in `jalali.py` and
`jalali.js` are public-domain linguistic facts.

---

## Python Dependencies (declared in `pyproject.toml`)

These are NOT bundled — they are installed via pip as runtime or development
dependencies. Listed here for completeness.

| Package | License | Required at Runtime |
|---------|---------|---------------------|
| Django (>=5.2) | BSD-3-Clause | Yes |

### Optional dev dependencies (only for testing/contributing)

| Package | License |
|---------|---------|
| django-constance | MIT |
| django-crispy-forms | MIT |
| django-guardian | MIT |
| django-hijack | MIT |
| django-import-export | BSD-2-Clause |
| django-location-field | MIT |
| django-money | BSD-3-Clause |
| django-simple-history | BSD-3-Clause |
| django-waffle | BSD-3-Clause |
| pillow | HPND-like |
| pytest | MIT |
| pytest-cov | MIT |
| pytest-django | BSD-3-Clause |
| pytest-factoryboy | MIT |
| pytest-mock | MIT |
| python-semantic-release | MIT |
| tox | MIT |
| six | MIT |
| psycopg[binary] | LGPL-3.0 |
| pre-commit | MIT |
| Babel (translation extraction) | BSD-3-Clause |
| polib (used by build scripts only) | MIT |

---

## License Compatibility Notes

1. **SIL OFL 1.1 fonts (Inter, Vazirmatn):** The OFL allows bundling,
   redistribution, and use with any software, but the fonts themselves
   cannot be sold alone. They are safe to bundle with MIT-licensed software.

2. **Apache 2.0 (Material Symbols):** Apache 2.0 is compatible with MIT
   and may be bundled. The NOTICE requirement is satisfied by this
   `THIRD-PARTY-NOTICES.md` file.

3. **MIT (Alpine.js, Chart.js, Trix, Select2, jalaali-js):** All MIT-licensed
   components are compatible with each other and with the MIT license of
   django-unfold itself.

4. **0BSD (htmx):** Zero-Clause BSD is functionally equivalent to public
   domain and is compatible with everything.

5. **BSD-3-Clause (Django, psycopg):** Compatible with MIT.

6. **Jalali Calendar Algorithm (MIT):** The algorithm is a port of jalaali-js
   (MIT). The Persian month/weekday names are public-domain linguistic data.

---

## Update Procedure

When adding a new third-party component to the bundle:

1. Place the component in an appropriate subdirectory of
   `src/unfold/static/unfold/`.
2. Place its LICENSE file alongside the component (NOT in a single shared
   license directory — keep licenses close to the code they cover).
3. Add an entry to this `THIRD-PARTY-NOTICES.md` file, including:
   - Project name
   - Version
   - License name (matching SPDX identifier where possible)
   - Author / copyright holder
   - Source URL
   - Bundled path
   - License file path
4. Add an entry to the **Summary Table** at the top of this file.
5. If the license is Apache 2.0, MPL, or any license with a NOTICE
   requirement, also include the contents of the NOTICE file (if any)
   in the component's section.

---

## Contact

For license questions about this fork:
- Repository: https://github.com/DaynaCode/DCAdminPanel

For license questions about upstream django-unfold:
- Repository: https://github.com/unfoldadmin/django-unfold
