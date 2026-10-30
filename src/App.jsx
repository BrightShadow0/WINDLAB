import React,{useEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {DEFAULTS,evaluate,stepRotor,buildSweep} from './engine.js';

function Scene({type,rpm,wind,direction,playing,view,yawMode,turbulence,timeScale}){
 const host=useRef(null),cam=useRef(null),live=useRef({rpm,wind,direction,playing,turbulence:0});
 useEffect(()=>{live.current={rpm,wind,direction,playing,yawMode,turbulence,timeScale};},[rpm,wind,direction,playing,yawMode,turbulence,timeScale]);
 useEffect(()=>{
  const el=host.current,scene=new THREE.Scene();scene.background=new THREE.Color('#07111d');scene.fog=new THREE.Fog('#07111d',28,90);
  const camera=new THREE.PerspectiveCamera(38,el.clientWidth/el.clientHeight,.1,200);camera.position.set(17,17,23);cam.current=camera;
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);el.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,8,0);
  scene.add(new THREE.HemisphereLight(0xa8cde2,0x182536,2));const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(10,20,12);scene.add(light);scene.add(new THREE.GridHelper(60,30,0x24536a,0x173044));
  const steel=new THREE.MeshStandardMaterial({color:'#718b9d',metalness:.72,roughness:.3});
  const bladeFinish=new THREE.MeshStandardMaterial({color:type==='BIO_HAWT'?'#d8f0f2':'#dce7ef',metalness:.22,roughness:.3,side:THREE.DoubleSide});
  const dark=new THREE.MeshStandardMaterial({color:'#263e50',metalness:.58,roughness:.34});
  const accent=new THREE.MeshStandardMaterial({color:'#45c6df',metalness:.35,roughness:.28});
  const root=new THREE.Group();scene.add(root);
  const cyl=(top,bottom,height,material,x,y,z)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,48),material);o.position.set(x,y,z);root.add(o);return o;};
  let rotor=new THREE.Group();root.add(rotor);let yawHead=null;
  const isHawt=type!=='VAWT';
  const makeBlade=(bio=false)=>{
   const group=new THREE.Group(),positions=[],indices=[],rows=64,cols=18,r0=.72,r1=8.05;
   for(let side=0;side<2;side++){const offset=positions.length/3;
    for(let i=0;i<=rows;i++){const t=i/rows,r=r0+(r1-r0)*t,chord=.20+1.02*Math.pow(1-t,.72),sweep=.12*Math.sin(t*Math.PI*.85)+.22*t*t,twist=(1-t)*.19;
     for(let j=0;j<=cols;j++){const u=j/cols,thickness=(.13*Math.pow(1-t,.55)+.008)*Math.sin(Math.PI*u),camber=.045*Math.sin(Math.PI*u)*(1-t*.3),tubercle=bio ? 0.11*Math.sin((r-r0)*Math.PI*2/1.18)*Math.exp(-u*9) : 0,chordPos=(u-.3)*chord+sweep+tubercle,sectionZ=(side===0?1:-1)*(thickness+camber);positions.push(sectionZ*Math.cos(twist),r,chordPos+sectionZ*Math.sin(twist));}
    }
    for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const q=offset+i*(cols+1)+j,n=q+cols+1;if(side===0)indices.push(q,n,q+1,q+1,n,n+1);else indices.push(q,q+1,n,q+1,n+1,n);}
   }
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();group.add(new THREE.Mesh(geo,bladeFinish));
   const rootFairing=new THREE.Mesh(new THREE.SphereGeometry(.3,20,16),bladeFinish);rootFairing.position.y=.68;group.add(rootFairing);return group;
  };
  if(isHawt){
   cyl(.34,.58,10.5,steel,0,5.25,0);
   const towerBase=new THREE.Mesh(new THREE.CylinderGeometry(.58,.68,.18,48),dark);towerBase.position.y=.09;root.add(towerBase);
   yawHead=new THREE.Group();yawHead.position.set(0,10.5,0);root.add(yawHead);
   const nacelle=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),dark);nacelle.scale.set(2.35,.58,.72);nacelle.position.set(-.25,.05,0);yawHead.add(nacelle);
   const rearHousing=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),steel);rearHousing.scale.set(.72,.43,.53);rearHousing.position.set(-1.85,.04,0);yawHead.add(rearHousing);
   const roof=new THREE.Mesh(new THREE.BoxGeometry(2.1,.06,.78),steel);roof.position.set(-.25,.59,0);yawHead.add(roof);
   const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,1.2,32),steel);shaft.rotation.z=Math.PI/2;shaft.position.x=1.65;yawHead.add(shaft);
   rotor.position.set(2.35,0,0);yawHead.add(rotor);
   const hub=new THREE.Mesh(new THREE.SphereGeometry(.72,36,28),steel);rotor.add(hub);
   const spinner=new THREE.Mesh(new THREE.ConeGeometry(.62,1.25,40),bladeFinish);spinner.rotation.z=-Math.PI/2;spinner.position.x=.72;rotor.add(spinner);
   for(let i=0;i<3;i++){const blade=makeBlade(type==='BIO_HAWT');blade.rotation.x=i*Math.PI*2/3;rotor.add(blade);}
   const bearing=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,.28,40),accent);bearing.position.y=10.45;root.add(bearing);
   const platform=new THREE.Mesh(new THREE.BoxGeometry(2.2,.12,1.55),steel);platform.position.set(-.15,10.02,0);root.add(platform);
  }else{
   // Two opposed, full-height helical Darrieus-style panels around a vertical shaft.
   // The 180-degree twist and airfoil-like thickness are visual design choices, not CFD geometry.
   cyl(.24,.30,15.4,steel,0,8,0);
   const foot=new THREE.Mesh(new THREE.CylinderGeometry(.88,.98,.34,48),dark);foot.position.y=.62;root.add(foot);
   const topBearing=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.42,40),accent);topBearing.position.y=15.55;root.add(topBearing);
   rotor.position.y=8;
   for(let i=0;i<2;i++){
    const side=i===0?1:-1,blade=new THREE.Group(),pos=[],indices=[],rows=64,cols=20,H=7.5,W=1.48;
    for(let face=0;face<2;face++){
     const offset=pos.length/3;
     for(let r=0;r<=rows;r++){
      const t=r/rows,y=(t-.5)*H,twist=t*Math.PI;
      const ca=Math.cos(twist),sa=Math.sin(twist);
      for(let c=0;c<=cols;c++){
       const u=c/cols,local=(u-.5)*W;
       const thickness=(.105*Math.sin(Math.PI*u)+.012)*(0.82+0.18*Math.sin(Math.PI*t));
       const camber=.035*Math.sin(Math.PI*u);
       const sign=face===0?1:-1;
       const chordX=local*ca,chordZ=local*sa;
       const normalX=-sa,normalZ=ca;
       const bulge=sign*(thickness+camber);
       pos.push(side*(2.72+chordX+normalX*bulge),y, chordZ+normalZ*bulge);
      }
     }
     for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const a=offset+r*(cols+1)+c,b=a+cols+1;
      if(face===0)indices.push(a,b,a+1,a+1,b,b+1);
      else indices.push(a,a+1,b,a+1,b+1,b);
     }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(indices);g.computeVertexNormals();
    blade.add(new THREE.Mesh(g,bladeFinish));
    const capTop=new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),steel);capTop.position.set(side*2.72,3.98,0);blade.add(capTop);
    const capBottom=new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),steel);capBottom.position.set(side*2.72,12.02,0);blade.add(capBottom);
    rotor.add(blade);
   }
   // Streamlined radial support arms tie both panels to the central shaft.
   for(const y of [4.18,11.82]){
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.105,.15,5.35,24),steel);
    arm.rotation.z=Math.PI/2;arm.position.y=y;root.add(arm);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.22,32),dark);hub.position.y=y;root.add(hub);
   }
   const lowerCollar=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.32,32),accent);lowerCollar.position.y=4.18;root.add(lowerCollar);
   const upperCollar=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.32,32),accent);upperCollar.position.y=11.82;root.add(upperCollar);
  }
  const windField=new THREE.Group();scene.add(windField);
  const particleMat=new THREE.MeshBasicMaterial({color:'#55d9e8',transparent:true,opacity:.82});
  const streakMat=new THREE.LineBasicMaterial({color:'#48cbdc',transparent:true,opacity:.38});
  const glowMat=new THREE.LineBasicMaterial({color:'#8beaf1',transparent:true,opacity:.2});
  const particles=[];
  for(let i=0;i<96;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(i%5===0?.06:.035,8,8),particleMat);dot.position.set(-23+Math.random()*46,1.2+Math.random()*15,-10+Math.random()*20);dot.userData={speed:.55+Math.random()*.55,baseY:dot.position.y,baseZ:dot.position.z,phase:Math.random()*Math.PI*2,swirl:Math.random()*Math.PI*2};windField.add(dot);particles.push(dot);}
  const streaks=[];
  const streakMatStrong=new THREE.MeshBasicMaterial({color:'#62e7f2',transparent:true,opacity:.72});
  for(let i=0;i<54;i++){const length=2.2+Math.random()*3.6,y=1.4+Math.random()*14.5,z=-9+Math.random()*18,x=-23+Math.random()*46;const streak=new THREE.Mesh(new THREE.BoxGeometry(length,.025,.025),i%4===0?glowMat:streakMatStrong);streak.position.set(x,y,z);streak.userData={speed:.7+Math.random()*.65,length};windField.add(streak);streaks.push(streak);}
  let fieldAngle=0,yawAngle=0,frame,elapsed=0;const animate=()=>{frame=requestAnimationFrame(animate);controls.update();const d=live.current;elapsed+=.016;if(d.playing)rotor.rotation[isHawt?'x':'y']+=d.rpm*Math.PI/1800*.60*d.timeScale;
   const target=Math.PI-THREE.MathUtils.degToRad(d.direction);let delta=((target-fieldAngle+Math.PI*3)%(Math.PI*2))-Math.PI;fieldAngle+=delta*.075;windField.rotation.y=fieldAngle;
   if(yawHead){const yawTarget=d.yawMode==='fixed'?0:-THREE.MathUtils.degToRad(d.direction);let yawDelta=((yawTarget-yawAngle+Math.PI*3)%(Math.PI*2))-Math.PI;yawAngle+=yawDelta*Math.min(1,.007);yawHead.rotation.y=yawAngle;}
   const flow=.018+Math.max(0,d.wind)*.0025;
   for(const dot of particles){const u=dot.userData;dot.position.x+=flow*u.speed;if(dot.position.x>25)dot.position.x=-25;const strength=Math.max(0,Math.min(1,(d.turbulence||0)/30));const phase=elapsed*(1.1+strength*2.8)+u.phase;const radius=strength*(.12+Math.sin(phase*.43+u.swirl)*.55);dot.position.y=u.baseY+Math.sin(phase+u.swirl)*strength*.75+radius*Math.sin(phase*.7);dot.position.z=u.baseZ+Math.cos(phase+u.swirl)*strength*.75+radius*Math.cos(phase*.7);}
   for(const line of streaks){line.position.x+=flow*line.userData.speed;if(line.position.x>25)line.position.x=-25-line.userData.length;const strength=Math.max(0,Math.min(1,(d.turbulence||0)/30));line.rotation.x=Math.sin(elapsed*.8+line.position.x*.12)*strength*.12;line.rotation.y=Math.cos(elapsed*.7+line.position.z*.15)*strength*.1;line.position.y+=Math.sin(elapsed*1.2+line.position.x*.2)*strength*.006;}
   renderer.render(scene,camera);};animate();
  const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);};const ro=new ResizeObserver(resize);ro.observe(el);
  return()=>{cancelAnimationFrame(frame);ro.disconnect();controls.dispose();renderer.dispose();el.removeChild(renderer.domElement);scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});};
 },[type]);
 useEffect(()=>{if(!cam.current)return;const positions={ORBIT:[17,17,23],FRONT:[30,10,0],TOP:[0,34,.1]};cam.current.position.set(...(positions[view]||positions.ORBIT));},[view]);
 return <div className="scene" ref={host}><div className="scene-tag">● LIVE 3D MODEL <span>WIND VECTOR {direction}°</span></div></div>;
}
function DirectionDial({value,onChange}){
 const setFromPointer=e=>{const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-(rect.left+rect.width/2),y=e.clientY-(rect.top+rect.height/2);onChange(Math.round((Math.atan2(x,-y)*180/Math.PI+360)%360));};
 const a=value*Math.PI/180,ex=60+Math.sin(a)*29,ey=60-Math.cos(a)*29;
 return <div className="direction-control"><div className="direction-head"><label>WIND DIRECTION</label><strong>{String(value).padStart(3,'0')}°</strong></div><div className="compass-wrap"><svg viewBox="0 0 120 120" role="slider" aria-label="Wind direction compass dial" aria-valuemin="0" aria-valuemax="359" aria-valuenow={value} tabIndex="0" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setFromPointer(e);}} onPointerMove={e=>{if(e.buttons===1)setFromPointer(e);}} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();onChange((value+5)%360);}if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();onChange((value+355)%360);}}}>
 <circle cx="60" cy="60" r="48" className="compass-ring"/><circle cx="60" cy="60" r="39" className="compass-inner"/>
 {Array.from({length:36},(_,i)=>{const t=i*Math.PI/18,x1=60+Math.sin(t)*(i%3===0?44:46),y1=60-Math.cos(t)*(i%3===0?44:46),x2=60+Math.sin(t)*48,y2=60-Math.cos(t)*48;return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={i%3===0?'compass-major':'compass-tick'}/>;})}
 <text x="60" y="16" textAnchor="middle" className="compass-cardinal">FRONT</text><text x="105" y="63" textAnchor="middle" className="compass-cardinal">TO RIGHT</text><text x="60" y="111" textAnchor="middle" className="compass-cardinal">FROM BACK</text><text x="14" y="63" textAnchor="middle" className="compass-cardinal">TO LEFT</text>
 <line x1="60" y1="60" x2={ex} y2={ey} className="compass-needle"/><path d="M60 20 L55 32 L65 32 Z" transform={"rotate("+value+" 60 60)"} className="compass-arrow"/><circle cx="60" cy="60" r="5" className="compass-hub"/>
 </svg><div className="compass-hint">DRAG TO SET WIND ANGLE</div></div><div className="direction-meta"><span>0° FRONT · 90° TO RIGHT · 180° FROM BACK · 270° TO LEFT</span></div></div>;
}
function Metric({label,value,unit='',sub=''}){return <div className="metric"><small>{label}</small><strong>{value}<i>{unit}</i></strong>{sub&&<em>{sub}</em>}</div>}
function Plot({data,mode}){const key=mode==='POWER'?'power':mode==='RPM'?'rpm':mode==='Cp'?'cp':mode==='NOISE'?'noise':'wind',unit=mode==='POWER'?'kW':mode==='RPM'?'RPM':mode==='Cp'?'%':mode==='NOISE'?'dBA':'m/s',values=data.map(x=>x[key]||0),max=Math.max(1,...values)*1.12,min=mode==='NOISE'?Math.max(0,Math.min(...values)-3):0,range=Math.max(1,max-min),points=values.map((v,i)=>`${data.length<2?100:i/(data.length-1)*100},${100-(v-min)/range*88}`).join(' ');return <div className="plot live-plot"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" stroke="#35c5d6" strokeWidth="1.8" vectorEffect="non-scaling-stroke"/></svg><div className="plot-scale"><span>{max.toFixed(mode==='RPM'?0:1)} {unit}</span><span>{min.toFixed(mode==='RPM'?0:1)}</span></div><div className="plot-x"><span>−15 s</span><span>LIVE TIME HISTORY</span><span>NOW</span></div>{data.length<2&&<div className="plot-empty">Waiting for live samples…</div>}</div>}
export default function App(){
 const [type,setType]=useState('HAWT'),[p,setP]=useState(DEFAULTS),[rotor,setRotor]=useState({omega:0}),[clock,setClock]=useState(0),[energy,setEnergy]=useState({HAWT:0,BIO_HAWT:0,VAWT:0}),[tab,setTab]=useState('SIMULATION'),[view,setView]=useState('ORBIT'),[plot,setPlot]=useState('POWER'),[trace,setTrace]=useState([]),[stoppedState,setStoppedState]=useState(null),[timeScale,setTimeScale]=useState(1);const sim=useRef({last:performance.now(),time:0,omega:0,graphLast:0});
 useEffect(()=>{let id;const tick=()=>{const now=performance.now(),dt=Math.max(0,(now-sim.current.last)/1000);sim.current.last=now;if(p.running){const simDt=dt*timeScale;sim.current.time+=simDt;const t=sim.current.time;const next=stepRotor(type,p,{omega:sim.current.omega},simDt,t-simDt);sim.current.omega=next.omega;setRotor(next);const out=evaluate(type,p,next,t);setEnergy(e=>({...e,[type]:e[type]+out.electrical*simDt/3600}));setClock(t);if(t-sim.current.graphLast>=.25){sim.current.graphLast=t;setTrace(rows=>[...rows,{time:t,power:out.electrical/1000,rpm:out.rpm,cp:out.cp*100,noise:out.noise,wind:out.wind}].slice(-60));}}id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[type,p.running,p.wind,p.direction,p.turbulence,p.density,p.load,p.yawMode,timeScale]);
 const result=useMemo(()=>evaluate(type,p,rotor,clock),[type,p,rotor,clock]);
 const update=(k,v)=>setP(x=>({...x,[k]:v})),toggleRun=()=>{if(p.running){const final=evaluate(type,p,rotor,clock),sample={time:clock,power:final.electrical/1000,rpm:final.rpm,cp:final.cp*100,noise:final.noise,wind:final.wind};setTrace(rows=>[...rows,sample].slice(-60));const status=final.wind<final.cutIn?'CUT-IN · NOT GENERATING':final.wind>=final.cutOut?'PROTECTIVE SHUTDOWN':final.electrical<=0.01||final.cp<.05?'LOW OUTPUT':'GENERATING';setStoppedState({...sample,status,shutdown:final.shutdown,cutIn:final.cutIn,cutOut:final.cutOut,yawFactor:final.yawFactor,load:p.load});}else{setStoppedState(null);}update('running',!p.running);},reset=()=>{setStoppedState(null);setP({...DEFAULTS,running:false});setRotor({omega:0});setEnergy({HAWT:0,BIO_HAWT:0,VAWT:0});setClock(0);setTrace([]);setStoppedState(null);sim.current.time=0;sim.current.omega=0;sim.current.graphLast=0;sim.current.last=performance.now();},fmt=n=>n>=1000?(n/1000).toFixed(2)+' kW':n.toFixed(1)+' W';
 return <div className="app"><header><div className="logo"><b>W</b><span>WINDLAB<small>BY BRIGHTSHADOW</small></span></div><nav>{['SIMULATION','ANALYSIS','MODEL NOTES'].map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</nav><div className="status">● {p.running?'SYSTEM RUNNING':stoppedState?'PAUSED · FINAL READINGS':'READY · IDLE'}</div></header><main>
 <section className="intro"><div><label>WIND ENERGY · DIGITAL LABORATORY</label><h1>Comparative turbine <em>laboratory</em></h1><p>Explore aerodynamic response under controlled environmental conditions.</p></div>{tab==='SIMULATION'&&<div className="switch">{['HAWT','BIO_HAWT','VAWT'].map(t=><button className={type===t?'chosen':''} onClick={()=>{setType(t);setRotor({omega:0});setTrace([]);setStoppedState(null);sim.current.omega=0;sim.current.graphLast=0;}}>{t==='HAWT'?'CONVENTIONAL HAWT':t==='BIO_HAWT'?'BIO HAWT':'BIO VAWT'}<small>{t==='HAWT'?'THREE-BLADE ROTOR':t==='BIO_HAWT'?'WHALE-TUBERCLE BLADES':'TWISTED-PANEL DESIGN'}</small></button>)}</div>}</section>
 {tab==='SIMULATION'&&<div className="grid"><aside className="panel controls"><h3>01 / ENVIRONMENT</h3><label className="field">INDIA SITE REFERENCE<select value={p.site||'india'} onChange={e=>{const site=e.target.value;update('site',site);if(site==='khavda'){update('density',1.15);update('turbulence',8);update('load',.75);}else if(site==='damodara'){update('density',1.178);update('turbulence',8);update('load',.75);}else{update('density',1.18);update('turbulence',8);update('load',.75);}}}><option value="india">India onshore baseline (assumed)</option><option value="khavda">Khavda, Kutch · NIWE sample</option><option value="damodara">Damodara, Jaisalmer · NIWE sample</option></select></label><Control label="WIND SPEED" value={p.wind.toFixed(1)+' m/s'} min="0" max="25" step=".1" val={p.wind} change={v=>update('wind',v)}/><div className="quick">{[5,8,12,18,25].map(v=><button onClick={()=>update('wind',v)}>{v}</button>)}</div><DirectionDial value={p.direction} onChange={v=>update('direction',v)}/><Control label="TURBULENCE" value={p.turbulence+'%'} min="0" max="30" val={p.turbulence} change={v=>update('turbulence',v)}/><Control label="AIR DENSITY" value={p.density.toFixed(3)+' kg/m³'} min=".9" max="1.35" step=".005" val={p.density} change={v=>update('density',v)}/><Control label="GENERATOR LOAD" value={Math.round(p.load*100)+'%'} min=".2" max="1" step=".01" val={p.load} change={v=>update('load',v)}/>{type!=='VAWT'&&<label className="field">YAW MODE<select value={p.yawMode} onChange={e=>update('yawMode',e.target.value)}><option value="auto">Automatic alignment</option><option value="fixed">Fixed heading (0°)</option></select></label>}<div className="time-control"><div><label>SIMULATION TIME</label><b>{timeScale}× SPEED</b></div><div className="time-options">{[1,2,5,10].map(v=><button key={v} className={timeScale===v?"selected":""} onClick={()=>setTimeScale(v)}>{v}×</button>)}</div><small>Accelerates rotor dynamics, simulation time and live graphs</small></div><div className="actions"><button className="primary" onClick={toggleRun}>{p.running?'Ⅱ PAUSE':'▶ START'}</button><button onClick={reset}>↺ RESET</button></div></aside>
 <section className="center"><div className="panel"><div className="panel-title"><div><h3>02 / TURBINE VISUALISATION</h3><b>{type==='VAWT'?'BIO-INSPIRED · TWO TWISTED VERTICAL PANELS':type==='BIO_HAWT'?'WHALE-INSPIRED · TUBERCLE-EDGE HAWT':'CONVENTIONAL · THREE-BLADE HAWT'}</b></div><select value={view} onChange={e=>setView(e.target.value)}><option>ORBIT</option><option>FRONT</option><option>TOP</option></select></div><Scene type={type} rpm={result.rpm} wind={p.wind} direction={p.direction} turbulence={p.turbulence} playing={p.running} yawMode={p.yawMode} view={view} timeScale={timeScale}/></div><div className="metrics"><Metric label="ROTOR SPEED" value={result.rpm.toFixed(2)} unit="RPM"/><Metric label="ELECTRICAL OUTPUT" value={fmt(result.electrical)} sub={result.shutdown?'CUT-IN / CUT-OUT':'GENERATOR ESTIMATE'}/><Metric label="POWER COEFFICIENT" value={result.cp.toFixed(3)} unit="Cp"/><Metric label="EST. ACOUSTIC LEVEL" value={result.noise.toFixed(1)} unit="dBA"/></div><div className="panel chart"><div className="panel-title"><div><h3>03 / LIVE PERFORMANCE GRAPH</h3><b>Operating values plotted as the simulation runs</b></div><select value={plot} onChange={e=>setPlot(e.target.value)}><option>POWER</option><option>RPM</option><option>Cp</option><option>NOISE</option><option>WIND SPEED</option></select></div><Plot data={trace} mode={plot}/><p>Live model output · rolling 15-second history · pauses with simulation</p></div></section>
 <aside className="panel telemetry"><h3>04 / LIVE TELEMETRY</h3><Metric label="AVAILABLE WIND POWER" value={fmt(result.windPower)}/><Metric label="AERODYNAMIC POWER" value={fmt(result.rotorPower)}/><Metric label="ELECTRICAL EFFICIENCY" value={(result.cp*result.etaDrive*result.etaGen*p.load*100).toFixed(1)} unit="%"/><Metric label="TIP SPEED RATIO" value={result.tsr.toFixed(2)}/><Metric label="SESSION ENERGY" value={(energy[type]/1000).toFixed(4)} unit="kWh"/><hr/><h3>OPERATING STATE {stoppedState?'· FINAL':p.running?'· LIVE':'· IDLE'}</h3><div className={((stoppedState?.status||(p.running?(result.shutdown?'PROTECTIVE SHUTDOWN':'GENERATING'):'READY · PRESS START')).includes('GENERATING'))?'good':'warning'}>{stoppedState?stoppedState.status:(p.running?(result.shutdown?'PROTECTIVE SHUTDOWN':'GENERATING'):'READY · PRESS START')}</div><p>{stoppedState?`Final graph readings: wind ${stoppedState.wind.toFixed(2)} m/s · output ${stoppedState.power.toFixed(2)} kW · noise ${stoppedState.noise.toFixed(1)} dBA · rotor ${stoppedState.rpm.toFixed(2)} RPM · Cp ${stoppedState.cp.toFixed(3)}%.`:!p.running?'Simulation is idle. Press Start to begin collecting readings.':result.shutdown?`Wind must be between ${result.cutIn} and ${result.cutOut} m/s.`:`Yaw factor ${(result.yawFactor*100).toFixed(1)}% · generator load ${(p.load*100).toFixed(0)}%.`}</p><h3>MODEL PARAMETERS</h3><p>Swept area <b>{result.area.toFixed(1)} m²</b></p><p>Drive efficiency <b>{(result.etaDrive*100).toFixed(0)}%</b></p><p>Generator efficiency <b>{(result.etaGen*100).toFixed(0)}%</b></p></aside></div>}
 {tab==='ANALYSIS'&&<div className="panel notes"><h2>Same conditions. Different rotor behaviour.</h2><div className="compare">{['HAWT','BIO_HAWT','VAWT'].map(t=>{const r=evaluate(t,p,rotor,clock);return <article><h3>{t==='BIO_HAWT'?'BIO-INSPIRED HAWT':t}</h3><p>{t==='VAWT'?'Vertical-axis rotor with two opposing, twisted lift-driven panels and an omnidirectional response assumption.':t==='BIO_HAWT'?'Three-blade horizontal rotor with humpback-whale tubercle-inspired leading edges; aerodynamic performance remains a hypothesis.':'Conventional three-blade horizontal-axis rotor with yaw alignment and a yaw-misalignment penalty in fixed mode.'}</p><div className="analysis-readings"><div><small>ELECTRICAL OUTPUT</small><strong>{(r.electrical/1000).toFixed(2)} <i>kW</i></strong></div><div><small>EST. TURBINE NOISE</small><strong>{r.noise.toFixed(1)} <i>dBA</i></strong></div></div></article>})}</div><p>All three designs are evaluated at the same wind speed, density, direction, turbulence and generator-load input. Electrical output and turbine-only acoustic estimates are shown together. Swept areas, Cp curves and drivetrain assumptions differ by design. Noise values are hypothesis-based model estimates, not measured sound levels; the model is not validated experimental evidence.</p></div>}
 {tab==='MODEL NOTES'&&<div className="panel notes"><h2>Model transparency</h2><p>Available wind power: P = ½ρAv³. Rotor power: Pᵣ = Cp(λ) × Pwind. Electrical output: Pₑ = Pᵣ × ηdrive × ηgenerator × load fraction.</p><p>The rotor follows a bounded variable-speed response based on each design's optimal tip-speed ratio, practical minimum/maximum RPM and response time. The utility-scale HAWT and bio-HAWT use a 6.9–12.1 RPM reference range based on the NREL 5-MW reference turbine. The custom 4.2 m-radius VAWT targets its design TSR of 2.7, giving about 52 RPM at 8.5 m/s before limits; its 8–100 RPM bounds are illustrative design assumptions, not a measured commercial reference. Wind changes move each rotor smoothly toward its new target. Turbulence is a deterministic multi-frequency gust signal. Cut-in and cut-out protection are modelled.</p><p>Acoustic model and readings: the displayed value is an estimated turbine-only source level in dBA. No environmental or ambient-noise floor is added. The estimate responds to rotor RPM relative to its design reference speed, wind speed, turbulence, power coefficient, HAWT yaw misalignment and a low-TSR dynamic-stall proxy for the VAWT. A stationary rotor returns zero modeled operational contribution; this is a simulation convention, not a claim that a physical turbine produces measurable 0 dBA. The reference design offsets are 46 dB for the conventional HAWT, 43 dB for the bio-inspired HAWT and 41.5 dB for the bio-inspired VAWT. They deliberately encode the project's hypothesis that the conventional HAWT may be noisier, with the bio-inspired designs showing lower estimates. These offsets are illustrative assumptions, not measured differences or a universal ranking established by literature. A small additional speed-dependent reduction is applied to the bio-HAWT at higher rotational regimes. The custom two-panel twisted VAWT has no measured acoustic data. Analysis and live readings therefore present comparative model estimates, not measured sound levels or certified sound-pressure predictions. A physical comparison would require matched rated power, rotor scale, operating point, receiver distance and acoustic validation.</p><p>Research basis: Schmidt & Redonnet (2026), experimental aeroacoustics of bio-inspired serrated wind-turbine blades; Cao et al. (2022), approximately 2 dB reduction from trailing-edge serrations on a wind-turbine airfoil under tested conditions; measured VAWT field-noise comparison, Energies (2016), 9(1), 19; tubercle-inspired marine propeller CFD study (2021), which found up to 3.4 dB underwater radiated-noise reduction but is not directly transferable to airborne turbines. Airflow particles are visual cues, not CFD.</p></div>}
 <footer>WINDLAB · EDUCATIONAL ENGINEERING SIMULATION <span>MODEL ESTIMATES · NOT MEASURED PERFORMANCE</span></footer></main></div>;
}
function Control({label,value,min,max,step='1',val,change}){return <div className="control"><div><label>{label}</label><b>{value}</b></div><input type="range" min={min} max={max} step={step} value={val} onChange={e=>change(+e.target.value)}/></div>}
