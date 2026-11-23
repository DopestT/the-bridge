/* NETIZENS World scene: original, deterministic vector geometry informed by the
 * owner's approved floating-city reference. No flattened screenshot, remote
 * assets, activity simulation or renderer dependency. DOM buttons own routes. */
(function(global){
  'use strict';
  const W=1600,H=940;
  const districts=[
    {id:'commons',x:800,y:455,rx:168,ry:62,color:'#83dfff',name:'Commons'},
    {id:'crews',x:262,y:345,rx:143,ry:53,color:'#ffc27c',name:'Crews'},
    {id:'local',x:550,y:260,rx:128,ry:47,color:'#79dcde',name:'Local'},
    {id:'projects',x:1100,y:270,rx:151,ry:55,color:'#b4e8ad',name:'Projects'},
    {id:'ask',x:1370,y:385,rx:125,ry:48,color:'#aadfff',name:'Ask'},
    {id:'circles',x:250,y:650,rx:147,ry:54,color:'#d3a2ff',name:'Circles'},
    {id:'events',x:555,y:740,rx:135,ry:49,color:'#ffac9e',name:'Events'},
    {id:'yesno',x:830,y:795,rx:106,ry:41,color:'#98e5bd',name:'Yes or No'},
    {id:'plans',x:1100,y:740,rx:122,ry:44,color:'#f8d793',name:'Plans'},
    {id:'exchange',x:1370,y:655,rx:143,ry:52,color:'#e4b5ea',name:'Exchange'}
  ];
  let seed=29;
  function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const n=x=>Number(x.toFixed(2));
  const path=(d,fill,stroke='',width=1,extra='')=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}"`:''} ${extra}/>`;
  const ellipse=(x,y,rx,ry,fill,stroke='',width=1)=>`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}"`:''}/>`;
  const rect=(x,y,w,h,fill,extra='')=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" ${extra}/>`;
  function tree(x,y,size=1,purple=false){return `<g transform="translate(${n(x)} ${n(y)}) scale(${size})">${ellipse(0,2,12,4,'#06131e88')}${path('M0 0 V-27','none','#b99b7d',3)}${ellipse(-5,-26,12,13,purple?'#986eab':'#39726c')}${ellipse(7,-29,13,16,purple?'#c495d8':'#5e9283')}${ellipse(0,-39,10,10,purple?'#d7b3e8':'#88b39b')}</g>`;}
  function building(x,y,w,h,color='#4c7482',light='#b7e8eb',roof=false){
    const depth=w*.38;
    let s=`<g class="city-building">${path(`M${x} ${y} v${-h} l${w} ${-depth} v${h} Z`,color,'#9fc7c333',.7)}${path(`M${x+w} ${y-depth} l${depth} ${depth*.54} v${-h} l${-depth} ${-depth*.54} Z`,'#1d344c','#8faabd33',.7)}${path(`M${x} ${y-h} l${w} ${-depth} l${depth} ${depth*.54} l${-w} ${depth} Z`,'#92b5b8')}`;
    for(let row=9;row<h-5;row+=11)for(let col=5;col<w-3;col+=9){if(rnd()>.22)s+=rect(x+col,y-h+row-col*.38,3.3,4.4,light,`opacity="${n(.35+rnd()*.6)}"`);}
    if(roof)s+=path(`M${x-4} ${y-h} l${w*.62} ${-w*.7} l${w*.7} ${w*.3} l${depth+4} ${depth*.54} l${-w} ${depth} Z`,'#724c57','#d6a47a',1);
    s+=path(`M${x} ${y} v${-h} l${w} ${-depth} v${h} Z`,'url(#facade)');
    s+=path(`M${x+w} ${y-depth} v${-h}`,'none','#c2e9e999',.8);
    s+='</g>';return s;
  }
  function island(d){
    const {x,y,rx,ry,color}=d;
    let s=`<g class="city-district" data-district="${d.id}">`;
    s+=ellipse(x,y+112,rx*1.15,ry*.65,'#11284277');
    // Faceted underside, different from the occupied civic platform above.
    s+=path(`M${x-rx} ${y} Q${x} ${y+ry*1.7} ${x+rx} ${y} L${x+rx*.65} ${y+ry+42} L${x+rx*.24} ${y+ry+95} L${x-rx*.04} ${y+ry+60} L${x-rx*.45} ${y+ry+82} L${x-rx*.8} ${y+ry+30} Z`,'url(#rock)','#526a8044',1);
    for(let i=0;i<12;i++){let a=(i/11-.5)*Math.PI;let px=x+Math.sin(a)*rx*.95;let py=y+Math.cos(a)*ry;s+=path(`M${n(px)} ${n(py)} l${n((rnd()-.5)*28)} ${n(24+rnd()*65)}`,'none',i%2?'#6f8e9555':'#0b192c99',1+rnd()*7);}
    for(let i=0;i<9;i++){
      const bx=x-rx*.9+i*rx*.22,by=y+Math.sin(i/8*Math.PI)*ry;
      s+=path(`M${n(bx)} ${n(by)} l${n(rx*.2)} 0 l${n(-rx*.1)} ${n(32+rnd()*47)} Z`,i%2?'#466376':'#354f64');
    }
    s+=ellipse(x,y+5,rx,ry,'#192c3d','#749ca0',1.5);
    s+=ellipse(x,y,rx,ry,'url(#ground)',color,1.7);
    s+=ellipse(x,y-2,rx*.89,ry*.78,'none','#d6e0b877',1);
    s+=path(`M${x-rx*.65} ${y+10} Q${x-20} ${y-24} ${x+rx*.65} ${y+5}`,'none','#c4cbb477',4);
    s+=ellipse(x,y+2,rx*.99,ry*.95,'none',color,1.5);
    s+=`<g opacity=".34" filter="url(#glow)">${ellipse(x,y+3,rx,ry,'none',color,2)}</g>`;
    s+=path(`M${x-rx*.84} ${y-4} Q${x} ${y+ry} ${x+rx*.84} ${y-4}`,'none',color,2,'opacity=".6"');
    // Architectural elements, not generic icon cards.
    if(d.id==='commons'){
      for(let i=0;i<8;i++){const bx=x-122+i*33;const by=y-17-Math.sin(i*.7)*18;s+=building(bx,by,16,48+rnd()*105,'#426887','#a9e8ff');}
      s+=ellipse(x,y-5,85,29,'#213b54','#92ddf9',2);
      s+=ellipse(x,y-12,65,22,'#182b43','#d0efff',2);
      s+=ellipse(x,y-15,48,15,'#64c9ee33','#88dfff',2);
      s+=path(`M${x-47} ${y-28} Q${x-100} ${y-161} ${x} ${y-183} Q${x+100} ${y-161} ${x+47} ${y-28}`,'none','#1f3d5e',14);
      s+=path(`M${x-47} ${y-28} Q${x-100} ${y-161} ${x} ${y-183} Q${x+100} ${y-161} ${x+47} ${y-28}`,'none','#8cd9ff',3,'filter="url(#glow)"');
      s+=ellipse(x,y-99,43,47,'url(#globe)','#bcf4ff',1.5);
      s+=ellipse(x,y-99,14,47,'none','#b7ecff88',1);
      s+=ellipse(x,y-99,43,14,'none','#b7ecff88',1);
      s+=`<g filter="url(#glow)" opacity=".65">${ellipse(x,y-99,46,49,'none','#b2e8ff',1.5)}${ellipse(x,y-12,70,24,'none','#9be5ff',2)}</g>`;
      s+=path(`M${x-33} ${y-100} C${x-70} ${y-155} ${x+67} ${y-145} ${x+38} ${y-80}`,'none','#d9f5ff',1.5);
      s+=path(`M${x-28} ${y-126} l22 -8 15 19 -12 16 18 8 -8 30 -14 -9 -8 -25 -18 -5 Z`,'#72c5d0aa');
      for(let i=0;i<7;i++)s+=tree(x-125+i*40,y+8+Math.sin(i)*14,.55);
    } else if(d.id==='crews'){
      for(let i=0;i<7;i++)s+=building(x-97+i*28,y-4-Math.sin(i)*17,20,25+rnd()*37,'#796653','#ffdda4',true);
      s+=building(x-12,y-30,23,116,'#796653','#ffdca8',true);
      for(let i=0;i<10;i++)s+=tree(x-118+i*25,y+10+Math.sin(i)*17,.65,i%3===0);
      s+=ellipse(x+24,y+10,38,10,'#c5a77d77','#d0b48b',1);
    } else if(d.id==='local'){
      for(let i=0;i<5;i++)s+=building(x-84+i*37,y-17,25,40+rnd()*40,'#527e82','#d4f5dc',true);
      s+=path(`M${x-70} ${y+14} Q${x} ${y-22} ${x+80} ${y+12}`,'none','#8ed7dd',11);
      for(let i=0;i<8;i++)s+=tree(x-100+i*28,y+11+Math.sin(i)*16,.65);
      s+=path(`M${x+10} ${y-66} q-29 -28 0 -39 q29 11 0 39 Z`,'#b3f3ec','#d0fff2',2);
      s+=ellipse(x+10,y-93,6,6,'#357989');
    } else if(d.id==='projects'){
      for(let i=0;i<8;i++)s+=building(x-118+i*30,y-7-Math.sin(i)*11,22,65+rnd()*110,'#49687a','#e5e4bb');
      s+=path(`M${x+82} ${y-9} v-180 m-54 8 h107 m-65 -13 l-42 13 m90 0 v52`,'none','#e2c08e',3);
      s+=path(`M${x-95} ${y+9} l70 -16 57 17 -63 20 Z`,'#8faf8f','#c4dab4',1);
      for(let i=0;i<6;i++)s+=tree(x-97+i*36,y+21,.5);
    } else if(d.id==='ask'){
      s+=building(x-68,y,45,66,'#3b6684','#c2ecff');s+=building(x+32,y-8,36,76,'#3b6684','#c2ecff');
      s+=path(`M${x-35} ${y-2} V${y-130} H${x+35} V${y-2} Z`,'#26415d','#7acdfb',3);
      s+=path(`M${x-27} ${y-12} V${y-121} H${x+27} V${y-12} Z`,'url(#glass)','#a2eaff',1);
      s+=`<text x="${x}" y="${y-49}" fill="#e4fbff" font-family="Georgia,serif" font-size="68" text-anchor="middle">?</text>`;
      for(let i=0;i<6;i++)s+=tree(x-97+i*36,y+8,.52);
    } else if(d.id==='circles'){
      s+=ellipse(x,y-8,77,28,'#9e849a','#e7bfba',2);
      s+=ellipse(x,y-20,72,25,'#3e3359','#c5a1df',2);
      for(let i=-3;i<=3;i++)s+=path(`M${x+i*20} ${y-18} v-39`,'none','#e4ba99',3);
      s+=path(`M${x-84} ${y-54} Q${x} ${y-127} ${x+84} ${y-54} Q${x} ${y-29} ${x-84} ${y-54}`,'#554368','#d6b7c8',2);
      for(let i=0;i<9;i++)s+=tree(x-128+i*32,y+9+Math.sin(i)*16,.72,true);
      s+=ellipse(x,y+9,37,12,'#dfbeac33','#eac3bd',1);
    } else if(d.id==='events'){
      s+=path(`M${x-95} ${y+4} l95 -28 95 28 -95 33 Z`,'#775454','#d7ae9c',1);
      s+=path(`M${x-77} ${y-8} l77 -103 77 103 -77 -18 Z`,'#d4aca1','#f3c8ad',2);
      s+=path(`M${x} ${y-111} v117 m-77 -14 v25 m154 -25 v25`,'none','#ffe0b8',3);
      s+=path(`M${x-64} ${y-4} q64 42 128 0`,'none','#ffb88e',4,'filter="url(#glow)"');
      for(let i=0;i<7;i++)s+=ellipse(x-65+i*22,y+27,4,3,'#ffc4a2');
      for(let i=0;i<4;i++)s+=tree(x-110+i*72,y+5,.6);
    } else if(d.id==='exchange'){
      for(let i=0;i<6;i++){
        const bx=x-105+(i%3)*70,by=y-29+Math.floor(i/3)*40;
        s+=building(bx,by,42,30,'#6c6278','#ffd5bd');
        s+=path(`M${bx-7} ${by-26} l28 -17 38 6 -14 17 Z`,i%2?'#967b91':'#bb998b','#e9c9c1',1);
        s+=path(`M${bx-7} ${by-26} v13 m52 -7 v13`,'none','#d8b5a2',2);
      }
      for(let i=0;i<5;i++)s+=tree(x-116+i*58,y+18,.55,true);
    } else if(d.id==='plans'){
      s+=ellipse(x,y-5,68,24,'#536a69','#efd6ab',1);
      s+=path(`M${x-48} ${y-12} v-47 l48 -18 48 18 v47`,'none','#dac49e',6);
      s+=path(`M${x-58} ${y-60} l58 -25 58 25 -58 19 Z`,'#8f9a7c','#e4d3a1',2);
      s+=ellipse(x,y+4,34,10,'#d5c49b','#f5e3b3',1);
      for(let i=0;i<7;i++)s+=tree(x-99+i*33,y+12+Math.sin(i)*12,.6);
    } else if(d.id==='yesno'){
      s+=ellipse(x,y-5,66,24,'#213d48','#c2e5ca',2);
      for(let i=0;i<2;i++){
        const bx=x-37+i*74,clr=i?'#f69ca6':'#91e1b3';
        s+=ellipse(bx,y-45,28,30,'#193c48',clr,3);
        s+=i?path(`M${bx-10} ${y-55} l20 20 m0 -20 l-20 20`,'none',clr,4):path(`M${bx-13} ${y-45} l10 10 17 -22`,'none',clr,4);
        s+=path(`M${bx} ${y-15} v16`,'none',clr,3);
      }
    }
    // Lamps and retaining walls light the platforms, never simulated Citizens.
    for(let i=0;i<7;i++){
      const lx=x-rx*.8+i*rx*.267,ly=y+ry*.64+Math.sin(i*.6)*5;
      s+=path(`M${n(lx)} ${n(ly)} v-12`,'none','#abc3c5',1.3)+ellipse(lx,ly-13,2.6,2.6,'#ffe5bb');
    }
    return s+'</g>';
  }
  function bridge(a,b){
    const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy),ux=dx/dist,uy=dy/dist;
    const ax=a.x+ux*a.rx*.75,ay=a.y+uy*a.ry*.65,bx=b.x-ux*b.rx*.75,by=b.y-uy*b.ry*.65;
    const midx=(ax+bx)/2,midy=(ay+by)/2-26;
    let s=path(`M${n(ax)} ${n(ay+10)} Q${n(midx)} ${n(midy+36)} ${n(bx)} ${n(by+10)}`,'none','#1a3047',13);
    s+=path(`M${n(ax)} ${n(ay)} Q${n(midx)} ${n(midy)} ${n(bx)} ${n(by)}`,'none','#c4bdab',8);
    s+=path(`M${n(ax)} ${n(ay-4)} Q${n(midx)} ${n(midy-4)} ${n(bx)} ${n(by-4)}`,'none','#8bd6e5',1.7);
    for(let i=1;i<9;i++){const t=i/9,lx=(1-t)*(1-t)*ax+2*(1-t)*t*midx+t*t*bx,ly=(1-t)*(1-t)*ay+2*(1-t)*t*midy+t*t*by;s+=path(`M${n(lx)} ${n(ly)} v-10`,'none','#b1d5d2',1)+ellipse(lx,ly-11,1.7,1.7,'#fbe3bc');}
    return `<g class="city-bridge">${s}</g>`;
  }
  function render(){
    seed=29;
    const defs=`<defs>
      <linearGradient id="sky" x2="1" y2="1"><stop stop-color="#0b1b34"/><stop offset=".5" stop-color="#293958"/><stop offset="1" stop-color="#ac7679"/></linearGradient>
      <linearGradient id="rock" x2=".3" y2="1"><stop stop-color="#71919d"/><stop offset=".45" stop-color="#24394e"/><stop offset="1" stop-color="#101d32"/></linearGradient>
      <linearGradient id="ground" x2="0" y2="1"><stop stop-color="#a6bca0"/><stop offset=".6" stop-color="#557f7d"/><stop offset="1" stop-color="#263f53"/></linearGradient>
      <linearGradient id="glass" x2="1" y2="1"><stop stop-color="#a1e6f566"/><stop offset="1" stop-color="#284872"/></linearGradient>
      <radialGradient id="globe"><stop stop-color="#73d6e7"/><stop offset=".7" stop-color="#2c719a"/><stop offset="1" stop-color="#142b4b"/></radialGradient>
      <radialGradient id="haze"><stop stop-color="#b9dfe8" stop-opacity=".3"/><stop offset="1" stop-color="#a3cfe3" stop-opacity="0"/></radialGradient>
      <radialGradient id="sun"><stop stop-color="#ffdfab" stop-opacity=".8"/><stop offset=".22" stop-color="#e8b59c" stop-opacity=".4"/><stop offset="1" stop-color="#e8b59c" stop-opacity="0"/></radialGradient>
      <linearGradient id="lower" x2="0" y2="1"><stop stop-color="#172a42" stop-opacity="0"/><stop offset="1" stop-color="#0a1729" stop-opacity=".45"/></linearGradient>
      <linearGradient id="facade" x2="1" y2=".5"><stop stop-color="#afdae0" stop-opacity=".5"/><stop offset=".35" stop-color="#2a496a" stop-opacity=".1"/><stop offset=".7" stop-color="#b6dce2" stop-opacity=".4"/><stop offset="1" stop-color="#16314b" stop-opacity=".1"/></linearGradient>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch"/></filter>
      <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;
    let s=`<svg class="city-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${defs}`;
    s+=rect(0,0,W,H,'url(#sky)')+ellipse(1350,130,480,310,'url(#sun)');
    s+=path('M0 216 L80 152 145 185 240 82 310 174 390 133 485 220 598 124 710 202 820 111 941 206 1050 152 1185 211 1300 105 1410 183 1500 125 1600 200 V400 H0 Z','#56667a55');
    for(let i=0;i<90;i++){const x=rnd()*W,y=240,h=22+rnd()*140;s+=rect(x,y-h,6+rnd()*14,h,'#20365177');}
    for(let i=0;i<35;i++)s+=ellipse(rnd()*W,40+rnd()*180,1,1,'#c4dfea99');
    s+=ellipse(500,390,650,180,'url(#haze)')+ellipse(1280,520,620,180,'url(#haze)');
    const byId=Object.fromEntries(districts.map(d=>[d.id,d]));
    const links=[['crews','local'],['local','commons'],['local','projects'],['projects','commons'],['projects','ask'],['ask','exchange'],['commons','crews'],['crews','circles'],['circles','events'],['commons','circles'],['commons','events'],['commons','yesno'],['commons','plans'],['commons','exchange'],['exchange','plans'],['plans','yesno'],['yesno','events']];
    links.forEach(([a,b])=>{s+=bridge(byId[a],byId[b]);});
    districts.slice().sort((a,b)=>a.y-b.y).forEach(d=>{s+=island(d);});
    s+=rect(0,0,W,H,'url(#lower)','pointer-events="none"');
    s+=ellipse(240,897,470,80,'url(#haze)')+ellipse(1400,873,600,60,'url(#haze)');
    s+=rect(0,0,W,H,'#e2e9e3','filter="url(#grain)" opacity=".035" pointer-events="none"');
    return s+'</svg>';
  }
  global.NetizensCity={districts,render,width:W,height:H};
  if(!global.document)return;
  const host=document.getElementById('placeWorld');if(!host)return;
  host.insertAdjacentHTML('afterbegin',render());
  districts.forEach(d=>{
    const button=host.querySelector(`button[data-place="${d.id}"]`);
    if(!button)return;
    button.style.setProperty('--x',`${d.x/W*100}%`);
    button.style.setProperty('--y',`${(d.y+d.ry*.62)/H*100}%`);
    const group=host.querySelector(`[data-district="${d.id}"]`);
    button.addEventListener('pointerenter',()=>group.classList.add('district-lit'));
    button.addEventListener('pointerleave',()=>group.classList.remove('district-lit'));
    button.addEventListener('focus',()=>group.classList.add('district-lit'));
    button.addEventListener('blur',()=>group.classList.remove('district-lit'));
    group.addEventListener('click',()=>button.click());
  });
})(typeof window==='undefined'?globalThis:window);

// Pointer panning moves only the local camera. A drag must never activate a Place.
(function(){
  if(typeof document==='undefined')return;
  const viewport=document.querySelector('.world-scene-viewport');
  const map=document.getElementById('worldMap');
  let drag=null,suppressClick=false;
  viewport.addEventListener('pointerdown',function(e){
    if(map.dataset.layout!=='city'||e.pointerType==='touch'||e.button!==0||e.target.closest('button'))return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false};
  });
  viewport.addEventListener('pointermove',function(e){
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<6)return;
    drag.moved=true;viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-panning');
    viewport.scrollLeft=drag.left-dx;viewport.scrollTop=drag.top-dy;
  });
  function endDrag(){if(!drag)return;suppressClick=drag.moved;drag=null;viewport.classList.remove('is-panning');}
  viewport.addEventListener('pointerup',endDrag);
  viewport.addEventListener('pointercancel',()=>{endDrag();suppressClick=false;});
  viewport.addEventListener('lostpointercapture',endDrag);
  viewport.addEventListener('click',function(e){if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
})();
