"use strict";
/* Working listings: search, filters, sorting, favorites, mortgage calculator, inquiry form. */
(function () {
  var API = "https://gfk-api.mahmodsalah.workers.dev/v1/real-state";
  var TYPES = { apartment: "شقة", villa: "فيلا", office: "مكتب", land: "أرض", chalet: "شاليه" };
  var ICON = { apartment: "🏢", villa: "🏡", office: "🏬", land: "🌳", chalet: "🏖️" };
  var $ = function (id) { return document.getElementById(id); };
  var data = window.LISTINGS || [];
  var favs = [];
  try { favs = JSON.parse(localStorage.getItem("rs_favs") || "[]"); } catch (e) {}
  var state = { q: "", city: "", type: "", beds: 0, max: 0, sort: "new", onlyFav: false };

  function fmt(n) { return Number(n).toLocaleString("ar-EG"); }
  function filter(list, s, favIds) {
    var q = (s.q || "").trim().toLowerCase();
    var out = list.filter(function (l) {
      if (s.onlyFav && favIds.indexOf(l.id) < 0) return false;
      if (s.city && l.city !== s.city) return false;
      if (s.type && l.type !== s.type) return false;
      if (s.beds && l.beds < s.beds) return false;
      if (s.max && l.price > s.max) return false;
      if (q && (l.title + " " + l.city + " " + (TYPES[l.type] || "")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var by = { new: 0, low: 1, high: 2, area: 3 }[s.sort] || 0;
    if (by === 1) out.sort(function (a, b) { return a.price - b.price; });
    if (by === 2) out.sort(function (a, b) { return b.price - a.price; });
    if (by === 3) out.sort(function (a, b) { return b.area - a.area; });
    return out;
  }
  /* standard annuity payment; rate in percent per year */
  function monthly(price, down, years, rate) {
    var p = Math.max(0, price - down), n = Math.round(years * 12), r = rate / 1200;
    if (p === 0 || n <= 0) return 0;
    if (r === 0) return p / n;
    return p * r / (1 - Math.pow(1 + r, -n));
  }
  var api = { filter: filter, monthly: monthly };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  window.RS = api;

  function saveFavs() { try { localStorage.setItem("rs_favs", JSON.stringify(favs)); } catch (e) {} }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function render() {
    var res = filter(data, state, favs), grid = $("ls-grid");
    grid.textContent = "";
    $("ls-count").textContent = res.length ? "عدد النتائج: " + fmt(res.length) : "";
    $("ls-empty").hidden = res.length > 0;
    res.forEach(function (l) {
      var card = el("article", "ls-card"), top = el("div", "ls-thumb t-" + l.type), isFav = favs.indexOf(l.id) >= 0;
      top.appendChild(el("span", "ls-ico", ICON[l.type] || "🏠")); top.appendChild(el("span", "ls-tag", l.tag));
      var fb = el("button", "ls-fav" + (isFav ? " on" : ""), isFav ? "♥" : "♡");
      fb.type = "button"; fb.setAttribute("aria-pressed", isFav ? "true" : "false"); fb.setAttribute("aria-label", isFav ? "شيل من المفضلة" : "ضيف للمفضلة");
      fb.addEventListener("click", function () { var i = favs.indexOf(l.id); if (i >= 0) favs.splice(i, 1); else favs.push(l.id); saveFavs(); render(); });
      top.appendChild(fb);
      var body = el("div", "ls-body");
      body.appendChild(el("h3", "ls-title", l.title));
      body.appendChild(el("p", "ls-city", TYPES[l.type] + " · " + l.city));
      var meta = el("p", "ls-meta", fmt(l.area) + " م²" + (l.beds ? " · " + fmt(l.beds) + " غرف" : "") + (l.baths ? " · " + fmt(l.baths) + " حمام" : ""));
      var price = el("p", "ls-price", fmt(l.price) + " ج.م");
      var row = el("div", "ls-row"), b1 = el("button", "ls-btn", "اسأل عن العقار"), b2 = el("button", "ls-btn ghost", "احسب القسط");
      b1.type = "button"; b2.type = "button";
      b1.addEventListener("click", function () { openInquiry(l); });
      b2.addEventListener("click", function () { $("mc-price").value = l.price; $("mc-down").value = Math.round(l.price * 0.2); calc(); $("calculator").scrollIntoView({ behavior: "smooth" }); });
      row.append(b1, b2); body.append(meta, price, row); card.append(top, body); grid.appendChild(card);
    });
  }

  function calc() {
    var price = +$("mc-price").value || 0, down = +$("mc-down").value || 0, yrs = +$("mc-years").value || 0, rate = +$("mc-rate").value || 0;
    var m = monthly(price, down, yrs, rate), n = Math.round(yrs * 12), total = m * n;
    $("mc-out").textContent = m > 0 ? fmt(Math.round(m)) + " ج.م / شهر" : "-";
    $("mc-total").textContent = m > 0 ? "إجمالي المدفوع: " + fmt(Math.round(total + down)) + " ج.م · الفوائد: " + fmt(Math.round(total - Math.max(0, price - down))) + " ج.م" : "";
  }

  var current = null;
  function openInquiry(l) {
    current = l; $("iq-ref").textContent = l ? l.title + " (" + l.id + ")" : "استفسار عام";
    $("iq-msg-s").hidden = true; $("iq-dialog").hidden = false; $("iq-name").focus();
  }
  function closeInquiry() { $("iq-dialog").hidden = true; }
  function submitInquiry(e) {
    e.preventDefault();
    var body = { name: $("iq-name").value, phone: $("iq-phone").value, message: $("iq-message").value, ref: current ? current.id : "general" };
    var s = $("iq-msg-s"), btn = $("iq-send"); btn.disabled = true; s.hidden = false; s.textContent = "بنبعت...";
    fetch(API + "/inq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function (r) {
      if (r.ok) { s.textContent = "وصل استفسارك، هنتواصل معاك قريب."; $("iq-form").reset(); }
      else if (r.status === 429) s.textContent = "بعتّ استفسارات كتير، جرّب بعد ساعة.";
      else s.textContent = "راجع البيانات (الاسم، رقم تليفون صحيح، رسالة).";
    }).catch(function () { s.textContent = "السيرفر مش متاح دلوقتي، جرّب بعد شوية."; }).then(function () { btn.disabled = false; });
  }

  function init() {
    var cities = [], seen = {}; data.forEach(function (l) { if (!seen[l.city]) { seen[l.city] = 1; cities.push(l.city); } });
    cities.forEach(function (c) { var o = el("option", "", c); o.value = c; $("f-city").appendChild(o); });
    Object.keys(TYPES).forEach(function (t) { var o = el("option", "", TYPES[t]); o.value = t; $("f-type").appendChild(o); });
    var bind = function (id, key, num) { $(id).addEventListener("input", function () { state[key] = num ? +this.value : this.value; render(); }); };
    bind("f-q", "q"); bind("f-city", "city"); bind("f-type", "type"); bind("f-beds", "beds", true); bind("f-max", "max", true); bind("f-sort", "sort");
    $("f-fav").addEventListener("change", function () { state.onlyFav = this.checked; render(); });
    $("f-reset").addEventListener("click", function () { state = { q: "", city: "", type: "", beds: 0, max: 0, sort: "new", onlyFav: false }; ["f-q", "f-city", "f-type", "f-beds", "f-max"].forEach(function (i) { $(i).value = i === "f-beds" || i === "f-max" ? "0" : ""; }); $("f-sort").value = "new"; $("f-fav").checked = false; render(); });
    ["mc-price", "mc-down", "mc-years", "mc-rate"].forEach(function (i) { $(i).addEventListener("input", calc); });
    $("iq-form").addEventListener("submit", submitInquiry); $("iq-close").addEventListener("click", closeInquiry);
    $("iq-dialog").addEventListener("click", function (e) { if (e.target === this) closeInquiry(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeInquiry(); });
    $("contact-open").addEventListener("click", function () { openInquiry(null); });
    /* hero search box jumps to the listings with the text applied */
    var hs = document.querySelector(".search-input"), hb = document.querySelector(".search-btn");
    function heroSearch() { state.q = hs.value; $("f-q").value = hs.value; render(); $("listings").scrollIntoView({ behavior: "smooth" }); }
    hb.addEventListener("click", heroSearch); hs.addEventListener("keydown", function (e) { if (e.key === "Enter") heroSearch(); });
    /* remember the theme */
    var dark = false; try { dark = localStorage.getItem("rs_theme") === "dark"; } catch (e) {}
    if (dark) { document.body.classList.add("dark-theme"); $("moon-icon").style.display = "none"; $("sun-icon").style.display = "block"; }
    $("theme-toggle").addEventListener("click", function () { try { localStorage.setItem("rs_theme", document.body.classList.contains("dark-theme") ? "dark" : "light"); } catch (e) {} });
    render(); calc();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
