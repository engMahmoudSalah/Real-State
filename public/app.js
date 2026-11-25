import { canvasEl, reveal, tilt } from "/fx.js";
import { $, h, api, siteFooter, byMahmoudView, setDict, toast, guard, modal, fmtDate, ago, initTheme, field, authForm, plansView, adminView } from "/kit.js";
setDict({ "Welcome back": "أهلًا بعودتك", "Create your account": "أنشئ حسابك", "Log in": "تسجيل الدخول", "Create account": "إنشاء حساب", Name: "الاسم", Email: "البريد الإلكتروني", Password: "كلمة المرور", "Your name": "اسمك", "At least 8 characters": "8 حروف على الأقل", "New here? ": "جديد هنا؟ ", "Already have an account? ": "عندك حساب؟ ", "Create an account": "أنشئ حسابًا", "Enter your email.": "اكتب بريدك الإلكتروني.", "Enter your password.": "اكتب كلمة المرور.", "Your plan": "خطتك", "Coming soon": "قريبًا", "Admin dashboard": "لوحة الإدارة", Users: "المستخدمون", "New (7 days)": "جدد (7 أيام)", "Active (7 days)": "نشطون (7 أيام)", "Pro (draft)": "احترافي (مسودة)", Suspended: "موقوف", User: "المستخدم", Role: "الدور", Plan: "الخطة", Status: "الحالة", Joined: "الانضمام", "Audit log": "سجل العمليات", When: "التوقيت", Who: "من", Action: "الإجراء", Detail: "التفاصيل", Admin: "الإدارة", Claim: "تفعيل", "Admin key": "مفتاح الإدارة", Close: "إغلاق", "By Mahmoud": "من أعمال محمود", "Every project I have built, live and free to try.": "كل المشاريع اللي بنيتها، شغالة وجرّبها مجانًا.", "You are here": "أنت هنا", "Admin access granted": "تم تفعيل صلاحية الإدارة", "Payments are not active yet": "الدفع غير مفعّل حاليًا", "You are not an admin. If you own this site, enter the admin key to claim access.": "إنت مش مدير. لو إنت صاحب الموقع اكتب مفتاح الإدارة لتفعيل الصلاحية.",
  "Enter a valid email address.": "اكتب بريدًا إلكترونيًا صحيحًا.", "Enter your name (at least 2 characters).": "اكتب اسمك (حرفين على الأقل).", "Password must be at least 8 characters.": "كلمة المرور 8 حروف على الأقل.", "That email already has an account. Try logging in.": "البريد ده عليه حساب بالفعل. جرّب تسجيل الدخول.", "Wrong email or password.": "البريد أو كلمة المرور غير صحيحة.", "This account is suspended.": "الحساب ده موقوف.", "Please log in to continue.": "سجّل الدخول للمتابعة.", "Too many attempts. Please wait a few minutes and try again.": "محاولات كتير. استنى دقائق وحاول تاني.", "Admins only.": "للإدارة فقط.", "Invalid admin key.": "مفتاح الإدارة غير صحيح.", "Current password is wrong.": "كلمة المرور الحالية غلط.", "New password must be at least 8 characters.": "كلمة المرور الجديدة 8 حروف على الأقل.", "No connection. Check your internet and try again.": "مفيش اتصال. تأكد من الإنترنت وحاول تاني.", "Something went wrong on our side. Please try again.": "حصلت مشكلة عندنا. حاول تاني.", "Cross-site request blocked.": "الطلب مرفوض.", "Not found.": "غير موجود." });
const toggleTheme = initTheme();
const S = { user: null };
const app = $("#app");
const TYPES = { apartment: "شقة", villa: "فيلا", office: "مكتب", land: "أرض", chalet: "شاليه", shop: "محل" };
const ICON = { apartment: "🏢", villa: "🏡", office: "🏬", land: "🌳", chalet: "🏖️", shop: "🏪" };
const fmt = (n) => Number(n).toLocaleString("ar-EG");
const money = (l) => `${fmt(l.price)} ج.م${l.purpose === "rent" ? " / شهر" : ""}`;
const STATUS = { pending: ["قيد المراجعة", "warn"], approved: ["منشور", "ok"], rejected: ["مرفوض", "bad"], sold: ["تم البيع/التأجير", ""] };

function shell(content, active) {
  const items = [["#/", "الرئيسية", "home"], ["#/favs", "المفضلة", "favs"]];
  if (S.user) { if (S.user.kind === "agent" || S.user.role === "admin") items.push(["#/dash", "إعلاناتي", "dash"], ["#/inbox", "الاستفسارات", "inbox"]); else items.push(["#/mine", "استفساراتي", "mine"]); }
  items.push(["#/plans", "الخطط", "plans"]); if (S.user && S.user.role === "admin") items.push(["#/admin", "الإدارة", "admin"]);
  items.push(S.user ? ["#/account", "حسابي", "account"] : ["#/login", "دخول", "login"]);
  app.replaceChildren(h("header", { class: "topbar" }, h("div", { class: "in" }, h("a", { class: "brand", href: "#/" }, h("span", { class: "lg" }, "⌂"), h("span", {}, "عقار")), h("nav", { class: "nav", "aria-label": "القائمة" }, items.map(([href, t, k]) => h("a", { href, class: active === k ? "on" : "" }, t))), h("button", { class: "btn sm", "aria-label": "تبديل الوضع الداكن", onclick: toggleTheme }, "◐"))), h("main", {}, content), siteFooter());
}
const skyline = () => { const b = [[0, 60, 40], [46, 90, 34], [86, 40, 44], [136, 110, 38], [180, 70, 50], [236, 100, 36], [278, 50, 46], [330, 84, 40], [376, 64, 42], [424, 104, 36], [466, 56, 48], [520, 80, 40]]; let s = '<svg viewBox="0 0 560 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true" style="width:100%;height:80px;display:block">'; b.forEach(([x, hh, w], i) => { s += `<rect x="${x}" y="${130 - hh}" width="${w}" height="${hh}" rx="3" fill="var(--accent)" opacity="${.25 + (i % 3) * .1}"/>`; for (let r = 0; r < Math.floor(hh / 18); r++) for (let c = 0; c < Math.floor(w / 14); c++) s += `<rect class="win" style="animation-delay:${((i * 7 + r * 3 + c * 5) % 11) * .4}s" x="${x + 6 + c * 14}" y="${130 - hh + 8 + r * 18}" width="7" height="9" rx="1.5" fill="var(--surface)"/>`; }); return s + "</svg>"; };
const card = (l, favs) => {
  const fav = S.user ? h("button", { class: "favb" + (l.fav ? " on" : ""), "aria-label": "المفضلة", "aria-pressed": !!l.fav, onclick: (e) => { e.preventDefault(); e.stopPropagation(); const btn = e.currentTarget; guard(async () => { await api(`/api/favs/${l.id}`, l.fav ? null : {}, l.fav ? "DELETE" : "POST"); l.fav = !l.fav; btn.classList.toggle("on", l.fav); }); } }, "♥") : null;
  return h("a", { class: "card lcard", href: `#/l/${l.id}` }, h("div", { class: "ph" }, l.images[0] ? h("img", { src: l.images[0], alt: l.title, loading: "lazy", referrerpolicy: "no-referrer", onerror: (e) => e.target.replaceWith(document.createTextNode(ICON[l.type])) }) : ICON[l.type], h("span", { class: "badge acc tagc" }, l.purpose === "rent" ? "للإيجار" : "للبيع"), fav),
    h("div", { class: "bd" }, h("div", { class: "price" }, money(l)), h("b", {}, l.title), h("div", { class: "muted small" }, `${l.city}${l.district ? "، " + l.district : ""}`), h("div", { class: "specs" }, l.beds ? h("span", {}, `🛏 ${l.beds}`) : null, l.baths ? h("span", {}, `🚿 ${l.baths}`) : null, h("span", {}, `📐 ${fmt(l.area)} م²`), h("span", {}, TYPES[l.type])), l.sample ? h("span", { class: "badge" }, "نموذجي") : null));
};
const F = { q: "", city: "", type: "", purpose: "", min: "", max: "", beds: "", sort: "new", page: 0 };
async function home() {
  const grid = h("div", { class: "grid" }), more = h("div", { class: "row", style: "justify-content:center" });
  const sel = (key, label, opts) => field(label, h("select", { onchange: (e) => { F[key] = e.target.value; F.page = 0; run(); } }, opts.map(([v, t]) => h("option", { value: v, selected: F[key] === v }, t))));
  const inp = (key, label, ph, type = "text") => field(label, h("input", { type, inputmode: type === "number" ? "numeric" : null, placeholder: ph, value: F[key], oninput: (e) => { F[key] = e.target.value; clearTimeout(inp.t); inp.t = setTimeout(() => { F.page = 0; run(); }, 350); } }));
  const citySel = h("div", {}); let cities = [];
  const run = async (append) => {
    const qs = new URLSearchParams(Object.entries(F).filter(([, v]) => v !== "" && v !== 0)); if (F.page) qs.set("page", F.page);
    let d; try { d = await api("/api/listings?" + qs); } catch (e) { grid.replaceChildren(h("div", { class: "card empty" }, e.message)); return; }
    if (S.user) { try { const f = (await api("/api/favs")).listings; const ids = new Set(f.map((x) => x.id)); d.listings.forEach((l) => (l.fav = ids.has(l.id))); } catch { /* ignore */ } }
    if (!append) grid.replaceChildren(); d.listings.forEach((l) => { const c = card(l); c.classList.add("reveal"); grid.append(c); }); reveal(grid);
    if (!grid.children.length) grid.append(h("div", { class: "card empty", style: "grid-column:1/-1" }, "مفيش عقارات مطابقة. جرّب تغيّر البحث."));
    more.replaceChildren(d.more ? h("button", { class: "btn", onclick: () => { F.page++; run(true); } }, "عرض المزيد") : null);
    if (!cities.length) { cities = d.cities; citySel.replaceChildren(sel("city", "المدينة", [["", "كل المدن"], ...cities.map((c) => [c, c])])); }
  };
  shell(h("div", { class: "stack" }, h("section", { class: "hero2 fxwrap" }, h("div", { class: "fxbg" }, canvasEl("p")), h("div", { class: "sky", html: skyline() }), h("div", { class: "fxart floaty", style: "height:150px" }, canvasEl("wire", "house")), h("h1", {}, "لاقي بيتك الجاي في مصر"), h("p", { class: "muted" }, "شقق وفلل ومكاتب وشاليهات للبيع والإيجار. احفظ المفضلة وتواصل مع المعلن مباشرة."),
    h("div", { class: "filters" }, inp("q", "بحث", "المدينة أو المنطقة أو العنوان"), citySel, sel("purpose", "الغرض", [["", "الكل"], ["sale", "للبيع"], ["rent", "للإيجار"]]), sel("type", "النوع", [["", "الكل"], ...Object.entries(TYPES)]), inp("min", "أقل سعر", "ج.م", "number"), inp("max", "أعلى سعر", "ج.م", "number"), sel("beds", "غرف النوم", [["", "أي عدد"], ["1", "1+"], ["2", "2+"], ["3", "3+"], ["4", "4+"]]), sel("sort", "الترتيب", [["new", "الأحدث"], ["price_asc", "السعر: الأقل"], ["price_desc", "السعر: الأعلى"], ["area_desc", "المساحة"]]))), grid, more), "home");
  run();
}
const mortgage = (price) => {
  const down = h("input", { type: "number", value: 20, min: 0, max: 90 }), yrs = h("input", { type: "number", value: 15, min: 1, max: 30 }), rate = h("input", { type: "number", value: 18, step: 0.5, min: 0, max: 40 }), out = h("div", { class: "price" });
  const calc = () => { const P = price * (1 - (+down.value || 0) / 100), r = (+rate.value || 0) / 1200, n = (+yrs.value || 1) * 12; const pay = r ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n; out.textContent = `القسط الشهري: ${fmt(Math.round(pay))} ج.م`; };
  [down, yrs, rate].forEach((i) => i.addEventListener("input", calc)); calc();
  return h("div", { class: "card stack" }, h("h3", {}, "حاسبة القسط"), field("الدفعة المقدمة %", down), field("المدة (سنوات)", yrs), field("الفائدة السنوية %", rate), out, h("div", { class: "small muted" }, "تقدير تقريبي وليس عرضًا من بنك."));
};
async function detail(id) {
  const d = await api(`/api/listings/${id}`); const l = d.listing; document.title = `${l.title} · عقار`; l.fav = d.fav;
  const name = h("input", { value: S.user ? S.user.name : "", maxlength: 60 }), phone = h("input", { type: "tel", inputmode: "tel", placeholder: "01xxxxxxxxx", maxlength: 20 }), email = h("input", { type: "email", value: S.user ? S.user.email : "" }), msg = h("textarea", { placeholder: `أنا مهتم بـ "${l.title}". ممكن تفاصيل أكتر؟` });
  const hp = h("input", { class: "hp", name: "website", tabindex: "-1", autocomplete: "off", "aria-hidden": "true" });
  const form = h("form", { class: "card stack", onsubmit: (e) => { e.preventDefault(); guard(async () => { await api("/api/inquiries", { listing: l.id, name: name.value, phone: phone.value, email: email.value, msg: msg.value, website: hp.value }); form.replaceChildren(h("div", { class: "stack" }, h("h3", {}, "تم إرسال استفسارك ✓"), h("p", { class: "muted" }, l.sample ? "ده عقار نموذجي، فمفيش معلن حقيقي هيرد." : "المعلن هيتواصل معاك قريبًا."))); }); } }, h("h3", {}, "تواصل مع المعلن"), field("الاسم", name), field("الموبايل", phone), field("البريد الإلكتروني", email), field("رسالتك", msg), hp, h("button", { class: "btn pri" }, "إرسال الاستفسار"));
  shell(h("div", { class: "stack" }, h("a", { class: "btn sm", href: "#/", style: "align-self:flex-start" }, "→ رجوع"),
    l.images.length ? h("div", { class: "gal" }, l.images.map((s) => h("img", { src: s, alt: l.title, loading: "lazy", referrerpolicy: "no-referrer" }))) : h("div", { class: "card empty", style: "font-size:3rem" }, ICON[l.type]),
    h("div", { class: "two" }, h("div", { class: "stack" }, h("div", { class: "row spread" }, h("div", {}, h("h1", { style: "margin:0" }, l.title), h("div", { class: "muted" }, `${l.city}${l.district ? "، " + l.district : ""}`)), S.user ? h("button", { class: "btn", "aria-pressed": !!l.fav, onclick: (e) => { const btn = e.currentTarget; guard(async () => { await api(`/api/favs/${l.id}`, l.fav ? null : {}, l.fav ? "DELETE" : "POST"); l.fav = !l.fav; btn.textContent = l.fav ? "♥ في المفضلة" : "♡ أضف للمفضلة"; }); } }, l.fav ? "♥ في المفضلة" : "♡ أضف للمفضلة") : h("a", { class: "btn", href: "#/login" }, "سجّل دخول للحفظ")),
      h("div", { class: "price", style: "font-size:1.6rem" }, money(l)), l.status !== "approved" ? h("span", { class: "badge " + STATUS[l.status][1] }, STATUS[l.status][0]) : null, l.reason ? h("p", { class: "err" }, "سبب الرفض: " + l.reason) : null,
      h("div", { class: "card specs", style: "gap:22px;font-size:1rem" }, h("span", {}, "النوع: " + TYPES[l.type]), l.beds ? h("span", {}, "غرف: " + l.beds) : null, l.baths ? h("span", {}, "حمامات: " + l.baths) : null, h("span", {}, `المساحة: ${fmt(l.area)} م²`), h("span", {}, `${fmt(Math.round(l.price / l.area))} ج.م/م²`)),
      l.descr ? h("div", { class: "card" }, h("h3", {}, "الوصف"), h("p", { style: "white-space:pre-wrap;margin:0" }, l.descr)) : null,
      l.features.length ? h("div", { class: "row" }, l.features.map((f) => h("span", { class: "badge acc" }, f))) : null,
      h("div", { class: "muted small" }, `المعلن: ${l.agent} · ${fmt(l.views)} مشاهدة`), l.purpose === "sale" ? mortgage(l.price) : null),
      h("div", { class: "stack" }, form, l.phone && !l.sample ? h("a", { class: "btn", href: "tel:" + l.phone.replace(/\s/g, "") }, "اتصال: " + l.phone) : null))), "home");
}
async function favs() {
  if (!S.user) return location.replace("#/login");
  const d = await api("/api/favs"); d.listings.forEach((l) => (l.fav = true));
  shell(h("div", { class: "stack" }, h("h1", {}, "المفضلة"), d.listings.length ? h("div", { class: "grid" }, d.listings.map((l) => card(l))) : h("div", { class: "card empty" }, "لسه مفيش عقارات في المفضلة. اضغط ♥ على أي عقار لحفظه.")), "favs");
}
function chooseKind() {
  shell(h("div", { class: "card stack auth" }, h("h2", {}, "إنت هنا كـ إيه؟"), h("p", { class: "muted" }, "تقدر تتصفح وتتواصل كمشتري، أو تنشر إعلانات كوسيط/مالك."),
    h("button", { class: "btn pri", onclick: () => pick("buyer") }, "🔎 مشتري / مستأجر"), h("button", { class: "btn", onclick: () => pick("agent") }, "🏷️ وسيط / مالك (أنشر إعلانات)")), "");
  const pick = (k) => guard(async () => { S.user = (await api("/api/me/kind", { kind: k })).user; location.hash = k === "agent" ? "#/dash" : "#/"; route(); });
}
const FORM = (l) => { l = l || { purpose: "sale", type: "apartment", beds: 2, baths: 1, features: [], images: [] }; return l; };
async function dash() {
  const d = await api("/api/my/listings");
  shell(h("div", { class: "stack" }, h("div", { class: "row spread" }, h("h1", {}, "إعلاناتي"), h("button", { class: "btn pri", onclick: () => listingForm() }, "+ إعلان جديد")),
    d.listings.length ? d.listings.map((l) => h("div", { class: "card row spread" }, h("div", { class: "grow" }, h("a", { href: `#/l/${l.id}`, style: "font-weight:700" }, l.title), h("div", { class: "muted small" }, `${money(l)} · ${fmt(l.views)} مشاهدة`), l.reason ? h("div", { class: "err small" }, "سبب الرفض: " + l.reason) : null), h("span", { class: "badge " + STATUS[l.status][1] }, STATUS[l.status][0]),
      h("button", { class: "btn sm", onclick: () => listingForm(l) }, "تعديل"), l.status === "approved" ? h("button", { class: "btn sm", onclick: () => guard(async () => { await api(`/api/listings/${l.id}`, { status: "sold" }); dash(); }) }, "تم البيع") : null, h("button", { class: "btn sm danger", onclick: () => confirm("حذف الإعلان؟") && guard(async () => { await api(`/api/listings/${l.id}`, null, "DELETE"); dash(); }) }, "حذف")))
      : h("div", { class: "card empty" }, "لسه مفيش إعلانات. أضف أول إعلان وهيتراجع قبل النشر."), h("p", { class: "small muted" }, `الحد الأقصى لخطتك: ${d.limit} إعلانات نشطة. الإعلانات الجديدة والمعدّلة بتتراجع من الإدارة قبل ما تظهر.`)), "dash");
}
function listingForm(l0) {
  const l = FORM(l0); const f = {};
  const t = (k, label, props = {}) => (f[k] = h("input", { value: l[k] ?? "", ...props })) && field(label, f[k]);
  f.descr = h("textarea", {}, l.descr || ""); f.type = h("select", {}, Object.entries(TYPES).map(([v, n]) => h("option", { value: v, selected: l.type === v }, n))); f.purpose = h("select", {}, [["sale", "للبيع"], ["rent", "للإيجار"]].map(([v, n]) => h("option", { value: v, selected: l.purpose === v }, n)));
  f.features = h("input", { value: l.features.join("، "), placeholder: "مصعد، مواقف، أمن" }); f.images = h("textarea", { placeholder: "رابط صورة في كل سطر (https)" }, l.images.join("\n"));
  const m = modal(l0 ? "تعديل الإعلان" : "إعلان جديد", h("form", { class: "stack", onsubmit: (e) => { e.preventDefault(); guard(async () => {
    const data = { title: f.title.value, descr: f.descr.value, city: f.city.value, district: f.district.value, type: f.type.value, purpose: f.purpose.value, beds: f.beds.value, baths: f.baths.value, area: f.area.value, price: f.price.value, phone: f.phone.value, features: f.features.value.split(/[،,]/), images: f.images.value.split("\n") };
    if (l0) await api(`/api/listings/${l0.id}`, data); else await api("/api/listings", data); m.close(); toast("تم الحفظ. الإعلان في انتظار المراجعة."); dash();
  }); } }, t("title", "عنوان الإعلان", { maxlength: 120 }), field("الوصف", f.descr), h("div", { class: "grid", style: "grid-template-columns:repeat(auto-fit,minmax(140px,1fr))" }, t("city", "المدينة"), t("district", "المنطقة"), field("النوع", f.type), field("الغرض", f.purpose), t("beds", "غرف", { type: "number", min: 0 }), t("baths", "حمامات", { type: "number", min: 0 }), t("area", "المساحة (م²)", { type: "number", min: 1 }), t("price", "السعر (ج.م)", { type: "number", min: 1 }), t("phone", "موبايل للتواصل", { type: "tel" })),
    field("المميزات", f.features, "افصل بينها بفاصلة"), field("روابط الصور", f.images, "اختياري، حتى 5 صور"), h("button", { class: "btn pri" }, "حفظ وإرسال للمراجعة")), { wide: true });
}
const ST = { new: "جديد", read: "مقروء", replied: "تم الرد", closed: "مغلق" };
async function inbox() {
  const d = await api("/api/inbox");
  shell(h("div", { class: "stack" }, h("h1", {}, `الاستفسارات${d.unread ? ` (${d.unread} جديد)` : ""}`), d.inquiries.length ? d.inquiries.map((i) => { const rp = h("textarea", { placeholder: "اكتب ردك (بيظهر للمشتري لو عنده حساب)", style: "min-height:60px" }, i.reply || "");
    return h("div", { class: "card stack" }, h("div", { class: "row spread" }, h("b", {}, i.title), h("span", { class: "badge " + (i.status === "new" ? "warn" : "") }, ST[i.status])), h("div", {}, h("b", {}, i.name), h("span", { class: "muted small" }, ` · ${ago(i.created)}`)), h("div", { style: "white-space:pre-wrap" }, i.msg),
      h("div", { class: "row small" }, i.phone ? h("a", { href: "tel:" + i.phone }, "📞 " + i.phone) : null, i.email ? h("a", { href: "mailto:" + i.email }, "✉️ " + i.email) : null), rp,
      h("div", { class: "row" }, h("button", { class: "btn sm pri", onclick: () => guard(async () => { await api(`/api/inbox/${i.id}`, { reply: rp.value }); toast("تم حفظ الرد"); inbox(); }) }, "حفظ الرد"), ["read", "closed"].map((s) => h("button", { class: "btn sm", onclick: () => guard(async () => { await api(`/api/inbox/${i.id}`, { status: s }); inbox(); }) }, s === "read" ? "علّم كمقروء" : "إغلاق"))));
  }) : h("div", { class: "card empty" }, "لسه مفيش استفسارات.")), "inbox");
}
async function mine() {
  const d = await api("/api/my/inquiries");
  shell(h("div", { class: "stack" }, h("h1", {}, "استفساراتي"), d.inquiries.length ? d.inquiries.map((i) => h("div", { class: "card stack" }, h("a", { href: `#/l/${i.lid}`, style: "font-weight:700" }, i.title), h("div", {}, i.msg), i.reply ? h("div", { class: "card", style: "background:var(--accent-soft)" }, h("b", {}, "رد المعلن: "), i.reply) : h("span", { class: "badge" }, "في انتظار الرد"))) : h("div", { class: "card empty" }, "لسه ما بعتّش استفسارات.")), "mine");
}
async function admin() {
  const d = await api("/api/admin/pending").catch(() => ({ listings: [] }));
  const q = h("div", { class: "card stack" }, h("h2", {}, `إعلانات في انتظار المراجعة (${d.listings.length})`), d.listings.length ? d.listings.map((l) => { const why = h("input", { placeholder: "سبب الرفض (اختياري)" }); return h("div", { class: "card stack" }, h("a", { href: `#/l/${l.id}`, style: "font-weight:700" }, l.title), h("div", { class: "muted small" }, `${money(l)} · ${l.city} · ${l.agent} (${l.aemail})`), why, h("div", { class: "row" }, h("button", { class: "btn sm pri", onclick: () => guard(async () => { await api(`/api/admin/listing/${l.id}`, { status: "approved" }); admin(); }) }, "قبول"), h("button", { class: "btn sm danger", onclick: () => guard(async () => { await api(`/api/admin/listing/${l.id}`, { status: "rejected", reason: why.value }); admin(); }) }, "رفض"))); }) : h("p", { class: "muted" }, "مفيش إعلانات منتظرة. 🎉"));
  shell(h("div", { class: "stack" }, adminView("Aqar", (a) => h("div", { class: "grid" }, [["إعلانات حقيقية", a.listings], ["منشورة", a.approved], ["قيد المراجعة", a.pending], ["استفسارات", a.inquiries]].map(([l, n]) => h("div", { class: "card" }, h("div", { class: "stat" }, n), h("div", { class: "muted small" }, l))))), q), "admin");
}
async function plans() { const d = await api("/api/plans"); shell(h("div", { class: "stack" }, h("h1", {}, "الخطط"), plansView(d.plans, S.user ? S.user.plan : ""), h("p", { class: "muted small" }, "الخطط المدفوعة مش متاحة لسه. المجانية شغالة بالكامل.")), "plans"); }
function login() { shell(h("div", { class: "row", style: "justify-content:center" }, authForm((u) => { S.user = u; location.hash = "#/"; route(); }, { title: "ادخل أو أنشئ حسابًا", sub: "عشان تحفظ المفضلة وتتابع استفساراتك أو تنشر إعلانات." })), "login"); }
function account() {
  const name = h("input", { value: S.user.name, maxlength: 60 }), cur = h("input", { type: "password" }), np = h("input", { type: "password" });
  shell(h("div", { class: "stack", style: "max-width:520px" }, h("h1", {}, "حسابي"), h("div", { class: "muted" }, `${S.user.email} · ${S.user.kind === "agent" ? "معلن" : "مشتري"} · خطة ${S.user.plan === "pro" ? "احترافية" : "مجانية"}`),
    h("form", { class: "card stack", onsubmit: (e) => { e.preventDefault(); guard(async () => { S.user = (await api("/api/auth/profile", { name: name.value })).user; toast("تم الحفظ"); }); } }, h("h2", {}, "البيانات"), field("الاسم", name), h("button", { class: "btn pri" }, "حفظ")),
    h("form", { class: "card stack", onsubmit: (e) => { e.preventDefault(); guard(async () => { await api("/api/auth/password", { current: cur.value, password: np.value }); cur.value = np.value = ""; toast("تم تغيير كلمة المرور"); }); } }, h("h2", {}, "كلمة المرور"), field("الحالية", cur), field("الجديدة", np, "8 حروف على الأقل"), h("button", { class: "btn" }, "تغيير")),
    h("button", { class: "btn", onclick: () => guard(async () => { await api("/api/auth/logout", {}); S.user = null; location.hash = "#/"; route(); }) }, "تسجيل الخروج")), "account");
}
async function route() {
  if (location.pathname === "/by-mahmoud") { if (location.hash.length > 1) history.replaceState(null, "", "/" + location.hash); else return shell(byMahmoudView(), ""); }
  const p = location.hash.replace(/^#/, "") || "/"; let m;
  try {
    if (S.user && !S.user.kind && S.user.role !== "admin") return chooseKind();
    if (p === "/") return await home();
    if ((m = p.match(/^\/l\/([A-Za-z0-9]+)$/))) return await detail(m[1]);
    if (p === "/login") return login();
    if (p === "/plans") return await plans();
    if (p === "/favs") return await favs();
    const need = ["/dash", "/inbox", "/mine", "/account", "/admin"];
    if (need.includes(p) && !S.user) return login();
    if (p === "/dash") return await dash(); if (p === "/inbox") return await inbox(); if (p === "/mine") return await mine(); if (p === "/account") return account(); if (p === "/admin") return await admin();
    location.hash = "#/";
  } catch (e) {
    if (e.status === 401) { S.user = null; return login(); }
    shell(h("div", { class: "card empty" }, h("h2", {}, "تعذّر تحميل الصفحة"), h("p", {}, e.message), h("a", { class: "btn", href: "#/" }, "الرئيسية")), "home");
  }
}
addEventListener("hashchange", route);
addEventListener("adminclaimed", () => { if (location.hash === "#/admin") setTimeout(admin, 300); });
(async () => { try { S.user = (await api("/api/auth/me")).user; } catch { /* offline */ } route(); })();
