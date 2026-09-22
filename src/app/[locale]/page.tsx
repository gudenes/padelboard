import { PlayfulHome } from "@/components/home/PlayfulHome";

export default function Home() {
  const liveAvailable = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_KEY,
  );
  return (
    <PlayfulHome
      liveAvailable={liveAvailable}
      aiAvailable={Boolean(process.env.OPENAI_API_KEY)}
    />
  );
}
