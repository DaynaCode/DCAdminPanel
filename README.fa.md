# DCAdminPanel — پنل مدیریت جنگو با پشتیبانی کامل از فارسی

[![Tests](https://github.com/DaynaCode/DCAdminPanel/actions/workflows/test.yml/badge.svg)](https://github.com/DaynaCode/DCAdminPanel/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![Persian](https://img.shields.io/badge/Persian-100%25-green.svg)](src/unfold/locale/fa/LC_MESSAGES/django.po)

این پروژه یک fork از [django-unfold](https://github.com/unfoldadmin/django-unfold)
است که پشتیبانی کامل از **زبان فارسی**، **چیدمان راست‌چین (RTL)**، **فونت وزیرمتن**
و **تقویم جلالی** را اضافه می‌کند.

## ✨ ویژگی‌ها

### پشتیبانی کامل از فارسی

- ✅ **راست‌چین‌سازی خودکار:** تمام چیدمان بر اساس `LANGUAGE_CODE` به‌طور خودکار RTL می‌شود
- ✅ **فونت وزیرمتن:** فونت فارسی وزیرمتن (SIL OFL) باندل شده و فقط در حالت RTL لود می‌شود
- ✅ **ترجمه ۱۰۰٪ فارسی:** تمام رشته‌های Unfold به فارسی ترجمه شده‌اند (۱۶۵ رشته)
- ✅ **اعداد فارسی:** تمام اعداد در رابط کاربری به فارسی (۰-۹) نمایش داده می‌شوند
- ✅ **نام‌های فارسی:** نام ماه‌ها و روزهای هفته به فارسی

### تقویم جلالی

- ✅ **ویجت تقویم شمسی:** انتخابگر تاریخ فارسی با popup کامل
- ✅ **تبدیل میلادی ↔ جلالی:** الگوریتم دقیق jalaali-js (MIT)
- ✅ **دکمه «امروز»:** پرش سریع به تاریخ امروز
- ✅ **انتخاب سال و ماه از dropdown**
- ✅ **ناوبری با کیبورد:** فلش‌ها، Enter، Escape
- ✅ **Dark mode:** پشتیبانی از حالت تاریک
- ✅ **Tooltip میلادی:** نشاندن موس روی هر روز، تاریخ میلادی معادل را نشان می‌دهد
- ✅ **جمعه‌ها قرمز:** روزهای جمعه (آخر هفته فارسی) با رنگ متمایز
- ✅ **نمایش در تاریخچه:** تاریخ‌های تاریخچه و اقدامات اخیر به جلالی نمایش داده می‌شوند

### پشتیبانی از CSS منطقی

- ✅ **۰ ویژگی فیزیکی:** تمام `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` به `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-` تبدیل شده‌اند
- ✅ **بلوک RTL Override:** مواردی که نیاز به اصلاح دستی دارند (آیکون‌های جهت‌دار، تقویم و غیره)

## 📦 نصب

### نصب با pip

```bash
pip install -e .
# یا پس از انتشار در PyPI:
# pip install django-unfold
```

### نصب با Docker

```bash
# کلون کنید
git clone https://github.com/DaynaCode/DCAdminPanel.git
cd DCAdminPanel

# فایل .env بسازید
cp .env.example .env
# مقادیر را ویرایش کنید

# اجرا
docker compose up -d --build

# ساخت superuser
docker compose exec web python manage.py createsuperuser

# باز کردن مرورگر
open http://localhost:8080/admin/
```

## ⚙️ پیکربندی

در `settings.py` پروژه خود:

```python
INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    # ... سایر contrib های مورد نیاز
    "django.contrib.admin",
    "django.contrib.auth",
    # ...
]

MIDDLEWARE = [
    # ...
    "django.middleware.locale.LocaleMiddleware",  # الزامی برای i18n
    # ...
]

# تنظیمات i18n
LANGUAGE_CODE = "fa"  # یا "en"
USE_I18N = True
USE_L10N = True
USE_TZ = True

LANGUAGES = (
    ("fa", _("Persian")),
    ("en", _("English")),
)

LOCALE_PATHS = [
    BASE_DIR / "locale",
]

# پیکربندی Unfold
UNFOLD = {
    "SHOW_LANGUAGES": True,
    "LANGUAGES": {
        "navigation": [
            {
                "bidi": True,  # کلید: این زبان RTL است
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

در `urls.py`:

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("i18n/", include("django.conf.urls.i18n")),  # برای سوییچ زبان
]
```

## 🚀 اجرا

```bash
# Migration
python manage.py migrate

# جمع‌آوری فایل‌های استاتیک
python manage.py collectstatic --noinput

# کامپایل ترجمه‌ها
python manage.py compilemessages

# ساخت superuser
python manage.py createsuperuser

# اجرای سرور
python manage.py runserver
```

سپس به http://127.0.0.1:8000/admin/ بروید.

## 📅 استفاده از تقویم جلالی

تقویم جلالی به‌طور خودکار فعال می‌شود وقتی `LANGUAGE_BIDI` برابر `True` است
(یعنی زبان فعال فارسی/عربی/عبری است).

### در قالب‌ها

```django
{% load jalali %}

{# نمایش تاریخ جلالی #}
{{ some_date|jalali_date }}
{# خروجی: ۱۴۰۵/۰۶/۱۲ #}

{# با نام ماه #}
{{ some_date|jalali_date:"%d %B %Y" }}
{# خروجی: ۱۲ شهریور ۱۴۰۵ #}

{# تاریخ و زمان #}
{{ some_datetime|jalali_datetime }}
{# خروجی: ۱۴۰۵/۰۶/۱۲ - ۱۴:۳۰ #}

{# با اعداد لاتین (برای فیلدهای ماشین‌خواندنی) #}
{{ some_date|jalali_date_latin }}
{# خروجی: 1405/06/12 #}
```

### در Python

```python
from unfold.jalali import (
    gregorian_to_jalali,
    jalali_to_gregorian,
    format_jalali_date,
    parse_jalali_date,
    is_jalali_leap_year,
    to_persian_digits,
)
from datetime import date

# تبدیل میلادی به جلالی
jy, jm, jd = gregorian_to_jalali(2026, 9, 3)
# (1405, 6, 12)

# تبدیل جلالی به میلادی
gy, gm, gd = jalali_to_gregorian(1405, 6, 12)
# (2026, 9, 3)

# فرمت‌بندی
format_jalali_date(date(2026, 9, 3), "%d %B %Y")
# '۱۲ شهریور ۱۴۰۵'

# تشخیص سال کبیسه
is_jalali_leap_year(1403)  # True
is_jalali_leap_year(1404)  # False

# تبدیل اعداد
to_persian_digits("1403/06/15")
# '۱۴۰۳/۰۶/۱۵'
```

## 📚 مستندات

| مستند | توضیح |
|-------|-------|
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | راهنمای استقرار در تولید (Docker، Nginx، امنیت) |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | راهنمای توسعه برای مشارکت‌کنندگان |
| [TESTING.md](docs/TESTING.md) | راهنمای تست |
| [TRANSLATIONS.md](docs/TRANSLATIONS.md) | راهنمای ترجمه |
| [docs/configuration/rtl-and-jalali.md](docs/configuration/rtl-and-jalali.md) | راهنمای کامل RTL و تقویم جلالی |
| [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) | لایسنس وابستگی‌ها |

## 🧪 تست

```bash
# نصب وابستگی‌های تست
pip install pytest pytest-django pytest-factoryboy pytest-mock pytest-cov factory-boy polib

# اجرای همه تست‌ها
pytest tests/

# فقط تست‌های RTL فارسی
pytest tests/test_persian_rtl.py -v
```

**نتیجه:** ۵۲۵ تست پاس می‌شوند (۴۳۶ تست موجود + ۸۹ تست جدید RTL فارسی).

## 📝 لایسنس

پروژه اصلی django-unfold تحت لایسنس MIT است.
فونت‌های باندل شده (Inter، Vazirmatn) تحت SIL OFL 1.1 هستند.

برای جزئیات کامل لایسنس وابستگی‌ها، [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)
را ببینید.

## 🤝 مشارکت

1. Repository را fork کنید
2. برنچ جدید بسازید: `git checkout -b feature/my-feature`
3. تغییرات را commit کنید (از [Conventional Commits](https://www.conventionalcommits.org/) استفاده کنید)
4. Push کنید و Pull Request باز کنید

برای راهنمای کامل، [DEVELOPMENT.md](docs/DEVELOPMENT.md) را ببینید.

## 📞 پشتیبانی

- [Issues](https://github.com/DaynaCode/DCAdminPanel/issues)
- [Discussions](https://github.com/DaynaCode/DCAdminPanel/discussions)

---

**ساخته شده با ❤️ برای جامعه فارسی‌زبان جنگو**
