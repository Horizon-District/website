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

// Discord Server-Icon URL
// Permanente URL: https://cdn.discordapp.com/icons/GUILD_ID/ICON_HASH.png?size=128
// Den ICON_HASH bekommst du via Discord Bot oder Rechtsklick auf Server-Icon → Link kopieren (nicht Attachment-Link!)
// Attachment-Links (cdn.discordapp.com/attachments/...) laufen nach wenigen Tagen ab — nicht verwenden!
const DISCORD_GUILD_ICON_URL = ""; // ← permanente Icon-URL hier eintragen

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

/* ── DISCORD CUSTOM PANEL ──────────────────────────────── */

let _discordCache     = null;
let _discordCacheTime = 0;
const DISCORD_CACHE_TTL = 55_000; // 55 s — slightly under the 60s interval

/* Safely escape user-provided strings before inserting into HTML */
function _esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/* Smooth count-up animation */
function _animateCount(el, target) {
  if (!el) return;
  const start    = parseInt(el.textContent) || 0;
  if (start === target) return;
  const duration = 900;
  const t0       = performance.now();
  const tick = (now) => {
    const p    = Math.min((now - t0) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = Math.round(start + (target - start) * ease);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* Animate SVG ring track (stroke-dashoffset) based on ratio 0-1 */
function _animateRing(ratio) {
  const track = document.getElementById('dp-ring-track');
  if (!track) return;
  const circumference = 213.7;
  // dashoffset = circumference * (1 - ratio); clamp ratio 0.08–1 for visual
  const clamped = Math.max(0.08, Math.min(ratio, 1));
  track.style.strokeDashoffset = circumference * (1 - clamped);
}

/* Build the avatar HTML for a member (36px default) */
function _memberAvatar(member, size = 36) {
  const cls  = size === 36 ? 'dp-member-av' : 'dp-voice-av';
  const fbCls = size === 36 ? 'dp-member-av-fallback' : 'dp-voice-av-fallback';
  const initial = member.username ? _esc(member.username.charAt(0).toUpperCase()) : '?';
  if (member.avatar_url) {
    // avatar_url comes from Discord CDN — safe to embed as img src
    return `<img class="${cls}" src="${_esc(member.avatar_url)}" alt="${_esc(member.username)}" width="${size}" height="${size}" loading="lazy"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="${fbCls}" style="display:none">${initial}</div>`;
  }
  return `<div class="${fbCls}">${initial}</div>`;
}

const _STATUS_ORDER = { online: 0, idle: 1, dnd: 2 };
const _STATUS_LABEL = { online: 'Online', idle: 'Abwesend', dnd: 'Nicht stören' };

/* ── Main fetch & render ── */
async function fetchDiscordPanel() {
  const now = Date.now();

  // Return cached data if still fresh
  if (_discordCache && (now - _discordCacheTime) < DISCORD_CACHE_TTL) {
    _renderDiscordPanel(_discordCache);
    return;
  }

  try {
    const res = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    _discordCache     = data;
    _discordCacheTime = now;
    _renderDiscordPanel(data);

  } catch (_err) {
    _renderDiscordError();
  }
}

function _renderDiscordPanel(data) {
  const presenceCount = data.presence_count ?? 0;
  const members       = Array.isArray(data.members)  ? data.members  : [];
  const channels      = Array.isArray(data.channels) ? data.channels : [];
  const inviteUrl     = data.instant_invite || 'https://discord.gg/SJpPEtrmrq';

  /* ── Guild name (in case it changed) ── */
  const nameEl = document.getElementById('dp-guild-name');
  if (nameEl && data.name) nameEl.textContent = data.name;

  /* ── Guild Icon ── */
  const iconImg      = document.getElementById('dp-guild-icon-img');
  const iconFallback = document.getElementById('dp-guild-icon-fallback');
  if (iconImg && DISCORD_GUILD_ICON_URL) {
    iconImg.src = DISCORD_GUILD_ICON_URL;
    iconImg.style.display = 'block';
    if (iconFallback) iconFallback.style.display = 'none';
  }

  /* ── Online count + ring ── */
  _animateCount(document.getElementById('dp-online-count'), presenceCount);
  const maxReasonable = Math.max(presenceCount, 50);
  _animateRing(presenceCount / maxReasonable);

  const pillEl = document.getElementById('dp-count-pill');
  if (pillEl) pillEl.textContent = members.length || presenceCount || '0';

  /* ── Connection status ── */
  const statusEl = document.getElementById('dp-connection-status');
  if (statusEl) {
    statusEl.innerHTML =
      `<span class="dp-inline-dot status-online"></span><span>Verbunden mit Discord</span>`;
  }

  /* ── Update hero stat in the header (existing element) ── */
  const heroStat = document.getElementById('stat-discord-count');
  if (heroStat) _animateCount(heroStat, presenceCount);

  /* ── Update join button invite URL ── */
  const joinBtn = document.getElementById('dp-join-btn');
  if (joinBtn && inviteUrl) joinBtn.href = inviteUrl;

  /* ── Render members ── */
  const membersEl = document.getElementById('dp-members-list');
  if (membersEl) {
    if (members.length === 0) {
      membersEl.innerHTML =
        `<div class="dp-no-members">Aktuell keine sichtbaren Mitglieder online.<br>
         <small>Ändere deine Datenschutz-Einstellungen im Discord, um hier zu erscheinen.</small></div>`;
    } else {
      const sorted = [...members].sort((a, b) =>
        (_STATUS_ORDER[a.status] ?? 9) - (_STATUS_ORDER[b.status] ?? 9)
      );
      membersEl.innerHTML = sorted.map((m, i) => {
        const status   = _STATUS_ORDER[m.status] != null ? m.status : 'online';
        const activity = m.game?.name
          ? _esc(m.game.name)
          : (_STATUS_LABEL[status] || 'Online');
        return `
          <div class="dp-member" role="listitem" style="animation-delay:${i * 45}ms">
            <div class="dp-member-av-wrap">
              ${_memberAvatar(m, 36)}
              <span class="dp-status-ring ${status}" title="${_STATUS_LABEL[status] || 'Online'}"></span>
            </div>
            <div class="dp-member-info">
              <div class="dp-member-name">${_esc(m.username)}</div>
              <div class="dp-member-activity">${activity}</div>
            </div>
            <span class="dp-member-tag ${status}">${_STATUS_LABEL[status] || 'Online'}</span>
          </div>`;
      }).join('');
    }
  }

  /* ── Render voice channels ── */
  const voiceWrap = document.getElementById('dp-voice-wrap');
  const voiceList = document.getElementById('dp-voice-list');
  const activeChannels = channels.filter(c => c.members && c.members.length > 0);

  if (voiceWrap && voiceList && activeChannels.length > 0) {
    voiceList.innerHTML = activeChannels.map(ch => {
      const membersHtml = ch.members.map(m =>
        `<div class="dp-voice-member">
           ${_memberAvatar(m, 20)}
           <span>${_esc(m.username)}</span>
         </div>`
      ).join('');

      return `
        <div class="dp-voice-channel">
          <div class="dp-voice-channel-name">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            ${_esc(ch.name)}
          </div>
          <div class="dp-voice-members">${membersHtml}</div>
        </div>`;
    }).join('');
    voiceWrap.style.display = 'block';
  } else if (voiceWrap) {
    voiceWrap.style.display = 'none';
  }
}

function _renderDiscordError() {
  const statusEl = document.getElementById('dp-connection-status');
  if (statusEl) {
    statusEl.innerHTML =
      `<span class="dp-inline-dot status-error"></span><span>Widget nicht verfügbar</span>`;
  }
  const countEl = document.getElementById('dp-online-count');
  if (countEl) countEl.textContent = '—';

  const membersEl = document.getElementById('dp-members-list');
  if (membersEl) {
    membersEl.innerHTML =
      `<div class="dp-api-error">Widget API nicht erreichbar.<br>
       <small>Aktiviere das Discord Widget unter Server-Einstellungen → Widget.</small></div>`;
  }
}

/* ── INIT ───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  fetchFiveMStatus();
  fetchDiscordPanel();

  // Status alle 60 Sekunden aktualisieren
  setInterval(fetchFiveMStatus,  60_000);
  setInterval(fetchDiscordPanel, 60_000);
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
