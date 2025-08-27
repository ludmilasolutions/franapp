// registro.js — validaciones básicas + submit a Netlify Function (PR)
const $ = (q, el=document)=>el.querySelector(q);
const $$ = (q, el=document)=>[...el.querySelectorAll(q)];

function slugify(s){
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}

function setErr(name, msg){
  const el = document.querySelector(`[data-err="${name}"]`);
  if(el){ el.textContent = msg || ""; }
}

function validURL(u){ try{ new URL(u); return true; }catch(_){ return false; } }
function validPhone(p){ return /^\+?\d{10,15}$/.test(p.replace(/\s/g,"")); }

function addZoneRow(name="", price=""){
  const row = document.createElement("div");
  row.className = "zone-row";
  row.innerHTML = `
    <input placeholder="Nombre de zona/barrio" value="${name}"/>
    <input type="number" placeholder="Precio" value="${price}" min="0" step="50"/>
    <button type="button" class="btn outline del">Quitar</button>
  `;
  row.querySelector(".del").onclick = ()=> row.remove();
  $("#zones").appendChild(row);
}

window.addEventListener("DOMContentLoaded", ()=>{
  addZoneRow();
  $("#addZone").addEventListener("click", ()=> addZoneRow());

  $("#regForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    // clear errors
    $$(".error").forEach(el=> el.textContent="");

    const form = e.currentTarget;
    const name = form.name.value.trim();
    const category = form.category.value;
    const address = form.address.value.trim();
    const mapUrl = form.mapUrl.value.trim();
    const whatsapp = form.whatsapp.value.trim();
    const bio = form.bio.value.trim();
    const logo = form.logo.value.trim();
    const banner = form.banner.value.trim();
    const deliveries = $$(".pill input[name='deliveries']:checked").map(x=>x.value);
    const payments = $$(".pill input[name='payments']:checked").map(x=>x.value);
    const weight = Math.max(0, Math.min(100, parseInt(form.weight.value||"50")));
    const days = form.days.value.trim();
    const open = form.open.value.trim();
    const close = form.close.value.trim();
    const zones = $$("#zones .zone-row").map(r=>{
      const [n, p] = r.querySelectorAll("input");
      return {name:n.value.trim(), price: Number(p.value)};
    }).filter(z=> z.name && Number.isFinite(z.price));

    let ok = true;
    if(!name){ setErr("name","Requerido"); ok=false; }
    if(!category){ setErr("category","Elegí una categoría"); ok=false; }
    if(!address){ setErr("address","Requerido"); ok=false; }
    if(!mapUrl || !validURL(mapUrl)){ setErr("mapUrl","Pegá un link de Google Maps válido"); ok=false; }
    if(!whatsapp || !validPhone(whatsapp)){ setErr("whatsapp","Formato esperado +549… 10–15 dígitos"); ok=false; }
    if(!bio){ setErr("bio","Contanos brevemente"); ok=false; }
    if(logo && !validURL(logo)){ setErr("logo","URL inválida"); ok=false; }
    if(banner && !validURL(banner)){ setErr("banner","URL inválida"); ok=false; }
    if(deliveries.length===0){ setErr("deliveries","Elegí al menos 1"); ok=false; }
    if(payments.length===0){ setErr("payments","Elegí al menos 1"); ok=false; }
    if(!(days && open && close)){ setErr("hours","Completá días y horarios"); ok=false; }
    if(zones.length===0){ setErr("zones","Agregá al menos una zona"); ok=false; }

    // hCaptcha token
    const captcha = document.querySelector("[name='h-captcha-response']")?.value || "";
    if(!captcha){ setErr("captcha","Confirmá que sos humano"); ok=false; }

    if(!ok) return;

    const slug = slugify(`${name}-${address.split(",")[0]}`);
    const payload = {
      slug, name, category, bio,
      images: {logo, banner},
      address: { line: address, mapUrl },
      whatsapp,
      hours: [{ day: days, open, close }],
      delivery: { model:"zones", zones },
      methods: { delivery: deliveries, payment: payments },
      social: { instagram: form.ig.value.trim(), web: form.web.value.trim() },
      weight, status: "pending"
    };

    $("#result").textContent = "Enviando…";

    try{
      const res = await fetch("/.netlify/functions/alta-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captcha, payload })
      });
      const data = await res.json();
      if(!res.ok){ throw new Error(data.error || "Error al enviar"); }
      $("#result").innerHTML = `✔️ Enviado. PR: <a href="${data.prUrl}" target="_blank">${data.prUrl}</a>`;
      form.reset();
      $("#zones").innerHTML = "";
      addZoneRow();
      // reset hCaptcha
      if(window.hcaptcha){ hcaptcha.reset(); }
    }catch(err){
      $("#result").textContent = "⚠️ " + (err.message || "No se pudo enviar");
    }
  });
});
