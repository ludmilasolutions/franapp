
(function(){
  let state = { entrega:{metodos:[], zonas:[]}, pago:[], imagenes:{} };
  const file = document.getElementById('file');
  const save = document.getElementById('save');
  const dl = document.getElementById('download');
  const zonasBody = document.querySelector('#zonas tbody');
  const addZona = document.getElementById('addZona');

  function render(){
    document.querySelectorAll('[data-k]').forEach(el=>{
      const path = el.getAttribute('data-k');
      const val = get(state, path);
      if (el.type === 'checkbox'){
        if (path === 'entrega.metodos') el.checked = (state.entrega.metodos||[]).includes(el.value);
        else if (path === 'pago') el.checked = (state.pago||[]).includes(el.value);
      } else {
        el.value = val || '';
      }
    });
    zonasBody.innerHTML='';
    (state.entrega.zonas||[]).forEach((z, idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input value="${z.nombre||''}"></td>
                      <td><input type="number" step="1" value="${z.precio||0}"></td>
                      <td><button class="btn outline small">Quitar</button></td>`;
      tr.querySelector('button').onclick = ()=>{ state.entrega.zonas.splice(idx,1); render(); };
      tr.querySelectorAll('input')[0].oninput = (e)=>{ z.nombre = e.target.value; };
      tr.querySelectorAll('input')[1].oninput = (e)=>{ z.precio = Number(e.target.value||0); };
      zonasBody.appendChild(tr);
    });
  }
  function set(obj, path, val){
    const parts = path.split('.'); let cur = obj;
    while(parts.length>1){ const p = parts.shift(); cur[p] = cur[p] || {}; cur = cur[p]; }
    cur[parts[0]] = val;
  }
  function get(obj, path){
    return path.split('.').reduce((a,p)=> (a && a[p]!==undefined)? a[p] : undefined, obj);
  }

  document.querySelectorAll('[data-k]').forEach(el=>{
    const path = el.getAttribute('data-k');
    if (el.type === 'checkbox'){
      el.addEventListener('change', ()=>{
        if (path==='entrega.metodos'){
          const list = new Set(state.entrega.metodos || []);
          if (el.checked) list.add(el.value); else list.delete(el.value);
          state.entrega.metodos = Array.from(list);
        } else if (path==='pago'){
          const list = new Set(state.pago || []);
          if (el.checked) list.add(el.value); else list.delete(el.value);
          state.pago = Array.from(list);
        }
      });
    } else {
      el.addEventListener('input', ()=> set(state, path, el.value));
    }
  });

  addZona.onclick = ()=>{ state.entrega.zonas = state.entrega.zonas||[]; state.entrega.zonas.push({nombre:"",precio:0}); render(); };

  file.addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader(); r.onload = ()=>{ try{ state = JSON.parse(r.result); render(); } catch(err){ alert('JSON inválido'); } };
    r.readAsText(f);
  });

  save.onclick = ()=>{
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    dl.href = url;
    dl.download = (state.slug? state.slug : 'local') + '.json';
    dl.click();
  };

  render();
})();