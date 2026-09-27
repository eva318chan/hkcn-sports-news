"use strict";
/* 中港體育速報 HK-China Sports Express */

const SPORTS = {
  football:   {en:"Football",     zh_hant:"足球",         zh_hans:"足球"},
  basketball: {en:"Basketball",   zh_hant:"籃球",         zh_hans:"篮球"},
  badminton:  {en:"Badminton",    zh_hant:"羽毛球",       zh_hans:"羽毛球"},
  table_tennis:{en:"Table Tennis",zh_hant:"乒乓球",       zh_hans:"乒乓球"},
  tennis:     {en:"Tennis",       zh_hant:"網球",         zh_hans:"网球"},
  athletics:  {en:"Athletics",    zh_hant:"田徑",         zh_hans:"田径"},
  swimming:   {en:"Swimming",     zh_hant:"游泳",         zh_hans:"游泳"},
  volleyball: {en:"Volleyball",   zh_hant:"排球",         zh_hans:"排球"},
  cycling:    {en:"Cycling",      zh_hant:"單車",         zh_hans:"单车"},
  rugby:      {en:"Rugby",        zh_hant:"欖球",         zh_hans:"榄球"},
  golf:       {en:"Golf",         zh_hant:"高爾夫球",     zh_hans:"高尔夫球"},
  snooker:    {en:"Snooker",      zh_hant:"桌球",         zh_hans:"台球"},
  boxing_mma: {en:"Boxing / MMA", zh_hant:"拳擊／綜合格鬥", zh_hans:"拳击／综合格斗"},
  esports:    {en:"Esports",      zh_hant:"電競",         zh_hans:"电竞"},
  racing:     {en:"Racing",       zh_hant:"賽車／賽馬",   zh_hans:"赛车／赛马"},
  others:     {en:"Others",       zh_hant:"其他",         zh_hans:"其他"}
};

const STR = {
  en:{siteName:"HK-China Sports Express",search:"Search news, tags, teams…",all:"All",latest:"Latest",
      readMore:"Read full story →",copied:"Link copied!",noResult:"No news found. Try another keyword.",
      loadMore:"Load earlier news",updated:"Updated",articles:"articles",loading:"Loading…",
      footer:"Summaries are rewritten by our editors. Photos belong to their original sources."},
  zh_hant:{siteName:"中港體育速報",search:"搜尋新聞、標籤、球隊…",all:"全部",latest:"最新",
      readMore:"閱讀原文 →",copied:"連結已複製！",noResult:"搵唔到相關新聞，試下其他關鍵字。",
      loadMore:"載入更早新聞",updated:"更新於",articles:"則新聞",loading:"載入中…",
      footer:"摘要由本站重新編寫，圖片版權歸原新聞機構所有。"},
  zh_hans:{siteName:"中港体育速报",search:"搜索新闻、标签、球队…",all:"全部",latest:"最新",
      readMore:"阅读原文 →",copied:"链接已复制！",noResult:"找不到相关新闻，试试其他关键字。",
      loadMore:"加载更早新闻",updated:"更新于",articles:"则新闻",loading:"加载中…",
      footer:"摘要由本站重新编写，图片版权归原新闻机构所有。"}
};

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

let LANG = localStorage.getItem("hks_lang") || "zh_hant";
if (!STR[LANG]) LANG = "zh_hant";
let ALL = [];            // loaded articles
let DATES = [];          // [{date,count}] desc
let UPDATED_AT = "";
let loadedDates = new Set();
const filter = {sport:"all", date:"all", q:""};
const PAGE_DAYS = 7;

/* ---------- theme ---------- */
function setLogo(){
  const dark = document.documentElement.dataset.theme === "dark";
  const bn = document.getElementById("brandName");
  if (bn && bn.style.display === "flex") return; // text fallback active
  const l = document.getElementById("logoLight"), d = document.getElementById("logoDark");
  if (l && d) { l.style.display = dark ? "none" : ""; d.style.display = dark ? "" : "none"; }
}
function initTheme(){
  let t = localStorage.getItem("hks_theme");
  if (!t) t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = t;
  $("#themeBtn").textContent = t === "dark" ? "☀️" : "🌙";
  setLogo();
}
$("#themeBtn").addEventListener("click", () => {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  localStorage.setItem("hks_theme", t);
  $("#themeBtn").textContent = t === "dark" ? "☀️" : "🌙";
  setLogo();
});

/* ---------- i18n ---------- */
function t(k){ return (STR[LANG] && STR[LANG][k]) || STR.zh_hant[k] || k; }
function applyI18n(){
  document.documentElement.lang = LANG === "en" ? "en" : (LANG === "zh_hans" ? "zh-CN" : "zh-Hant");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll(".lang-switch button").forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
  document.title = t("siteName") + " | HK-China Sports Express";
}
document.querySelectorAll(".lang-switch button").forEach(b => b.addEventListener("click", () => {
  LANG = b.dataset.lang; localStorage.setItem("hks_lang", LANG);
  applyI18n(); renderChips(); render();
}));

/* ---------- data ---------- */
async function loadManifest(){
  const r = await fetch("data/manifest.json");
  const m = await r.json();
  DATES = m.dates || []; UPDATED_AT = m.updated_at || "";
}
async function loadBatch(n){
  const next = DATES.map(d => d.date).filter(d => !loadedDates.has(d)).slice(0, n);
  if (!next.length) return false;
  const results = await Promise.all(next.map(d => fetch("data/" + d + ".json").then(r => r.ok ? r.json() : []).catch(() => [])));
  results.forEach((arr, i) => { loadedDates.add(next[i]); ALL.push(...arr); });
  ALL.sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));
  return true;
}

/* ---------- format ---------- */
function fmtTime(iso){
  try {
    const d = new Date(iso);
    const o = {timeZone:"Asia/Hong_Kong", month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false};
    return new Intl.DateTimeFormat(LANG === "en" ? "en-HK" : (LANG === "zh_hans" ? "zh-CN" : "zh-HK"), o).format(d);
  } catch(e){ return (iso || "").slice(0, 16).replace("T", " "); }
}
function fmtDate(ds){
  const [y, m, d] = ds.split("-");
  return LANG === "en" ? `${d}/${m}` : `${m}月${d}日`;
}
function articleUrl(a){
  const base = location.href.split("#")[0].replace(/index\.html$/, "").replace(/\/?$/, "/");
  return base + "a/" + a.id + ".html";
}

/* ---------- render ---------- */
function renderChips(){
  const sc = $("#sportChips");
  sc.innerHTML = `<button class="chip${filter.sport==="all"?" active":""}" data-sport="all">${esc(t("all"))}</button>` +
    Object.keys(SPORTS).map(k => `<button class="chip${filter.sport===k?" active":""}" data-sport="${k}">${esc(SPORTS[k][LANG]||SPORTS[k].en)}</button>`).join("");
  sc.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => { filter.sport = c.dataset.sport; renderChips(); render(); }));

  const dc = $("#dateChips");
  const counts = {}; DATES.forEach(d => counts[d.date] = d.count);
  dc.innerHTML = `<button class="chip${filter.date==="all"?" active":""}" data-date="all">${esc(t("latest"))}</button>` +
    DATES.map(d => `<button class="chip${filter.date===d.date?" active":""}" data-date="${d.date}">${esc(fmtDate(d.date))} <span class="n">${d.count}</span></button>`).join("");
  dc.querySelectorAll(".chip").forEach(c => c.addEventListener("click", async () => {
    filter.date = c.dataset.date;
    if (filter.date !== "all" && !loadedDates.has(filter.date)) { await loadBatch(PAGE_DAYS); }
    renderChips(); render();
  }));
}

function filtered(){
  const q = filter.q.trim().toLowerCase();
  return ALL.filter(a => {
    if (filter.sport !== "all" && a.sport !== filter.sport) return false;
    if (filter.date !== "all" && !(a.published_at || "").startsWith(filter.date)) return false;
    if (q) {
      const hay = [a.title.en, a.title.zh_hant, a.title.zh_hans, a.summary.en, a.summary.zh_hant, a.summary.zh_hans,
                   a.source, ...(a.tags.en||[]), ...(a.tags.zh_hant||[]), ...(a.tags.zh_hans||[])].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function cardHTML(a){
  const url = articleUrl(a);
  const img = a.image_url
    ? `<img src="${esc(a.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`
    : `<div class="noimg">🏅</div>`;
  const tags = (a.tags[LANG] || a.tags.zh_hant || []).map(g => `<button class="tag" data-tag="${esc(g)}">#${esc(g)}</button>`).join("");
  return `<article class="card" id="a-${esc(a.id)}">
    <a class="thumb" href="a/${esc(a.id)}.html">${img}</a>
    <div class="card-body">
      <div class="card-top"><span class="sport-tag">${esc((SPORTS[a.sport]||SPORTS.others)[LANG])}</span><span>${esc(fmtTime(a.published_at))}</span></div>
      <h2 class="card-title"><a href="a/${esc(a.id)}.html">${esc(a.title[LANG] || a.title.zh_hant)}</a></h2>
      <p class="card-summary">${esc(a.summary[LANG] || a.summary.zh_hant)}</p>
      <div class="tags">${tags}</div>
      <div class="card-foot">
        <span class="src">${esc(a.source)}</span>
        <span class="actions">
          <a class="abtn primary" href="${esc(a.source_url)}" target="_blank" rel="noopener">${esc(t("readMore"))}</a>
          <button class="abtn" data-share="fb" data-id="${esc(a.id)}">f</button>
          <button class="abtn" data-share="native" data-id="${esc(a.id)}">⤴</button>
          <button class="abtn" data-share="copy" data-id="${esc(a.id)}">🔗</button>
        </span>
      </div>
    </div>
  </article>`;
}

function render(){
  const list = filtered();
  $("#cards").innerHTML = list.map(cardHTML).join("");
  $("#empty").hidden = list.length > 0;
  $("#meta").textContent = `${list.length} ${t("articles")}` + (UPDATED_AT ? ` · ${t("updated")} ${fmtTime(UPDATED_AT)}` : "");
  const more = DATES.some(d => !loadedDates.has(d.date));
  $("#loadMore").hidden = !more;
  $("#loadMore").textContent = t("loadMore");
  document.querySelectorAll("[data-share]").forEach(b => b.addEventListener("click", ev => { ev.stopPropagation(); doShare(b.dataset.share, b.dataset.id); }));
  document.querySelectorAll(".tag").forEach(b => b.addEventListener("click", () => {
    filter.q = b.dataset.tag; $("#search").value = filter.q; render();
    window.scrollTo({top:0, behavior:"smooth"});
  }));
}

let toastTimer;
function toast(msg){
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

function doShare(kind, id){
  const a = ALL.find(x => x.id === id); if (!a) return;
  const url = articleUrl(a);
  const title = a.title[LANG] || a.title.zh_hant;
  if (kind === "fb") {
    window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "_blank", "width=600,height=540");
  } else if (kind === "native" && navigator.share) {
    navigator.share({title, text:(a.summary[LANG]||a.summary.zh_hant), url}).catch(()=>{});
  } else {
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
      () => toast(t("copied")),
      () => { prompt(url, url); });
  }
}

$("#search").addEventListener("input", e => { filter.q = e.target.value; render(); });
$("#loadMore").addEventListener("click", async () => { $("#loadMore").disabled = true; await loadBatch(PAGE_DAYS); $("#loadMore").disabled = false; renderChips(); render(); });

/* ---------- init ---------- */
(async function(){
  initTheme(); applyI18n();
  $("#meta").textContent = t("loading");
  try {
    await loadManifest();
    await loadBatch(PAGE_DAYS);
  } catch(e){ /* offline / empty */ }
  renderChips(); render();
  if (location.hash.startsWith("#a-")) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({block:"center"}), 400);
  }
})();
