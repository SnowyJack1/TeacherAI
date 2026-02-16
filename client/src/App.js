import React, { useState, useEffect } from "react";
import axios from "axios";

var teacherTypes = [
  { value: "strict", label: "Strict Teacher", emoji: "\u{1F6D1}", desc: "Harsh, expects perfection" },
  { value: "lazy", label: "Lazy Teacher", emoji: "\u{1F634}", desc: "Barely reads your work" },
  { value: "college_professor", label: "College Professor", emoji: "\u{1F393}", desc: "Academic rigor" },
  { value: "chill", label: "Chill Teacher", emoji: "\u270C\uFE0F", desc: "Supportive & encouraging" },
  { value: "sarcastic", label: "Sarcastic Teacher", emoji: "\u{1F3AD}", desc: "Funny roast-style feedback" },
  { value: "ap_grader", label: "AP Exam Grader", emoji: "\u{1F4CB}", desc: "Rubric-based scoring" },
  { value: "english_teacher", label: "English Teacher", emoji: "\u{1F4DA}", desc: "Focuses on writing craft" }
];

function getGradeColor(grade) {
  if (!grade) return "#888";
  var letter = grade.charAt(0).toUpperCase();
  if (letter === "A") return "#10b981";
  if (letter === "B") return "#3b82f6";
  if (letter === "C") return "#f59e0b";
  if (letter === "D") return "#f97316";
  return "#ef4444";
}

function App() {
  var _s1 = useState(""); var assignment = _s1[0]; var setAssignment = _s1[1];
  var _s2 = useState("strict"); var teacherType = _s2[0]; var setTeacherType = _s2[1];
  var _s3 = useState(null); var result = _s3[0]; var setResult = _s3[1];
  var _s4 = useState(false); var loading = _s4[0]; var setLoading = _s4[1];
  var _s5 = useState(""); var error = _s5[0]; var setError = _s5[1];
  var _s6 = useState(0); var charCount = _s6[0]; var setCharCount = _s6[1];
  var _s7 = useState(false); var showResult = _s7[0]; var setShowResult = _s7[1];
  var _s8 = useState("input"); var activeTab = _s8[0]; var setActiveTab = _s8[1];

  // Auth state
  var _s9 = useState(function() { try { return sessionStorage.getItem("pg_token"); } catch(e) { return null; } }); var token = _s9[0]; var setToken = _s9[1];
  var _s10 = useState(function() { try { return sessionStorage.getItem("pg_user") || ""; } catch(e) { return ""; } }); var username = _s10[0]; var setUsername = _s10[1];
  var _s11 = useState("login"); var authMode = _s11[0]; var setAuthMode = _s11[1];
  var _s12 = useState(""); var authUser = _s12[0]; var setAuthUser = _s12[1];
  var _s13 = useState(""); var authPass = _s13[0]; var setAuthPass = _s13[1];
  var _s14 = useState(""); var authError = _s14[0]; var setAuthError = _s14[1];
  var _s15 = useState(false); var authLoading = _s15[0]; var setAuthLoading = _s15[1];
  var _s16 = useState(3); var remaining = _s16[0]; var setRemaining = _s16[1];

  useEffect(function() { setCharCount(assignment.length); }, [assignment]);

  useEffect(function() {
    if (result) { setTimeout(function() { setShowResult(true); }, 100); }
    else { setShowResult(false); }
  }, [result]);

  // Check for saved token on load
  useEffect(function() {
    var saved = window.sessionStorage ? null : null;
    // We use state only, no persistent storage
  }, []);

  // Fetch remaining requests when logged in
  useEffect(function() {
    if (token) { fetchRemaining(); }
  }, [token]);

  var fetchRemaining = async function() {
    try {
      var res = await axios.get("/api/remaining", {
        headers: { Authorization: "Bearer " + token }
      });
      setRemaining(res.data.remaining);
    } catch (err) {
      // ignore
    }
  };

  var handleAuth = async function() {
    if (!authUser.trim() || !authPass.trim()) {
      setAuthError("Enter a username and password.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      var endpoint = authMode === "login" ? "/api/login" : "/api/signup";
      var res = await axios.post(endpoint, {
        username: authUser,
        password: authPass
      });
      setToken(res.data.token);
      setUsername(res.data.username);
    } catch (err) {
      var msg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : "Something went wrong. Try again.";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  var handleLogout = function() {
    setToken(null);
    setUsername("");
    setAuthUser("");
    setAuthPass("");
    setResult(null);
    setActiveTab("input");
  };

  var handleSubmit = async function() {
    if (!assignment.trim()) {
      setError("Paste your assignment first!");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setShowResult(false);
    try {
      var response = await axios.post("/api/grade", {
        assignment: assignment,
        teacherType: teacherType
      }, {
        headers: { Authorization: "Bearer " + token }
      });
      setResult(response.data.result);
      if (response.data.remaining !== undefined) {
        setRemaining(response.data.remaining);
      }
      setActiveTab("results");
    } catch (err) {
      var msg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : "Something went wrong. Make sure your backend is running.";
      setError(msg);
      if (err.response && err.response.data && err.response.data.remaining !== undefined) {
        setRemaining(err.response.data.remaining);
      }
    } finally {
      setLoading(false);
    }
  };

  var handleReset = function() {
    setResult(null);
    setShowResult(false);
    setActiveTab("input");
    setAssignment("");
    setError("");
    fetchRemaining();
  };

  var selectedTeacher = teacherTypes.find(function(t) { return t.value === teacherType; });

  // AUTH SCREEN
  if (!token) {
    return (
      <div>
        <style dangerouslySetInnerHTML={{ __html: cssText }} />
        <div className="pg-bg">
          <div className="pg-grain"></div>
          <div className="pg-orb pg-orb-1"></div>
          <div className="pg-orb pg-orb-2"></div>
          <div className="pg-orb pg-orb-3"></div>
        </div>
        <div className="pg-app">
          <nav className="pg-nav">
            <div className="pg-nav-inner">
              <div className="pg-logo">
                <div className="pg-logo-mark">P</div>
                <span className="pg-logo-text">PreGrade</span>
              </div>
              <div className="pg-nav-links">
                <span className="pg-nav-pill">AI-Powered</span>
              </div>
            </div>
          </nav>

          <header className="pg-hero">
            <div className="pg-hero-badge">STUDENT TOOL</div>
            <h1 className="pg-hero-title">
              Get your work graded<br />
              <span className="pg-hero-accent">before you turn it in.</span>
            </h1>
            <p className="pg-hero-sub">
              Create an account or log in to start grading your assignments with AI.
            </p>
          </header>

          <div className="pg-auth-card pg-fade-in">
            <div className="pg-auth-tabs">
              <button
                className={"pg-auth-tab" + (authMode === "login" ? " pg-auth-tab-active" : "")}
                onClick={function() { setAuthMode("login"); setAuthError(""); }}
              >Log In</button>
              <button
                className={"pg-auth-tab" + (authMode === "signup" ? " pg-auth-tab-active" : "")}
                onClick={function() { setAuthMode("signup"); setAuthError(""); }}
              >Sign Up</button>
            </div>

            <div className="pg-auth-form">
              <label className="pg-field-label">Username</label>
              <input
                className="pg-input"
                type="text"
                placeholder="Enter username"
                value={authUser}
                onChange={function(e) { setAuthUser(e.target.value); }}
                onKeyDown={function(e) { if (e.key === "Enter") handleAuth(); }}
              />

              <label className="pg-field-label" style={{ marginTop: "16px" }}>Password</label>
              <input
                className="pg-input"
                type="password"
                placeholder={authMode === "signup" ? "Min 6 characters" : "Enter password"}
                value={authPass}
                onChange={function(e) { setAuthPass(e.target.value); }}
                onKeyDown={function(e) { if (e.key === "Enter") handleAuth(); }}
              />

              {authError && <div className="pg-error" style={{ marginTop: "16px" }}>{authError}</div>}

              <button
                className="pg-submit-btn"
                style={{ marginTop: "24px", opacity: authLoading ? 0.7 : 1 }}
                onClick={handleAuth}
                disabled={authLoading}
              >
                {authLoading ? (
                  <span className="pg-loading-content">
                    <span className="pg-spinner"></span>
                    <span>{authMode === "login" ? "Logging in..." : "Creating account..."}</span>
                  </span>
                ) : (
                  <span>{authMode === "login" ? "Log In" : "Create Account"}</span>
                )}
              </button>
            </div>
          </div>

          <footer className="pg-footer">
            <span>PreGrade &mdash; AI grading assistant for students</span>
          </footer>
        </div>
      </div>
    );
  }

  // MAIN APP (logged in)
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: cssText }} />
      <div className="pg-bg">
        <div className="pg-grain"></div>
        <div className="pg-orb pg-orb-1"></div>
        <div className="pg-orb pg-orb-2"></div>
        <div className="pg-orb pg-orb-3"></div>
      </div>

      <div className="pg-app">
        {/* NAV */}
        <nav className="pg-nav">
          <div className="pg-nav-inner">
            <div className="pg-logo">
              <div className="pg-logo-mark">P</div>
              <span className="pg-logo-text">PreGrade</span>
            </div>
            <div className="pg-nav-links">
              <span className="pg-nav-remaining">{remaining}/3 grades left</span>
              <span className="pg-nav-user">{username}</span>
              <button className="pg-logout-btn" onClick={handleLogout}>Log Out</button>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <header className="pg-hero" style={{ paddingBottom: "30px" }}>
          <h1 className="pg-hero-title" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
            <span className="pg-hero-accent">What are we grading today?</span>
          </h1>
        </header>

        {/* TABS */}
        <div className="pg-tabs">
          <button
            className={"pg-tab" + (activeTab === "input" ? " pg-tab-active" : "")}
            onClick={function() { setActiveTab("input"); }}
          >Submit Work</button>
          <button
            className={"pg-tab" + (activeTab === "results" ? " pg-tab-active" : "")}
            onClick={function() { if (result) setActiveTab("results"); }}
            style={{ opacity: result ? 1 : 0.4, cursor: result ? "pointer" : "default" }}
          >View Results</button>
        </div>

        {/* INPUT PANEL */}
        {activeTab === "input" && (
          <div className="pg-panel pg-fade-in">
            <div className="pg-input-section">
              <label className="pg-field-label">Your Assignment</label>
              <div className="pg-textarea-wrap">
                <textarea
                  className="pg-textarea"
                  placeholder="Paste your essay, quiz answers, homework, or any assignment here..."
                  value={assignment}
                  onChange={function(e) { setAssignment(e.target.value); }}
                  rows={12}
                />
                <div className="pg-char-count">{charCount} characters</div>
              </div>
            </div>

            <div className="pg-input-section">
              <label className="pg-field-label">Choose Your Teacher</label>
              <div className="pg-teacher-grid">
                {teacherTypes.map(function(t) {
                  var isActive = teacherType === t.value;
                  return (
                    <button
                      key={t.value}
                      className={"pg-teacher-card" + (isActive ? " pg-teacher-active" : "")}
                      onClick={function() { setTeacherType(t.value); }}
                    >
                      <div className="pg-teacher-emoji">{t.emoji}</div>
                      <div className="pg-teacher-name">{t.label}</div>
                      <div className="pg-teacher-desc">{t.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {remaining <= 0 && (
              <div className="pg-rate-warn">
                You've used all 3 grades this hour. Please wait before submitting again.
              </div>
            )}

            <button
              className="pg-submit-btn"
              onClick={handleSubmit}
              disabled={loading || remaining <= 0}
              style={{ opacity: (loading || remaining <= 0) ? 0.5 : 1 }}
            >
              {loading ? (
                <span className="pg-loading-content">
                  <span className="pg-spinner"></span>
                  <span>{selectedTeacher ? selectedTeacher.emoji : ""} Grading with {selectedTeacher ? selectedTeacher.label : ""}...</span>
                </span>
              ) : (
                <span>Grade My Work ({remaining} remaining)</span>
              )}
            </button>

            {error && <div className="pg-error">{error}</div>}
          </div>
        )}

        {/* RESULTS PANEL */}
        {activeTab === "results" && result && (
          <div className={"pg-panel pg-results-panel" + (showResult ? " pg-fade-in" : "")}>
            <div className="pg-grade-header">
              <div className="pg-grade-circle" style={{ borderColor: getGradeColor(result.grade) }}>
                <div className="pg-grade-letter" style={{ color: getGradeColor(result.grade) }}>{result.grade || "N/A"}</div>
                <div className="pg-grade-score">{result.score || "?"}/100</div>
              </div>
              <div className="pg-grade-meta">
                <div className="pg-grade-teacher">Graded by: {selectedTeacher ? selectedTeacher.emoji : ""} {selectedTeacher ? selectedTeacher.label : ""}</div>
                {result.summary && <p className="pg-grade-summary">{result.summary}</p>}
              </div>
            </div>

            <div className="pg-result-block">
              <div className="pg-block-header">
                <div className="pg-block-icon">{"\u{1F4DD}"}</div>
                <h3 className="pg-block-title">Teacher Feedback</h3>
              </div>
              <div className="pg-block-content pg-feedback-text">
                {(result.feedback || "").split("\n").map(function(para, i) {
                  if (!para.trim()) return null;
                  return <p key={i}>{para}</p>;
                })}
              </div>
            </div>

            {result.strengths && result.strengths.length > 0 && (
              <div className="pg-result-block">
                <div className="pg-block-header">
                  <div className="pg-block-icon">{"\u2705"}</div>
                  <h3 className="pg-block-title">What You Did Well</h3>
                </div>
                <div className="pg-block-content">
                  {result.strengths.map(function(s, i) {
                    return (
                      <div key={i} className="pg-strength-item">
                        <div className="pg-strength-dot"></div>
                        <span>{s}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.pointsLost && result.pointsLost.length > 0 && (
              <div className="pg-result-block">
                <div className="pg-block-header">
                  <div className="pg-block-icon">{"\u26A0\uFE0F"}</div>
                  <h3 className="pg-block-title">Points Deducted</h3>
                </div>
                <div className="pg-block-content">
                  {result.pointsLost.map(function(p, i) {
                    return (
                      <div key={i} className="pg-deduction-item">
                        <div className="pg-deduction-top">
                          <span className="pg-deduction-cat">{p.category || "General"}</span>
                          <span className="pg-deduction-pts">-{p.amount} pts</span>
                        </div>
                        <div className="pg-deduction-reason">{p.reason}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.suggestions && result.suggestions.length > 0 && (
              <div className="pg-result-block">
                <div className="pg-block-header">
                  <div className="pg-block-icon">{"\u{1F4A1}"}</div>
                  <h3 className="pg-block-title">How to Improve</h3>
                </div>
                <div className="pg-block-content">
                  {result.suggestions.map(function(s, i) {
                    var title = typeof s === "string" ? s : s.title;
                    var detail = typeof s === "string" ? null : s.detail;
                    return (
                      <div key={i} className="pg-suggestion-item">
                        <div className="pg-suggestion-num">{i + 1}</div>
                        <div className="pg-suggestion-body">
                          <div className="pg-suggestion-title">{title}</div>
                          {detail && <div className="pg-suggestion-detail">{detail}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.rewriteExample && (
              <div className="pg-result-block pg-rewrite-block">
                <div className="pg-block-header">
                  <div className="pg-block-icon">{"\u270F\uFE0F"}</div>
                  <h3 className="pg-block-title">Rewrite Example</h3>
                </div>
                <div className="pg-block-content">
                  <div className="pg-rewrite-text">{result.rewriteExample}</div>
                </div>
              </div>
            )}

            <button className="pg-reset-btn" onClick={handleReset}>
              Grade Another Assignment
            </button>
          </div>
        )}

        <footer className="pg-footer">
          <span>PreGrade &mdash; AI grading assistant for students</span>
        </footer>
      </div>
    </div>
  );
}

var cssText = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Instrument+Serif:ital@0;1&display=swap');

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #08070e; color: #e0dfe6;
  font-family: 'DM Sans', sans-serif;
  overflow-x: hidden; -webkit-font-smoothing: antialiased;
}

.pg-bg {
  position: fixed; inset: 0; z-index: 0; overflow: hidden;
  background: radial-gradient(ellipse at 20% 0%, #1a1038 0%, #08070e 60%);
}
.pg-grain {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  background-repeat: repeat; opacity: 0.5;
}
.pg-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; }
.pg-orb-1 { width: 600px; height: 600px; background: #7c3aed; top: -200px; left: -100px; animation: pg-float 20s ease-in-out infinite; }
.pg-orb-2 { width: 500px; height: 500px; background: #2563eb; bottom: -150px; right: -100px; animation: pg-float 25s ease-in-out infinite reverse; }
.pg-orb-3 { width: 300px; height: 300px; background: #06b6d4; top: 40%; left: 60%; animation: pg-float 18s ease-in-out infinite 3s; }
@keyframes pg-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}

.pg-app { position: relative; z-index: 1; max-width: 820px; margin: 0 auto; padding: 0 24px; }

.pg-nav { padding: 24px 0; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.pg-nav-inner { display: flex; align-items: center; justify-content: space-between; }
.pg-logo { display: flex; align-items: center; gap: 12px; }
.pg-logo-mark {
  width: 38px; height: 38px; border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Instrument Serif', serif; font-size: 22px; color: white;
}
.pg-logo-text { font-size: 20px; font-weight: 600; color: #fff; letter-spacing: -0.5px; }
.pg-nav-links { display: flex; align-items: center; gap: 12px; }
.pg-nav-pill {
  padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 500;
  background: rgba(124, 58, 237, 0.15); color: #a78bfa; border: 1px solid rgba(124, 58, 237, 0.2);
}
.pg-nav-remaining {
  padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 600;
  background: rgba(16, 185, 129, 0.1); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.2);
}
.pg-nav-user {
  font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5);
}
.pg-logout-btn {
  padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 500;
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.08); cursor: pointer;
  font-family: 'DM Sans', sans-serif; transition: all 0.2s ease;
}
.pg-logout-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.pg-nav-version { font-size: 12px; color: rgba(255,255,255,0.3); }

.pg-hero { text-align: center; padding: 40px 0 50px; }
.pg-hero-badge {
  display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 2px;
  color: #a78bfa; padding: 6px 16px; border-radius: 100px;
  border: 1px solid rgba(124,58,237,0.25); margin-bottom: 24px;
  background: rgba(124,58,237,0.08);
}
.pg-hero-title {
  font-family: 'Instrument Serif', serif; font-weight: 400;
  font-size: clamp(2.4rem, 5vw, 3.6rem); line-height: 1.15; color: #fff;
  letter-spacing: -1px; margin-bottom: 18px;
}
.pg-hero-accent {
  background: linear-gradient(135deg, #a78bfa, #38bdf8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.pg-hero-sub {
  font-size: 1.05rem; color: rgba(255,255,255,0.45); max-width: 520px; margin: 0 auto; line-height: 1.6;
}

/* AUTH */
.pg-auth-card {
  max-width: 420px; margin: 0 auto 40px; padding: 32px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
}
.pg-auth-tabs {
  display: flex; gap: 4px; padding: 4px; border-radius: 12px;
  background: rgba(255,255,255,0.04); margin-bottom: 28px;
}
.pg-auth-tab {
  flex: 1; padding: 10px; border: none; border-radius: 9px; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
  background: transparent; color: rgba(255,255,255,0.4); transition: all 0.2s ease;
}
.pg-auth-tab-active {
  background: rgba(255,255,255,0.08); color: #fff;
}
.pg-auth-form { display: flex; flex-direction: column; }
.pg-input {
  width: 100%; padding: 14px 16px; border-radius: 12px; font-size: 15px;
  font-family: 'DM Sans', sans-serif; color: #e0dfe6;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  outline: none; transition: border-color 0.3s ease;
}
.pg-input:focus {
  border-color: rgba(124, 58, 237, 0.4);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
}
.pg-input::placeholder { color: rgba(255,255,255,0.2); }

/* TABS */
.pg-tabs {
  display: flex; gap: 4px; padding: 4px; border-radius: 14px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 28px;
}
.pg-tab {
  flex: 1; padding: 12px 20px; border: none; border-radius: 11px; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
  background: transparent; color: rgba(255,255,255,0.4); transition: all 0.25s ease;
}
.pg-tab-active { background: rgba(255,255,255,0.08); color: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.2); }

.pg-panel { padding-bottom: 30px; }
.pg-fade-in { animation: pg-fadeUp 0.5s ease forwards; }
@keyframes pg-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.pg-input-section { margin-bottom: 32px; }
.pg-field-label {
  display: block; font-size: 13px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 1.5px; color: rgba(255,255,255,0.35); margin-bottom: 14px;
}
.pg-textarea-wrap { position: relative; }
.pg-textarea {
  width: 100%; padding: 20px; border-radius: 16px; font-size: 15px; line-height: 1.7;
  font-family: 'DM Sans', sans-serif; color: #e0dfe6; resize: vertical; min-height: 220px;
  background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08);
  outline: none; transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.pg-textarea:focus {
  border-color: rgba(124, 58, 237, 0.4);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08), 0 8px 32px rgba(0,0,0,0.3);
}
.pg-textarea::placeholder { color: rgba(255,255,255,0.2); }
.pg-char-count { position: absolute; bottom: 12px; right: 16px; font-size: 12px; color: rgba(255,255,255,0.2); }

.pg-teacher-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
.pg-teacher-card {
  padding: 16px 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.025); cursor: pointer; text-align: left;
  font-family: 'DM Sans', sans-serif; color: #e0dfe6; transition: all 0.25s ease;
}
.pg-teacher-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); transform: translateY(-2px); }
.pg-teacher-active {
  background: rgba(124, 58, 237, 0.1) !important; border-color: rgba(124, 58, 237, 0.35) !important;
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1), 0 4px 20px rgba(124, 58, 237, 0.1);
}
.pg-teacher-emoji { font-size: 26px; margin-bottom: 8px; }
.pg-teacher-name { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; }
.pg-teacher-desc { font-size: 11.5px; color: rgba(255,255,255,0.35); line-height: 1.4; }

.pg-submit-btn {
  width: 100%; padding: 18px 28px; border-radius: 14px; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  box-shadow: 0 4px 24px rgba(124, 58, 237, 0.25), 0 1px 2px rgba(0,0,0,0.2);
  transition: all 0.3s ease; position: relative; overflow: hidden;
}
.pg-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.35), 0 2px 4px rgba(0,0,0,0.3);
}
.pg-submit-btn:disabled { cursor: not-allowed; }
.pg-loading-content { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pg-spinner {
  display: inline-block; width: 20px; height: 20px; border-radius: 50%;
  border: 2.5px solid rgba(255,255,255,0.25); border-top-color: #fff;
  animation: pg-spin 0.7s linear infinite;
}
@keyframes pg-spin { to { transform: rotate(360deg); } }

.pg-error {
  margin-top: 16px; padding: 14px 20px; border-radius: 12px;
  background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5; font-size: 14px; text-align: center;
}
.pg-rate-warn {
  margin-bottom: 16px; padding: 14px 20px; border-radius: 12px;
  background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2);
  color: #fcd34d; font-size: 14px; text-align: center;
}

.pg-grade-header {
  display: flex; align-items: center; gap: 28px; padding: 32px;
  border-radius: 20px; margin-bottom: 24px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
}
.pg-grade-circle {
  width: 110px; height: 110px; border-radius: 50%; flex-shrink: 0;
  border: 3px solid; display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: rgba(0,0,0,0.3);
}
.pg-grade-letter { font-family: 'Instrument Serif', serif; font-size: 42px; line-height: 1; }
.pg-grade-score { font-size: 14px; color: rgba(255,255,255,0.45); margin-top: 4px; }
.pg-grade-meta { flex: 1; }
.pg-grade-teacher { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
.pg-grade-summary {
  font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6;
  font-family: 'Instrument Serif', serif; font-style: italic;
}

.pg-result-block {
  margin-bottom: 20px; border-radius: 18px; overflow: hidden;
  background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
}
.pg-block-header {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.pg-block-icon { font-size: 20px; }
.pg-block-title { font-size: 15px; font-weight: 600; color: #fff; }
.pg-block-content { padding: 20px 24px; }

.pg-feedback-text p {
  margin-bottom: 14px; font-size: 14.5px; line-height: 1.75; color: rgba(255,255,255,0.7);
}
.pg-feedback-text p:last-child { margin-bottom: 0; }

.pg-strength-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 10px 0;
  font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.6;
}
.pg-strength-item + .pg-strength-item { border-top: 1px solid rgba(255,255,255,0.04); }
.pg-strength-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 7px; background: #10b981;
}

.pg-deduction-item { padding: 14px 0; }
.pg-deduction-item + .pg-deduction-item { border-top: 1px solid rgba(255,255,255,0.04); }
.pg-deduction-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.pg-deduction-cat { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); }
.pg-deduction-pts {
  font-size: 13px; font-weight: 700; color: #f87171;
  padding: 3px 10px; border-radius: 6px; background: rgba(248,113,113,0.1);
}
.pg-deduction-reason { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.65; }

.pg-suggestion-item { display: flex; gap: 16px; padding: 14px 0; }
.pg-suggestion-item + .pg-suggestion-item { border-top: 1px solid rgba(255,255,255,0.04); }
.pg-suggestion-num {
  width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
  background: rgba(124, 58, 237, 0.12); color: #a78bfa;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; margin-top: 2px;
}
.pg-suggestion-body { flex: 1; }
.pg-suggestion-title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
.pg-suggestion-detail { font-size: 13.5px; color: rgba(255,255,255,0.55); line-height: 1.65; }

.pg-rewrite-block { border-color: rgba(124, 58, 237, 0.15); background: rgba(124, 58, 237, 0.04); }
.pg-rewrite-text {
  font-size: 14.5px; color: rgba(255,255,255,0.7); line-height: 1.75;
  font-style: italic; padding-left: 16px; border-left: 3px solid rgba(124, 58, 237, 0.3);
}

.pg-reset-btn {
  width: 100%; margin-top: 24px; padding: 16px 24px; border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.6); font-family: 'DM Sans', sans-serif;
  font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.25s ease;
}
.pg-reset-btn:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.2); }

.pg-footer { text-align: center; padding: 40px 0 30px; font-size: 13px; color: rgba(255,255,255,0.2); }

@media (max-width: 640px) {
  .pg-hero-title { font-size: 2rem; }
  .pg-teacher-grid { grid-template-columns: repeat(2, 1fr); }
  .pg-grade-header { flex-direction: column; text-align: center; gap: 16px; padding: 24px; }
  .pg-grade-circle { width: 90px; height: 90px; }
  .pg-grade-letter { font-size: 34px; }
  .pg-nav-links { gap: 6px; }
  .pg-nav-remaining { display: none; }
}
`;

export default App;
