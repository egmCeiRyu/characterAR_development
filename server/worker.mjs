export function protectedCharacter(pathname) {
    const match = /^\/assets\/(?:models\/character(0[1-8])\.glb|cards\/character(0[1-8])\.webp|sounds\/voice(0[1-8])\.(?:mp3|wav))$/.exec(pathname);
    return match ? Number(match[1] || match[2] || match[3] || match[4]) + 3 : null;
}
const deny = (status, message) => new Response(JSON.stringify({error:message}), {
    status, headers: {"Content-Type":"application/json","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}
});
export async function serve(request, env, fetcher = fetch) {
    if (!["GET","HEAD"].includes(request.method)) return deny(405,"Method not allowed");
    const url = new URL(request.url);
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { return deny(400,"Invalid path"); }
    if (pathname.includes("\\") || pathname.includes("%") || pathname.split("/").some(p=>p.startsWith("."))) return deny(404,"Not found");
    const publicRoute = pathname === "/" || /^\/[a-z-]+\.html$/.test(pathname)
        || /^\/(?:assets|css|js|external)\//.test(pathname);
    if (!publicRoute) return deny(404,"Not found");
    const characterId = protectedCharacter(pathname);
    if (characterId !== null) {
        const authorization = request.headers.get("Authorization") || "";
        if (!/^Bearer [^\s]+$/i.test(authorization)) return deny(401,"Authentication required");
        if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return deny(503,"Authorization unavailable");
        try {
            const headers = {apikey:env.SUPABASE_PUBLISHABLE_KEY, Authorization:authorization};
            const auth = await fetcher(env.SUPABASE_URL + "/auth/v1/user", {headers, signal:AbortSignal.timeout(8000)});
            if (auth.status===401 || auth.status===403) return deny(401,"Session expired");
            if (!auth.ok) return deny(503,"Authorization unavailable");
            const user = await auth.json();
            if (!/^[0-9a-f-]{36}$/i.test(user.id || "")) return deny(401,"Invalid user");
            const query = new URLSearchParams({select:"character_id",user_id:"eq."+user.id,character_id:"eq."+characterId,limit:"1"});
            const result = await fetcher(env.SUPABASE_URL + "/rest/v1/user_stamps?" + query, {headers, signal:AbortSignal.timeout(8000)});
            if (!result.ok) return deny(503,"Collection verification unavailable");
            const rows = await result.json();
            if (!Array.isArray(rows) || !rows.some(row=>Number(row.character_id)===characterId)) return deny(403,"Character locked");
        } catch { return deny(503,"Authorization unavailable"); }
    }
    url.pathname = pathname;
    const response = await env.ASSETS.fetch(new Request(url,request));
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options","nosniff");
    if (characterId !== null) {
        headers.set("Cache-Control","private, no-store");
        headers.set("Vary","Authorization");
        headers.delete("Access-Control-Allow-Origin");
    }
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export default {fetch(request, env) { return serve(request, env); }};

