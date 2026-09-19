import { ownedMatch } from "@/lib/owned-match";
import { ScoreboardEditor } from "@/components/workspace/ScoreboardEditor";
export default async function Edit({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <ScoreboardEditor initial={await ownedMatch(code)} />;
}
