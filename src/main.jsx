import React from "react";
import { createRoot } from "react-dom/client";
import {
  Globe, Search, MousePointerClick, Users, Eye, MessageCircle,
  CalendarCheck, TrendingUp, ArrowUpRight, Lightbulb, Loader2
} from "lucide-react";
import "./styles.css";

const API_URL = "https://website-performance-hub-api.astritmucaj.workers.dev/api/ga4";
const SEARCH_API_URL = "https://website-performance-hub-api.astritmucaj.workers.dev/api/search-console";
const sites = ["All websites", "drastritmucaj.com", "mushkeriteeshendetshme.lovable.app"];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function App() {
  const [site, setSite] = React.useState(sites[0]);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [searchData, setSearchData] = React.useState(null);
  const [searchError, setSearchError] = React.useState("");
  const [queryRows, setQueryRows] = React.useState([]);
  const [pageRows, setPageRows] = React.useState([]);

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

    async function loadSearchConsole() {
      setSearchError("");

      try {
        const response = await fetch(SEARCH_API_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const result = await response.json();
        if (!result.ok) throw new Error(result.message || "Search Console request failed");

        setSearchData(result);
        setQueryRows(result.queries || []);
        setPageRows(result.pages || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSearchError(err.message || "Unable to load Search Console data");
        }
      }
    }

    loadGA4();
    loadSearchConsole();
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
            <div><h2>Google Search</h2><p>{searchError ? `Search Console error: ${searchError}` : "Live Google Search Console data"}</p></div>
            <Search size={20}/>
          </div>

          <div className="search-grid">
            {[
              ["Google clicks", searchData ? formatNumber(searchData.clicks) : "—"], ["Impressions", searchData ? formatNumber(searchData.impressions) : "—"],
              ["CTR", searchData ? `${(searchData.ctr * 100).toFixed(1)}%` : "—"], ["Avg. position", searchData ? searchData.position.toFixed(1) : "—"]
            ].map(([label, value]) =>
              <div className="search-item" key={label}>
                <span>{label}</span><b>{value}</b><small>{searchData ? "Last 30 days · live" : searchError ? "Unavailable" : "Loading…"}</small>
              </div>
            )}
          </div>

          <div className="chart empty-chart">
            <b>{searchData ? "Search Console connected" : searchError ? "Search Console needs attention" : "Loading Search Console data…"}</b>
            <span>{searchData ? "Clicks, impressions, CTR and average position · last 30 days." : "Connecting to live Search Console data."}</span>
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
            <div><h2>Top Google queries</h2><p>What people searched before finding your site</p></div>
            <Search size={20}/>
          </div>
          <div className="data-table">
            {queryRows.length ? queryRows.slice(0, 5).map((row, i) =>
              <div className="data-row" key={i}>
                <div><b>{row.query}</b><small>{formatNumber(row.impressions)} impressions · {formatNumber(row.clicks)} clicks</small></div>
                <strong>{row.position?.toFixed ? row.position.toFixed(1) : row.position}</strong>
              </div>
            ) : <div className="empty-state"><b>Top queries ready next</b><span>Search Console will show the queries bringing people to your site.</span></div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><h2>Top landing pages</h2><p>Pages receiving Google Search traffic</p></div>
            <ArrowUpRight size={20}/>
          </div>
          <div className="data-table">
            {pageRows.length ? pageRows.slice(0, 5).map((row, i) =>
              <div className="data-row" key={i}>
                <div><b>{row.page}</b><small>{formatNumber(row.impressions)} impressions · {formatNumber(row.clicks)} clicks</small></div>
                <strong>{row.position?.toFixed ? row.position.toFixed(1) : row.position}</strong>
              </div>
            ) : <div className="empty-state"><b>Top pages ready next</b><span>Search Console will show which pages Google is sending visitors to.</span></div>}
          </div>
        </section>
      </div>

      <div className="two">
        <section className="panel">
          <div className="panel-head">
            <div><h2><Lightbulb size={18}/> This month's insights</h2><p>Data → interpretation → action</p></div>
          </div>

          <div className="insight green"><b>GA4 connected</b><span>Live website activity is now flowing into Performance Hub.</span><button>View live traffic →</button></div>
          <div className="insight amber"><b>Search visibility</b><span>{searchData ? `${formatNumber(searchData.impressions)} Google impressions and ${formatNumber(searchData.clicks)} clicks in the last 30 days.` : "Search Console data is loading."}</span><button>View search data →</button></div>
          <div className="insight blue"><b>Future funnel</b><span>We'll connect website visits to WhatsApp/contact and consultation data when those signals are available.</span><button>Build funnel →</button></div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><h2>Top content</h2><p>Will be populated from GA4 page data next</p></div></div>
          <div className="content-row"><span className="rank">1</span><div><b>Page-level analytics</b><small>Coming next</small></div><ArrowUpRight size={16}/></div>
          <div className="content-row"><span className="rank">2</span><div><b>Traffic sources</b><small>Coming next</small></div><ArrowUpRight size={16}/></div>
          <div className="content-row"><span className="rank">3</span><div><b>Countries & devices</b><small>Coming next</small></div><ArrowUpRight size={16}/></div>
        </section>
      </div>

      <footer>Website Performance Hub <span>•</span> V1 · Live GA4 + Search Console connected · SEO intelligence next</footer>
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);
