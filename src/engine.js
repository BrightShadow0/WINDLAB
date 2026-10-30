export const DEFAULTS={wind:8.5,direction:0,turbulence:8,density:1.18,load:.75,yawMode:'auto',ambient:35,running:true,site:'india'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rad=d=>d*Math.PI/180,TWO_PI=2*Math.PI;
const MODELS={HAWT:{radius:63,area:Math.PI*63**2,inertia:4.2e7,cutIn:3,cutOut:25,cpPeak:.46,tsrOpt:7.4,width:4.5,drive:.94,gen:.93,maxRpm:12.1},BIO_HAWT:{radius:63,area:Math.PI*63**2,inertia:4.2e7,cutIn:3,cutOut:25,cpPeak:.46,tsrOpt:7.4,width:4.5,drive:.94,gen:.93,maxRpm:12.1},VAWT:{radius:4.2,area:2*4.2*18,inertia:680,cutIn:2.5,cutOut:25,cpPeak:.31,tsrOpt:2.7,width:2.2,drive:.97,gen:.93,maxRpm:180}};
export const modelParameters=t=>MODELS[t]||MODELS.HAWT;
const cpAt=(tsr,t)=>{const m=modelParameters(t);return clamp(m.cpPeak*Math.exp(-Math.pow((tsr-m.tsrOpt)/m.width,2))*(1-Math.exp(-Math.max(0,tsr)/1.15)),0,t!=='VAWT'?.593:.45);};
const directionFactor=d=>clamp(.86+.11*Math.cos(2*rad(d-18))+.03*Math.cos(4*rad(d)),.68,1);
const yawFactor=(t,p)=>t!=='HAWT'||p.yawMode!=='fixed'?1:Math.pow(Math.max(0,Math.cos(rad(Math.abs(((p.direction+180)%360)-180)))),1.88);
export function effectiveWind(p,time=0){const intensity=clamp((p.turbulence||0)/100,0,.3),gust=.62*Math.sin(time*.32)+.38*Math.sin(time*.11+1.2);return Math.max(0,p.wind*(1+intensity*.18*gust));}
function estimateAcousticLevel(type,p,{wind,rpm,tsr,cp,yawFactor:yaw}){ 
 const m=modelParameters(type),ambient=clamp(p.ambient??35,0,100);
 if(rpm<.15||wind<.3)return ambient;
 // Research-informed trend estimator, not a BPM/FW-H aeroacoustic solver.
 // A 10% speed change maps to roughly 2-2.5 dB in this simplified model.
 const referenceRpm=m.tsrOpt*Math.max(wind,m.cutIn)/m.radius*60/TWO_PI;
 const speedRatio=clamp(rpm/Math.max(referenceRpm,1),.15,1.6);
 const speedSensitivity=type!=='VAWT'?60:50;
 const rotorSpeedEffect=speedSensitivity*Math.log10(speedRatio);
 const windEffect=8*Math.log10(Math.max(wind,1)/8);
 const turbulence=clamp((p.turbulence||0)/30,0,1);
 const turbulenceEffect=2.5*Math.sqrt(turbulence);
 const cpEffect=2.5*Math.sqrt(clamp(cp/Math.max(m.cpPeak,.01),0,1));
 const yawEffect=type!=='VAWT'?2.5*(1-clamp(yaw,0,1)):0;
 const tsrRatio=tsr/Math.max(m.tsrOpt,.1);
 const dynamicStallEffect=type==='VAWT'&&tsrRatio>0?2.2*clamp((.55-tsrRatio)/.55,0,1):0;
 const sourceDb=clamp((type!=='VAWT'?44:42)+rotorSpeedEffect+windEffect+turbulenceEffect+cpEffect+yawEffect+dynamicStallEffect,25,75);
 return 10*Math.log10(Math.pow(10,ambient/10)+Math.pow(10,sourceDb/10));
}
export function evaluate(type,p,state={omega:0},time=0){const m=modelParameters(type),v=effectiveWind(p,time),rho=clamp(p.density||1.225,.8,1.4),omega=Math.max(0,state.omega||0),shutdown=v<m.cutIn||v>=m.cutOut,windPower=.5*rho*m.area*v**3,tsr=v>0?omega*m.radius/v:0,yaw=yawFactor(type,p),direction=type==='VAWT'?directionFactor(p.direction):1,cp=shutdown?0:cpAt(tsr,type)*yaw*direction,rotorPower=windPower*cp,etaDrive=m.drive,etaGen=m.gen,electrical=shutdown?0:rotorPower*etaDrive*etaGen*clamp(p.load,0,1),rpm=omega*60/TWO_PI,tipSpeed=omega*m.radius,noise=estimateAcousticLevel(type,p,{wind:v,rpm,tsr,cp,yawFactor:yaw});return{type,area:m.area,windPower,rotorPower,electrical,cp,etaDrive,etaGen,rpm,omega,tsr,yawFactor:yaw,directionFactor:direction,tipSpeed,noise,shutdown,cutIn:m.cutIn,cutOut:m.cutOut,wind:v};}
export function stepRotor(type,p,previous,dt,time=0){const m=modelParameters(type),steps=Math.max(1,Math.ceil(Math.max(0,dt)/.02)),h=Math.max(0,dt)/steps;let omega=Math.max(0,previous.omega||0);for(let i=0;i<steps;i++){const v=effectiveWind(p,time+i*h);if(v<m.cutIn||v>=m.cutOut){omega*=Math.exp(-4*h);continue;}const rho=clamp(p.density||1.225,.8,1.4),windPower=.5*rho*m.area*v**3,tsr=omega*m.radius/Math.max(v,.1),cp=cpAt(tsr,type)*yawFactor(type,p)*(type==='VAWT'?directionFactor(p.direction):1),aeroPower=windPower*cp,target=m.tsrOpt*v/m.radius,startTorque=.06*.5*rho*m.area*m.radius*v*v*(type!=='VAWT'?yawFactor(type,p):directionFactor(p.direction)),aeroTorque=Math.max(aeroPower/Math.max(omega,.35),startTorque),generatorTorque=clamp(p.load,0,1)*aeroPower/Math.max(target,.35)*clamp(omega/Math.max(target,.1),0,1.5),loss=omega*(type!=='VAWT'?1800:1.8),alpha=(aeroTorque-generatorTorque-loss)/m.inertia;omega=clamp(omega+alpha*h,0,m.maxRpm*TWO_PI/60*1.15);}return{omega};}
export function buildSweep(type,p){const rows=[];for(let wind=0;wind<=25.0001;wind+=.5){const input={...p,wind,turbulence:0},m=modelParameters(type);let lo=0,hi=m.maxRpm*TWO_PI/60*1.15;for(let n=0;n<42;n++){const w=(lo+hi)/2,power=evaluate(type,input,{omega:w}).rotorPower,target=m.tsrOpt*wind/m.radius,torque=power/Math.max(w,.35),gen=clamp(p.load,0,1)*power/Math.max(target,.35)*clamp(w/Math.max(target,.1),0,1.5),loss=w*(type!=='VAWT'?1800:1.8);if(torque-gen-loss>0)lo=w;else hi=w;}const r=evaluate(type,input,{omega:(lo+hi)/2});rows.push({wind:Number(wind.toFixed(1)),power:r.electrical/1000,cp:r.cp*100,noise:r.noise,windDensity:.5*p.density*wind*wind,rpm:r.rpm});}return rows;}
