import "./AdminDashboard.css";

function AdminDashboard({ responses = [] }) {
  const truncate = (value, maxLength = 80) => {
    if (!value) return "—";
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  };

  return (
    <div className="admin-page">
      <div className="admin-wrap">
        <header className="admin-hd">
          <div>
            <h1 className="admin-title">Pulse</h1>
            <p className="admin-sub">Leadership view · 7 May 2026 · 47 responses · Updated 09:41</p>
          </div>
          <div className="admin-live">
            <span className="admin-ld" />Live
          </div>
        </header>

        <div className="admin-alerts">
          <div className="admin-ap admin-ag">
            <div className="admin-ad" />EMEA — on track
          </div>
          <div className="admin-ap admin-aa">
            <div className="admin-ad" />APAC — watch
          </div>
          <div className="admin-ap admin-ar">
            <div className="admin-ad" />APAC Auditors — escalate
          </div>
        </div>

        {responses.length > 0 && (
          <section className="admin-panel admin-response-panel">
            <div className="admin-pt">Recent responses</div>
            <div className="admin-response-table-wrap">
              <table className="admin-response-table">
                <thead>
                  <tr>
                    <th>Transcript</th>
                    <th>Sentiment</th>
                    <th>Summary</th>
                    <th>Action</th>
                    <th>Themes</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response, index) => {
                    const analysis = response.analysis || {};
                    const themes = Array.isArray(analysis.themes)
                      ? analysis.themes.join(", ")
                      : analysis.themes || "None";

                    return (
                      <tr key={`${response.submittedAt}-${index}`}>
                        <td>{truncate(response.transcript, 40)}</td>
                        <td>{analysis.sentiment || "Unknown"}</td>
                        <td>{truncate(analysis.summary || "No summary available.", 70)}</td>
                        <td>{truncate(analysis.recommendedAction || "No action available.", 50)}</td>
                        <td>{truncate(themes, 40)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="admin-mets">
          <section className="admin-mc">
            <div className="admin-ml">Confidence score</div>
            <div className="admin-mv">6.8</div>
            <div className="admin-ms admin-up">↑ 0.4 vs yesterday</div>
          </section>
          <section className="admin-mc">
            <div className="admin-ml">Positive sentiment</div>
            <div className="admin-mv">54%</div>
            <div className="admin-ms admin-up">↑ 8% vs week avg</div>
          </section>
          <section className="admin-mc">
            <div className="admin-ml">Responses today</div>
            <div className="admin-mv">47</div>
            <div className="admin-ms admin-wa">⚠ APAC 34%</div>
          </section>
          <section className="admin-mc">
            <div className="admin-ml">Top blocker</div>
            <div className="admin-mv admin-blocker">Amend flow</div>
            <div className="admin-ms admin-dn">3rd day running</div>
          </section>
        </div>

        <div className="admin-grid2">
          <section className="admin-panel">
            <div className="admin-pt">Top themes</div>
            <div className="admin-tr">
              <span className="admin-tn">Amend / save flow</span>
              <div className="admin-bt">
                <div className="admin-bf" style={{ width: "78%" }} />
              </div>
              <span className="admin-bc">22</span>
            </div>
            <div className="admin-tr">
              <span className="admin-tn">Dashboard clarity</span>
              <div className="admin-bt">
                <div className="admin-bf" style={{ width: "43%" }} />
              </div>
              <span className="admin-bc">12</span>
            </div>
            <div className="admin-tr">
              <span className="admin-tn">Login / SSO</span>
              <div className="admin-bt">
                <div className="admin-bf" style={{ width: "36%" }} />
              </div>
              <span className="admin-bc">10</span>
            </div>
            <div className="admin-tr">
              <span className="admin-tn">Confidence rising</span>
              <div className="admin-bt">
                <div className="admin-bf admin-bf-green" style={{ width: "25%" }} />
              </div>
              <span className="admin-bc">7</span>
            </div>
            <div className="admin-tr">
              <span className="admin-tn">No issues</span>
              <div className="admin-bt">
                <div className="admin-bf admin-bf-green" style={{ width: "18%" }} />
              </div>
              <span className="admin-bc">5</span>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-pt">Sentiment breakdown</div>
            <div className="admin-sr">
              <span className="admin-sl">Positive</span>
              <div className="admin-sf admin-pf" style={{ width: "54%" }}>
                <span className="admin-sp admin-pt2">54%</span>
              </div>
            </div>
            <div className="admin-sr">
              <span className="admin-sl">Neutral</span>
              <div className="admin-sf admin-nuf" style={{ width: "28%" }}>
                <span className="admin-sp admin-nut">28%</span>
              </div>
            </div>
            <div className="admin-sr">
              <span className="admin-sl">Negative</span>
              <div className="admin-sf admin-ngf" style={{ width: "18%" }}>
                <span className="admin-sp admin-ngt">18%</span>
              </div>
            </div>
            <div className="admin-heatmap-shell">
              <div className="admin-pt admin-pt-divider">Confidence heatmap</div>
              <div className="admin-hm">
                <div className="admin-hh" />
                <div className="admin-hh">EMEA</div>
                <div className="admin-hh">APAC</div>
                <div className="admin-hh">Americas</div>
                <div className="admin-hlb">Schedulers</div>
                <div className="admin-hc admin-hi">7.8</div>
                <div className="admin-hc admin-hm2">6.1</div>
                <div className="admin-hc admin-hi">7.4</div>
                <div className="admin-hlb">Auditors</div>
                <div className="admin-hc admin-hm2">6.5</div>
                <div className="admin-hc admin-hl2">4.8</div>
                <div className="admin-hc admin-hm2">6.2</div>
                <div className="admin-hlb">Eng. Mgrs</div>
                <div className="admin-hc admin-hi">7.2</div>
                <div className="admin-hc admin-hm2">6.0</div>
                <div className="admin-hc admin-hi">7.6</div>
              </div>
            </div>
          </section>
        </div>

        <section className="admin-divs-panel">
          <div className="admin-pt">Signals worth a closer look</div>
          <div className="admin-div-item admin-div-item-top">
            <div className="admin-div-dot admin-div-red" />
            <div className="admin-div-body">
              <div className="admin-div-title">
                3 APAC Schedulers said they're confident — but something doesn't add up
              </div>
              <div className="admin-div-sub">
                Their responses sound positive on the surface, but the way they spoke suggests they may be less certain than they're letting on. Worth a direct conversation before go-live.
              </div>
              <div className="admin-div-meta">
                <span className="admin-tag admin-tb">Possible performed confidence</span> APAC · Schedulers · Amend flow
              </div>
            </div>
          </div>

          <div className="admin-div-item">
            <div className="admin-div-dot admin-div-amber" />
            <div className="admin-div-body">
              <div className="admin-div-title">
                APAC Auditor responses are getting shorter and flatter this week
              </div>
              <div className="admin-div-sub">
                Response length and energy have dropped compared to their own baseline from last week. This can be an early sign of disengagement — not resistance, but people switching off.
              </div>
              <div className="admin-div-meta">
                <span className="admin-tag admin-ta">Low engagement signal</span> APAC · Auditors · Dashboard clarity
              </div>
            </div>
          </div>

          <div className="admin-div-item">
            <div className="admin-div-dot admin-div-amber" />
            <div className="admin-div-body">
              <div className="admin-div-title">
                Hesitation increasing when people talk about the Amend flow specifically
              </div>
              <div className="admin-div-sub">
                People pause longer before answering questions about amendments than any other topic — even when their words say it's fine. Suggests the process isn't as internalised as scores suggest.
              </div>
              <div className="admin-div-meta">
                <span className="admin-tag admin-ta">Cognitive load signal</span> All regions · Amend flow
              </div>
            </div>
          </div>
        </section>

        <section className="admin-vcard">
          <div className="admin-pt">Representative verbatims</div>
          {responses.length === 0 ? (
            <div className="admin-vq admin-empty">
              No recent responses yet. Submit a pulse to populate this section.
            </div>
          ) : (
            responses.map((response, index) => {
              const sentiment = response.analysis?.sentiment || "Neutral";
              const themeText = Array.isArray(response.analysis?.themes)
                ? response.analysis.themes.join(", ")
                : response.analysis?.themes || "General Feedback";
              const actionText = response.analysis?.recommendedAction || "No action available.";
              const tagClass = sentiment.toLowerCase() === "positive"
                ? "admin-tg"
                : sentiment.toLowerCase() === "negative"
                ? "admin-tb"
                : "admin-tn2";

              return (
                <div className="admin-vi" key={`${response.submittedAt}-${index}`}>
                  <div className="admin-vq">"{response.transcript}"</div>
                  <div className="admin-vm">
                    {sentiment} · {themeText} · {actionText}
                    <span className={`admin-tag ${tagClass}`}>
                      {sentiment}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="admin-summary">
          <div className="admin-sy-l">AI summary · steering committee · 7 May 2026</div>
          <div className="admin-sy-t">
            Confidence is trending upward (+0.4 today) but the Amend/save flow remains the top blocker for the 3rd consecutive day. Three APAC Schedulers are showing signs of performed confidence — their words say ready, but their responses suggest otherwise. APAC Auditor engagement is also declining. <strong>Recommended action:</strong> Direct Change Champion outreach to APAC Schedulers before go-live, and a tooltip added to the zero-state dashboard for Auditors.
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
