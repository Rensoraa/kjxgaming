/* ==========================================
   PAGE LOADER
========================================== */
(function () {
  const bar    = document.getElementById('loader-bar');
  const status = document.getElementById('loader-status');
  const loader = document.getElementById('page-loader');
  const steps  = ['Booting…', 'Loading assets…', 'Fetching rank…', 'Done.'];
  let pct = 0;
  let step = 0;

  const iv = setInterval(() => {
    const increment = step < 2 ? 22 : step < 3 ? 18 : 40;
    pct = Math.min(pct + increment, 100);
    bar.style.width = pct + '%';
    status.textContent = steps[Math.min(step, steps.length - 1)];
    step++;
    if (pct >= 100) {
      clearInterval(iv);
      setTimeout(() => {
        loader.classList.add('hidden');
        // trigger entrance animations
        document.querySelectorAll('.animate-in').forEach((el, i) => {
          setTimeout(() => el.classList.add('visible'), i * 120);
        });
      }, 400);
    }
  }, 380);
})();

/* ==========================================
   CANVAS PARTICLE BACKGROUND
========================================== */
(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];
  const COUNT = 80;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); initParticles(); });

  function randomBetween(a, b) { return a + Math.random() * (b - a); }

  function initParticles() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      const isRed = Math.random() < 0.35;
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: randomBetween(0.6, 2.2),
        vx: randomBetween(-0.15, 0.15),
        vy: randomBetween(-0.18, -0.04),
        alpha: randomBetween(0.15, 0.55),
        red: isRed,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: randomBetween(0.008, 0.022),
      });
    }
  }
  initParticles();

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p = particles[i], q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.12;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          const color = (p.red || q.red) ? `rgba(255,40,40,${alpha})` : `rgba(255,255,255,${alpha * 0.5})`;
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();

    particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.red
        ? `rgba(255,${40 + Math.floor(Math.sin(p.pulse) * 20)},40,${alpha})`
        : `rgba(220,220,220,${alpha})`;
      ctx.fill();

      // subtle glow for red particles
      if (p.red && p.r > 1.4) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,0,0,${alpha * 0.12})`;
        ctx.fill();
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -10)    { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -10)    p.x = W + 5;
      if (p.x > W + 10) p.x = -5;
    });

    requestAnimationFrame(animate);
  }
  animate();
})();

/* ==========================================
   CLOCK — Your time (browser) vs My time (Belgium / Brussels)
========================================== */
function updateClocks() {
  const now = new Date();

  // User's local time
  const yourStr = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  document.getElementById('your-time').textContent = yourStr;

  // Belgium time (Europe/Brussels)
  const myStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Europe/Brussels'
  });
  document.getElementById('my-time').textContent = myStr;
}
updateClocks();
setInterval(updateClocks, 1000);

/* ==========================================
   VALORANT — MMR / Rank card
========================================== */
const RANK_IMAGE_BASE      = "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/";
const SEASON_START_EPISODE = 10;
const SEASON_BASE          = 25;

async function loadValorant() {
  const container = document.getElementById('valo-data');
  try {
    const res  = await fetch('https://api.henrikdev.xyz/valorant/v2/mmr/eu/Kjxgaming/Echo?api_key=HDEV-7271bd4f-5054-477c-bf2b-0267b3cfd4df');
    const json = await res.json();

    if (!json.data || !json.data.current_data) {
      container.innerHTML = '<p style="color:#555;">No data found.</p>';
      return;
    }

    const d          = json.data.current_data;
    const tier       = d.currenttier;
    const rankName   = d.currenttierpatched;
    const rr         = d.ranking_in_tier;
    const rrChange   = d.mmr_change_to_last_game;
    const elo        = d.elo;
    const imgUrl     = `${RANK_IMAGE_BASE}${tier}/largeicon.png`;
    const highest    = json.data.highest_rank;
    const peakName   = highest ? highest.patched_tier : '—';
    const peakSeason = highest ? (() => {
      const match = highest.season.match(/^e(\d+)a(\d+)$/);
      if (!match) return highest.season.toUpperCase();
      const episode = parseInt(match[1], 10);
      const act     = parseInt(match[2], 10);
      if (episode < SEASON_START_EPISODE) return `Episode ${episode} Act ${act}`;
      const season = SEASON_BASE + (episode - SEASON_START_EPISODE);
      return `Season ${season} Act ${act}`;
    })() : '';

    const changeColor = rrChange > 0 ? '#4ade80' : rrChange < 0 ? '#f87171' : '#aaa';
    const changeSign  = rrChange > 0 ? '+' : '';

    container.innerHTML = `
      <div class="valo-card">
        <img class="valo-rank-img" src="${imgUrl}" alt="${rankName}" />
        <div class="valo-info">
          <div class="valo-rank-name">${rankName}</div>
          <div class="valo-rr-bar-wrap">
            <div class="valo-rr-bar" style="width:${rr}%"></div>
          </div>
          <div class="valo-stats-row">
            <span class="valo-stat"><span class="valo-stat-label">RR</span>&nbsp;${rr}<span style="color:#555">/100</span></span>
            <span class="valo-stat"><span class="valo-stat-label">Last</span>&nbsp;<span style="color:${changeColor}">${changeSign}${rrChange} RR</span></span>
            <span class="valo-stat"><span class="valo-stat-label">ELO</span>&nbsp;${elo}</span>
          </div>
          <div class="valo-peak">Peak: <strong>${peakName}</strong> <span style="color:#555;font-size:0.75rem;">${peakSeason}</span></div>
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<p style="color:#555;">API error or rate limited — try again later.</p>';
  }
}

/* ==========================================
   VALORANT — Match history
========================================== */
let matchesLoaded = false;
let matchesOpen   = false;

async function loadMatches() {
  const container = document.getElementById('matches-data');
  container.innerHTML = '<p style="color:#555;font-size:0.85rem;padding:0.6rem 0;">Loading matches…</p>';
  try {
    const res  = await fetch('https://api.henrikdev.xyz/valorant/v3/matches/eu/Kjxgaming/Echo?api_key=HDEV-7271bd4f-5054-477c-bf2b-0267b3cfd4df');
    const json = await res.json();

    if (!json.data) {
      container.innerHTML = '<p style="color:#555;">No match data found.</p>';
      return;
    }

    const matches = json.data
      .filter(m => m.metadata.mode === 'Competitive')
      .slice(0, 10);

    if (!matches.length) {
      container.innerHTML = '<center><p style="color:#555;">No competitive matches found.</p></center>';
      return;
    }

    const rows = matches.map(m => {
      const meta = m.metadata;
      const me   = m.players.all_players.find(p =>
        p.name.toLowerCase() === 'kjxgaming' ||
        p.puuid === '291f6370-dcb8-5332-b71f-088671d896b5'
      );
      const myTeam      = me ? me.team.toLowerCase() : null;
      const won         = myTeam && m.teams[myTeam] ? m.teams[myTeam].has_won : null;
      const result      = won === true ? 'WIN' : won === false ? 'LOSS' : '—';
      const resultColor = result === 'WIN' ? '#4ade80' : result === 'LOSS' ? '#f87171' : '#aaa';
      const kda         = me ? `${me.stats.kills} / ${me.stats.deaths} / ${me.stats.assists}` : '— / — / —';
      const agent       = me ? me.character : '—';
      const acs         = me && meta.rounds_played > 0 ? Math.round(me.stats.score / meta.rounds_played) : '—';
      const date        = new Date(meta.game_start * 1000);
      const dateStr     = date.toLocaleDateString('en-GB', { day:'2-digit', month:'short' });

      return `
        <div class="match-row">
          <span class="match-result" style="color:${resultColor}">${result}</span>
          <span class="match-map">${meta.map}</span>
          <span class="match-agent">${agent}</span>
          <span class="match-kda">${kda}</span>
          <span class="match-acs"><span class="valo-stat-label">ACS</span>&nbsp;${acs}</span>
          <span class="match-date">${dateStr}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="match-header">
        <span>Result</span><span>Map</span><span>Agent</span><span>K / D / A</span><span>ACS</span><span>Date</span>
      </div>
      ${rows}
    `;
  } catch (e) {
    container.innerHTML = '<p style="color:#555;">Could not load matches — rate limited or API error.</p>';
  }
}

function toggleMatches() {
  const wrap = document.getElementById('matches-wrap');
  const btn  = document.getElementById('matches-toggle-btn');
  matchesOpen = !matchesOpen;
  if (matchesOpen) {
    wrap.classList.add('open');
    btn.innerHTML = '&#9660;&nbsp; Hide Matches';
    if (!matchesLoaded) { matchesLoaded = true; loadMatches(); }
  } else {
    wrap.classList.remove('open');
    btn.innerHTML = '&#9654;&nbsp; Display Matches';
  }
}

/* ==========================================
   PFP / Favicon dynamic
========================================== */
(function () {
  fetch("https://pfpsystem.itsnielsje.workers.dev/", { headers: { "Accept": "application/json" } })
    .then(r => r.json())
    .then(data => {
      if (!data.url) return;
      const url = data.url;
      function upsert(sel, tag, attrs) {
        let el = document.querySelector(sel) || document.createElement(tag);
        Object.keys(attrs).forEach(k => {
          if (k === 'href' || k === 'content') el[k] = attrs[k];
          else el.setAttribute(k, attrs[k]);
        });
        document.head.appendChild(el);
      }
      upsert("link[rel='icon']",             "link", { rel:"icon",             type:"image/png", href:url });
      upsert("link[rel='shortcut icon']",    "link", { rel:"shortcut icon",    type:"image/png", href:url });
      upsert("link[rel='apple-touch-icon']", "link", { rel:"apple-touch-icon",                   href:url });
    })
    .catch(() => {});
})();

/* ==========================================
   INIT
========================================== */
document.addEventListener('DOMContentLoaded', loadValorant);
