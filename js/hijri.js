/* ================================================================
   Salah Bloom — Hijri date helper
   Uses the standard tabular (civil) Islamic calendar algorithm.
   This is an arithmetic approximation — actual moon-sighting dates
   for a given region may differ by a day or so, which is normal
   for any calculated Hijri date.
   ================================================================ */

(function (global) {
  function gregorianToJDN(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  function jdnToHijri(jdn) {
    let j = jdn - 1948440 + 10632;
    const n = Math.floor((j - 1) / 10631);
    j = j - 10631 * n + 354;
    const jj = Math.floor((10985 - j) / 5316) * Math.floor((50 * j) / 17719) +
               Math.floor(j / 5670) * Math.floor((43 * j) / 15238);
    j = j - Math.floor((30 - jj) / 15) * Math.floor((17719 * jj) / 50) -
        Math.floor(jj / 16) * Math.floor((15238 * jj) / 43) + 29;
    const month = Math.floor((24 * j) / 709);
    const day = j - Math.floor((709 * month) / 24);
    const year = 30 * n + jj - 30;
    return { year, month, day };
  }

  const MONTH_NAMES = [
    'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'
  ];

  function getHijriDate(date) {
    const jdn = gregorianToJDN(date);
    const h = jdnToHijri(jdn);
    return { year: h.year, month: h.month, day: h.day, monthName: MONTH_NAMES[h.month - 1] };
  }

  function formatHijri(date) {
    const h = getHijriDate(date);
    return `${h.day} ${h.monthName} ${h.year} AH`;
  }

  global.SalahHijri = { getHijriDate, formatHijri, MONTH_NAMES };
})(window);
