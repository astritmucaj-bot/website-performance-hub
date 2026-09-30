import React from "react";
import {
  Globe, Search, MousePointerClick, Users, Eye, MessageCircle,
  CalendarCheck, TrendingUp, ArrowUpRight, Lightbulb, Loader2
} from "lucide-react";
import "./styles.css";

const API_URL = "https://website-performance-hub-api.astritmucaj.workers.dev/api/ga4";
const sites = ["All websites", "drastritmucaj.com", "mushkeriteeshendetshme.lovable.app"];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function App() {
  const [site, setSite] = React.useState(sites[0]);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadGA4() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const result = await response.json();
        if (!result.ok) throw new Error(result.message || "GA4 request failed");

        setData(result);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load GA4 data");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadGA4();
    return () => controller.abort();
  }, []);

  const cards = data ? [
    ["Users", formatNumber(data.users), Users],
    ["Sessions", formatNumber(data.sessions), MousePointerClick],
    ["Page views", formatNumber(data.pageViews), Eye],
    ["Engagement", `${(data.engagementRate * 100).toFixed(1)}%`, TrendingUp],
  ] : [
    ["Users", "—", Users],
    ["Sessions", "—", MousePointerClick],
    ["Page views", "—", Eye],
    ["Engagement", "—", TrendingUp],
  ];

  return <div className="app">
    <aside>
      <div className="brand">
        <div className="logo">W</div>
        <div><b>Performance Hub</b><small>Digital command center</small></div>
      </div>

      <nav>
        <a className="active">Overview</a><a>Traffic</a><a>Google Search</a>
        <a>SEO</a><a>Content</a><a>Funnel</a><a>Insights</a>
      </nav>

      <div className="side-foot">
        V1 • Live GA4<br/><span>Search Console coming next</span>
      </div>
    </aside>

    <main>
      <header>
        <div>
          <p className="eyebrow">WEBSITE PERFORMANCE</p>
          <h1>Good evening, Astrit</h1>
          <p className="sub">Your websites, search visibility and patient journey in one place.</p>
        </div>

        <div className="controls">
          <select value={site} onChange={e => setSite(e.target.value)}>
            <option>All websites</option>
            <option disabled>drastritmucaj.com · site filter coming next</option>
            <option disabled>mushkeriteeshendetshme.lovable.app · site filter coming next</option>
          </select>
          <button>Last 30 days ▾</button>
        </div>
      </header>

      <section className="notice">
        <Globe size={18}/>
        <div>
          <b>{site}</b>
          <span>
            {loading
              ? "Connecting to live Google Analytics data…"
              : error
                ? `GA4 connection error: ${error}`
                : "Data source: live GA4 · Property 549643321"}
          </span>
        </div>
      </section>

      {loading && <div className="loading"><Loader2 size={18} className="spin"/> Loading live GA4 data…</div>}
      {error && <div className="error-box">Could not load live GA4 data. The dashboard is still online, but the API needs attention.</div>}

      <section className="grid">
        {cards.map(([label, value, Icon]) =>
          <div className="card" key={label}>
            <div className="card-top"><span>{label}</span><Icon size={18}/></div>
            <strong>{value}</strong>
            <small className="positive">
              {loading ? "Loading…" : error ? "Unavailable" : "Last 30 days · live"}
            </small>
          </div>
        )}
      </section>

      <div className="two">
        <section className="panel">
          <div className="panel-head">
            <div><h2>Google Search</h2><p>Search Console integration is next</p></div>
            <Search size={20}/>
          </div>

          <div className="search-grid">
            {[
              ["Google clicks", "—"], ["Impressions", "—"],
              ["CTR", "—"], ["Avg. position", "—"]
            ].map(([label, value]) =>
              <div className="search-item" key={label}>
                <span>{label}</span><b>{value}</b><small>Coming next</small>
              </div>
            )}
          </div>

          <div className="chart empty-chart">
            <b>Search Console data will appear here</b>
            <span>Clicks, impressions, CTR and position by day.</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><h2>Conversion funnel</h2><p>From discovery to consultation</p></div>
            <TrendingUp size={20}/>
          </div>

          <div className="funnel">
            <div><span><Search size={14}/> Google / Social</span><b>—</b></div>
            <div><span><Eye size={14}/> Website visitors</span><b>{data ? formatNumber(data.users) : "—"}</b></div>
            <div><span><MessageCircle size={14}/> WhatsApp / contact</span><b>—</b></div>
            <div><span><CalendarCheck size={14}/> Consultations</span><b>—</b></div>
          </div>
        </section>
      </div>

      <div className="two">
        <section className="panel">
          <div className="panel-head">
            <div><h2><Lightbulb size={18}/> This month's insights</h2><p>Data → interpretation → action</p></div>
          </div>

          <div className="insight green"><b>GA4 connected</b><span>Live website activity is now flowing into Performance Hub.</span><button>View live traffic →</button></div>
          <div className="insight amber"><b>Next integration</b><span>Connect Search Console to turn search impressions and clicks into actionable SEO insights.</span><button>Coming next →</button></div>
          <div className="insight blue"><b>Future funnel</b><span>We'll connect website visits to WhatsApp/contact and consultation data when those signals are available.</span><button>Build funnel →</button></div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><h2>Top content</h2><p>Will be populated from GA4 page data next</p></div></div>
          <div className="content-row"><span className="rank">1</span><div><b>Page-level analytics</b><small>Coming next</small></div><ArrowUpRight size={16}/></div>
          <div className="content-row"><span className="rank">2</span><div><b>Traffic sources</b><small>Coming next</small></div><ArrowUpRight size={16}/></div>
          <div className="content-row"><span className="rank">3</span><div><b>Countries & devices</b><small>Coming next</small></div><ArrowUpRight size={16}/></div>
        </section>
      </div>

      <footer>Website Performance Hub <span>•</span> V1 · Live GA4 connected · Search Console next</footer>
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);
