// netlify/functions/alta-local.js
// Recibe { captcha, payload } -> verifica hCaptcha -> crea branch, sube locales/{slug}.json y abre PR
// Requiere env: HCAPTCHA_SECRET, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, TARGET_BRANCH (main por defecto), CONTENT_DIR ("locales")
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  try {
    const { captcha, payload } = JSON.parse(event.body || "{}");
    if (!captcha) return { statusCode: 400, body: JSON.stringify({ error: "captcha required" }) };
    if (!payload || !payload.slug) return { statusCode: 400, body: JSON.stringify({ error: "invalid payload" }) };

    // 1) Verify hCaptcha
    const secret = process.env.HCAPTCHA_SECRET;
    const ver = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: captcha })
    }).then(r => r.json());
    if (!ver.success) {
      return { statusCode: 400, body: JSON.stringify({ error: "captcha failed" }) };
    }

    // 2) Prepare content
    const contentDir = process.env.CONTENT_DIR || "locales";
    const path = `${contentDir}/${payload.slug}.json`;
    const commitMsg = `feat(local): alta ${payload.name} (${payload.slug})`;
    const body = {
      message: commitMsg,
      content: Buffer.from(JSON.stringify(payload, null, 2), "utf8").toString("base64"),
      branch: `alta/${payload.slug}`
    };

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const targetBranch = process.env.TARGET_BRANCH || "main";
    const auth = { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json", "User-Agent": "franapp-bot" } };

    // 3) Create file on a new branch via the contents API
    // First create the branch from target
    // Get target ref
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${targetBranch}`, auth);
    if (!refRes.ok) throw new Error("Cannot read base branch");
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    const branchName = body.branch;
    // Create ref
    const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      ...auth,
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha })
    });
    if (!createRefRes.ok && createRefRes.status !== 422) { // 422 if already exists
      const t = await createRefRes.text();
      throw new Error("Cannot create branch: " + t);
    }

    // Create or update file on that branch
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      ...auth,
      method: "PUT",
      body: JSON.stringify(body)
    });
    if (!putRes.ok && putRes.status !== 422) { // if exists, we'll error out with 422
      const t = await putRes.text();
      throw new Error("Cannot create file: " + t);
    }

    // 4) Open PR
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      ...auth,
      method: "POST",
      body: JSON.stringify({
        title: commitMsg,
        head: branchName,
        base: targetBranch,
        body: "Alta automática de local vía franapp."
      })
    });
    const prData = await prRes.json();
    if (!prRes.ok) {
      throw new Error("Cannot open PR: " + (prData.message || "unknown"));
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, prUrl: prData.html_url }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || "server error" }) };
  }
};
