/* ═══════════════════════════════════════════════════════════
   CONTACT NINJA  |  contact-ninja.js
   The parry game's hero (headband, sword) drops in from under
   the nav once the visitor reaches the bottom of the page: falls,
   lands on the line above the contact links, strikes the win pose
   (hand on hip, sword on the shoulder), runs to one step short of the
   line's right end, front-flips off it (like the enemy's entrance in
   the game) and falls out of view the way he came in. Ink on the
   paper page, paper on the black contact section; he flips colour
   exactly where he crosses its top edge.
   Plays once per page load. Off under prefers-reduced-motion.
   Lazy-loaded by an IntersectionObserver in index.html.
═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // #region Config
    /* px and seconds. Pose units are the parry game's (feet on y = 24);
       scale turns them into px. */
    var CONFIG = Object.freeze({
        scale: 1.83,             // px per pose unit (about 110 px tall)
        scaleNarrow: 1.13,       // under narrowWidth
        narrowWidth: 700,
        lineWidth: 3.2,          // pose units, like the game
        headRadius: 5.5,
        sword: 24,               // pose units, the game's hero sword
        swordWidth: 2.2,
        guardWidth: 3,
        sheath: { joint: 'p', dx: -2, dy: 1, deg: 145, lenK: 0.85 },   // at the hip, as in the game

        gravity: 2600,           // px/s^2
        landAt: 0.65,            // share along the links' top line where he lands
        edgePad: 12,             // px: he never jumps further right than the viewport minus this

        landTime: 0.14,
        landSquash: 0.7,
        riseTime: 0.18,
        poseHold: 0.5,
        runStep: 0.12,           // seconds per step
        runSpeed: 320,           // px/s; he stops one step (runStep x runSpeed) short of the line's end
        prepTime: 0.1,
        jumpHeight: 90,          // px above the pose spot
        jumpPast: 60,            // px past the contact links' right edge
        flipShare: 0.9,          // the flip ends this far into the jump arc, as the enemy's does
        flipPivot: 27,           // pose units above the feet: the tuck turns around its middle
        offscreen: 150,          // px below the viewport before he's gone

        // headband tails, as in the game
        bandSegs: 4,
        bandSeg: 3.2,
        bandWidth: 1.6,
        bandDroop: 0.35,
        bandSplit: 0.4,
        bandWave: 0.35,
        bandWaveSpeed: 9,
        bandFollow: 16,
        bandStretch: 1.5,        // a tail segment never gets longer than this x bandSeg (fast falls)

        maxDt: 0.05
    });

    var Phase = Object.freeze({ Off: 0, Fall: 1, Land: 2, Pose: 3, Run: 4, Prep: 5, Jump: 6 });
    // #endregion

    // #region Poses
    /* Same skeleton as the parry game: h head, n neck, p pelvis, kb/fb back
       knee/foot, kf/ff front knee/foot, eb/hb back elbow/hand, ef/hf front
       elbow/hand. Facing right, origin at the hip, feet on y = 24. s = sword
       angle in degrees from the front hand; sheathed puts it at the hip. */
    var POSES = {
        fall:  { h: [0, -30], n: [0, -23], p: [0, 0], kb: [-4, 11], fb: [-5, 22], kf: [4, 11], ff: [6, 21], eb: [-9, -27], hb: [-12, -33], ef: [9, -27], hf: [12, -33], s: 145, sheathed: true },
        land:  { h: [2, -17], n: [1, -10], p: [0, 8], kb: [-10, 15], fb: [-16, 24], kf: [10, 15], ff: [15, 24], eb: [-7, -6], hb: [-12, -2], ef: [7, -6], hf: [12, -2], s: 145, sheathed: true },
        // the game's win pose: hand on hip, sword resting on the shoulder
        pose:  { h: [0, -30], n: [0, -23], p: [0, 0], kb: [-3, 12], fb: [-5, 24], kf: [4, 12], ff: [6, 24], eb: [-11, -14], hb: [-2, 0], ef: [7, -14], hf: [3, -21], s: -160 },
        // run, sword kept on the shoulder, free arm pumping
        runA:  { h: [5, -29], n: [4, -22], p: [0, 0], kb: [-6, 10], fb: [-15, 17], kf: [8, 7], ff: [10, 19], eb: [-4, -14], hb: [-10, -8], ef: [9, -15], hf: [6, -21], s: -165 },
        runB:  { h: [5, -30], n: [4, -23], p: [0, -1], kb: [6, 8], fb: [5, 20], kf: [-5, 10], ff: [-13, 16], eb: [4, -15], hb: [9, -20], ef: [9, -15], hf: [6, -21], s: -165 },
        prep:  { h: [2, -17], n: [1, -10], p: [0, 8], kb: [-10, 15], fb: [-16, 24], kf: [10, 15], ff: [15, 24], eb: [-7, -6], hb: [-12, -2], ef: [5, -12], hf: [2, -18], s: -160 },
        // front-flip tuck, sword back at the hip (the enemy's eTuck, mirrored for the hero)
        tuck:  { h: [3, -22], n: [2, -16], p: [0, 0], kb: [5, 4], fb: [-2, 10], kf: [7, 2], ff: [1, 9], eb: [5, -12], hb: [6, -6], ef: [6, -12], hf: [7, -6], s: 145, sheathed: true },
    };

    var JOINTS = ['h', 'n', 'p', 'kb', 'fb', 'kf', 'ff', 'eb', 'hb', 'ef', 'hf'];
    var J = {};
    JOINTS.forEach(function (k, i) { J[k] = i * 2; });
    var ANGLE = JOINTS.length * 2;       // sword angle slot
    var SHEATH = ANGLE + 1;              // 1 = sheathed
    var LEN = ANGLE + 2;

    var COMPILED = {};
    Object.keys(POSES).forEach(function (name) {
        var src = POSES[name], out = new Float32Array(LEN);
        JOINTS.forEach(function (k) { out[J[k]] = src[k][0]; out[J[k] + 1] = src[k][1]; });
        out[ANGLE] = src.s;
        out[SHEATH] = src.sheathed ? 1 : 0;
        COMPILED[name] = out;
    });
    // #endregion

    // #region Easing + tween
    var Ease = {
        linear: function (t) { return t; },
        outQuad: function (t) { return t * (2 - t); },
        inOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t); },
        outBack: function (t) { var c = 1.7, u = t - 1; return 1 + u * u * ((c + 1) * u + c); }
    };

    function Tween(v) { this.v = v; this.from = v; this.to = v; this.t = 0; this.dur = 0; this.ease = Ease.linear; }
    Tween.prototype.go = function (to, dur, ease) {
        this.from = this.v; this.to = to; this.t = 0; this.dur = dur; this.ease = ease || Ease.outQuad;
        if (dur <= 0) this.v = to;
    };
    Tween.prototype.set = function (v) { this.v = this.from = this.to = v; this.dur = 0; };
    Tween.prototype.step = function (dt) {
        if (this.dur <= 0 || this.t >= this.dur) { this.v = this.to; return; }
        this.t = Math.min(this.t + dt, this.dur);
        this.v = this.from + (this.to - this.from) * this.ease(this.t / this.dur);
    };
    // #endregion

    // #region Setup
    var section = document.getElementById('contact');
    var links = section && section.querySelector('.contact-links');
    var bar = section && section.querySelector('.contact-bar');
    var navbar = document.getElementById('navbar');
    if (!section || !links || !bar || section.dataset.ninjaReady) return;
    section.dataset.ninjaReady = '1';

    var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (motionQuery && motionQuery.matches) return;

    var css = getComputedStyle(document.documentElement);
    var INK = css.getPropertyValue('--ink').trim() || '#17171A';
    var PAPER = css.getPropertyValue('--paper').trim() || '#F1EEE7';

    var canvas = document.createElement('canvas');
    canvas.className = 'contact-ninja';
    canvas.setAttribute('aria-hidden', 'true');
    // under the fixed nav (z 100), so he drops out from beneath it
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:98;';
    var ctx = canvas.getContext('2d');

    var n = {
        phase: Phase.Off,
        t: 0,                    // time in the phase
        x: 0, y: 0,              // feet, document px
        vx: 0, vy: 0,
        landY: 0,
        jumpEndX: 0,
        K: CONFIG.scale,
        rot: new Tween(0),       // flip, radians, screen plane
        runEndX: 0,
        squash: new Tween(1),
        cur: new Float32Array(LEN),
        from: new Float32Array(LEN),
        to: COMPILED.fall,
        poseT: 0, poseDur: 0, poseEase: Ease.outQuad,
        band: new Float32Array(2 * (CONFIG.bandSegs + 1) * 2),
        bandT: 0,
        bandSnap: true,
        tmp: new Float32Array(2),
        sectionTop: 0,           // document px
        rafId: 0,
        last: 0
    };
    n.cur.set(COMPILED.fall);

    var view = { w: 0, h: 0, dpr: 1 };
    // #endregion

    // #region Figure
    function pose(name, dur, ease) {
        n.from.set(n.cur);
        n.to = COMPILED[name];
        n.poseT = 0;
        n.poseDur = dur;
        n.poseEase = ease || Ease.outQuad;
        if (dur <= 0) n.cur.set(n.to);
    }

    function stepPose(dt) {
        if (n.poseDur <= 0 || n.poseT >= n.poseDur) return;
        n.poseT = Math.min(n.poseT + dt, n.poseDur);
        var k = n.poseEase(n.poseT / n.poseDur);
        for (var i = 0; i <= ANGLE; i++) n.cur[i] = n.from[i] + (n.to[i] - n.from[i]) * k;
        n.cur[SHEATH] = n.to[SHEATH];      // draws, or sheathes, as the move starts
    }

    /* pose point -> viewport px, the same transform drawFigure uses */
    function toView(lx, ly, out) {
        var K = n.K, sx = K * (2 - n.squash.v), sy = K * n.squash.v;
        var pv = CONFIG.flipPivot * K, px = sx * lx, py = sy * (ly - 24) + pv;
        var c = Math.cos(n.rot.v), s = Math.sin(n.rot.v);
        out[0] = n.x + px * c - py * s;
        out[1] = n.y - window.scrollY + px * s + py * c - pv;
        return out;
    }

    /* each tail point eases toward a spot one segment behind the previous one */
    function updateBand(dt) {
        var C = CONFIG, b = n.band, m = C.bandSegs + 1, K = n.K;
        var back = -1;                     // he faces right: tails trail left
        var k = n.bandSnap ? 1 : Math.min(1, dt * C.bandFollow);
        toView(n.cur[J.h] - C.headRadius * 0.8, n.cur[J.h + 1] - 1.5, n.tmp);
        var kx = n.tmp[0], ky = n.tmp[1] + window.scrollY;     // keep the chain in document px
        n.bandT += dt;
        for (var t = 0; t < 2; t++) {
            var o = t * m * 2;
            b[o] = kx;
            b[o + 1] = ky;
            for (var i = 1; i < m; i++) {
                var q = o + i * 2;
                var a = C.bandDroop + t * C.bandSplit + Math.sin(n.bandT * C.bandWaveSpeed - i * 0.9 + t) * C.bandWave;
                b[q] += (b[q - 2] + back * Math.cos(a) * C.bandSeg * K - b[q]) * k;
                b[q + 1] += (b[q - 1] + Math.sin(a) * C.bandSeg * K - b[q + 1]) * k;
                var dx = b[q] - b[q - 2], dy = b[q + 1] - b[q - 1], d = Math.sqrt(dx * dx + dy * dy), max = C.bandSeg * K * C.bandStretch;
                if (d > max) { b[q] = b[q - 2] + dx / d * max; b[q + 1] = b[q - 1] + dy / d * max; }
            }
        }
        n.bandSnap = false;
    }

    function seg(p, a, b) {
        ctx.moveTo(p[J[a]], p[J[a] + 1]);
        ctx.lineTo(p[J[b]], p[J[b] + 1]);
    }

    function drawFigure(color) {
        var c = ctx, p = n.cur, K = n.K, b = n.band, m = CONFIG.bandSegs + 1, sy = window.scrollY;
        // tails, viewport space
        c.strokeStyle = color;
        c.lineWidth = CONFIG.bandWidth * K;
        c.beginPath();
        for (var t = 0; t < 2; t++) {
            var o = t * m * 2;
            c.moveTo(b[o], b[o + 1] - sy);
            for (var i = 1; i < m; i++) c.lineTo(b[o + i * 2], b[o + i * 2 + 1] - sy);
        }
        c.stroke();

        c.save();
        c.translate(n.x, n.y - sy - CONFIG.flipPivot * K);
        c.rotate(n.rot.v);
        c.translate(0, CONFIG.flipPivot * K);
        c.scale(K * (2 - n.squash.v), K * n.squash.v);
        c.translate(0, -24);
        var sh = CONFIG.sheath;
        if (p[SHEATH]) drawSword(color, p[J[sh.joint]] + sh.dx, p[J[sh.joint] + 1] + sh.dy, sh.deg, sh.lenK);
        c.strokeStyle = color;
        c.lineWidth = CONFIG.lineWidth;
        c.beginPath();
        seg(p, 'n', 'p');
        seg(p, 'p', 'kb'); seg(p, 'kb', 'fb');
        seg(p, 'p', 'kf'); seg(p, 'kf', 'ff');
        seg(p, 'n', 'eb'); seg(p, 'eb', 'hb');
        seg(p, 'n', 'ef'); seg(p, 'ef', 'hf');
        c.stroke();
        c.fillStyle = color;
        c.beginPath();
        c.arc(p[J.h], p[J.h + 1], CONFIG.headRadius, 0, Math.PI * 2);
        c.fill();
        if (!p[SHEATH]) drawSword(color, p[J.hf], p[J.hf + 1], p[ANGLE], 1);
        c.restore();
    }

    /* the game's sword: pommel, blade, crossguard */
    function drawSword(color, hx, hy, deg, lenK) {
        var c = ctx, a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        var L = CONFIG.sword * lenK, gw = CONFIG.guardWidth;
        c.strokeStyle = color;
        c.lineWidth = CONFIG.swordWidth;
        c.beginPath();
        c.moveTo(hx - ca * 3, hy - sa * 3);
        c.lineTo(hx + ca * L, hy + sa * L);
        c.stroke();
        c.lineWidth = CONFIG.swordWidth * 0.9;
        c.beginPath();
        c.moveTo(hx + ca * 2 - sa * gw, hy + sa * 2 + ca * gw);
        c.lineTo(hx + ca * 2 + sa * gw, hy + sa * 2 - ca * gw);
        c.stroke();
    }
    // #endregion

    // #region Run
    /* he lands on the line above the contact links, toward its right end */
    function measure() {
        var lr = links.getBoundingClientRect();
        var sy = window.scrollY;
        var navBottom = navbar ? navbar.getBoundingClientRect().bottom : 0;
        n.K = window.innerWidth < CONFIG.narrowWidth ? CONFIG.scaleNarrow : CONFIG.scale;
        n.x = lr.left + lr.width * CONFIG.landAt;
        n.landY = lr.top + sy;
        n.jumpEndX = Math.min(lr.right + CONFIG.jumpPast, window.innerWidth - CONFIG.edgePad);
        n.runEndX = lr.right - CONFIG.runSpeed * CONFIG.runStep;
        n.sectionTop = section.getBoundingClientRect().top + sy;
        n.y = sy + navBottom - 4;           // feet just under the nav: the rest is hidden behind it
    }

    function start() {
        if (n.phase !== Phase.Off) return;
        measure();
        if (n.landY <= n.y) return;         // landing spot above the nav: nowhere to fall
        document.body.appendChild(canvas);
        resize();
        n.vx = 0; n.vy = 0;
        n.rot.set(0); n.squash.set(1);
        pose('fall', 0);
        n.bandSnap = true;
        setPhase(Phase.Fall);
        n.last = performance.now();
        n.rafId = requestAnimationFrame(frame);
    }

    function stop() {
        n.phase = Phase.Off;
        if (n.rafId) cancelAnimationFrame(n.rafId);
        n.rafId = 0;
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    function setPhase(p) {
        n.phase = p;
        n.t = 0;
        var C = CONFIG;
        if (p === Phase.Land) {
            n.vy = 0;
            n.y = n.landY;
            pose('land', 0.06);
            n.squash.set(C.landSquash);
            n.squash.go(1, C.landTime, Ease.outBack);
        } else if (p === Phase.Pose) {
            pose('pose', C.riseTime, Ease.outBack);
        } else if (p === Phase.Run) {
            pose('runA', C.runStep, Ease.inOut);
        } else if (p === Phase.Prep) {
            pose('prep', C.prepTime);
        } else if (p === Phase.Jump) {
            // up jumpHeight, back to this height at jumpEndX, then straight down
            n.vy = -Math.sqrt(2 * C.gravity * C.jumpHeight);
            n.vx = (n.jumpEndX - n.x) / (2 * -n.vy / C.gravity);
            pose('tuck', 0.12);
            n.rot.go(Math.PI * 2, C.flipShare * 2 * -n.vy / C.gravity, Ease.inOut);   // facing right: forward is clockwise
        }
    }

    function tick(dt) {
        var C = CONFIG;
        n.t += dt;
        stepPose(dt);
        n.rot.step(dt);
        n.squash.step(dt);

        if (n.phase === Phase.Fall) {
            n.vy += C.gravity * dt;
            n.y += n.vy * dt;
            if (n.y >= n.landY) setPhase(Phase.Land);
        } else if (n.phase === Phase.Land) {
            if (n.t >= C.landTime) setPhase(Phase.Pose);
        } else if (n.phase === Phase.Pose) {
            if (n.t >= C.riseTime + C.poseHold) setPhase(Phase.Run);
        } else if (n.phase === Phase.Run) {
            n.x = Math.min(n.runEndX, n.x + C.runSpeed * dt);
            var step = Math.floor(n.t / C.runStep);
            if (n.x >= n.runEndX) setPhase(Phase.Prep);
            else if (n.poseT >= n.poseDur) pose(step % 2 ? 'runB' : 'runA', C.runStep, Ease.inOut);
        } else if (n.phase === Phase.Prep) {
            if (n.t >= C.prepTime) setPhase(Phase.Jump);
        } else if (n.phase === Phase.Jump) {
            n.vy += C.gravity * dt;
            if (n.x < n.jumpEndX) n.x = Math.min(n.jumpEndX, n.x + n.vx * dt);
            n.y += n.vy * dt;
            if (n.vy > 0 && n.to !== COMPILED.fall && n.rot.t >= n.rot.dur) { n.rot.set(0); pose('fall', 0.2); }   // falls out the way he came in
            if (n.y - window.scrollY > view.h + C.offscreen) { stop(); return; }
        }
        updateBand(dt);
    }

    function frame(now) {
        n.rafId = 0;
        var dt = Math.min((now - n.last) / 1000, CONFIG.maxDt);
        n.last = now;
        tick(dt > 0 ? dt : 0);
        if (n.phase === Phase.Off) return;
        draw();
        n.rafId = requestAnimationFrame(frame);
    }

    /* ink above the contact section's top edge, paper below it */
    function draw() {
        var c = ctx, edge = n.sectionTop - window.scrollY;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
        c.lineCap = 'round';
        c.lineJoin = 'round';
        if (edge > 0) {
            c.save();
            c.beginPath();
            c.rect(0, 0, view.w, Math.min(edge, view.h));
            c.clip();
            drawFigure(INK);
            c.restore();
        }
        if (edge < view.h) {
            c.save();
            c.beginPath();
            c.rect(0, Math.max(edge, 0), view.w, view.h);
            c.clip();
            drawFigure(PAPER);
            c.restore();
        }
    }

    function resize() {
        view.w = window.innerWidth;
        view.h = window.innerHeight;
        view.dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(view.w * view.dpr);
        canvas.height = Math.round(view.h * view.dpr);
    }

    // a width change (rotation, window resize) moves the landmarks: end the cameo.
    // height-only changes are the mobile URL bar showing/hiding: just re-fit the canvas.
    var lastW = window.innerWidth;
    window.addEventListener('resize', function () {
        if (n.phase === Phase.Off) return;
        if (window.innerWidth !== lastW) { lastW = window.innerWidth; stop(); }
        else resize();
    }, { passive: true });

    // trigger: the contact bar (the page's last line) fully on screen, once
    if (window.IntersectionObserver) {
        var io = new IntersectionObserver(function (entries) {
            if (entries[0].intersectionRatio >= 0.99) { io.disconnect(); start(); }
        }, { threshold: [0.99] });
        io.observe(bar);
    }
    // #endregion
})();
