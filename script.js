/* Grade 10 Cartesian Plane Visualizer – vanilla JS, no libraries. */
const $=s=>document.querySelector(s), rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const C={b:'#2563eb',o:'#ea580c',p:'#7c3aed',t:'#0d9488'};
/* ---------- progress ---------- */
const done=new Set();

function mark(id) {
  done.add(id);

  const progress = done.size * 10;

  document.querySelector("#bar").style.width = progress + "%";
  document.querySelector("#pt").textContent = progress + " / 10";
  document.querySelector("#progressTrack")
    ?.setAttribute("aria-valuenow", progress);
}

const say=(id,html,ok)=>{const e=$(id);e.innerHTML=ok===undefined?html:`<span class="${ok?'ok':'bad'}">${ok?'✔ ':'✘ '}</span>${html}`};
/* ---------- math helpers ---------- */
const p=n=>n<0?`(${n})`:`${n}`;
function simp(n){ // exact radical form of √n
  if(n===0)return'0';let k=1;for(let i=2;i*i<=n;i++)if(n%(i*i)===0)k=i;const m=n/(k*k);
  if(m===1)return`${k}`;return(k>1?k:'')+'√'+m}
function dist(a,b){const dx=b[0]-a[0],dy=b[1]-a[1],s=dx*dx+dy*dy;return{dx,dy,s,d:Math.sqrt(s)}}
function steps(a,b){const[x1,y1]=a,[x2,y2]=b,r=dist(a,b),e=simp(r.s);
  const out=[`<b>Step 1 – Substitute:</b> d = √[(${x2} − ${p(x1)})² + (${y2} − ${p(y1)})²]`,
  `<b>Step 2 – Subtract:</b> d = √[${p(x2-x1)}² + ${p(y2-y1)}²]`,
  `<b>Step 3 – Square each:</b> d = √[${r.dx**2} + ${r.dy**2}]`,
  `<b>Step 4 – Add:</b> d = √${r.s}`+(e!==`√${r.s}`&&r.s>0?` = ${e}`:''),
  `<b>Step 5 – Approximate:</b> d ≈ ${r.d.toFixed(2)} units`];
  if(r.s===0)out.push('The points are the same, so the distance is 0.');
  else if(r.dx===0)out.push('Same x → a vertical segment. Distance = |y₂ − y₁|.');
  else if(r.dy===0)out.push('Same y → a horizontal segment. Distance = |x₂ − x₁|.');
  return out}
/* parse "3√5", "3sqrt5", "√45", "6.71", "7" → number or null */
function parseAns(t){t=t.replace(/\s|\*/g,'').replace(/sqrt/gi,'√').replace(/[()]/g,'');
  let m=t.match(/^(\d*\.?\d*)√(\d+)$/);if(m)return(m[1]===''?1:+m[1])*Math.sqrt(+m[2]);
  return/^-?\d*\.?\d+$/.test(t)?+t:null}
const close=(a,b)=>a!==null&&Math.abs(a-b)<=0.01+1e-9;
/* ---------- reusable SVG grid (math → screen; +y points UP) ---------- */
function Grid(id,R){const svg=document.getElementById(id),u=200/R,c=230;
  const X=x=>c+x*u,Y=y=>c-y*u;let h='';
  for(let i=-R;i<=R;i++){h+=`<line class="gl" x1="${X(i)}" y1="${Y(-R)}" x2="${X(i)}" y2="${Y(R)}"/><line class="gl" x1="${X(-R)}" y1="${Y(i)}" x2="${X(R)}" y2="${Y(i)}"/>`;
    if(i&&(R<=6||i%2===0))h+=`<text class="tk" x="${X(i)}" y="${c+14}" text-anchor="middle">${i}</text><text class="tk" x="${c-6}" y="${Y(i)+4}" text-anchor="end">${i}</text>`}
  h+=`<line class="ax" x1="${X(-R)}" y1="${c}" x2="${X(R)}" y2="${c}"/><line class="ax" x1="${c}" y1="${Y(-R)}" x2="${c}" y2="${Y(R)}"/>
  <text class="lbl" x="${X(R)-4}" y="${c-8}" text-anchor="end">x</text><text class="lbl" x="${c+8}" y="${Y(R)+12}">y</text><text class="tk" x="${c-6}" y="${c+14}" text-anchor="end">O</text><g class="L"></g>`;
  svg.setAttribute('viewBox','0 0 460 460');svg.innerHTML=h;const L=svg.querySelector('.L');
  const g={R,X,Y,svg,clear(){L.innerHTML=''},add(s){L.insertAdjacentHTML('beforeend',s)},
    line(x1,y1,x2,y2,col,dash,w=3){g.add(`<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${col}" stroke-width="${w}" ${dash?'stroke-dasharray="7 5"':''} stroke-linecap="round"/>`)},
    pt(x,y,lab,col=C.b,r=6){g.add(`<circle cx="${X(x)}" cy="${Y(y)}" r="${r}" fill="${col}" stroke="#fff" stroke-width="2"><animate attributeName="r" from="0" to="${r}" dur=".3s"/></circle>${lab===false?'':`<text class="lbl" x="${X(x)+9}" y="${Y(y)-9}">${lab===undefined?`(${x}, ${y})`:lab}</text>`}`)},
    guides(x,y){g.line(0,y,x,y,C.b,1,2.5);g.line(x,0,x,y,C.o,1,2.5)},
    tri(a,b,stage=3,labels=true){const[x1,y1]=a,[x2,y2]=b,r=dist(a,b);
      if(stage>=1)g.line(x1,y1,x2,y2,C.p,0,4.5);
      if(stage>=2&&r.dx){g.line(x1,y1,x2,y1,C.b,0,3);if(labels)g.add(`<text class="lbl" fill="${C.b}" x="${X((x1+x2)/2)}" y="${Y(y1)+(y2>y1?20:-10)}" text-anchor="middle">${Math.abs(r.dx)} (horiz.)</text>`)}
      if(stage>=3&&r.dy){g.line(x2,y1,x2,y2,C.o,1,3);if(labels)g.add(`<text class="lbl" x="${X(x2)+8}" y="${Y((y1+y2)/2)}">${Math.abs(r.dy)} (vert.)</text>`);
        if(r.dx){const s=Math.sign(x1-x2)*10,t=Math.sign(y2-y1)*-10;g.add(`<path d="M${X(x2)+s} ${Y(y1)} v${t} h${-s}" fill="none" stroke="#333" stroke-width="1.5"/>`)}}},
    click(fn){svg.addEventListener('click',e=>{const r=svg.getBoundingClientRect(),k=460/r.width;
      fn(Math.round(((e.clientX-r.left)*k-c)/u),Math.round((c-(e.clientY-r.top)*k)/u))})}};
  return g}
/* ---------- B: plane ---------- */
const gB=Grid('gB',10);
gB.click((x,y)=>{say('#bOut',`You clicked <b>(${x}, ${y})</b>: ${x} ${x<0?'left':'right'}, ${y} ${y<0?'down':'up'}.`);$('#bx').value=x;$('#by').value=y});
const A={plotB(){const x=+$('#bx').value,y=+$('#by').value;
  if($('#bx').value===''||$('#by').value==='')return say('#bMsg','Enter both x and y.',false);
  if(Math.abs(x)>10||Math.abs(y)>10)return say('#bMsg','Keep x and y between −10 and 10.',false);
  gB.guides(x,y);gB.pt(x,y);say('#bMsg',`Start at O. Move ${Math.abs(x)} ${x<0?'left':'right'} (blue), then ${Math.abs(y)} ${y<0?'down':'up'} (orange). Point: (${x}, ${y}).`,true);mark('b')},
  clearB(){gB.clear();say('#bMsg','')}};
/* ---------- C: classroom ---------- */
const gC=Grid('gC',4);let cTarget=null;
const named={'1,1':'Juan','3,2':'Juana'};
function showNamed(){gC.clear();for(const k in named){const[x,y]=k.split(',').map(Number);gC.pt(x,y,`${named[k]} (${x}, ${y})`,C.t)}}
showNamed();
for(let r=3;r>=1;r--)for(let c=1;c<=3;c++){const b=document.createElement('button');b.className='seat';b.dataset.x=c;b.dataset.y=r;
  b.innerHTML=`Row ${r}, Col ${c}<br><small>${named[c+','+r]||''}</small>`;b.onclick=()=>seat(c,r);$('#seats').append(b)}
function seat(c,r){document.querySelectorAll('.seat').forEach(s=>s.classList.toggle('on',s.dataset.x==c&&s.dataset.y==r));
  showNamed();gC.guides(c,r);gC.pt(c,r,undefined,C.o);
  if(cTarget){const ok=cTarget[0]==c&&cTarget[1]==r;say('#cMsg',ok?`Correct! (${c}, ${r}) is column ${c}, row ${r}.`:`That seat is (${c}, ${r}). Look for x = ${cTarget[0]} across, y = ${cTarget[1]} up.`,ok);if(ok){cTarget=null;mark('c')}return}
  say('#cOut',`Column ${c}, Row ${r} → <b>(x, y) = (${c}, ${r})</b>${named[c+','+r]?' · '+named[c+','+r]:''}`)}
A.cChal=()=>{let x,y;do{x=rnd(1,3);y=rnd(1,3)}while(named[x+','+y]);cTarget=[x,y];say('#cMsg',`Click the seat at <b>(${x}, ${y})</b>.`)};
/* ---------- D: identify (EXAMPLE points – textbook image not provided) ---------- */
const DIST_PTS=[['D',4,6],['I',-7,3],['S',-5,-4],['T',6,-8]];let di=0;const gD=Grid('gD',10);
function dDraw(){gD.clear();DIST_PTS.forEach(([n,x,y],i)=>gD.pt(x,y,n,i<di?C.t:i===di?C.p:'#888'));
  if(di<4)$('#dQ').textContent=`What are the coordinates of point ${DIST_PTS[di][0]}?`;else $('#dQ').textContent='All points identified!';$('#dx').value=$('#dy').value=''}
dDraw();
Object.assign(A,{dCheck(){if(di>3)return;const[n,x,y]=DIST_PTS[di],ax=$('#dx').value,ay=$('#dy').value;
  if(ax===''||ay==='')return say('#dMsg','Enter both numbers.',false);
  if(+ax===x&&+ay===y){say('#dMsg',`Great! ${n} = (${x}, ${y}).`,true);di++;dDraw();if(di===4)mark('d')}
  else say('#dMsg',+ax!==x&&+ay!==y?'Both numbers need another look. Read x across first, then y up/down.':+ax!==x?'The x-coordinate (horizontal) is off. Count left/right from the y-axis.':'The y-coordinate (vertical) is off. Count up/down from the x-axis.',false)},
 dHint(){if(di>3)return;const[,x,y]=DIST_PTS[di];dDraw();gD.guides(x,y);say('#dMsg','Blue dashed line: horizontal distance from the y-axis. Orange dashed line: vertical distance from the x-axis.')},
 dReveal(){if(di>3)return;const[n,x,y]=DIST_PTS[di];say('#dMsg',`${n} = (${x}, ${y}): ${Math.abs(x)} ${x<0?'left':'right'}, ${Math.abs(y)} ${y<0?'down':'up'}.`);di++;setTimeout(dDraw,0);setTimeout(()=>say('#dMsg',`Answer shown. Moving on.`),0)}});
/* ---------- E: plot own ---------- */
const E_PTS=[['A',8,3],['N',-6,4],['C',-5,-7],['E',4,-9]];let ei=0;const gE=Grid('gE',10);
function eAsk(){$('#eQ').innerHTML=ei<4?`Plot ${E_PTS[ei][0]}(${E_PTS[ei][1]}, ${E_PTS[ei][2]}): go ${Math.abs(E_PTS[ei][1])} <b>${E_PTS[ei][1]<0?'left':'right'}</b>, then ${Math.abs(E_PTS[ei][2])} <b>${E_PTS[ei][2]<0?'down':'up'}</b>. Click the spot.`:'All four plotted!'}
eAsk();
gE.click((x,y)=>{if(ei>3)return;const[n,px,py]=E_PTS[ei];
  if(x===px&&y===py){gE.guides(px,py);gE.pt(px,py,`${n}(${px}, ${py})`,C.t);say('#eMsg',`Correct! ${px} ${px<0?'left (negative x)':'right'}, then ${py} ${py<0?'down (negative y)':'up'}.`,true);ei++;eAsk();if(ei===4)mark('e')}
  else say('#eMsg',`You clicked (${x}, ${y}). ${x!==px?`x should be ${px}. `:''}${y!==py?`y should be ${py}.`:''}`,false)});
Object.assign(A,{eAll(){gE.clear();E_PTS.forEach(([n,x,y])=>gE.pt(x,y,`${n}(${x}, ${y})`,C.t));ei=4;eAsk()},eRestart(){gE.clear();ei=0;eAsk();say('#eMsg','')}});
/* ---------- F: discover ---------- */
const gF=Grid('gF',6),FA=[1,1],FB=[5,4];let fs=0;
const FT=['Two points: P₁(x₁, y₁) and P₂(x₂, y₂). We want the straight-line distance d.','Join them with a segment (purple). This is the diagonal d.','Go across: horizontal side b = |x₂ − x₁| = 4 (blue).','Go up: vertical side a = |y₂ − y₁| = 3 (orange). The corner is a right angle, so d is the <b>hypotenuse</b>.','Pythagorean Theorem: d² = a² + b²','d² = (x₂ − x₁)² + (y₂ − y₁)². Squaring makes negatives positive.','<b style="font-size:1.3em">d = √[(x₂ − x₁)² + (y₂ − y₁)²]</b>'];
function fDraw(){gF.clear();gF.pt(...FA,'P₁(1, 1)');gF.pt(...FB,'P₂(5, 4)');gF.tri(FA,FB,Math.min(fs,4)-0>0?Math.min(fs-1,3):0);
  $('#fSteps').innerHTML=FT.slice(0,fs).map(t=>`<div>${t}</div>`).join('')}
fDraw();let fTimer;
Object.assign(A,{fNext(){if(fs<FT.length)fs++;fDraw();if(fs===FT.length)mark('f')},fReset(){clearInterval(fTimer);fs=0;fDraw()},
  fHow(){A.fReset();fTimer=setInterval(()=>{A.fNext();if(fs>=FT.length)clearInterval(fTimer)},1100)}});
/* ---------- G: calculator ---------- */
const gG=Grid('gG',10);let gShown=0,gTri=true;
const gv=()=>['gx1','gy1','gx2','gy2'].map(i=>$('#'+i).value);
function gDraw(){const v=gv();gG.clear();
  if(v.some(x=>x===''||!Number.isFinite(+x)||Math.abs(+x)>10)){$('#gSteps').innerHTML='<div>Enter four numbers between −10 and 10.</div>';return}
  const[a,b,c,d]=v.map(Number),P=[a,b],Q=[c,d];
  if(gTri)gG.tri(P,Q,3);else gG.line(a,b,c,d,C.p,0,4.5);
  gG.pt(a,b,`A(${a}, ${b})`,C.b);gG.pt(c,d,`B(${c}, ${d})`,C.o);
  $('#gSteps').innerHTML=steps(P,Q).slice(0,gShown).map(t=>`<div>${t}</div>`).join('')}
['gx1','gy1','gx2','gy2'].forEach(i=>$('#'+i).addEventListener('input',()=>{gShown=5;gDraw()}));
Object.assign(A,{gCalc(){gShown=6;gDraw();mark('g')},gNext(){gShown=Math.min(gShown+1,6);gDraw();if(gShown>=5)mark('g')},gTri(){gTri=!gTri;gDraw()},
  gReset(){['1','1','2','4'].forEach((v,i)=>$('#'+['gx1','gy1','gx2','gy2'][i]).value=v);gShown=0;gDraw()},
  gRand(){['gx1','gy1','gx2','gy2'].forEach(i=>$('#'+i).value=rnd(-9,9));gShown=0;gDraw()}});
gShown=5;gDraw();gShown=0;gDraw();
/* ---------- H: examples ---------- */
const gH=Grid('gH',6);let hTimer;
function runEx(a,b,names=['P','Q']){clearInterval(hTimer);gH.clear();gH.tri(a,b,3);gH.pt(...a,`${names[0]}(${a})`);gH.pt(...b,`${names[1]}(${b})`);
  const s=steps(a,b);let i=0;$('#hSteps').innerHTML='';
  hTimer=setInterval(()=>{if(i<s.length){$('#hSteps').insertAdjacentHTML('beforeend',`<div>${s[i++]}</div>`)}else{clearInterval(hTimer);mark('h')}},900)}
Object.assign(A,{ex1(){runEx([1,1],[2,4],['E','R'])},ex2(){runEx([3,5],[-2,1],['M','O'])},exTry(){runEx([rnd(-6,6),rnd(-6,6)],[rnd(-6,6),rnd(-6,6)])}});
/* ---------- I: practice ---------- */
const PR=[[[-4,2],[2,-1],'A','B'],[[-3,-2],[2,3],'S','T']];let pi=-1;const gI=Grid('gI',6);
function pSet(n){pi=n;const[a,b,na,nb]=PR[n];gI.clear();gI.tri(a,b,3,false);gI.pt(...a,`${na}(${a})`);gI.pt(...b,`${nb}(${b})`);
  $('#iQ').textContent=`Find the distance between ${na}(${a}) and ${nb}(${b}).`;['idx','idy','ians'].forEach(i=>$('#'+i).value='');say('#iMsg','');$('#iSteps').innerHTML=''}
Object.assign(A,{p1(){pSet(0)},p2(){pSet(1)},
 iHint(){if(pi<0)return;say('#iMsg','Hint: subtract x₂ − x₁ and y₂ − y₁. Subtracting a negative adds: 2 − (−4) = 2 + 4 = 6.')},
 iSol(){if(pi<0)return;$('#iSteps').innerHTML=steps(PR[pi][0],PR[pi][1]).slice(0,5).map(t=>`<div>${t}</div>`).join('')},
 iCheck(){if(pi<0)return say('#iMsg','Pick a problem first.',false);const r=dist(PR[pi][0],PR[pi][1]);
  const dx=$('#idx').value,dy=$('#idy').value,v=parseAns($('#ians').value);let m=[];
  if(dx===''||dy==='')return say('#iMsg','Predict both differences first.',false);
  if(+dx!==r.dx)m.push(`x₂ − x₁ is ${r.dx}, not ${dx}.`);if(+dy!==r.dy)m.push(`y₂ − y₁ is ${r.dy}, not ${dy}.`);
  if(v===null)m.push('Enter the distance like 3√5 or 6.71.');else if(!close(v,r.d))m.push('The distance is not quite right. Add the squares, then take the square root.');
  if(!m.length){say('#iMsg',`Correct! d = ${simp(r.s)} ≈ ${r.d.toFixed(2)} units.`,true);A.iSol();mark('i')}else say('#iMsg',m.join(' '),false)}});
A.p1();
/* ---------- J: games ---------- */
function Game(pre,gid,type,total){const g=Grid(gid,10);let n=0,sc=0,cur=null,R=5;
  const q=()=>{g.clear();R=Math.min(10,5+(total?n:0));
    const t=type==='mix'?(n%2?'dist':'hunt'):type;
    if(t==='hunt'){cur={t,x:rnd(-R,R),y:rnd(-R,R)};say('#'+pre+'Q',`Click <b>(${cur.x}, ${cur.y})</b> on the grid.`)}
    else{let a,b;do{a=[rnd(-R,R),rnd(-R,R)];b=[rnd(-R,R),rnd(-R,R)]}while(a+''===b+'');cur={t,a,b,r:dist(a,b)};g.pt(...a,`A(${a})`,C.b);g.pt(...b,`B(${b})`,C.o);g.line(...a,...b,C.p,1,2.5);say('#'+pre+'Q',`Distance from A to B? (exact like 3√2 or decimal)`)}};
  g.click((x,y)=>{if(!cur||cur.t!=='hunt')return;const ok=x===cur.x&&y===cur.y;
    sc+=ok?1:0;n++;g.pt(x,y,undefined,ok?C.t:'#b42318');say('#'+pre+(total?'Sc':'Sc'),`${ok?'Correct!':`Not quite, that was (${x}, ${y}).`} Score ${sc}/${n}`,ok);mark('j');
    if(total&&n>=total){say('#'+pre+'Sc',`Finished! Score ${sc}/${total}. Press Restart to try again.`);cur=null}else setTimeout(q,900)});
  return{start(){n=sc=0;q();return this},answer(v){if(!cur||cur.t!=='dist')return false;const ok=close(parseAns(v),cur.r.d);sc+=ok?1:0;n++;mark('j');return{ok,txt:`${ok?'Correct!':'Not quite.'} d = ${simp(cur.r.s)} ≈ ${cur.r.d.toFixed(2)}.`,sc,n}},next:q,get n(){return n},get sc(){return sc}}}
const GH=Game('h','gJ1','hunt').start(),GD=Game('dt','gJ2','dist').start(),GB=Game('bs','gJ3','mix',10);
Object.assign(A,{hunt(){GH.start()},dt(){GD.start();say('#dtMsg','')},
 dtCheck(){const r=GD.answer($('#dtIn').value);if(r){say('#dtMsg',r.txt,r.ok);$('#dtIn').value='';setTimeout(()=>GD.next(),1500)}},
 bsStart(){GB.start();say('#bsSc','Question 1 of 10')},
 bsCheck(){const r=GB.answer($('#bsIn').value);if(!r)return;$('#bsIn').value='';
  say('#bsSc',r.txt+` Score ${r.sc}/${r.n}`,r.ok);if(r.n<10)setTimeout(()=>GB.next(),1200);else say('#bsSc',`Finished! Score ${r.sc}/10.`)}});
GB.start();say('#bsSc','Question 1 of 10');
/* click-to-answer for mix hunt questions already handled in Game */
/* quiz engine */
function Quiz(el,items,scEl,onDone){let sc=0,ans=0;const root=$(el);root.innerHTML='';
  items.forEach(([q,opts,ci,why],qi)=>{const d=document.createElement('div');d.className='card';d.innerHTML=`<p><b>${qi+1}.</b> ${q}</p>`;
    opts.forEach((o,oi)=>{const b=document.createElement('button');b.className='btn alt opt';b.textContent=o;
      b.onclick=()=>{if(d.dataset.done)return;d.dataset.done=1;ans++;const ok=oi===ci;sc+=ok;b.style.background=ok?'#d1fae5':'#fee2e2';
        d.insertAdjacentHTML('beforeend',`<p class="${ok?'ok':'bad'}">${ok?'✔ Correct.':'✘ Not quite.'} ${why}</p>`);
        $(scEl).textContent=`Score: ${sc}/${items.length}`;if(ans===items.length&&onDone)onDone(sc)};d.append(b)});root.append(d)})}
const TF=[['The x-coordinate is written first in an ordered pair.',1,'Yes: (x, y).'],['The origin is (0, 0).',1,'Yes, where the axes cross.'],['The distance between two points can be negative.',0,'No. Squares are never negative, and √ gives a nonnegative value.'],['The hypotenuse is the longest side of a right triangle.',1,'Yes, it is opposite the right angle.'],['Two points with the same x-coordinate form a vertical segment.',1,'Yes: same x means straight up/down.']];
Quiz('#tf',TF.map(([q,a,w])=>[q,['False','True'],a,w]),'#hSc',null);
$('#tf').insertAdjacentHTML('afterend','');
/* ---------- K: map ---------- */
const gK=Grid('gK',10),PL=[['Home',-6,-3],['School',2,4],['Market',7,-5],['Church',-4,6],['Park',6,7]];let ksel=[];
function kDraw(){gK.clear();PL.forEach(([n,x,y])=>gK.pt(x,y,n,ksel.includes(n)?C.o:C.t,8));
  if(ksel.length===2){const a=PL.find(q=>q[0]===ksel[0]),b=PL.find(q=>q[0]===ksel[1]);gK.tri([a[1],a[2]],[b[1],b[2]],3,false)}}
kDraw();
gK.click((x,y)=>{const h=PL.find(([,px,py])=>Math.abs(px-x)<=1&&Math.abs(py-y)<=1);if(!h)return say('#kOut','No place there. Click near a labeled place.');
  if(ksel.length===2)ksel=[];if(!ksel.includes(h[0]))ksel.push(h[0]);kDraw();say('#kOut',ksel.length===1?`${ksel[0]} selected. Pick a second place.`:`${ksel[0]} → ${ksel[1]}. Estimate the distance in units.`)});
A.kCheck=()=>{if(ksel.length<2)return say('#kMsg','Select two places first.',false);
  const a=PL.find(q=>q[0]===ksel[0]),b=PL.find(q=>q[0]===ksel[1]),r=dist([a[1],a[2]],[b[1],b[2]]),e=+$('#kEst').value;
  say('#kMsg',`Exact: ${simp(r.s)} ≈ ${r.d.toFixed(2)} units (≈ ${Math.round(r.d*100)} m straight-line). ${Math.abs(e-r.d)<=1?'Your estimate was close!':'Compare your estimate with the triangle.'}`,Math.abs(e-r.d)<=1)};
/* ---------- L: summary quiz ---------- */
const QZ=[['Which is the ordered pair for 3 left and 2 up?',['(3, 2)','(−3, 2)','(2, −3)'],1,'x is left/right, so −3; y is up, so 2.'],
['What is x₂ − x₁ for (−4, 2) and (2, −1)?',['−2','6','−6'],1,'2 − (−4) = 6.'],
['Distance between (0, 0) and (3, 4)?',['5','7','25'],0,'√(9 + 16) = √25 = 5.'],
['In the right triangle, the distance d is the…',['leg','hypotenuse','origin'],1,'It is opposite the right angle.'],
['(−3, −2) to (2, 3) equals…',['5√2','√10','7'],0,'√(25 + 25) = √50 = 5√2 ≈ 7.07.']];
Quiz('#quiz',QZ,'#qSc',()=>mark('l'));
Object.assign(A,{review(){location.hash='#f'},again(){Quiz('#quiz',QZ,'#qSc',()=>mark('l'));$('#qSc').textContent='';GB.start();location.hash='#j'}});
document.addEventListener('click',e=>{const a=e.target.dataset&&e.target.dataset.a;if(a&&A[a])A[a](e.target)});

/* ===== RESPONSIVE NAVIGATION ===== */

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      menuToggle.focus();
    }
  });
}
