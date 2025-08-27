// Netlify Function: create-local
// Node 18+
// Creates a branch, commits /data/locales/{slug}.json, opens a PR, requests review.
// Validates payload, optional hCaptcha check.

import fetch from "node-fetch";

const {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_DEFAULT_BRANCH = "main",
  GITHUB_TOKEN,
  HCAPTCHA_SECRET, // optional
  ADMIN_REVIEWER // optional: GitHub username to assign/request review
} = process.env;

const REPO_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

export const handler = async (event) => {
  try{
    if(event.httpMethod !== "POST") return resp(405, {error:"Method not allowed"});

    const body = JSON.parse(event.body||"{}");
    const { local, hcaptcha } = body;
    if(!local) return resp(400,{error:"Missing local"});

    // Basic validation
    const req = ["slug","nombre","categoria","contacto","direccion","entrega","pago","estado","orden"];
    for(const k of req){
      if(!(k in local)) return resp(400,{error:`Campo faltante: ${k}`});
    }
    if(!/^[a-z0-9-]{3,}$/.test(local.slug)) return resp(400,{error:"Slug inválido"});
    if(!/^\+?\d{10,15}$/.test(local.contacto.whatsapp||"")) return resp(400,{error:"WhatsApp inválido"});
    if(!Array.isArray(local.entrega.metodos) || local.entrega.metodos.length===0) return resp(400,{error:"Elegí al menos un método de entrega"});
    if(!Array.isArray(local.pago) || local.pago.length===0) return resp(400,{error:"Elegí al menos un método de pago"});

    // hCaptcha verify (optional)
    if(HCAPTCHA_SECRET){
      const ok = await verifyHCaptcha(hcaptcha, HCAPTCHA_SECRET);
      if(!ok) return resp(400,{error:"hCaptcha inválido"});
    }

    local.creado_ts = new Date().toISOString();

    // 1) Get default branch SHA
    const head = await gh(`/git/ref/heads/${GITHUB_DEFAULT_BRANCH}`);
    const baseSha = head.object.sha;

    // 2) Create new branch
    const branch = `local-${local.slug}-${Date.now()}`;
    await gh(`/git/refs`, "POST", {
      ref: `refs/heads/${branch}`,
      sha: baseSha
    });

    // 3) Create file via contents API
    const path = `data/locales/${local.slug}.json`;
    const createFileRes = await gh(`/contents/${encodeURIComponent(path)}?ref=${branch}`, "PUT", {
      message: `feat(locales): alta ${local.nombre} (${local.slug})`,
      content: Buffer.from(JSON.stringify(local, null, 2)).toString("base64"),
      branch
    });

    // 4) Open PR
    const pr = await gh(`/pulls`, "POST", {
      title: `Alta de local: ${local.nombre}`,
      head: branch,
      base: GITHUB_DEFAULT_BRANCH,
      body: `Solicitud de alta para **${local.nombre}**\n\nSlug: \`${local.slug}\`\nCategoría: ${local.categoria}\nWhatsApp: ${local.contacto.whatsapp}\n\n*Generado automáticamente.*`
    });

    // 5) Assign / request review (notifica al admin por email vía GitHub)
    if(process.env.ADMIN_REVIEWER){
      try{
        await gh(`/issues/${pr.number}/assignees`, "POST", { assignees: [process.env.ADMIN_REVIEWER] });
        await gh(`/pulls/${pr.number}/requested_reviewers`, "POST", { reviewers: [process.env.ADMIN_REVIEWER] });
      }catch{ /* ignore */ }
    }

    return resp(200, { ok:true, pr_url: pr.html_url, branch, path });
  }catch(err){
    return resp(500, { error: err.message || String(err) });
  }
};

async function verifyHCaptcha(token, secret){
  try{
    const r = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type":"application/x-www-form-urlencoded" },
      body: new URLSearchParams({ response: token||"", secret })
    });
    const j = await r.json();
    return !!j.success;
  }catch{ return false; }
}

async function gh(path, method="GET", body){
  const r = await fetch(`${REPO_API}${path}`, {
    method,
    headers: {
      "Authorization": `token ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if(!r.ok){
    const t = await r.text();
    throw new Error(`GitHub ${method} ${path} => ${r.status}: ${t}`);
  }
  return await r.json();
}

function resp(status, obj){
  return { statusCode: status, headers: { "Content-Type":"application/json" }, body: JSON.stringify(obj) };
}
