const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path");
global.window={LISTINGS:[]};
const RS=require("../listings.js");
const src=fs.readFileSync(path.join(__dirname,"../listings-data.js"),"utf8");
const L=new Function("window",src+";return window.LISTINGS")({});
const base={q:"",city:"",type:"",beds:0,max:0,sort:"new",onlyFav:false};
test("data: unique ids, valid fields",()=>{assert.ok(L.length>=6);assert.equal(new Set(L.map(l=>l.id)).size,L.length);L.forEach(l=>{assert.ok(l.price>0&&l.area>0&&l.title&&l.city)})});
test("filter by text, city, type, beds, max price",()=>{
  assert.ok(RS.filter(L,{...base,q:"فيلا"},[]).every(l=>l.type==="villa"||l.title.includes("فيلا")));
  assert.ok(RS.filter(L,{...base,city:"الإسكندرية"},[]).every(l=>l.city==="الإسكندرية"));
  assert.ok(RS.filter(L,{...base,type:"villa"},[]).every(l=>l.type==="villa"));
  assert.ok(RS.filter(L,{...base,beds:3},[]).every(l=>l.beds>=3));
  assert.ok(RS.filter(L,{...base,max:3000000},[]).every(l=>l.price<=3000000));
  assert.equal(RS.filter(L,{...base,q:"zzz"},[]).length,0)});
test("sorting and favorites only",()=>{const a=RS.filter(L,{...base,sort:"low"},[]).map(l=>l.price);assert.deepEqual(a,[...a].sort((x,y)=>x-y));const b=RS.filter(L,{...base,sort:"high"},[]).map(l=>l.price);assert.deepEqual(b,[...b].sort((x,y)=>y-x));assert.deepEqual(RS.filter(L,{...base,onlyFav:true},["L-2"]).map(l=>l.id),["L-2"])});
test("mortgage: zero interest, annuity, edge cases",()=>{assert.equal(RS.monthly(1200000,0,10,0),10000);assert.ok(Math.abs(RS.monthly(1000000,0,10,12)-14347.09)<1);assert.equal(RS.monthly(1000000,1000000,10,5),0);assert.equal(RS.monthly(1000,0,0,5),0)});
test("index.html wires everything: ids used by listings.js exist, no dead '#' nav links",()=>{const h=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");const js=fs.readFileSync(path.join(__dirname,"../listings.js"),"utf8");[...js.matchAll(/\$\("([a-z-]+)"\)/g)].map(m=>m[1]).forEach(id=>assert.ok(h.includes('id="'+id+'"'),id));assert.ok(!/<nav[\s\S]*?href="#"[\s\S]*?<\/nav>/.test(h))});
