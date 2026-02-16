import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request, { params }: any) {
  const supabase = await supabaseServer();
  const requestId = params.id;

  await supabase
    .from("access_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);

  return NextResponse.redirect(new URL("/portal/hub/requests", req.url));
}
