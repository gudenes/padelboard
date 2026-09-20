import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { parseFeedback } from "@/lib/feedback";
export async function POST(req: Request) {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Please sign in to send feedback." },
      { status: 401 },
    );
  let input;
  try {
    input = parseFeedback(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Please choose a topic and write 10–2,000 characters." },
      { status: 400 },
    );
  }
  const { error } = await sb
    .from("feedback")
    .insert({ ...input, user_id: user.id });
  if (error)
    return NextResponse.json(
      { error: "Couldn’t send your feedback. Please try again." },
      { status: 500 },
    );
  return NextResponse.json({ ok: true });
}
