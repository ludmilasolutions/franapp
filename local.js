const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

const cart = new Map(); // key: itemId, value: {item, qty}

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
  items.forEach(item=>{
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
          <span id="q-${item.id}">${cart.get(item.id)?.qty||0}</span>
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
    const cur = cart.get(id) || {item:itm, qty:0};
    cur.qty = Math.max(0, cur.qty + (act==="plus" ? 1 : -1));
    if(cur.qty===0) cart.delete(id); else cart.set(id, cur);
    const qEl = document.getElementById("q-"+id);
    if(qEl) qEl.textContent = cur.qty;
    renderCart();
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
