import { BaseHub, makeWorker, bad, clean, rid, now, isEmail } from "./core.js";

const LIMITS = { free: { listings: 5 }, pro: { listings: 100 } };
const TYPES = ["apartment", "villa", "office", "land", "chalet", "shop"];
const SEED = [
  ["شقة عصرية بإطلالة على الحديقة", "القاهرة الجديدة", "apartment", 3, 2, 165, 4200000, "sale"], ["فيلا مستقلة بحمام سباحة", "الشيخ زايد", "villa", 5, 4, 420, 14500000, "sale"],
  ["شقة قريبة من الكورنيش", "الإسكندرية", "apartment", 2, 1, 110, 2650000, "sale"], ["مكتب إداري في مبنى حديث", "القاهرة الجديدة", "office", 0, 1, 90, 3100000, "sale"],
  ["شاليه على البحر مباشرة", "الساحل الشمالي", "chalet", 2, 2, 105, 5900000, "sale"], ["أرض سكنية في موقع مميز", "العاصمة الإدارية", "land", 0, 0, 300, 6200000, "sale"],
  ["دوبلكس بتشطيب كامل", "الشيخ زايد", "apartment", 4, 3, 240, 7800000, "sale"], ["شقة صغيرة مناسبة للعروسين", "الإسكندرية", "apartment", 1, 1, 70, 1450000, "sale"],
  ["شقة للإيجار قريبة من المترو", "القاهرة الجديدة", "apartment", 2, 1, 120, 18000, "rent"],
];
export class Hub extends BaseHub {
  adminHash() { return this.env.ADMIN_HASH || null; }
  schemaSQL() {
    return `ALTER TABLE users ADD COLUMN kind TEXT;
CREATE TABLE IF NOT EXISTS listings(id TEXT PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL, descr TEXT NOT NULL DEFAULT '', city TEXT NOT NULL, district TEXT NOT NULL DEFAULT '', type TEXT NOT NULL, purpose TEXT NOT NULL DEFAULT 'sale', beds INTEGER NOT NULL DEFAULT 0, baths INTEGER NOT NULL DEFAULT 0, area INTEGER NOT NULL, price INTEGER NOT NULL, features TEXT NOT NULL DEFAULT '', images TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', reason TEXT NOT NULL DEFAULT '', views INTEGER NOT NULL DEFAULT 0, sample INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS price_hist(listing TEXT NOT NULL, ts INTEGER NOT NULL, old INTEGER NOT NULL, new INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS ph_l ON price_hist(listing);
CREATE INDEX IF NOT EXISTS l_status ON listings(status);
CREATE TABLE IF NOT EXISTS saved_searches(id TEXT PRIMARY KEY, uid TEXT NOT NULL, name TEXT NOT NULL, qs TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS favs(uid TEXT NOT NULL, listing TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY(uid,listing));
CREATE TABLE IF NOT EXISTS inq(id TEXT PRIMARY KEY, listing TEXT NOT NULL, owner TEXT NOT NULL, from_uid TEXT, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', msg TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', reply TEXT NOT NULL DEFAULT '', created INTEGER NOT NULL, replied INTEGER)`;
  }
  seed() {
    if (this._sd) return; this._sd = true;
    if (this.one("SELECT COUNT(*) n FROM listings").n) return;
    SEED.forEach((s, i) => this.run("INSERT INTO listings(id,owner,title,city,type,beds,baths,area,price,purpose,status,sample,created,updated,descr,features) VALUES(?,?,?,?,?,?,?,?,?,?,'approved',1,?,?,?,?)", "S" + (i + 1), "system", s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], now() - i * 3600e3, now(), "عقار نموذجي لعرض شكل المنصة. الأسعار والتفاصيل غير حقيقية.", "أمن,مواقف,مصعد"));
  }
  publicUser(u) { return { ...super.publicUser(u), kind: u.kind || null }; }
  lim(u) { return LIMITS[u.plan] || LIMITS.free; }
  adminStats() { return { listings: this.one("SELECT COUNT(*) n FROM listings WHERE sample=0").n, pending: this.one("SELECT COUNT(*) n FROM listings WHERE status='pending'").n, approved: this.one("SELECT COUNT(*) n FROM listings WHERE status='approved' AND sample=0").n, inquiries: this.one("SELECT COUNT(*) n FROM inq").n }; }
  out(l, full) {
    const o = { id: l.id, title: l.title, city: l.city, district: l.district, type: l.type, purpose: l.purpose, beds: l.beds, baths: l.baths, area: l.area, price: l.price, features: l.features ? l.features.split(",") : [], images: l.images ? l.images.split("|") : [], sample: !!l.sample, status: l.status, views: l.views, created: l.created };
    if (full) { o.descr = l.descr; o.reason = l.reason; o.owner = l.owner; }
    return o;
  }
  fields(b, old) {
    const o = {};
    const num = (k, d, max) => { const v = b[k] !== undefined ? Number(b[k]) : d; if (!Number.isFinite(v) || v < 0 || v > max) bad("قيمة غير صحيحة: " + k); return Math.round(v); };
    o.title = b.title !== undefined ? clean(b.title, 120) : old.title; if (!o.title || o.title.length < 5) bad("اكتب عنوانًا واضحًا للعقار (5 حروف على الأقل).");
    o.descr = b.descr !== undefined ? clean(b.descr, 3000) : old.descr || "";
    o.city = b.city !== undefined ? clean(b.city, 50) : old.city; if (!o.city) bad("اختر المدينة.");
    o.district = b.district !== undefined ? clean(b.district, 60) : old.district || "";
    o.type = b.type !== undefined ? b.type : old.type; if (!TYPES.includes(o.type)) bad("اختر نوع العقار.");
    o.purpose = b.purpose !== undefined ? (b.purpose === "rent" ? "rent" : "sale") : old.purpose || "sale";
    o.beds = num("beds", old.beds ?? 0, 30); o.baths = num("baths", old.baths ?? 0, 30); o.area = num("area", old.area ?? 0, 1e6); o.price = num("price", old.price ?? 0, 1e11);
    if (o.area < 1) bad("اكتب المساحة بالمتر."); if (o.price < 1) bad("اكتب السعر.");
    o.features = b.features !== undefined ? (Array.isArray(b.features) ? b.features : String(b.features).split(",")).map((x) => clean(x, 30).replace(/[,|]/g, " ")).filter(Boolean).slice(0, 12).join(",") : old.features || "";
    if (b.images !== undefined) { const im = (Array.isArray(b.images) ? b.images : []).map((x) => String(x).trim()).filter(Boolean).slice(0, 5); for (const x of im) { if (!/^https:\/\/[^\s|]{4,500}$/.test(x)) bad("روابط الصور لازم تبدأ بـ https."); let uu; try { uu = new URL(x); } catch { bad("رابط صورة غير صالح."); } if (uu.username || uu.password) bad("رابط الصورة ما ينفعش يحتوي على اسم مستخدم أو كلمة مرور."); } o.images = im.join("|"); } else o.images = old.images || "";
    o.phone = b.phone !== undefined ? clean(b.phone, 20).replace(/[^0-9+ ]/g, "") : old.phone || "";
    return o;
  }
  purgeUsers(ids) { const n = ids.map(() => "?").join(","); this.run(`DELETE FROM price_hist WHERE listing IN (SELECT id FROM listings WHERE owner IN (${n}))`, ...ids); this.run(`DELETE FROM favs WHERE uid IN (${n}) OR listing IN (SELECT id FROM listings WHERE owner IN (${n}))`, ...ids, ...ids); this.run(`DELETE FROM inq WHERE owner IN (${n}) OR from_uid IN (${n}) OR listing IN (SELECT id FROM listings WHERE owner IN (${n}))`, ...ids, ...ids, ...ids); this.run(`DELETE FROM listings WHERE owner IN (${n})`, ...ids); }
  usage(u) { return [["الإعلانات النشطة", this.one("SELECT COUNT(*) n FROM listings WHERE owner=? AND status IN ('pending','approved')", u.id).n, this.lim(u).listings]]; }
  exportData(u) {
    return { listings: this.q("SELECT * FROM listings WHERE owner=? LIMIT 2000", u.id), saved_searches: this.q("SELECT name,qs,created FROM saved_searches WHERE uid=?", u.id), favourites: this.q("SELECT listing,ts FROM favs WHERE uid=? LIMIT 2000", u.id), inquiries_sent: this.q("SELECT listing,name,phone,email,msg,created FROM inq WHERE from_uid=? LIMIT 1000", u.id) };
  }
  async app(c) {
    this.seed();
    const { path, method, body, url } = c; let m;
    if (path === "/api/plans" && method === "GET") return { plans: [
      { id: "free", name: "مجاني", price: "0 ج.م", features: ["حتى 5 إعلانات", "صندوق استفسارات", "إحصائيات المشاهدات"] },
      { id: "pro", name: "احترافي", price: "299 ج.م/شهر", features: ["حتى 100 إعلان", "ظهور مميز", "دعم أولوية"] }] };
    if (path === "/api/listings" && method === "GET") {
      const g = (k) => url.searchParams.get(k) || ""; const w = ["status='approved'"], a = [];
      if (g("q")) { w.push("(title LIKE ? OR city LIKE ? OR district LIKE ?)"); const q = "%" + g("q").slice(0, 40) + "%"; a.push(q, q, q); }
      if (g("city")) { w.push("city=?"); a.push(g("city")); }
      if (TYPES.includes(g("type"))) { w.push("type=?"); a.push(g("type")); }
      if (["sale", "rent"].includes(g("purpose"))) { w.push("purpose=?"); a.push(g("purpose")); }
      if (Number(g("min"))) { w.push("price>=?"); a.push(Number(g("min"))); } if (Number(g("max"))) { w.push("price<=?"); a.push(Number(g("max"))); }
      if (Number(g("beds"))) { w.push("beds>=?"); a.push(Number(g("beds"))); }
      const order = { price_asc: "price ASC", price_desc: "price DESC", area_desc: "area DESC", new: "created DESC" }[g("sort")] || "created DESC";
      const page = Math.max(0, Number(g("page")) || 0);
      const rows = this.q(`SELECT * FROM listings WHERE ${w.join(" AND ")} ORDER BY ${order} LIMIT 13 OFFSET ?`, ...a, page * 12);
      return { listings: rows.slice(0, 12).map((l) => this.out(l)), more: rows.length > 12, cities: this.q("SELECT DISTINCT city FROM listings WHERE status='approved' ORDER BY city").map((r) => r.city) };
    }
    if ((m = path.match(/^\/api\/listings\/([A-Za-z0-9]+)$/)) && method === "GET") {
      const l = this.one("SELECT * FROM listings WHERE id=?", m[1]); if (!l) bad("العقار غير موجود.", 404);
      const own = c.user && (c.user.id === l.owner || c.user.role === "admin");
      if (l.status !== "approved" && !own) bad("العقار غير موجود.", 404);
      if (l.status === "approved" && !own) this.run("UPDATE listings SET views=views+1 WHERE id=?", l.id);
      const ag = l.owner === "system" ? null : this.one("SELECT name FROM users WHERE id=?", l.owner);
      return { listing: { ...this.out(l, true), phone: l.phone, agent: ag ? ag.name : "عقار نموذجي" }, fav: c.user ? !!this.one("SELECT 1 x FROM favs WHERE uid=? AND listing=?", c.user.id, l.id) : false };
    }
    if (path === "/api/inquiries" && method === "POST") {
      this.limit("inq:" + c.ip, 6, 3600e3);
      if (body.website) return { ok: true };
      const l = this.one("SELECT * FROM listings WHERE id=? AND status='approved'", String(body.listing)); if (!l) bad("العقار غير موجود.", 404);
      const name = clean(body.name, 60), msg = clean(body.msg, 1500), phone = clean(body.phone, 20).replace(/[^0-9+ ]/g, ""), email = clean(body.email, 120).toLowerCase();
      if (name.length < 2) bad("اكتب اسمك."); if (msg.length < 5) bad("اكتب رسالتك (5 حروف على الأقل).");
      if (!phone && !isEmail(email)) bad("اكتب رقم موبايل أو بريد إلكتروني صحيح عشان نرد عليك.");
      if (l.sample) return { ok: true, sample: true };
      this.run("INSERT INTO inq(id,listing,owner,from_uid,name,phone,email,msg,created) VALUES(?,?,?,?,?,?,?,?,?)", rid(7), l.id, l.owner, c.user ? c.user.id : null, name, phone, email, msg, now());
      return { ok: true };
    }
    const u = this.need(c);
    if (path === "/api/me/kind" && method === "POST") { if (u.kind) bad("تم اختيار نوع الحساب بالفعل."); if (!["buyer", "agent"].includes(body.kind)) bad("اختر نوع الحساب."); this.run("UPDATE users SET kind=? WHERE id=?", body.kind, u.id); return { user: this.publicUser({ ...u, kind: body.kind }) }; }
    if (path === "/api/searches" && method === "GET") return { searches: this.q("SELECT id,name,qs,created FROM saved_searches WHERE uid=? ORDER BY created DESC LIMIT 20", u.id) };
    if (path === "/api/searches" && method === "POST") {
      this.limit("ss:" + u.id, 30, 3600e3);
      const ok = ["q", "city", "type", "purpose", "min", "max", "beds", "sort"], qp = new URLSearchParams();
      for (const k of ok) { const v = clean(body.filters?.[k], 80); if (v) qp.set(k, v); }
      if (!qp.toString()) bad("اختر فلتر واحد على الأقل قبل حفظ البحث.");
      if (this.one("SELECT COUNT(*) n FROM saved_searches WHERE uid=?", u.id).n >= 10) bad("وصلت للحد الأقصى: ١٠ عمليات بحث محفوظة.", 402);
      const id = rid(6); this.run("INSERT INTO saved_searches(id,uid,name,qs,created) VALUES(?,?,?,?,?)", id, u.id, clean(body.name, 60) || qp.toString().slice(0, 40), qp.toString(), now());
      this.audit(u.id, "search_saved"); return { id };
    }
    if ((m = path.match(/^\/api\/searches\/([A-Za-z0-9]+)$/)) && method === "DELETE") { this.run("DELETE FROM saved_searches WHERE id=? AND uid=?", m[1], u.id); return { ok: true }; }
    if (path === "/api/favs" && method === "GET") return { listings: this.q("SELECT l.* FROM listings l JOIN favs f ON f.listing=l.id WHERE f.uid=? AND l.status='approved' ORDER BY f.ts DESC", u.id).map((l) => this.out(l)) };
    if ((m = path.match(/^\/api\/favs\/([A-Za-z0-9]+)$/))) {
      if (method === "POST") { if (!this.one("SELECT 1 x FROM listings WHERE id=? AND status='approved'", m[1])) bad("العقار غير موجود.", 404); this.run("INSERT OR IGNORE INTO favs(uid,listing,ts) VALUES(?,?,?)", u.id, m[1], now()); return { ok: true }; }
      if (method === "DELETE") { this.run("DELETE FROM favs WHERE uid=? AND listing=?", u.id, m[1]); return { ok: true }; }
    }
    if (path === "/api/my/listings" && method === "GET") return { listings: this.q("SELECT * FROM listings WHERE owner=? ORDER BY created DESC", u.id).map((l) => this.out(l, true)), limit: this.lim(u).listings };
    if (path === "/api/my/inquiries" && method === "GET") return { inquiries: this.q("SELECT i.id,i.msg,i.status,i.reply,i.created,i.replied,l.title,l.id lid FROM inq i JOIN listings l ON l.id=i.listing WHERE i.from_uid=? ORDER BY i.created DESC", u.id) };
    if (path === "/api/listings" && method === "POST") {
      if (u.kind !== "agent" && u.role !== "admin") bad("لازم يكون حسابك حساب معلن (وسيط أو مالك) لنشر إعلان.", 403);
      if (this.one("SELECT COUNT(*) n FROM listings WHERE owner=? AND status IN ('pending','approved')", u.id).n >= this.lim(u).listings) bad(`خطتك (${u.plan === "pro" ? "الاحترافية" : "المجانية"}) تسمح بـ ${this.lim(u).listings} إعلانات. الخطة الاحترافية قريبًا.`, 402);
      this.limit("newl:" + u.id, 20, 3600e3);
      const f = this.fields(body, {}); const id = rid(5);
      this.run("INSERT INTO listings(id,owner,title,descr,city,district,type,purpose,beds,baths,area,price,features,images,phone,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", id, u.id, f.title, f.descr, f.city, f.district, f.type, f.purpose, f.beds, f.baths, f.area, f.price, f.features, f.images, f.phone, now(), now());
      this.audit(u.id, "listing_create", f.title); return { id };
    }
    if ((m = path.match(/^\/api\/listings\/([A-Za-z0-9]+)\/history$/)) && method === "GET") {
      const l = this.one("SELECT id,owner,price,created FROM listings WHERE id=?", m[1]); if (!l) bad("العقار غير موجود.", 404);
      if (l.owner !== u.id && u.role !== "admin") bad("ده مش إعلانك.", 403);
      return { price: l.price, created: l.created, changes: this.q("SELECT ts,old,new FROM price_hist WHERE listing=? ORDER BY ts DESC LIMIT 30", l.id) };
    }
    if ((m = path.match(/^\/api\/listings\/([A-Za-z0-9]+)$/))) {
      const l = this.one("SELECT * FROM listings WHERE id=?", m[1]); if (!l) bad("العقار غير موجود.", 404);
      if (l.owner !== u.id && u.role !== "admin") bad("ده مش إعلانك.", 403);
      if (method === "DELETE") { this.run("DELETE FROM listings WHERE id=?", l.id); this.run("DELETE FROM favs WHERE listing=?", l.id); this.run("DELETE FROM price_hist WHERE listing=?", l.id); this.audit(u.id, "listing_delete", l.title); return { ok: true }; }
      if (method === "POST") {
        if (body.status === "sold" || body.status === "approved" && l.status === "sold") { this.run("UPDATE listings SET status=?,updated=? WHERE id=?", body.status === "sold" ? "sold" : "approved", now(), l.id); return { ok: true }; }
        const f = this.fields(body, l);
        if (Number(f.price) !== Number(l.price)) { this.run("INSERT INTO price_hist(listing,ts,old,new) VALUES(?,?,?,?)", l.id, now(), Number(l.price) || 0, Number(f.price) || 0); this.run("DELETE FROM price_hist WHERE listing=? AND ts NOT IN (SELECT ts FROM price_hist WHERE listing=? ORDER BY ts DESC LIMIT 30)", l.id, l.id); }
        this.run("UPDATE listings SET title=?,descr=?,city=?,district=?,type=?,purpose=?,beds=?,baths=?,area=?,price=?,features=?,images=?,phone=?,status='pending',reason='',updated=? WHERE id=?", f.title, f.descr, f.city, f.district, f.type, f.purpose, f.beds, f.baths, f.area, f.price, f.features, f.images, f.phone, now(), l.id);
        return { ok: true, status: "pending" };
      }
    }
    if (path === "/api/inbox" && method === "GET") return { inquiries: this.q("SELECT i.*,l.title FROM inq i JOIN listings l ON l.id=i.listing WHERE i.owner=? ORDER BY i.created DESC LIMIT 200", u.id), unread: this.one("SELECT COUNT(*) n FROM inq WHERE owner=? AND status='new'", u.id).n };
    if ((m = path.match(/^\/api\/inbox\/([a-f0-9]+)$/)) && method === "POST") {
      const i = this.one("SELECT * FROM inq WHERE id=? AND owner=?", m[1], u.id); if (!i) bad("الاستفسار غير موجود.", 404);
      const st = ["new", "read", "replied", "closed"].includes(body.status) ? body.status : i.status; const reply = body.reply !== undefined ? clean(body.reply, 1500) : i.reply;
      this.run("UPDATE inq SET status=?,reply=?,replied=? WHERE id=?", reply && reply !== i.reply ? "replied" : st, reply, reply && reply !== i.reply ? now() : i.replied, i.id); return { ok: true };
    }
    if (path === "/api/admin/pending" && method === "GET") { this.needAdmin(c); return { listings: this.q("SELECT l.*,u.name agent,u.email aemail FROM listings l LEFT JOIN users u ON u.id=l.owner WHERE l.status='pending' ORDER BY l.created").map((l) => ({ ...this.out(l, true), descr: l.descr, agent: l.agent, aemail: l.aemail })) }; }
    if ((m = path.match(/^\/api\/admin\/listing\/([A-Za-z0-9]+)$/)) && method === "POST") {
      const me = this.needAdmin(c); const l = this.one("SELECT * FROM listings WHERE id=?", m[1]); if (!l) bad("العقار غير موجود.", 404);
      if (!["approved", "rejected"].includes(body.status)) bad("قرار غير صحيح.");
      this.run("UPDATE listings SET status=?,reason=? WHERE id=?", body.status, clean(body.reason, 300), l.id); this.audit(me.id, "listing_" + body.status, l.title); return { ok: true };
    }
    return null;
  }
}
export default makeWorker("HUB");
