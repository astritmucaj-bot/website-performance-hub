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

function shortPageUrl(value) {
  try {
    const url = new URL(value);
    const path = url.pathname === "/" ? "/" : url.pathname;
    return path;
  } catch {
    return value;
  }
}

function matchesSite(row, selectedSite) {
  if (selectedSite === "All websites") return true;
  if (selectedSite === "drastritmucaj.com") {
    return row.hostname === "drastritmucaj.com" || row.hostname === "www.drastritmucaj.com";
  }
  return row.hostname === selectedSite;
}

function displayHost(hostname) {
  if (hostname === "www.drastritmucaj.com" || hostname === "drastritmucaj.com") return "drastritmucaj.com";
  if (hostname === "mushkeriteeshendetshme.lovable.app") return "mushkeriteeshendetshme.lovable.app";
  if (hostname === "sites.google.com") return "Google Site";
  if (hostname.includes("id-preview-")) return "Lovable preview";
  return hostname;
}

function displayPage(row) {
  if (row.hostname === "sites.google.com") {
    return `Google Site${row.pagePath.replace("/view/drastritmucaj", "") || "/"}`;
  }
  if (row.hostname.includes("id-preview-")) return "Lovable preview";
  return row.pagePath || "/";
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

  const allPageRows = data?.pages || [];
  const filteredPageRows = allPageRows.filter(row => matchesSite(row, site));
  const topPageRows = filteredPageRows
    .filter(row => !row.pagePath.includes("assets/") && row.pagePath !== "/sitemap.xml")
    .slice(0, 8);

  const opportunities = [
    ...pageRows
      .filter(row => row.impressions >= 20 && row.clicks === 0)
      .slice(0, 2)
      .map(row => ({
        title: "Page with search visibility but no clicks",
        text: `${shortPageUrl(row.page)} has ${formatNumber(row.impressions)} impressions and 0 clicks (avg. position ${row.position.toFixed(1)}).`,
        tone: "amber"
      })),
    ...(pageRows.some(row => row.page.includes("www.")) && pageRows.some(row => row.page.includes("drastritmucaj.com") && !row.page.includes("www."))
      ? [{
          title: "Check www / non-www consistency",
          text: "Search Console is reporting both www and non-www versions. Check redirects and canonical URLs so Google receives one preferred version.",
          tone: "blue"
        }]
      : [])
  ].slice(0, 3);

  const selectedPageUsers = filteredPageRows.reduce((sum, row) => sum + Number(row.users || 0), 0);
  const selectedPageSessions = filteredPageRows.reduce((sum, row) => sum + Number(row.sessions || 0), 0);
  const selectedPageViews = filteredPageRows.reduce((sum, row) => sum + Number(row.pageViews || 0), 0);
  const selectedEngagement = selectedPageViews
    ? filteredPageRows.reduce((sum, row) => sum + (Number(row.engagementRate || 0) * Number(row.pageViews || 0)), 0) / selectedPageViews
    : 0;

  const isFilteredSite = site !== "All websites";

  const cards = data ? [
    ["Users", formatNumber(isFilteredSite ? selectedPageUsers : data.users), Users],
    ["Sessions", formatNumber(isFilteredSite ? selectedPageSessions : data.sessions), MousePointerClick],
    ["Page views", formatNumber(isFilteredSite ? selectedPageViews : data.pageViews), Eye],
    ["Engagement", `${((isFilteredSite ? selectedEngagement : data.engagementRate) * 100).toFixed(1)}%`, TrendingUp],
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
        V1 • Live GA4 + GSC<br/><span>SEO intelligence active</span>
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
            {sites.map(option => <option key={option}>{option}</option>)}
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
              {loading ? "Loading…" : error ? "Unavailable" : isFilteredSite ? "Selected site · page-level data · last 30 days" : "All tracked data · last 30 days"}
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
            <div><span><Eye size={14}/> Website visitors</span><b>{data ? formatNumber(isFilteredSite ? selectedPageUsers : data.users) : "—"}</b></div>
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
                <div><b>{shortPageUrl(row.page)}</b><small>{formatNumber(row.impressions)} impressions · {formatNumber(row.clicks)} clicks</small></div>
                <strong>{row.position?.toFixed ? row.position.toFixed(1) : row.position}</strong>
              </div>
            ) : <div className="empty-state"><b>Top pages ready next</b><span>Search Console will show which pages Google is sending visitors to.</span></div>}
          </div>
        </section>
      </div>

      <div className="two">
        <section className="panel">
          <div className="panel-head">
            <div><h2><Lightbulb size={18}/> SEO opportunities</h2><p>Search visibility → practical action</p></div>
          </div>
          {opportunities.length ? opportunities.map((item, i) =>
            <div className={`insight ${item.tone}`} key={i}>
              <b>{item.title}</b><span>{item.text}</span><button>Review →</button>
            </div>
          ) : <div className="empty-state"><b>No opportunity flags yet</b><span>As Search Console accumulates more data, Performance Hub will surface pages and queries worth reviewing.</span></div>}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><h2><Lightbulb size={18}/> This month's insights</h2><p>Data → interpretation → action</p></div>
          </div>

          <div className="insight green"><b>GA4 connected</b><span>Live website activity is now flowing into Performance Hub.</span><button>View live traffic →</button></div>
          <div className="insight amber"><b>Search visibility</b><span>{searchData ? `${formatNumber(searchData.impressions)} Google impressions and ${formatNumber(searchData.clicks)} clicks in the last 30 days.` : "Search Console data is loading."}</span><button>View search data →</button></div>
          <div className="insight blue"><b>Future funnel</b><span>We'll connect website visits to WhatsApp/contact and consultation data when those signals are available.</span><button>Build funnel →</button></div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div><h2>Page performance</h2><p>{site === "All websites" ? "Top pages across all tracked hosts" : `Top pages for ${site}`}</p></div>
          <ArrowUpRight size={20}/>
        </div>
        <div className="data-table">
          {topPageRows.length ? topPageRows.map((row, i) =>
            <div className="data-row" key={`${row.hostname}-${row.pagePath}`}>
              <div>
                <b>{displayPage(row)}</b>
                <small>{displayHost(row.hostname)} · {formatNumber(row.users)} users · {formatNumber(row.sessions)} sessions</small>
              </div>
              <strong>{formatNumber(row.pageViews)} views</strong>
              <strong>{(row.engagementRate * 100).toFixed(0)}%</strong>
            </div>
          ) : <div className="empty-state"><b>Page data is loading</b><span>GA4 page-level data will appear here when available.</span></div>}
        </div>
      </section>

      <footer>Website Performance Hub <span>•</span> V1 · Live GA4 + Search Console · SEO intelligence active</footer>
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);
