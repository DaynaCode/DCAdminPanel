"""
Template filters and tags for Jalali (Persian Solar) calendar support.

Usage in templates:
    {% load jalali %}

    {{ some_date|jalali_date }}
    {{ some_date|jalali_date:"%Y/%m/%d" }}
    {{ some_date|jalali_datetime }}
    {{ some_date|jalali_datetime:"%Y/%m/%d - %H:%i" }}
    {{ some_date|jalali_date_no_digits }}  {# Latin digits # }
    {{ "1403/06/15"|jalali_parse }}  {# converts Jalali string to Gregorian date # }
"""
from datetime import date, datetime

from django import template
from django.utils.translation import get_language

from unfold.jalali import (
    format_jalali_date,
    format_jalali_datetime,
    gregorian_to_jalali,
    is_jalali_leap_year,
    jalali_month_length,
    parse_jalali_date,
    to_persian_digits,
)

register = template.Library()


def _is_rtl_language() -> bool:
    """Return True if the current active language is RTL (e.g. Persian)."""
    from django.utils.translation import get_language_bidi
    try:
        return get_language_bidi()
    except Exception:
        return False


@register.filter(name="jalali_date")
def jalali_date_filter(value, fmt="%Y/%m/%d"):
    """Format a date/datetime as a Jalali date string.

    If the current language is not RTL, returns the original value unchanged
    (so the filter is a no-op in LTR contexts).

    Usage:
        {{ some_date|jalali_date }}
        {{ some_date|jalali_date:"%d %B %Y" }}
    """
    if not value:
        return ""

    if not _is_rtl_language():
        # In LTR context, fall back to Django's default date formatting
        if isinstance(value, (date, datetime)):
            return value.strftime("%Y-%m-%d") if hasattr(value, "strftime") else str(value)
        return str(value)

    if isinstance(value, datetime):
        value = value.date()
    elif not isinstance(value, date):
        return str(value)

    return format_jalali_date(value, fmt, use_persian_digits=True)


@register.filter(name="jalali_datetime")
def jalali_datetime_filter(value, fmt="%Y/%m/%d - %H:%i"):
    """Format a datetime as a Jalali datetime string with time.

    Usage:
        {{ some_datetime|jalali_datetime }}
        {{ some_datetime|jalali_datetime:"%Y/%m/%d - %H:%i:%s" }}
    """
    if not value:
        return ""

    if not _is_rtl_language():
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d %H:%M")
        return str(value)

    if isinstance(value, datetime):
        return format_jalali_datetime(value, fmt, use_persian_digits=True)
    elif isinstance(value, date):
        return format_jalali_date(value, fmt, use_persian_digits=True)
    return str(value)


@register.filter(name="jalali_date_latin")
def jalali_date_latin_filter(value, fmt="%Y/%m/%d"):
    """Like jalali_date but always uses Latin digits (0-9).

    Useful for fields that should remain machine-readable.
    """
    if not value:
        return ""

    if isinstance(value, datetime):
        value = value.date()
    elif not isinstance(value, date):
        return str(value)

    return format_jalali_date(value, fmt, use_persian_digits=False)


@register.filter(name="jalali_parse")
def jalali_parse_filter(value):
    """Parse a Jalali date string (YYYY/MM/DD) into a Gregorian date object.

    Usage:
        {{ "1403/06/15"|jalali_parse|date:"Y-m-d" }}
    """
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return parse_jalali_date(str(value))
    except (ValueError, TypeError):
        return None


@register.simple_tag(name="jalali_today")
def jalali_today_tag(fmt="%Y/%m/%d"):
    """Return today's date as a Jalali string.

    Usage:
        {% load jalali %}{% jalali_today %}
        {% load jalali %}{% jalali_today "%d %B %Y" %}
    """
    if not _is_rtl_language():
        return date.today().strftime("%Y-%m-%d")
    return format_jalali_date(date.today(), fmt, use_persian_digits=True)


@register.simple_tag(name="jalali_year")
def jalali_year_tag(gregorian_date=None):
    """Return the Jalali year for a given Gregorian date (or today)."""
    if gregorian_date is None:
        gregorian_date = date.today()
    elif isinstance(gregorian_date, datetime):
        gregorian_date = gregorian_date.date()
    jy, _, _ = gregorian_to_jalali(gregorian_date.year, gregorian_date.month, gregorian_date.day)
    if _is_rtl_language():
        return to_persian_digits(str(jy))
    return jy


@register.simple_tag(name="jalali_month_name")
def jalali_month_name_tag(gregorian_date=None):
    """Return the Persian month name for a given Gregorian date (or today)."""
    from unfold.jalali import JALALI_MONTHS
    if gregorian_date is None:
        gregorian_date = date.today()
    elif isinstance(gregorian_date, datetime):
        gregorian_date = gregorian_date.date()
    _, jm, _ = gregorian_to_jalali(gregorian_date.year, gregorian_date.month, gregorian_date.day)
    return JALALI_MONTHS[jm - 1]


@register.filter(name="is_jalali_leap")
def is_jalali_leap_filter(gregorian_date):
    """Return True if the Jalali year corresponding to this Gregorian date is a leap year."""
    if not gregorian_date:
        return False
    if isinstance(gregorian_date, datetime):
        gregorian_date = gregorian_date.date()
    if not isinstance(gregorian_date, date):
        return False
    jy, _, _ = gregorian_to_jalali(gregorian_date.year, gregorian_date.month, gregorian_date.day)
    return is_jalali_leap_year(jy)


@register.simple_tag(name="jalali_month_days")
def jalali_month_days_tag(jy, jm):
    """Return the number of days in a given Jalali month."""
    return jalali_month_length(jy, jm)
