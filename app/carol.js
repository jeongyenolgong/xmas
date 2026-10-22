// 『크리스마스 캐럴: 스크루지와 세 유령』 — 게임 흐름
// 메인 → 프롤로그(카드·영상·안내문) → 제1~4장(카드 → 줄거리 → 문장 찾기 → 배열 → 상영 → 장부) → 에필로그(카드·영상)
// → 잇는 카드 → 엔딩 퀴즈 → The End(종료·저장). 기회 7개가 바닥나면 힌트 퀴즈.
// 화면 문자열·코드·자막 시각·퀴즈 = data/game_data.json(엑셀에서 tools/build_game_data.py로 만든다). 꼴·시간 = 확정 목업.
(() => {
  const LV = document.body.dataset.level === 'm' ? 'm' : 'e';
  const IMG = n => `../assets/img/${n}.jpg`;
  const VID = n => `../assets/video/${n}.mp4`;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const BTN = (txt, cls = '', id = '') => `<button class="btn ${cls}"${id ? ` id="${id}"` : ''}><i></i><i></i><i></i><i></i><span>${esc(txt)}</span></button>`;
  // 줄거리 창 힌트 구절(엑셀 씬요약문 「힌트 구절」)을 <mark>로 감싼다
  const markHints = (text, hints) => hints.reduce((h, k) => h.replace(esc(k), `<mark>${esc(k)}</mark>`), esc(text));
  const sentences = s => s.replace(/([.?!])\s+/g, '$1\n').split('\n');   // 뒤돌아보기 정규식은 옛 iOS 사파리에서 안 돌아서 이렇게
  const COLS = 3;
  let D, T;

  // ───────── 화면 뼈대 ─────────
  function buildDom() {
    const quill = `<img src="../assets/img/quill_icon.png" alt="">`;
    $('#stage').innerHTML = `
<div class="layer" id="main">
  <div class="poster"></div>
  <div class="fx">
    <div class="lamp" style="left:45.6%;top:57%;--d:4.2s;--o:-1s"></div>
    <div class="lamp" style="left:52.5%;top:59%;--d:6.1s;--o:-3s"></div>
    <div class="lamp" style="left:64.4%;top:60%;--d:5.3s;--o:-2s"></div>
    <div class="lamp" style="left:72%;top:60.5%;--d:7s;--o:-4.5s"></div>
    <div class="lamp" style="left:81.3%;top:55%;width:4%;height:6%;--d:3.4s;--o:-.7s;background:radial-gradient(circle, rgba(255,200,120,.6) 0%, rgba(255,160,70,.2) 45%, rgba(0,0,0,0) 70%)"></div>
    <div class="halo"></div><div class="flame"></div>
  </div>
  <div class="lettering">
    <div class="title"><div class="t-main">${esc(T['title.main'])}</div><div class="t-sub"><span>${esc(T['title.sub'])}</span></div></div>
    <div class="btn-wrap">${BTN(T['btn.start'], '', 'startBtn')}</div>
  </div>
</div>
<div class="layer card" id="coverCard"><div class="inner"><div class="bgimg"></div><div class="goldimg"></div><div class="w"><span></span></div></div></div>
<div class="layer card" id="chCard"><div class="cbg"></div><div class="w two"><span></span></div></div>
<div class="layer film" id="film"><div class="block"><div class="pic"><video id="video" playsinline webkit-playsinline preload="auto"></video></div><div class="band"><span id="sub"></span></div></div></div>
<div class="layer endmsg" id="proEnd"><div class="g">${esc(T['guide.prologue.end'])}</div>${BTN(T['btn.next'], '', 'nextBtn')}</div>
<div class="layer scene" id="scene">
  <div class="bg" id="sceneBg"></div>
  <div class="head">
    <button class="btn tool" id="synBtn"><span>${esc(T['btn.synopsis'])}</span></button>
    <div class="chap" id="chap"></div>
    <div class="quills" id="quills">${quill.repeat(7)}</div>
  </div>
  <div class="sbody">
    <div class="left" id="left">
      <div class="guide"><span id="guide"></span></div>
      <div class="gridarea" id="gridarea"><div class="codes" id="codes"></div></div>
      <div class="judge" id="judge"></div>
    </div>
    <div class="right" id="right"><div class="pad" id="pad"><div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div><div>7</div><div>8</div><div>9</div><div class="del act">DEL</div><div>0</div><div class="ok act"><i></i><i></i><i></i><i></i>ENT</div></div></div>
  </div>
  ${BTN(T['btn.arrange.confirm'], 'confirm', 'confirmBtn')}
  <div class="veil" id="synVeil"><div class="win"><h3>줄거리</h3><p class="syn" id="syn"></p><div class="foot">${BTN(T['btn.close'], 'gold', 'closeBtn')}</div></div></div>
  <div class="veil deep" id="hintVeil"><div class="win small"><p id="hintMsg"></p>${BTN(T['btn.quiz.go'], 'gold', 'goBtn')}</div></div>
</div>
<div class="layer film ledger" id="ledger"><div class="block"><div class="pic" id="lpic">
  <img class="page-img" src="${IMG('02')}" alt=""><div class="flame"></div><div class="halo"></div>
  <div class="page leftp" id="lleft"></div><div class="page rightp" id="lright"></div>
  <div class="pen" id="pen"><img src="../assets/img/pen.png" alt=""></div>
</div></div></div>
<div class="layer quiz" id="hintQuiz"><div class="qbg" id="hintBg"></div><div class="box" id="hbox">
  <p class="g" id="hg"></p><p class="q" id="hq"></p><div class="ox"><button data-a="O">O</button><button data-a="X">X</button></div>
  <div class="res"><p class="v" id="hv"></p><p class="e" id="he"></p><p class="note" id="hn"></p><p class="tap">${esc(T['guide.quiz.tap'])}</p></div>
</div></div>
<div class="layer bridge" id="bridge"><div class="epbg"></div><p id="bridgeP"></p></div>
<div class="layer quiz ending" id="endQuiz"><div class="qbg epi"></div><div class="n" id="en"></div><div class="box" id="ebox">
  <p class="g">${esc(T['guide.quiz.ending'])}</p><p class="q" id="eq"></p><div class="ox"><button data-a="O">O</button><button data-a="X">X</button></div>
  <div class="res"><p class="v" id="ev"></p><p class="e" id="ee"></p><p class="note" id="enote"></p></div>
</div></div>
<div class="layer card" id="endcard"><div class="inner"><div class="bgimg"></div><div class="goldimg"></div><div class="w"><span>${esc(T['card.ending'])}</span></div></div>
  <div class="btns"><button class="btn thin" id="endBtn"><span>${esc(T['btn.end'])}</span></button>
  <a class="btn" id="saveBtn" href="../assets/carol_picturebook.pdf" download="크리스마스캐럴_그림책.pdf"><i></i><i></i><i></i><i></i><span>${esc(T['btn.save'])}</span></a></div></div>
<div class="taphint" id="taphint">${esc(T['guide.tap'])}</div>
<div class="dark on" id="dark"></div>`;
  }

  // ───────── 공용 ─────────
  const on = id => $('#' + id).classList.add('on');
  const off = id => $('#' + id).classList.remove('on');
  // 어둠 아래에서 치우는 화면: 흐려지는 동안 어둠이 걷히면 앞 화면이 비치므로 전환 없이 바로 바꾼다
  function snap(el, fn) { el.classList.add('snap'); fn(); void el.offsetWidth; el.classList.remove('snap'); }
  const hide = id => { const el = $('#' + id); snap(el, () => el.classList.remove('on')); };
  const dark = (v, slow) => { const d = $('#dark'); d.classList.toggle('slow', !!slow); d.classList.toggle('on', v); };
  let tapFn = null;
  const tap = () => new Promise(r => { tapFn = r; });
  function onStageClick(e) {
    if (e.target.closest('button,a,.pad,.slot,.win')) return;
    if (tapFn) { const f = tapFn; tapFn = null; f(e); }
  }
  const click = el => new Promise(r => el.addEventListener('click', function h(e) { el.removeEventListener('click', h); r(e); }));
  async function press(btn) { SFX.play('btn'); btn.classList.add('pressed'); await wait(300); setTimeout(() => btn.classList.remove('pressed'), 900); }
  const taphint = v => $('#taphint').classList.toggle('on', v);

  // ───────── 메인 ─────────
  async function mainScreen() {
    on('main'); dark(false);
    const b = $('#startBtn');
    await click(b);
    SFX.init(); SFX.play('btn'); b.classList.add('pressed');
    preload(D.prologue.video);                     // 영상에 배경 음악이 있다 — 첫 탭 안에서 한 번 재생·멈춤해 소리 나는 재생을 열어 둔다(iOS)
    const v0 = video(); v0.play().then(() => v0.pause(), () => {}); v0.pause();
    await wait(450); dark(true, true); await wait(1700);
    hide('main');
  }

  // ───────── 카드 ─────────
  // 프롤로그·에필로그 = 초판 표지(붉은 천 어둡게·금박 원래 밝기) / 장 카드 = 그 장 바탕 그림 50%
  async function cover(word) {
    $('#coverCard .w span').textContent = word;
    on('coverCard'); dark(false); SFX.play('swell');
    await wait(1200 + 4000); off('coverCard'); await wait(1200 + 300);
  }
  async function chapterCard(C) {
    $('#chCard .cbg').style.backgroundImage = `url(${IMG(C.bg)})`;
    $('#chCard .w span').textContent = C.title;
    on('chCard'); dark(false); SFX.play('swell');
    await wait(5200); off('chCard'); await wait(1200);
  }

  // ───────── 영상: 그림 + 아래 띠, 자막은 JSON 시각대로 얹는다 ─────────
  const video = () => $('#video');
  function preload(name) { const v = video(); if (v.dataset.n !== name) { v.dataset.n = name; v.src = VID(name); v.load(); } }
  async function startVideo(v) {
    try { await v.play(); }
    catch (e) {   // 저전력 모드 등으로 자동 재생이 막히면 한 번 탭해서 시작
      taphint(true); await tap(); taphint(false); SFX.play('btn');
      try { await v.play(); } catch (e2) {}
    }
  }
  async function film(name, subs, { keepLast = false } = {}) {
    const v = video(), sub = $('#sub');
    preload(name); sub.textContent = ''; sub.classList.remove('on');
    on('film'); dark(false);
    v.currentTime = 0; v.classList.add('on');
    let cur = null, shown = '', rung = false, raf = 0;
    const tick = () => {
      const t = v.currentTime;
      if (name === 'ch4' && !rung && t >= 0.6) { rung = true; SFX.play('clock'); }   // 시계 종 = 제4장 첨탑 시계 12시
      let s = subs.find(x => t >= x.start && t < x.end) || null;
      if (!s && keepLast && t >= subs[subs.length - 1].start) s = subs[subs.length - 1];
      const txt = s ? (s.pieces ? s.pieces.filter(p => t >= p[0]).map(p => p[1]).join('') : s.text) : '';
      if (s !== cur) {
        cur = s; sub.classList.remove('on');
        setTimeout(() => { if (cur === s) { sub.textContent = txt; shown = txt; if (s) sub.classList.add('on'); } }, 250);
      } else if (s && txt !== shown && sub.classList.contains('on')) { sub.textContent = txt; shown = txt; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const ended = new Promise(r => v.addEventListener('ended', r, { once: true }));
    await startVideo(v);
    await ended;
    cancelAnimationFrame(raf);
  }
  function filmOff() { hide('film'); const v = video(); v.classList.remove('on'); v.pause(); $('#sub').classList.remove('on'); }

  // ───────── 프롤로그 ─────────
  async function prologue() {
    preload(D.prologue.video);
    await cover(T['card.prologue']);
    await film(D.prologue.video, D.prologue.subs);
    on('proEnd');
    const b = $('#nextBtn'); await click(b); await press(b);
    dark(true); await wait(1300); hide('proEnd'); filmOff();
  }

  // ───────── 기회(헤드의 깃털 7) ─────────
  const lost = Array(7).fill(false);
  const renderQuills = () => $$('#quills img').forEach((q, i) => q.classList.toggle('lost', lost[i]));
  const chances = () => lost.filter(x => !x).length;
  let inHint = false;
  function lose() {
    const i = lost.indexOf(false); if (i < 0) return;
    lost[i] = true; renderQuills(); SFX.play('blow');
    if (chances() === 0) hintQuiz();
  }

  // ───────── 힌트 퀴즈: 안내 창 → 그 장 바탕 위 전체 화면 → 해설 → 탭 → 하던 화면 ─────────
  const HQ = { queue: null, wrong: [] };
  function nextHintQ() {
    if (!HQ.queue || !HQ.queue.length) HQ.queue = HQ.wrong.length ? HQ.wrong.splice(0) : D.quiz[LV].hint.slice();
    return HQ.queue.shift();
  }
  async function askOX(box, ids, item) {
    const bs = $$('.ox button', box);
    box.classList.remove('judged'); bs.forEach(b => { b.disabled = false; b.classList.remove('pick'); });
    $(ids.q).textContent = item.q;
    const pick = await new Promise(r => bs.forEach(b => b.onclick = () => r(b)));
    bs.forEach(b => { b.disabled = true; b.onclick = null; }); pick.classList.add('pick');
    const ok = pick.dataset.a === item.a;
    SFX.play(ok ? 'ding' : 'thud');
    await wait(500);
    $(ids.v).textContent = ok ? T['quiz.correct'] : T['quiz.wrong']; $(ids.v).classList.toggle('wrong', !ok);
    $(ids.e).textContent = item.exp;
    $(ids.n).textContent = item.note || ''; $(ids.n).classList.toggle('hidden', !item.note);
    box.classList.add('judged');
    return ok;
  }
  async function hintQuiz() {
    inHint = true; S.buf = ''; renderBuf();
    await wait(1200);
    const [s1, s2, s3] = sentences(T['guide.quiz.hint']);
    $('#hintMsg').innerHTML = `${esc(s1)}<br>${esc(s2).replace(/(풀면) /, '$1<br>')}`;
    $('#hg').textContent = s3;
    $('#hintBg').style.backgroundImage = `url(${IMG(S.C.bg)})`;
    on('hintVeil'); SFX.play('lowbell');
    const go = $('#goBtn'); await click(go); await press(go);
    dark(true); await wait(1000);
    hide('hintVeil'); hide('scene'); on('hintQuiz'); dark(false);
    const item = nextHintQ();
    const ok = await askOX($('#hbox'), { q: '#hq', v: '#hv', e: '#he', n: '#hn' }, item);
    if (!ok) HQ.wrong.push(item);
    await tap(); SFX.play('btn');
    dark(true); await wait(1000);
    hide('hintQuiz'); on('scene'); dark(false);
    const back = ok ? 7 : 5;
    await wait(1000);
    for (let i = 0; i < back; i++) { lost[i] = false; renderQuills(); await wait(180); }
    inHint = false;
  }

  // ───────── 장 화면: 줄거리 창 · 문장 찾기 · 배열 ─────────
  const S = { C: null, ci: 0, got: [], buf: '', order: [], locked: [], phase: '', slots: [], drag: null, resolve: null };
  function say(msg) { const j = $('#judge'); j.textContent = msg; j.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(() => j.classList.remove('on'), 2200); }
  function setGuide(html) { $('#guide').innerHTML = html; }
  function renderBuf() {
    const k = S.got.length;
    S.slots.forEach((s, i) => s.classList.toggle('active', S.phase === 'find' && i === k));
    const a = S.slots[k]; if (a) $$('.d i', a).forEach((d, i) => d.textContent = S.buf[i] || '');
  }
  function shake(s) { s.classList.add('shake'); setTimeout(() => s.classList.remove('shake'), 450); }

  function setupScene(ci) {
    const C = D.chapters[ci];
    Object.assign(S, { C, ci, got: [], buf: '', order: [], locked: [], phase: 'syn', drag: null });
    const sc = $('#scene'); snap(sc, () => sc.classList.remove('after', 'wide', 'arrange'));
    $('#sceneBg').style.backgroundImage = `url(${IMG(C.bg)})`;
    $('#chap').textContent = C.title;
    $('#syn').innerHTML = markHints(C.synopsis, C.hints || []);
    setGuide(esc(C.guideFind).replace('찾아, ', '찾아,<br>'));
    const small = esc(T['guide.code.slot']);
    $('#codes').innerHTML = C.cuts.map(() => `<div class="slot"><div class="pic"><img alt=""><div class="in"><span class="d"><i></i><i></i><i></i></span><small>${small}</small></div><div class="num"></div></div><div class="cap"></div></div>`).join('');
    S.slots = $$('#codes .slot');
    S.slots.forEach(s => { s.style.transform = ''; s.addEventListener('pointerdown', onDown); });
    $('#confirmBtn').classList.remove('on', 'hold');
    renderQuills(); fit();
  }

  function fit() {
    if (!S.C) return;
    const wide = $('#scene').classList.contains('wide');
    const n = S.C.cuts.length, rows = Math.ceil(n / COLS);
    const fs = parseFloat(getComputedStyle($('.guide')).fontSize);
    const vw = innerWidth, left = $('#left'), cs = getComputedStyle(left);
    const padw = wide ? 0 : vw * 0.22;
    const leftW = vw - padw - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const avail = $('#gridarea').getBoundingClientRect().height;
    const capH = fs * .72 * 1.4 * 3 + fs * .55, gapX = vw * .02;
    const slotW = Math.max(40, Math.min((leftW * .96 - 2 * gapX) / 3, (avail / rows - capH) * 1.5));
    $('#codes').style.width = (3 * slotW + 2 * gapX) + 'px';
    const gridH = rows * (slotW / 1.5 + capH), lift = 0.04 * innerHeight;
    $('#codes').style.marginBottom = (!wide && avail - gridH > capH) ? Math.min(avail - gridH, capH * 0.5 + lift * 2) + 'px' : '0';
    alignPad(); layout();
  }
  function alignPad() { const ct = $('#codes').getBoundingClientRect().top, rt = $('#right').getBoundingClientRect().top; $('#pad').style.marginTop = Math.max(0, ct - rt) + 'px'; }

  // 줄거리 창: 장 화면이 뜨고 1.2초 뒤 저절로 → 닫기 → 지시문·칸·키패드. 헤드 「줄거리 보기」로 다시 연다
  async function synopsis(first) {
    on('synVeil'); SFX.play('page');
    const b = $('#closeBtn'); await click(b); b.classList.add('pressed'); SFX.play('page');
    await wait(250); b.classList.remove('pressed'); off('synVeil');
    if (first) { $('#scene').classList.add('after'); S.phase = 'find'; renderBuf(); }
  }

  // 판정(마의산 그대로): 이 장 코드 = 그림 칸 / 이미 넣은 코드·앞 장 코드 = 이미 확보 / 뒤 장 코드 = 아직 시작 안 함 / 그 밖 = 없는 코드
  function judgeCode(code) {
    const C = S.C, k = S.got.length, idx = C.cuts.findIndex(c => c.code === code);
    if (idx >= 0 && !S.got.includes(idx)) {
      const s = S.slots[k], cut = C.cuts[idx];
      s.dataset.i = idx; $('img', s).src = IMG(cut.img); $('.cap', s).textContent = cut.caption; $('.num', s).textContent = idx + 1;
      s.classList.add('filled'); s.classList.remove('active'); S.got.push(idx); SFX.play('ding');
      if (S.got.length === C.cuts.length) { S.phase = 'judge'; toArrange(); }
    } else {
      const owner = D.chapters.findIndex(ch => ch.cuts.some(c => c.code === code));
      let msg;
      if (idx >= 0 || (owner >= 0 && owner < S.ci)) msg = T['judge.already'];
      else if (owner > S.ci) msg = T['judge.future'];
      else { msg = T['judge.unassigned']; SFX.play('thud'); }
      say(msg); shake(S.slots[k]); lose();
    }
    S.buf = ''; renderBuf();
  }
  function onKey(e) {
    const k = e.target.closest('.pad div'); if (!k) return;
    if (S.phase !== 'find' || inHint) return;
    if (k.classList.contains('del')) { SFX.play('del'); S.buf = S.buf.slice(0, -1); renderBuf(); return; }
    if (k.classList.contains('ok')) { if (S.buf.length === 3) judgeCode(S.buf); else shake(S.slots[S.got.length]); return; }
    if (S.buf.length >= 3) return;
    SFX.play('key'); S.buf += k.textContent.trim(); renderBuf();
  }

  // 마지막 그림이 들어오면 → 키패드 영역이 사라지고(0.9초) 같은 격자가 전체 폭으로 → 배열 지시문 → 「확 인」
  async function toArrange() {
    await wait(1600);
    S.order = S.got.slice(); S.locked = S.order.map(() => false);
    const sc = $('#scene'); sc.classList.add('wide');
    fit();
    setGuide(esc(S.C.guideArrange).replace('그림이 다 모였습니다. ', '그림이 다 모였습니다.<br>'));
    await wait(1200);
    sc.classList.add('arrange'); $('#confirmBtn').classList.add('on'); S.phase = 'arrange';
  }

  // 드래그 = 끼워 넣기(집어 끌면 나머지 칸이 밀림), 맞은 칸은 고정
  function step() { const s = S.slots; return { x: s.length > 1 ? s[1].offsetLeft - s[0].offsetLeft : 0, y: s.length > COLS ? s[COLS].offsetTop - s[0].offsetTop : 0 }; }
  function layout(except) {
    if (!S.order.length) return;
    const w = step();
    S.slots.forEach(s => {
      if (s === except) return;
      const si = +s.dataset.i, dom = S.slots.indexOf(s), pos = S.order.indexOf(si);
      const dx = (pos % COLS - dom % COLS) * w.x, dy = (Math.floor(pos / COLS) - Math.floor(dom / COLS)) * w.y;
      s.style.setProperty('--dx', dx + 'px'); s.style.setProperty('--dy', dy + 'px');
      s.style.setProperty('--tf', (dx || dy) ? `translate(${dx}px,${dy}px)` : 'none');
      s.style.transform = (dx || dy) ? `translate(${dx}px,${dy}px)` : '';
    });
  }
  function onDown(e) {
    if (S.phase !== 'arrange' || inHint) return;
    const s = e.currentTarget, si = +s.dataset.i, pos = S.order.indexOf(si); if (S.locked[pos]) return;
    S.drag = { s, si, dom: S.slots.indexOf(s), w: step(), startX: e.clientX, startY: e.clientY, fromPos: pos, toPos: pos };
    s.classList.add('dragging'); s.setPointerCapture(e.pointerId); SFX.play('paper');
  }
  const freeIdx = () => S.order.map((_, i) => i).filter(i => !S.locked[i]);
  function onMove(e) {
    const d = S.drag; if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    const bx = (d.fromPos % COLS - d.dom % COLS) * d.w.x, by = (Math.floor(d.fromPos / COLS) - Math.floor(d.dom / COLS)) * d.w.y;
    d.s.style.transform = `translate(${bx + dx}px,${by + dy}px) scale(1.04)`;
    let c = d.fromPos % COLS + Math.round(dx / (d.w.x || 1)), r = Math.floor(d.fromPos / COLS) + (d.w.y ? Math.round(dy / d.w.y) : 0);
    c = Math.max(0, Math.min(COLS - 1, c)); r = Math.max(0, Math.min(Math.ceil(S.order.length / COLS) - 1, r));
    const want = Math.max(0, Math.min(S.order.length - 1, r * COLS + c));
    const fp = freeIdx(); const to = fp.reduce((a, b) => Math.abs(b - want) < Math.abs(a - want) ? b : a);
    if (to !== d.toPos) {
      const fs = fp.map(i => S.order[i]); fs.splice(fs.indexOf(d.si), 1); fs.splice(fp.indexOf(to), 0, d.si);
      fp.forEach((p, k) => S.order[p] = fs[k]); d.toPos = to; layout(d.s);
    }
    e.preventDefault();
  }
  function onUp() { const d = S.drag; if (!d) return; S.drag = null; d.s.classList.remove('dragging'); SFX.play('paper'); layout(); }
  const slotAt = pos => S.slots.find(s => +s.dataset.i === S.order[pos]);
  async function check() {
    if (S.phase !== 'arrange' || S.drag || inHint) return;
    S.phase = 'judge'; $('#confirmBtn').classList.add('hold');
    const right = S.order.map((si, pos) => si === pos);
    if (right.every(Boolean)) {
      SFX.play('done');
      S.order.forEach((si, pos) => setTimeout(() => slotAt(pos).classList.add('ok', 'locked'), 350 * pos + 200));
      await wait(350 * S.order.length + 1500);
      S.phase = 'done'; dark(true, true); await wait(1700);
      S.resolve(); return;
    }
    SFX.play('thud'); lose();
    S.order.forEach((si, pos) => { const s = slotAt(pos); if (right[pos]) { s.classList.add('ok', 'locked'); S.locked[pos] = true; } else shake(s); });
    await wait(2500);
    S.order.forEach((si, pos) => { if (!right[pos]) slotAt(pos).classList.add('free'); });
    $('#confirmBtn').classList.remove('hold'); S.phase = 'arrange';
  }

  // ───────── 장부: 암전 뒤 서서히 밝아짐 → 깃털 펜이 한 글자씩 → 장 표시 → 펜 사라짐 → 탭 ─────────
  const PEN_MS = 130;
  let curPen = null;
  function fitLedger() {
    const picH = $('#lpic').getBoundingClientRect().height, lh = picH * 0.0293;
    $$('#ledger .page').forEach(p => { p.style.lineHeight = lh + 'px'; p.style.fontSize = (lh * 0.88 * 1.6) + 'px'; });
    $$('#ledger .page .mark').forEach(m => m.style.fontSize = (lh * 0.62) + 'px');
    placePen();
  }
  function entry(ci, hidden) {
    const wrap = document.createElement('div'), t = document.createElement('span');
    sentences(D.chapters[ci].inner).forEach(sent => {
      const ln = document.createElement('span'); ln.className = 'ln';
      [...sent].forEach(c => { const s = document.createElement('span'); s.className = 'ch' + (hidden ? '' : ' on'); s.textContent = c; ln.appendChild(s); });
      t.appendChild(ln);
    });
    wrap.appendChild(t);
    const m = document.createElement('span'); m.className = 'mark' + (hidden ? '' : ' on'); m.textContent = D.chapters[ci].title.split(' ')[0];
    wrap.appendChild(m);
    return wrap;
  }
  function placePen(el) {
    if (el) curPen = el; if (!curPen) return;
    const r = curPen.getBoundingClientRect(), p = $('#lpic').getBoundingClientRect(), pen = $('#pen');
    const h = pen.getBoundingClientRect().height || p.height * .32;
    pen.style.transform = `translate(${r.left - p.left - h * 0.005 * 577 / 600}px, ${r.bottom - p.top - h * 0.998 - r.height * 0.12}px)`;
  }
  async function ledger(ci) {
    const L = $('#lleft'), R = $('#lright'), pen = $('#pen');
    L.innerHTML = ''; R.innerHTML = ''; curPen = null; pen.classList.remove('on');
    for (let k = 0; k < ci; k++) { L.appendChild(entry(k, false)); const g = document.createElement('span'); g.className = 'gap'; g.innerHTML = '&nbsp;'; L.appendChild(g); }
    R.appendChild(entry(ci, true)); fitLedger();
    dark(false);
    await wait(400); on('ledger'); await wait(3000 + 600);
    const chars = $$('.ch', R);
    pen.style.transition = 'none'; placePen(chars[0]); void pen.offsetWidth;
    pen.style.transition = `opacity .8s, transform ${PEN_MS}ms linear`; pen.classList.add('on');
    await wait(600);
    SFX.play('penFor', chars.length * PEN_MS / 1000);
    for (const c of chars) { placePen(c); await wait(PEN_MS); c.classList.add('on'); }
    await wait(500);
    $('.mark', R).classList.add('on');
    pen.style.transition = 'opacity 1.4s ease-in .3s, transform 1.7s ease-in-out';
    pen.style.transform += ' translate(26%,-34%) rotate(-8deg)'; pen.classList.remove('on'); curPen = null;
    await wait(1700 + 800); taphint(true);
    await tap(); taphint(false); SFX.play('btn');
    dark(true); await wait(1300); hide('ledger');
  }

  // ───────── 한 장 ─────────
  async function chapter(ci) {
    const C = D.chapters[ci];
    preload(C.video);
    await chapterCard(C);
    setupScene(ci);
    on('scene'); await wait(1200);
    const done = new Promise(r => S.resolve = r);
    await synopsis(true);
    await done;                                   // 배열까지 맞음 → 암전
    hide('scene'); S.phase = '';
    await film(C.video, C.subs);                  // 상영(끝 1.8초 암전은 영상 안에)
    dark(true); await wait(300); filmOff();
    await ledger(ci);
  }

  // ───────── 에필로그 → 잇는 카드 → 엔딩 퀴즈 → The End ─────────
  async function epilogue() {
    preload(D.epilogue.video);
    await cover(T['card.epilogue']);
    await film(D.epilogue.video, D.epilogue.subs, { keepLast: true });
    await wait(3000); taphint(true);
    await tap(); taphint(false); SFX.play('btn');
    // 잇는 카드: 정지 화면이 어두워지며 전체 화면 바탕 → 한 문장씩
    const P = $('#bridgeP');
    P.innerHTML = sentences(T['card.bridge']).map(s => `<span>${esc(s)}</span>`).join('');
    on('bridge'); await wait(2600); filmOff();
    for (const s of $$('span', P)) { s.classList.add('on'); await wait(2200); }
    await wait(800); taphint(true);
    await tap(); taphint(false); SFX.play('btn');
    dark(true); await wait(1300); hide('bridge');
    // 엔딩 퀴즈 5문항(기회 없음, 해설 → 탭 → 다음)
    const Q = D.quiz[LV].end;
    on('endQuiz'); dark(false);
    for (let i = 0; i < Q.length; i++) {
      $('#en').textContent = `${i + 1} / ${Q.length}`;
      await askOX($('#ebox'), { q: '#eq', v: '#ev', e: '#ee', n: '#enote' }, Q[i]);
      const th = setTimeout(() => taphint(true), 1500);
      await tap(); clearTimeout(th); taphint(false); SFX.play('btn');
    }
    dark(true); await wait(1500); hide('endQuiz');
    on('endcard'); dark(false);
    await wait(2500); $('#endcard').classList.add('btn-on');
    $('#saveBtn').addEventListener('click', () => { SFX.play('btn'); const b = $('#saveBtn'); b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 400); });
    const e = $('#endBtn'); await click(e); await press(e);
    dark(true); await wait(1300);
    location.reload();   // 처음 시작 화면 · 기회 7개·진행 처음부터
  }

  // ───────── 시작 ─────────
  async function run() {
    await mainScreen();
    await prologue();
    for (let i = 0; i < D.chapters.length; i++) await chapter(i);
    await epilogue();
  }
  async function boot() {
    D = await (await fetch('../data/game_data.json', { cache: 'no-cache' })).json();
    T = D.text;
    buildDom();
    $('#stage').addEventListener('click', onStageClick);
    $('#pad').addEventListener('click', onKey);
    $('#synBtn').addEventListener('click', () => { if (inHint || !['find', 'arrange'].includes(S.phase) || S.drag) return; synopsis(false); });
    $('#confirmBtn').addEventListener('click', check);
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp); document.addEventListener('pointercancel', onUp);
    document.addEventListener('contextmenu', e => e.preventDefault());
    new ResizeObserver(alignPad).observe($('#codes'));
    addEventListener('resize', () => { fit(); fitLedger(); });
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    run();
  }
  boot();
})();
