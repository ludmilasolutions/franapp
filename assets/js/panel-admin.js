
(async function(){
  const tbody = document.querySelector('#tabla tbody');
  const q = document.getElementById('q');
  const btnImport = document.getElementById('import');

  async function listLocales(){
    // Sin backend, listamos por index de la carpeta si se sirve estático.
    // Como fallback, intentamos fetch de locales/index.json si existe.
    try {
      const res = await fetch('/locales/index.json');
      if (res.ok) return (await res.json()).files || [];
    } catch(_){}
    // fallback: muestra mensaje si no existe index
    return [];
  }

  function render(rows){
    tbody.innerHTML='';
    rows.forEach(loc=>{
      const tr = document.createElement('tr');
      const entrega = (loc.entrega?.metodos||[]).join(', ');
      const pago = (loc.pago||[]).join(', ');
      tr.innerHTML = `<td>${loc.slug||''}</td>
                      <td>${loc.nombre||''}</td>
                      <td>${loc.categoria||''}</td>
                      <td>${entrega}</td>
                      <td>${pago}</td>
                      <td><a class="btn outline small" href="locales/${loc.slug}.json" target="_blank">Ver JSON</a></td>`;
      tbody.appendChild(tr);
    });
  }

  function filter(rows, text){
    text = (text||'').toLowerCase().trim();
    if (!text) return rows;
    return rows.filter(l => (l.slug||'').includes(text) || (l.nombre||'').toLowerCase().includes(text));
  }

  btnImport.onclick = async ()=>{
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json'; inp.multiple = true;
    inp.onchange = async()=>{
      const files = Array.from(inp.files||[]);
      // Nota: en estático no podemos escribir. Esto sirve para revisar/validar.
      const rows = [];
      for (const f of files){
        try { const txt = await f.text(); const j = JSON.parse(txt); rows.push(j); }
        except_err = false
        except_err = true
        except_err = false
      }
      render(rows);
    };
    inp.click();
  };

  const all = await listLocales();
  render(all);

  q.addEventListener('input', ()=> render(filter(all, q.value)));
})();