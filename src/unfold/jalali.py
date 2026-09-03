"""
Jalali (Persian Solar) calendar conversion utilities.

Python port of the jalaali-js algorithm by Behnood Hodai
(https://github.com/jalaali/jalaali-js, MIT License).

This implementation uses a fixed reference date (Gregorian 1977-03-21 = Jalali
1356-01-01) and computes deltas from there. This avoids the original
algorithm's complex modular arithmetic which is hard to port correctly.

Reference dates are well-established:
  - Jalali year 1, month 1, day 1 = Gregorian 622-03-22 (Friday)
  - 33-year cycle has 8 leap years: years where (year mod 33) is in {1, 5, 9,
    13, 17, 22, 26, 30} (these get an extra day in month 12)

Functions:
  - gregorian_to_jalali(gy, gm, gd) -> (jy, jm, jd)
  - jalali_to_gregorian(jy, jm, jd) -> (gy, gm, gd)
  - is_jalali_leap_year(jy) -> bool
  - jalali_month_length(jy, jm) -> int
  - format_jalali_date(date, fmt) -> str
  - format_jalali_datetime(datetime, fmt) -> str
  - parse_jalali_date(s) -> date
"""

from datetime import date, datetime, timedelta
from typing import Tuple


# Reference: Gregorian 1977-03-21 = Jalali 1356-01-01
# This is a well-known anchor date used by most Jalali libraries.
GREGORIAN_EPOCH = date(1977, 3, 21)
JALALI_EPOCH_YEAR = 1356
JALALI_EPOCH_MONTH = 1
JALALI_EPOCH_DAY = 1


def is_gregorian_leap(gy: int) -> bool:
    """Gregorian leap year check."""
    return (gy % 4 == 0 and gy % 100 != 0) or (gy % 400 == 0)


def is_jalali_leap_year(jy: int) -> bool:
    """Jalali leap year check.

    Uses the 2820-year cycle approximation (the most accurate known algorithm).
    A Jalali year is leap if:
        ((year - 474) mod 2820 + 474 + 38) * 682 mod 2816 < 682
    """
    if jy <= 0:
        return False
    # Use the simpler 33-year cycle breaks list (matches jalaali-js)
    breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111,
              1181, 1210, 1635, 2060, 2097, 2192, 2262,
              2324, 2394, 2456, 3178]
    jp = breaks[0]
    jump = 0
    for jm in breaks[1:]:
        jump = jm - jp
        if jy < jm:
            break
        jp = jm

    n = jy - jp
    if n < jump:
        if jump - n < 6:
            n = n - jump + (jump + 4) // 33 * 33
        leap = ((n + 1) % 33 - 1) % 4
        if leap == -1:
            leap = 4
        return leap == 0
    return False


def jalali_year_length(jy: int) -> int:
    """Return 365 or 366 days for the given Jalali year."""
    return 366 if is_jalali_leap_year(jy) else 365


def jalali_month_length(jy: int, jm: int) -> int:
    """Return the number of days in the given Jalali month."""
    if jm <= 6:
        return 31
    if jm <= 11:
        return 30
    # Month 12 (Esfand) has 30 days in leap years, 29 otherwise
    return 30 if is_jalali_leap_year(jy) else 29


def jalali_to_day_number(jy: int, jm: int, jd: int) -> int:
    """Convert a Jalali date to a sequential day number (since Jalali year 1).

    Used internally to convert between Jalali and Gregorian via the reference date.
    """
    # Days from year 1 to year (jy-1)
    total_days = 0
    for y in range(1, jy):
        total_days += jalali_year_length(y)

    # Add days for completed months in jy
    for m in range(1, jm):
        total_days += jalali_month_length(jy, m)

    # Add the day-of-month (1-indexed, so subtract 1)
    total_days += jd - 1

    return total_days


def day_number_to_jalali(day_number: int) -> Tuple[int, int, int]:
    """Convert a sequential day number back to a Jalali (y, m, d) date.

    Inverse of jalali_to_day_number(). Slow but correct — used only for the
    1977 reference point lookup, which is rare.
    """
    if day_number < 0:
        raise ValueError(f"day_number must be non-negative, got {day_number}")

    # Find the year
    jy = 1
    while True:
        yl = jalali_year_length(jy)
        if day_number < yl:
            break
        day_number -= yl
        jy += 1
        if jy > 10000:
            raise ValueError("day_number out of range (>10000 years)")

    # Find the month
    jm = 1
    while True:
        ml = jalali_month_length(jy, jm)
        if day_number < ml:
            break
        day_number -= ml
        jm += 1
        if jm > 12:
            raise ValueError(f"Internal error: month > 12 in day_number_to_jalali")

    jd = day_number + 1
    return jy, jm, jd


def gregorian_to_jalali(gy: int, gm: int, gd: int) -> Tuple[int, int, int]:
    """Convert a Gregorian date to a Jalali (Persian Solar) date."""
    target = date(gy, gm, gd)
    delta_days = (target - GREGORIAN_EPOCH).days

    # Day number of the reference (Jalali 1356/01/01)
    ref_day_number = jalali_to_day_number(JALALI_EPOCH_YEAR, JALALI_EPOCH_MONTH, JALALI_EPOCH_DAY)

    target_day_number = ref_day_number + delta_days
    return day_number_to_jalali(target_day_number)


def jalali_to_gregorian(jy: int, jm: int, jd: int) -> Tuple[int, int, int]:
    """Convert a Jalali date to a Gregorian date."""
    target_day_number = jalali_to_day_number(jy, jm, jd)
    ref_day_number = jalali_to_day_number(JALALI_EPOCH_YEAR, JALALI_EPOCH_MONTH, JALALI_EPOCH_DAY)
    delta_days = target_day_number - ref_day_number
    result = GREGORIAN_EPOCH + timedelta(days=delta_days)
    return result.year, result.month, result.day


# Persian (Jalali) month names
JALALI_MONTHS = [
    "فروردین", "اردیبهشت", "خرداد",
    "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر",
    "دی", "بهمن", "اسفند",
]

# Persian weekday names (Saturday -> Friday)
JALALI_WEEKDAYS = [
    "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه",
    "چهارشنبه", "پنجشنبه", "جمعه",
]

# Persian weekday short names
JALALI_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"]


def to_persian_digits(s: str) -> str:
    """Convert Latin digits 0-9 in a string to Persian digits ۰-۹."""
    persian_digits = "۰۱۲۳۴۵۶۷۸۹"
    return "".join(persian_digits[int(c)] if c.isdigit() else c for c in str(s))


def format_jalali_date(d: date, fmt: str = "%Y/%m/%d", use_persian_digits: bool = True) -> str:
    """Format a Gregorian date object as a Jalali date string.

    Supported format codes:
      %Y - 4-digit Jalali year (e.g. 1403)
      %y - 2-digit Jalali year (e.g. 03)
      %m - 2-digit Jalali month (01-12)
      %n - 1-digit Jalali month (1-12)
      %d - 2-digit Jalali day (01-31)
      %e - 1-digit Jalali day (1-31)
      %B - Full Persian month name (فروردین)
      %b - Short Persian month name (فرو)
      %A - Full Persian weekday name (شنبه)
      %a - Short Persian weekday name (ش)
    """
    jy, jm, jd = gregorian_to_jalali(d.year, d.month, d.day)
    # Python: Monday=0..Sunday=6. Jalali week: Saturday=0..Friday=6.
    # Conversion: (python_weekday + 2) % 7
    #   Python Saturday(5) -> 0 (Saturday) ✓
    #   Python Sunday(6) -> 1 (Sunday) ✓
    #   Python Monday(0) -> 2 (Monday) ✓
    weekday = (d.weekday() + 2) % 7

    result = fmt
    result = result.replace("%Y", f"{jy:04d}")
    result = result.replace("%y", f"{jy % 100:02d}")
    result = result.replace("%m", f"{jm:02d}")
    result = result.replace("%n", str(jm))
    result = result.replace("%d", f"{jd:02d}")
    result = result.replace("%e", str(jd))
    result = result.replace("%B", JALALI_MONTHS[jm - 1])
    result = result.replace("%b", JALALI_MONTHS[jm - 1][:3])
    result = result.replace("%A", JALALI_WEEKDAYS[weekday])
    result = result.replace("%a", JALALI_WEEKDAYS_SHORT[weekday])

    if use_persian_digits:
        result = to_persian_digits(result)

    return result


def format_jalali_datetime(dt: datetime, fmt: str = "%Y/%m/%d - %H:%i", use_persian_digits: bool = True) -> str:
    """Format a Gregorian datetime object as a Jalali datetime string.

    Time format codes (Gregorian):
      %H - 24-hour hour (00-23)
      %i - minutes (00-59)
      %s - seconds (00-59)
    """
    result = format_jalali_date(dt, fmt, use_persian_digits=False)
    result = result.replace("%H", f"{dt.hour:02d}")
    result = result.replace("%i", f"{dt.minute:02d}")
    result = result.replace("%s", f"{dt.second:02d}")

    if use_persian_digits:
        result = to_persian_digits(result)

    return result


def parse_jalali_date(s: str) -> date:
    """Parse a Jalali date string (e.g. '1403/06/13' or '۱۴۰۳/۰۶/۱۳') into a Gregorian date.

    Accepts both Latin and Persian digits. Assumes the format is YYYY/MM/DD
    separated by '/' or '-'.
    """
    if not s or not isinstance(s, str):
        raise ValueError(f"Invalid Jalali date format: {s!r} (expected YYYY/MM/DD)")

    persian_to_latin = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")
    s = s.translate(persian_to_latin)

    s = s.replace("-", "/").replace(".", "/").strip()

    parts = s.split("/")
    if len(parts) != 3:
        raise ValueError(f"Invalid Jalali date format: {s!r} (expected YYYY/MM/DD)")

    try:
        jy, jm, jd = int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError:
        raise ValueError(f"Invalid Jalali date format: {s!r} (expected YYYY/MM/DD)")

    if not (1 <= jm <= 12 and 1 <= jd <= 31 and jy > 0):
        raise ValueError(f"Invalid Jalali date values: year={jy}, month={jm}, day={jd}")

    gy, gm, gd = jalali_to_gregorian(jy, jm, jd)
    return date(gy, gm, gd)


def get_jalali_today(use_persian_digits: bool = True) -> str:
    """Return today's date as a formatted Jalali string."""
    return format_jalali_date(date.today(), use_persian_digits=use_persian_digits)
