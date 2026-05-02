// OS4CSAPI Code Sprint Guide — generic widget script
// Expects window.SPRINT_EVENT (populated by the event page)

(function () {
    'use strict';

    var event = window.SPRINT_EVENT;
    if (!event) return;

    var startDate = new Date(event.startDateTimeISO);
    var endDate = new Date(event.endDateTimeISO);

    // -------- Countdown --------
    var countdownEl = document.getElementById('countdown');
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function updateCountdown() {
        if (!countdownEl) return;
        var now = new Date();
        var diff = startDate - now;
        if (diff <= 0) {
            if (now <= endDate) {
                var dayMs = 24 * 60 * 60 * 1000;
                var dayNumber = Math.floor((now - startDate) / dayMs) + 1;
                if (dayNumber < 1) dayNumber = 1;
                if (dayNumber > 3) dayNumber = 3;
                countdownEl.textContent = 'Sprint in progress — Day ' + dayNumber + ' of 3';
            } else {
                countdownEl.innerHTML = 'Sprint complete. Share your wrap-up in <a href="' + event.links.discussions + '" target="_blank" rel="noopener">OS4CSAPI Discussions</a>.';
            }
            return;
        }
        var d = Math.floor(diff / (1000 * 60 * 60 * 24));
        var h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        var m = Math.floor((diff / (1000 * 60)) % 60);
        var s = Math.floor((diff / 1000) % 60);
        countdownEl.innerHTML =
            '<span class="cd-num">' + d + '</span><span class="cd-lbl">d</span> ' +
            '<span class="cd-num">' + pad(h) + '</span><span class="cd-lbl">h</span> ' +
            '<span class="cd-num">' + pad(m) + '</span><span class="cd-lbl">m</span> ' +
            '<span class="cd-num">' + pad(s) + '</span><span class="cd-lbl">s</span>';
    }

    // -------- Calendar --------
    function renderCalendar() {
        var host = document.getElementById('calendar');
        if (!host) return;
        var year = event.calendarYear;
        var month = event.calendarMonthZeroIndexed;
        var sprintDays = event.sprintDays || [];
        var firstDay = new Date(year, month, 1);
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var today = new Date();

        var html = '<div class="calendar-grid">';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (d) {
            html += '<div class="calendar-header">' + d + '</div>';
        });
        for (var i = 0; i < firstDay.getDay(); i++) {
            html += '<div class="calendar-cell empty"></div>';
        }
        for (var day = 1; day <= daysInMonth; day++) {
            var classes = ['calendar-cell'];
            if (sprintDays.indexOf(day) !== -1) classes.push('sprint-day');
            if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day) classes.push('today');
            html += '<div class="' + classes.join(' ') + '">' + day + '</div>';
        }
        html += '</div>';
        host.innerHTML = html;
    }

    // -------- Time zones --------
    function getOffsetMinutes(date, timeZone) {
        try {
            var parts = new Intl.DateTimeFormat('en-US', {
                timeZone: timeZone,
                timeZoneName: 'shortOffset'
            }).formatToParts(date);
            var tzPart = parts.find(function (p) { return p.type === 'timeZoneName'; });
            if (!tzPart) return 0;
            var match = tzPart.value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
            if (!match) return 0; // GMT exactly
            var sign = match[1] === '-' ? -1 : 1;
            var hours = parseInt(match[2], 10);
            var minutes = match[3] ? parseInt(match[3], 10) : 0;
            return sign * (hours * 60 + minutes);
        } catch (e) {
            return 0;
        }
    }

    function formatLocalTime(date, timeZone) {
        try {
            return new Intl.DateTimeFormat(undefined, {
                timeZone: timeZone,
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit',
                hour12: false
            }).format(date);
        } catch (e) {
            return '—';
        }
    }

    function buildTimeZoneRows() {
        var tbody = document.querySelector('#timezone-table tbody');
        if (!tbody) return null;
        var now = new Date();
        var londonOffset = getOffsetMinutes(now, event.eventTimeZoneIANA);
        var rows = [];
        (event.timeZones || []).forEach(function (z) {
            var tr = document.createElement('tr');
            var offset = getOffsetMinutes(now, z.iana) - londonOffset;
            var offsetText;
            if (offset === 0) offsetText = 'Same as London';
            else {
                var hh = offset / 60;
                offsetText = (hh > 0 ? '+' : '') + hh + ' h';
            }
            tr.innerHTML =
                '<td>' + z.label + '</td>' +
                '<td><code class="small">' + z.iana + '</code></td>' +
                '<td class="local-time" data-tz="' + z.iana + '">' + formatLocalTime(now, z.iana) + '</td>' +
                '<td>' + offsetText + '</td>';
            tbody.appendChild(tr);
            rows.push(tr);
        });
        return rows;
    }

    function refreshLocalTimes() {
        var cells = document.querySelectorAll('#timezone-table .local-time');
        var now = new Date();
        cells.forEach(function (cell) {
            cell.textContent = formatLocalTime(now, cell.getAttribute('data-tz'));
        });
    }

    // -------- Init --------
    document.addEventListener('DOMContentLoaded', function () {
        renderCalendar();
        updateCountdown();
        buildTimeZoneRows();
        setInterval(updateCountdown, 1000);
        // Local time clocks every 30s — that's plenty of resolution for the row format.
        setInterval(refreshLocalTimes, 30000);
    });
})();
