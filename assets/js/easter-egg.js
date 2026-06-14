/* ═══════════════════════════════════════════════════════════
   EASTER EGG — Shooting Stars  v2  (no storage whatsoever)
═══════════════════════════════════════════════════════════ */
'use strict';

(function () {

    var STARS = [
        { id: 'star-hero', section: 'hero', rgb: '0,229,255', hex: '#00E5FF' },
        { id: 'star-about', section: 'about', rgb: '123,97,255', hex: '#7B61FF' },
        { id: 'star-skills', section: 'skills', rgb: '255,209,102', hex: '#FFD166' },
        { id: 'star-systems', section: 'systems', rgb: '0,255,136', hex: '#00FF88' },
        { id: 'star-footer', section: 'contact', rgb: '255,63,250', hex: '#FF3FFB' }    ];

    var TOTAL = STARS.length;
    var TAIL_LEN = 68;
    var HEAD_R = 2.4;
    var GLOW_R = 10;
    var SPEED_MIN = 1.3;
    var SPEED_MAX = 2.0;
    var CLICK_R = 28;

    var collectedCount = 0;   /* plain number, lives only in RAM */
    var collectedIds = {};  /* plain object, same */
    var stars = [];
    var canvas, ctx;
    var spriteImgs = {};  /* keyed by section id */
    var SPRITE_SIZE = 32;

    var SPRITE_SVGS = {
        'hero': [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">',
            '<rect x="6" y="14" width="1" height="1" fill="rgba(0,229,255,0.5)"/>',
            '<rect x="9" y="14" width="1" height="1" fill="rgba(0,229,255,0.5)"/>',
            '<rect x="6" y="13" width="4" height="1" fill="rgba(255,209,102,0.6)"/>',
            '<rect x="7" y="14" width="2" height="1" fill="#FFD166"/>',
            '<rect x="7" y="15" width="2" height="1" fill="rgba(255,209,102,0.35)"/>',
            '<rect x="4" y="11" width="2" height="2" fill="#7B61FF"/>',
            '<rect x="4" y="10" width="1" height="1" fill="#5A44CC"/>',
            '<rect x="10" y="11" width="2" height="2" fill="#7B61FF"/>',
            '<rect x="11" y="10" width="1" height="1" fill="#5A44CC"/>',
            '<rect x="6" y="10" width="4" height="3" fill="#00c8e0"/>',
            '<rect x="6" y="7" width="4" height="3" fill="#00d4f0"/>',
            '<rect x="6" y="5" width="4" height="2" fill="#00E5FF"/>',
            '<rect x="6" y="5" width="1" height="8" fill="rgba(0,0,0,0.12)"/>',
            '<rect x="9" y="5" width="1" height="8" fill="rgba(255,255,255,0.08)"/>',
            '<rect x="6" y="10" width="4" height="1" fill="#00b0c8"/>',
            '<rect x="6" y="4" width="4" height="1" fill="#9B84FF"/>',
            '<rect x="7" y="3" width="2" height="1" fill="#b0a0ff"/>',
            '<rect x="7" y="2" width="2" height="1" fill="#c4b8ff"/>',
            '<rect x="8" y="1" width="1" height="1" fill="#ffffff"/>',
            '<rect x="7" y="7" width="2" height="2" fill="#ffffff"/>',
            '<rect x="7" y="7" width="1" height="1" fill="#e0f8ff"/>',
            '<rect x="8" y="8" width="1" height="1" fill="#7B61FF"/>',
            '<rect x="6" y="7" width="1" height="2" fill="#00a8c0"/>',
            '<rect x="9" y="7" width="1" height="2" fill="#00a8c0"/>',
            '<rect x="7" y="6" width="2" height="1" fill="#00a8c0"/>',
            '<rect x="7" y="9" width="2" height="1" fill="#00a8c0"/>',
            '</svg>'
        ].join(''),

        'about': [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">',
            '<rect x="4" y="0" width="1" height="1" fill="#00E5FF"/>',
            '<rect x="4" y="1" width="1" height="2" fill="#7B61FF"/>',
            '<rect x="11" y="0" width="1" height="1" fill="#00E5FF"/>',
            '<rect x="10" y="1" width="1" height="2" fill="#7B61FF"/>',
            '<rect x="4" y="3" width="8" height="1" fill="#00c8e0"/>',
            '<rect x="3" y="4" width="10" height="1" fill="#00d4f0"/>',
            '<rect x="3" y="5" width="10" height="1" fill="#00d4f0"/>',
            '<rect x="3" y="6" width="10" height="1" fill="#00c0d8"/>',
            '<rect x="3" y="7" width="10" height="1" fill="#00b8d0"/>',
            '<rect x="4" y="8" width="8" height="1" fill="#00b0c8"/>',
            '<rect x="4" y="4" width="3" height="3" fill="#ffffff"/>',
            '<rect x="5" y="5" width="1" height="1" fill="#7B61FF"/>',
            '<rect x="5" y="4" width="1" height="1" fill="#e0f8ff"/>',
            '<rect x="9" y="4" width="3" height="3" fill="#ffffff"/>',
            '<rect x="10" y="5" width="1" height="1" fill="#7B61FF"/>',
            '<rect x="10" y="4" width="1" height="1" fill="#e0f8ff"/>',
            '<rect x="4" y="3" width="3" height="1" fill="rgba(123,97,255,0.3)"/>',
            '<rect x="9" y="3" width="3" height="1" fill="rgba(123,97,255,0.3)"/>',
            '<rect x="7" y="7" width="2" height="1" fill="#009ab0"/>',
            '<rect x="5" y="8" width="1" height="1" fill="#007a90"/>',
            '<rect x="6" y="9" width="4" height="1" fill="#007a90"/>',
            '<rect x="10" y="8" width="1" height="1" fill="#007a90"/>',
            '<rect x="5" y="10" width="6" height="1" fill="#00b8d0"/>',
            '<rect x="4" y="11" width="8" height="1" fill="#00a8c0"/>',
            '<rect x="4" y="12" width="8" height="1" fill="#0098b0"/>',
            '<rect x="2" y="11" width="2" height="1" fill="#00c0d8"/>',
            '<rect x="1" y="12" width="2" height="1" fill="#00b0c8"/>',
            '<rect x="12" y="11" width="2" height="1" fill="#00c0d8"/>',
            '<rect x="13" y="12" width="2" height="1" fill="#00b0c8"/>',
            '<rect x="5" y="13" width="2" height="1" fill="#0090a8"/>',
            '<rect x="9" y="13" width="2" height="1" fill="#0090a8"/>',
            '<rect x="5" y="14" width="2" height="1" fill="#007890"/>',
            '<rect x="9" y="14" width="2" height="1" fill="#007890"/>',
            '<rect x="4" y="15" width="3" height="1" fill="#006878"/>',
            '<rect x="9" y="15" width="3" height="1" fill="#006878"/>',
            '<rect x="7" y="11" width="2" height="1" fill="#7B61FF"/>',
            '</svg>'
        ].join(''),

        'skills': [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">',
            '<rect x="5" y="2" width="6" height="1" fill="rgba(123,97,255,0.3)"/>',
            '<rect x="6" y="3" width="4" height="1" fill="#9B84FF"/>',
            '<rect x="5" y="4" width="6" height="1" fill="#7B61FF"/>',
            '<rect x="5" y="5" width="6" height="1" fill="#6B54EE"/>',
            '<rect x="6" y="3" width="2" height="1" fill="#c4b8ff"/>',
            '<rect x="6" y="4" width="1" height="1" fill="#ffffff"/>',
            '<rect x="3" y="6" width="10" height="1" fill="#00d4f0"/>',
            '<rect x="2" y="7" width="12" height="1" fill="#00E5FF"/>',
            '<rect x="1" y="8" width="14" height="1" fill="#00c8e0"/>',
            '<rect x="2" y="9" width="12" height="1" fill="#00a8c0"/>',
            '<rect x="4" y="10" width="8" height="1" fill="#008aaa"/>',
            '<rect x="4" y="9" width="1" height="1" fill="#FFD166"/>',
            '<rect x="6" y="9" width="1" height="1" fill="#7B61FF"/>',
            '<rect x="8" y="9" width="1" height="1" fill="#FFD166"/>',
            '<rect x="10" y="9" width="1" height="1" fill="#7B61FF"/>',
            '<rect x="12" y="9" width="1" height="1" fill="#FFD166"/>',
            '<rect x="6" y="11" width="1" height="1" fill="rgba(255,209,102,0.4)"/>',
            '<rect x="7" y="11" width="2" height="1" fill="rgba(255,209,102,0.25)"/>',
            '<rect x="9" y="11" width="1" height="1" fill="rgba(255,209,102,0.4)"/>',
            '<rect x="6" y="12" width="4" height="1" fill="rgba(255,209,102,0.15)"/>',
            '</svg>'
        ].join(''),

        'systems': [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">',
            '<rect x="1" y="6" width="1" height="1" fill="rgba(0,229,255,0.4)"/>',
            '<rect x="1" y="9" width="1" height="1" fill="rgba(0,229,255,0.4)"/>',
            '<rect x="2" y="7" width="1" height="2" fill="rgba(0,229,255,0.6)"/>',
            '<rect x="3" y="7" width="1" height="1" fill="#00E5FF"/>',
            '<rect x="3" y="8" width="1" height="1" fill="#00E5FF"/>',
            '<rect x="4" y="7" width="1" height="2" fill="#7B61FF"/>',
            '<rect x="5" y="6" width="1" height="4" fill="#9B84FF"/>',
            '<rect x="6" y="6" width="1" height="4" fill="#7B61FF"/>',
            '<rect x="7" y="5" width="1" height="6" fill="#9B84FF"/>',
            '<rect x="8" y="5" width="1" height="6" fill="#7B61FF"/>',
            '<rect x="9" y="6" width="1" height="4" fill="#5A44CC"/>',
            '<rect x="5" y="5" width="3" height="1" fill="#7B61FF"/>',
            '<rect x="5" y="10" width="3" height="1" fill="#7B61FF"/>',
            '<rect x="6" y="4" width="2" height="1" fill="#5A44CC"/>',
            '<rect x="6" y="11" width="2" height="1" fill="#5A44CC"/>',
            '<rect x="10" y="7" width="2" height="2" fill="#b0a0ff"/>',
            '<rect x="12" y="7" width="1" height="1" fill="#00E5FF"/>',
            '<rect x="12" y="8" width="1" height="1" fill="#00E5FF"/>',
            '<rect x="13" y="7" width="1" height="1" fill="#ffffff"/>',
            '<rect x="13" y="8" width="1" height="1" fill="#ffffff"/>',
            '<rect x="9" y="7" width="1" height="2" fill="#00E5FF"/>',
            '<rect x="6" y="7" width="1" height="2" fill="#6B54EE"/>',
            '<rect x="8" y="7" width="1" height="2" fill="#6B54EE"/>',
            '</svg>'
        ].join(''),

        'contact': [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">',
            '<circle cx="8" cy="8" r="7" fill="rgba(0,229,255,0.08)"/>',
            '<circle cx="8" cy="8" r="5" fill="rgba(0,229,255,0.12)"/>',
            '<rect x="6" y="5" width="1" height="1" fill="#b0eeff"/>',
            '<rect x="7" y="4" width="2" height="1" fill="#c8f4ff"/>',
            '<rect x="9" y="5" width="1" height="1" fill="#b0eeff"/>',
            '<rect x="5" y="6" width="1" height="1" fill="#90d8f0"/>',
            '<rect x="6" y="6" width="4" height="1" fill="#d6f8ff"/>',
            '<rect x="10" y="6" width="1" height="1" fill="#90d8f0"/>',
            '<rect x="5" y="7" width="1" height="2" fill="#7cc8e8"/>',
            '<rect x="6" y="7" width="4" height="2" fill="#e8fbff"/>',
            '<rect x="10" y="7" width="1" height="2" fill="#7cc8e8"/>',
            '<rect x="5" y="9" width="1" height="1" fill="#90d8f0"/>',
            '<rect x="6" y="9" width="4" height="1" fill="#d6f8ff"/>',
            '<rect x="10" y="9" width="1" height="1" fill="#90d8f0"/>',
            '<rect x="6" y="10" width="1" height="1" fill="#b0eeff"/>',
            '<rect x="7" y="11" width="2" height="1" fill="#c8f4ff"/>',
            '<rect x="9" y="10" width="1" height="1" fill="#b0eeff"/>',
            '<rect x="7" y="7" width="2" height="2" fill="#ffffff"/>',
            '<rect x="8" y="7" width="1" height="1" fill="#ffffff"/>',
            '</svg>'
        ].join('')
    };
    var dpr = window.devicePixelRatio || 1;
    var raf = null;
    var tick = 0;
    var allDone = false;
    var rectCache = {};   /* cached section bounds (doc space) — avoids per-frame layout reads */

    function init() {
        buildCanvas();
        buildHUD();
        measureRects();
        window.addEventListener('resize', measureRects, { passive: true });
        window.addEventListener('load', measureRects);
        loadSprite(function () {
            spawnStars();
            bindClick();
            loop();
        });
    }

    /* Measure once per resize/load instead of every animation frame.
       Values stored in document space so they stay valid while scrolling. */
    function measureRects() {
        STARS.forEach(function (cfg) {
            var el = document.getElementById(cfg.section);
            if (!el) return;
            var r = el.getBoundingClientRect();
            rectCache[cfg.section] = {
                left: r.left, right: r.right, width: r.width,
                top: r.top + window.scrollY, bottom: r.bottom + window.scrollY,
                height: r.height
            };
        });
    }

    function loadSprite(cb) {
        var keys = Object.keys(SPRITE_SVGS);
        var loaded = 0;
        keys.forEach(function (key) {
            var blob = new Blob([SPRITE_SVGS[key]], { type: 'image/svg+xml' });
            var url = URL.createObjectURL(blob);
            var img = new Image();
            img.onload = img.onerror = function () {
                URL.revokeObjectURL(url);
                spriteImgs[key] = img;
                if (++loaded === keys.length) cb();
            };
            img.src = url;
        });
    }

    function buildCanvas() {
        canvas = document.createElement('canvas');
        canvas.id = 'starCanvas';
        canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
        document.body.insertBefore(canvas, document.body.firstChild);
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize, { passive: true });
    }

    function resize() {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
    }

    function buildHUD() {
        var hud = document.createElement('div');
        hud.id = 'starHud';
        hud.innerHTML = '<span id="starHudIcon">&#10022;</span><span id="starHudCount">0/' + TOTAL + '</span>';
        document.body.appendChild(hud);
        hud.classList.add('visible');
    }

    function updateHUD() {
        var el = document.getElementById('starHudCount');
        if (el) el.textContent = collectedCount + '/' + TOTAL;
        var hud = document.getElementById('starHud');
        if (!hud) return;
        hud.classList.add('visible');
        if (collectedCount >= TOTAL) {
            setTimeout(function () { hud.classList.remove('visible'); }, 3000);
        }
    }

    function spawnStars() {
        STARS.forEach(function (cfg) {
            stars.push(createStar(cfg));
        });
    }

    function createStar(cfg) {
        var angle = (-20 + Math.random() * 20) * (Math.PI / 180);
        var speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
        return { cfg: cfg, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed + 0.2, x: 0, y: 0, pulse: Math.random() * Math.PI * 2, sparkles: [], placed: false };
    }

    function placeStar(s) {
        var rc = rectCache[s.cfg.section];
        if (!rc || rc.width === 0) return;
        s.x = rc.left + rc.width * (0.1 + Math.random() * 0.4);
        s.y = rc.top + rc.height * (0.15 + Math.random() * 0.7);
        s.placed = true;
    }

    function wrapStar(s) {
        var rc = rectCache[s.cfg.section];
        if (!rc) return;
        var pad = 20;
        if (s.x > rc.right + pad || s.x < rc.left - pad || s.y > rc.bottom + pad || s.y < rc.top - pad) {
            s.x = rc.left + pad;
            s.y = rc.top + rc.height * (0.15 + Math.random() * 0.7);
            s.sparkles = [];
        }
    }

    function drawStar(s) {
        if (!s.placed) { placeStar(s); return; }
        var rgb = s.cfg.rgb;
        s.pulse += 0.05;
        var p = 0.7 + 0.3 * Math.sin(s.pulse);
        var sy = window.scrollY;
        var dx = s.x;
        var dy = s.y - sy;   /* shift to viewport space for drawing */
        var len = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        var nx = s.vx / len, ny = s.vy / len;

        /* tail */
        var tail = ctx.createLinearGradient(dx - nx * TAIL_LEN, dy - ny * TAIL_LEN, dx, dy);
        tail.addColorStop(0, 'rgba(' + rgb + ',0)');
        tail.addColorStop(0.5, 'rgba(' + rgb + ',0.18)');
        tail.addColorStop(1, 'rgba(' + rgb + ',0.8)');
        ctx.beginPath(); ctx.moveTo(dx - nx * TAIL_LEN, dy - ny * TAIL_LEN); ctx.lineTo(dx, dy);
        ctx.strokeStyle = tail; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();

        /* tail bloom */
        var bloom = ctx.createLinearGradient(dx - nx * TAIL_LEN, dy - ny * TAIL_LEN, dx, dy);
        bloom.addColorStop(0, 'rgba(' + rgb + ',0)');
        bloom.addColorStop(1, 'rgba(' + rgb + ',0.1)');
        ctx.beginPath(); ctx.moveTo(dx - nx * TAIL_LEN, dy - ny * TAIL_LEN); ctx.lineTo(dx, dy);
        ctx.strokeStyle = bloom; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();

        /* pulsing bloom behind sprite */
        var bloomR = SPRITE_SIZE * (0.9 + 0.5 * p);
        var spriteBloom = ctx.createRadialGradient(dx, dy, 0, dx, dy, bloomR);
        spriteBloom.addColorStop(0, 'rgba(255,255,255,' + (0.5 * p) + ')');
        spriteBloom.addColorStop(0.2, 'rgba(' + rgb + ',' + (0.45 * p) + ')');
        spriteBloom.addColorStop(0.6, 'rgba(' + rgb + ',' + (0.15 * p) + ')');
        spriteBloom.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.beginPath(); ctx.arc(dx, dy, bloomR, 0, Math.PI * 2);
        ctx.fillStyle = spriteBloom; ctx.fill();

        /* sprite — rotated to face direction of travel */
        var img = spriteImgs[s.cfg.section];
        if (img) {
            var angle = Math.atan2(s.vy, s.vx);
            /* each SVG has a natural "forward" axis — offset to align it with travel angle:
               rocket    → nose points up (−Y), so offset −90°
               spaceship → nose points right (+X), so no offset
               others    → radially symmetric, no offset needed */
            var offsets = { 'hero': Math.PI / 2, 'systems': 0 };
            var offset = offsets[s.cfg.section] !== undefined ? offsets[s.cfg.section] : 0;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.translate(dx, dy);
            ctx.rotate(angle + offset);
            ctx.drawImage(img, -SPRITE_SIZE / 2, -SPRITE_SIZE / 2, SPRITE_SIZE, SPRITE_SIZE);
            ctx.restore();
        } else {
            ctx.beginPath(); ctx.arc(dx, dy, HEAD_R, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff'; ctx.fill();
        }

        if (tick % 3 === 0) {
            for (var i = 0; i < 2; i++) {
                s.sparkles.push({ x: dx + (Math.random() - 0.5) * 8, y: dy + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 1.8, vy: (Math.random() - 0.5) * 1.8, life: 1, size: 0.8 + Math.random() * 1.4 });
            }
        }
        s.sparkles = s.sparkles.filter(function (sp) { return sp.life > 0; });
        s.sparkles.forEach(function (sp) {
            ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + rgb + ',' + (sp.life * 0.85) + ')'; ctx.fill();
            sp.x += sp.vx; sp.y += sp.vy; sp.vx *= 0.93; sp.vy *= 0.93; sp.life -= 0.055;
        });

        s.x += s.vx; s.y += s.vy;
        wrapStar(s);
    }

    function loop() {
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        tick++;
        stars.forEach(drawStar);
        raf = requestAnimationFrame(loop);
    }

    function bindClick() {
        document.addEventListener('click', function (e) {
            if (allDone) return;
            var mx = e.clientX, my = e.clientY;
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                if (!s.placed) continue;
                var dx = mx - s.x, dy = my - (s.y - window.scrollY);
                if (Math.sqrt(dx * dx + dy * dy) <= CLICK_R) {
                    collectStar(s, mx, my);
                    break;
                }
            }
        });
    }

    function collectStar(s, mx, my) {
        stars = stars.filter(function (x) { return x !== s; });
        collectedCount++;
        collectedIds[s.cfg.id] = true;
        updateHUD();
        spawnBurst(mx, my, s.cfg.rgb, s.cfg.hex);
        spawnFloatText(mx, my, s.cfg.hex);
        if (collectedCount >= TOTAL) { allDone = true; setTimeout(triggerReward, 600); }
    }

    function spawnBurst(cx, cy, rgb) {
        var particles = [];
        for (var i = 0; i < 28; i++) {
            var angle = (i / 28) * Math.PI * 2;
            var speed = 2 + Math.random() * 4;
            particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, size: 1.2 + Math.random() * 2.2, rgb: rgb });
        }
        function burstFrame() {
            particles.forEach(function (p) {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + p.rgb + ',' + (p.life * 0.9) + ')'; ctx.fill();
                p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life -= 0.032;
            });
            particles = particles.filter(function (p) { return p.life > 0; });
            if (particles.length > 0) requestAnimationFrame(burstFrame);
        }
        requestAnimationFrame(burstFrame);
    }

    function spawnFloatText(x, y, hex) {
        var el = document.createElement('div');
        el.textContent = '★ +1';
        el.style.cssText = 'position:fixed;left:' + (x - 16) + 'px;top:' + (y - 10) + 'px;color:' + hex + ';font-family:monospace;font-size:13px;letter-spacing:0.08em;pointer-events:none;z-index:9999;opacity:1;transition:opacity 0.8s ease,transform 0.8s ease;text-shadow:0 0 10px ' + hex;
        document.body.appendChild(el);
        requestAnimationFrame(function () { el.style.opacity = '0'; el.style.transform = 'translateY(-28px)'; });
        setTimeout(function () { el.remove(); }, 900);
    }

    function triggerReward() {
        var W = window.innerWidth, H = window.innerHeight;
        var COLORS = ['0,229,255', '123,97,255', '255,209,102', '0,255,136', '255,100,180'];

        /* ── FIREWORKS CANVAS — above everything including the overlay ── */
        var rc = document.createElement('canvas');
        rc.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9997;';
        rc.width = W * dpr; rc.height = H * dpr;
        var rctx = rc.getContext('2d'); rctx.scale(dpr, dpr);
        document.body.appendChild(rc);

        var bursts = [];
        var fwActive = true; /* never set to false — loop runs until dismissed */

        function launchBurst(cx, cy) {
            var rgb = COLORS[Math.floor(Math.random() * COLORS.length)];
            var pts = [];
            for (var i = 0; i < 70; i++) {
                var a = (i / 70) * Math.PI * 2, sp = 3 + Math.random() * 8;
                pts.push({
                    x: cx, y: cy,
                    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                    life: 1, size: 1.4 + Math.random() * 2.8,
                    trail: [] /* stores last positions for trail */
                });
            }
            bursts.push({ pts: pts, rgb: rgb });
        }

        function fwLoop() {
            /* fade instead of clear — leaves trails */
            rctx.fillStyle = 'rgba(10,12,16,0.22)';
            rctx.fillRect(0, 0, W, H);

            bursts.forEach(function (b) {
                b.pts.forEach(function (p) {
                    /* draw trail */
                    for (var t = 0; t < p.trail.length; t++) {
                        var tr = p.trail[t];
                        var a = (t / p.trail.length) * p.life * 0.5;
                        rctx.beginPath();
                        rctx.arc(tr.x, tr.y, p.size * tr.life * 0.5, 0, Math.PI * 2);
                        rctx.fillStyle = 'rgba(' + b.rgb + ',' + a + ')';
                        rctx.fill();
                    }
                    /* draw head */
                    rctx.beginPath(); rctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                    rctx.fillStyle = 'rgba(' + b.rgb + ',' + (p.life * 0.95) + ')'; rctx.fill();

                    /* store trail point */
                    p.trail.push({ x: p.x, y: p.y, life: p.life });
                    if (p.trail.length > 8) p.trail.shift();

                    p.x += p.vx; p.y += p.vy;
                    p.vy += 0.09; p.vx *= 0.96; p.vy *= 0.96;
                    p.life -= 0.014;
                });
                b.pts = b.pts.filter(function (p) { return p.life > 0; });
            });
            bursts = bursts.filter(function (b) { return b.pts.length > 0; });
            if (fwActive) requestAnimationFrame(fwLoop);
        }
        fwLoop();

        /* ── CONFETTI ── */
        var confetti = [];
        for (var i = 0; i < 160; i++) {
            confetti.push({
                x: Math.random() * W, y: -10 - Math.random() * 300,
                vx: (Math.random() - 0.5) * 3.5, vy: 2 + Math.random() * 4,
                size: 4 + Math.random() * 7, rot: Math.random() * Math.PI * 2,
                rotV: (Math.random() - 0.5) * 0.22,
                rgb: COLORS[Math.floor(Math.random() * COLORS.length)],
                rect: Math.random() > 0.5
            });
        }
        function confettiLoop() {
            confetti.forEach(function (c) {
                rctx.save();
                rctx.translate(c.x, c.y); rctx.rotate(c.rot);
                rctx.fillStyle = 'rgba(' + c.rgb + ',0.9)';
                if (c.rect) rctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
                else { rctx.beginPath(); rctx.arc(0, 0, c.size / 2, 0, Math.PI * 2); rctx.fill(); }
                rctx.restore();
                c.x += c.vx; c.y += c.vy; c.vy += 0.05; c.rot += c.rotV;
            });
            confetti = confetti.filter(function (c) { return c.y < H + 20; });
            if (confetti.length > 0) requestAnimationFrame(confettiLoop);
        }
        confettiLoop();

        /* initial salvo */
        launchBurst(W * 0.2, H * 0.3);
        launchBurst(W * 0.8, H * 0.25);
        launchBurst(W * 0.5, H * 0.15);
        launchBurst(W * 0.15, H * 0.55);
        launchBurst(W * 0.85, H * 0.5);
        launchBurst(W * 0.4, H * 0.35);
        launchBurst(W * 0.65, H * 0.45);

        /* pre-card continuous launches — fast */
        var fwInterval = setInterval(function () {
            launchBurst(W * 0.1 + Math.random() * W * 0.8, H * 0.1 + Math.random() * H * 0.5);
        }, 200);

        /* ── WIN SCREEN appears after 1.5s ── */
        setTimeout(function () {
            clearInterval(fwInterval);

            /* slower continuous launches that persist through the win card */
            var fwSlow = setInterval(function () {
                launchBurst(W * 0.05 + Math.random() * W * 0.9, H * 0.05 + Math.random() * H * 0.55);
            }, 500);

            var overlay = document.createElement('div');
            overlay.id = 'starReward';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(10,12,16,0);display:flex;align-items:center;justify-content:center;transition:background 0.6s ease;cursor:pointer;';
            document.body.appendChild(overlay);

            var scanlines = document.createElement('div');
            scanlines.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:0.06;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.6) 0px,rgba(0,0,0,0.6) 1px,transparent 1px,transparent 3px);';
            overlay.appendChild(scanlines);

            var wrap = document.createElement('div');
            wrap.style.cssText = 'position:relative;z-index:10000;padding:2px;border-radius:14px;background:linear-gradient(90deg,#00E5FF,#7B61FF,#FFD166,#00FF88,#00E5FF);opacity:0;transform:scale(0.8);transition:opacity 0.7s ease 0.3s,transform 0.7s cubic-bezier(0.175,0.885,0.32,1.275) 0.3s;animation:rainbowSpin 3s linear infinite;';
            overlay.appendChild(wrap);

            var style = document.createElement('style');
            style.textContent = '@keyframes rainbowSpin{to{filter:hue-rotate(360deg);}}';
            document.head.appendChild(style);

            var inner = document.createElement('div');
            inner.style.cssText = 'background:#0F1117;border-radius:12px;padding:36px 52px;text-align:center;font-family:monospace;';
            wrap.appendChild(inner);

            inner.innerHTML =
                '<div style="font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#5A6072;margin-bottom:16px;">— Achievement Unlocked —</div>' +
                '<div style="font-size:clamp(32px,6vw,52px);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#ffffff;line-height:0.95;margin-bottom:4px;">Cosmic</div>' +
                '<div style="font-size:clamp(14px,2.5vw,18px);font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#00E5FF;margin-bottom:24px;">Collector</div>' +
                '<div id="rewardScore" style="font-size:clamp(48px,8vw,72px);font-weight:700;color:#FFD166;letter-spacing:-0.02em;line-height:1;">0</div>' +
                '<div style="font-size:12px;color:#5A6072;letter-spacing:0.08em;margin-bottom:8px;">/ 500</div>' +
                '<div style="display:inline-block;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#FFD166;border:1px solid rgba(255,209,102,0.35);padding:4px 14px;border-radius:3px;margin-bottom:24px;">Perfect Run &nbsp;&middot;&nbsp; All 5 Collected</div>' +
                '<div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#1E2330;">[ click anywhere to continue ]</div>';

            requestAnimationFrame(function () { overlay.style.background = 'rgba(10,12,16,0.75)'; });
            setTimeout(function () { wrap.style.opacity = '1'; wrap.style.transform = 'scale(1)'; }, 50);

            var score = 0;
            var tScore = setInterval(function () {
                score = Math.min(500, score + Math.ceil((500 - score) / 6) + 5);
                var el = document.getElementById('rewardScore');
                if (el) el.textContent = score;
                if (score >= 500) clearInterval(tScore);
            }, 25);

            /* salvo behind the card */
            setTimeout(function () {
                launchBurst(W * 0.15, H * 0.3);
                launchBurst(W * 0.85, H * 0.3);
                launchBurst(W * 0.5, H * 0.1);
                launchBurst(W * 0.3, H * 0.6);
                launchBurst(W * 0.7, H * 0.6);
            }, 350);

            overlay.addEventListener('click', function () {
                fwActive = false;
                clearInterval(fwSlow);
                overlay.style.opacity = '0'; overlay.style.transition = 'opacity 0.5s ease';
                rc.style.opacity = '0'; rc.style.transition = 'opacity 0.5s ease';
                setTimeout(function () { overlay.remove(); rc.remove(); style.remove(); }, 500);
            });

        }, 1500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();