/*
 * Unfold Jalali (Persian Solar) Calendar Widget — Enhanced v2
 * ----------------------------------------------------------------
 * Self-contained JavaScript Jalali calendar. No external dependencies.
 *
 * Conversion algorithm: jalaali-js (MIT, by Behnood Hodai)
 *
 * Features:
 *   - Popup calendar with Persian month/weekday names
 *   - "Today" button (jumps to today + selects today)
 *   - Year & month dropdown selectors (jump to any year/month)
 *   - Prev/Next month navigation with chevron icons
 *   - Prev/Next year quick-jump (double-chevron)
 *   - Friday highlighted in red (Persian weekend)
 *   - Selected day highlighted with primary color
 *   - Tooltip showing Gregorian equivalent date
 *   - Keyboard support (Esc to close, ←/→/↑/↓ to navigate, Enter to select)
 *   - Dark mode support (follows document theme)
 *   - Click outside to close
 *   - Persian digits throughout (۰-۹)
 *   - Gregorian ISO date submitted to server (DB stays Gregorian)
 *
 * API:
 *   window.UnfoldJalali = {
 *     gregorianToJalali(gy, gm, gd) -> [jy, jm, jd]
 *     jalaliToGregorian(jy, jm, jd) -> [gy, gm, gd]
 *     isLeapYear(jy) -> bool
 *     monthLength(jy, jm) -> int
 *     format(jy, jm, jd, fmt) -> str
 *     toPersianDigits(str) -> str
 *     init(rootEl?) -> void
 *   }
 */
(function () {
    "use strict";

    // ============================================================
    // Conversion algorithm (jalaali-js port)
    // ============================================================
    function div(a, b) { return Math.floor(a / b); }

    function gregorianToJalali(gy, gm, gd) {
        var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var jy;
        if (gy > 1600) { jy = 979; gy -= 621; }
        else { jy = 0; gy -= 621; }
        var gy2 = gm > 2 ? gy + 1 : gy;
        var days = 365 * gy + div(gy2 + 3, 4) - div(gy2 + 99, 100) + div(gy2 + 399, 400) + gd + g_d_m[gm - 1];
        jy += 33 * div(days, 12053);
        days %= 12053;
        jy += 4 * div(days, 1461);
        days %= 1461;
        if (days > 365) {
            jy += div(days - 1, 365);
            days = (days - 1) % 365;
        }
        var jm, jd;
        if (days < 186) {
            jm = 1 + div(days, 31);
            jd = 1 + (days % 31);
        } else {
            jm = 7 + div(days - 186, 30);
            jd = 1 + ((days - 186) % 30);
        }
        return [jy, jm, jd];
    }

    function jalaliToGregorian(jy, jm, jd) {
        var gy;
        if (jy > 979) { gy = 1600; jy -= 979; }
        else { gy = 621; }
        var days;
        if (jm < 7) { days = (jm - 1) * 31; }
        else { days = (jm - 7) * 30 + 186; }
        days += 365 * jy + div(jy, 33) * 8 + div((jy % 33) + 3, 4) + jd;
        gy += 400 * div(days, 146097);
        days %= 146097;
        if (days > 36524) {
            gy += 100 * div(--days, 36524);
            days %= 36524;
            if (days >= 365) days++;
        }
        gy += 4 * div(days, 1461);
        days %= 1461;
        if (days > 365) {
            gy += div(days - 1, 365);
            days = (days - 1) % 365;
        }
        var sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var gm = 0;
        for (var i = 0; i < sal_a.length; i++) {
            if (days < sal_a[i]) break;
            days -= sal_a[i];
            gm++;
        }
        return [gy, gm, days + 1];
    }

    function isLeapYear(jy) {
        var breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
        var jp = breaks[0], jump = 0;
        for (var i = 1; i < breaks.length; i++) {
            jump = breaks[i] - jp;
            if (jy < breaks[i]) break;
            jp = breaks[i];
        }
        var n = jy - jp;
        if (n < jump) {
            if (jump - n < 6) { n = n - jump + div(jump + 4, 33) * 33; }
            var leap = ((n + 1) % 33 - 1) % 4;
            if (leap === -1) leap = 4;
            return leap === 0;
        }
        return false;
    }

    function monthLength(jy, jm) {
        if (jm <= 6) return 31;
        if (jm <= 11) return 30;
        return isLeapYear(jy) ? 30 : 29;
    }

    // ============================================================
    // Localization data
    // ============================================================
    var MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
    var WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
    var WEEKDAYS_FULL = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
    var GREGORIAN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    function toPersianDigits(s) {
        var map = "۰۱۲۳۴۵۶۷۸۹";
        return String(s).replace(/\d/g, function (d) { return map[+d]; });
    }

    function toLatinDigits(s) {
        return String(s).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); });
    }

    function pad(n) { return n < 10 ? "0" + n : "" + n; }

    function format(jy, jm, jd, fmt) {
        fmt = fmt || "%Y/%m/%d";
        return fmt
            .replace("%Y", jy)
            .replace("%y", pad(jy % 100))
            .replace("%m", pad(jm))
            .replace("%d", pad(jd))
            .replace("%B", MONTHS[jm - 1])
            .replace("%b", MONTHS[jm - 1].slice(0, 3));
    }

    // Format a Gregorian date for tooltip display
    function formatGregorian(gy, gm, gd) {
        return GREGORIAN_MONTHS[gm - 1] + " " + gd + ", " + gy;
    }

    // Get the weekday index (Saturday=0 ... Friday=6) for a Jalali date
    function getJalaliWeekday(jy, jm, jd) {
        var g = jalaliToGregorian(jy, jm, jd);
        var d = new Date(g[0], g[1] - 1, g[2]);
        // JS: Sunday=0..Saturday=6. Jalali: Saturday=0..Friday=6.
        return (d.getDay() + 1) % 7;
    }

    // ============================================================
    // Calendar popup HTML builder
    // ============================================================
    function buildCalendarHTML(viewJy, viewJm, selectedJy, selectedJm, selectedJd) {
        var today = new Date();
        var todayJalali = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
        var isCurrentMonth = todayJalali[0] === viewJy && todayJalali[1] === viewJm;
        var isSelectedMonth = selectedJy === viewJy && selectedJm === viewJm;

        // First day of month — find its weekday
        var startWeekday = getJalaliWeekday(viewJy, viewJm, 1);
        var daysInMonth = monthLength(viewJy, viewJm);

        var html = '';
        html += '<div class="unfold-jalali-calendar" data-jy="' + viewJy + '" data-jm="' + viewJm + '">';

        // ---- Header: prev-year, prev-month, title (month+year dropdowns), next-month, next-year ----
        html += '<div class="unfold-jalali-header">';
        html += '<button type="button" class="unfold-jalali-nav unfold-jalali-prev-year" data-action="prev-year" title="سال قبل">&laquo;</button>';
        html += '<button type="button" class="unfold-jalali-nav unfold-jalali-prev-month" data-action="prev-month" title="ماه قبل">&rsaquo;</button>';

        // Title with month and year dropdowns
        html += '<div class="unfold-jalali-title-group">';
        html += '<select class="unfold-jalali-month-select" title="انتخاب ماه">';
        for (var m = 0; m < 12; m++) {
            html += '<option value="' + (m + 1) + '"' + (m + 1 === viewJm ? ' selected' : '') + '>' + MONTHS[m] + '</option>';
        }
        html += '</select>';

        // Year dropdown: range = current year ± 10
        html += '<select class="unfold-jalali-year-select" title="انتخاب سال">';
        var yearStart = viewJy - 10;
        var yearEnd = viewJy + 10;
        for (var y = yearStart; y <= yearEnd; y++) {
            html += '<option value="' + y + '"' + (y === viewJy ? ' selected' : '') + '>' + toPersianDigits(y) + '</option>';
        }
        html += '</select>';
        html += '</div>';

        html += '<button type="button" class="unfold-jalali-nav unfold-jalali-next-month" data-action="next-month" title="ماه بعد">&lsaquo;</button>';
        html += '<button type="button" class="unfold-jalali-nav unfold-jalali-next-year" data-action="next-year" title="سال بعد">&raquo;</button>';
        html += '</div>';

        // ---- Weekday header row (Saturday to Friday) ----
        html += '<div class="unfold-jalali-weekdays">';
        for (var i = 0; i < 7; i++) {
            var isFriday = i === 6;
            html += '<span class="' + (isFriday ? 'unfold-jalali-friday-header' : '') + '" title="' + WEEKDAYS_FULL[i] + '">' + WEEKDAYS_SHORT[i] + '</span>';
        }
        html += '</div>';

        // ---- Day grid ----
        html += '<div class="unfold-jalali-days">';
        for (var i = 0; i < startWeekday; i++) {
            html += '<span class="unfold-jalali-empty"></span>';
        }
        for (var d = 1; d <= daysInMonth; d++) {
            var classes = "unfold-jalali-day";
            var dayOfWeek = (startWeekday + d - 1) % 7;
            var isFriday = dayOfWeek === 6;
            var isToday = isCurrentMonth && d === todayJalali[2];
            var isSelected = isSelectedMonth && d === selectedJd;

            if (isFriday) classes += " unfold-jalali-friday";
            if (isToday) classes += " unfold-jalali-today";
            if (isSelected) classes += " unfold-jalali-selected";

            // Tooltip with Gregorian equivalent
            var g = jalaliToGregorian(viewJy, viewJm, d);
            var tooltip = formatGregorian(g[0], g[1], g[2]) + " — " + WEEKDAYS_FULL[dayOfWeek];

            html += '<button type="button" class="' + classes + '" data-day="' + d + '" title="' + tooltip + '">' + toPersianDigits(d) + '</button>';
        }
        html += '</div>';

        // ---- Footer: Today button + "go to today" link ----
        html += '<div class="unfold-jalali-footer">';
        html += '<button type="button" class="unfold-jalali-today-btn" data-action="today">امروز: ' + toPersianDigits(todayJalali[2]) + ' ' + MONTHS[todayJalali[1] - 1] + ' ' + toPersianDigits(todayJalali[0]) + '</button>';
        html += '<button type="button" class="unfold-jalali-clear-btn" data-action="clear" title="پاک کردن تاریخ">پاک کردن</button>';
        html += '</div>';

        html += '</div>';
        return html;
    }

    // ============================================================
    // Popup management
    // ============================================================
    function getPopup() {
        var popup = document.getElementById("unfold-jalali-popup");
        if (!popup) {
            popup = document.createElement("div");
            popup.id = "unfold-jalali-popup";
            popup.className = "unfold-jalali-popup";
            document.body.appendChild(popup);
        }
        return popup;
    }

    function closePopup() {
        var popup = getPopup();
        popup.style.display = "none";
        popup.innerHTML = "";
        // Remove keyboard handler
        if (window._unfoldJalaliKeyHandler) {
            document.removeEventListener("keydown", window._unfoldJalaliKeyHandler);
            window._unfoldJalaliKeyHandler = null;
        }
    }

    // Active state — tracks the input the popup is bound to
    var activeInput = null;
    var activeViewState = { jy: null, jm: null };
    var activeSelected = { jy: null, jm: null, jd: null };

    function showPopup(inputEl, viewJy, viewJm, selJy, selJm, selJd) {
        activeInput = inputEl;
        activeViewState.jy = viewJy;
        activeViewState.jm = viewJm;
        activeSelected.jy = selJy;
        activeSelected.jm = selJm;
        activeSelected.jd = selJd;

        var popup = getPopup();
        popup.innerHTML = buildCalendarHTML(viewJy, viewJm, selJy, selJm, selJd);
        popup.style.display = "block";

        // Position relative to input (below, aligned to start)
        var rect = inputEl.getBoundingClientRect();
        var popupWidth = 340;
        var left = rect.left + window.scrollX;
        // If popup would overflow right edge, align to right of input
        if (left + popupWidth > window.innerWidth) {
            left = rect.right + window.scrollX - popupWidth;
        }
        if (left < 0) left = 8;
        popup.style.left = left + "px";
        popup.style.top = (rect.bottom + window.scrollY + 4) + "px";

        bindNavigation();
        bindKeyboard();
    }

    function refreshPopup() {
        if (!activeInput) return;
        var popup = getPopup();
        popup.innerHTML = buildCalendarHTML(
            activeViewState.jy, activeViewState.jm,
            activeSelected.jy, activeSelected.jm, activeSelected.jd
        );
        bindNavigation();
    }

    function bindNavigation() {
        var popup = getPopup();

        // Prev/Next month and year
        popup.querySelector(".unfold-jalali-prev-month").onclick = function () {
            var m = activeViewState.jm - 1;
            var y = activeViewState.jy;
            if (m < 1) { m = 12; y--; }
            activeViewState.jy = y;
            activeViewState.jm = m;
            refreshPopup();
        };
        popup.querySelector(".unfold-jalali-next-month").onclick = function () {
            var m = activeViewState.jm + 1;
            var y = activeViewState.jy;
            if (m > 12) { m = 1; y++; }
            activeViewState.jy = y;
            activeViewState.jm = m;
            refreshPopup();
        };
        popup.querySelector(".unfold-jalali-prev-year").onclick = function () {
            activeViewState.jy--;
            refreshPopup();
        };
        popup.querySelector(".unfold-jalali-next-year").onclick = function () {
            activeViewState.jy++;
            refreshPopup();
        };

        // Month/year dropdowns
        popup.querySelector(".unfold-jalali-month-select").onchange = function () {
            activeViewState.jm = parseInt(this.value, 10);
            refreshPopup();
        };
        popup.querySelector(".unfold-jalali-year-select").onchange = function () {
            activeViewState.jy = parseInt(this.value, 10);
            refreshPopup();
        };

        // Day clicks
        var days = popup.querySelectorAll(".unfold-jalali-day");
        for (var i = 0; i < days.length; i++) {
            days[i].onclick = function () {
                var day = parseInt(this.getAttribute("data-day"), 10);
                selectDate(activeViewState.jy, activeViewState.jm, day);
            };
        }

        // Today button
        popup.querySelector(".unfold-jalali-today-btn").onclick = function () {
            var today = new Date();
            var tj = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
            selectDate(tj[0], tj[1], tj[2]);
        };

        // Clear button
        popup.querySelector(".unfold-jalali-clear-btn").onclick = function () {
            if (activeInput) {
                activeInput.value = "";
                activeInput.removeAttribute("data-gregorian");
                activeInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
            closePopup();
        };
    }

    function selectDate(jy, jm, jd) {
        if (!activeInput) return;
        var g = jalaliToGregorian(jy, jm, jd);
        var isoDate = g[0] + "-" + pad(g[1]) + "-" + pad(g[2]);
        activeInput.setAttribute("data-gregorian", isoDate);
        activeInput.value = format(jy, jm, jd, "%Y/%m/%d");
        activeInput.dispatchEvent(new Event("change", { bubbles: true }));

        // Update selected state and refresh (so user sees the selection highlighted
        // before popup closes — feels more responsive)
        activeSelected.jy = jy;
        activeSelected.jm = jm;
        activeSelected.jd = jd;
        refreshPopup();

        // Close after a brief moment so the highlight is visible
        setTimeout(closePopup, 120);
    }

    // ============================================================
    // Keyboard navigation
    // ============================================================
    function bindKeyboard() {
        if (window._unfoldJalaliKeyHandler) {
            document.removeEventListener("keydown", window._unfoldJalaliKeyHandler);
        }
        window._unfoldJalaliKeyHandler = function (e) {
            if (!activeInput) return;
            var popup = getPopup();
            if (popup.style.display === "none") return;

            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    closePopup();
                    activeInput.focus();
                    break;
                case "ArrowLeft":
                    // In RTL, "left" means next day
                    e.preventDefault();
                    moveSelection(1);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    moveSelection(-1);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    moveSelection(-7);
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    moveSelection(7);
                    break;
                case "Enter":
                    e.preventDefault();
                    if (activeSelected.jy) {
                        selectDate(activeSelected.jy, activeSelected.jm, activeSelected.jd);
                    }
                    break;
                case " ":
                    e.preventDefault();
                    if (activeSelected.jy) {
                        selectDate(activeSelected.jy, activeSelected.jm, activeSelected.jd);
                    }
                    break;
            }
        };
        document.addEventListener("keydown", window._unfoldJalaliKeyHandler);
    }

    function moveSelection(delta) {
        var jy = activeSelected.jy || activeViewState.jy;
        var jm = activeSelected.jm || activeViewState.jm;
        var jd = activeSelected.jd || 1;

        // Compute target as a Gregorian date, then convert back
        var g = jalaliToGregorian(jy, jm, jd);
        var d = new Date(g[0], g[1] - 1, g[2]);
        d.setDate(d.getDate() + delta);
        var nj = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());

        activeSelected.jy = nj[0];
        activeSelected.jm = nj[1];
        activeSelected.jd = nj[2];

        // If the new date is in a different month, switch the view
        if (nj[0] !== activeViewState.jy || nj[1] !== activeViewState.jm) {
            activeViewState.jy = nj[0];
            activeViewState.jm = nj[1];
        }
        refreshPopup();
    }

    // ============================================================
    // Input binding
    // ============================================================
    function init(root) {
        root = root || document;
        var inputs = root.querySelectorAll('input[data-jalali-datepicker]:not([data-jalali-bound])');
        for (var i = 0; i < inputs.length; i++) {
            (function (input) {
                input.setAttribute("data-jalali-bound", "1");
                input.setAttribute("dir", "rtl");
                input.style.fontFamily = "Vazirmatn, sans-serif";
                input.setAttribute("placeholder", "۱۴۰۳/۰۶/۱۵");

                // If the input already has a Gregorian value, convert for display
                if (input.value && /^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
                    var parts = input.value.split("-").map(Number);
                    var j = gregorianToJalali(parts[0], parts[1], parts[2]);
                    input.value = format(j[0], j[1], j[2], "%Y/%m/%d");
                    input.setAttribute("data-gregorian", parts[0] + "-" + pad(parts[1]) + "-" + pad(parts[2]));
                }

                // Convert on blur — the form submits the Gregorian ISO date
                input.addEventListener("blur", function () {
                    var displayed = input.value.trim();
                    if (!displayed) {
                        input.removeAttribute("data-gregorian");
                        return;
                    }
                    var latin = toLatinDigits(displayed);
                    var m = latin.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
                    if (m) {
                        var jy = +m[1], jm = +m[2], jd = +m[3];
                        try {
                            var g = jalaliToGregorian(jy, jm, jd);
                            input.setAttribute("data-gregorian", g[0] + "-" + pad(g[1]) + "-" + pad(g[2]));
                            // Normalize display
                            input.value = format(jy, jm, jd, "%Y/%m/%d");
                        } catch (e) {
                            // Invalid date — leave as-is
                        }
                    }
                });

                // Form submit: replace visible value with Gregorian ISO
                var form = input.closest("form");
                if (form) {
                    form.addEventListener("submit", function () {
                        var g = input.getAttribute("data-gregorian");
                        if (g) {
                            input.value = g;
                        }
                    });
                }

                // Focus: open calendar
                input.addEventListener("focus", function () {
                    openCalendarForInput(input);
                });

                // Click on input also opens calendar (for touch devices)
                input.addEventListener("click", function (e) {
                    if (!activeInput || activeInput !== input) {
                        openCalendarForInput(input);
                    }
                });
            })(inputs[i]);
        }

        // Global click handler to close popup when clicking outside
        if (!window._unfoldJalaliClickBound) {
            window._unfoldJalaliClickBound = true;
            document.addEventListener("click", function (e) {
                if (!activeInput) return;
                var popup = getPopup();
                if (popup.style.display === "none") return;
                if (!activeInput.contains(e.target) && !popup.contains(e.target)) {
                    closePopup();
                }
            });
        }
    }

    function openCalendarForInput(input) {
        var viewJy, viewJm, selJy = null, selJm = null, selJd = null;
        var g = input.getAttribute("data-gregorian");
        if (g && /^\d{4}-\d{2}-\d{2}$/.test(g)) {
            var parts = g.split("-").map(Number);
            var j = gregorianToJalali(parts[0], parts[1], parts[2]);
            viewJy = j[0]; viewJm = j[1];
            selJy = j[0]; selJm = j[1]; selJd = j[2];
        } else {
            // Try parsing the visible value
            var displayed = toLatinDigits(input.value.trim());
            var m = displayed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
            if (m) {
                var jy = +m[1], jm = +m[2], jd = +m[3];
                viewJy = jy; viewJm = jm;
                selJy = jy; selJm = jm; selJd = jd;
            } else {
                // Default to today
                var today = new Date();
                var tj = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
                viewJy = tj[0]; viewJm = tj[1];
            }
        }
        showPopup(input, viewJy, viewJm, selJy, selJm, selJd);
    }

    // ============================================================
    // Public API
    // ============================================================
    window.UnfoldJalali = {
        gregorianToJalali: gregorianToJalali,
        jalaliToGregorian: jalaliToGregorian,
        isLeapYear: isLeapYear,
        monthLength: monthLength,
        format: format,
        toPersianDigits: toPersianDigits,
        toLatinDigits: toLatinDigits,
        init: init,
        closePopup: closePopup,
    };

    // Auto-init on DOMContentLoaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { init(); });
    } else {
        init();
    }

    // Re-init on htmx swaps (if Unfold uses htmx for inline formsets)
    document.addEventListener("htmx:afterSwap", function () { init(); });
    document.addEventListener("htmx:afterSettle", function () { init(); });

    // ============================================================
    // Styles (injected once)
    // ============================================================
    if (!document.getElementById("unfold-jalali-styles")) {
        var style = document.createElement("style");
        style.id = "unfold-jalali-styles";
        style.textContent = `
.unfold-jalali-popup {
    position: absolute;
    z-index: 9999;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    padding: 12px;
    display: none;
    font-family: 'Vazirmatn', 'Inter', sans-serif;
    direction: rtl;
    width: 340px;
    box-sizing: border-box;
}

/* Dark mode */
.dark .unfold-jalali-popup {
    background: #1f2937;
    border-color: #374151;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
}

.unfold-jalali-calendar {
    width: 100%;
    direction: rtl;
}

/* Header: nav buttons + title */
.unfold-jalali-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    margin-bottom: 12px;
}

.unfold-jalali-nav {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 6px 10px;
    color: #6b7280;
    border-radius: 6px;
    transition: all 0.15s ease;
    line-height: 1;
}

.unfold-jalali-nav:hover {
    background: #f3f4f6;
    color: #111827;
}

.dark .unfold-jalali-nav:hover {
    background: #374151;
    color: #f9fafb;
}

.unfold-jalali-title-group {
    display: flex;
    gap: 6px;
    align-items: center;
    flex: 1;
    justify-content: center;
}

.unfold-jalali-month-select,
.unfold-jalali-year-select {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 13px;
    font-family: inherit;
    background: #ffffff;
    color: #111827;
    cursor: pointer;
    font-weight: 600;
}

.dark .unfold-jalali-month-select,
.dark .unfold-jalali-year-select {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

.unfold-jalali-month-select:focus,
.unfold-jalali-year-select:focus {
    outline: 2px solid #2563eb;
    outline-offset: 1px;
}

/* Weekday header row */
.unfold-jalali-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f3f4f6;
}

.dark .unfold-jalali-weekdays {
    border-bottom-color: #374151;
}

.unfold-jalali-weekdays span {
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    color: #6b7280;
    padding: 6px 0;
}

.dark .unfold-jalali-weekdays span {
    color: #9ca3af;
}

.unfold-jalali-friday-header {
    color: #dc2626 !important;
}

/* Day grid */
.unfold-jalali-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
}

.unfold-jalali-empty {
    /* placeholder for empty cells */
}

.unfold-jalali-day {
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 13px;
    padding: 8px 0;
    text-align: center;
    border-radius: 6px;
    color: #1f2937;
    transition: all 0.1s ease;
    font-family: inherit;
    font-weight: 500;
    position: relative;
}

.dark .unfold-jalali-day {
    color: #f9fafb;
}

.unfold-jalali-day:hover {
    background: #f3f4f6;
    border-color: #e5e7eb;
}

.dark .unfold-jalali-day:hover {
    background: #374151;
    border-color: #4b5563;
}

/* Friday (weekend) — red text */
.unfold-jalali-friday {
    color: #dc2626 !important;
}

.dark .unfold-jalali-friday {
    color: #f87171 !important;
}

.unfold-jalali-friday:hover {
    background: #fef2f2 !important;
    color: #b91c1c !important;
}

.dark .unfold-jalali-friday:hover {
    background: #7f1d1d !important;
    color: #fecaca !important;
}

/* Today — blue dot indicator */
.unfold-jalali-today {
    font-weight: 700;
    color: #2563eb;
}

.dark .unfold-jalali-today {
    color: #60a5fa;
}

.unfold-jalali-today::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #2563eb;
}

.dark .unfold-jalali-today::after {
    background: #60a5fa;
}

.unfold-jalali-today.unfold-jalali-friday::after {
    background: #dc2626;
}

/* Selected day — primary background */
.unfold-jalali-selected {
    background: #2563eb !important;
    color: #ffffff !important;
    border-color: #2563eb !important;
}

.dark .unfold-jalali-selected {
    background: #3b82f6 !important;
    border-color: #3b82f6 !important;
}

.unfold-jalali-selected::after {
    background: #ffffff !important;
}

.unfold-jalali-selected:hover {
    background: #1d4ed8 !important;
}

/* Footer */
.unfold-jalali-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
}

.dark .unfold-jalali-footer {
    border-top-color: #374151;
}

.unfold-jalali-today-btn,
.unfold-jalali-clear-btn {
    border: none;
    cursor: pointer;
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 6px;
    font-family: inherit;
    transition: all 0.15s ease;
    font-weight: 600;
}

.unfold-jalali-today-btn {
    background: #eff6ff;
    color: #2563eb;
    flex: 1;
}

.unfold-jalali-today-btn:hover {
    background: #dbeafe;
    color: #1d4ed8;
}

.dark .unfold-jalali-today-btn {
    background: #1e3a8a;
    color: #93c5fd;
}

.dark .unfold-jalali-today-btn:hover {
    background: #1e40af;
    color: #bfdbfe;
}

.unfold-jalali-clear-btn {
    background: #fef2f2;
    color: #dc2626;
}

.unfold-jalali-clear-btn:hover {
    background: #fee2e2;
    color: #b91c1c;
}

.dark .unfold-jalali-clear-btn {
    background: #7f1d1d;
    color: #fca5a5;
}

.dark .unfold-jalali-clear-btn:hover {
    background: #991b1b;
    color: #fecaca;
}

/* Responsive: on small screens, anchor popup to viewport */
@media (max-width: 480px) {
    .unfold-jalali-popup {
        position: fixed !important;
        left: 8px !important;
        right: 8px !important;
        top: 50% !important;
        transform: translateY(-50%);
        width: auto !important;
    }
}
`;
        document.head.appendChild(style);
    }
})();
