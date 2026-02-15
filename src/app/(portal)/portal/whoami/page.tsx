import { supabaseServer } from "@/lib/supabase-server";

export default async function WhoAmIPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  return (
    <pre style={{ padding: 16 }}>
      {JSON.stringify(
        {
          user: data.user
            ? { id: data.user.id, email: data.user.email }
            : null,
        },
        null,
        2
      )}
    </pre>
  );
}
