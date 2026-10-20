import { useCallback, useEffect, useRef, useState } from "react";

const API = "/api/";
const TOKEN_KEY = "focus.tokens";

function getTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
  } catch {
    return null;
  }
}

function setTokens(tokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

function errorMessage(data, fallback) {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const first = Object.values(data).flat(Infinity).find((item) => typeof item === "string");
    if (first) return first;
  }
  return fallback;
}

async function apiRequest(path, options = {}, retry = true) {
  const tokens = getTokens();
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (tokens?.access) headers.set("Authorization", `Bearer ${tokens.access}`);

  const response = await fetch(`${API}${path}`, { ...options, headers });
  if (response.status === 401 && retry && tokens?.refresh && path !== "auth/token/refresh/") {
    const refreshResponse = await fetch(`${API}auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    if (refreshResponse.ok) {
      const refreshed = await refreshResponse.json();
      setTokens({ ...tokens, ...refreshed });
      return apiRequest(path, options, false);
    }
    clearTokens();
    window.dispatchEvent(new Event("focus:signout"));
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    throw new Error(errorMessage(data, `Request failed (${response.status}).`));
  }
  if (response.status === 204) return null;
  return response.json();
}

function Icon({ name, size = 20 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bookmark: <><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4z" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    play: <><path d="m9 6 10 6-10 6z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        await apiRequest("auth/register/", {
          method: "POST",
          body: JSON.stringify(form),
        }, false);
      }
      const tokens = await apiRequest("auth/login/", {
        method: "POST",
        body: JSON.stringify({ username: form.username, password: form.password }),
      }, false);
      setTokens(tokens);
      await onLogin();
    } catch (requestError) {
      clearTokens();
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <a className="brand brand-light" href="/" aria-label="Focus home">
          <span className="brand-mark"><Icon name="sparkle" size={18} /></span>
          <span>focus<span className="brand-period">.</span></span>
        </a>
        <div className="story-copy">
          <p className="eyebrow light-eyebrow">A better way to watch</p>
          <h1>Make room for<br /><span>what matters.</span></h1>
          <p className="story-subtitle">A quieter corner of YouTube. Find the good stuff, save what inspires you, and pick up right where you left off.</p>
          <div className="story-note"><span className="note-line" /> Less scrolling. More finding.</div>
        </div>
        <div className="story-footer"><span>YOUR NEXT GOOD FIND IS CLOSER</span><span>01 — 03</span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top"><span>YOUR PERSONAL VIDEO SPACE</span><span className="status-dot" /> PRIVATE BY DESIGN</div>
        <div className="auth-card">
          <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</p>
          <h2>{mode === "login" ? "Find your focus." : "Create your space."}</h2>
          <p className="auth-description">{mode === "login" ? "Sign in to pick up where you left off." : "One account to keep your best finds close."}</p>
          {error && <div className="alert" role="alert">{error}</div>}
          <form onSubmit={submit} className="auth-form">
            <label>
              <span>Username</span>
              <input autoComplete="username" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="Your username" />
            </label>
            {mode === "register" && <label>
              <span>Email <small>OPTIONAL</small></span>
              <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
            </label>}
            <label>
              <span>Password</span>
              <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={mode === "login" ? "Enter your password" : "Choose a password"} />
            </label>
            <button className="button button-dark auth-submit" type="submit" disabled={busy}>
              {busy ? "One moment..." : mode === "login" ? "Sign in" : "Create account"}
              {!busy && <Icon name="arrow" size={17} />}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "New to Focus?" : "Already have an account?"}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
        <div className="auth-panel-footer"><span>FOCUS ON THE GOOD STUFF.</span><span>© 2026 FOCUS</span></div>
      </section>
    </main>
  );
}

function Header({ user, onSignOut, onNavigate }) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="Focus home" onClick={(event) => { event.preventDefault(); onNavigate("discover"); }}>
        <span className="brand-mark"><Icon name="sparkle" size={17} /></span>
        <span>focus<span className="brand-period">.</span></span>
      </a>
      <div className="topbar-center"><span className="live-indicator" /> YOUR PERSONAL VIDEO SPACE</div>
      <div className="topbar-user">
        <span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span>
        <span className="user-name">{user.username}</span>
        <button className="icon-button signout-button" aria-label="Sign out" title="Sign out" onClick={onSignOut}><Icon name="logout" size={18} /></button>
      </div>
    </header>
  );
}

function VideoCard({ video, index, onWatch }) {
  return (
    <article className="video-card" style={{ "--card-index": index }}>
      <button className="thumbnail-button" onClick={() => onWatch(video)} aria-label={`Watch ${video.title}`}>
        {video.thumbnail_url ? <img src={video.thumbnail_url} alt="" loading="lazy" /> : <div className="thumbnail-fallback"><Icon name="play" size={34} /></div>}
        <span className="play-overlay"><Icon name="play" size={20} /></span>
      </button>
      <div className="video-info">
        <div className="video-meta"><span>YOUTUBE FIND</span><span className="meta-dot" /> <span>{video.channel_title || "Video"}</span></div>
        <h3>{video.title}</h3>
        <button className="watch-link" onClick={() => onWatch(video)}>Watch video <Icon name="arrow" size={14} /></button>
      </div>
    </article>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState("discover");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const searchInput = useRef(null);

  const loadProfile = useCallback(async () => {
    const profile = await apiRequest("profile/");
    setUser(profile);
  }, []);

  const loadHistory = useCallback(async () => {
    const entries = await apiRequest("history/");
    setHistory(Array.isArray(entries) ? entries : entries.results || []);
  }, []);

  useEffect(() => {
    let active = true;
    if (!getTokens()?.access) {
      setAuthReady(true);
      return () => { active = false; };
    }
    Promise.all([loadProfile(), loadHistory()])
      .catch(() => {
        clearTokens();
        if (active) setUser(null);
      })
      .finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, [loadHistory, loadProfile]);

  useEffect(() => {
    function handleSignOut() {
      setUser(null);
      setVideos([]);
      setHistory([]);
    }
    window.addEventListener("focus:signout", handleSignOut);
    return () => window.removeEventListener("focus:signout", handleSignOut);
  }, []);

  useEffect(() => {
    function handleSearchShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  async function signIn() {
    await loadProfile();
    await loadHistory();
    setAuthReady(true);
  }

  function signOut() {
    clearTokens();
    setUser(null);
    setVideos([]);
    setHistory([]);
    setQuery("");
    setSubmittedQuery("");
    setView("discover");
  }

  async function search(event) {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setView("discover");
    setSubmittedQuery(term);
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`search/?q=${encodeURIComponent(term)}&max_results=12`);
      setVideos(Array.isArray(result) ? result : result.results || []);
    } catch (requestError) {
      setVideos([]);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function watch(video) {
    window.open(video.url || `https://www.youtube.com/watch?v=${video.youtube_id}`, "_blank", "noopener,noreferrer");
    setError("");
    setNotice("");
    try {
      await apiRequest("history/", {
        method: "POST",
        body: JSON.stringify({
          youtube_id: video.youtube_id,
          title: video.title,
          channel_title: video.channel_title || "",
          thumbnail_url: video.thumbnail_url || "",
        }),
      });
      await loadHistory();
      setNotice("Saved to your watch history.");
    } catch (requestError) {
      setError(`Video opened, but it couldn't be saved: ${requestError.message}`);
    }
  }

  async function removeHistory(id) {
    try {
      await apiRequest(`history/${id}/`, { method: "DELETE" });
      setHistory((items) => items.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function clearHistory() {
    if (!history.length || !window.confirm("Clear your entire watch history?")) return;
    try {
      await apiRequest("history/clear/", { method: "DELETE" });
      setHistory([]);
      setNotice("Your watch history has been cleared.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (!authReady) {
    return <main className="loading-screen"><span className="brand-mark"><Icon name="sparkle" /></span><span>Getting your space ready...</span></main>;
  }
  if (!user) return <AuthScreen onLogin={signIn} />;

  const showingHistory = view === "history";
  const visibleVideos = showingHistory ? history : videos;

  return (
    <div className="app-shell">
      <Header user={user} onSignOut={signOut} onNavigate={setView} />
      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-section">
            <p className="sidebar-label">YOUR SPACE</p>
            <button className={`nav-item ${!showingHistory ? "active" : ""}`} onClick={() => { setView("discover"); setError(""); }}>
              <Icon name="search" size={18} /><span>Discover</span><span className="nav-shortcut">⌘ K</span>
            </button>
            <button className={`nav-item ${showingHistory ? "active" : ""}`} onClick={() => { setView("history"); setError(""); }}>
              <Icon name="clock" size={18} /><span>Watch history</span>
              {history.length > 0 && <span className="nav-count">{history.length}</span>}
            </button>
          </div>
          <div className="sidebar-bottom">
            <div className="sidebar-tip">
              <span className="tip-icon"><Icon name="sparkle" size={16} /></span>
              <p>Good videos are worth<br />finding again.</p>
              <span className="tip-caption">YOUR HISTORY STAYS WITH YOU</span>
            </div>
            <div className="sidebar-footer"><span>MADE FOR YOUR CURIOSITY</span><span>FOCUS 01</span></div>
          </div>
        </aside>

        <main className="main-content">
          {showingHistory ? (
            <>
              <section className="page-heading history-heading">
                <div><p className="eyebrow"><span className="heading-index">02</span> YOUR COLLECTION</p><h1>Watch history<span className="title-period">.</span></h1><p className="page-subtitle">The videos you wanted to come back to.</p></div>
                {history.length > 0 && <button className="text-button clear-button" onClick={clearHistory}><Icon name="trash" size={15} /> Clear history</button>}
              </section>
              {error && <div className="alert inline-alert" role="alert">{error}</div>}
              {notice && <div className="success-message">{notice}</div>}
              {history.length === 0 ? (
                <div className="empty-state"><span className="empty-icon"><Icon name="clock" size={23} /></span><h2>Your list starts here.</h2><p>When you find a video worth watching, it’ll be waiting here.</p><button className="button button-dark" onClick={() => setView("discover")}>Explore videos <Icon name="arrow" size={16} /></button></div>
              ) : (
                <section className="results-grid history-grid">
                  {history.map((video, index) => <VideoCard key={video.id} video={video} index={index} onWatch={watch} />)}
                </section>
              )}
            </>
          ) : (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <p className="eyebrow"><span className="heading-index">01</span> THE GOOD STUFF IS OUT THERE</p>
                  <h1>Find what<br /><span>moves you.</span></h1>
                  <p className="hero-description">Less scrolling. More discovering.<br />Search YouTube with a little more intention.</p>
                  <form className="search-form" onSubmit={search}>
                    <Icon name="search" size={20} />
                    <input ref={searchInput} aria-label="Search YouTube" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you curious about?" maxLength={255} />
                    <button type="submit" disabled={loading || !query.trim()}>{loading ? "Finding..." : "Find videos"} <Icon name="arrow" size={15} /></button>
                  </form>
                  <div className="search-caption"><span className="caption-line" /> SEARCH YOUTUBE, KEEP THE FINDS THAT MATTER</div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="art-sun" />
                  <div className="art-arc art-arc-one" />
                  <div className="art-arc art-arc-two" />
                  <div className="art-card art-card-back"><span className="art-card-tag">A LITTLE INSPIRATION</span><span className="art-card-scribble">↗</span></div>
                  <div className="art-card art-card-front"><span className="art-card-play"><Icon name="play" size={17} /></span><span className="art-card-label">FOLLOW<br />YOUR CURIOSITY</span></div>
                  <span className="art-stamp">FIND<br />YOUR<br />FOCUS<span>✳</span></span>
                  <span className="art-caption">A GOOD PLACE<br />TO START ↙</span>
                </div>
              </section>

              {error && <div className="alert inline-alert" role="alert">{error}</div>}
              {notice && <div className="success-message">{notice}</div>}

              {submittedQuery ? (
                <section className="results-section">
                  <div className="section-heading">
                    <div><p className="eyebrow"><span className="heading-index">RESULTS</span> FOR YOUR SEARCH</p><h2>{submittedQuery}</h2></div>
                    <span className="result-count">{loading ? "SEARCHING..." : `${videos.length} ${videos.length === 1 ? "VIDEO" : "VIDEOS"}`}</span>
                  </div>
                  {loading ? <div className="loading-results"><span className="loader" /> Finding something good...</div> :
                    videos.length ? <div className="results-grid">{videos.map((video, index) => <VideoCard key={video.youtube_id} video={video} index={index} onWatch={watch} />)}</div> :
                    <div className="empty-results"><span>No videos found this time.</span><span>Try a different search and see what turns up.</span></div>}
                </section>
              ) : (
                <section className="start-here">
                  <div className="start-marker"><span>START HERE</span><span className="marker-line" /></div>
                  <div className="start-copy"><h2>A thought, a question,<br />a thing you love.</h2><p>Type it in. See where it takes you.</p></div>
                  <div className="start-index">01 <span>/</span> 03</div>
                </section>
              )}
            </>
          )}
          <footer className="main-footer"><span>KEEP YOUR ATTENTION ON WHAT INSPIRES YOU.</span><span>FOCUS — FIND WHAT MATTERS</span></footer>
        </main>
      </div>
    </div>
  );
}

export default App;
