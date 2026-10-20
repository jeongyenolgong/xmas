// 효과음: 파일 없이 Web Audio로 합성한다. 소리는 mockups/261020_sfx_audition.html(사용자가 들어 보고 확정)의 코드 그대로.
// 바뀐 곳은 둘뿐: 음량 슬라이더 대신 고정 음량 · 펜 사각거림의 길이를 글 쓰는 시간에 맞춤(penFor).
const SFX = (() => {
  let ctx, master, noiseBuf;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function tone(t, f, peak, attack, decay, fTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f, t);
    if (fTo) o.frequency.exponentialRampToValueAtTime(fTo, t + attack + decay);
    env(g, t, peak, attack, decay);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + attack + decay + 0.05);
  }
  function noise(t, peak, attack, decay, type, f, Q, fTo) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = Q || 1;
    if (fTo) fl.frequency.exponentialRampToValueAtTime(fTo, t + attack + decay);
    env(g, t, peak, attack, decay);
    s.connect(fl); fl.connect(g); g.connect(master);
    s.start(t, Math.random()); s.stop(t + attack + decay + 0.05);
  }
  function bell(t, f, peak, dur, partials) {
    partials = partials || [[1,1],[2,0.5],[2.76,0.35],[5.4,0.2],[8.93,0.1]];
    for (const [r, a] of partials) tone(t, f * r, peak * a, 0.004, dur / (1 + r * 0.4));
  }
  const S = {
    key()    { const t = ctx.currentTime; noise(t, 0.35, 0.002, 0.03, 'bandpass', 2200, 2); tone(t, 1200, 0.12, 0.002, 0.03, 800); },
    del()    { const t = ctx.currentTime; noise(t, 0.35, 0.002, 0.035, 'bandpass', 1100, 2); tone(t, 600, 0.12, 0.002, 0.035, 420); },
    ding()   { bell(ctx.currentTime, 880, 0.25, 1.6); },
    thud()   { const t = ctx.currentTime; tone(t, 140, 0.5, 0.003, 0.17, 60); noise(t, 0.2, 0.003, 0.06, 'lowpass', 400); },
    blow()   { const t = ctx.currentTime; noise(t, 0.35, 0.03, 0.4, 'lowpass', 2500, 0.7, 300); },
    paper()  { const t = ctx.currentTime; noise(t, 0.3, 0.015, 0.05, 'bandpass', 4000, 0.8); noise(t + 0.07, 0.25, 0.015, 0.09, 'bandpass', 3500, 0.8); },
    done()   { const t = ctx.currentTime; [784, 988, 1175].forEach((f, i) => bell(t + i * 0.2, f, 0.2, 1.8)); },
    page()   { const t = ctx.currentTime; noise(t, 0.3, 0.08, 0.35, 'bandpass', 1500, 0.9, 5000); },
    lowbell(){ bell(ctx.currentTime, 330, 0.3, 3); },
    btn()    { const t = ctx.currentTime; noise(t, 0.3, 0.002, 0.05, 'bandpass', 1500, 1.5); tone(t, 700, 0.15, 0.003, 0.05, 500); },
    penFor(sec) {
      const t0 = ctx.currentTime;
      let t = t0;
      while (t < t0 + sec) {
        const len = 0.03 + Math.random() * 0.04;
        noise(t, 0.12 + Math.random() * 0.18, 0.005, len, 'bandpass', 5500 + Math.random() * 2000, 1.2);
        t += 0.06 + Math.random() * 0.05;
        if (Math.random() < 0.12) t += 0.25; // 글자 사이 쉼
      }
    },
    clock() {
      const t = ctx.currentTime;
      const p = [[0.5,0.5],[1,1],[1.2,0.45],[1.5,0.3],[2,0.4],[2.5,0.2],[3,0.15],[4.2,0.08]];
      for (let i = 0; i < 3; i++) bell(t + i * 1.8, 196, 0.3, 4, p);
    },
    swell() {
      const t = ctx.currentTime;
      [73.4, 110].forEach(f => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.15, t + 0.8);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 2.4);
      });
      noise(t, 0.05, 0.8, 1.5, 'lowpass', 600);
    },
  };
  return { init, play(name, ...a) { try { init(); if (ctx && S[name]) S[name](...a); } catch (e) {} } };
})();
