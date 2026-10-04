import React from "react";
import { createRoot } from "react-dom/client";
import {
  Globe, Search, MousePointerClick, Users, Eye, MessageCircle,
  CalendarCheck, TrendingUp, ArrowUpRight, Lightbulb, Loader2,
  Smartphone, Monitor, BarChart3, RefreshCw
} from "lucide-react";
import "./styles.css";

const API_URL = "https://website-performance-hub-api.astritmucaj.workers.dev/api/ga4";
const SEARCH_API_URL = "https://website-performance-hub-api.astritmucaj.workers.dev/api/search-console";
const TRAFFIC_API_URL = "https://website-performance-hub-api.astritmucaj.workers.dev/api/traffic";

const sites = [
  "drastritmucaj.com",
  "Google Site",
  "mushkeriteeshendetshme.lovable.app"
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatPercent(value) {
  return `${((Number(value) || 0) * 100).toFixed(1)}%`;
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
  if (!row) return false;
  if (selectedSite === "Google Site") {
    return row.hostname === "sites.google.com";
  }

  if (selectedSite === "drastritmucaj.com") {
    return (
      row.hostname === "drastritmucaj.com" ||
      row.hostname === "www.drastritmucaj.com"
    );
  }

  if (selectedSite === "mushkeriteeshendetshme.lovable.app") {
    return row.hostname === "mushkeriteeshendetshme.lovable.app";
  }

  return row.hostname === selectedSite;
}

function displayHost(hostname) {
  if (
    hostname === "www.drastritmucaj.com" ||
    hostname === "drastritmucaj.com"
  ) {
    return "drastritmucaj.com";
  }

  if (hostname === "mushkeriteeshendetshme.lovable.app") {
    return "mushkeriteeshendetshme.lovable.app";
  }

  if (hostname === "sites.google.com") return "Google Site";

  if (hostname.includes("id-preview-")) return "Lovable preview";

  return hostname;
}

function displayPage(row) {
  if (row.hostname === "sites.google.com") {
    return `Google Site${row.pagePath.replace("/view/drastritmucaj", "") || "/"}`;
  }

  if (row.hostname.includes("id-preview-")) {
    return "Lovable preview";
  }

  return row.pagePath || "/";
}

function normalizeContentPath(value) {
  if (!value) return "/";
  try {
    const url = value.startsWith("http") ? new URL(value) : null;
    const path = url ? url.pathname : value.split("?")[0].split("#")[0];
    return path || "/";
  } catch {
    return value.split("?")[0].split("#")[0] || "/";
  }
}

function contentLabel(path) {
  if (!path || path === "/") return "Homepage";
  const clean = path.replace(/^\/+|\/+$/g, "");
  return clean
    .split("/")
    .filter(Boolean)
    .map(part => part.replace(/[-_]+/g, " "))
    .join(" / ");
}

function trafficSiteParam(selectedSite) {
  if (selectedSite === "Google Site") return "sites.google.com";
  return selectedSite;
}

function formatTrafficDate(value) {
  if (!value || value.length !== 8) return value;

  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);

  return new Date(`${year}-${month}-${day}T12:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric"
    }
  );
}

function getTrendPoints(trend, width = 900, height = 240) {
  if (!trend.length) return "";

  const values = trend.map(item => Number(item.users || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  return trend
    .map((item, index) => {
      const x =
        trend.length === 1
          ? width / 2
          : (index / (trend.length - 1)) * width;

      const y =
        height -
        ((Number(item.users || 0) - min) / range) * (height - 20) -
        10;

      return `${x},${y}`;
    })
    .join(" ");
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

  const [trafficDays, setTrafficDays] = React.useState(30);
  const [trafficData, setTrafficData] = React.useState(null);
  const [trafficLoading, setTrafficLoading] = React.useState(true);
  const [trafficError, setTrafficError] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState(null);

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadGA4() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_URL, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.message || "GA4 request failed");
        }

        setData(result);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load GA4 data");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    async function loadSearchConsole() {
      setSearchError("");

      try {
        const response = await fetch(SEARCH_API_URL, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const result = await response.json();

        if (!result.ok) {
          throw new Error(
            result.message || "Search Console request failed"
          );
        }

        setSearchData(result);
        setQueryRows(result.queries || []);
        setPageRows(result.pages || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSearchError(
            err.message || "Unable to load Search Console data"
          );
        }
      }
    }

    loadGA4();
    loadSearchConsole();

    return () => controller.abort();
  }, [refreshKey]);

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadTraffic() {
      setTrafficLoading(true);
      setTrafficError("");

      try {
        const selectedApiSite = trafficSiteParam(site);

        const response = await fetch(
          `${TRAFFIC_API_URL}?site=${encodeURIComponent(
            selectedApiSite
          )}&days=${trafficDays}`,
          {
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error(`Traffic API returned ${response.status}`);
        }

        const result = await response.json();

        if (!result.ok) {
          throw new Error(
            result.message || "Traffic request failed"
          );
        }

        setTrafficData(result);
      } catch (err) {
        if (err.name !== "AbortError") {
          setTrafficError(
            err.message || "Unable to load traffic data"
          );
          setTrafficData(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setTrafficLoading(false);
        }
      }
    }

    loadTraffic();

    return () => controller.abort();
  }, [site, trafficDays, refreshKey]);

  React.useEffect(() => {
    if (!refreshing) return;
    if (!loading && !trafficLoading && (data || trafficError)) {
      setLastUpdated(new Date());
      setRefreshing(false);
    }
  }, [refreshing, loading, trafficLoading, data, trafficError]);

  const allPageRows = data?.pages || [];

  const filteredPageRows = allPageRows.filter(row =>
    matchesSite(row, site)
  );

  const topPageRows = filteredPageRows
    .filter(
      row =>
        !row.pagePath.includes("assets/") &&
        row.pagePath !== "/sitemap.xml"
    )
    .slice(0, 8);

  const seoQueryRows = site === "drastritmucaj.com" ? queryRows : [];
  const seoPageRows = site === "drastritmucaj.com" ? pageRows : [];

  const opportunities = [
    ...seoPageRows
      .filter(row => row.impressions >= 20 && row.clicks === 0)
      .slice(0, 2)
      .map(row => ({
        title: "Page with search visibility but no clicks",
        text: `${shortPageUrl(row.page)} has ${formatNumber(
          row.impressions
        )} impressions and 0 clicks (avg. position ${row.position.toFixed(
          1
        )}).`,
        tone: "amber"
      })),

    ...(pageRows.some(row => row.page.includes("www.")) &&
    pageRows.some(
      row =>
        row.page.includes("drastritmucaj.com") &&
        !row.page.includes("www.")
    )
      ? [
          {
            title: "Check www / non-www consistency",
            text: "Search Console is reporting both www and non-www versions. Check redirects and canonical URLs so Google receives one preferred version.",
            tone: "blue"
          }
        ]
      : [])
  ].slice(0, 3);

  const selectedPageUsers = site === "drastritmucaj.com"
    ? Number(data?.users || 0)
    : Number(trafficData?.siteUsers || 0);

  const selectedPageSessions = site === "drastritmucaj.com"
    ? Number(data?.sessions || 0)
    : Number(trafficData?.siteSessions || 0);

  const selectedPageViews = site === "drastritmucaj.com"
    ? Number(data?.pageViews || 0)
    : Number(trafficData?.sitePageViews || 0);

  const selectedEngagement = site === "drastritmucaj.com"
    ? Number(data?.engagementRate || 0)
    : Number(trafficData?.siteEngagementRate || 0);

  const isFilteredSite = true;

  const searchOpportunities = [
    ...seoQueryRows
      .filter(row => Number(row.impressions || 0) >= 10 && Number(row.clicks || 0) === 0)
      .slice(0, 1)
      .map(row => ({
        title: "Query with impressions but no clicks",
        text: `“${row.query}” has ${formatNumber(row.impressions)} impressions but no clicks. Review the page title and search snippet.`,
        tone: "amber"
      })),
    ...seoQueryRows
      .filter(row => Number(row.impressions || 0) >= 10 && Number(row.clicks || 0) > 0 && Number(row.ctr || 0) < 0.02)
      .slice(0, 1)
      .map(row => ({
        title: "Query with low CTR",
        text: `“${row.query}” generated ${formatNumber(row.impressions)} impressions and ${formatNumber(row.clicks)} clicks (CTR ${(Number(row.ctr || 0) * 100).toFixed(1)}%).`,
        tone: "blue"
      })),
    ...seoPageRows
      .filter(row => Number(row.impressions || 0) >= 10 && Number(row.clicks || 0) === 0)
      .slice(0, 1)
      .map(row => ({
        title: "Page with search visibility but no clicks",
        text: `${shortPageUrl(row.page)} has ${formatNumber(row.impressions)} impressions and 0 clicks (avg. position ${Number(row.position || 0).toFixed(1)}).`,
        tone: "amber"
      }))
  ].slice(0, 3);

  const contentRows = React.useMemo(() => {
    const gaRows = filteredPageRows
      .filter(row =>
        !row.pagePath.includes("assets/") &&
        row.pagePath !== "/sitemap.xml"
      )
      .map(row => ({
        path: normalizeContentPath(row.pagePath),
        label: contentLabel(row.pagePath),
        users: Number(row.users || 0),
        sessions: Number(row.sessions || 0),
        pageViews: Number(row.pageViews || 0),
        engagementRate: Number(row.engagementRate || 0)
      }));

    const gscMap = new Map();
    seoPageRows.forEach(row => {
      const path = normalizeContentPath(row.page);
      gscMap.set(path, {
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        ctr: Number(row.ctr || 0),
        position: Number(row.position || 0)
      });
    });

    return gaRows
      .map(row => ({
        ...row,
        ...(gscMap.get(row.path) || {
          impressions: 0,
          clicks: 0,
          ctr: 0,
          position: 0
        })
      }))
      .sort((a, b) => b.pageViews - a.pageViews);
  }, [filteredPageRows, pageRows]);

  const contentSearchRows = [...seoPageRows]
    .map(row => ({
      ...row,
      path: normalizeContentPath(row.page),
      label: contentLabel(normalizeContentPath(row.page))
    }))
    .sort((a, b) => Number(b.impressions || 0) - Number(a.impressions || 0));

  const highTrafficContent = contentRows.slice(0, 4);
  const searchVisibilityContent = contentSearchRows.slice(0, 4);
  const contentOpportunities = contentSearchRows
    .filter(row =>
      Number(row.impressions || 0) >= 10 &&
      Number(row.ctr || 0) < 0.02
    )
    .slice(0, 3);

  const funnelStages = [
    {
      key: "search",
      label: "Google Search clicks",
      value: searchData ? formatNumber(searchData.clicks) : "—",
      detail: "Measured by Search Console · last 30 days",
      status: searchData ? "live" : "loading"
    },
    {
      key: "visitors",
      label: "Website visitors",
      value: data
        ? formatNumber(isFilteredSite ? selectedPageUsers : data.users)
        : "—",
      detail: "Measured by GA4 · last 30 days",
      status: data ? "live" : "loading"
    },
    {
      key: "contact",
      label: "WhatsApp / phone / contact",
      value: "Not tracked",
      detail: "Requires GA4 events: click_whatsapp, click_phone, contact_submit",
      status: "setup"
    },
    {
      key: "consultation",
      label: "Consultations",
      value: "Not tracked",
      detail: "Requires appointment event or manual appointment input",
      status: "setup"
    },
    {
      key: "patient",
      label: "Patients",
      value: "Not tracked",
      detail: "Requires confirmed-patient input or CRM integration",
      status: "setup"
    }
  ];

  const insightItems = [
    ...(searchOpportunities || []).map(item => ({
      category: "SEO",
      title: item.title,
      text: item.text,
      action: "Review search data →",
      tone: item.tone || "amber"
    })),
    ...((contentOpportunities || []).map(row => ({
      category: "Content",
      title: `Low CTR: ${row.label}`,
      text: `${formatNumber(row.impressions)} impressions, ${formatNumber(row.clicks)} clicks and ${(Number(row.ctr || 0) * 100).toFixed(1)}% CTR.`,
      action: "Review content →",
      tone: "blue"
    }))),
    ...(trafficData?.sources || [])
      .filter(row => Number(row.sessions || 0) > 0)
      .sort((a, b) => Number(b.sessions || 0) - Number(a.sessions || 0))
      .slice(0, 1)
      .map(row => ({
        category: "Traffic",
        title: `Top acquisition channel: ${row.channel}`,
        text: `${formatNumber(row.sessions)} sessions with ${formatPercent(row.engagementRate)} engagement in the selected period.`,
        action: "View traffic →",
        tone: "green"
      })),
    ...(highTrafficContent || [])
      .filter(row => Number(row.pageViews || 0) > 0)
      .slice(0, 1)
      .map(row => ({
        category: "Content",
        title: `High-traffic page: ${row.label}`,
        text: `${formatNumber(row.pageViews)} page views from ${formatNumber(row.users)} users.`,
        action: "View content →",
        tone: "green"
      }))
  ].slice(0, 6);

  const insightSummary = {
    total: insightItems.length,
    seo: insightItems.filter(item => item.category === "SEO").length,
    content: insightItems.filter(item => item.category === "Content").length,
    traffic: insightItems.filter(item => item.category === "Traffic").length
  };

  const cards = data
    ? [
        [
          "Users",
          formatNumber(
            isFilteredSite ? selectedPageUsers : data.users
          ),
          Users
        ],
        [
          "Sessions",
          formatNumber(
            isFilteredSite ? selectedPageSessions : data.sessions
          ),
          MousePointerClick
        ],
        [
          "Page views",
          formatNumber(
            isFilteredSite ? selectedPageViews : data.pageViews
          ),
          Eye
        ],
        [
          "Engagement",
          `${(
            (isFilteredSite
              ? selectedEngagement
              : data.engagementRate) * 100
          ).toFixed(1)}%`,
          TrendingUp
        ]
      ]
    : [
        ["Users", "—", Users],
        ["Sessions", "—", MousePointerClick],
        ["Page views", "—", Eye],
        ["Engagement", "—", TrendingUp]
      ];

  const trend = trafficData?.trend || [];
  const sources = trafficData?.sources || [];
  const countries = trafficData?.countries || [];
  const devices = trafficData?.devices || [];

  const trendPoints = getTrendPoints(trend);

  const maxSourceSessions = Math.max(
    ...sources.map(item => Number(item.sessions || 0)),
    1
  );

  const maxCountryUsers = Math.max(
    ...countries.map(item => Number(item.users || 0)),
    1
  );

  const totalTrafficUsers = site === "Google Site"
    ? selectedPageUsers
    : trend.reduce((sum, item) => sum + Number(item.users || 0), 0);

  const totalTrafficSessions = site === "Google Site"
    ? selectedPageSessions
    : trend.reduce((sum, item) => sum + Number(item.sessions || 0), 0);

  const totalTrafficPageviews = site === "Google Site"
    ? selectedPageViews
    : trend.reduce((sum, item) => sum + Number(item.pageviews || 0), 0);

  const weightedEngagementDenominator = trend.reduce(
    (sum, item) => sum + Number(item.sessions || 0),
    0
  );

  const weightedEngagement = site === "Google Site"
    ? selectedEngagement
    : weightedEngagementDenominator
    ? trend.reduce(
        (sum, item) =>
          sum +
          Number(item.engagementRate || 0) *
            Number(item.sessions || 0),
        0
      ) / weightedEngagementDenominator
    : 0;

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <div className="logo">W</div>
          <div>
            <b>Performance Hub</b>
            <small>Digital command center</small>
          </div>
        </div>

        <nav>
          <a className="active" href="#overview">Overview</a>
          <a href="#action-center">What needs attention</a>
          <a href="#traffic-section">Web Analytics</a>
          <a href="#google-search">Google Search</a>
          <a href="#search-opportunities">SEO</a>
          <a href="#content-performance">Content</a>
          <a href="#conversion-funnel">Funnel</a>
          <a href="#monthly-insights">Insights</a>
        </nav>

        <div className="side-foot">
          V6 • Live GA4 + GSC
          <br />
          <span>Insights engine active</span>
        </div>
      </aside>

      <main>
        <div id="overview"></div>
        <header>
          <div>
            <p className="eyebrow">WEBSITE PERFORMANCE</p>
            <h1>Good evening, Astrit</h1>
            <p className="sub">
              Your websites, search visibility and patient journey in one
              place.
            </p>
          </div>

          <div className="controls">
            <select
              value={site}
              onChange={e => setSite(e.target.value)}
            >
              {sites.map(option => (
                <option key={option}>{option}</option>
              ))}
            </select>

            <select
              value={trafficDays}
              onChange={e =>
                setTrafficDays(Number(e.target.value))
              }
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </header>

        <div className="mobile-nav">
          <a href="#overview">Overview</a>
          <a href="#traffic-section">Web Analytics</a>
          <a href="#google-search">Search</a>
          <a href="#content-performance">Content</a>
          <a href="#conversion-funnel">Funnel</a>
          <a href="#monthly-insights">Insights</a>
        </div>

        <section className="notice">
          <Globe size={18} />

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

          <div className="notice-actions">
            <small>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Live data"}
            </small>
            <button
              className="refresh-button"
              onClick={() => {
                setRefreshing(true);
                setRefreshKey(value => value + 1);
              }}
              disabled={refreshing}
              title="Refresh live data"
            >
              <RefreshCw size={14} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </section>

        {loading && (
          <div className="loading">
            <Loader2 size={18} className="spin" />
            Loading live GA4 data…
          </div>
        )}

        {error && (
          <div className="error-box">
            Could not load live GA4 data. The dashboard is still
            online, but the API needs attention.
          </div>
        )}

        <section className="grid">
          {cards.map(([label, value, Icon]) => (
            <div className="card" key={label}>
              <div className="card-top">
                <span>{label}</span>
                <Icon size={18} />
              </div>

              <strong>{value}</strong>

              <small className="positive">
                {loading
                  ? "Loading…"
                  : error
                  ? "Unavailable"
                  : isFilteredSite
                  ? "Selected site · page-level data · last 30 days"
                  : "Selected site · last 30 days"}
              </small>
            </div>
          ))}
        </section>

        {/* ACTION CENTER */}
        <section className="panel" id="action-center" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <div>
              <h2><Lightbulb size={18} /> What needs attention?</h2>
              <p>Prioritized actions from your live GA4 and Search Console data</p>
            </div>
            <span style={{ fontSize: 10, color: "#7b8798" }}>{insightSummary.total} signal{insightSummary.total === 1 ? "" : "s"}</span>
          </div>
          {insightItems.length ? (
            <div className="search-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {insightItems.slice(0, 3).map((item, i) => (
                <div className={`insight ${item.tone}`} key={`action-${i}`} style={{ margin: 0 }}>
                  <small style={{ display: "block", marginBottom: 4, opacity: 0.7 }}>{item.category}</small>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                  <button>{item.action}</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <b>No urgent signals right now</b>
              <span>Performance Hub will surface SEO, content and traffic opportunities as new data arrives.</span>
            </div>
          )}
        </section>

        {/* EXECUTIVE OVERVIEW */}
        <section className="panel" id="executive-overview" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <div>
              <h2>
                <TrendingUp size={18} /> Executive overview
              </h2>
              <p>Search visibility + website behavior for the selected site</p>
            </div>
            <span style={{ fontSize: 10, color: "#7b8798" }}>GA4 · Search Console</span>
          </div>

          <div className="two" style={{ marginBottom: 0 }}>
            <div className="search-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="search-item">
                <span>Google Search</span>
                <b>{searchData ? formatNumber(searchData.clicks) : "—"}</b>
                <small>
                  {searchData
                    ? `${formatNumber(searchData.impressions)} impressions · ${formatPercent(searchData.ctr)} CTR`
                    : "Waiting for Search Console"}
                </small>
              </div>

              <div className="search-item">
                <span>GA4</span>
                <b>{data ? formatNumber(isFilteredSite ? selectedPageUsers : data.users) : "—"}</b>
                <small>
                  {data
                    ? `${formatNumber(isFilteredSite ? selectedPageViews : data.pageViews)} page views · ${formatPercent(isFilteredSite ? selectedEngagement : data.engagementRate)} engagement`
                    : "Waiting for Google Analytics"}
                </small>
              </div>
            </div>

            <div className="notice" style={{ margin: 0, alignItems: "flex-start" }}>
              <Lightbulb size={16} />
              <div>
                <b>How to read this</b>
                <span>
                  Search Console measures Google visibility and clicks, while GA4 measures website behavior. They answer different questions, so the numbers are intentionally not expected to match.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* V2 TRAFFIC */}
        <section className="panel" id="traffic-section" style={{ marginTop: 24 }}>
          <div className="panel-head">
            <div>
              <h2>
                <BarChart3 size={19} /> Traffic
              </h2>
              <p>
                Live GA4 traffic for{" "}
                <b>{site}</b> · last {trafficDays} days
              </p>
            </div>

            <TrendingUp size={20} />
          </div>

          {site === "Google Site" && (
            <div className="notice" style={{ marginTop: 12 }}>
              <Globe size={16} />
              <div>
                <b>Google Site selected</b>
                <span>
                  Page-level GA4 data is included here. The current traffic endpoint does not yet isolate
                  Google Site by hostname for sources, countries and daily trend, so those breakdowns are not fabricated.
                </span>
              </div>
            </div>
          )}

          {trafficLoading && (
            <div className="loading">
              <Loader2 size={18} className="spin" />
              Loading live traffic data…
            </div>
          )}

          {trafficError && (
            <div className="error-box">
              Could not load Traffic data: {trafficError}
            </div>
          )}

          {!trafficLoading && !trafficError && trafficData && (
            <>
              <div className="search-grid" style={{ marginTop: 18 }}>
                {[
                  ["Users", formatNumber(totalTrafficUsers)],
                  ["Sessions", formatNumber(totalTrafficSessions)],
                  ["Page views", formatNumber(totalTrafficPageviews)],
                  ["Engagement", formatPercent(weightedEngagement)]
                ].map(([label, value]) => (
                  <div className="search-item" key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                    <small>
                      Last {trafficDays} days · live GA4
                    </small>
                  </div>
                ))}
              </div>

              <div
                className="chart"
                style={{
                  marginTop: 18,
                  padding: "18px 18px 12px",
                  minHeight: 290,
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10
                  }}
                >
                  <div>
                    <b>Users over time</b>
                    <span
                      style={{
                        display: "block",
                        marginTop: 4,
                        opacity: 0.7,
                        fontSize: 13
                      }}
                    >
                      Daily active users reported by GA4
                    </span>
                  </div>

                  {trend.length > 0 && (
                    <strong>
                      Peak:{" "}
                      {formatNumber(
                        Math.max(
                          ...trend.map(item =>
                            Number(item.users || 0)
                          )
                        )
                      )}
                    </strong>
                  )}
                </div>

                {trend.length ? (
                  <>
                    <svg
                      viewBox="0 0 900 240"
                      width="100%"
                      height="220"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Users over time"
                    >
                      <line
                        x1="0"
                        y1="220"
                        x2="900"
                        y2="220"
                        stroke="currentColor"
                        opacity="0.12"
                      />

                      <line
                        x1="0"
                        y1="120"
                        x2="900"
                        y2="120"
                        stroke="currentColor"
                        opacity="0.08"
                      />

                      <line
                        x1="0"
                        y1="20"
                        x2="900"
                        y2="20"
                        stroke="currentColor"
                        opacity="0.08"
                      />

                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={trendPoints}
                      />
                    </svg>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        opacity: 0.65,
                        marginTop: -4
                      }}
                    >
                      <span>
                        {formatTrafficDate(trend[0]?.date)}
                      </span>

                      <span>
                        {formatTrafficDate(
                          trend[trend.length - 1]?.date
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <b>No traffic trend data</b>
                    <span>
                      GA4 has not returned daily traffic for this
                      period.
                    </span>
                  </div>
                )}
              </div>

              <div className="two" style={{ marginTop: 18 }}>
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Traffic sources</h2>
                      <p>Where sessions came from</p>
                    </div>
                    <ArrowUpRight size={20} />
                  </div>

                  <div className="data-table">
                    {sources.length ? (
                      sources.map((row, i) => (
                        <div className="data-row" key={i}>
                          <div style={{ flex: 1 }}>
                            <b>{row.channel}</b>

                            <small>
                              {formatNumber(row.users)} users ·{" "}
                              {formatNumber(row.sessions)} sessions ·{" "}
                              {formatNumber(row.pageviews)} views
                            </small>

                            <div
                              style={{
                                height: 5,
                                borderRadius: 99,
                                background: "rgba(100,116,139,.12)",
                                marginTop: 8,
                                overflow: "hidden"
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${
                                    (Number(row.sessions || 0) /
                                      maxSourceSessions) *
                                    100
                                  }%`,
                                  borderRadius: 99,
                                  background: "currentColor",
                                  opacity: 0.55
                                }}
                              />
                            </div>
                          </div>

                          <strong>
                            {formatPercent(row.engagementRate)}
                          </strong>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <b>No source data</b>
                        <span>
                          GA4 has not returned traffic-source data
                          for this period.
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Countries</h2>
                      <p>Visitors by country</p>
                    </div>
                    <Globe size={20} />
                  </div>

                  <div className="data-table">
                    {countries.length ? (
                      countries.slice(0, 8).map((row, i) => (
                        <div className="data-row" key={i}>
                          <div style={{ flex: 1 }}>
                            <b>{row.country}</b>

                            <small>
                              {formatNumber(row.sessions)} sessions ·{" "}
                              {formatNumber(row.pageviews)} views
                            </small>

                            <div
                              style={{
                                height: 5,
                                borderRadius: 99,
                                background: "rgba(100,116,139,.12)",
                                marginTop: 8,
                                overflow: "hidden"
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${
                                    (Number(row.users || 0) /
                                      maxCountryUsers) *
                                    100
                                  }%`,
                                  borderRadius: 99,
                                  background: "currentColor",
                                  opacity: 0.55
                                }}
                              />
                            </div>
                          </div>

                          <strong>
                            {formatNumber(row.users)}
                          </strong>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <b>No country data</b>
                        <span>
                          GA4 has not returned country data for
                          this period.
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <section className="panel" style={{ marginTop: 18 }}>
                <div className="panel-head">
                  <div>
                    <h2>Devices</h2>
                    <p>How visitors access the website</p>
                  </div>
                  <Monitor size={20} />
                </div>

                <div className="search-grid">
                  {devices.map((row, i) => {
                    const Icon =
                      row.device === "mobile"
                        ? Smartphone
                        : Monitor;

                    return (
                      <div
                        className="search-item"
                        key={i}
                      >
                        <span>
                          <Icon
                            size={15}
                            style={{
                              verticalAlign: "middle",
                              marginRight: 5
                            }}
                          />
                          {row.device}
                        </span>

                        <b>{formatNumber(row.users)}</b>

                        <small>
                          {formatNumber(row.sessions)} sessions ·{" "}
                          {formatNumber(row.pageviews)} views
                        </small>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </section>

        <div className="two">
          <section className="panel" id="google-search">
          <div className="panel-head">
            <div>
              <h2>Google Search</h2>
              <p>
                {site === "drastritmucaj.com"
                  ? searchError
                    ? `Search Console error: ${searchError}`
                    : "Live Google Search Console data · sc-domain:drastritmucaj.com"
                  : "Not connected for this website"}
              </p>
              {site !== "drastritmucaj.com" && (
                <span className="search-console-note">
                  Search Console is currently connected only to drastritmucaj.com.
                </span>
              )}
            </div>
            <Search size={20} />
          </div>

          {site === "drastritmucaj.com" ? (
          <>
            <div className="search-grid">
              {[
                [
                  "Google clicks",
                  searchData
                    ? formatNumber(searchData.clicks)
                    : "—"
                ],
                [
                  "Impressions",
                  searchData
                    ? formatNumber(searchData.impressions)
                    : "—"
                ],
                [
                  "CTR",
                  searchData
                    ? `${(searchData.ctr * 100).toFixed(1)}%`
                    : "—"
                ],
                [
                  "Avg. position",
                  searchData
                    ? searchData.position.toFixed(1)
                    : "—"
                ]
              ].map(([label, value]) => (
                <div className="search-item" key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                  <small>
                    {searchData
                      ? "Last 30 days · live"
                      : searchError
                      ? "Unavailable"
                      : "Loading…"}
                  </small>
                </div>
              ))}
            </div>

            <div className="chart empty-chart">
              <b>
                {searchData
                  ? "Search Console connected"
                  : searchError
                  ? "Search Console needs attention"
                  : "Loading Search Console data…"}
              </b>

              <span>
                {searchData
                  ? "Clicks, impressions, CTR and average position · last 30 days."
                  : "Connecting to live Search Console data."}
              </span>
            </div>
          </>
          ) : (
            <div className="empty-state">
              <b>Search Console not connected</b>
              <span>
                Connect this site to Google Search Console to see clicks, impressions,
                CTR, queries and landing pages here.
              </span>
            </div>
          )}
        </section>

          <section className="panel" id="conversion-funnel">
            <div className="panel-head">
              <div>
                <h2>Conversion funnel</h2>
                <p>Measured signals from discovery to consultation</p>
              </div>
              <TrendingUp size={20} />
            </div>

            <div className="funnel">
              {funnelStages.map((stage, i) => (
                <div key={stage.key}>
                  <span>
                    {i === 0 && <Search size={14} />}
                    {i === 1 && <Eye size={14} />}
                    {i === 2 && <MessageCircle size={14} />}
                    {i === 3 && <CalendarCheck size={14} />}
                    {i === 4 && <Users size={14} />}
                    {stage.label}
                  </span>
                  <b>{stage.value}</b>
                  <small style={{ display: "block", marginTop: 4, opacity: 0.7 }}>
                    {stage.detail}
                  </small>
                </div>
              ))}
            </div>

            <div className="chart empty-chart" style={{ marginTop: 14 }}>
              <b>Tracking status</b>
              <span>
                V5 separates live measurements from signals that still need event tracking.
                No contact, consultation or patient numbers are being invented.
              </span>
            </div>
          </section>
        </div>

        <div className="two">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Top Google queries</h2>
                <p>
                  What people searched before finding your site
                </p>
              </div>
              <Search size={20} />
            </div>

            <div className="data-table">
              {queryRows.length ? (
                queryRows.slice(0, 8).map((row, i) => (
                  <div className="data-row" key={i}>
                    <div style={{ flex: 1 }}>
                      <b>{row.query}</b>
                      <small>
                        {formatNumber(row.impressions)} impressions ·{" "}
                        {formatNumber(row.clicks)} clicks
                      </small>
                    </div>
                    <strong>{(Number(row.ctr || 0) * 100).toFixed(1)}%</strong>
                    <strong>{Number(row.position || 0).toFixed(1)}</strong>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <b>Top queries ready next</b>
                  <span>
                    Search Console will show the queries bringing
                    people to your site.
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Top landing pages</h2>
                <p>Pages receiving Google Search traffic</p>
              </div>
              <ArrowUpRight size={20} />
            </div>

            <div className="data-table">
              {pageRows.length ? (
                pageRows.slice(0, 8).map((row, i) => (
                  <div className="data-row" key={i}>
                    <div style={{ flex: 1 }}>
                      <b>{shortPageUrl(row.page)}</b>
                      <small>
                        {formatNumber(row.impressions)} impressions ·{" "}
                        {formatNumber(row.clicks)} clicks
                      </small>
                    </div>
                    <strong>{(Number(row.ctr || 0) * 100).toFixed(1)}%</strong>
                    <strong>{Number(row.position || 0).toFixed(1)}</strong>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <b>Top pages ready next</b>
                  <span>
                    Search Console will show which pages Google is
                    sending visitors to.
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="two">
          <section className="panel" id="search-opportunities">
            <div className="panel-head">
              <div>
                <h2>
                  <Lightbulb size={18} /> Search opportunities
                </h2>
                <p>Search visibility → practical action</p>
              </div>
            </div>

            {searchOpportunities.length ? (
              searchOpportunities.map((item, i) => (
                <div
                  className={`insight ${item.tone}`}
                  key={i}
                >
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                  <button>Review →</button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <b>No search opportunity flags yet</b>
                <span>
                  As Search Console accumulates more data, Performance
                  Hub will surface queries and pages worth reviewing.
                </span>
              </div>
            )}
          </section>

          <section className="panel" id="monthly-insights">
            <div className="panel-head">
              <div>
                <h2>
                  <Lightbulb size={18} /> Detailed insights
                </h2>
                <p>Data → interpretation → action</p>
              </div>
              <Lightbulb size={20} />
            </div>

            <div className="search-grid">
              <div className="search-item">
                <span>Insights</span>
                <b>{insightSummary.total}</b>
                <small>Generated from current live data</small>
              </div>
              <div className="search-item">
                <span>SEO</span>
                <b>{insightSummary.seo}</b>
                <small>Search Console signals</small>
              </div>
              <div className="search-item">
                <span>Content</span>
                <b>{insightSummary.content}</b>
                <small>Page performance signals</small>
              </div>
              <div className="search-item">
                <span>Traffic</span>
                <b>{insightSummary.traffic}</b>
                <small>GA4 traffic signals</small>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              {insightItems.length ? (
                insightItems.map((item, i) => (
                  <div className={`insight ${item.tone}`} key={i}>
                    <small style={{ display: "block", marginBottom: 4, opacity: 0.7 }}>
                      {item.category}
                    </small>
                    <b>{item.title}</b>
                    <span>{item.text}</span>
                    <button>{item.action}</button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <b>No actionable signals yet</b>
                  <span>
                    As GA4 and Search Console collect more data, Performance Hub
                    will surface concrete items to review.
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* V5 FUNNEL TRACKING */}
        <section className="panel" id="funnel-tracking" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <div>
              <h2>
                <MessageCircle size={18} /> Funnel tracking setup
              </h2>
              <p>Events Performance Hub will use to measure contact intent</p>
            </div>
            <CalendarCheck size={20} />
          </div>

          <div className="search-grid">
            {[
              ["click_whatsapp", "WhatsApp click", "Ready to connect"],
              ["click_phone", "Phone click", "Ready to connect"],
              ["contact_submit", "Contact / appointment form", "Ready to connect"],
              ["consultation_confirmed", "Consultation confirmed", "Manual or CRM signal"],
              ["patient_confirmed", "Patient confirmed", "Manual or CRM signal"]
            ].map(([event, label, status]) => (
              <div className="search-item" key={event}>
                <span>{label}</span>
                <b>{event}</b>
                <small>{status}</small>
              </div>
            ))}
          </div>

          <div className="notice" style={{ marginTop: 14 }}>
            <Lightbulb size={16} />
            <div>
              <b>Next technical step</b>
              <span>
                Add these GA4 events to the actual clinic websites, then expose their
                counts through the Performance Hub API. Until that is connected, the
                funnel intentionally shows “Not tracked” instead of fabricated numbers.
              </span>
            </div>
          </div>
        </section>

        {/* V4 CONTENT PERFORMANCE */}
        <section className="panel" id="content-performance" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <div>
              <h2>
                <BarChart3 size={18} /> Content performance
              </h2>
              <p>
                Which pages attract visitors, engage them and appear in Google Search
              </p>
            </div>
            <ArrowUpRight size={20} />
          </div>

          {site === "mushkeriteeshendetshme.lovable.app" && (
            <div className="notice" style={{ marginTop: 12 }}>
              <Search size={16} />
              <div>
                <b>Google Search data</b>
                <span>
                  Search Console is currently connected to drastritmucaj.com only.
                  Traffic and engagement below are still live for the selected site.
                </span>
              </div>
            </div>
          )}

          <div className="two" style={{ marginTop: 18 }}>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>High-traffic content</h2>
                  <p>Pages with the most GA4 page views</p>
                </div>
                <Eye size={19} />
              </div>

              <div className="data-table">
                {highTrafficContent.length ? (
                  highTrafficContent.map((row, i) => (
                    <div className="data-row" key={row.path + i}>
                      <div style={{ flex: 1 }}>
                        <b>{row.label}</b>
                        <small>
                          {formatNumber(row.users)} users · {formatNumber(row.pageViews)} views
                        </small>
                      </div>
                      <strong>{(row.engagementRate * 100).toFixed(0)}%</strong>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <b>No content data yet</b>
                    <span>GA4 page-level data will appear here.</span>
                  </div>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Search visibility</h2>
                  <p>Pages receiving impressions from Google</p>
                </div>
                <Search size={19} />
              </div>

              <div className="data-table">
                {searchVisibilityContent.length ? (
                  searchVisibilityContent.map((row, i) => (
                    <div className="data-row" key={row.path + i}>
                      <div style={{ flex: 1 }}>
                        <b>{row.label}</b>
                        <small>
                          {formatNumber(row.impressions)} impressions · {formatNumber(row.clicks)} clicks
                        </small>
                      </div>
                      <strong>{(Number(row.ctr || 0) * 100).toFixed(1)}%</strong>
                      <strong>{Number(row.position || 0).toFixed(1)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <b>No Search Console page data</b>
                    <span>Search visibility will appear when GSC data is available.</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="panel" style={{ marginTop: 18 }}>
            <div className="panel-head">
              <div>
                <h2>Content → Search opportunities</h2>
                <p>Pages where search visibility and click-through can be improved</p>
              </div>
              <Lightbulb size={19} />
            </div>

            {contentOpportunities.length ? (
              <div className="data-table">
                {contentOpportunities.map((row, i) => (
                  <div className="data-row" key={row.path + i}>
                    <div style={{ flex: 1 }}>
                      <b>{row.label}</b>
                      <small>
                        {formatNumber(row.impressions)} impressions · {formatNumber(row.clicks)} clicks · avg. position {Number(row.position || 0).toFixed(1)}
                      </small>
                    </div>
                    <strong>{(Number(row.ctr || 0) * 100).toFixed(1)}% CTR</strong>
                    <button>Review →</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <b>No content opportunity flags yet</b>
                <span>
                  Performance Hub will surface pages with meaningful search visibility and low click-through.
                </span>
              </div>
            )}
          </section>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Page performance</h2>
              <p>
                {`Top pages for ${site}`}
              </p>
            </div>
            <ArrowUpRight size={20} />
          </div>

          <div className="data-table">
            {topPageRows.length ? (
              topPageRows.map((row, i) => (
                <div
                  className="data-row"
                  key={`${row.hostname}-${row.pagePath}`}
                >
                  <div>
                    <b>{displayPage(row)}</b>
                    <small>
                      {displayHost(row.hostname)} ·{" "}
                      {formatNumber(row.users)} users ·{" "}
                      {formatNumber(row.sessions)} sessions
                    </small>
                  </div>

                  <strong>
                    {formatNumber(row.pageViews)} views
                  </strong>

                  <strong>
                    {(row.engagementRate * 100).toFixed(0)}%
                  </strong>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <b>Page data is loading</b>
                <span>
                  GA4 page-level data will appear here when available.
                </span>
              </div>
            )}
          </div>
        </section>

        <footer>
          Website Performance Hub <span>•</span> V7.1 · Live GA4 +
          Search Console · Insights engine active
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
