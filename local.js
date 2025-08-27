
// ---- Shared cart storage ----
function getCart(){ try{ return JSON.parse(localStorage.getItem("franapp_cart")||"{}"); }catch(e){ return {}; } }
function setCart(obj){ localStorage.setItem("franapp_cart", JSON.stringify(obj)); }
function cartCount(){ const c = getCart(); return Object.values(c).reduce((a,b)=> a + (b.qty||0), 0); }
function updateCartBadge(){ const el = document.getElementById("cartCount"); if(el) el.textContent = cartCount(); }
function formatMoney(n){ return "$"+(n).toLocaleString("es-AR"); }

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
    const cart = getCart();
    if(!cart[id]) return;
    cart[id].qty = Math.max(0, cart[id].qty + (act==="plus"?1:-1));
    if(cart[id].qty===0) delete cart[id];
    setCart(cart);
    renderDrawer();
    updateCartBadge();
    // reflect on menu rows if present
    const qEl = document.getElementById("q-"+id);
    if(qEl) qEl.textContent = cart[id]?.qty || 0;
  };
}

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

// cart per-item now in localStorage

function getParam(name){
  const url = new URL(location.href);
  return url.searchParams.get(name);
}

async function loadStore(id){
  const res = await fetch("index.json");
  const data = await res.json();
  return data.stores.find(s => s.id === id);
}

async function loadMenus(id){
  const res = await fetch("menus.json?ts="+Date.now());
  const all = await res.json();
  return all[id] || {categories:[], items:[]};
}

function renderStore(s){
  $("#storeBanner").src = s.banner;
  $("#storeBanner").alt = s.name;
  $("#storeName").textContent = s.name;
  $("#storeRating").textContent = s.rating.toFixed(1);
  $("#badge").textContent = `${s.time} • ${s.fee}`;
  if(s.promo){ $("#ribbon").style.display = "inline-block"; $("#ribbon").textContent = s.promo; }
  $("#storeMeta").innerHTML = `<span class="chip">${s.category}</span><span class="chip">${s.distance}</span>`;
}

function renderTabs(cats, onClick){
  const wrap = $("#tabs");
  wrap.innerHTML = "";
  cats.forEach((c, idx)=>{
    const b = document.createElement("button");
    b.className = "tab" + (idx===0 ? " active": "");
    b.textContent = c;
    b.addEventListener("click", ()=>{
      $$(".tab").forEach(t=>t.classList.remove("active"));
      b.classList.add("active");
      onClick(c);
    });
    wrap.appendChild(b);
  });
}

function renderItems(items){
  const list = $("#menuList");
  list.innerHTML = "";
  const cart = getCart();
  items.forEach(item=>{
    const qty = cart[item.id]?.qty || 0;
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        <h4>${item.name}</h4>
        <p>${item.desc||""}</p>
        <div class="price">$${item.price.toLocaleString("es-AR")}</div>
      </div>
      <div class="actions">
        <img src="${item.photo}" alt="${item.name}">
        <div class="qty">
          <button aria-label="Menos" data-id="${item.id}" data-act="minus">−</button>
          <span id="q-${item.id}">${qty}</span>
          <button aria-label="Más" data-id="${item.id}" data-act="plus">+</button>
        </div>
      </div>
    `;
    list.appendChild(el);
  });

  list.addEventListener("click", (e)=>{
    const btn = e.target.closest("button[data-id]");
    if(!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    const itm = items.find(x=>x.id===id);
    const cart = getCart();
    const cur = cart[id] || {id:itm.id, name:itm.name, price:itm.price, category:itm.category, qty:0};
    cur.qty = Math.max(0, cur.qty + (act==="plus" ? 1 : -1));
    if(cur.qty===0) delete cart[id]; else cart[id] = cur;
    setCart(cart);
    const qEl = document.getElementById("q-"+id);
    if(qEl) qEl.textContent = cart[id]?.qty || 0;
    updateCartBadge();
  }, {once:false});
}

function renderCart(){
  let total = 0, count = 0;
  cart.forEach(({item, qty})=>{
    count += qty;
    total += item.price * qty;
  });
  if(count===0){
    $("#cartInfo").textContent = "Carrito vacío";
    $("#btnCheckout").disabled = true;
  }else{
    $("#cartInfo").textContent = `${count} ítem(s) · Total $${total.toLocaleString("es-AR")}`;
    $("#btnCheckout").disabled = false;
  }
}

window.addEventListener("DOMContentLoaded", async ()=>{
  const id = getParam("id") || "tachi";
  const store = await loadStore(id);
  if(!store){ alert("Local no encontrado"); location.href="index.html"; return; }
  renderStore(store);

  const menu = await loadMenus(id);
  renderTabs(menu.categories, (cat)=>{
    const items = menu.items.filter(x=>x.category===cat);
    renderItems(items);
  });
  // initial tab
  if(menu.categories[0]){
    const items = menu.items.filter(x=>x.category===menu.categories[0]);
    renderItems(items);
  }

  $("#btnCheckout").addEventListener("click", ()=>{
    alert("Checkout de ejemplo. Total: " + $("#cartInfo").textContent);
  });

  $("#btnFind").addEventListener("click", ()=>{
    const q = $("#searchItem").value.trim().toLowerCase();
    const all = menu.items.filter(x=> x.name.toLowerCase().includes(q) || (x.desc||'').toLowerCase().includes(q));
    renderItems(all);
    $$(".tab").forEach(t=>t.classList.remove("active"));
  });
});
