/* ============================================================
   Sterling Merchant Finance — shared behaviour
   Everything is feature-detected: each page runs only what it has.
   ============================================================ */
(function(){
'use strict';
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- in-page anchors (works inside sandboxed frames) ---------- */
document.addEventListener('click', function(e){
  var a = e.target.closest('a[href^="#"]');
  if(!a) return;
  var id = a.getAttribute('href').slice(1);
  if(!id) return;
  var t = document.getElementById(id);
  if(!t) return;
  e.preventDefault();
  var nav = document.querySelector('.nav');
  var off = (nav ? nav.offsetHeight : 0) + 10;
  window.scrollTo({top: t.getBoundingClientRect().top + window.pageYOffset - off, behavior: reduce ? 'auto' : 'smooth'});
});

/* ---------- mobile nav ---------- */
(function(){
  var b = document.querySelector('.burger'), l = document.querySelector('.nav-links');
  if(!b || !l) return;
  b.addEventListener('click', function(){
    var open = l.classList.toggle('open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

/* ============================================================
   GENERATIVE CONTOUR GEOMETRY
   Background field uses four harmonics (detailed isolines).
   The hero cutout uses two low harmonics only — smooth, flowing,
   same family as the field but without the ripple.
   ============================================================ */
function contour(cx, cy, r, phase, amp, steps, xs){
  var d='', i, t, rr, x, y;
  for(i=0;i<=steps;i++){
    t = i/steps*Math.PI*2;
    rr = r*(1 + amp*0.34*Math.sin(3*t+phase) + amp*0.20*Math.sin(5*t-phase*1.7)
              + amp*0.12*Math.sin(8*t+phase*0.6) + amp*0.07*Math.sin(13*t-phase*2.3));
    x = cx + rr*Math.cos(t)*(xs||1.45);
    y = cy + rr*Math.sin(t);
    d += (i?'L':'M') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return d+'Z';
}

/* smooth sibling: only 2nd and 3rd harmonics, closed with a cubic spline */
function smooth(cx, cy, r, phase, amp, steps, xs){
  var pts=[], i, t, rr;
  for(i=0;i<steps;i++){
    t = i/steps*Math.PI*2;
    rr = r*(1 + amp*0.50*Math.sin(2*t+phase) + amp*0.26*Math.sin(3*t-phase*1.25));
    pts.push([cx + rr*Math.cos(t)*(xs||1), cy + rr*Math.sin(t)]);
  }
  /* Catmull-Rom → cubic Bezier for genuinely smooth curvature */
  var n=pts.length, d='M'+pts[0][0].toFixed(3)+' '+pts[0][1].toFixed(3), k;
  for(k=0;k<n;k++){
    var p0=pts[(k-1+n)%n], p1=pts[k], p2=pts[(k+1)%n], p3=pts[(k+2)%n];
    var c1x=p1[0]+(p2[0]-p0[0])/6, c1y=p1[1]+(p2[1]-p0[1])/6;
    var c2x=p2[0]-(p3[0]-p1[0])/6, c2y=p2[1]-(p3[1]-p1[1])/6;
    d += 'C'+c1x.toFixed(3)+' '+c1y.toFixed(3)+','+c2x.toFixed(3)+' '+c2y.toFixed(3)+','+p2[0].toFixed(3)+' '+p2[1].toFixed(3);
  }
  return d+'Z';
}

/* ---------- background field ---------- */
function buildField(host){
  var W=1400, H=900, layers=[
    {cls:'fl-1', n:9, r0:110, step:44, phase:0.4, amp:1.00, rate:0.14},
    {cls:'fl-2', n:7, r0:250, step:62, phase:2.1, amp:0.72, rate:0.24},
    {cls:'fl-3', n:6, r0:430, step:78, phase:4.3, amp:0.50, rate:0.36}
  ];
  layers.forEach(function(L){
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    svg.setAttribute('preserveAspectRatio','xMidYMid slice');
    svg.setAttribute('class',L.cls);
    var g=document.createElementNS('http://www.w3.org/2000/svg','g'), i;
    for(i=0;i<L.n;i++){
      var p=document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d', contour(W*0.66,H*0.5,L.r0+i*L.step,L.phase+i*0.42,L.amp,190));
      g.appendChild(p);
    }
    svg.appendChild(g); svg.dataset.rate=L.rate; host.appendChild(svg);
  });
}
document.querySelectorAll('.field').forEach(buildField);

if(!reduce){
  var svgs=[].slice.call(document.querySelectorAll('.field svg')), ticking=false;
  var move=function(){
    var vh=window.innerHeight;
    svgs.forEach(function(s){
      var rect=s.parentNode.getBoundingClientRect();
      if(rect.bottom<-200||rect.top>vh+200) return;
      var prog=(rect.top+rect.height/2-vh/2)/vh;
      s.style.transform='translate(-50%, calc(-50% + '+(-prog*130*parseFloat(s.dataset.rate)).toFixed(1)+'px))';
    });
    ticking=false;
  };
  window.addEventListener('scroll', function(){ if(!ticking){ticking=true;requestAnimationFrame(move);} }, {passive:true});
  window.addEventListener('resize', move);
  move();
}

/* ---------- hero edge: a rough harmonic boundary that tapers to a tail ----------
   FOUR harmonics rather than two, at roughly double the amplitude, so the edge
   has real texture instead of reading as a smooth curve — about 6.8% of the
   viewport of swing in the upper region, up from 2.2%.

   A DRIFT term on a squared ramp (holds, then accelerates) sweeps the boundary
   rightward below y0, reaching the right edge exactly at the bottom so the card
   resolves into a tail at the corner. The harmonic amplitude fades out over the
   last 14% of the height, which is what lets that tail close to a clean point
   instead of wobbling across the corner.

   Dials: amp = roughness, harmonics = character, y0 = where the sweep starts. */
var WAVE = {
  base: 0.3599, amp: 0.062, drift: 0.6401, y0: 0.45, phase: 0.86,
  harmonics: [[1.15,0.55,1.0],[2.10,0.28,-1.3],[3.40,0.14,0.7],[5.60,0.07,-1.9]]
};

function waveX(y, W){
  var drift = 0;
  if(y > W.y0){ var t = (y - W.y0)/(1 - W.y0); drift = t*t; }
  var fade = y < 0.86 ? 1 : Math.max(0, 1 - (y - 0.86)/0.14);
  var h = 0, i, k;
  for(i = 0; i < W.harmonics.length; i++){
    k = W.harmonics[i];
    h += k[1] * Math.sin(2*Math.PI*k[0]*y + W.phase*k[2]);
  }
  return W.base + W.drift*drift + W.amp*h*fade;
}
function waveClip(W, steps){
  var d='M1 0 L1 1', i, y;
  for(i=steps;i>=0;i--){ y=i/steps; d += ' L'+waveX(y,W).toFixed(4)+' '+y.toFixed(4); }
  return d+' Z';
}
function waveLine(W, off, steps){
  var d='', i, y;
  for(i=0;i<=steps;i++){
    y=i/steps;
    d += (i?' L':'M') + ((waveX(y,W)+off)*100).toFixed(3) + ' ' + (y*100).toFixed(3);
  }
  return d;
}
(function(){
  var p = document.getElementById('orgPath');
  if(p) p.setAttribute('d', waveClip(WAVE, 340));   /* more steps for the finer ripple */
  var host = document.getElementById('heroWaves');
  if(host){
    var out='', i;
    for(i=0;i<9;i++) out += '<path'+(i%2?' class="t"':'')+' d="'+waveLine(WAVE, -i*0.05, 340)+'"/>';
    host.innerHTML = out;
  }
})();

/* ---------- image / video slots ---------- */
document.querySelectorAll('.ph, .feat-shot, .photoband, .gallery .gimg').forEach(function(el){
  var img=el.querySelector('img'); if(!img) return;
  img.addEventListener('error', function(){ el.classList.add('empty'); });
  if(img.complete && img.naturalWidth===0) el.classList.add('empty');
});
(function(){
  var m=document.querySelector('.media');
  if(!m) return;
  var v=m.querySelector('video'), stopField=null;

  function fill(){
    if(m.classList.contains('filled')) return;
    m.classList.add('filled');
    if(stopField) stopField();          /* video is up: stop burning frames */
  }

  /* ---- live generative contour field ----
     Renders immediately and covers the box until the video is actually ready,
     so the hero is never blank. Also the permanent fallback if no file exists. */
  var cv=document.createElement('canvas');
  cv.className='media-canvas';
  cv.setAttribute('aria-hidden','true');
  m.insertBefore(cv, m.firstChild);
  m.classList.add('live');
  var ctx=cv.getContext('2d'), w=0, h=0, dpr=Math.min(window.devicePixelRatio||1, 2);

  function size(){
    var r=m.getBoundingClientRect();
    w=Math.max(1,r.width); h=Math.max(1,r.height);
    cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function draw(t){
    var i,k,a,rr,x,y;
    var g=ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#151C35'); g.addColorStop(1,'#080A0E');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    var cx=w*0.54+Math.sin(t*0.00007)*w*0.03, cy=h*0.5+Math.cos(t*0.00009)*h*0.03;
    var unit=Math.max(w,h);
    for(i=0;i<18;i++){
      var r=unit*0.05+i*unit*0.045, ph=1.15+i*0.30+t*0.00013;
      ctx.beginPath();
      for(k=0;k<=150;k++){
        a=k/150*Math.PI*2;
        rr=r*(1+0.34*0.58*Math.sin(2*a+ph)+0.34*0.30*Math.sin(3*a-ph*1.25));
        x=cx+rr*Math.cos(a)*1.14; y=cy+rr*Math.sin(a);
        k?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();
      var f=i/17;
      ctx.strokeStyle='rgba('+Math.round(70+70*f)+','+Math.round(115+95*f)+','+Math.round(255-55*f)+','+(0.46-0.26*f).toFixed(3)+')';
      ctx.lineWidth=1; ctx.stroke();
    }
  }
  var raf=null, running=false;
  function loop(ms){ draw(ms||0); raf=requestAnimationFrame(loop); }
  function start(){ if(running||reduce) return; running=true; raf=requestAnimationFrame(loop); }
  function halt(){ running=false; if(raf) cancelAnimationFrame(raf); raf=null; }
  stopField=halt;

  size(); draw(0);
  window.addEventListener('resize', function(){ size(); if(!running) draw(performance.now()); });

  if(!reduce){
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(en){
        en.forEach(function(e){
          if(m.classList.contains('filled')) return;
          e.isIntersecting ? start() : halt();
        });
      },{threshold:0}).observe(m);
    } else start();
  }

  /* ---- logo end card ----
     Cycle: footage runs once -> navy logo card animates -> footage restarts.
     The video keeps its `loop` attribute in the HTML so a JS failure degrades
     to a plain loop; we remove it here and drive the cycle ourselves. */
  (function(){
    var card = document.getElementById('endcard');
    if(!card || !v) return;
    var HOLD = reduce ? 1900 : 4100;      /* how long the card stays up */

    /* dash lengths must be measured, so the stroke can draw from its own end */
    ['.s-top','.s-bot'].forEach(function(sel){
      var p = card.querySelector(sel);
      if(!p || !p.getTotalLength) return;
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    var busy = false;
    var LEAD = 1.1;   /* start the card while the footage still has motion */                      /* start the card before the clip ends */
    function show(){
      if(busy) return; busy = true;
      card.classList.add('on');
      setTimeout(function(){
        try { v.currentTime = 0; var p = v.play(); if(p && p.catch) p.catch(function(){}); } catch(e){}
        card.classList.remove('on');        /* navy dissolves as the footage restarts */
        setTimeout(function(){ busy = false; }, 1400);
      }, HOLD);
    }
    v.removeAttribute('loop');
    v.loop = false;
    /* Fade the navy up over the last moments of the clip so the footage keeps
       rolling into the logo screen rather than stopping first. 'ended' stays as
       a backstop in case timeupdate is throttled. */
    v.addEventListener('timeupdate', function(){
      if(!busy && v.duration && v.currentTime >= v.duration - LEAD) show();
    });
    v.addEventListener('ended', show);
  })();

  /* ---- video: never rely on a single event ----
     A cached file can finish loading before this script runs, so check
     readyState directly as well as listening, and nudge play() for browsers
     that hold autoplay back. */
  if(!v) return;
  if(v.readyState >= 2) fill();
  ['loadeddata','canplay','canplaythrough','playing'].forEach(function(ev){
    v.addEventListener(ev, fill);
  });
  v.addEventListener('error', function(){
    m.classList.remove('filled'); start();
  });
  var pr = v.play && v.play();
  if(pr && pr.catch) pr.catch(function(){ /* autoplay blocked: field keeps running */ });
  setTimeout(function(){ if(v.readyState >= 2) fill(); }, 1200);
})();

/* ---------- interactive sensitivity model — DORMANT ----------
   Not used on any page right now. Self-disabling: it looks for #mC and exits
   if absent, so it costs nothing. Kept because it is real project-finance
   arithmetic (annuity debt service, DSCR, revenue breakeven at a 1.30x lender
   target). To use it, paste the .model markup back into a page. */
(function(){
  var ids = ['mC','mR','mO','mD','mI','mN'];
  var el = {}; ids.forEach(function(k){ el[k] = document.getElementById(k); });
  if(!el.mC) return;

  var oC=document.getElementById('oC'), oR=document.getElementById('oR'),
      oO=document.getElementById('oO'), oD=document.getElementById('oD'),
      oI=document.getElementById('oI'), oN=document.getElementById('oN'),
      oDs=document.getElementById('oDs'), oEy=document.getElementById('oEy'),
      oHr=document.getElementById('oHr'), oVd=document.getElementById('oVd'),
      oSens=document.getElementById('oSens');

  var TARGET = 1.30;   /* the DSCR a lender typically wants */

  /* level annual payment that amortises P over n years at rate r */
  function annuity(P, r, n){
    if(n <= 0) return 0;
    if(r === 0) return P/n;
    return P * r / (1 - Math.pow(1+r, -n));
  }
  function band(d){ return d >= TARGET ? 'ok' : (d >= 1.15 ? 'mid' : 'no'); }

  function calc(){
    var C=+el.mC.value, R=+el.mR.value, o=+el.mO.value/100,
        d=+el.mD.value/100, i=+el.mI.value/100, n=+el.mN.value;

    var debt = C*d, equity = C - debt;
    var ds = annuity(debt, i, n);
    var ebitda = R * (1 - o);
    var dscr = ds > 0 ? ebitda/ds : 99;
    var eqYield = equity > 0 ? (ebitda - ds)/equity : 0;
    var breakeven = (1 - o) > 0 ? TARGET * ds / (1 - o) : 0;
    var headroom = R > 0 ? (R - breakeven)/R : 0;

    oC.textContent = 'US$' + C + 'm';
    oR.textContent = 'US$' + R + 'm';
    oO.textContent = el.mO.value + '%';
    oD.textContent = el.mD.value + '%';
    oI.textContent = (+el.mI.value).toFixed(1) + '%';
    oN.textContent = el.mN.value + ' yrs';

    oDs.textContent = dscr.toFixed(2) + '\u00D7';
    oEy.textContent = (eqYield*100).toFixed(1) + '%';
    oHr.textContent = (headroom*100).toFixed(0) + '%';

    var b = band(dscr);
    oVd.className = 'verdict v-' + b;
    oVd.textContent = b === 'ok' ? 'Bankable' : (b === 'mid' ? 'Marginal — needs support' : 'Not financeable');

    /* what happens if revenue misses */
    var moves = [-20,-10,0,10];
    oSens.innerHTML = moves.map(function(m){
      var rr = R*(1+m/100);
      var dd = ds > 0 ? (rr*(1-o))/ds : 99;
      var bb = band(dd);
      var w = Math.max(2, Math.min(100, dd/2*100));
      var lbl = (m>0?'+':'') + m + '%';
      return '<li><span>'+lbl+'</span><span class="tr"><i class="'+(bb==='ok'?'':bb)+'" style="width:'+w.toFixed(1)+'%"></i></span>'
           + '<span class="v">'+dd.toFixed(2)+'</span></li>';
    }).join('');
  }

  ids.forEach(function(k){
    el[k].addEventListener('input', calc);
    el[k].addEventListener('change', calc);
  });
  calc();
})();

/* ---------- insight: filter articles by interest, hide emptied series ---------- */
(function(){
  var bar=document.getElementById('topicfilters');
  if(!bar) return;
  var empty=document.getElementById('topicempty');
  var btns=[].slice.call(bar.querySelectorAll('.fbtn'));
  var items=[].slice.call(document.querySelectorAll('.arts li[data-t]'));
  var grps=[].slice.call(document.querySelectorAll('.grp[data-g]'));
  bar.addEventListener('click', function(ev){
    var b=ev.target.closest('.fbtn'); if(!b) return;
    var t=b.dataset.t, shown=0;
    btns.forEach(function(x){ x.setAttribute('aria-pressed', x===b?'true':'false'); });
    items.forEach(function(li){
      var on = t==='all' || (' '+li.dataset.t+' ').indexOf(' '+t+' ') > -1;
      li.classList.toggle('hide', !on);
      if(on) shown++;
    });
    /* a series with nothing left in it should go too, not sit there as a stub */
    grps.forEach(function(g){
      var any=[].slice.call(g.querySelectorAll('.arts li[data-t]')).some(function(li){ return !li.classList.contains('hide'); });
      g.classList.toggle('hide', !any);
    });
    if(empty) empty.classList.toggle('on', shown===0);
  });
})();

/* ---------- capabilities accordion ---------- */
(function(){
  var root=document.getElementById('caps'); if(!root) return;
  var heads=[].slice.call(root.querySelectorAll('.acc-hd'));
  function set(btn, open){
    btn.setAttribute('aria-expanded', String(open));
    var body=document.getElementById(btn.getAttribute('aria-controls'));
    if(body){ if(open) body.removeAttribute('hidden'); else body.setAttribute('hidden',''); }
  }
  heads.forEach(function(b, i){
    b.addEventListener('click', function(){
      var open = b.getAttribute('aria-expanded')==='true';
      set(b, !open);                     /* independent panels — several can be open */
    });
    b.addEventListener('keydown', function(ev){
      var n=null;
      if(ev.key==='ArrowDown') n=Math.min(i+1, heads.length-1);
      if(ev.key==='ArrowUp')   n=Math.max(i-1, 0);
      if(n!==null){ ev.preventDefault(); heads[n].focus(); }
    });
  });
})();

/* ---------- register: three independent filter axes (platform / region / sector) ---------- */
(function(){
  var box=document.getElementById('reg'), bar=document.getElementById('regfilters');
  if(!box || !bar) return;
  var empty=document.getElementById('regempty');
  var cards=[].slice.call(box.children);
  var btns=[].slice.call(bar.querySelectorAll('.fbtn'));
  var sel={p:null, r:null, s:null};

  function apply(){
    var shown=0;
    cards.forEach(function(c){
      var on = (!sel.p || c.dataset.p===sel.p)
            && (!sel.r || c.dataset.r===sel.r)
            && (!sel.s || c.dataset.s===sel.s);
      c.classList.toggle('hide', !on);
      if(on) shown++;
    });
    var none = !sel.p && !sel.r && !sel.s;
    btns.forEach(function(b){
      var k=b.dataset.k;
      b.setAttribute('aria-pressed', k==='all' ? String(none) : String(sel[k]===b.dataset.f));
    });
    if(empty) empty.classList.toggle('on', shown===0);
  }

  bar.addEventListener('click', function(ev){
    var b=ev.target.closest('.fbtn'); if(!b) return;
    var k=b.dataset.k, f=b.dataset.f.replace(/&amp;/g,'&');
    if(k==='all'){ sel={p:null,r:null,s:null}; }
    else { sel[k] = (sel[k]===f) ? null : f; }   /* click again to clear that axis */
    apply();
  });
  apply();
})();

/* ---------- interactive sector chart ---------- */
(function(){
  var barsEl=document.getElementById('bars'), rlab=document.getElementById('rlab'), fl=document.getElementById('filters');
  if(!barsEl || !rlab || !fl) return;   /* charts were removed from Activity — bail cleanly */
  if(!barsEl) return;
  var SET={
    all:[['Power &amp; energy',88],['Telecoms',76],['AI &amp; frontier technology',71,1],['Transport',64],['Mining, oil &amp; gas',52],['Agriculture',45],['Water &amp; sanitation',38],['Healthcare',30]],
    principal:[['Applied AI',72,1],['AI infrastructure',54,1],['Vertical AI',48,1],['Fintech &amp; AI',41,1],['Data &amp; tooling',33,1],['Logistics AI',26,1]],
    merchant:[['Power &amp; energy',88],['Telecoms',76],['Transport',64],['Mining, oil &amp; gas',52],['Agriculture',45],['Water &amp; sanitation',38],['Healthcare',30],['Education',22]]
  };
  var LAB={all:'Both books',principal:'Principal Investment',merchant:'Infrastructure'};
  function draw(key){
    var rows=SET[key], max=0;
    rows.forEach(function(r){ if(r[1]>max) max=r[1]; });
    barsEl.innerHTML=rows.map(function(r){
      return '<li'+(r[2]?' class="alt"':'')+'><span class="bl">'+r[0]+'</span><span class="tr"><i></i></span><span class="vl">'+r[1]+'</span></li>';
    }).join('');
    if(rlab) rlab.innerHTML=LAB[key];
    requestAnimationFrame(function(){
      [].slice.call(barsEl.children).forEach(function(li,k){ li.querySelector('i').style.width=(rows[k][1]/max*100)+'%'; });
    });
  }
  if(fl) fl.addEventListener('click', function(e){
    var b=e.target.closest('.fbtn'); if(!b) return;
    this.querySelectorAll('.fbtn').forEach(function(x){ x.setAttribute('aria-pressed', x===b?'true':'false'); });
    draw(b.dataset.r);
  });
  if(reduce || !('IntersectionObserver' in window)) draw('all');
  else{
    var io=new IntersectionObserver(function(en){ en.forEach(function(e){ if(e.isIntersecting){ draw('all'); io.disconnect(); } }); },{threshold:.15});
    io.observe(barsEl);
  }
})();

/* ---------- mandates-over-time chart ---------- */
(function(){
  var svg=document.getElementById('spark'); if(!svg) return;
  var years=[1990,1995,2000,2005,2010,2015,2020,2026], vals=[3,9,18,31,47,64,79,96];
  var W=420,H=190,PL=32,PR=8,PT=14,PB=26,maxV=100;
  function X(i){ return PL+i*(W-PL-PR)/(years.length-1); }
  function Y(v){ return H-PB-(v/maxV)*(H-PT-PB); }
  var out='';
  [0,25,50,75,100].forEach(function(g){
    out+='<line class="grid" x1="'+PL+'" y1="'+Y(g)+'" x2="'+(W-PR)+'" y2="'+Y(g)+'"/>';
    out+='<text x="0" y="'+(Y(g)+3)+'">'+g+'</text>';
  });
  var line=vals.map(function(v,i){ return (i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1); }).join('');
  out+='<path class="area" d="'+line+'L'+X(years.length-1)+' '+Y(0)+'L'+X(0)+' '+Y(0)+'Z"/>';
  out+='<path class="ln" d="'+line+'"/>';
  vals.forEach(function(v,i){ out+='<circle class="pt" cx="'+X(i).toFixed(1)+'" cy="'+Y(v).toFixed(1)+'" r="3"/>'; });
  years.forEach(function(y,i){ out+='<text x="'+(X(i)-11)+'" y="'+(H-8)+'">'+String(y).slice(2)+'</text>'; });
  svg.innerHTML=out;
  if(reduce) return;
  var ln=svg.querySelector('.ln'), len=ln.getTotalLength(), fired=false;
  ln.style.strokeDasharray=len; ln.style.strokeDashoffset=len;
  svg.querySelectorAll('.pt').forEach(function(c){ c.style.opacity=0; });
  function run(){
    if(fired) return; fired=true;
    ln.style.transition='stroke-dashoffset 1.35s cubic-bezier(.3,.7,.3,1)';
    ln.style.strokeDashoffset=0;
    svg.querySelectorAll('.pt').forEach(function(c,i){
      c.style.transition='opacity .3s'; setTimeout(function(){ c.style.opacity=1; }, 200+i*130);
    });
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(en){ en.forEach(function(e){ if(e.isIntersecting){ run(); io.disconnect(); } }); },{threshold:.3});
    io.observe(svg);
  } else run();
})();

/* ---------- timeline ---------- */
(function(){
  var panel=document.getElementById('tlp'); if(!panel) return;
  var eras=[
    {h:'Incorporation', p:'Sterling Merchant Finance Ltd is established as an investment banking and financial advisory firm focused on markets where capital is scarce, tenors are short and risk is difficult to price.', t:['Financial advisory','Merchant banking','Emerging markets']},
    {h:'Privatization and state-enterprise reform', p:'Sterling advises African governments and agencies on the restructuring and privatization of state-owned enterprises, undertakes early project-finance mandates in telecommunications and transport, and launches the Sterling Africa Growth Fund.', t:['Privatization','Restructuring','Investment funds','Telecommunications','Transport']},
    {h:'Project finance at scale', p:'Sterling structures infrastructure financing across power generation, aviation, roads and bridges, mining, water and sanitation, working with development finance institutions and commercial lenders in multi-tranche structures.', t:['Power','Aviation','Transport','Mining','Water','Infrastructure']},
    {h:'Investing our own capital', p:'Sterling expands its principal-investment activities through direct positions and affiliated investment vehicles, including Condona Capital and the African Overseas Private Investment Corporation.', t:['Principal investment','Growth capital','Investment vehicles','Private markets']},
    {h:'A new investment frontier', p:'Sterling extends its principal-investment discipline to AI and frontier-technology companies through direct and SPV positions from pre-seed through Series B. The firm also invests through venture funds and funds of funds, develops a dedicated Africa AI venture fund, and undertakes select AI-related advisory mandates.', t:['AI','Frontier technology','SPVs','Venture funds','Funds of funds','Africa']}
  ];
  var btns=[].slice.call(document.querySelectorAll('.tl-btn'));
  function render(i){
    var e=eras[i];
    panel.innerHTML='<h3>'+e.h+'</h3><p>'+e.p+'</p><div class="tags">'+e.t.map(function(x){return '<span class="chip">'+x+'</span>';}).join('')+'</div>';
    if(!reduce){ panel.classList.remove('fade-in'); void panel.offsetWidth; panel.classList.add('fade-in'); }
    btns.forEach(function(b,j){ b.setAttribute('aria-selected', j===i?'true':'false'); });
  }
  btns.forEach(function(b){
    b.addEventListener('click', function(){ render(+b.dataset.i); });
    b.addEventListener('keydown', function(ev){
      var i=+b.dataset.i, n=null;
      if(ev.key==='ArrowRight') n=Math.min(i+1,eras.length-1);
      if(ev.key==='ArrowLeft')  n=Math.max(i-1,0);
      if(n!==null){ ev.preventDefault(); btns[n].focus(); render(n); }
    });
  });
  render(4);
})();

})();
