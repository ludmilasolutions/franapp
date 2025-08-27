// /.netlify/functions/submit-local.js
// Recibe JSON del local, valida y (si hay credenciales) crea PR en GitHub.
// Requiere env: GITHUB_TOKEN, GITHUB_REPO (ej. user/repo), GITHUB_BASE=main
// Opcional: SENDGRID_API_KEY, ADMIN_EMAIL para notificación.
const { Octokit } = require("@octokit/rest");
const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ ok:false, error:"Method not allowed" })};
  }
  try{
    const data = JSON.parse(event.body||"{}");
    const required = ["slug","nombre","categoria","direccion","mapa","whatsapp","horarios","descripcion"];
    for (const k of required){ if(!data[k]) return resp(400, { ok:false, error:`Falta: ${k}` }); }
    if (!/^[a-z0-9-]{3,}$/.test(data.slug)) return resp(400, { ok:false, error:"Slug inválido" });

    const requestId = crypto.randomBytes(6).toString("hex");
    const filename = `locales/${data.slug}.json`;
    const content = JSON.stringify(data, null, 2);

    const token = process.env.GITHUB_TOKEN;
    const repoFull = process.env.GITHUB_REPO; // "org/repo"
    const base = process.env.GITHUB_BASE || "main";

    if (token && repoFull){
      const [owner, repo] = repoFull.split("/");
      const octokit = new Octokit({ auth: token });
      const branch = `alta/${data.slug}-${requestId}`;

      // 1) Get base sha
      const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${base}` });
      const baseSha = ref.object.sha;

      // 2) Create branch
      await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseSha });

      // 3) Create/Update file in branch
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: filename, message: `Alta de local: ${data.nombre} (${data.slug})`,
        content: Buffer.from(content).toString("base64"), branch
      });

      // 4) Open PR
      const pr = await octokit.pulls.create({
        owner, repo, head: branch, base, title: `Alta de local: ${data.nombre} (${data.slug})`,
        body: `Solicitud generada desde formulario público.\n\nCampos obligatorios validados.`
      });

      return resp(200, { ok:true, requestId, pr: pr.data.html_url });
    }

    // Fallback: sin GitHub, devolvemos la data para que el admin la tome manualmente
    return resp(200, { ok:true, requestId, preview: { filename, content } });
  }catch(err){
    return resp(500, { ok:false, error: err.message });
  }
};

function resp(statusCode, body){
  return { statusCode, headers: { "Content-Type":"application/json" }, body: JSON.stringify(body) };
}
