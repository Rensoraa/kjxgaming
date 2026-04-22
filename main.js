/* ==========================================
   BOOT — wait for DOM before doing anything
========================================== */
document.addEventListener('DOMContentLoaded', function () {

  /* ========================================
     PAGE LOADER
  ========================================= */
  const bar    = document.getElementById('loader-bar');
  const status = document.getElementById('loader-status');
  const loader = document.getElementById('page-loader');

  if (bar && status && loader) {
    const steps = ['Booting…', 'Loading assets…', 'Fetching rank…', 'Done.'];
    let pct  = 0;
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
          // Staggered entrance animations
          document.querySelectorAll('.animate-in').forEach(function (el, i) {
            setTimeout(function () { el.classList.add('visible'); }, i * 120);
          });
        }, 400);
      }
    }, 380);
  }

  /* ========================================
     VALORANT — MMR / Rank card
  ========================================= */
  loadValorant();

  /* ========================================
     PFP / Favicon dynamic
  ========================================= */
  fetch('https://pfpsystem.itsnielsje.workers.dev/', { headers: { 'Accept': 'application/json' } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.url) return;
      var url = data.url;
      function upsert(sel, tag, attrs) {
        var el = document.querySelector(sel) || document.createElement(tag);
        Object.keys(attrs).forEach(function (k) {
          if (k === 'href' || k === 'content') el[k] = attrs[k];
          else el.setAttribute(k, attrs[k]);
        });
        document.head.appendChild(el);
      }
      upsert("link[rel='icon']",             'link', { rel: 'icon',             type: 'image/png', href: url });
      upsert("link[rel='shortcut icon']",    'link', { rel: 'shortcut icon',    type: 'image/png', href: url });
      upsert("link[rel='apple-touch-icon']", 'link', { rel: 'apple-touch-icon',                    href: url });
    })
    .catch(function () { /* silent — fallback favicon stays */ });

}); // end DOMContentLoaded

/* ==========================================
   CANVAS PARTICLE BACKGROUND
   (runs immediately — canvas doesn't need DOM ready in the same way,
    but we guard with a check just in case)
========================================== */
(function () {
  function startCanvas() {
    var canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H, particles = [];
    var COUNT = 80;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', function () { resize(); initParticles(); });

    function randomBetween(a, b) { return a + Math.random() * (b - a); }

    function initParticles() {
      particles = [];
      for (var i = 0; i < COUNT; i++) {
        var isRed = Math.random() < 0.35;
        particles.push({
          x:          Math.random() * W,
          y:          Math.random() * H,
          r:          randomBetween(0.6, 2.2),
          vx:         randomBetween(-0.15, 0.15),
          vy:         randomBetween(-0.18, -0.04),
          alpha:      randomBetween(0.15, 0.55),
          red:        isRed,
          pulse:      Math.random() * Math.PI * 2,
          pulseSpeed: randomBetween(0.008, 0.022),
        });
      }
    }
    initParticles();

    function drawConnections() {
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var p = particles[i], q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            var a = (1 - dist / 120) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = (p.red || q.red)
              ? 'rgba(255,40,40,' + a + ')'
              : 'rgba(255,255,255,' + (a * 0.5) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, W, H);
      drawConnections();

      particles.forEach(function (p) {
        p.pulse += p.pulseSpeed;
        var alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.red
          ? 'rgba(255,' + (40 + Math.floor(Math.sin(p.pulse) * 20)) + ',40,' + alpha + ')'
          : 'rgba(220,220,220,' + alpha + ')';
        ctx.fill();

        // subtle glow for larger red particles
        if (p.red && p.r > 1.4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,0,0,' + (alpha * 0.12) + ')';
          ctx.fill();
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10)     { p.y = H + 5; p.x = Math.random() * W; }
        if (p.x < -10)     p.x = W + 5;
        if (p.x > W + 10)  p.x = -5;
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  // Canvas element is in the body so wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCanvas);
  } else {
    startCanvas();
  }
})();

/* ==========================================
   CLOCK — Your time (browser) vs My time (Belgium / Brussels)
========================================== */
function updateClocks() {
  var now = new Date();

  var yourEl = document.getElementById('your-time');
  var myEl   = document.getElementById('my-time');
  if (!yourEl || !myEl) return;

  yourEl.textContent = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  myEl.textContent = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Europe/Brussels'
  });
}
updateClocks();
setInterval(updateClocks, 1000);

/* ==========================================
   VALORANT — MMR / Rank card
========================================== */
var RANK_IMAGE_BASE      = 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/';
var SEASON_START_EPISODE = 10;
var SEASON_BASE          = 25;

function loadValorant() {
  var container = document.getElementById('valo-data');
  if (!container) return;

  fetch('https://api.henrikdev.xyz/valorant/v2/mmr/eu/Kjxgaming/Echo?api_key=HDEV-7271bd4f-5054-477c-bf2b-0267b3cfd4df')
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (!json.data || !json.data.current_data) {
        container.innerHTML = '<p style="color:#555;">No data found.</p>';
        return;
      }

      var d        = json.data.current_data;
      var tier     = d.currenttier;
      var rankName = d.currenttierpatched;
      var rr       = d.ranking_in_tier;
      var rrChange = d.mmr_change_to_last_game;
      var elo      = d.elo;
      var imgUrl   = RANK_IMAGE_BASE + tier + '/largeicon.png';
      var highest  = json.data.highest_rank;
      var peakName = highest ? highest.patched_tier : '—';
      var peakSeason = '';

      if (highest) {
        var m = highest.season.match(/^e(\d+)a(\d+)$/);
        if (!m) {
          peakSeason = highest.season.toUpperCase();
        } else {
          var episode = parseInt(m[1], 10);
          var act     = parseInt(m[2], 10);
          if (episode < SEASON_START_EPISODE) {
            peakSeason = 'Episode ' + episode + ' Act ' + act;
          } else {
            peakSeason = 'Season ' + (SEASON_BASE + (episode - SEASON_START_EPISODE)) + ' Act ' + act;
          }
        }
      }

      var changeColor = rrChange > 0 ? '#4ade80' : rrChange < 0 ? '#f87171' : '#aaa';
      var changeSign  = rrChange > 0 ? '+' : '';

      container.innerHTML =
        '<div class="valo-card">' +
          '<img class="valo-rank-img" src="' + imgUrl + '" alt="' + rankName + '" />' +
          '<div class="valo-info">' +
            '<div class="valo-rank-name">' + rankName + '</div>' +
            '<div class="valo-rr-bar-wrap"><div class="valo-rr-bar" style="width:' + rr + '%"></div></div>' +
            '<div class="valo-stats-row">' +
              '<span class="valo-stat"><span class="valo-stat-label">RR</span>&nbsp;' + rr + '<span style="color:#555">/100</span></span>' +
              '<span class="valo-stat"><span class="valo-stat-label">Last</span>&nbsp;<span style="color:' + changeColor + '">' + changeSign + rrChange + ' RR</span></span>' +
              '<span class="valo-stat"><span class="valo-stat-label">ELO</span>&nbsp;' + elo + '</span>' +
            '</div>' +
            '<div class="valo-peak">Peak: <strong>' + peakName + '</strong> <span style="color:#555;font-size:0.75rem;">' + peakSeason + '</span></div>' +
          '</div>' +
        '</div>';
    })
    .catch(function () {
      container.innerHTML = '<p style="color:#555;">API error or rate limited — try again later.</p>';
    });
}

/* ==========================================
   VALORANT — Match history
========================================== */
var matchesLoaded = false;
var matchesOpen   = false;

function loadMatches() {
  var container = document.getElementById('matches-data');
  if (!container) return;
  container.innerHTML = '<p style="color:#555;font-size:0.85rem;padding:0.6rem 0;">Loading matches…</p>';

  fetch('https://api.henrikdev.xyz/valorant/v3/matches/eu/FNC%20Kjxgaming/PRAY?api_key=HDEV-7271bd4f-5054-477c-bf2b-0267b3cfd4df')
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (!json.data) {
        container.innerHTML = '<p style="color:#555;">No match data found.</p>';
        return;
      }

      var matches = json.data
        .filter(function (m) { return m.metadata.mode === 'Competitive'; })
        .slice(0, 10);

      if (!matches.length) {
        container.innerHTML = '<p style="color:#555;text-align:center;">No competitive matches found.</p>';
        return;
      }

      var rows = matches.map(function (m) {
        var meta = m.metadata;
        var me   = m.players.all_players.find(function (p) {
          return p.name.toLowerCase() === 'kjxgaming' ||
                 p.puuid === '291f6370-dcb8-5332-b71f-088671d896b5';
        });
        var myTeam      = me ? me.team.toLowerCase() : null;
        var won         = myTeam && m.teams[myTeam] ? m.teams[myTeam].has_won : null;
        var result      = won === true ? 'WIN' : won === false ? 'LOSS' : '—';
        var resultColor = result === 'WIN' ? '#4ade80' : result === 'LOSS' ? '#f87171' : '#aaa';
        var kda         = me ? (me.stats.kills + ' / ' + me.stats.deaths + ' / ' + me.stats.assists) : '— / — / —';
        var agent       = me ? me.character : '—';
        var acs         = me && meta.rounds_played > 0 ? Math.round(me.stats.score / meta.rounds_played) : '—';
        var dateStr     = new Date(meta.game_start * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

        return '<div class="match-row">' +
          '<span class="match-result" style="color:' + resultColor + '">' + result + '</span>' +
          '<span class="match-map">' + meta.map + '</span>' +
          '<span class="match-agent">' + agent + '</span>' +
          '<span class="match-kda">' + kda + '</span>' +
          '<span class="match-acs"><span class="valo-stat-label">ACS</span>&nbsp;' + acs + '</span>' +
          '<span class="match-date">' + dateStr + '</span>' +
        '</div>';
      }).join('');

      container.innerHTML =
        '<div class="match-header">' +
          '<span>Result</span><span>Map</span><span>Agent</span><span>K / D / A</span><span>ACS</span><span>Date</span>' +
        '</div>' + rows;
    })
    .catch(function () {
      container.innerHTML = '<p style="color:#555;">Could not load matches — rate limited or API error.</p>';
    });
}

function toggleMatches() {
  var wrap = document.getElementById('matches-wrap');
  var btn  = document.getElementById('matches-toggle-btn');
  if (!wrap || !btn) return;

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
