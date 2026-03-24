/* ══════════════════════════════════════════════════════════
   Horizon District — Script
   - Navbar scroll effect
   - Mobile menu
   - Scroll animations
   - FiveM server status (CFX API — bereit für echten Code)
   - Discord member count
   ══════════════════════════════════════════════════════════ */

/* ── CONFIG ─────────────────────────────────────────────── */
// CFX-Servercode — cfx.re/join/6abpq7
const CFX_CODE = "6abpq7";

// Discord Server ID ist bereits eingetragen
const DISCORD_GUILD_ID = "1479555991547940954";

/* ── NAVBAR SCROLL ──────────────────────────────────────── */
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 30) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
}, { passive: true });

/* ── MOBILE MENU ────────────────────────────────────────── */
const hamburger = document.getElementById("nav-hamburger");
const navLinks  = document.getElementById("nav-links");

hamburger.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", isOpen);
  const spans = hamburger.querySelectorAll("span");
  if (isOpen) {
    spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
    spans[1].style.opacity   = "0";
    spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
  } else {
    spans[0].style.transform = "";
    spans[1].style.opacity   = "";
    spans[2].style.transform = "";
  }
});

// Schließt das Menü beim Klick auf einen Link
navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    const spans = hamburger.querySelectorAll("span");
    spans[0].style.transform = "";
    spans[1].style.opacity   = "";
    spans[2].style.transform = "";
  });
});

/* ── SCROLL ANIMATIONS ─────────────────────────────────── */
const fadeElements = document.querySelectorAll(
  ".feature-card, .team-card, .roadmap-item, .status-info-card, .step-card, .rule-card, .section-title, .section-sub, .job-card, .car-card, .district-card"
);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Staggered delay basierend auf Index im Parent
      const siblings = Array.from(entry.target.parentElement.children);
      const idx = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${idx * 60}ms`;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

fadeElements.forEach(el => {
  el.classList.add("fade-up");
  observer.observe(el);
});

/* ── FIVEM SERVER STATUS ───────────────────────────────── */
async function fetchFiveMStatus() {
  if (!CFX_CODE) {
    // Kein CFX-Code hinterlegt — zeige "In Entwicklung"
    document.getElementById("stat-players").textContent = "—";
    document.getElementById("stat-status").textContent  = "In Bau";
    document.getElementById("server-status-text").textContent = "In Entwicklung";
    document.getElementById("player-count").textContent = "0 / 0";
    return;
  }

  try {
    // FiveM API — gibt Serverinfos zurück wenn Server online ist
    const res = await fetch(
      `https://servers-live.fivem.net/api/servers/single/${CFX_CODE}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error("Server nicht erreichbar");
    const data = await res.json();
    const info = data.Data;

    const playersNow = info?.clients ?? 0;
    const maxPlayers = info?.sv_maxclients ?? 64;
    const hostname   = info?.hostname ?? "Horizon District";

    // Hero Stats
    document.getElementById("stat-players").textContent = playersNow;
    document.getElementById("stat-status").textContent  = "Online";
    document.getElementById("stat-status").style.color  = "#22C55E";

    // Status Section
    const dot = document.querySelector(".status-dot");
    dot.classList.remove("offline");
    dot.classList.add("online");
    document.getElementById("server-status-text").textContent = "Online";
    document.getElementById("server-status-text").style.color = "#22C55E";
    document.getElementById("player-count").textContent = `${playersNow} / ${maxPlayers}`;

    // Connect Button aktivieren
    const connectBtn  = document.getElementById("connect-btn");
    const connectNote = document.getElementById("connect-note");
    connectBtn.disabled = false;
    connectNote.textContent = "Klicke zum direkten Verbinden mit dem Server";
    connectBtn.addEventListener("click", () => {
      window.location.href = `fivem://connect/cfx.re/join/${CFX_CODE}`;
    });

  } catch (err) {
    // Server offline oder API nicht erreichbar
    document.getElementById("stat-players").textContent = "0";
    document.getElementById("stat-status").textContent  = "Offline";
    document.getElementById("stat-status").style.color  = "#FF6B1A";
    document.getElementById("server-status-text").textContent = "Offline";
    document.getElementById("player-count").textContent = "0 / 0";
  }
}

/* ── DISCORD MEMBER COUNT ──────────────────────────────── */
async function fetchDiscordCount() {
  try {
    // Discord Widget API gibt Member-Zahlen zurück
    const res = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error("Discord API nicht erreichbar");
    const data = await res.json();

    const online = data.presence_count ?? 0;
    document.getElementById("stat-discord-count").textContent = online > 0 ? online : "—";

  } catch (err) {
    document.getElementById("stat-discord-count").textContent = "—";
  }
}

/* ── INIT ───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  fetchFiveMStatus();
  fetchDiscordCount();

  // Status alle 60 Sekunden aktualisieren
  setInterval(fetchFiveMStatus, 60_000);
  setInterval(fetchDiscordCount, 60_000);
});
/* ── JOBS TABS ──────────────────────────────────────────── */
document.querySelectorAll('.jobs-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.jobs-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.jobs-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById('panel-' + tab).classList.remove('hidden');
  });
});
