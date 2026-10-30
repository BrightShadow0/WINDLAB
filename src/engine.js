export const DEFAULTS={wind:8.5,direction:0,turbulence:8,density:1.18,load:.75,yawMode:'auto',ambient:35,running:true,site:'india'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rad=d=>d*Math.PI/180,TWO_PI=2*Math.PI;
const MODELS={HAWT:{radius:63,area:Math.PI*63**2,inertia:4.2e7,cutIn:3,cutOut:25,cpPeak:.46,tsrOpt:7.4,width:4.5,drive:.94,gen:.93,maxRpm:12.1,minRpm:6.9,responseTime:24,spinUpRpmPerSecond:.42},BIO_HAWT:{radius:63,area:Math.PI*63**2,inertia:4.2e7,cutIn:3,cutOut:25,cpPeak:.46,tsrOpt:7.4,width:4.5,drive:.94,gen:.93,maxRpm:12.1,minRpm:6.9,responseTime:24},VAWT:{radius:4.2,area:2*4.2*18,inertia:680,cutIn:2.5,cutOut:25,cpPeak:.31,tsrOpt:2.7,width:2.2,drive:.97,gen:.93,maxRpm:100,minRpm:8,responseTime:14,spinUpRpmPerSecond:3.2}};
export const modelParameters=t=>MODELS[t]||MODELS.HAWT;
const cpAt=(tsr,t)=>{const m=modelParameters(t);return clamp(m.cpPeak*Math.exp(-Math.pow((tsr-m.tsrOpt)/m.width,2))*(1-Math.exp(-Math.max(0,tsr)/1.15)),0,t!=='VAWT'?.593:.45);};
// The simplified two-panel VAWT is treated as omnidirectional in plan view.
const directionFactor=()=>1;
const yawFactor=(t,p)=>t==='VAWT'||p.yawMode!=='fixed'?1:Math.pow(Math.max(0,Math.cos(rad(Math.abs(((p.direction+180)%360)-180)))),1.88);
export function effectiveWind(p,time=0){const intensity=clamp((p.turbulence||0)/100,0,.3),gust=.62*Math.sin(time*.32)+.38*Math.sin(time*.11+1.2);return Math.max(0,p.wind*(1+intensity*.18*gust));}
function estimateAcousticLevel(type,p,{wind,rpm,tsr,cp,yawFactor:yaw}){ 
 const m=modelParameters(type);
 // Turbine-only source estimate: no environmental ambient-noise contribution.
 if(rpm<.15||wind<.3)return 0;
 // Research-informed trend estimator, not a BPM/FW-H aeroacoustic solver.
 // A 10% speed change maps to roughly 2-2.5 dB in this simplified model.
 const referenceRpm=m.tsrOpt*Math.max(wind,m.cutIn)/m.radius*60/TWO_PI;
 // Acoustic output builds with rotor speed and reaches its operating peak
 // when the rotor reaches its wind-dependent target RPM. It does not keep
 // increasing beyond that target in this simplified comparison model.
 const speedRatio=clamp(rpm/Math.max(referenceRpm,1),.01,1);
 const rotorSpeedEffect=20*Math.log10(speedRatio);
 const windEffect=8*Math.log10(Math.max(wind,1)/8);
 const turbulence=clamp((p.turbulence||0)/30,0,1);
 const turbulenceEffect=2.5*Math.sqrt(turbulence);
 const cpEffect=2.5*Math.sqrt(clamp(cp/Math.max(m.cpPeak,.01),0,1));
 const yawEffect=type!=='VAWT'?2.5*(1-clamp(yaw,0,1)):0;
 const tsrRatio=tsr/Math.max(m.tsrOpt,.1);
 const dynamicStallEffect=type==='VAWT'&&tsrRatio>0?2.2*clamp((.55-tsrRatio)/.55,0,1):0;
 // Indicative design adjustments, not measured turbine-specific corrections:
 // VAWT offset reflects the lower end of published comparable-size field surveys.
 // Bio-HAWT benefit is activated mainly at higher rotational regimes, consistent
 // with 2026 wind-turbine serration experiments; the effect is geometry-dependent.
 const bioHawtReduction=type==='BIO_HAWT'?1.5*clamp((speedRatio-.85)/.45,0,1):0;
 const designBaseline=type==='VAWT'?41.5:type==='BIO_HAWT'?43:46;
 const sourceDb=clamp(designBaseline+rotorSpeedEffect+windEffect+turbulenceEffect+cpEffect+yawEffect+dynamicStallEffect-bioHawtReduction,20,90);
 return sourceDb;
}
export function evaluate(type,p,state={omega:0},time=0){const m=modelParameters(type),v=effectiveWind(p,time),rho=clamp(p.density||1.225,.8,1.4),omega=Math.max(0,state.omega||0),shutdown=v<m.cutIn||v>=m.cutOut,windPower=.5*rho*m.area*v**3,tsr=v>0?omega*m.radius/v:0,yaw=yawFactor(type,p),direction=type==='VAWT'?directionFactor(p.direction):1,cp=shutdown?0:cpAt(tsr,type)*yaw*direction,rotorPower=windPower*cp,etaDrive=m.drive,etaGen=m.gen,electrical=shutdown?0:rotorPower*etaDrive*etaGen*clamp(p.load,0,1),rpm=omega*60/TWO_PI,tipSpeed=omega*m.radius,noise=estimateAcousticLevel(type,p,{wind:v,rpm,tsr,cp,yawFactor:yaw});return{type,area:m.area,windPower,rotorPower,electrical,cp,etaDrive,etaGen,rpm,omega,tsr,yawFactor:yaw,directionFactor:direction,tipSpeed,noise,shutdown,cutIn:m.cutIn,cutOut:m.cutOut,wind:v};}
export function stepRotor(type,p,previous,dt,time=0){
 const m=modelParameters(type),steps=Math.max(1,Math.ceil(Math.max(0,dt)/.02)),h=Math.max(0,dt)/steps;
 let omega=Math.max(0,previous.omega||0);
 for(let i=0;i<steps;i++){
  const v=effectiveWind(p,time+i*h);
  const currentRpm=omega*60/TWO_PI;
  if(v<m.cutIn||v>=m.cutOut){
   const coastTau=v>=m.cutOut?2.5:4.5;
   omega*=Math.exp(-h/coastTau);
   continue;
  }
  // Variable-speed operating target from the design TSR, bounded by the
  // reference turbine's practical minimum and maximum rotor speeds.
  const targetOmega=m.tsrOpt*v/m.radius;
  const targetRpm=clamp(targetOmega*60/TWO_PI,m.minRpm,m.maxRpm);
  const target=targetRpm*TWO_PI/60;
  // Rate-limited spin-up: the rotor must accelerate from its current speed.
  // This prevents the minimum operating RPM or target RPM from appearing instantly.
  const targetDelta=target-omega;
  const maxStep=(m.spinUpRpmPerSecond||.4)*TWO_PI/60*h;
  omega+=clamp(targetDelta,-maxStep,maxStep);
  omega=clamp(omega,0,m.maxRpm*TWO_PI/60*1.03);
 }
 return{omega};
}
export function buildSweep(type,p){const rows=[];for(let wind=0;wind<=25.0001;wind+=.5){const input={...p,wind,turbulence:0},m=modelParameters(type);let lo=0,hi=m.maxRpm*TWO_PI/60*1.15;for(let n=0;n<42;n++){const w=(lo+hi)/2,power=evaluate(type,input,{omega:w}).rotorPower,target=m.tsrOpt*wind/m.radius,torque=power/Math.max(w,.35),gen=clamp(p.load,0,1)*power/Math.max(target,.35)*clamp(w/Math.max(target,.1),0,1.5),loss=w*(type!=='VAWT'?1800:1.8);if(torque-gen-loss>0)lo=w;else hi=w;}const r=evaluate(type,input,{omega:(lo+hi)/2});rows.push({wind:Number(wind.toFixed(1)),power:r.electrical/1000,cp:r.cp*100,noise:r.noise,windDensity:.5*p.density*wind*wind,rpm:r.rpm});}return rows;}
