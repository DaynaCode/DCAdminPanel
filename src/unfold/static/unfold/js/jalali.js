/*
 * Unfold Jalali (Persian Solar) Calendar Widget
 * ---------------------------------------------
 * Self-contained JavaScript Jalali calendar. No external dependencies.
 *
 * Conversion algorithm based on jalaali-js by jalaali (MIT).
 *
 * API:
 *   window.UnfoldJalali = {
 *     gregorianToJalali(gy, gm, gd) -> [jy, jm, jd]
 *     jalaliToGregorian(jy, jm, jd) -> [gy, gm, gd]
 *     isLeapYear(jy) -> bool
 *     monthLength(jy, jm) -> int  (29, 30, or 31)
 *     format(jy, jm, jd, fmt) -> str
 *     toPersianDigits(str) -> str
 *     init(rootEl?) -> void   (auto-binds all [data-jalali-datepicker] elements)
 *   }
 *
 * The widget displays a popup calendar when the user focuses the input.
 * On selection, the visible input shows the Jalali date string, but the
 * submitted value (in the hidden input) is the ISO Gregorian date — so
 * the server stays timezone-agnostic.
 */
(function () {
    "use strict";

    function div(a, b) {
        return { q: Math.floor(a / b), r: a % b };
    }

    function gregorianToJalali(gy, gm, gd) {
        var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var jy;
        if (gy > 1600) {
            jy = 979;
            gy -= 621;
        } else {
            jy = 0;
            gy -= 621;
        }
        var gy2 = gm > 2 ? gy + 1 : gy;
        var days =
            365 * gy +
            Math.floor((gy2 + 3) / 4) -
            Math.floor((gy2 + 99) / 100) +
            Math.floor((gy2 + 399) / 400) +
            gd +
            g_d_m[gm - 1];
        jy += 33 * Math.floor(days / 12053);
        days %= 12053;
        jy += 4 * Math.floor(days / 1461);
        days %= 1461;
        if (days > 365) {
            jy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }
        var jm, jd;
        if (days < 186) {
            jm = 1 + Math.floor(days / 31);
            jd = 1 + (days % 31);
        } else {
            jm = 7 + Math.floor((days - 186) / 30);
            jd = 1 + ((days - 186) % 30);
        }
        return [jy, jm, jd];
    }

    function jalaliToGregorian(jy, jm, jd) {
        var gy;
        if (jy > 979) {
            gy = 1600;
            jy -= 979;
        } else {
            gy = 621;
        }
        var days;
        if (jm < 7) {
            days = (jm - 1) * 31;
        } else {
            days = (jm - 7) * 30 + 186;
        }
        days += 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd;
        gy += 400 * Math.floor(days / 146097);
        days %= 146097;
        if (days > 36524) {
            gy += 100 * Math.floor(--days / 36524);
            days %= 36524;
            if (days >= 365) days++;
        }
        gy += 4 * Math.floor(days / 1461);
        days %= 1461;
        if (days > 365) {
            gy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }
        var sal_a = [
            0,
            31,
            (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
            31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
        ];
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
        var jp = breaks[0];
        var jump = 0;
        for (var i = 1; i < breaks.length; i++) {
            jump = breaks[i] - jp;
            if (jy < breaks[i]) break;
            jp = breaks[i];
        }
        var n = jy - jp;
        if (n < jump) {
            if (jump - n < 6) {
                n = n - jump + Math.floor((jump + 4) / 33) * 33;
            }
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

    var MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
    var WEEKDAYS = ["ش","ی","د","س","چ","پ","ج"];

    function toPersianDigits(s) {
        var map = "۰۱۲۳۴۵۶۷۸۹";
        return String(s).replace(/\d/g, function (d) { return map[+d]; });
    }

    function pad(n) {
        return n < 10 ? "0" + n : "" + n;
    }

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

    // Build the calendar popup HTML for a given (jy, jm) month view.
    function buildCalendarHTML(jy, jm, selectedJd) {
        var today = new Date();
        var todayJalali = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
        var isCurrentMonth = todayJalali[0] === jy && todayJalali[1] === jm;

        var firstDay = new Date(jalaliToGregorian(jy, jm, 1)[0], jalaliToGregorian(jy, jm, 1)[1] - 1, jalaliToGregorian(jy, jm, 1)[2]);
        // Python: Saturday = 0. JS: Sunday = 0. Convert: (jsDay + 1) % 7
        var startWeekday = (firstDay.getDay() + 1) % 7;
        var daysInMonth = monthLength(jy, jm);

        var html = '<div class="unfold-jalali-calendar" data-jy="' + jy + '" data-jm="' + jm + '">';
        html += '<div class="unfold-jalali-header">';
        html += '<button type="button" class="unfold-jalali-prev" data-action="prev">›</button>';
        html += '<span class="unfold-jalali-title">' + MONTHS[jm - 1] + " " + toPersianDigits(jy) + "</span>";
        html += '<button type="button" class="unfold-jalali-next" data-action="next">‹</button>';
        html += "</div>";
        html += '<div class="unfold-jalali-weekdays">';
        for (var i = 0; i < 7; i++) {
            html += "<span>" + WEEKDAYS[i] + "</span>";
        }
        html += "</div>";
        html += '<div class="unfold-jalali-days">';
        for (var i = 0; i < startWeekday; i++) {
            html += '<span class="unfold-jalali-empty"></span>';
        }
        for (var d = 1; d <= daysInMonth; d++) {
            var classes = "unfold-jalali-day";
            if (isCurrentMonth && d === todayJalali[2]) classes += " unfold-jalali-today";
            if (d === selectedJd) classes += " unfold-jalali-selected";
            html += '<button type="button" class="' + classes + '" data-day="' + d + '">' + toPersianDigits(d) + "</button>";
        }
        html += "</div>";
        html += "</div>";
        return html;
    }

    // Get or create the popup element
    function getPopup() {
        var popup = document.getElementById("unfold-jalali-popup");
        if (!popup) {
            popup = document.createElement("div");
            popup.id = "unfold-jalali-popup";
            popup.className = "unfold-jalali-popup";
            popup.style.cssText = "position:absolute;z-index:9999;background:#fff;border:1px solid #d1d5db;border-radius:6px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);padding:8px;display:none;font-family:Vazirmatn,sans-serif;direction:rtl;";
            document.body.appendChild(popup);
        }
        return popup;
    }

    function closePopup() {
        var popup = getPopup();
        popup.style.display = "none";
        popup.innerHTML = "";
    }

    function showPopup(inputEl, viewJy, viewJm, selectedJd) {
        var popup = getPopup();
        popup.innerHTML = buildCalendarHTML(viewJy, viewJm, selectedJd);
        popup.style.display = "block";

        // Position relative to input
        var rect = inputEl.getBoundingClientRect();
        popup.style.top = rect.bottom + window.scrollY + 4 + "px";
        popup.style.left = rect.left + window.scrollX + "px";

        // Bind navigation
        popup.querySelector(".unfold-jalali-prev").onclick = function () {
            var newM = viewJm - 1;
            var newY = jy;
            if (newM < 1) { newM = 12; newY = viewJy - 1; }
            showPopup(inputEl, newY, newM, selectedJd);
        };
        popup.querySelector(".unfold-jalali-next").onclick = function () {
            var newM = viewJm + 1;
            var newY = viewJy;
            if (newM > 12) { newM = 1; newY = viewJy + 1; }
            showPopup(inputEl, newY, newM, selectedJd);
        };

        // Bind day clicks
        var days = popup.querySelectorAll(".unfold-jalali-day");
        for (var i = 0; i < days.length; i++) {
            days[i].onclick = function () {
                var day = parseInt(this.getAttribute("data-day"), 10);
                var g = jalaliToGregorian(viewJy, viewJm, day);
                var isoDate = g[0] + "-" + pad(g[1]) + "-" + pad(g[2]);
                inputEl.setAttribute("data-gregorian", isoDate);
                inputEl.value = format(viewJy, viewJm, day, "%Y/%m/%d");
                inputEl.dispatchEvent(new Event("change", { bubbles: true }));
                closePopup();
            };
        }
    }

    function init(root) {
        root = root || document;
        var inputs = root.querySelectorAll('input[data-jalali-datepicker]:not([data-jalali-bound])');
        for (var i = 0; i < inputs.length; i++) {
            (function (input) {
                input.setAttribute("data-jalali-bound", "1");
                input.setAttribute("dir", "rtl");
                input.style.fontFamily = "Vazirmatn, sans-serif";

                // If the input already has a Gregorian value, convert for display
                if (input.value && /^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
                    var parts = input.value.split("-").map(Number);
                    var j = gregorianToJalali(parts[0], parts[1], parts[2]);
                    input.value = format(j[0], j[1], j[2], "%Y/%m/%d");
                    input.setAttribute("data-gregorian", input.value);
                }

                // Convert on blur — the form submits the Gregorian ISO date
                input.addEventListener("blur", function () {
                    var displayed = input.value.trim();
                    if (!displayed) {
                        input.removeAttribute("data-gregorian");
                        return;
                    }
                    // Convert Persian digits
                    var latin = displayed.replace(/[۰-۹]/g, function (d) {
                        return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
                    });
                    var m = latin.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
                    if (m) {
                        var jy = +m[1], jm = +m[2], jd = +m[3];
                        var g = jalaliToGregorian(jy, jm, jd);
                        input.setAttribute("data-gregorian", g[0] + "-" + pad(g[1]) + "-" + pad(g[2]));
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
                    var initialJy, initialJm, initialJd;
                    var g = input.getAttribute("data-gregorian");
                    if (g && /^\d{4}-\d{2}-\d{2}$/.test(g)) {
                        var parts = g.split("-").map(Number);
                        var j = gregorianToJalali(parts[0], parts[1], parts[2]);
                        initialJy = j[0]; initialJm = j[1]; initialJd = j[2];
                    } else {
                        var today = new Date();
                        var tj = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
                        initialJy = tj[0]; initialJm = tj[1]; initialJd = tj[2];
                    }
                    showPopup(input, initialJy, initialJm, initialJd);
                });

                // Click outside to close
                document.addEventListener("click", function (e) {
                    if (!input.contains(e.target) && !getPopup().contains(e.target)) {
                        closePopup();
                    }
                });
            })(inputs[i]);
        }
    }

    // Expose API
    window.UnfoldJalali = {
        gregorianToJalali: gregorianToJalali,
        jalaliToGregorian: jalaliToGregorian,
        isLeapYear: isLeapYear,
        monthLength: monthLength,
        format: format,
        toPersianDigits: toPersianDigits,
        init: init,
    };

    // Auto-init on DOMContentLoaded
    document.addEventListener("DOMContentLoaded", function () {
        init();
    });

    // Style injection (once)
    if (!document.getElementById("unfold-jalali-styles")) {
        var style = document.createElement("style");
        style.id = "unfold-jalali-styles";
        style.textContent = [
            ".unfold-jalali-calendar { width: 280px; direction: rtl; }",
            ".unfold-jalali-header { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; margin-bottom: 8px; }",
            ".unfold-jalali-title { font-weight: 600; font-size: 14px; }",
            ".unfold-jalali-prev, .unfold-jalali-next { background: none; border: none; cursor: pointer; font-size: 18px; padding: 4px 8px; color: #4b5563; }",
            ".unfold-jalali-prev:hover, .unfold-jalali-next:hover { color: #111827; }",
            ".unfold-jalali-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 4px; }",
            ".unfold-jalali-weekdays span { text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; padding: 4px 0; }",
            ".unfold-jalali-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }",
            ".unfold-jalali-empty { }",
            ".unfold-jalali-day { background: none; border: none; cursor: pointer; font-size: 13px; padding: 6px 0; text-align: center; border-radius: 4px; color: #1f2937; }",
            ".unfold-jalali-day:hover { background: #f3f4f6; }",
            ".unfold-jalali-today { font-weight: 700; color: #2563eb; }",
            ".unfold-jalali-selected { background: #2563eb; color: #fff !important; }",
            ".unfold-jalali-popup { font-family: Vazirmatn, sans-serif; }",
        ].join("\n");
        document.head.appendChild(style);
    }
})();
