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
  const path = normalizeContentPath(value);
  return contentLabel(path) === "Homepage" ? "/" : path;
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

  let clean = path.replace(/^\/+|\/+$/g, "");

  try {
    clean = decodeURIComponent(clean);
  } catch {
    // Keep the original path if it is only partially encoded.
  }

  if (/[ÃÂ]/.test(clean)) {
    try {
      clean = decodeURIComponent(escape(clean));
    } catch {
      // Keep the decoded value if the byte sequence cannot be repaired.
    }
  }

  return clean
    .split("/")
    .filter(Boolean)
    .map(part => part.replace(/[-_]+/g, " "))
    .join(" / ");
}

function displayQuery(value) {
  if (!value) return "—";

  let result = String(value);

  try {
    if (/%[0-9A-Fa-f]{2}/.test(result)) {
      result = decodeURIComponent(result);
    }
  } catch {
    // Keep the original value if it is only partially encoded.
  }

  if (/[ÃÂ]/.test(result)) {
    try {
      result = decodeURIComponent(escape(result));
    } catch {
      // Keep the decoded value if the byte sequence cannot be repaired.
    }
  }

  return result;
}

function aggregateSearchPages(rows) {
  const map = new Map();

  (rows || []).forEach((row) => {
    const rawPath = normalizeContentPath(row.page);
    const path =
      rawPath === "/"
        ? "/"
        : "/" + rawPath.replace(/^\/+|\/+$/g, "");

    const impressions = Number(row.impressions || 0);
    const clicks = Number(row.clicks || 0);
    const position = Number(row.position || 0);
    const current = map.get(path) || {
      page: path,
      path,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      hostnames: []
    };

    const previousImpressions = current.impressions;
    current.clicks += clicks;
    current.impressions += impressions;
    current.ctr = current.impressions
      ? current.clicks / current.impressions
      : 0;

    if (impressions > 0) {
      current.position =
        previousImpressions > 0
          ? ((current.position * previousImpressions) +
              (position * impressions)) /
            current.impressions
          : position;
    }

    try {
      const hostname = new URL(row.page).hostname;
      if (hostname && !current.hostnames.includes(hostname)) {
        current.hostnames.push(hostname);
      }
    } catch {
      // Keep hostnames empty when Search Console returns a non-URL value.
    }

    map.set(path, current);
  });

  return Array.from(map.values()).sort(
    (a, b) => Number(b.impressions || 0) - Number(a.impressions || 0)
  );
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

function formatMonth(value) {
  if (!value || value.length !== 6) return value;
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  return new Date(year + "-" + month + "-01T12:00:00").toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );
}

function monthChange(current, previous) {
  const a = Number(current || 0);
  const b = Number(previous || 0);
  if (!b) return null;
  return ((a - b) / b) * 100;
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
  const rawSeoPageRows = site === "drastritmucaj.com" ? pageRows : [];
  const rankingOpportunities = site === "drastritmucaj.com"
    ? (searchData?.rankingOpportunities || [])
    : [];
  const decaySignals = site === "drastritmucaj.com"
    ? (searchData?.decay || [])
    : [];

  const seoPageRows = React.useMemo(
    () => aggregateSearchPages(rawSeoPageRows),
    [rawSeoPageRows]
  );

  const hasHostnameSplit =
    site === "drastritmucaj.com" &&
    rawSeoPageRows.some(row => row.page.includes("www.")) &&
    rawSeoPageRows.some(
      row =>
        row.page.includes("drastritmucaj.com") &&
        !row.page.includes("www.")
    );

  const opportunities = [
    ...(hasHostnameSplit
      ? [
          {
            title: "Technical: fix www / non-www consistency",
            text: "Search Console is reporting both www and non-www versions. Check the redirect and canonical setup before changing page titles.",
            tone: "blue"
          }
        ]
      : []),
    ...seoPageRows
      .filter(
        row =>
          Number(row.impressions || 0) >= 50 &&
          Number(row.clicks || 0) === 0
      )
      .slice(0, 2)
      .map(row => ({
        title: "Strong page opportunity",
        page: row.page,
        position: Number(row.position || 0),
        text: `${shortPageUrl(row.page)} has ${formatNumber(
          row.impressions
        )} impressions, 0 clicks and average position ${Number(
          row.position || 0
        ).toFixed(1)}.`,
        tone: "amber"
      }))
  ].slice(0, 3);

  // Summary metrics always come from the hostname-filtered traffic endpoint.
  // The unfiltered GA4 report is still used for page-level data.
  const selectedPageUsers = Number(trafficData?.siteUsers || 0);
  const selectedPageSessions = Number(trafficData?.siteSessions || 0);
  const selectedPageViews = Number(trafficData?.sitePageViews || 0);
  const selectedEngagement = Number(trafficData?.siteEngagementRate || 0);

  const searchOpportunities = [
    ...(hasHostnameSplit
      ? [{
          title: "Technical: www / non-www split",
          text: "Google is seeing both hostname variants. Verify one preferred canonical hostname and a consistent redirect before making content changes.",
          tone: "blue"
        }]
      : []),
    ...rankingOpportunities
      .filter(row => Number(row.potentialClicks || 0) >= 1)
      .slice(0, 1)
      .map(row => ({
        title: "Ranking opportunity",
        text: `“${displayQuery(row.query)}” ranks around ${Number(row.position || 0).toFixed(1)} with ${formatNumber(row.impressions)} impressions. Moving toward position ${Number(row.targetPosition || 3).toFixed(0)} is estimated to unlock ~${Number(row.potentialClicks || 0).toFixed(1)} additional clicks.`,
        tone: "amber",
        evidence: "Directional estimate based on Search Console data and an external CTR benchmark."
      })),
    ...decaySignals
      .filter(row => Number(row.clickChangePct || 0) <= -20)
      .slice(0, 1)
      .map(row => ({
        title: "Content decay detected",
        text: `${shortPageUrl(row.page)} lost ${Math.abs(Number(row.clickChangePct || 0)).toFixed(0)}% of clicks versus the previous period (${formatNumber(row.baselineClicks)} → ${formatNumber(row.recentClicks)}).`,
        tone: "amber",
        evidence: "Compared with the previous same-length Search Console period."
      })),
    ...seoQueryRows
      .filter(row =>
        Number(row.impressions || 0) >= 50 &&
        Number(row.clicks || 0) === 0
      )
      .slice(0, 1)
      .map(row => ({
        title: "Strong query opportunity",
        text: `“${displayQuery(row.query)}” has ${formatNumber(row.impressions)} impressions but no clicks. This is a meaningful enough sample to review the snippet and search intent.`,
        tone: "amber"
      })),
    ...seoQueryRows
      .filter(row =>
        Number(row.impressions || 0) >= 50 &&
        Number(row.clicks || 0) > 0 &&
        Number(row.ctr || 0) < 0.02 &&
        Number(row.position || 0) <= 10
      )
      .slice(0, 1)
      .map(row => ({
        title: "Strong query CTR opportunity",
        text: `“${displayQuery(row.query)}” generated ${formatNumber(row.impressions)} impressions and ${formatNumber(row.clicks)} clicks (CTR ${(Number(row.ctr || 0) * 100).toFixed(1)}%) at average position ${Number(row.position || 0).toFixed(1)}.`,
        tone: "blue"
      })),
    ...seoPageRows
      .filter(row =>
        Number(row.impressions || 0) >= 50 &&
        Number(row.clicks || 0) === 0 &&
        row.path !== "/"
      )
      .slice(0, 1)
      .map(row => ({
        title: "Strong page opportunity",
        page: row.page,
        position: Number(row.position || 0),
        text: `${shortPageUrl(row.page)} has ${formatNumber(row.impressions)} impressions, 0 clicks and average position ${Number(row.position || 0).toFixed(1)}.`,
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
  }, [filteredPageRows, seoPageRows]);

  const contentSearchRows = seoPageRows
    .map(row => ({
      ...row,
      path: row.path || normalizeContentPath(row.page),
      label: contentLabel(row.path || normalizeContentPath(row.page))
    }))
    .sort((a, b) => Number(b.impressions || 0) - Number(a.impressions || 0));

  const highTrafficContent = contentRows.slice(0, 4);
  const searchVisibilityContent = contentSearchRows.slice(0, 4);
  const contentOpportunities = contentSearchRows
    .filter(
      row =>
        Number(row.impressions || 0) >= 50 &&
        Number(row.ctr || 0) < 0.02
    )
    .slice(0, 3);

  const funnelStages = [
    {
      key: "search",
      label: "Google Search clicks",
      value: site === "drastritmucaj.com" && searchData ? formatNumber(searchData.clicks) : "—",
      detail: site === "drastritmucaj.com"
        ? "Measured by Search Console · last 30 days"
        : "Search Console not connected for this website",
      status: site === "drastritmucaj.com" && searchData ? "live" : "setup"
    },
    {
      key: "visitors",
      label: "Website visitors",
      value: trafficData
        ? formatNumber(selectedPageUsers)
        : "—",
      detail: "Measured by GA4 · selected site · last 30 days",
      status: trafficData ? "live" : "loading"
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
      evidence: item.text,
      recommendation:
        item.title.includes("www / non-www") || item.title.includes("hostname")
          ? "Check redirects and canonical URLs first. Only retest titles/snippets after Google consistently sees one preferred hostname."
          : item.title.includes("Strong page opportunity")
          ? Number(item.position || 0) > 10
            ? "Strengthen the page content and search targeting first; the page is around the edge of page 1, so relevance and authority matter before relying on snippet changes."
            : "Review the page title and meta description, then monitor CTR because the page already has strong search visibility."
          : item.title.includes("no clicks")
          ? "Review the search intent and snippet. Ten impressions is treated as an early signal; these recommendations now require a larger sample."
          : "Review the search snippet and test a clearer, more specific title.",
      action: "Review search data →",
      tone: item.tone || "amber"
    })),
    ...((contentOpportunities || []).map(row => ({
      category: "Content",
      title: `${Number(row.impressions || 0) >= 500 ? "High-impact CTR opportunity" : "CTR opportunity"}: ${row.label}`,
      text: `${formatNumber(row.impressions)} impressions → ${formatNumber(row.clicks)} clicks → ${(Number(row.ctr || 0) * 100).toFixed(1)}% CTR.`,
      evidence: `${formatNumber(row.impressions)} impressions, ${formatNumber(row.clicks)} clicks, average position ${Number(row.position || 0).toFixed(1)}.`,
      recommendation:
        hasHostnameSplit && row.path === "/"
          ? "Fix the www/non-www redirect and canonical setup first. The homepage already has strong search visibility, so technical consistency comes before snippet edits."
          : Number(row.position || 0) <= 10
          ? "The page already has strong search visibility. Test a clearer title/meta description and monitor CTR."
          : "Strengthen the page content and search targeting before retesting the snippet.",
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
        text: `${formatNumber(row.sessions)} sessions · ${formatPercent(row.engagementRate)} engagement.`,
        evidence: `${formatNumber(row.sessions)} sessions generated by ${row.channel} in the selected period.`,
        recommendation: "Keep investing in this acquisition source and create more content that matches what this audience is responding to.",
        action: "View traffic →",
        tone: "green"
      })),
    ...(highTrafficContent || [])
      .filter(row => Number(row.pageViews || 0) > 0)
      .slice(0, 1)
      .map(row => ({
        category: "Content",
        title: `High-traffic page: ${row.label}`,
        text: `${formatNumber(row.pageViews)} page views · ${formatNumber(row.users)} users.`,
        evidence: `${formatNumber(row.pageViews)} page views from ${formatNumber(row.users)} users in the selected period.`,
        recommendation: "Create 1–2 related pieces and add clear internal links or a consultation CTA from this page.",
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

  const events = trafficData?.events || [];
  const trackedConversionEvents = ["click_whatsapp", "click_phone", "contact_submit", "consultation_confirmed", "patient_confirmed"]
    .map(name => ({ name, count: Number(events.find(e => e.eventName === name)?.count || 0) }));
  const conversionTotal = trackedConversionEvents
    .filter(e => ["click_whatsapp", "click_phone", "contact_submit"].includes(e.name))
    .reduce((sum, e) => sum + e.count, 0);

  const monthlyRows = (trafficData?.monthly || []).slice(-7);
  const currentMonth = monthlyRows[monthlyRows.length - 1];
  const previousMonth = monthlyRows[monthlyRows.length - 2];
  const monthlyChanges = currentMonth && previousMonth ? {
    users: monthChange(currentMonth.users, previousMonth.users),
    sessions: monthChange(currentMonth.sessions, previousMonth.sessions),
    pageviews: monthChange(currentMonth.pageviews, previousMonth.pageviews),
    engagement: (Number(currentMonth.engagementRate || 0) - Number(previousMonth.engagementRate || 0)) * 100
  } : null;

  const anomalies = [
    monthlyChanges?.users != null && Math.abs(monthlyChanges.users) >= 25 ? { label: "Users changed sharply", value: monthlyChanges.users, tone: monthlyChanges.users < 0 ? "amber" : "green" } : null,
    monthlyChanges?.sessions != null && Math.abs(monthlyChanges.sessions) >= 25 ? { label: "Sessions changed sharply", value: monthlyChanges.sessions, tone: monthlyChanges.sessions < 0 ? "amber" : "green" } : null,
    monthlyChanges?.pageviews != null && Math.abs(monthlyChanges.pageviews) >= 25 ? { label: "Page views changed sharply", value: monthlyChanges.pageviews, tone: monthlyChanges.pageviews < 0 ? "amber" : "green" } : null
  ].filter(Boolean);

  const contentScores = contentRows
    .filter(row => row.pageViews > 0 || row.impressions > 0)
    .map(row => {
      const traffic = Math.min(Number(row.pageViews || 0) / Math.max(selectedPageViews, 1), 1);
      const visibility = Math.min(Number(row.impressions || 0) / 500, 1);
      const ctrGap = Number(row.impressions || 0) >= 10 ? Math.max(0, 1 - Number(row.ctr || 0) / 0.05) : 0;
      return { ...row, score: Math.round((traffic * 40) + (visibility * 30) + (ctrGap * 30)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const priorityActions = [
    ...(hasHostnameSplit
      ? [{
          priority: 1,
          title: "Fix www / non-www consistency",
          detail: "Google Search Console is reporting both hostname variants. Verify redirects and canonical URLs before treating homepage CTR as a content problem.",
          tone: "blue"
        }]
      : []),
    ...(rankingOpportunities.length && Number(rankingOpportunities[0].potentialClicks || 0) >= 1
      ? [{
          priority: hasHostnameSplit ? 2 : 1,
          title: "Capture a near-term ranking opportunity",
          detail:
            rankingOpportunities[0].query +
            " is around position " +
            Number(rankingOpportunities[0].position || 0).toFixed(1) +
            " with " +
            formatNumber(rankingOpportunities[0].impressions) +
            " impressions; estimated upside ~" +
            Number(rankingOpportunities[0].potentialClicks || 0).toFixed(1) +
            " clicks.",
          tone: "amber"
        }]
      : []),
    ...(decaySignals.length
      ? [{
          priority: hasHostnameSplit ? 3 : 2,
          title: "Investigate content decay",
          detail:
            shortPageUrl(decaySignals[0].page) +
            " is down " +
            Math.abs(Number(decaySignals[0].clickChangePct || 0)).toFixed(0) +
            "% in clicks versus the previous period.",
          tone: "amber"
        }]
      : []),
    ...(contentOpportunities.length
      ? [{
          priority: hasHostnameSplit ? 4 : 2,
          title: "Improve a high-visibility page CTR",
          detail:
            contentOpportunities[0].label +
            " has " +
            (Number(contentOpportunities[0].ctr || 0) * 100).toFixed(1) +
            "% CTR from " +
            formatNumber(contentOpportunities[0].impressions) +
            " impressions.",
          tone: "amber"
        }]
      : []),
    ...(highTrafficContent.length
      ? [{
          priority: 4,
          title: "Build around your strongest content",
          detail:
            highTrafficContent[0].label +
            " is currently your strongest traffic page. Add related content and a clear consultation CTA.",
          tone: "green"
        }]
      : []),
    ...(conversionTotal === 0
      ? [{
          priority: 4,
          title: "Connect conversion tracking",
          detail:
            "GA4 has no tracked WhatsApp, phone or contact events yet, so the Hub cannot measure which traffic becomes an enquiry.",
          tone: "blue"
        }]
      : [])
  ].sort((a,b) => a.priority - b.priority).slice(0, 4);

  const cards = trafficData
    ? [
        ["Users", formatNumber(selectedPageUsers), Users],
        ["Sessions", formatNumber(selectedPageSessions), MousePointerClick],
        ["Page views", formatNumber(selectedPageViews), Eye],
        ["Engagement", `${(selectedEngagement * 100).toFixed(1)}%`, TrendingUp]
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
  const monthly = trafficData?.monthly || [];

  const trendPoints = getTrendPoints(trend);

  const maxSourceSessions = Math.max(
    ...sources.map(item => Number(item.sessions || 0)),
    1
  );

  const maxCountryUsers = Math.max(
    ...countries.map(item => Number(item.users || 0)),
    1
  );

  const totalTrafficUsers = selectedPageUsers;
  const totalTrafficSessions = selectedPageSessions;
  const totalTrafficPageviews = selectedPageViews;

  const weightedEngagement = selectedEngagement;

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
          V7.5 • Live GA4 + GSC
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
                : "Data source: live GA4 · Property 549643321 · hostname filtered"}
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
                {trafficLoading
                  ? "Loading…"
                  : trafficError
                  ? "Unavailable"
                  : "Selected site · GA4 hostname-filtered · last 30 days"}
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
                  <small style={{ display: "block", marginBottom: 2, opacity: 0.7, gridColumn: "1 / -1" }}>{item.category}</small>
                  <b style={{ gridColumn: "1 / -1" }}>{item.title}</b>
                  <span style={{ gridColumn: "1 / -1" }}><strong>Evidence:</strong> {item.evidence}</span>
                  <span style={{ gridColumn: "1 / -1" }}><strong>Recommended action:</strong> {item.recommendation}</span>
                  <button style={{ gridColumn: "1 / -1", justifySelf: "start" }}>{item.action}</button>
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
                <b>{trafficData ? formatNumber(selectedPageUsers) : "—"}</b>
                <small>
                  {trafficData
                    ? `${formatNumber(selectedPageViews)} page views · ${formatPercent(selectedEngagement)} engagement`
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

              <section className="panel" style={{ marginTop: 18 }}>
                <div className="panel-head">
                  <div>
                    <h2>Monthly performance</h2>
                    <p>Real GA4 monthly comparison · last 6 months</p>
                  </div>
                  <BarChart3 size={20} />
                </div>

                {monthly.length ? (
                  <div className="data-table">
                    {monthly.slice(-6).map((row, i, rows) => {
                      const previous = rows[i - 1];
                      const usersChange = monthChange(row.users, previous?.users);
                      const sessionsChange = monthChange(row.sessions, previous?.sessions);
                      const viewsChange = monthChange(row.pageviews, previous?.pageviews);

                      return (
                        <div className="data-row" key={row.month}>
                          <div style={{ flex: 1 }}>
                            <b>{formatMonth(row.month)}</b>
                            <small>
                              {formatNumber(row.users)} users ·{" "}
                              {formatNumber(row.sessions)} sessions ·{" "}
                              {formatNumber(row.pageviews)} views ·{" "}
                              {formatPercent(row.engagementRate)} engagement
                            </small>
                          </div>

                          <div style={{ minWidth: 150, textAlign: "right" }}>
                            <small>Users {usersChange === null ? "—" : (usersChange >= 0 ? "+" : "") + usersChange.toFixed(0) + "%"}</small>
                            <small>Sessions {sessionsChange === null ? "—" : (sessionsChange >= 0 ? "+" : "") + sessionsChange.toFixed(0) + "%"}</small>
                            <small>Views {viewsChange === null ? "—" : (viewsChange >= 0 ? "+" : "") + viewsChange.toFixed(0) + "%"}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <b>No monthly comparison data</b>
                    <span>GA4 has not returned monthly performance data yet.</span>
                  </div>
                )}
              </section>

              <div className="two" style={{ marginTop: 18 }}>
              <section className="panel" id="v73-actions" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <div><h2>V7.5 — What should I do next?</h2><p>Prioritized actions from traffic, SEO, content and conversion signals</p></div>
            <Lightbulb size={20} />
          </div>
          {priorityActions.length ? priorityActions.map((item, i) => (
            <div className={"insight " + item.tone} key={i}>
              <small>Priority {item.priority}</small>
              <b>{item.title}</b>
              <span>{item.detail}</span>
            </div>
          )) : <div className="empty-state"><b>No priority actions yet</b><span>More data will unlock the next recommendations.</span></div>}
        </section>

        <div className="two">
          <section className="panel">
            <div className="panel-head"><div><h2>Performance anomalies</h2><p>Large month-over-month changes worth investigating</p></div><TrendingUp size={20} /></div>
            {anomalies.length ? anomalies.map((a, i) => <div className={"insight " + a.tone} key={i}><b>{a.label}</b><span>{a.value >= 0 ? "+" : ""}{a.value.toFixed(1)}% vs previous month</span></div>) : <div className="empty-state"><b>No major anomaly detected</b><span>We flag changes of roughly ±25% or more.</span></div>}
          </section>
          <section className="panel">
            <div className="panel-head"><div><h2>Conversion signals</h2><p>Real GA4 events — no invented numbers</p></div><MessageCircle size={20} /></div>
            <div className="search-grid">{trackedConversionEvents.slice(0,3).map(e => <div className="search-item" key={e.name}><span>{e.name}</span><b>{e.count ? formatNumber(e.count) : "Not tracked"}</b><small>{e.count ? "GA4 event count" : "Add this event to GA4"}</small></div>)}</div>
          </section>
        </div>

        <section className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head"><div><h2>Content Opportunity Score</h2><p>Pages with the strongest combination of traffic, visibility and CTR upside</p></div><BarChart3 size={20} /></div>
          <div className="data-table">{contentScores.length ? contentScores.map((row, i) => <div className="data-row" key={row.path + i}><div style={{flex:1}}><b>{row.label}</b><small>{formatNumber(row.pageViews)} views · {formatNumber(row.impressions)} impressions · {(Number(row.ctr || 0) * 100).toFixed(1)}% CTR</small></div><strong>{row.score}/100</strong></div>) : <div className="empty-state"><b>No scored content yet</b><span>Traffic or Search Console data is needed to calculate opportunity.</span></div>}</div>
        </section>

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
                seoQueryRows.slice(0, 8).map((row, i) => (
                  <div className="data-row" key={i}>
                    <div style={{ flex: 1 }}>
                      <b>{displayQuery(row.query)}</b>
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
                seoPageRows.slice(0, 8).map((row, i) => (
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
          Website Performance Hub <span>•</span> V7.5 · Live GA4 +
          Search Console · Insights engine active
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
