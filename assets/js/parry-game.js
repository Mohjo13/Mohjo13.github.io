/* ═══════════════════════════════════════════════════════════
   PARRY MINIGAME  |  parry-game.js
   Spec: _notes/parry-minigame-spec.md (source of truth).
   Lazy-loaded by an IntersectionObserver in index.html.
   No loop runs before FIGHT!; the loop pauses when the tab is
   hidden or the box leaves the viewport.
═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // #region Config
    /* Every timing in seconds unless the name says otherwise. World units:
       the scene is authored in a 320 x 180 box, scaled to fit the stage. */
    var CONFIG = Object.freeze({
        worldW: 320,
        worldH: 180,
        groundY: 174,            // low in the box, so the result card clears the fighters' heads

        heroScale: 1.1,
        enemyScale: 1.3,
        heroSword: 24,
        enemySword: 38,
        lineWidth: 3.2,
        headRadius: 5.5,
        hornScale: 0.7,          // enemy horns, 1 = original size

        // hero headband: two tails that trail behind the knot (no physics, a lagging chain)
        bandSegs: 4,             // points per tail after the knot
        bandSeg: 3.2,            // segment length
        bandWidth: 1.6,
        bandDroop: 0.35,         // radians below horizontal
        bandSplit: 0.4,          // second tail hangs this much lower
        bandWave: 0.35,          // flutter amplitude, radians (0 under reduced motion)
        bandWaveSpeed: 9,
        bandFollow: 16,          // how fast each point catches up, per second

        heroStartX: -18,         // off the left edge
        heroFightX: 122,
        heroComboX: 160,
        enemyStartX: 338,        // off the right edge
        enemyFightX: 204,
        enemyLunge: 20,          // how far the enemy steps in on a swing

        // intro, storyboard frames 1-8 (seconds from the FIGHT! press)
        raysTime: 0.45,          // button burst
        floorAt: 0.15,
        floorDraw: 0.5,          // floor draws left to right
        heroWalkAt: 0.55,
        heroWalkIn: 1.5,
        heroStepEvery: 0.25,
        enemyJumpAt: 1.15,
        enemyJumpIn: 0.8,
        enemyJumpHeight: 52,
        enemyFlipPivot: 36,      // the flip turns around his tucked body centre, not his feet
        drawAt: 2.15,            // both draw, hearts fill
        heartEvery: 0.14,
        fightAt: 2.9,
        fightText: 0.6,
        afterFight: 0.7,

        waitMin: 0.8,
        waitMax: 2.0,
        telegraph: 0.7,
        telegraphBlinks: 2,      // 2 over 0.7 s = 2.9 per second (limit 3)
        swingImpact: 0.32,       // swing start -> impact frame
        windowBefore: 0.15,
        windowAfter: 0.07,

        heroWhiff: 0.16,
        heroHurt: 0.6,
        hitstop: 0.1,            // real time, timeScale 0
        parryRecover: 0.45,      // PARRY! -> combo opens
        a3Lift: 26,              // A3 jump height: the slash lands at the staggered enemy's head
        a3Rise: 0.28,            // A3 take-off to apex
        a3SpinTime: 0.34,        // 360 spin, take-off to impact; its last half-turn is the slash
        a3Travel: 24,            // A3 forward drift in the air
        slowScale: 0.3,
        slowDuration: 0.6,       // real time
        fallDuration: 0.85,
        fallSlide: 16,           // enemy slides back as he falls
        fallPivot: 24,           // falls around his hips, so his head stays on screen
        fallRest: 2,             // body height above the floor once down
        dropTime: 0.55,          // his sword flies out of his hands and sticks in the floor
        dropArc: 26,             // flight height
        dropSpin: 1,             // extra turns in the air
        dropAt: 26,              // lands this far behind his last standing spot: at his chest
        dropBury: 0.4,           // share of the blade in the floor
        landSquash: 0.65,        // A3 landing
        landRecover: 0.3,
        landShake: 3,
        winDelay: 0.3,           // after the fall settles

        shakeHit: 3,
        shakeParry: 4,
        shakeTime: 0.18,
        flashTime: 0.2,

        heroHearts: 3,
        enemyHearts: 3,
        maxDt: 0.05,
        storageKey: 'pg-muted'
    });

    var State = Object.freeze({
        Idle: 'Idle',
        Intro: 'Intro',
        Wait: 'Wait',
        Telegraph: 'Telegraph',
        Swing: 'Swing',
        HeroHit: 'HeroHit',
        Parry: 'Parry',
        Combo: 'Combo',
        Win: 'Win',
        Lose: 'Lose',
        Restart: 'Restart'
    });

    var COLORS = Object.freeze({
        hero: '#17171A',
        enemy: '#C8322A',
        sword: '#17171A',
        ground: '#BDB7AA',
        spark: '#FF6A3D',
        flash: '#FFFFFF'
    });
    // #endregion

    // #region Poses
    /* Stick figures, authored facing right. Origin = hip at rest; y grows
       down; feet stand on y = 24. h head, n neck, p pelvis, kb/fb back
       knee/foot, kf/ff front knee/foot, eb/hb back elbow/hand, ef/hf front
       elbow/hand. s = sword angle in degrees from the front hand (0 points
       forward, -90 up). Angles lerp linearly, so a swing's direction is
       set by the numbers, not the shortest path. bl = blade length factor
       (default 1): a short blade reads as one pointing at or away from the
       camera, which is how a level, horizontal sweep shows in profile.
       sheathed draws the sword
       in the fighter's sheath (opts.sheath) instead of in his hand. */
    var POSES = {
        // hero
        idle:    { h: [0, -30], n: [0, -23], p: [0, 0], kb: [-3, 12], fb: [-4, 24], kf: [3, 12], ff: [4, 24], eb: [-3, -12], hb: [-4, -2], ef: [3, -12], hf: [4, -2], s: 145, sheathed: true },
        walkA:   { h: [2, -30], n: [1, -23], p: [0, 0], kb: [-5, 12], fb: [-10, 24], kf: [6, 11], ff: [9, 24], eb: [3, -12], hb: [6, -3], ef: [-3, -12], hf: [-6, -3], s: 145, sheathed: true },
        walkB:   { h: [2, -31], n: [1, -24], p: [0, -1], kb: [-1, 12], fb: [-3, 24], kf: [4, 11], ff: [2, 21], eb: [-1, -12], hb: [0, -2], ef: [1, -12], hf: [1, -2], s: 145, sheathed: true },
        draw:    { h: [1, -30], n: [0, -23], p: [0, 1], kb: [-6, 13], fb: [-10, 24], kf: [6, 12], ff: [9, 24], eb: [-4, -12], hb: [-6, -4], ef: [3, -17], hf: [2, -26], s: -110 },
        guard:   { h: [3, -28], n: [2, -21], p: [0, 2], kb: [-7, 13], fb: [-12, 24], kf: [7, 12], ff: [11, 24], eb: [-4, -11], hb: [-8, -5], ef: [6, -13], hf: [10, -10], s: -50 },
        windup:  { h: [1, -29], n: [1, -22], p: [0, 2], kb: [-7, 13], fb: [-12, 24], kf: [7, 12], ff: [11, 24], eb: [-4, -12], hb: [-8, -6], ef: [0, -18], hf: [-2, -27], s: -160 },
        strike:  { h: [8, -26], n: [6, -19], p: [2, 3], kb: [-8, 13], fb: [-14, 24], kf: [11, 12], ff: [15, 24], eb: [-3, -10], hb: [-9, -6], ef: [12, -15], hf: [20, -11], s: 20 },
        parry:   { h: [5, -28], n: [4, -21], p: [1, 2], kb: [-7, 13], fb: [-12, 24], kf: [7, 12], ff: [11, 24], eb: [-3, -11], hb: [-8, -6], ef: [9, -17], hf: [14, -23], s: -55 },
        hurt:    { h: [-7, -27], n: [-5, -20], p: [-1, 1], kb: [-8, 12], fb: [-10, 24], kf: [3, 12], ff: [6, 24], eb: [-10, -16], hb: [-14, -22], ef: [1, -14], hf: [4, -20], s: -120 },
        // combo, storyboard frames 10-18
        a1Wind:   { h: [-2, -30], n: [-2, -23], p: [0, 1], kb: [-6, 12], fb: [-10, 24], kf: [6, 12], ff: [10, 24], eb: [-8, -16], hb: [-6, -24], ef: [-3, -15], hf: [-6, -24], s: -150 },
        a1:       { h: [10, -20], n: [8, -13], p: [2, 6], kb: [-9, 15], fb: [-18, 24], kf: [12, 14], ff: [18, 24], eb: [-4, -10], hb: [-14, -14], ef: [14, -10], hf: [22, -8], s: 5 },
        a2Grab:   { h: [6, -28], n: [5, -21], p: [1, 2], kb: [-7, 13], fb: [-13, 24], kf: [8, 12], ff: [13, 24], eb: [4, -14], hb: [14, -15], ef: [8, -16], hf: [16, -16], s: 0 },
        a2Mid:    { h: [4, -29], n: [3, -22], p: [1, 1], kb: [-6, 12], fb: [-12, 24], kf: [7, 12], ff: [12, 24], eb: [7, -22], hb: [12, -30], ef: [8, -23], hf: [13, -31], s: -90 },
        a2End:    { h: [0, -30], n: [0, -23], p: [0, 0], kb: [-5, 12], fb: [-9, 24], kf: [5, 12], ff: [9, 24], eb: [6, -27], hb: [2, -35], ef: [7, -28], hf: [3, -36], s: -180 },
        a3Crouch: { h: [-2, -18], n: [-2, -11], p: [0, 8], kb: [-8, 16], fb: [-12, 24], kf: [8, 15], ff: [12, 24], eb: [-6, -6], hb: [-10, 0], ef: [-2, -6], hf: [-8, 2], s: 170 },
        // a3Spin/a3Air hold the blade level: the spin's cos squash turns it into a horizontal slash
        a3Spin:   { h: [1, -30], n: [1, -23], p: [0, 0], kb: [-8, 2], fb: [-5, 12], kf: [9, 8], ff: [3, 17], eb: [5, -18], hb: [10, -15], ef: [6, -19], hf: [12, -14], s: 0 },
        a3Air:    { h: [4, -29], n: [3, -22], p: [0, 0], kb: [-8, 2], fb: [-5, 12], kf: [9, 8], ff: [3, 17], eb: [-5, -30], hb: [-8, -38], ef: [10, -15], hf: [20, -10], s: 0 },
        // follow-through (frame 17): the level sweep carries on the way the spin turned,
        // across his body (blade short: pointing at the camera) and out behind him
        a3SweepA: { h: [3, -29], n: [2, -22], p: [0, 0], kb: [-8, 2], fb: [-5, 12], kf: [9, 8], ff: [3, 17], eb: [-4, -27], hb: [-5, -34], ef: [8, -17], hf: [8, -13], s: 0, bl: 0.12 },
        a3SweepB: { h: [1, -29], n: [1, -22], p: [0, 0], kb: [-8, 2], fb: [-5, 12], kf: [9, 8], ff: [3, 17], eb: [2, -24], hb: [4, -31], ef: [2, -18], hf: [-3, -15], s: -180, bl: 0.12 },
        a3Follow: { h: [-1, -30], n: [0, -23], p: [0, 0], kb: [-8, 2], fb: [-5, 12], kf: [9, 8], ff: [3, 17], eb: [8, -18], hb: [13, -25], ef: [-4, -20], hf: [-9, -22], s: -125 },
        land:     { h: [0, -17], n: [0, -10], p: [0, 8], kb: [-11, 15], fb: [-20, 24], kf: [11, 15], ff: [20, 24], eb: [9, -11], hb: [17, -12], ef: [-7, -13], hf: [-14, -12], s: -160 },
        kneel:   { h: [6, -16], n: [4, -9], p: [-2, 10], kb: [-8, 24], fb: [-18, 24], kf: [8, 10], ff: [8, 24], eb: [0, -2], hb: [-2, 6], ef: [8, -2], hf: [12, 4], s: 85 },
        // win (frame 19): hand on hip, sword resting on the shoulder
        victory:  { h: [0, -30], n: [0, -23], p: [0, 0], kb: [-3, 12], fb: [-5, 24], kf: [4, 12], ff: [6, 24], eb: [-11, -14], hb: [-2, 0], ef: [7, -14], hf: [3, -21], s: -160 },

        // enemy (two-handed great sword: both hands on the hilt)
        eIdle:     { h: [0, -30], n: [0, -23], p: [0, 0], kb: [-4, 12], fb: [-6, 24], kf: [4, 12], ff: [6, 24], eb: [-2, -12], hb: [3, -17], ef: [6, -12], hf: [4, -16], s: -130 },
        eJump:     { h: [2, -29], n: [1, -22], p: [0, 0], kb: [-6, 6], fb: [-3, 15], kf: [7, 4], ff: [5, 14], eb: [-3, -16], hb: [2, -22], ef: [5, -16], hf: [3, -22], s: -115 },
        eLand:     { h: [5, -18], n: [4, -11], p: [0, 9], kb: [-10, 15], fb: [-12, 24], kf: [10, 14], ff: [12, 24], eb: [1, -4], hb: [8, 0], ef: [6, -4], hf: [9, -1], s: 15 },
        eGuard:    { h: [2, -29], n: [1, -22], p: [0, 2], kb: [-7, 13], fb: [-12, 24], kf: [7, 12], ff: [11, 24], eb: [-1, -12], hb: [7, -9], ef: [5, -12], hf: [8, -10], s: -30 },
        eAntic:    { h: [1, -25], n: [0, -18], p: [0, 5], kb: [-8, 14], fb: [-12, 24], kf: [8, 14], ff: [11, 24], eb: [-3, -12], hb: [2, -18], ef: [2, -12], hf: [3, -18], s: -100 },
        eWindup:   { h: [-4, -30], n: [-3, -23], p: [-1, 1], kb: [-8, 12], fb: [-12, 24], kf: [6, 12], ff: [11, 24], eb: [-6, -28], hb: [-5, -36], ef: [-4, -30], hf: [-6, -36], s: -165 },
        eSwing:    { h: [11, -22], n: [9, -15], p: [5, 4], kb: [-5, 13], fb: [-12, 24], kf: [15, 12], ff: [21, 24], eb: [12, -10], hb: [20, -8], ef: [14, -11], hf: [21, -9], s: 28 },
        eRecoil:   { h: [-8, -27], n: [-6, -20], p: [-2, 2], kb: [-9, 12], fb: [-12, 24], kf: [4, 12], ff: [8, 24], eb: [-10, -26], hb: [-6, -34], ef: [-8, -26], hf: [-5, -34], s: -120 },
        eStagger:  { h: [-1, -21], n: [-2, -14], p: [-2, 5], kb: [-8, 14], fb: [-11, 24], kf: [5, 14], ff: [8, 24], eb: [1, -8], hb: [3, -6], ef: [3, -8], hf: [4, -7], s: -232 },
        eStagger2: { h: [-4, -22], n: [-3, -15], p: [-3, 5], kb: [-9, 14], fb: [-11, 24], kf: [4, 14], ff: [8, 24], eb: [0, -9], hb: [2, -7], ef: [2, -9], hf: [3, -8], s: -235 },
        eHit:      { h: [-9, -23], n: [-7, -16], p: [-3, 4], kb: [-9, 13], fb: [-11, 24], kf: [4, 14], ff: [8, 24], eb: [-4, -6], hb: [2, 2], ef: [-2, -8], hf: [3, 1], s: -215 },
        eFallen:   { h: [-2, -30], n: [-1, -23], p: [0, 0], kb: [-1, 12], fb: [-2, 24], kf: [1, 12], ff: [2, 24], eb: [-10, -20], hb: [-16, -28], ef: [8, -16], hf: [14, -12], s: -320 },
        eHit2:     { h: [3, -17], n: [0, -11], p: [-4, 4], kb: [-10, 13], fb: [-12, 24], kf: [2, 14], ff: [6, 24], eb: [2, -4], hb: [6, 4], ef: [4, -5], hf: [7, 3], s: -212 },

        // enemy intro (frames 4-7): great sword on his back until he draws.
        // eReach's front hand sits on the sheathed hilt, so the draw is seamless.
        eTuck:     { h: [3, -22], n: [2, -16], p: [0, 0], kb: [5, 4], fb: [-2, 10], kf: [7, 2], ff: [1, 9], eb: [5, -12], hb: [6, -6], ef: [6, -12], hf: [7, -6], s: 0, sheathed: true },
        eLandS:    { h: [5, -18], n: [4, -11], p: [0, 9], kb: [-10, 15], fb: [-12, 24], kf: [10, 14], ff: [12, 24], eb: [4, -4], hb: [9, 0], ef: [7, -4], hf: [10, 1], s: 0, sheathed: true },
        eStandS:   { h: [0, -30], n: [0, -23], p: [0, 0], kb: [-4, 12], fb: [-6, 24], kf: [4, 12], ff: [6, 24], eb: [-3, -12], hb: [-4, -2], ef: [3, -12], hf: [4, -2], s: 0, sheathed: true },
        eReach:    { h: [1, -30], n: [0, -23], p: [0, 0], kb: [-4, 12], fb: [-6, 24], kf: [4, 12], ff: [6, 24], eb: [-3, -12], hb: [-4, -2], ef: [4, -30], hf: [-3, -26], s: -260, sheathed: true },
        eDraw:     { h: [1, -30], n: [0, -23], p: [0, 0], kb: [-5, 12], fb: [-8, 24], kf: [5, 12], ff: [8, 24], eb: [-3, -28], hb: [0, -35], ef: [5, -30], hf: [2, -36], s: -60 }
    };

    var JOINTS = ['h', 'n', 'p', 'kb', 'fb', 'kf', 'ff', 'eb', 'hb', 'ef', 'hf'];
    var J = {};                          // joint name -> index into the flat array
    JOINTS.forEach(function (k, i) { J[k] = i * 2; });
    var PTS = JOINTS.length * 2;
    var ANGLE = PTS;                     // sword angle slot
    var SHEATH = PTS + 1;                // 1 = sheathed
    var BLADE = PTS + 2;                 // blade length factor
    var POSE_LEN = PTS + 3;

    // compile once into flat arrays: sampling then allocates nothing
    var COMPILED = {};
    Object.keys(POSES).forEach(function (name) {
        var src = POSES[name], out = new Float32Array(POSE_LEN);
        JOINTS.forEach(function (k) { out[J[k]] = src[k][0]; out[J[k] + 1] = src[k][1]; });
        out[ANGLE] = src.s;
        out[SHEATH] = src.sheathed ? 1 : 0;
        out[BLADE] = src.bl != null ? src.bl : 1;
        COMPILED[name] = out;
    });
    // #endregion

    // #region Easing
    var Ease = {
        linear: function (t) { return t; },
        inQuad: function (t) { return t * t; },
        outQuad: function (t) { return t * (2 - t); },
        inOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t); },
        outBack: function (t) { var c = 1.7, u = t - 1; return 1 + u * u * ((c + 1) * u + c); },
        outBounce: function (t) {
            if (t < 0.6) return (t / 0.6) * (t / 0.6);
            if (t < 0.85) { var a = (t - 0.725) / 0.125; return 1 - 0.08 * (1 - a * a); }
            var b = (t - 0.925) / 0.075; return 1 - 0.02 * (1 - b * b);
        }
    };
    // #endregion

    // #region Tween
    /* A single scalar tween. Fighters own one per animated value. */
    function Tween(v) {
        this.v = v; this.from = v; this.to = v; this.t = 0; this.dur = 0; this.ease = Ease.linear;
    }
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
    Tween.prototype.done = function () { return this.dur <= 0 || this.t >= this.dur; };
    // #endregion

    // #region Fighter
    var TRAIL_LEN = 6;

    function Fighter(opts) {
        this.color = opts.color;
        this.facing = opts.facing;           // 1 faces right, -1 faces left
        this.scale = opts.scale;
        this.swordLen = opts.swordLen;
        this.swordWidth = opts.swordWidth;
        this.guardWidth = opts.guardWidth;
        this.sheath = opts.sheath;           // { joint, dx, dy, deg, lenK }
        this.horns = !!opts.horns;
        this.band = opts.band ? new Float32Array(2 * (CONFIG.bandSegs + 1) * 2) : null;   // 2 tails, world x/y
        this.bandT = 0;
        this.bandSnap = true;                // lay the tails out fresh next update
        this.dropped = false;                // sword left the hand (death)
        this.dropT = 0;
        this.dropX0 = 0; this.dropY0 = 0; this.dropA0 = 0;   // hilt start, world angle in degrees
        this.dropX1 = 0; this.dropY1 = 0; this.dropA1 = 0;
        this.x = new Tween(0);
        this.lift = new Tween(0);            // height above the ground
        this.rot = new Tween(0);             // radians, screen-plane turn
        this.pivot = 0;                      // rot pivot height above the feet
        this.spin = new Tween(0);            // radians, turn around the body axis
        this.squash = new Tween(1);          // 1 = none; <1 squashes down
        this.jumpH = 0;                      // > 0 while a jump arc plays
        this.visible = true;
        this.smear = false;

        this.cur = new Float32Array(POSE_LEN);
        this.from = new Float32Array(POSE_LEN);
        this.to = COMPILED[opts.pose];
        this.poseT = 0;
        this.poseDur = 0;
        this.poseEase = Ease.outQuad;
        this.queue = [];                     // queued poses: [name, dur, ease]
        this.cur.set(this.to);

        // smear trail: ring of hilt/tip world points
        this.trail = new Float32Array(TRAIL_LEN * 4);
        this.trailCount = 0;
        this.tmp = new Float32Array(2);
    }

    /* starts a pose now and drops anything queued */
    Fighter.prototype.pose = function (name, dur, ease) {
        this.queue.length = 0;
        return this.startPose(name, dur, ease);
    };

    Fighter.prototype.startPose = function (name, dur, ease) {
        this.from.set(this.cur);
        this.to = COMPILED[name];
        this.poseT = 0;
        this.poseDur = dur;
        this.poseEase = ease || Ease.outQuad;
        if (dur <= 0) this.cur.set(this.to);
        return this;
    };

    /* queues a pose after the current one; chainable */
    Fighter.prototype.then = function (name, dur, ease) {
        this.queue.push([name, dur, ease]);
        return this;
    };

    Fighter.prototype.poseDone = function () {
        return !this.queue.length && (this.poseDur <= 0 || this.poseT >= this.poseDur);
    };

    Fighter.prototype.jumpTo = function (x, dur, height) {
        this.x.go(x, dur, Ease.linear);
        this.jumpH = height;
    };

    /* clears motion state, keeps position and pose */
    Fighter.prototype.reset = function () {
        this.lift.set(0);
        this.rot.set(0);
        this.pivot = 0;
        this.spin.set(0);
        this.squash.set(1);
        this.jumpH = 0;
        this.visible = true;
        this.smear = false;
        this.trailCount = 0;
        this.bandSnap = true;
        this.dropped = false;
    };

    Fighter.prototype.place = function (x, poseName) {
        this.reset();
        this.x.set(x);
        this.pose(poseName, 0);
    };

    Fighter.prototype.update = function (dt) {
        // start the next queued pose this frame, so a chain loses no frame per key
        if (this.queue.length && (this.poseDur <= 0 || this.poseT >= this.poseDur)) {
            var n = this.queue.shift();
            this.startPose(n[0], n[1], n[2]);
        }
        if (this.poseDur > 0 && this.poseT < this.poseDur) {
            this.poseT = Math.min(this.poseT + dt, this.poseDur);
            var k = this.poseEase(this.poseT / this.poseDur);
            for (var i = 0; i <= ANGLE; i++) this.cur[i] = this.from[i] + (this.to[i] - this.from[i]) * k;
            this.cur[BLADE] = this.from[BLADE] + (this.to[BLADE] - this.from[BLADE]) * k;
            // the blade leaves the sheath as soon as the draw starts: the hand is on the hilt
            this.cur[SHEATH] = this.from[SHEATH] && this.to[SHEATH] ? 1 : 0;
        }
        this.x.step(dt);
        this.rot.step(dt);
        this.spin.step(dt);
        this.squash.step(dt);
        if (this.jumpH > 0) {
            var u = this.x.dur > 0 ? this.x.t / this.x.dur : 1;
            this.lift.v = this.jumpH * 4 * u * (1 - u);
            if (u >= 1) { this.jumpH = 0; this.lift.v = 0; }
        } else {
            this.lift.step(dt);
        }
        this.recordTrail();
        if (this.band) this.updateBand(dt);
        if (this.dropped && this.dropT < CONFIG.dropTime) this.dropT = Math.min(this.dropT + dt, CONFIG.dropTime);
    };

    /* the sword leaves his hands, spins and sticks in the floor, hilt up.
       Angles are world degrees; 90 points straight down. */
    Fighter.prototype.dropSword = function (x) {
        var C = CONFIG;
        this.swordPoint(0, this.tmp);
        this.dropped = true;
        this.dropT = 0;
        this.dropX0 = this.tmp[0];
        this.dropY0 = this.tmp[1];
        this.dropA0 = this.facing > 0 ? this.cur[ANGLE] : 180 - this.cur[ANGLE];
        this.dropX1 = x;
        this.dropY1 = C.groundY - this.swordLen * this.scale * (1 - C.dropBury);
        this.dropA1 = 90 + 360 * Math.ceil((this.dropA0 - 90) / 360 + C.dropSpin);
    };

    /* each tail point eases toward a spot one segment behind the previous
       one, so the tails stream back when he moves and swirl when he spins */
    Fighter.prototype.updateBand = function (dt) {
        var C = CONFIG, b = this.band, p = this.cur, n = C.bandSegs + 1;
        var back = Math.cos(this.spin.v) < 0 ? this.facing : -this.facing;
        var wave = reducedMotion ? 0 : C.bandWave;
        var k = this.bandSnap ? 1 : Math.min(1, dt * C.bandFollow);
        this.toWorld(p[J.h] - C.headRadius * 0.8, p[J.h + 1] - 1.5, this.tmp);   // knot
        this.bandT += dt;
        for (var t = 0; t < 2; t++) {
            var o = t * n * 2;
            b[o] = this.tmp[0];
            b[o + 1] = this.tmp[1];
            for (var i = 1; i < n; i++) {
                var q = o + i * 2;
                var a = C.bandDroop + t * C.bandSplit + Math.sin(this.bandT * C.bandWaveSpeed - i * 0.9 + t) * wave;
                b[q] += (b[q - 2] + back * Math.cos(a) * C.bandSeg - b[q]) * k;
                b[q + 1] += (b[q - 1] + Math.sin(a) * C.bandSeg - b[q + 1]) * k;
            }
        }
        this.bandSnap = false;
    };

    /* local pose point -> world (ignores rot; trails and hit points are
       only needed while the fighter stands upright) */
    Fighter.prototype.toWorld = function (lx, ly, out) {
        var s = this.scale;
        out[0] = this.x.v + lx * s * this.facing * Math.cos(this.spin.v);
        out[1] = CONFIG.groundY - this.lift.v + (ly - 24) * s * this.squash.v;
        return out;
    };

    Fighter.prototype.swordPoint = function (along, out) {
        var c = this.cur, a = c[ANGLE] * Math.PI / 180, len = this.swordLen * c[BLADE] * along;
        return this.toWorld(c[J.hf] + Math.cos(a) * len, c[J.hf + 1] + Math.sin(a) * len, out);
    };

    Fighter.prototype.recordTrail = function () {
        var tr = this.trail;
        if (!this.smear || this.cur[SHEATH]) {
            if (this.trailCount > 0) this.trailCount--;   // fade out one sample per frame
            return;
        }
        tr.copyWithin(4, 0, (TRAIL_LEN - 1) * 4);         // shift, newest at 0
        this.swordPoint(0.15, this.tmp); tr[0] = this.tmp[0]; tr[1] = this.tmp[1];
        this.swordPoint(1, this.tmp);    tr[2] = this.tmp[0]; tr[3] = this.tmp[1];
        if (this.trailCount < TRAIL_LEN) this.trailCount++;
    };
    // #endregion

    // #region DOM refs (cached once)
    var root = document.getElementById('parryGame');
    if (!root || root.dataset.pgReady) return;
    root.dataset.pgReady = '1';

    var stage = root.querySelector('.pg-stage');
    var canvas = root.querySelector('.pg-canvas');
    var ctx = canvas.getContext('2d');
    var hud = root.querySelector('.pg-hud');
    var heroHeartEls = root.querySelectorAll('.pg-hearts--hero .pg-heart');
    var enemyHeartEls = root.querySelectorAll('.pg-hearts--enemy .pg-heart');
    var textEl = root.querySelector('.pg-text');
    var fightBtn = root.querySelector('.pg-fight');
    var resultEl = root.querySelector('.pg-result');
    var resultTitle = root.querySelector('.pg-result-title');
    var resultSub = root.querySelector('.pg-result-sub');
    var restartBtn = root.querySelector('.pg-restart');
    var linkEl = root.querySelector('.pg-link');
    var muteBtn = root.querySelector('.pg-mute');
    var debugEl = root.querySelector('.pg-debug');
    var parryTab = document.querySelector('[data-project-tabs="pizza"] [data-tab="parry"]');

    var DEBUG = /[?&]debug\b/.test(location.search);
    if (DEBUG) debugEl.hidden = false;

    var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reducedMotion = !!(motionQuery && motionQuery.matches);
    if (motionQuery) {
        var onMotion = function (e) { reducedMotion = e.matches; };
        if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotion);
        else if (motionQuery.addListener) motionQuery.addListener(onMotion);
    }
    // #endregion

    // #region Game state
    // sheath: joint, offset, blade angle, length factor (hero hip, enemy back)
    var hero = new Fighter({ color: COLORS.hero, facing: 1, scale: CONFIG.heroScale, swordLen: CONFIG.heroSword, swordWidth: 2.2, guardWidth: 3, pose: 'idle', band: true,
        sheath: { joint: 'p', dx: -2, dy: 1, deg: 145, lenK: 0.85 } });
    var enemy = new Fighter({ color: COLORS.enemy, facing: -1, scale: CONFIG.enemyScale, swordLen: CONFIG.enemySword, swordWidth: 3.4, guardWidth: 4.5, pose: 'eStandS',
        sheath: { joint: 'n', dx: -3, dy: -3, deg: 100, lenK: 1 }, horns: true });
    // idle is an empty box: both wait off screen, hidden
    hero.place(CONFIG.heroStartX, 'idle');
    enemy.place(CONFIG.enemyStartX, 'eStandS');
    hero.visible = false;
    enemy.visible = false;

    var g = {
        state: State.Idle,
        stateTime: 0,            // game time in the current state
        timeScale: 1,
        hitstopLeft: 0,          // real seconds
        slowLeft: 0,             // real seconds
        inputLocked: false,
        whiffed: false,
        waitDur: 0,
        heroHearts: CONFIG.heroHearts,
        enemyHearts: CONFIG.enemyHearts,
        reactionMs: 0,
        introStepIndex: -1,
        introWalk: false,
        introStood: false,
        introJump: false,
        introLanded: false,
        introDrawn: false,
        introFight: false,
        heartsShown: 0,          // hearts popped in so far (intro fill)
        floorK: 0,               // 0..1, how much of the floor is drawn
        raysT: -1,               // FIGHT! burst age, real seconds; -1 = off
        comboStep: 0,
        eventIdx: 0,             // next timed event of the current combo step
        actionT: 0,              // time since the last combo hit
        impactAt: 0,
        impactPending: false,
        enemyReturned: false,
        textLeft: 0,             // real seconds the centre text stays up
        shakeLeft: 0,
        shakeAmp: 0,
        flashT: -1,
        flashX: 0,
        flashY: 0,
        started: false,          // FIGHT! pressed at least once
        active: false,           // loop wanted
        inView: true,
        rafId: 0,
        lastFrame: 0,
        fps: 0
    };

    // view transform (set on resize)
    var view = { w: 0, h: 0, dpr: 1, s: 1, ox: 0, oy: 0 };

    // sparks pool
    var SPARKS = 28;
    var sparks = [];
    for (var si = 0; si < SPARKS; si++) sparks.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1 });

    var tmpA = new Float32Array(2);
    // #endregion

    // #region Audio
    /* Web Audio, created on the FIGHT! press (first user gesture, so iOS
       Safari allows it). A missing or undecodable file just stays silent. */
    var SOUND_FILES = { swing: 'swing', parry: 'parry', hit: 'hit', final: 'final', jump: 'jump', step: 'step' };
    var audio = { ctx: null, gain: null, buffers: {}, muted: false };

    try { audio.muted = localStorage.getItem(CONFIG.storageKey) === '1'; } catch (e) { /* storage blocked */ }
    syncMuteButton();

    function initAudio() {
        if (audio.ctx) { if (audio.ctx.state === 'suspended') audio.ctx.resume(); return; }
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try { audio.ctx = new AC(); } catch (e) { return; }
        audio.gain = audio.ctx.createGain();
        audio.gain.gain.value = audio.muted ? 0 : 0.7;
        audio.gain.connect(audio.ctx.destination);
        if (audio.ctx.state === 'suspended') audio.ctx.resume();
        Object.keys(SOUND_FILES).forEach(loadSound);
    }

    function loadSound(key) {
        if (!window.fetch) return;
        fetch('assets/audio/parry/' + SOUND_FILES[key] + '.mp3')
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
            .then(function (data) {
                // callback form: older Safari has no promise-returning decodeAudioData
                return new Promise(function (res, rej) { audio.ctx.decodeAudioData(data, res, rej); });
            })
            .then(function (buf) { audio.buffers[key] = buf; })
            .catch(function () { /* missing file: stay silent */ });
    }

    function play(key, rate, vol) {
        var buf = audio.buffers[key];
        if (!audio.ctx || !buf || audio.muted) return;
        var src = audio.ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = rate || 1;
        if (vol != null && vol !== 1) {
            var gn = audio.ctx.createGain();
            gn.gain.value = vol;
            src.connect(gn);
            gn.connect(audio.gain);
        } else {
            src.connect(audio.gain);
        }
        src.start();
    }

    function setMuted(m) {
        audio.muted = m;
        try { localStorage.setItem(CONFIG.storageKey, m ? '1' : '0'); } catch (e) { /* storage blocked */ }
        if (audio.gain) audio.gain.gain.value = m ? 0 : 0.7;
        syncMuteButton();
    }

    function syncMuteButton() {
        muteBtn.setAttribute('aria-pressed', audio.muted ? 'true' : 'false');
        muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute sound' : 'Mute sound');
    }
    // #endregion

    // #region HUD + text
    /* hero hearts fill and empty left to right; enemy hearts mirror them,
       filling right to left and emptying from the left */
    function renderHearts() {
        var hn = heroHeartEls.length, en = enemyHeartEls.length;
        for (var i = 0; i < hn; i++) {
            heroHeartEls[i].classList.toggle('is-hidden', i >= g.heartsShown);
            heroHeartEls[i].classList.toggle('is-empty', i >= g.heroHearts);
        }
        for (var j = 0; j < en; j++) {
            enemyHeartEls[j].classList.toggle('is-hidden', j < en - g.heartsShown);
            enemyHeartEls[j].classList.toggle('is-empty', j < en - g.enemyHearts);
        }
    }

    function showText(str, seconds, isParry) {
        textEl.textContent = str;
        textEl.classList.toggle('is-parry', !!isParry);
        textEl.classList.add('is-on');
        g.textLeft = seconds;
        if (!reducedMotion && textEl.animate) {
            textEl.animate(
                [{ transform: 'scale(1.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
                { duration: 140, easing: 'cubic-bezier(.2,.8,.2,1)' });
        }
    }

    function hideText() {
        textEl.classList.remove('is-on');
        g.textLeft = 0;
    }

    function showResult(title, sub, isLoss) {
        resultEl.classList.toggle('is-loss', !!isLoss);
        resultTitle.textContent = title;
        resultSub.textContent = sub;
        resultEl.hidden = false;
        restartBtn.focus({ preventScroll: true });
    }
    // #endregion

    // #region Effects
    function shake(amp) {
        if (reducedMotion) return;
        g.shakeAmp = amp;
        g.shakeLeft = CONFIG.shakeTime;
    }

    function flashAt(x, y) {
        g.flashT = 0;
        g.flashX = x;
        g.flashY = y;
    }

    function spawnSparks(x, y, count, dir, speed) {
        for (var i = 0, made = 0; i < SPARKS && made < count; i++) {
            var sp = sparks[i];
            if (sp.life > 0) continue;
            var a = (Math.random() - 0.5) * Math.PI * 1.2 + (dir < 0 ? Math.PI : 0) - 0.4 * dir;
            var v = speed * (0.5 + Math.random() * 0.7);
            sp.x = x; sp.y = y;
            sp.vx = Math.cos(a) * v;
            sp.vy = Math.sin(a) * v;
            sp.max = sp.life = 0.18 + Math.random() * 0.18;
            made++;
        }
    }

    function updateEffects(dt, realDt) {
        for (var i = 0; i < SPARKS; i++) {
            var sp = sparks[i];
            if (sp.life <= 0) continue;
            sp.life -= dt;
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.vy += 260 * dt;
        }
        if (g.flashT >= 0) {
            g.flashT += realDt;
            if (g.flashT > CONFIG.flashTime) g.flashT = -1;
        }
        if (g.raysT >= 0) {
            g.raysT += realDt;
            if (g.raysT > CONFIG.raysTime) g.raysT = -1;
        }
        if (g.shakeLeft > 0) g.shakeLeft = Math.max(0, g.shakeLeft - realDt);
        if (g.textLeft > 0) {
            g.textLeft -= realDt;
            if (g.textLeft <= 0) hideText();
        }
    }

    function clearEffects() {
        for (var i = 0; i < SPARKS; i++) sparks[i].life = 0;
        g.flashT = -1;
        g.raysT = -1;
        g.shakeLeft = 0;
        g.hitstopLeft = 0;
        g.slowLeft = 0;
        g.timeScale = 1;
    }
    // #endregion

    // #region State machine
    function setState(next) {
        g.state = next;
        g.stateTime = 0;
        ENTER[next]();
    }

    var ENTER = {};
    var UPDATE = {};
    var ACTION = {};         // what one attack input does in each state

    // Idle: static scene, FIGHT! blinks. No loop.
    ENTER[State.Idle] = function () { };
    UPDATE[State.Idle] = function () { };
    ACTION[State.Idle] = function () { startFight(); };

    // Intro, storyboard frames 1-8: button burst, floor draws, hero walks in,
    // enemy front-flips in, both draw while the hearts fill, FIGHT!, pause.
    ENTER[State.Intro] = function () {
        g.introStepIndex = -1;
        g.introWalk = false;
        g.introStood = false;
        g.introJump = false;
        g.introLanded = false;
        g.introDrawn = false;
        g.introFight = false;
        g.heartsShown = 0;
        g.floorK = 0;
        g.raysT = 0;
        fightBtn.classList.add('is-out');
    };
    UPDATE[State.Intro] = function () {
        var t = g.stateTime, C = CONFIG;
        if (!fightBtn.hidden && t >= C.raysTime) {
            fightBtn.hidden = true;
            fightBtn.classList.remove('is-out');
        }

        // frame 2: floor, left to right
        var fk = (t - C.floorAt) / C.floorDraw;
        g.floorK = fk <= 0 ? 0 : fk >= 1 ? 1 : Ease.outQuad(fk);

        // frames 3-4: hero walks in from the left, sword sheathed
        if (!g.introWalk && t >= C.heroWalkAt) {
            g.introWalk = true;
            hero.visible = true;
            hero.x.go(C.heroFightX, C.heroWalkIn, Ease.linear);
        }
        if (g.introWalk) {
            var wt = t - C.heroWalkAt;
            if (wt < C.heroWalkIn) {
                var idx = Math.floor(wt / C.heroStepEvery);
                if (idx !== g.introStepIndex) {
                    g.introStepIndex = idx;
                    hero.pose(idx % 2 ? 'walkB' : 'walkA', C.heroStepEvery, Ease.inOut);
                    if (idx % 2 === 0) play('step', 1.2, 0.35);
                }
            } else if (!g.introStood) {
                g.introStood = true;
                hero.pose('idle', 0.12, Ease.outQuad);
            }
        }

        // frame 4: enemy front-flips in from the right. He faces left, so
        // forward is counter-clockwise (negative).
        if (!g.introJump && t >= C.enemyJumpAt) {
            g.introJump = true;
            enemy.visible = true;
            enemy.pose('eTuck', 0.15, Ease.outQuad);
            enemy.jumpTo(C.enemyFightX, C.enemyJumpIn, C.enemyJumpHeight);
            enemy.pivot = C.enemyFlipPivot;
            enemy.rot.go(-Math.PI * 2, C.enemyJumpIn * 0.9, Ease.inOut);
            play('jump', 1, 0.8);
        }
        // frame 5: lands in front of the hero, sword still on his back
        if (g.introJump && !g.introLanded && t >= C.enemyJumpAt + C.enemyJumpIn) {
            g.introLanded = true;
            enemy.rot.set(0);
            enemy.pivot = 0;
            enemy.pose('eLandS', 0.06, Ease.outQuad).then('eStandS', 0.3, Ease.outBack);
            enemy.squash.set(0.8);
            enemy.squash.go(1, 0.3, Ease.outBack);
            shake(2);
            play('step', 0.7, 1);
        }

        // frames 6-7, same time: both draw and take stances, hearts fill
        if (!g.introDrawn && t >= C.drawAt) {
            g.introDrawn = true;
            enemy.pose('eReach', 0.12, Ease.outQuad).then('eDraw', 0.14, Ease.inOut).then('eGuard', 0.3, Ease.outBack);
            hero.pose('draw', 0.2, Ease.outQuad).then('guard', 0.35, Ease.outBack);
            play('swing', 1.6, 0.35);
        }
        if (g.introDrawn && g.heartsShown < C.heroHearts) {
            var n = Math.min(C.heroHearts, Math.floor((t - C.drawAt) / C.heartEvery) + 1);
            if (n !== g.heartsShown) {
                g.heartsShown = n;
                renderHearts();
                play('step', 1.5 + n * 0.15, 0.3);
            }
        }

        // frame 8
        if (!g.introFight && t >= C.fightAt) {
            g.introFight = true;
            showText('FIGHT!', C.fightText, false);
        }
        if (t >= C.fightAt + C.fightText + C.afterFight) setState(State.Wait);
    };
    ACTION[State.Intro] = function () { skipIntro(); };

    // Wait: random pause before each swing.
    ENTER[State.Wait] = function () {
        g.waitDur = CONFIG.waitMin + Math.random() * (CONFIG.waitMax - CONFIG.waitMin);
        enemy.visible = true;
    };
    UPDATE[State.Wait] = function () {
        if (g.stateTime >= g.waitDur) setState(State.Telegraph);
    };
    ACTION[State.Wait] = function () {
        whiff();
        setState(State.Telegraph);      // a whiff is punished straight away
    };

    // Telegraph: anticipation crouch, wind-up, blink on/off.
    ENTER[State.Telegraph] = function () {
        var T = CONFIG.telegraph;
        enemy.pose('eAntic', T * 0.3, Ease.outQuad).then('eWindup', T * 0.6, Ease.inOut);
    };
    UPDATE[State.Telegraph] = function () {
        var cycle = CONFIG.telegraph / CONFIG.telegraphBlinks;
        var phase = (g.stateTime % cycle) / cycle;
        enemy.visible = !(phase >= 0.25 && phase < 0.6);
        if (g.stateTime >= CONFIG.telegraph) {
            enemy.visible = true;
            setState(State.Swing);
        }
    };
    ACTION[State.Telegraph] = function () { whiff(); };

    // Swing: the great sword comes down. The parry window sits around impact.
    ENTER[State.Swing] = function () {
        enemy.pose('eSwing', CONFIG.swingImpact, Ease.inQuad);
        enemy.x.go(CONFIG.enemyFightX - CONFIG.enemyLunge, CONFIG.swingImpact, Ease.inQuad);
        enemy.smear = true;
        play('swing', 1, 0.9);
    };
    UPDATE[State.Swing] = function () {
        if (g.stateTime >= CONFIG.swingImpact) enemy.smear = false;
        if (g.stateTime >= CONFIG.swingImpact + CONFIG.windowAfter) setState(State.HeroHit);
    };
    ACTION[State.Swing] = function () {
        var t = swingTimeNow();
        var open = CONFIG.swingImpact - CONFIG.windowBefore;
        var close = CONFIG.swingImpact + CONFIG.windowAfter;
        if (t >= open && t <= close) {
            g.reactionMs = Math.round(t * 1000);
            setState(State.Parry);
        } else {
            whiff();
        }
    };

    // HeroHit: lose a heart, input locked, back to Wait or Lose.
    ENTER[State.HeroHit] = function () {
        g.inputLocked = true;
        g.heroHearts = Math.max(0, g.heroHearts - 1);
        renderHearts();
        enemy.smear = false;
        hero.pose('hurt', 0.1, Ease.outQuad);
        hero.x.go(CONFIG.heroFightX - 10, 0.18, Ease.outQuad);
        hero.smear = false;
        hero.toWorld(hero.cur[J.n], hero.cur[J.n + 1] + 4, tmpA);
        spawnSparks(tmpA[0], tmpA[1], 8, -1, 120);
        shake(CONFIG.shakeHit);
        play('hit', 0.8, 1);
        g.enemyReturned = false;
    };
    UPDATE[State.HeroHit] = function () {
        if (!g.enemyReturned && g.stateTime >= 0.25) {
            g.enemyReturned = true;
            enemy.pose('eGuard', 0.35, Ease.inOut);
            enemy.x.go(CONFIG.enemyFightX, 0.35, Ease.inOut);
        }
        if (g.stateTime >= CONFIG.heroHurt) {
            if (g.heroHearts <= 0) { setState(State.Lose); return; }
            hero.pose('guard', 0.2, Ease.outQuad);
            hero.x.go(CONFIG.heroFightX, 0.2, Ease.outQuad);
            g.whiffed = false;
            g.inputLocked = false;
            setState(State.Wait);
        }
    };
    ACTION[State.HeroHit] = function () { };

    // Parry: PARRY!, hitstop, flash, enemy staggers.
    ENTER[State.Parry] = function () {
        g.inputLocked = true;
        enemy.smear = false;
        hero.pose('parry', 0);                 // snap: the contact point reads this frame
        enemy.pose('eRecoil', 0);
        enemy.x.go(CONFIG.enemyFightX + 6, 0.25, Ease.outQuad);
        hero.swordPoint(0.75, tmpA);
        flashAt(tmpA[0], tmpA[1]);
        spawnSparks(tmpA[0], tmpA[1], 14, 1, 170);
        g.hitstopLeft = CONFIG.hitstop;
        shake(CONFIG.shakeParry);
        showText('PARRY!', 0.7, true);
        play('parry', 1, 1);
        g.actionT = 0;
    };
    UPDATE[State.Parry] = function () {
        if (g.stateTime >= 0.12 && enemy.to === COMPILED.eRecoil) {
            enemy.pose('eStagger', 0.3, Ease.outBack);
            hero.pose('guard', 0.25, Ease.outQuad);
        }
        if (g.stateTime >= CONFIG.parryRecover) setState(State.Combo);
    };
    ACTION[State.Parry] = function () { };

    // Combo, storyboard frames 10-18: three taps, three attacks.
    // keys: pose chain; impact: game time of the hit; lock: input lock after
    // the tap; x: hero offset from heroComboX; react/push: enemy hit reaction;
    // events: [time, fn] fired in order during the attack.
    var COMBO = [
        // A1 (10-11): both hands take the sword to his back, open one-hand sweep
        { keys: [['a1Wind', 0.05, Ease.outQuad], ['a1', 0.08, Ease.inQuad]],
          impact: 0.13, lock: 0.3, x: 0, react: 'eHit', push: 5, events: [] },
        // A2 (12-14): two-hand thrust, the swing carries over his head to the left
        { keys: [['a2Grab', 0.06, Ease.inQuad], ['a2Mid', 0.08, Ease.outQuad], ['a2End', 0.1, Ease.outQuad]],
          impact: 0.06, lock: 0.3, x: 8, react: 'eHit2', push: 9, events: [] },
        // A3 (15-18): crouch, jump with a 360 spin that ends in a horizontal slash, landing
        { keys: [['a3Crouch', 0.07, Ease.outQuad], ['a3Spin', 0.2, Ease.outQuad], ['a3Air', 0.14, Ease.outQuad], ['a3SweepA', 0.04, Ease.linear], ['a3SweepB', 0.03, Ease.linear], ['a3Follow', 0.08, Ease.outQuad]],
          impact: 0.41, lock: 0, x: 8, react: null, push: 0,
          events: [[0.07, a3Jump], [0.37, a3Slow], [0.49, a3Fall], [0.69, a3Land]] }
    ];

    function a3Jump() {
        hero.lift.go(CONFIG.a3Lift, CONFIG.a3Rise, Ease.outQuad);
        hero.spin.go(Math.PI * 2, CONFIG.a3SpinTime, Ease.inQuad);   // fast last half-turn = the slash
        hero.x.go(hero.x.v + CONFIG.a3Travel, CONFIG.a3SpinTime, Ease.outQuad);
        play('jump', 1.2, 0.6);
    }
    function a3Slow() { if (!reducedMotion) g.slowLeft = CONFIG.slowDuration; }
    function a3Fall() { hero.lift.go(0, 0.2, Ease.inQuad); }
    function a3Land() {
        hero.spin.set(0);
        hero.pose('land', 0.05, Ease.outQuad);
        hero.squash.set(CONFIG.landSquash);
        hero.squash.go(1, CONFIG.landRecover, Ease.outBack);
        shake(CONFIG.landShake);
        play('step', 0.8, 1);
    }

    ENTER[State.Combo] = function () {
        g.comboStep = 0;
        g.eventIdx = 0;
        g.inputLocked = false;
        g.impactPending = false;
        g.actionT = 0;
    };
    UPDATE[State.Combo] = function () {
        var step = g.comboStep > 0 ? COMBO[g.comboStep - 1] : null;
        if (g.impactPending && g.actionT >= g.impactAt) {
            g.impactPending = false;
            comboImpact(step);
        }
        while (step && g.eventIdx < step.events.length && g.actionT >= step.events[g.eventIdx][0]) {
            step.events[g.eventIdx++][1]();
        }
        if (hero.smear && hero.poseDone()) hero.smear = false;
        // stagger sway while waiting for the next tap
        if (!g.inputLocked && enemy.poseDone() && g.enemyHearts > 0) {
            enemy.pose(enemy.to === COMPILED.eStagger ? 'eStagger2' : 'eStagger', 0.45, Ease.inOut);
        }
        if (g.inputLocked && step && g.enemyHearts > 0 && !g.impactPending && g.actionT >= step.lock) {
            g.inputLocked = false;
        }
        if (g.enemyHearts <= 0 && !g.impactPending && g.actionT >= g.impactAt + CONFIG.fallDuration + CONFIG.winDelay) {
            setState(State.Win);
        }
    };
    ACTION[State.Combo] = function () {
        if (g.comboStep >= COMBO.length) return;
        var c = COMBO[g.comboStep], k = c.keys;
        g.comboStep++;
        g.inputLocked = true;
        g.actionT = 0;
        g.eventIdx = 0;
        hero.smear = true;
        hero.x.go(CONFIG.heroComboX + c.x, 0.08, Ease.outQuad);   // follows the knockback
        hero.pose(k[0][0], k[0][1], k[0][2]);
        for (var i = 1; i < k.length; i++) hero.then(k[i][0], k[i][1], k[i][2]);
        g.impactAt = c.impact;
        g.impactPending = true;
        play('swing', 1.3 + g.comboStep * 0.1, 0.5);
    };

    function comboImpact(c) {
        g.enemyHearts = Math.max(0, g.enemyHearts - 1);
        renderHearts();
        enemy.toWorld(enemy.cur[J.n] - 2, enemy.cur[J.n + 1] + 6, tmpA);
        var last = g.enemyHearts === 0;
        spawnSparks(tmpA[0], tmpA[1], last ? 18 : 9, 1, last ? 200 : 150);
        flashAt(tmpA[0], tmpA[1]);
        shake(last ? CONFIG.shakeParry : CONFIG.shakeHit);
        if (last) {
            play('final', 1, 1);
            enemy.pose('eHit', 0.08, Ease.outQuad).then('eFallen', 0.35, Ease.outQuad);
            enemy.pivot = CONFIG.fallPivot;
            enemy.rot.go(Math.PI / 2 * 0.97, CONFIG.fallDuration, Ease.outBounce);
            enemy.x.go(enemy.x.v + CONFIG.fallSlide, CONFIG.fallDuration * 0.7, Ease.outQuad);
            enemy.lift.go(CONFIG.fallRest - CONFIG.fallPivot, CONFIG.fallDuration, Ease.outBounce);
            enemy.dropSword(enemy.x.v + CONFIG.fallSlide + CONFIG.dropAt);
        } else {
            play('hit', 1 + g.comboStep * 0.12, 1);
            enemy.pose(c.react, 0.06, Ease.outQuad).then('eStagger', 0.25, Ease.outQuad);
            enemy.x.go(enemy.x.v + c.push, 0.12, Ease.outQuad);
        }
    }

    // Win / Lose: result card, loop stops once the scene settles.
    ENTER[State.Win] = function () {
        g.inputLocked = false;
        g.timeScale = 1;
        g.slowLeft = 0;
        hero.pose('victory', 0.3, Ease.outBack);
        showResult('Parried in ' + g.reactionMs + ' ms', 'One parry, three hits. The Pizza to Hell parry.');
    };
    UPDATE[State.Win] = function () {
        if (g.stateTime > 0.6) stopLoop();
    };
    ACTION[State.Win] = function () { restart(); };

    ENTER[State.Lose] = function () {
        g.inputLocked = false;
        hero.pose('kneel', 0.35, Ease.outQuad);
        enemy.pose('eIdle', 0.5, Ease.inOut);
        enemy.x.go(CONFIG.enemyFightX, 0.3, Ease.outQuad);
        showResult('Cut down', 'Wait for the blink, then tap as the sword comes down.', true);
    };
    UPDATE[State.Lose] = function () {
        if (g.stateTime > 0.7) stopLoop();
    };
    ACTION[State.Lose] = function () { restart(); };

    // Restart: reset everything, skip the intro, straight to Wait.
    ENTER[State.Restart] = function () {
        resultEl.hidden = true;
        hideText();
        clearEffects();
        g.heroHearts = CONFIG.heroHearts;
        g.enemyHearts = CONFIG.enemyHearts;
        g.inputLocked = false;
        g.whiffed = false;
        g.reactionMs = 0;
        g.heartsShown = CONFIG.heroHearts;
        g.floorK = 1;
        renderHearts();
        hero.reset();
        hero.x.go(CONFIG.heroFightX, 0.25, Ease.outQuad);
        hero.pose('guard', 0.25, Ease.outQuad);
        enemy.place(CONFIG.enemyFightX, 'eLand');
        enemy.pose('eGuard', 0.25, Ease.outBack);
    };
    UPDATE[State.Restart] = function () {
        if (g.stateTime >= 0.25) setState(State.Wait);
    };
    ACTION[State.Restart] = function () { };

    function whiff() {
        if (g.whiffed) return;
        g.whiffed = true;
        g.inputLocked = true;          // until the hit animation ends
        hero.smear = true;
        hero.pose('windup', 0.04, Ease.outQuad).then('strike', CONFIG.heroWhiff - 0.04, Ease.inQuad);
        play('swing', 1.4, 0.4);
    }

    /* swing time at the moment of input, not at the last frame */
    function swingTimeNow() {
        var since = Math.min((performance.now() - g.lastFrame) / 1000, CONFIG.maxDt);
        return g.stateTime + since * g.timeScale;
    }

    function skipIntro() {
        hideText();
        fightBtn.hidden = true;
        fightBtn.classList.remove('is-out');
        g.raysT = -1;
        g.floorK = 1;
        g.heartsShown = CONFIG.heroHearts;
        renderHearts();
        enemy.place(CONFIG.enemyFightX, 'eGuard');
        hero.place(CONFIG.heroFightX, 'guard');
        showText('FIGHT!', CONFIG.fightText * 0.7, false);
        setState(State.Wait);
    }

    function startFight() {
        initAudio();
        play('step', 1, 0.6);
        root.classList.add('is-playing');
        hud.hidden = false;
        renderHearts();
        root.focus({ preventScroll: true });
        if (g.started) { setState(State.Restart); }
        else { g.started = true; setState(State.Intro); }
        startLoop();
    }

    function restart() {
        play('step', 1, 0.6);
        root.focus({ preventScroll: true });
        setState(State.Restart);
        startLoop();
    }
    // #endregion

    // #region Input
    /* One action: attack. Pointer anywhere on the box, or Space/Enter while
       it has focus. Buttons and links inside handle their own clicks. */
    function onAction() {
        if (g.inputLocked) return;
        ACTION[g.state]();
    }

    root.addEventListener('pointerdown', function (e) {
        if (!e.isPrimary || e.button > 0) return;
        if (e.target.closest('button, a')) return;
        if (g.state === State.Idle || g.state === State.Win || g.state === State.Lose) return;
        e.preventDefault();     // no focus ring flash or text selection on tap
        root.focus({ preventScroll: true });
        onAction();
    });

    root.addEventListener('keydown', function (e) {
        if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'Spacebar') return;
        if (e.target !== root) return;     // focused buttons and links act natively
        e.preventDefault();
        if (e.repeat) return;
        onAction();
    });

    fightBtn.addEventListener('click', function () { if (g.state === State.Idle) startFight(); });
    restartBtn.addEventListener('click', restart);
    muteBtn.addEventListener('click', function () {
        setMuted(!audio.muted);
        if (!audio.muted) initAudio();
    });
    // the Systems section opens on Pizza to Hell (script.js); pick the Parry tab too
    linkEl.addEventListener('click', function () { if (parryTab) parryTab.click(); });
    // #endregion

    // #region Loop
    function startLoop() {
        g.active = true;
        resume();
    }

    function stopLoop() {
        g.active = false;
        if (g.rafId) cancelAnimationFrame(g.rafId);
        g.rafId = 0;
        draw();
    }

    function resume() {
        if (!g.active || g.rafId || !g.inView || document.hidden) return;
        g.lastFrame = performance.now();
        g.rafId = requestAnimationFrame(frame);
    }

    function pause() {
        if (g.rafId) cancelAnimationFrame(g.rafId);
        g.rafId = 0;
    }

    function frame(now) {
        g.rafId = 0;
        var realDt = Math.min((now - g.lastFrame) / 1000, CONFIG.maxDt);
        if (realDt < 0) realDt = 0;
        g.lastFrame = now;
        if (DEBUG && realDt > 0) g.fps += (1 / realDt - g.fps) * 0.1;

        // timeScale: hitstop (0) beats slow motion beats normal
        if (g.hitstopLeft > 0) {
            g.hitstopLeft -= realDt;
            g.timeScale = 0;
        } else if (g.slowLeft > 0) {
            g.slowLeft -= realDt;
            g.timeScale = reducedMotion ? 1 : CONFIG.slowScale;
        } else {
            g.timeScale = 1;
        }

        tick(realDt * g.timeScale, realDt);
        draw();
        if (DEBUG) drawDebug();
        if (g.active && !g.rafId) g.rafId = requestAnimationFrame(frame);
    }

    function tick(dt, realDt) {
        g.stateTime += dt;
        g.actionT += dt;
        hero.update(dt);
        enemy.update(dt);
        updateEffects(dt, realDt);
        UPDATE[g.state]();
    }

    // pause when the tab is hidden or the box scrolls away
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) pause(); else resume();
    });

    if (window.IntersectionObserver) {
        new IntersectionObserver(function (entries) {
            g.inView = entries[0].isIntersecting;
            if (g.inView) resume(); else pause();
        }).observe(root);
    }
    // #endregion

    // #region Render
    function resize() {
        var r = stage.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (r.width < 1 || r.height < 1) return;
        view.w = r.width;
        view.h = r.height;
        view.dpr = dpr;
        canvas.width = Math.round(r.width * dpr);
        canvas.height = Math.round(r.height * dpr);
        view.s = Math.min(r.width / CONFIG.worldW, r.height / CONFIG.worldH);
        view.ox = (r.width - CONFIG.worldW * view.s) / 2;
        view.oy = (r.height - CONFIG.worldH * view.s) / 2;
        if (!g.rafId) draw();
    }

    function onResize() {
        view.w = 0;          // force a re-measure
        resize();
    }

    function draw() {
        if (!view.w) { resize(); if (!view.w) return; }   // not laid out yet
        var c = ctx, s = view.s, dpr = view.dpr;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.setTransform(dpr, 0, 0, dpr, 0, 0);

        var sx = 0, sy = 0;
        if (g.shakeLeft > 0) {
            var k = g.shakeLeft / CONFIG.shakeTime;
            sx = (Math.random() * 2 - 1) * g.shakeAmp * k * s;
            sy = (Math.random() * 2 - 1) * g.shakeAmp * k * s;
        }

        // ground runs the full stage width, drawn left to right in the intro
        if (g.floorK > 0) {
            var gy = view.oy + CONFIG.groundY * s + sy;
            c.strokeStyle = COLORS.ground;
            c.lineWidth = Math.max(1, 1.5 * s);
            c.beginPath();
            c.moveTo(0, gy);
            c.lineTo(view.w * g.floorK, gy);
            c.stroke();
        }

        // world space
        c.setTransform(dpr * s, 0, 0, dpr * s, dpr * (view.ox + sx), dpr * (view.oy + sy));
        c.lineCap = 'round';
        c.lineJoin = 'round';

        drawTrail(enemy);
        drawFighter(enemy);
        drawDropped(enemy);
        drawTrail(hero);
        drawBand(hero);
        drawFighter(hero);
        drawSparks();
        drawFlash();
        drawRays();
    }

    function seg(c, p, a, b) {
        c.moveTo(p[J[a]], p[J[a] + 1]);
        c.lineTo(p[J[b]], p[J[b] + 1]);
    }

    function drawFighter(f) {
        if (!f.visible) return;
        var c = ctx, p = f.cur;
        c.save();
        c.translate(f.x.v, CONFIG.groundY - f.lift.v);
        if (f.rot.v) {
            c.translate(0, -f.pivot);
            c.rotate(f.rot.v);
            c.translate(0, f.pivot);
        }
        // spin around the body axis reads as a horizontal squash and flip
        c.scale(f.facing * f.scale * (2 - f.squash.v) * Math.cos(f.spin.v), f.scale * f.squash.v);
        c.translate(0, -24);

        // sword behind the body when sheathed, in front otherwise
        if (p[SHEATH]) {
            var sh = f.sheath;
            drawSword(f, p[J[sh.joint]] + sh.dx, p[J[sh.joint] + 1] + sh.dy, sh.deg, sh.lenK);
        }

        c.strokeStyle = f.color;
        c.lineWidth = CONFIG.lineWidth;
        c.beginPath();
        seg(c, p, 'n', 'p');
        seg(c, p, 'p', 'kb'); seg(c, p, 'kb', 'fb');
        seg(c, p, 'p', 'kf'); seg(c, p, 'kf', 'ff');
        seg(c, p, 'n', 'eb'); seg(c, p, 'eb', 'hb');
        seg(c, p, 'n', 'ef'); seg(c, p, 'ef', 'hf');
        c.stroke();

        c.fillStyle = f.color;
        c.beginPath();
        c.arc(p[J.h], p[J.h + 1], CONFIG.headRadius, 0, Math.PI * 2);
        if (f.horns) addHorns(c, p[J.h], p[J.h + 1]);
        c.fill();

        if (!p[SHEATH] && !f.dropped) drawSword(f, p[J.hf], p[J.hf + 1], p[ANGLE], p[BLADE]);
        c.restore();
    }

    /* two curved horns, added to the head's path so one fill covers all.
       Scaled by hornScale around a root on the head's rim (hx +-3, hy - 4). */
    function addHorns(c, hx, hy) {
        var k = CONFIG.hornScale, ly = hy - 4;
        c.moveTo(hx - 3 - 1 * k, ly + 1 * k);
        c.quadraticCurveTo(hx - 3 - 6 * k, ly - 4 * k, hx - 3 - 4 * k, ly - 10 * k);
        c.lineTo(hx - 3 + 2 * k, ly - 1 * k);
        c.closePath();
        // same winding as the head, or nonzero fill cuts a notch where they overlap
        c.moveTo(hx + 3 - 2 * k, ly - 1 * k);
        c.lineTo(hx + 3 + 4 * k, ly - 10 * k);
        c.quadraticCurveTo(hx + 3 + 6 * k, ly - 4 * k, hx + 3 + 1 * k, ly + 1 * k);
        c.closePath();
    }

    /* FIGHT! press: lines burst out from the button and fade */
    function drawRays() {
        if (g.raysT < 0) return;
        var c = ctx, k = g.raysT / CONFIG.raysTime, e = Ease.outQuad(k);
        var cx = CONFIG.worldW / 2, cy = CONFIG.worldH / 2;
        var r0 = 24 + 40 * e, r1 = 34 + 70 * e;
        c.globalAlpha = 1 - k;
        c.strokeStyle = COLORS.hero;
        c.lineWidth = 2;
        c.beginPath();
        for (var i = 0; i < 12; i++) {
            var a = i * Math.PI / 6 + Math.PI / 12;
            var ca = Math.cos(a), sa = Math.sin(a) * 0.6;   // flattened: the button is wide
            c.moveTo(cx + ca * r0, cy + sa * r0);
            c.lineTo(cx + ca * r1, cy + sa * r1);
        }
        c.stroke();
        c.globalAlpha = 1;
    }

    function drawSword(f, hx, hy, deg, lenK) {
        var c = ctx, a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        var L = f.swordLen * lenK, gw = f.guardWidth;
        c.strokeStyle = COLORS.sword;
        c.lineWidth = f.swordWidth;
        c.beginPath();
        c.moveTo(hx - ca * 3, hy - sa * 3);           // pommel
        c.lineTo(hx + ca * L, hy + sa * L);           // blade
        c.stroke();
        c.lineWidth = f.swordWidth * 0.9;
        c.beginPath();                                // crossguard
        c.moveTo(hx + ca * 2 - sa * gw, hy + sa * 2 + ca * gw);
        c.lineTo(hx + ca * 2 + sa * gw, hy + sa * 2 - ca * gw);
        c.stroke();
    }

    /* headband tails, world space, behind the head */
    function drawBand(f) {
        if (!f.visible || !f.band) return;
        var c = ctx, b = f.band, n = CONFIG.bandSegs + 1;
        c.strokeStyle = f.color;
        c.lineWidth = CONFIG.bandWidth;
        c.beginPath();
        for (var t = 0; t < 2; t++) {
            var o = t * n * 2;
            c.moveTo(b[o], b[o + 1]);
            for (var i = 1; i < n; i++) c.lineTo(b[o + i * 2], b[o + i * 2 + 1]);
        }
        c.stroke();
    }

    /* a dropped sword in world space; the part below the floor is not drawn */
    function drawDropped(f) {
        if (!f.dropped || !f.visible) return;
        var c = ctx, C = CONFIG, u = f.dropT / C.dropTime;
        var x = f.dropX0 + (f.dropX1 - f.dropX0) * u;
        var y = f.dropY0 + (f.dropY1 - f.dropY0) * u - C.dropArc * 4 * u * (1 - u);
        var deg = f.dropA0 + (f.dropA1 - f.dropA0) * Ease.outQuad(u);
        var L = f.swordLen * f.scale, sa = Math.sin(deg * Math.PI / 180), lenK = 1;
        if (sa > 0 && y + sa * L > C.groundY) lenK = Math.max(0, (C.groundY - y) / (sa * L));
        c.save();
        c.translate(x, y);
        c.scale(f.scale, f.scale);
        drawSword(f, 0, 0, deg, lenK);
        c.restore();
    }

    function drawTrail(f) {
        var n = f.trailCount, tr = f.trail, c = ctx;
        if (n < 2) return;
        c.fillStyle = f.color;
        for (var i = 0; i < n - 1; i++) {
            var o = i * 4, q = o + 4;
            c.globalAlpha = 0.28 * (1 - i / (n - 1));
            c.beginPath();
            c.moveTo(tr[o], tr[o + 1]);
            c.lineTo(tr[o + 2], tr[o + 3]);
            c.lineTo(tr[q + 2], tr[q + 3]);
            c.lineTo(tr[q], tr[q + 1]);
            c.closePath();
            c.fill();
        }
        c.globalAlpha = 1;
    }

    function drawSparks() {
        var c = ctx;
        c.strokeStyle = COLORS.spark;
        c.lineWidth = 1.6;
        c.beginPath();
        for (var i = 0; i < SPARKS; i++) {
            var sp = sparks[i];
            if (sp.life <= 0) continue;
            var k = 0.035 * (sp.life / sp.max + 0.4);
            c.moveTo(sp.x, sp.y);
            c.lineTo(sp.x - sp.vx * k, sp.y - sp.vy * k);
        }
        c.stroke();
    }

    function drawFlash() {
        if (g.flashT < 0) return;
        var c = ctx, k = g.flashT / CONFIG.flashTime, r = 4 + 14 * k;
        c.globalAlpha = 1 - k;
        c.fillStyle = COLORS.flash;
        c.strokeStyle = COLORS.hero;
        c.lineWidth = 1.5;
        c.beginPath();
        // eight-point burst
        for (var i = 0; i < 16; i++) {
            var a = i * Math.PI / 8, rr = i % 2 ? r * 0.45 : r;
            var x = g.flashX + Math.cos(a) * rr, y = g.flashY + Math.sin(a) * rr;
            if (i) c.lineTo(x, y); else c.moveTo(x, y);
        }
        c.closePath();
        c.fill();
        c.stroke();
        c.globalAlpha = 1;
    }

    function drawDebug() {
        debugEl.textContent =
            g.state + '  t=' + g.stateTime.toFixed(2) +
            '\nscale=' + g.timeScale.toFixed(2) + '  locked=' + g.inputLocked +
            '\nhero=' + g.heroHearts + '  enemy=' + g.enemyHearts +
            (g.state === State.Wait ? '\nwait=' + g.waitDur.toFixed(2) : '') +
            (g.reactionMs ? '\nparry=' + g.reactionMs + 'ms' : '') +
            '\nfps=' + Math.round(g.fps);
    }

    if (window.ResizeObserver) new ResizeObserver(onResize).observe(stage);
    else window.addEventListener('resize', onResize, { passive: true });
    resize();
    if (DEBUG) drawDebug();
    // #endregion
})();
