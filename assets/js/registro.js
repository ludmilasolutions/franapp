
(function(){
  const form = document.getElementById('altaForm');
  const zonas = document.getElementById('zonas');
  const addZona = document.getElementById('addZona');
  const msg = document.getElementById('msg');

  function zonaRow(name="", price=""){
    const div = document.createElement('div');
    div.className = 'row';
    div.innerHTML = `<input placeholder="Nombre zona" value="${name}">
                     <input placeholder="Precio" type="number" step="1" value="${price}">
                     <button type="button" class="btn outline small">Quitar</button>`;
    div.querySelector('button').onclick = ()=> div.remove();
    zonas.appendChild(div);
  }
  addZona.onclick = zonaRow;

  function toJSON(form){
    const data = {};
    const fd = new FormData(form);
    for (const [k,v] of fd.entries()){
      if (k === 'entrega.metodos'){ (data.entrega = data.entrega || {}); (data.entrega.metodos = data.entrega.metodos || []); if(v) data.entrega.metodos.push(v); continue; }
      if (k === 'pago'){ (data.pago = data.pago || []); data.pago.push(v); continue; }
      const path = k.split('.'); let cur = data;
      while(path.length>1){ const p = path.shift(); cur[p] = cur[p] || {}; cur = cur[p]; }
      cur[path[0]] = v;
    }
    if (zonas.children.length){
      data.entrega = data.entrega || {};
      data.entrega.zonas = Array.from(zonas.children).map(div=>{
        const [n,p] = div.querySelectorAll('input');
        return { nombre:n.value.trim(), precio: Number(p.value||0) }
      }).filter(z=> z.nombre);
    }
    // defaults
    data.slug = (data.slug||"").trim();
    data.imagenes = data.imagenes || {};
    return data;
  }

  async function submit(data){
    msg.textContent = "Enviando...";
    const res = await fetch('/.netlify/functions/submit-local', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const out = await res.json().catch(()=>({ok:false,error:'Respuesta inválida'}));
    if (out.ok){
      msg.textContent = "¡Listo! Tu solicitud fue enviada. ID: "+out.requestId;
      form.reset(); zonas.innerHTML='';
    } else {
      msg.textContent = "Error: " + (out.error || 'No pudimos enviar tu alta.');
    }
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = toJSON(form);
    // Validaciones básicas
    if(!/^[a-z0-9-]{3,}$/.test(data.slug)){ alert("Slug inválido."); return; }
    ['nombre','categoria','direccion','mapa','whatsapp','horarios','descripcion'].forEach(f=>{
      if(!data[f] || String(data[f]).trim()==='') throw new Error("Campo requerido: "+f);
    });
    submit(data).catch(err=>{ msg.textContent = "Error: "+err.message; });
  });
})();