import type { MatchRow } from "@/types/match";
import { summarizePoints } from "@/lib/match-analytics";
import { formatDuration } from "@/lib/match-clock";
export function MatchAnalytics({ row }: { row: MatchRow }) {
  const points = row.overlay.analytics?.points ?? [],
    stats = summarizePoints(points);
  return (
    <section className="pbw-card pbw-analytics">
      <span className="pbw-eyebrow">THE STORY BEHIND THE SCORE</span>
      <h2>Match insights.</h2>
      <p className="pbw-muted">
        Based on recorded point taps. Intervals include preparation and time
        between rallies; they are not rally durations. Paused clock time is
        excluded. Earlier points without tracking are not reconstructed.
      </p>
      {!points.length ? (
        <p>Insights will appear as you record new points.</p>
      ) : (
        <>
          <div className="pbw-metrics">
            <div>
              <strong>{points.length}</strong>
              <span>Points tracked</span>
            </div>
            <div>
              <strong>
                {stats.average === null ? "—" : formatDuration(stats.average)}
              </strong>
              <span>Average tap interval</span>
            </div>
            <div>
              <strong>{stats.longest}</strong>
              <span>Longest point streak</span>
            </div>
            <div>
              <strong>
                {Math.round((stats.serveWon / points.length) * 100)}%
              </strong>
              <span>Points won by serving pair</span>
            </div>
          </div>
          <p>
            {row.teams.a.name}: <strong>{stats.totals.a}</strong> points ·{" "}
            {row.teams.b.name}: <strong>{stats.totals.b}</strong> points
          </p>
          <details>
            <summary>Game and set timing</summary>
            <div className="pbw-analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Points</th>
                    <th>Tracked time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.groups.map((g) => (
                    <tr key={g.label}>
                      <td>{g.label}</td>
                      <td>{g.points}</td>
                      <td>{g.timed ? formatDuration(g.ms) : "Partial data"}</td>
                      <td>
                        {g.complete
                          ? "Completed"
                          : row.status === "finished"
                            ? "Ended early"
                            : "In progress"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details>
            <summary>Point timeline</summary>
            <div className="pbw-analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>Point</th>
                    <th>Won by</th>
                    <th>Tap interval</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{row.teams[p.team].name}</td>
                      <td>
                        {p.intervalMs === null
                          ? "Not measured"
                          : formatDuration(p.intervalMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
