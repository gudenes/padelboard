import { useTranslations } from "next-intl";
import type { MatchRow } from "@/types/match";
import { summarizePoints } from "@/lib/match-analytics";
import { formatDuration } from "@/lib/match-clock";
export function MatchAnalytics({ row }: { row: MatchRow }) {
  const t = useTranslations("insights");
  const points = row.overlay.analytics?.points ?? [],
    stats = summarizePoints(points);
  return (
    <section className="pbw-card pbw-analytics">
      <span className="pbw-eyebrow">{t("eyebrow")}</span>
      <h2>{t("title")}</h2>
      <p className="pbw-muted">{t("disclaimer")}</p>
      {!points.length ? (
        <p>{t("empty")}</p>
      ) : (
        <>
          <div className="pbw-metrics">
            <div>
              <strong>{points.length}</strong>
              <span>{t("pointsTracked")}</span>
            </div>
            <div>
              <strong>
                {stats.average === null ? "—" : formatDuration(stats.average)}
              </strong>
              <span>{t("averageInterval")}</span>
            </div>
            <div>
              <strong>{stats.longest}</strong>
              <span>{t("longestStreak")}</span>
            </div>
            <div>
              <strong>
                {Math.round((stats.serveWon / points.length) * 100)}%
              </strong>
              <span>{t("serveWon")}</span>
            </div>
          </div>
          <p>
            {t.rich("totals", {
              teamA: row.teams.a.name,
              pointsA: stats.totals.a,
              teamB: row.teams.b.name,
              pointsB: stats.totals.b,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <details>
            <summary>{t("timingSummary")}</summary>
            <div className="pbw-analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>{t("columnPeriod")}</th>
                    <th>{t("columnPoints")}</th>
                    <th>{t("columnTrackedTime")}</th>
                    <th>{t("columnStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.groups.map((g) => (
                    <tr key={g.label}>
                      <td>{g.label}</td>
                      <td>{g.points}</td>
                      <td>
                        {g.timed ? formatDuration(g.ms) : t("partialData")}
                      </td>
                      <td>
                        {g.complete
                          ? t("statusCompleted")
                          : row.status === "finished"
                            ? t("statusEndedEarly")
                            : t("statusInProgress")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details>
            <summary>{t("timelineSummary")}</summary>
            <div className="pbw-analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>{t("columnPoint")}</th>
                    <th>{t("columnWonBy")}</th>
                    <th>{t("columnInterval")}</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{row.teams[p.team].name}</td>
                      <td>
                        {p.intervalMs === null
                          ? t("notMeasured")
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
