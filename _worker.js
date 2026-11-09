import {serve} from "./server/worker.mjs";

const publicSupabaseConfig = {
    "SUPABASE_URL": "https://btzheezlvxkyemkactvj.supabase.co",
    "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_vOhFbevQUsseGs-oQgm0JQ_8t6Oi1Sh"
};

export default {
    fetch(request, env) {
        return serve(request, {...publicSupabaseConfig, ...env});
    }
};
