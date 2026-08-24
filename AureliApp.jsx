import React, { useState, useEffect, useRef } from "react";
import {
  Home, MessageCircle, Target, TrendingUp, User, Mic, ChevronRight,
  ChevronLeft, Check, Sparkles, Dumbbell, BookOpen, Briefcase, Wallet,
  Clock, Heart, Brain, Users, Flame, Lock, ArrowRight, X, Leaf, Zap,
  Smile, Apple, Wifi, BatteryFull, Play, ArrowLeft, Mail, MessageSquareHeart,
  ExternalLink, Star, ShieldCheck, RefreshCw
} from "lucide-react";

const SUPPORT_EMAIL = "info@anas.it.com";

/* ---------------------------------------------------------------
   AURELI — AI Life Coach
   Interactive phone-frame prototype: splash → onboarding → home →
   coach → voice → goals → progress → profile → paywall
--------------------------------------------------------------- */

const GOALS = [
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "nutrition", label: "Nutrition", icon: Apple },
  { id: "mindset", label: "Mindset", icon: Brain },
  { id: "learning", label: "Learning", icon: BookOpen },
  { id: "career", label: "Career", icon: Briefcase },
  { id: "money", label: "Money", icon: Wallet },
  { id: "productivity", label: "Productivity", icon: Clock },
  { id: "relationships", label: "Relationships", icon: Heart },
];

const STYLES = [
  { id: "gentle", label: "Gentle", icon: Leaf, blurb: "Soft nudges, no pressure" },
  { id: "motivating", label: "Motivating", icon: Flame, blurb: "Energy and encouragement" },
  { id: "tough", label: "Tough", icon: Zap, blurb: "No excuses, straight talk" },
  { id: "direct", label: "Direct", icon: Target, blurb: "Just the facts, fast" },
  { id: "friendly", label: "Friendly", icon: Smile, blurb: "Warm, like a good friend" },
];

const TIMES = ["15 min", "30 min", "1 hour", "2 hours", "Flexible"];

const BUILD_STEPS = [
  "Reading your goals",
  "Mapping your schedule",
  "Calibrating coaching tone",
  "Drafting your first plan",
  "Finalizing your 90 days",
];

const GOAL_TASK = {
  fitness: "30-minute workout",
  nutrition: "Log today's meals",
  mindset: "5-minute breathing reset",
  learning: "15-minute English lesson",
  career: "Apply to 2 roles",
  money: "Review this week's spend",
  productivity: "Clear your top 3 inbox items",
  relationships: "Send one thoughtful message",
};

function formatTodayLabel() {
  // Always reflects the device's real current date — no stale hardcoded string.
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function useTypingReveal(active, delay = 900) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) return;
    setShown(false);
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  return shown;
}

/* ---------------------------------------------------------------
   Persistence helpers
   Wrapped in try/catch because localStorage can throw (private
   browsing, disabled storage, first-run WebView) and a crash here
   would take the whole app down before it even renders.
--------------------------------------------------------------- */
const STORAGE_KEY = "aureli_state_v1";

function loadPersistedState() {
  const fallback = {
    screen: "splash",
    name: "",
    goals: [],
    style: null,
    time: null,
    tasks: {},
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      screen: typeof parsed.screen === "string" ? parsed.screen : fallback.screen,
      name: typeof parsed.name === "string" ? parsed.name : fallback.name,
      goals: Array.isArray(parsed.goals) ? parsed.goals : fallback.goals,
      style: typeof parsed.style === "string" ? parsed.style : fallback.style,
      time: typeof parsed.time === "string" ? parsed.time : fallback.time,
      tasks: parsed.tasks && typeof parsed.tasks === "object" ? parsed.tasks : fallback.tasks,
    };
  } catch (err) {
    console.warn("Aureli: could not read saved state, starting fresh.", err);
    return fallback;
  }
}

function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Storage can be full or unavailable — non-fatal, just skip saving.
    console.warn("Aureli: could not save state.", err);
  }
}

export default function AureliPrototype() {
  const initial = useRef(loadPersistedState()).current;
  // Returning users skip straight back to where they left off;
  // splash is only ever shown on a genuine first launch.
  const [screen, setScreen] = useState(initial.screen === "splash" ? "splash" : initial.screen);
  const [prevScreen, setPrevScreen] = useState("home");
  const [name, setName] = useState(initial.name);
  const [goals, setGoals] = useState(initial.goals);
  const [style, setStyle] = useState(initial.style);
  const [time, setTime] = useState(initial.time);
  const [tasks, setTasks] = useState(initial.tasks);
  const [billing, setBilling] = useState("yearly");
  const [chat, setChat] = useState([]);
  const [chatBusy, setChatBusy] = useState(false);

  const displayName = name.trim() || "Alex";
  const primaryGoal = goals?.[0] ? GOALS.find((g) => g.id === goals[0]) : null;

  // Persist on every relevant change so a phone call, app switch, or
  // force-close doesn't wipe onboarding progress or daily tasks.
  useEffect(() => {
    if (screen === "splash") return; // nothing meaningful to save yet
    persistState({ screen, name, goals, style, time, tasks });
  }, [screen, name, goals, style, time, tasks]);

  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("welcome"), 2600);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "building") {
      const t = setTimeout(() => setScreen("home"), BUILD_STEPS.length * 700 + 500);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "home" && goals.length && Object.keys(tasks).length === 0) {
      const init = {};
      goals.slice(0, 3).forEach((g) => (init[g] = false));
      setTasks(init);
    }
  }, [screen, goals]);

  useEffect(() => {
    if (screen === "coach" && chat.length === 0) {
      setChat([
        {
          from: "ai",
          text: primaryGoal
            ? `Hi ${displayName}. I noticed ${primaryGoal.label.toLowerCase()} is your top priority right now — how are you feeling about today's plan?`
            : `Hi ${displayName}. How are you feeling about today's plan?`,
        },
      ]);
    }
  }, [screen]);

  function toggleGoal(id) {
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  }

  function toggleTask(id) {
    setTasks((t) => ({ ...t, [id]: !t[id] }));
  }

  function goTo(s) {
    setPrevScreen(screen);
    setScreen(s);
  }

  function sendQuickReply(userText, aiText) {
    setChat((c) => [...c, { from: "user", text: userText }]);
    setChatBusy(true);
    setTimeout(() => {
      setChat((c) => [...c, { from: "ai", text: aiText }]);
      setChatBusy(false);
    }, 900);
  }

  const completed = Object.values(tasks).filter(Boolean).length;
  const total = Object.keys(tasks).length || 1;
  const focusPct = Math.round((completed / total) * 100);

  const showNav = ["home", "coach", "mygoals", "progress", "profile"].includes(screen);

  return (
    <div style={styles.page}>
      <style>{CSS}</style>
      <div className="aur-ambient" />
      <div style={styles.phoneWrap}>
        <div className="aur-phone">
          <div className="aur-notch" />
          <div className="aur-statusbar">
            <span className="aur-time">9:41</span>
            <div className="aur-status-icons">
              <div className="aur-bars">
                <i /><i /><i /><i />
              </div>
              <Wifi size={14} strokeWidth={2.4} />
              <BatteryFull size={16} strokeWidth={2} />
            </div>
          </div>

          <div className="aur-screen">
            {screen === "splash" && <Splash />}
            {screen === "welcome" && (
              <Welcome name={name} setName={setName} onNext={() => goTo("goals")} />
            )}
            {screen === "goals" && (
              <GoalsSelect
                goals={goals}
                toggleGoal={toggleGoal}
                onBack={() => goTo("welcome")}
                onNext={() => goTo("interview")}
              />
            )}
            {screen === "interview" && (
              <Interview
                primaryGoal={primaryGoal}
                onBack={() => goTo("goals")}
                onNext={() => goTo("style")}
              />
            )}
            {screen === "style" && (
              <StylePick
                style={style}
                setStyle={setStyle}
                onBack={() => goTo("interview")}
                onNext={() => goTo("time")}
              />
            )}
            {screen === "time" && (
              <TimePick
                time={time}
                setTime={setTime}
                onBack={() => goTo("style")}
                onNext={() => goTo("building")}
              />
            )}
            {screen === "building" && <Building />}

            {screen === "home" && (
              <HomeDash
                name={displayName}
                goals={goals}
                tasks={tasks}
                toggleTask={toggleTask}
                focusPct={focusPct}
                style={style}
                primaryGoal={primaryGoal}
                onPaywall={() => goTo("paywall")}
              />
            )}
            {screen === "coach" && (
              <Coach
                chat={chat}
                busy={chatBusy}
                onQuickReply={sendQuickReply}
                onVoice={() => goTo("voice")}
              />
            )}
            {screen === "voice" && <VoiceMode onExit={() => goTo(prevScreen === "voice" ? "coach" : prevScreen)} />}
            {screen === "mygoals" && <GoalsScreen goals={goals} onPaywall={() => goTo("paywall")} />}
            {screen === "progress" && <Progress />}
            {screen === "profile" && (
              <Profile
                name={displayName}
                style={style}
                time={time}
                onPaywall={() => goTo("paywall")}
                onRestart={() => {
                  try {
                    localStorage.removeItem(STORAGE_KEY);
                  } catch (err) {
                    console.warn("Aureli: could not clear saved state.", err);
                  }
                  setScreen("splash");
                  setName("");
                  setGoals([]);
                  setStyle(null);
                  setTime(null);
                  setTasks({});
                  setChat([]);
                }}
              />
            )}
            {screen === "paywall" && (
              <Paywall
                billing={billing}
                setBilling={setBilling}
                onClose={() => goTo(prevScreen)}
                onPurchaseComplete={() => goTo(prevScreen)}
              />
            )}
          </div>

          {showNav && <BottomNav screen={screen} goTo={goTo} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Screens ---------------- */

function Splash() {
  return (
    <div className="aur-center aur-fade-in" style={{ height: "100%", position: "relative" }}>
      <NeuralField density={30} />
      <Orb size={104} mode="idle" />
      <div className="aur-wordmark">AURELI</div>
      <div className="aur-tagline">Don't just plan your life.<br />Let AI help you live it.</div>
    </div>
  );
}

function Welcome({ name, setName, onNext }) {
  return (
    <div className="aur-col aur-pad aur-fade-in">
      <div style={{ flex: 0.6 }} />
      <Orb size={68} mode="idle" />
      <h1 className="aur-h1" style={{ marginTop: 18 }}>Hi, I'm Aureli 👋</h1>
      <p className="aur-sub">I'm going to learn what matters to you and build your personal plan.</p>

      <div className="aur-socialproof">
        <div className="aur-avatarstack">
          <span style={{ background: "linear-gradient(135deg,#FFB347,#FF7A5C)" }} />
          <span style={{ background: "linear-gradient(135deg,#8FE3F5,#3B5BFF)" }} />
          <span style={{ background: "linear-gradient(135deg,#B98CFF,#5B7CFF)" }} />
          <span style={{ background: "linear-gradient(135deg,#4ADE80,#22B8CF)" }} />
        </div>
        <div className="aur-socialproof-text">
          <span className="aur-stars"><Star size={11} fill="#FFD36E" color="#FFD36E" /><Star size={11} fill="#FFD36E" color="#FFD36E" /><Star size={11} fill="#FFD36E" color="#FFD36E" /><Star size={11} fill="#FFD36E" color="#FFD36E" /><Star size={11} fill="#FFD36E" color="#FFD36E" /></span>
          <span>Trusted by 50,000+ people building better days</span>
        </div>
      </div>

      <label className="aur-label">What should I call you?</label>
      <input
        className="aur-input"
        placeholder="Alex"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
      />

      <div style={{ flex: 1 }} />

      <button className="aur-btn-primary" onClick={onNext}>
        Let's begin <ArrowRight size={16} />
      </button>

      <div className="aur-orsplit"><span /> or continue with <span /></div>
      <div className="aur-socialrow">
        <button className="aur-socialbtn" onClick={onNext} aria-label="Continue with Apple">
          <AppleGlyph /> Apple
        </button>
        <button className="aur-socialbtn" onClick={onNext} aria-label="Continue with Google">
          <GoogleGlyph /> Google
        </button>
      </div>
      <div className="aur-legal">By continuing, you agree to Aureli's Terms &amp; Privacy Policy.</div>
    </div>
  );
}

function AppleGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
  );
}
function GoogleGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.3 0 10.2-2 13.9-5.4l-6.4-5.4C29.4 34.7 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.4 5.4C39.8 37 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
  );
}

function GoalsSelect({ goals, toggleGoal, onBack, onNext }) {
  return (
    <div className="aur-col aur-pad aur-fade-in">
      <TopBar onBack={onBack} step={1} of={5} />
      <h1 className="aur-h1">What do you want to improve?</h1>
      <p className="aur-sub">Choose as many as you like.</p>
      <div className="aur-grid2">
        {GOALS.map((g) => {
          const Icon = g.icon;
          const active = goals.includes(g.id);
          return (
            <button
              key={g.id}
              className={"aur-chip" + (active ? " aur-chip-active" : "")}
              onClick={() => toggleGoal(g.id)}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{g.label}</span>
              {active && <Check size={14} className="aur-chip-check" />}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <button className="aur-btn-primary" disabled={!goals.length} onClick={onNext}>
        Continue ({goals.length} selected) <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Interview({ primaryGoal, onBack, onNext }) {
  const [step, setStep] = useState(0);
  const goalLabel = primaryGoal ? primaryGoal.label.toLowerCase() : "your goals";
  const q1Shown = useTypingReveal(true, 500);
  const [reply, setReply] = useState(null);

  const REPLIES = [
    { key: "time", text: "Not enough time", ai: `Understood. I'll keep ${goalLabel} sessions short and fit them around your day.` },
    { key: "motivation", text: "Low motivation", ai: `That's common. I'll start small and build momentum with quick wins.` },
    { key: "start", text: "Don't know where to start", ai: `No problem — I'll hand you one clear next step at a time, nothing overwhelming.` },
  ];

  function pick(r) {
    setReply(r);
    setStep(1);
  }

  return (
    <div className="aur-col aur-pad aur-fade-in">
      <TopBar onBack={onBack} step={2} of={5} />
      <h1 className="aur-h1">Quick check-in</h1>
      <div className="aur-chat">
        {q1Shown && (
          <Bubble from="ai">
            What's stopping you from being consistent with {goalLabel}?
          </Bubble>
        )}
        {reply && <Bubble from="user">{reply.text}</Bubble>}
        {reply && <Bubble from="ai">{reply.ai}</Bubble>}
      </div>
      {step === 0 && q1Shown && (
        <div className="aur-quickreplies">
          {REPLIES.map((r) => (
            <button key={r.key} className="aur-quickreply" onClick={() => pick(r)}>
              {r.text}
            </button>
          ))}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <button className="aur-btn-primary" disabled={!reply} onClick={onNext}>
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

function StylePick({ style, setStyle, onBack, onNext }) {
  return (
    <div className="aur-col aur-pad aur-fade-in">
      <TopBar onBack={onBack} step={3} of={5} />
      <h1 className="aur-h1">How should I coach you?</h1>
      <p className="aur-sub">This shapes my tone in every message.</p>
      <div className="aur-col" style={{ gap: 10 }}>
        {STYLES.map((s) => {
          const Icon = s.icon;
          const active = style === s.id;
          return (
            <button
              key={s.id}
              className={"aur-rowcard" + (active ? " aur-rowcard-active" : "")}
              onClick={() => setStyle(s.id)}
            >
              <div className="aur-rowcard-icon"><Icon size={18} /></div>
              <div className="aur-rowcard-text">
                <div className="aur-rowcard-title">{s.label}</div>
                <div className="aur-rowcard-blurb">{s.blurb}</div>
              </div>
              {active && <Check size={16} />}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <button className="aur-btn-primary" disabled={!style} onClick={onNext}>
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

function TimePick({ time, setTime, onBack, onNext }) {
  return (
    <div className="aur-col aur-pad aur-fade-in">
      <TopBar onBack={onBack} step={4} of={5} />
      <h1 className="aur-h1">How much time can you give yourself each day?</h1>
      <div className="aur-col" style={{ gap: 10, marginTop: 8 }}>
        {TIMES.map((t) => (
          <button
            key={t}
            className={"aur-rowcard" + (time === t ? " aur-rowcard-active" : "")}
            onClick={() => setTime(t)}
          >
            <div className="aur-rowcard-icon"><Clock size={18} /></div>
            <div className="aur-rowcard-text">
              <div className="aur-rowcard-title">{t}</div>
            </div>
            {time === t && <Check size={16} />}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button className="aur-btn-primary" disabled={!time} onClick={onNext}>
        Build my plan <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Building() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, BUILD_STEPS.length)), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="aur-center aur-fade-in" style={{ height: "100%" }}>
      <Orb size={92} mode="planning" />
      <h1 className="aur-h1" style={{ marginTop: 22 }}>Building your plan</h1>
      <div className="aur-buildlist">
        {BUILD_STEPS.map((s, idx) => (
          <div key={s} className={"aur-buildstep" + (idx < i ? " aur-buildstep-done" : "")}>
            <span className="aur-buildstep-dot">{idx < i ? <Check size={12} /> : null}</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeDash({ name, goals, tasks, toggleTask, focusPct, style, primaryGoal, onPaywall }) {
  const styleObj = STYLES.find((s) => s.id === style);
  const [burst, setBurst] = useState(null);
  const insight = primaryGoal
    ? `You perform better before 8 PM. I've prioritized ${primaryGoal.label.toLowerCase()} for this evening.`
    : `I'll keep adjusting your plan as I learn your rhythm.`;
  const priorityLine = primaryGoal
    ? `Your ${primaryGoal.label.toLowerCase()} is today's priority.`
    : `Let's make today count.`;

  function handleToggle(gid, e) {
    const willComplete = !tasks[gid];
    toggleTask(gid);
    if (willComplete) {
      const rect = e.currentTarget.getBoundingClientRect();
      const parentRect = e.currentTarget.closest(".aur-screen")?.getBoundingClientRect();
      setBurst({
        x: rect.left - (parentRect?.left || 0) + 14,
        y: rect.top - (parentRect?.top || 0) + rect.height / 2,
        id: Date.now(),
      });
    }
  }

  return (
    <div className="aur-col aur-pad aur-fade-in aur-scroll" style={{ position: "relative" }}>
      <NeuralField density={16} className="aur-neuralfield-home" />
      {burst && <ConfettiBurst key={burst.id} x={burst.x} y={burst.y} onDone={() => setBurst(null)} />}
      <div className="aur-row" style={{ justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
        <div>
          <div className="aur-eyebrow">{formatTodayLabel()}</div>
          <h1 className="aur-h1" style={{ marginTop: 2 }}>Good morning, {name}</h1>
        </div>
      </div>

      <div className="aur-orbcard">
        <Orb size={56} mode="idle" />
        <div>
          <div className="aur-orbcard-label">AURELI IS READY</div>
          <div className="aur-orbcard-sub">{priorityLine}</div>
        </div>
      </div>

      <div className="aur-glass" style={{ marginTop: 14 }}>
        <div className="aur-row" style={{ justifyContent: "space-between" }}>
          <span className="aur-eyebrow">Today's focus</span>
          <span className="aur-focuspct">{focusPct}%</span>
        </div>
        <div className="aur-progressbar"><div className="aur-progressbar-fill" style={{ width: `${focusPct}%` }} /></div>
        <div className="aur-col" style={{ gap: 8, marginTop: 12 }}>
          {goals.slice(0, 3).map((gid) => {
            const g = GOALS.find((x) => x.id === gid);
            const done = tasks[gid];
            return (
              <button key={gid} className={"aur-task" + (done ? " aur-task-done" : "")} onClick={(e) => handleToggle(gid, e)}>
                <span className="aur-task-check">{done ? <Check size={13} /> : null}</span>
                <span className={done ? "aur-task-text-done" : ""}>{GOAL_TASK[gid]}</span>
              </button>
            );
          })}
          {!goals.length && <div className="aur-sub">Select goals in onboarding to see tasks here.</div>}
        </div>
      </div>

      <div className="aur-glass" style={{ marginTop: 12, borderColor: "rgba(255,211,110,0.28)" }}>
        <div className="aur-row" style={{ gap: 8 }}>
          <Sparkles size={16} color="#FFD36E" />
          <span className="aur-eyebrow" style={{ color: "#FFD36E" }}>AI insight</span>
        </div>
        <p className="aur-insight-text">{insight}</p>
        {styleObj && <div className="aur-sub" style={{ marginTop: 4 }}>Coaching tone: {styleObj.label}</div>}
      </div>

      <button className="aur-lockcard" onClick={onPaywall}>
        <Lock size={16} />
        <div className="aur-col" style={{ gap: 2 }}>
          <div className="aur-rowcard-title">Unlock Advanced AI Agent</div>
          <div className="aur-rowcard-blurb">Career coaching, resume builder & more with Pro</div>
        </div>
        <ChevronRight size={16} />
      </button>
      <div style={{ height: 8 }} />
    </div>
  );
}

function Bubble({ from, children }) {
  return <div className={"aur-bubble aur-bubble-" + from}>{children}</div>;
}

function Coach({ chat, busy, onQuickReply, onVoice }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, busy]);

  const QUICK = [
    { text: "I'm feeling lazy today", ai: "That's okay. Let's shrink today's target instead of skipping it — just 15 minutes." },
    { text: "Change my plan", ai: "Sure. What would you like more or less of this week?" },
    { text: "Talk to me", ai: "I'm here. Tell me what's on your mind." },
  ];

  return (
    <div className="aur-col" style={{ height: "100%" }}>
      <div className="aur-coach-header">
        <Orb size={30} mode="idle" />
        <div>
          <div className="aur-rowcard-title">Aureli</div>
          <div className="aur-online">● Online</div>
        </div>
      </div>
      <div className="aur-chat aur-scroll" style={{ flex: 1, padding: "12px 16px" }}>
        {chat.map((m, i) => <Bubble key={i} from={m.from}>{m.text}</Bubble>)}
        {busy && <Bubble from="ai"><span className="aur-typing"><i /><i /><i /></span></Bubble>}
        <div ref={endRef} />
      </div>
      <div className="aur-quickreplies" style={{ padding: "0 16px" }}>
        {QUICK.map((q) => (
          <button key={q.text} className="aur-quickreply" onClick={() => onQuickReply(q.text, q.ai)}>{q.text}</button>
        ))}
      </div>
      <div className="aur-coach-inputbar">
        <div className="aur-fakeinput">Message Aureli…</div>
        <button className="aur-mic" onClick={onVoice}><Mic size={18} /></button>
      </div>
    </div>
  );
}

function VoiceMode({ onExit }) {
  return (
    <div className="aur-voice aur-fade-in">
      <button className="aur-voice-exit" onClick={onExit}><ChevronLeft size={16} /> Exit</button>
      <div style={{ flex: 1 }} />
      <Orb size={130} mode="listening" />
      <div className="aur-voice-label">AURELI IS LISTENING</div>
      <div className="aur-voice-sub">"Tell me what's going on."</div>
      <div className="aur-waveform">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.07}s` }} />
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div className="aur-voice-hint">Swipe down or tap Exit to leave</div>
    </div>
  );
}

function GoalsScreen({ goals, onPaywall }) {
  return (
    <div className="aur-col aur-pad aur-fade-in aur-scroll">
      <h1 className="aur-h1">My goals</h1>
      {!goals.length && <p className="aur-sub">No goals selected yet.</p>}
      <div className="aur-col" style={{ gap: 12, marginTop: 6 }}>
        {goals.map((gid) => {
          const g = GOALS.find((x) => x.id === gid);
          const Icon = g.icon;
          const pct = 40 + (gid.length * 7) % 45;
          return (
            <div key={gid} className="aur-glass">
              <div className="aur-row" style={{ gap: 8, justifyContent: "space-between" }}>
                <div className="aur-row" style={{ gap: 8 }}>
                  <Icon size={18} />
                  <span className="aur-rowcard-title">{g.label.toUpperCase()}</span>
                </div>
                <span className="aur-focuspct">{pct}%</span>
              </div>
              <div className="aur-progressbar" style={{ marginTop: 10 }}>
                <div className="aur-progressbar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="aur-sub" style={{ marginTop: 8 }}>
                <Sparkles size={12} style={{ marginRight: 4, verticalAlign: "-2px" }} color="#FFD36E" />
                At your current pace, you're on track within 8–11 weeks.
              </div>
            </div>
          );
        })}
      </div>
      <button className="aur-lockcard" onClick={onPaywall} style={{ marginTop: 14 }}>
        <Lock size={16} />
        <div className="aur-col" style={{ gap: 2 }}>
          <div className="aur-rowcard-title">Unlimited goals</div>
          <div className="aur-rowcard-blurb">Free plan is limited to 3 active goals</div>
        </div>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function Progress() {
  const rows = [
    { label: "Health", val: 78 },
    { label: "Learning", val: 91 },
    { label: "Career", val: 67 },
    { label: "Productivity", val: 84 },
  ];
  return (
    <div className="aur-col aur-pad aur-fade-in aur-scroll">
      <h1 className="aur-h1">Your week</h1>
      <div className="aur-glass">
        <div className="aur-row" style={{ justifyContent: "space-between" }}>
          <span className="aur-eyebrow">Overall progress</span>
          <span className="aur-focuspct">81%</span>
        </div>
        <div className="aur-progressbar"><div className="aur-progressbar-fill" style={{ width: "81%" }} /></div>
      </div>
      <div className="aur-glass" style={{ marginTop: 12 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ marginBottom: 12 }}>
            <div className="aur-row" style={{ justifyContent: "space-between", marginBottom: 5 }}>
              <span className="aur-sub" style={{ margin: 0 }}>{r.label}</span>
              <span className="aur-sub" style={{ margin: 0 }}>{r.val}</span>
            </div>
            <div className="aur-progressbar aur-progressbar-sm">
              <div className="aur-progressbar-fill" style={{ width: `${r.val}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="aur-glass" style={{ marginTop: 12, borderColor: "rgba(255,211,110,0.28)" }}>
        <div className="aur-row" style={{ gap: 8 }}>
          <Sparkles size={16} color="#FFD36E" />
          <span className="aur-eyebrow" style={{ color: "#FFD36E" }}>AI insight</span>
        </div>
        <p className="aur-insight-text">You complete 37% more tasks when they're scheduled before 8 PM. Your strongest days are Tuesday and Thursday.</p>
      </div>
      <div className="aur-glass" style={{ marginTop: 12 }}>
        <div className="aur-row" style={{ gap: 8 }}>
          <Flame size={16} color="#FF9E5E" />
          <span className="aur-rowcard-title">18-day streak</span>
        </div>
        <div className="aur-sub" style={{ marginTop: 4 }}>You don't need perfection — you're building consistency.</div>
      </div>
    </div>
  );
}

function Profile({ name, style, time, onPaywall, onRestart }) {
  const styleObj = STYLES.find((s) => s.id === style);
  return (
    <div className="aur-col aur-pad aur-fade-in aur-scroll">
      <div className="aur-center" style={{ marginTop: 6, marginBottom: 10 }}>
        <div className="aur-avatar">{name.slice(0, 1).toUpperCase()}</div>
        <h1 className="aur-h1" style={{ marginTop: 10 }}>{name}</h1>
        <div className="aur-sub" style={{ margin: 0 }}>Free plan</div>
      </div>

      <button className="aur-upsell" onClick={onPaywall}>
        <Sparkles size={18} color="#FFD36E" />
        <div className="aur-col" style={{ gap: 2 }}>
          <div className="aur-rowcard-title">Upgrade to Aureli Plus</div>
          <div className="aur-rowcard-blurb">Unlimited AI coaching & voice mode</div>
        </div>
        <ChevronRight size={16} />
      </button>

      <div className="aur-glass" style={{ marginTop: 14 }}>
        <div className="aur-settingsrow"><span>Coaching tone</span><span className="aur-settingsval">{styleObj ? styleObj.label : "—"}</span></div>
        <div className="aur-settingsrow"><span>Daily time</span><span className="aur-settingsval">{time || "—"}</span></div>
        <div className="aur-settingsrow"><span>AI memory</span><span className="aur-toggle aur-toggle-on"><i /></span></div>
        <div className="aur-settingsrow" style={{ borderBottom: "none" }}><span>Voice coaching</span><span className="aur-toggle"><i /></span></div>
      </div>

      <div className="aur-glass" style={{ marginTop: 12 }}>
        <div className="aur-settingsrow"><span>Export my data</span><ChevronRight size={14} /></div>
        <div className="aur-settingsrow" style={{ borderBottom: "none" }}><span>Delete account</span><ChevronRight size={14} /></div>
      </div>

      <a href={`mailto:${SUPPORT_EMAIL}?subject=Aureli%20feedback`} className="aur-contactcard">
        <div className="aur-rowcard-icon"><MessageSquareHeart size={17} /></div>
        <div className="aur-col" style={{ gap: 2 }}>
          <div className="aur-rowcard-title">Suggestions &amp; complaints</div>
          <div className="aur-rowcard-blurb aur-contactemail"><Mail size={11} /> {SUPPORT_EMAIL}</div>
        </div>
        <ExternalLink size={14} />
      </a>
      <div className="aur-contactstatus"><span className="aur-livedot" /> Live &amp; monitored — we reply within 48h</div>

      <button className="aur-restart" onClick={onRestart}>Restart demo</button>
      <div className="aur-version">Aureli · v1.0 prototype</div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Amazon IAP SKUs
   These must match the SKUs you register (verbatim) in the Amazon
   Developer Console under App Details → In-App Items, and in the
   locally-testable JSON your Android build reads via the App
   Tester tool.
--------------------------------------------------------------- */
const IAP_SKUS = {
  plus: { monthly: "aureli_plus_monthly", yearly: "aureli_plus_yearly" },
  pro: { monthly: "aureli_pro_monthly", yearly: "aureli_pro_yearly" },
};

/**
 * Bridge to native Amazon In-App Purchasing.
 *
 * IMPORTANT: Amazon's IAP SDK is a native Android (Java/Kotlin) API — there
 * is no browser-JS IAP SDK, so this can't be "fully wired" from a .jsx file
 * alone. In a Capacitor build, expose a small native plugin (e.g.
 * `AureliIAP.purchase({ sku })`) that calls Amazon's PurchasingService under
 * the hood and resolves/rejects this promise. Until that plugin is added,
 * calling this in a browser preview will reject with a clear error instead
 * of silently pretending to succeed.
 */
function purchaseWithAmazonIAP(sku) {
  if (window.AureliIAP && typeof window.AureliIAP.purchase === "function") {
    return window.AureliIAP.purchase({ sku });
  }
  return Promise.reject(
    new Error(
      "Amazon IAP native bridge not found. This screen only completes real purchases inside the signed Android build with the AureliIAP Capacitor plugin installed."
    )
  );
}

function Paywall({ billing, setBilling, onClose, onPurchaseComplete }) {
  const [plan, setPlan] = useState("plus"); // "plus" | "pro"
  const [purchaseState, setPurchaseState] = useState("idle"); // idle | pending | error
  const [purchaseError, setPurchaseError] = useState("");

  const plusPrice = billing === "yearly" ? "$59.99/yr" : "$7.99/mo";
  const proPrice = billing === "yearly" ? "$119.99/yr" : "$14.99/mo";
  const plusSub = billing === "yearly" ? "≈ $5.00/mo" : "billed monthly";
  const proSub = billing === "yearly" ? "≈ $10.00/mo" : "billed monthly";

  async function handleStartTrial() {
    const sku = IAP_SKUS[plan][billing];
    setPurchaseState("pending");
    setPurchaseError("");
    try {
      await purchaseWithAmazonIAP(sku);
      setPurchaseState("idle");
      onPurchaseComplete && onPurchaseComplete();
    } catch (err) {
      setPurchaseState("error");
      setPurchaseError(err?.message || "Purchase could not be completed. Please try again.");
    }
  }

  return (
    <div className="aur-col aur-pad aur-fade-in aur-scroll">
      <div className="aur-row" style={{ justifyContent: "flex-end" }}>
        <button className="aur-iconbtn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="aur-center" style={{ marginBottom: 8 }}>
        <Orb size={60} mode="planning" />
        <h1 className="aur-h1" style={{ marginTop: 12, textAlign: "center" }}>Unlock your full plan</h1>
        <p className="aur-sub" style={{ textAlign: "center" }}>7 days free, then choose the plan that fits.</p>
        <div className="aur-ratingbadge">
          <span className="aur-stars"><Star size={12} fill="#FFD36E" color="#FFD36E" /><Star size={12} fill="#FFD36E" color="#FFD36E" /><Star size={12} fill="#FFD36E" color="#FFD36E" /><Star size={12} fill="#FFD36E" color="#FFD36E" /><Star size={12} fill="#FFD36E" color="#FFD36E" /></span>
          <span>4.9 · 12,400+ ratings</span>
        </div>
      </div>

      <div className="aur-billtoggle">
        <button className={billing === "monthly" ? "aur-bill-active" : ""} onClick={() => setBilling("monthly")}>Monthly</button>
        <button className={billing === "yearly" ? "aur-bill-active" : ""} onClick={() => setBilling("yearly")}>
          Yearly <span className="aur-save">Save 37%</span>
        </button>
      </div>

      <div
        className={`aur-plancard aur-plancard-featured${plan === "plus" ? " aur-plancard-selected" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => setPlan("plus")}
      >
        <div className="aur-planbadge">MOST POPULAR</div>
        <div className="aur-row" style={{ justifyContent: "space-between" }}>
          <span className="aur-rowcard-title">Aureli Plus</span>
          <div style={{ textAlign: "right" }}>
            <div className="aur-planprice">{plusPrice}</div>
            <div className="aur-plansub">{plusSub}</div>
          </div>
        </div>
        <ul className="aur-featurelist">
          <li><Check size={13} /> Unlimited AI coach</li>
          <li><Check size={13} /> Unlimited goals</li>
          <li><Check size={13} /> AI voice conversations</li>
          <li><Check size={13} /> Progress analytics & memory</li>
        </ul>
      </div>

      <div
        className={`aur-plancard${plan === "pro" ? " aur-plancard-selected" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => setPlan("pro")}
      >
        <div className="aur-row" style={{ justifyContent: "space-between" }}>
          <span className="aur-rowcard-title">Aureli Pro</span>
          <div style={{ textAlign: "right" }}>
            <div className="aur-planprice">{proPrice}</div>
            <div className="aur-plansub">{proSub}</div>
          </div>
        </div>
        <ul className="aur-featurelist">
          <li><Check size={13} /> Everything in Plus</li>
          <li><Check size={13} /> Career AI & resume builder</li>
          <li><Check size={13} /> Interview simulator</li>
          <li><Check size={13} /> Calendar & wearables</li>
        </ul>
      </div>

      <div className="aur-testimonial">
        <div className="aur-quotemark">"</div>
        <p>Aureli figured out my schedule better than I could. Three weeks in and I haven't missed a single check-in.</p>
        <div className="aur-testimonial-author">— Priya, Plus member</div>
      </div>

      <button
        className="aur-btn-primary"
        style={{ marginTop: 4 }}
        onClick={handleStartTrial}
        disabled={purchaseState === "pending"}
      >
        {purchaseState === "pending" ? "Processing…" : "Start 7-day free trial"} <ArrowRight size={16} />
      </button>

      {purchaseState === "error" && (
        <p className="aur-error-text" role="alert" style={{ marginTop: 6, textAlign: "center" }}>
          {purchaseError}
        </p>
      )}

      <div className="aur-trustrow">
        <span><ShieldCheck size={13} /> Cancel anytime</span>
        <span><RefreshCw size={13} /> Money-back guarantee</span>
      </div>

      <button className="aur-continuefree" onClick={onClose}>Continue with Free</button>
    </div>
  );
}

/* ---------------- Shared bits ---------------- */

function TopBar({ onBack, step, of }) {
  return (
    <div className="aur-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
      <button className="aur-iconbtn" onClick={onBack}><ChevronLeft size={16} /></button>
      <div className="aur-steps">
        {Array.from({ length: of }).map((_, i) => (
          <span key={i} className={i < step ? "aur-step-done" : ""} />
        ))}
      </div>
      <div style={{ width: 30 }} />
    </div>
  );
}

function Orb({ size = 60, mode = "idle" }) {
  return (
    <div className={`aur-orb aur-orb-${mode}`} style={{ width: size, height: size }}>
      <div className="aur-orb-core" />
    </div>
  );
}

/* Lightweight animated neural/particle field — custom-drawn, no external
   images, so it stays true to the brand and license-clean. */
function NeuralField({ density = 26, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let w, h;
    const points = [];

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();

    for (let i = 0; i < density; i++) {
      points.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.6,
      });
    }

    let paused = document.hidden;

    function tick() {
      if (paused) {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i], b = points[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 90) {
            ctx.strokeStyle = `rgba(143,227,245,${0.16 * (1 - d / 90)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of points) {
        ctx.fillStyle = "rgba(143,227,245,0.55)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    // Stop redrawing (and burning battery/CPU) whenever the app is
    // backgrounded, the screen locks, or the user switches apps —
    // critical on lower-spec Fire Tablet/Fire TV hardware.
    function handleVisibility() {
      paused = document.hidden;
    }
    document.addEventListener("visibilitychange", handleVisibility);

    tick();
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [density]);

  return <canvas ref={ref} className={`aur-neuralfield ${className}`} />;
}

/* Small celebratory particle burst — fires once on task completion. */
function ConfettiBurst({ x, y, onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.clientWidth * devicePixelRatio;
    const h = canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    const colors = ["#35C8E8", "#3B5BFF", "#FFD36E", "#8FE3F5", "#4ADE80"];
    const particles = Array.from({ length: 16 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      speed: 1.4 + Math.random() * 2.2,
      size: 2 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }));
    let raf;
    function tick() {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      let alive = false;
      for (const p of particles) {
        p.life -= 0.028;
        if (p.life <= 0) continue;
        alive = true;
        const dist = (1 - p.life) * p.speed * 22;
        const px = canvas.clientWidth / 2 + Math.cos(p.angle) * dist;
        const py = canvas.clientHeight / 2 + Math.sin(p.angle) * dist - (1 - p.life) * 8;
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(tick);
      else onDone && onDone();
    }
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      className="aur-confetti"
      style={{ left: x - 30, top: y - 30 }}
    />
  );
}

function BottomNav({ screen, goTo }) {
  const items = [
    { id: "home", icon: Home, label: "Home" },
    { id: "coach", icon: MessageCircle, label: "Coach" },
    { id: "mygoals", icon: Target, label: "Goals" },
    { id: "progress", icon: TrendingUp, label: "Progress" },
    { id: "profile", icon: User, label: "Me" },
  ];
  return (
    <div className="aur-bottomnav">
      {items.map((it) => {
        const Icon = it.icon;
        const active = screen === it.id;
        return (
          <button key={it.id} className={"aur-navitem" + (active ? " aur-navitem-active" : "")} onClick={() => goTo(it.id)}>
            <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- styles ---------------- */

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#05060B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
  },
  phoneWrap: { position: "relative", zIndex: 2 },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.aur-neuralfield {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 0; opacity: 0.8;
}
.aur-neuralfield-home { height: 220px; bottom: auto; opacity: 0.5; mask-image: linear-gradient(180deg, black, transparent); }
.aur-confetti { position: absolute; width: 60px; height: 60px; pointer-events: none; z-index: 30; }

.aur-ambient {
  position: absolute; inset: -20%; z-index: 1;
  background:
    radial-gradient(circle at 20% 20%, rgba(53,200,232,0.16), transparent 45%),
    radial-gradient(circle at 80% 75%, rgba(59,91,255,0.18), transparent 45%),
    radial-gradient(circle at 50% 100%, rgba(255,211,110,0.06), transparent 40%);
  filter: blur(40px);
}

.aur-phone {
  width: 380px; height: 800px;
  background: linear-gradient(180deg, #0B0E18, #05060B);
  border-radius: 52px;
  border: 10px solid #14161f;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.65), 0 0 80px rgba(53,200,232,0.08);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: #F5F7FF;
}
.aur-notch {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
  width: 120px; height: 26px; background: #05060B; border-radius: 20px; z-index: 20;
}
.aur-statusbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 26px 4px; font-size: 13px; font-weight: 600; z-index: 15;
}
.aur-status-icons { display: flex; align-items: center; gap: 6px; }
.aur-bars { display: flex; align-items: flex-end; gap: 2px; height: 10px; }
.aur-bars i { width: 3px; background: #F5F7FF; border-radius: 1px; }
.aur-bars i:nth-child(1){height:4px;} .aur-bars i:nth-child(2){height:6px;}
.aur-bars i:nth-child(3){height:8px;} .aur-bars i:nth-child(4){height:10px;}

.aur-screen { flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; }
.aur-scroll { overflow-y: auto; }
.aur-pad { padding: 14px 20px 18px; }
.aur-col { display: flex; flex-direction: column; height: 100%; }
.aur-row { display: flex; align-items: center; }
.aur-center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }

.aur-fade-in { animation: aurFade .5s ease; }
@keyframes aurFade { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }

.aur-wordmark {
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 30px;
  letter-spacing: 6px; margin-top: 26px; background: linear-gradient(90deg,#8FE3F5,#5B7CFF);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.aur-tagline { margin-top: 12px; font-size: 13px; color: rgba(245,247,255,0.55); line-height: 1.6; }

.aur-h1 { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600; line-height: 1.25; margin: 6px 0 4px; }
.aur-sub { font-size: 13px; color: rgba(245,247,255,0.55); margin: 0 0 14px; line-height: 1.5; }
.aur-eyebrow { font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(245,247,255,0.45); font-weight: 600; }
.aur-label { font-size: 12px; color: rgba(245,247,255,0.6); margin: 18px 0 6px; }

.aur-input {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px; padding: 14px 16px; color: #F5F7FF; font-size: 15px; outline: none;
}
.aur-input:focus { border-color: rgba(93,200,232,0.5); }

.aur-socialproof { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 10px 12px; margin: 4px 0 6px; }
.aur-avatarstack { display: flex; flex-shrink: 0; }
.aur-avatarstack span { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #0B0E18; margin-left: -8px; }
.aur-avatarstack span:first-child { margin-left: 0; }
.aur-socialproof-text { display: flex; flex-direction: column; gap: 3px; font-size: 11px; color: rgba(245,247,255,0.6); line-height: 1.3; }
.aur-stars { display: flex; gap: 1px; }

.aur-orsplit { display: flex; align-items: center; gap: 10px; margin: 14px 0 10px; font-size: 11px; color: rgba(245,247,255,0.4); }
.aur-orsplit span { flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
.aur-socialrow { display: flex; gap: 10px; }
.aur-socialbtn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14); color: #F5F7FF; border-radius: 14px; padding: 12px; font-size: 13px; font-weight: 600; cursor: pointer; }
.aur-legal { font-size: 10px; color: rgba(245,247,255,0.3); text-align: center; margin-top: 12px; line-height: 1.5; }

.aur-btn-primary {
  background: linear-gradient(90deg, #35C8E8, #3B5BFF);
  color: #06070D; border: none; border-radius: 16px; padding: 15px 18px;
  font-weight: 700; font-size: 14.5px; display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; transition: opacity .15s, transform .15s, box-shadow .15s;
  box-shadow: 0 8px 24px rgba(53,200,232,0.28), 0 2px 8px rgba(59,91,255,0.2);
}
.aur-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }
.aur-btn-primary:not(:disabled):active { transform: scale(0.98); box-shadow: 0 4px 14px rgba(53,200,232,0.22); }

.aur-iconbtn {
  width: 30px; height: 30px; border-radius: 10px; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1); color: #F5F7FF; display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}

.aur-steps { display: flex; gap: 5px; }
.aur-steps span { width: 20px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.12); }
.aur-steps span.aur-step-done { background: linear-gradient(90deg,#35C8E8,#3B5BFF); }

.aur-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
.aur-chip {
  position: relative; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; padding: 16px 12px; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
  color: #F5F7FF; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s;
}
.aur-chip-active { border-color: rgba(93,200,232,0.6); background: rgba(53,200,232,0.1); }
.aur-chip-check { position: absolute; top: 10px; right: 10px; color: #35C8E8; }

.aur-rowcard {
  display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 13px 14px; cursor: pointer; color: #F5F7FF;
  text-align: left; transition: all .15s;
}
.aur-rowcard-active { border-color: rgba(93,200,232,0.6); background: rgba(53,200,232,0.1); }
.aur-rowcard-icon { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.aur-rowcard-text { flex: 1; }
.aur-rowcard-title { font-size: 14px; font-weight: 600; }
.aur-rowcard-blurb { font-size: 12px; color: rgba(245,247,255,0.5); margin-top: 2px; }

.aur-buildlist { margin-top: 26px; display: flex; flex-direction: column; gap: 14px; width: 240px; }
.aur-buildstep { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(245,247,255,0.4); transition: color .3s; }
.aur-buildstep-done { color: #F5F7FF; }
.aur-buildstep-dot {
  width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #35C8E8;
}
.aur-buildstep-done .aur-buildstep-dot { background: rgba(53,200,232,0.2); border-color: #35C8E8; }

.aur-orb { position: relative; border-radius: 50%; flex-shrink: 0; }
.aur-orb::before {
  content: ''; position: absolute; inset: -22%; border-radius: 50%;
  background: conic-gradient(from 0deg, #35C8E8, #3B5BFF, #8FE3F5, #35C8E8);
  filter: blur(18px); opacity: 0.55; animation: aurSpin 6s linear infinite;
}
.aur-orb-core {
  position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #BFF3FF, #35C8E8 40%, #1B2A6B 100%);
  box-shadow: inset 0 0 20px rgba(255,255,255,0.25);
  animation: aurBreathe 3.2s ease-in-out infinite;
}
.aur-orb-planning .aur-orb-core { background: radial-gradient(circle at 35% 30%, #E4D2FF, #7C5CFF 45%, #241B6B 100%); }
.aur-orb-listening .aur-orb-core { animation: aurBreathe 1.1s ease-in-out infinite; }
@keyframes aurSpin { to { transform: rotate(360deg); } }
@keyframes aurBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }

.aur-orbcard {
  display: flex; align-items: center; gap: 14px; margin-top: 16px; padding: 14px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px;
  position: relative; z-index: 1;
}
.aur-orbcard-label { font-size: 11px; letter-spacing: 1px; color: #35C8E8; font-weight: 700; }
.aur-orbcard-sub { font-size: 13px; margin-top: 3px; color: rgba(245,247,255,0.8); }

.aur-glass { background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 14px; backdrop-filter: blur(6px); box-shadow: 0 6px 20px rgba(0,0,0,0.18); }
.aur-focuspct { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; }
.aur-progressbar { height: 7px; border-radius: 6px; background: rgba(255,255,255,0.08); margin-top: 8px; overflow: hidden; }
.aur-progressbar-sm { height: 5px; }
.aur-progressbar-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg,#35C8E8,#3B5BFF); transition: width .4s ease; }

.aur-task { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 12px; color: #F5F7FF; font-size: 13.5px; cursor: pointer; text-align: left; }
.aur-task-done { opacity: 0.55; }
.aur-task-text-done { text-decoration: line-through; }
.aur-task-check { width: 18px; height: 18px; border-radius: 6px; border: 1.5px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #05060B; }
.aur-task-done .aur-task-check { background: linear-gradient(90deg,#35C8E8,#3B5BFF); border-color: transparent; }

.aur-insight-text { font-size: 13px; line-height: 1.55; margin: 8px 0 0; color: rgba(245,247,255,0.85); }

.aur-lockcard { margin-top: 12px; display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.18); border-radius: 16px; padding: 13px 14px; color: #F5F7FF; cursor: pointer; }

.aur-bottomnav { display: flex; justify-content: space-around; padding: 10px 6px 20px; border-top: 1px solid rgba(255,255,255,0.08); background: rgba(6,7,13,0.7); backdrop-filter: blur(10px); }
.aur-navitem { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; color: rgba(245,247,255,0.45); font-size: 10px; cursor: pointer; }
.aur-navitem-active { color: #35C8E8; }

.aur-chat { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.aur-bubble { max-width: 78%; padding: 10px 13px; border-radius: 16px; font-size: 13.5px; line-height: 1.45; }
.aur-bubble-ai { align-self: flex-start; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-bottom-left-radius: 4px; }
.aur-bubble-user { align-self: flex-end; background: linear-gradient(90deg,#35C8E8,#3B5BFF); color: #06070D; font-weight: 600; border-bottom-right-radius: 4px; }

.aur-quickreplies { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.aur-quickreply { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14); color: #F5F7FF; border-radius: 999px; padding: 8px 13px; font-size: 12.5px; cursor: pointer; }

.aur-coach-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.aur-online { font-size: 11px; color: #4ADE80; margin-top: 1px; }
.aur-coach-inputbar { display: flex; align-items: center; gap: 10px; padding: 10px 16px 14px; border-top: 1px solid rgba(255,255,255,0.08); }
.aur-fakeinput { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; padding: 10px 15px; font-size: 13px; color: rgba(245,247,255,0.4); }
.aur-mic { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(90deg,#35C8E8,#3B5BFF); border: none; display: flex; align-items: center; justify-content: center; color: #06070D; cursor: pointer; flex-shrink: 0; }

.aur-typing { display: inline-flex; gap: 3px; align-items: center; }
.aur-typing i { width: 5px; height: 5px; border-radius: 50%; background: rgba(245,247,255,0.6); animation: aurTyping 1s infinite ease-in-out; }
.aur-typing i:nth-child(2){animation-delay:.15s;} .aur-typing i:nth-child(3){animation-delay:.3s;}
@keyframes aurTyping { 0%,60%,100%{opacity:.3; transform: translateY(0);} 30%{opacity:1; transform: translateY(-3px);} }

.aur-voice { display: flex; flex-direction: column; align-items: center; height: 100%; padding: 20px; background: radial-gradient(circle at 50% 30%, rgba(53,200,232,0.12), transparent 60%); }
.aur-voice-exit { align-self: flex-start; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #F5F7FF; border-radius: 999px; padding: 7px 13px; font-size: 12px; display: flex; align-items: center; gap: 4px; cursor: pointer; }
.aur-voice-label { margin-top: 24px; font-size: 12px; letter-spacing: 1.5px; color: #35C8E8; font-weight: 700; }
.aur-voice-sub { margin-top: 8px; font-size: 14px; color: rgba(245,247,255,0.7); }
.aur-waveform { display: flex; align-items: center; gap: 3px; height: 40px; margin-top: 26px; }
.aur-waveform span { width: 3px; height: 10px; background: linear-gradient(180deg,#8FE3F5,#3B5BFF); border-radius: 2px; animation: aurWave 1s ease-in-out infinite; }
@keyframes aurWave { 0%,100%{height:8px;} 50%{height:32px;} }
.aur-voice-hint { font-size: 11px; color: rgba(245,247,255,0.35); margin-bottom: 6px; }

.aur-avatar { width: 62px; height: 62px; border-radius: 50%; background: linear-gradient(135deg,#35C8E8,#3B5BFF); display: flex; align-items: center; justify-content: center; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size: 24px; color: #06070D; }
.aur-upsell { display: flex; align-items: center; gap: 12px; background: linear-gradient(90deg, rgba(255,211,110,0.12), rgba(53,200,232,0.08)); border: 1px solid rgba(255,211,110,0.3); border-radius: 16px; padding: 13px 14px; color: #F5F7FF; cursor: pointer; }
.aur-settingsrow { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 13.5px; }
.aur-settingsval { color: rgba(245,247,255,0.5); font-size: 12.5px; }
.aur-toggle { width: 38px; height: 22px; border-radius: 999px; background: rgba(255,255,255,0.12); position: relative; display: inline-block; }
.aur-toggle i { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #F5F7FF; transition: transform .15s; }
.aur-toggle-on { background: linear-gradient(90deg,#35C8E8,#3B5BFF); }
.aur-toggle-on i { transform: translateX(16px); }
.aur-contactcard {
  margin-top: 12px; display: flex; align-items: center; gap: 12px; text-decoration: none; color: #F5F7FF;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 13px 14px; cursor: pointer;
}
.aur-contactemail { display: flex; align-items: center; gap: 5px; }
.aur-contactstatus { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(245,247,255,0.4); margin-top: 8px; padding-left: 4px; }
.aur-livedot { width: 6px; height: 6px; border-radius: 50%; background: #4ADE80; box-shadow: 0 0 6px #4ADE80; flex-shrink: 0; }
.aur-restart { margin-top: 20px; background: none; border: 1px solid rgba(255,255,255,0.14); color: rgba(245,247,255,0.6); border-radius: 12px; padding: 10px; font-size: 12.5px; cursor: pointer; }
.aur-version { text-align: center; font-size: 11px; color: rgba(245,247,255,0.25); margin-top: 12px; }

.aur-billtoggle { display: flex; background: rgba(255,255,255,0.05); border-radius: 999px; padding: 4px; margin-bottom: 16px; }
.aur-billtoggle button { flex: 1; background: none; border: none; color: rgba(245,247,255,0.6); font-size: 12.5px; font-weight: 600; padding: 9px; border-radius: 999px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
.aur-bill-active { background: linear-gradient(90deg,#35C8E8,#3B5BFF) !important; color: #06070D !important; }
.aur-save { font-size: 10px; background: rgba(6,7,13,0.2); padding: 2px 6px; border-radius: 8px; }

.aur-plancard { position: relative; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
.aur-plancard-featured { border-color: rgba(53,200,232,0.5); background: rgba(53,200,232,0.08); box-shadow: 0 10px 30px rgba(53,200,232,0.15); }
.aur-plancard-selected { border-color: #35C8E8; box-shadow: 0 0 0 2px rgba(53,200,232,0.35); }
.aur-error-text { font-size: 12px; color: #FF7A7A; }
.aur-planbadge { position: absolute; top: -9px; left: 16px; background: linear-gradient(90deg,#35C8E8,#3B5BFF); color: #06070D; font-size: 9.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 9px; border-radius: 999px; }
.aur-planprice { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; }
.aur-featurelist { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 7px; }
.aur-featurelist li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: rgba(245,247,255,0.8); }
.aur-featurelist li svg { color: #35C8E8; flex-shrink: 0; }
.aur-plansub { font-size: 10.5px; color: rgba(245,247,255,0.4); margin-top: 2px; }
.aur-ratingbadge { display: flex; align-items: center; gap: 6px; background: rgba(255,211,110,0.08); border: 1px solid rgba(255,211,110,0.25); border-radius: 999px; padding: 5px 12px; font-size: 11px; color: rgba(245,247,255,0.75); margin-top: 10px; }
.aur-testimonial { position: relative; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; padding: 16px 16px 14px; margin-top: 4px; }
.aur-quotemark { position: absolute; top: 4px; left: 12px; font-family: 'Space Grotesk', sans-serif; font-size: 36px; color: rgba(53,200,232,0.25); line-height: 1; }
.aur-testimonial p { font-size: 12.5px; line-height: 1.55; color: rgba(245,247,255,0.85); margin: 6px 0 8px; padding-left: 14px; }
.aur-testimonial-author { font-size: 11px; color: rgba(245,247,255,0.45); padding-left: 14px; }
.aur-trustrow { display: flex; justify-content: center; gap: 18px; margin-top: 12px; font-size: 11px; color: rgba(245,247,255,0.45); }
.aur-trustrow span { display: flex; align-items: center; gap: 5px; }
.aur-continuefree { background: none; border: none; color: rgba(245,247,255,0.45); font-size: 12.5px; text-align: center; margin-top: 10px; padding: 8px; cursor: pointer; text-decoration: underline; }
`;
