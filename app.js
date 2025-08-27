const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

const state = { data:null, filtered:null, categories:[], location:"San Luis 4526" };

const categoryColors = {
  "Restaurantes":"#FFB526",
  "franapp Market":"#EA044E",
  "Mercados":"#9FE0EF",
  "Café & Deli":"#FFDA92",
  "Helados":"#F3F2F4",
  "Kioscos":"#F3F2F4",
  "Farmacias":"#F3F2F4",
  "Mascotas":"#F3F2F4",
  "Bebidas":"#F3F2F4",
  "Tiendas":"#F3F2F4"
};

const categoryImages = {
  "Restaurantes":"assets/ic-restaurant.svg",
  "franapp Market":"assets/ic-market.svg",
  "Mercados":"assets/ic-market.svg",
  "Café & Deli":"assets/ic-coffee.svg",
  "Helados":"assets/ic-ice.svg",
  "Kioscos":"assets/ic-kiosk.svg",
  "Farmacias":"assets/ic-pharmacy.svg",
  "Mascotas":"assets/ic-pets.svg",
  "Bebidas":"assets/ic-drinks.svg",
  "Tiendas":"assets/ic-shop.svg"
};

// Init
window.addEventListener("DOMContentLoaded", async ()=>{
  $("#year").textContent = new Date().getFullYear();
  $("#locationText").textContent = state.location;

  await loadData();
  renderCategories();
  renderStores(state.data.stores);

  // search
  $("#searchInput").addEventListener("input", (e)=>{
    filterStores(e.target.value.trim());
  });
  $("#searchBtn").addEventListener("click", ()=>{
    filterStores($("#searchInput").value.trim());
  });

  // cat arrows
  $("#catNext").addEventListener("click", ()=> $("#quilted").scrollBy({left:240, behavior:"smooth"}));
  $("#catPrev").addEventListener("click", ()=> $("#quilted").scrollBy({left:-240, behavior:"smooth"}));

  // location prompt simple
  $("#btnLocation").addEventListener("click", ()=>{
    const val = prompt("Ingresá tu dirección:", state.location);
    if(val){
      state.location = val;
      $("#locationText").textContent = val;
      localStorage.setItem("franapp_location", val);
    }
  });

  // restore location
  const savedLoc = localStorage.getItem("franapp_location");
  if(savedLoc){ state.location = savedLoc; $("#locationText").textContent = savedLoc; }
});

async function loadData(){
  try{
    const res = await fetch("index.json?ts="+Date.now());
    const json = await res.json();
    state.data = json;
    state.categories = json.categories || [];
  }catch(e){
    console.error("No se pudo cargar index.json", e);
    state.data = {stores:[], categories:[]};
  }
}

function renderCategories(){
  const wrap = $("#quilted");
  wrap.innerHTML = "";
  state.categories.forEach(cat=>{
    const a = document.createElement("button");
    a.className = "q-item";
    a.style.backgroundColor = categoryColors[cat] || "var(--bg-2)";
    a.innerHTML = `
      <p>${cat}</p>
      <div class="q-img"><img src="${categoryImages[cat]||''}" alt="${cat}"></div>
    `;
    a.addEventListener("click", ()=>{
      filterStores("", cat);
      $("#stores").scrollIntoView({behavior:"smooth", block:"start"});
    });
    wrap.appendChild(a);
  });
}

function filterStores(q="", cat=null){
  const text = (q||"").toLowerCase();
  let items = [...state.data.stores];
  if(cat) items = items.filter(x=>x.category===cat);
  if(text){
    items = items.filter(x=>
      x.name.toLowerCase().includes(text) ||
      x.category.toLowerCase().includes(text)
    );
  }
  renderStores(items);
}

function renderStores(list){
  const wrap = $("#stores");
  wrap.innerHTML = "";

  $("#countTxt").textContent = list.length ? `${list.length} resultados` : "Sin resultados";

  list.forEach(s=>{
    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <div class="card__top">
        <img src="${s.banner}" alt="${s.name}">
        ${s.promo ? `<span class="ribbon">${s.promo}</span>` : ``}
        <span class="badge">${s.time} • ${s.fee}</span>
      </div>
      <div class="card__body">
        <div class="card__title">
          <h4>${s.name}</h4>
          <div class="rating" title="Calificación">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27Z" fill="#00B67A"/></svg>
            <span>${s.rating.toFixed(1)}</span>
          </div>
        </div>
        <div class="meta">
          <span class="chip">${s.category}</span>
          <span class="chip">${s.distance}</span>
          ${s.tags?.map(t=>`<span class="chip">${t}</span>`).join("") || ""}
        </div>
      </div>
    `;
    el.addEventListener("click", ()=>{
      location.href = `local.html?id=${encodeURIComponent(s.id)}`;
    });
    wrap.appendChild(el);
  });
}

// ---- Shared cart utilities (home) ----
function getCart(){ try{ return JSON.parse(localStorage.getItem("franapp_cart")||"{}"); }catch(e){ return {}; } }
function setCart(obj){ localStorage.setItem("franapp_cart", JSON.stringify(obj)); }
function cartCount(){ const c = getCart(); return Object.values(c).reduce((a,b)=> a + (b.qty||0), 0); }
function formatMoney(n){ return "$"+(n).toLocaleString("es-AR"); }

function updateCartBadge(){
  const el = document.getElementById("cartCount");
  if(el) el.textContent = cartCount();
}

function openDrawer(){ document.getElementById("drawerOverlay").classList.add("open"); document.getElementById("cartDrawer").classList.add("open"); renderDrawer(); }
function closeDrawer(){ document.getElementById("drawerOverlay").classList.remove("open"); document.getElementById("cartDrawer").classList.remove("open"); }

function renderDrawer(){
  const listEl = document.getElementById("drawerList");
  const totalsEl = { sub: $("#subTot"), ship: $("#ship"), grand: $("#grand") };
  const cart = getCart();
  const entries = Object.values(cart);
  listEl.innerHTML = "";
  let subtotal = 0;
  entries.forEach(e=>{
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      <div>
        <h5>${e.name}</h5>
        <div class="muted">${e.category||""}</div>
      </div>
      <div class="qty">
        <button data-id="${e.id}" data-act="minus">−</button>
        <span>${e.qty}</span>
        <button data-id="${e.id}" data-act="plus">+</button>
      </div>
      <div style="text-align:right;font-weight:700">${formatMoney(e.price*e.qty)}</div>
    `;
    listEl.appendChild(row);
    subtotal += e.price*e.qty;
  });
  const shipping = entries.length ? 700 : 0;
  totalsEl.sub.textContent = formatMoney(subtotal);
  totalsEl.ship.textContent = formatMoney(shipping);
  totalsEl.grand.textContent = formatMoney(subtotal + shipping);

  listEl.onclick = (ev)=>{
    const btn = ev.target.closest("button[data-id]");
    if(!btn) return;
    const id = btn.dataset.id, act = btn.dataset.act;
    if(!cart[id]) return;
    cart[id].qty = Math.max(0, cart[id].qty + (act==="plus"?1:-1));
    if(cart[id].qty===0) delete cart[id];
    setCart(cart);
    renderDrawer();
    updateCartBadge();
  };
}

window.addEventListener("DOMContentLoaded", ()=>{
  updateCartBadge();
  const btnCart = document.getElementById("btnCart");
  if(btnCart){
    btnCart.addEventListener("click", openDrawer);
    document.getElementById("drawerOverlay").addEventListener("click", closeDrawer);
    document.getElementById("btnGoCheckout").addEventListener("click", ()=>{
      const total = document.getElementById("grand").textContent;
      alert("Compra de ejemplo confirmada por " + total);
      closeDrawer();
    });
    document.getElementById("btnClearCart").addEventListener("click", ()=>{
      if(confirm("¿Vaciar carrito?")){ setCart({}); renderDrawer(); updateCartBadge(); }
    });
  }
});
