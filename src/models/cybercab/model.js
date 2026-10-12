import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original procedural interpretation of the supplied exterior views.
// Metres; +X = front, +Z = vehicle left, +Y = up. Length/wheelbase estimated.
export function buildCybercab(sensors) {
  const car=new T.Group(); car.name='Cybercab — illustrative exterior';
  car.userData={units:'metres',front:'+X',left:'+Z',geometry:'Approximation from Tesla Rider Guide, not manufacturer CAD',width:1.754,height:1.408,lengthEstimate:4.4};
  const shell=new T.Group(); shell.name='Exterior shell'; car.add(shell);
  const roof=new T.Group();roof.name='Roof and rear deck';shell.add(roof);
  const hardware=new T.Group();hardware.name='Camera and microphone representations';car.add(hardware);
  const paint=new T.MeshPhysicalMaterial({color:0xb69a5f,metalness:.73,roughness:.34,clearcoat:.45,clearcoatRoughness:.26,side:T.DoubleSide});
  const paintDark=new T.MeshStandardMaterial({color:0x9a814f,metalness:.67,roughness:.39,side:T.DoubleSide});
  const black=new T.MeshStandardMaterial({color:0x181b1c,roughness:.55,metalness:.15});
  const trim=new T.MeshStandardMaterial({color:0x242727,roughness:.37,metalness:.55});
  const glass=new T.MeshPhysicalMaterial({color:0x101a1d,roughness:.16,metalness:.27,transparent:true,opacity:.94,side:T.DoubleSide,clearcoat:1});
  const seatMat=new T.MeshStandardMaterial({color:0x858380,roughness:.85});
  const lensMat=new T.MeshPhysicalMaterial({color:0x24434d,metalness:.62,roughness:.1,clearcoat:1});
  const white=new T.MeshStandardMaterial({color:0xe6f5f5,emissive:0xcfe7e4,emissiveIntensity:2});
  const red=new T.MeshStandardMaterial({color:0x8d1722,emissive:0xa81722,emissiveIntensity:1.8});
  const amber=new T.MeshStandardMaterial({color:0xff951f,emissive:0xca6908,emissiveIntensity:.8});
  const v=a=>new T.Vector3(...a);
  function mesh(geo,mat,parent,name){const m=new T.Mesh(geo,mat);m.name=name||'Body detail';m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(size,pos,mat,parent=car,r=.01,name){const m=mesh(new RoundedBoxGeometry(...size,3,r),mat,parent,name);m.position.set(...pos);return m;}
  function tube(points,r,mat,parent=shell,name){const curve=new T.CatmullRomCurve3(points.map(v));return mesh(new T.TubeGeometry(curve,Math.max(16,points.length*9),r,6,false),mat,parent,name);}
  function surface(fn,nu,nv,mat,parent=shell,name){const ps=[],uv=[],idx=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){ps.push(...fn(i/nu,j/nv));uv.push(i/nu,j/nv);}for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;idx.push(a,b,a+1,b,b+1,a+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(g,mat,parent,name);}
  const profile=[[-2.2,.80,.805],[-2.04,.85,.866],[-1.6,.94,.877],[-1.1,.966,.877],[-.4,.946,.868],[.4,.91,.867],[1.0,.888,.877],[1.4,.857,.874],[1.8,.785,.838],[2.12,.70,.769],[2.2,.67,.70]];
  function interp(x,k){for(let i=1;i<profile.length;i++){if(x<=profile[i][0]){const a=profile[i-1],b=profile[i];const t=T.MathUtils.clamp((x-a[0])/(b[0]-a[0]),0,1);return T.MathUtils.lerp(a[k],b[k],t);}}return profile.at(-1)[k];}
  function bottom(x){let y=.25;for(const wx of [-1.35,1.35]){const d=x-wx;if(Math.abs(d)<.413)y=Math.max(y,.369+Math.sqrt(.413**2-d*d));}return y;}
  const doors=[];
  for(const s of [1,-1]){
    const hinge=new T.Group();hinge.position.set(.94,.88,s*.79);hinge.name=s>0?'Left butterfly door':'Right butterfly door';car.add(hinge);doors.push({hinge,side:s});
    const door=new T.Group();door.position.set(-.94,-.88,-s*.79);hinge.add(door);
    for(const [start,end,parent,name] of [[-2.2,-.63,shell,'Rear quarter'],[-.63,.94,door,'Door skin'],[.94,2.2,shell,'Front fender']]){
      surface((u,t)=>{const x=T.MathUtils.lerp(start,end,u),top=interp(x,1),low=bottom(x);const y=T.MathUtils.lerp(low,top,t);const z=interp(x,2)-.049*(1-t)+.027*Math.sin(t*Math.PI);return [x,y,z*s];},Math.ceil((end-start)*65),16,paint,parent,`${s>0?'Left':'Right'} ${name}`);
      if(parent===door)surface((u,t)=>{const x=T.MathUtils.lerp(start,end,u);return [x,T.MathUtils.lerp(bottom(x)+.005,interp(x,1)-.009,t),s*(interp(x,2)-.049*(1-t)+.027*Math.sin(t*Math.PI)-.016)];},44,12,black,door,'Inner door panel');
    }
    // Curved glass and its quarter applique. Top and bottom contours reproduce the side view.
    const upper=new T.CatmullRomCurve3([[1.0,.919,s*.772],[.55,1.239,s*.673],[.08,1.381,s*.621],[-.44,1.365,s*.631],[-.97,1.223,s*.715],[-1.38,1.031,s*.802]].map(v));
    const lower=new T.CatmullRomCurve3([[1.0,.916,s*.772],[.55,.934,s*.86],[.08,.952,s*.858],[-.44,.967,s*.858],[-.97,.976,s*.851],[-1.38,1.028,s*.802]].map(v));
    for(const [u0,u1,parent,name] of [[0,.635,door,'Door glass'],[.635,1,shell,'Quarter glass']])surface((u,t)=>{const a=upper.getPoint(T.MathUtils.lerp(u0,u1,u)),b=lower.getPoint(T.MathUtils.lerp(u0,u1,u));return b.lerp(a,t).toArray();},45,14,glass,parent,`${s>0?'Left':'Right'} ${name}`);
    tube(upper.getPoints(38).map(p=>p.toArray()),.023,paint,roof,'Sculpted roof rail');
    tube(Array.from({length:25},(_,i)=>lower.getPoint(i/24*.635).toArray()),.009,trim,door,'Door window sill');
    tube(Array.from({length:15},(_,i)=>lower.getPoint(.635+i/14*.365).toArray()),.009,trim,shell,'Quarter window sill');
    tube([[-.57,1.323,s*.66],[-.67,1.215,s*.725],[-.77,.974,s*.86]],.019,black,shell,'Quarter applique edge');
    tube([[-.63,.947,s*.876],[-.61,.74,s*.87],[-.48,.44,s*.84],[-.36,.255,s*.813]],.0036,black,door,'Door shut line');
    tube([[.94,.88,s*.88],[.88,.63,s*.87],[.87,.30,s*.824]],.003,black,door,'Forward door shut line');
    box([1.72,.093,.058],[.02,.238,s*.806],trim,shell,.017,'Rocker sill');
    box([.086,.012,.034],[-.69,.985,s*.848],black,shell,.006,'Door button');
    for(const wx of [-1.35,1.35]){
      const pts=[];for(let a=0;a<=Math.PI;a+=Math.PI/54)pts.push([wx+Math.cos(a)*.415,.369+Math.sin(a)*.415,s*(interp(wx+Math.cos(a)*.415,2)-.032)]);
      tube(pts,.017,black,shell,'Wheel arch liner');
    }
    // Gold discs, curved sidewalls and concentric tyre mouldings.
    for(const wx of [-1.35,1.35]){
      const wheel=new T.Group();wheel.name=`${s>0?'Left':'Right'} ${wx>0?'front':'rear'} wheel`;wheel.position.set(wx,.368,s*.748);car.add(wheel);
      const tyre=mesh(new T.CylinderGeometry(.365,.365,.228,80,1),new T.MeshStandardMaterial({color:0x171819,roughness:.93}),wheel,'Tyre');tyre.rotation.x=Math.PI/2;
      const tor=mesh(new T.TorusGeometry(.315,.048,16,80),black,wheel,'Rounded tyre shoulder');tor.position.z=s*.093;
      for(const r of [.330,.343]){const t=mesh(new T.TorusGeometry(r,.0016,4,80),trim,wheel,'Sidewall ring');t.position.z=s*.116;}
      const disk=mesh(new T.CylinderGeometry(.304,.315,.024,80,1),paint,wheel,'Aerodynamic wheel cover');disk.rotation.x=s*Math.PI/2;disk.position.z=s*.123;
      const face=surface((u,t)=>{const a=u*Math.PI*2,r=.303*t;return [Math.cos(a)*r,Math.sin(a)*r,s*(.137+.010*(1-t*t))];},80,16,paint,wheel,'Convex gold cover');
      const hub=mesh(new T.SphereGeometry(.020,20,12),paintDark,wheel,'Wheel hub');hub.scale.z=.20;hub.position.z=s*.148;
    }
    box([.052,.08,.01],[1.71,.37,s*.79],amber,shell,.004,'Front side reflector');
    box([.12,.026,.011],[-2.0,.34,s*.83],red,shell,.004,'Rear side reflector');
  }
  // Bonnet with raised fender shoulders and a central soft crown.
  surface((u,t)=>{const x=1.00+1.20*u,z=(t*2-1)*interp(x,2);const edge=interp(x,1);const crown=.019*(1-(t*2-1)**2)+.032*Math.sin(Math.PI*u)*Math.exp(-(((Math.abs(t*2-1)-.76)/.18)**2));return [x,edge+crown,z];},65,38,paint,shell,'Sculpted bonnet');
  for(const s of [1,-1])tube([[1.03,.91,s*.69],[1.45,.86,s*.61],[1.84,.764,s*.55],[2.13,.703,s*.47]],.0028,paintDark,shell,'Bonnet seam');
  // Windshield rises into a continuous small roof. The rear deck remains body coloured.
  surface((u,t)=>{const x=1.02-.87*u,w=.748-.143*u,z=(t*2-1)*w;const y=.937+.451*Math.sin(u*Math.PI/2)-.026*(t*2-1)**2;return [x,y,z];},38,36,glass,roof,'Panoramic windshield');
  const roofProfile=[[-2.2,.82,.795],[-1.65,1.012,.794],[-1.16,1.20,.715],[-.65,1.361,.632],[-.26,1.408,.607],[.15,1.401,.608]];
  function roofP(x,k){for(let i=1;i<roofProfile.length;i++){const a=roofProfile[i-1],b=roofProfile[i];if(x<=b[0])return T.MathUtils.lerp(a[k],b[k],(x-a[0])/(b[0]-a[0]));}return roofProfile.at(-1)[k];}
  surface((u,t)=>{const x=-2.2+2.35*u,z=(2*t-1)*roofP(x,2);return [x,roofP(x,1)-.018*(2*t-1)**2,z];},85,34,paint,roof,'Roof and fastback deck');
  for(const s of [1,-1])surface((u,t)=>{const x=-2.2+1.03*u;return [x,T.MathUtils.lerp(interp(x,1),roofP(x,1)-.018,t),s*T.MathUtils.lerp(interp(x,2),roofP(x,2),t)];},38,12,paint,roof,'Rear shoulder');
  for(const s of [1,-1])tube([[-.78,1.322,s*.35],[-1.32,1.129,s*.49],[-1.84,.921,s*.65],[-2.18,.82,s*.75]],.003,paintDark,roof,'Trunk shut line');
  // Front and rear fascias wrap into the side skins.
  for(const front of [true,false]){const x=front?2.2:-2.2,top=front?.671:.811,w=front?.7:.805;
    surface((u,t)=>{const z=(2*u-1)*w,xx=x+(front?-1:1)*.047*(2*u-1)**2;return [xx,T.MathUtils.lerp(.285,top,t),z];},44,16,paint,shell,front?'Front fascia':'Rear fascia');
    box([.10,.095,w*2+.02],[x-(front?.04:-.035),.270,0],trim,shell,.023,front?'Front splitter':'Rear bumper');
  }
  const frontLine=[ [1.89,.760,-.817],[2.09,.712,-.712],[2.218,.686,-.40],[2.228,.679,0],[2.218,.686,.40],[2.09,.712,.712],[1.89,.760,.817] ];
  tube(frontLine,.018,black,shell,'Front lightbar housing');tube(frontLine.map(([x,y,z])=>[x+.008,y+.005,z]),.006,white,shell,'Front lightbar');
  tube([[-2.181,.827,-.80],[-2.22,.834,-.57],[-2.236,.836,0],[-2.22,.834,.57],[-2.181,.827,.80]],.025,black,shell,'Rear lightbar housing');
  tube([[-2.201,.834,-.78],[-2.242,.84,0],[-2.201,.834,.78]],.007,red,shell,'Rear lightbar');
  box([.01,.132,.327],[2.215,.508,0],trim,shell,.012,'Front plate bracket');
  box([.012,.12,.30],[2.225,.513,0],new T.MeshStandardMaterial({color:0xc8cbcd,metalness:.55,roughness:.4}),shell,.007,'Front plate');
  box([.02,.065,.96],[2.209,.346,0],black,shell,.004,'Lower grille');
  for(let z=-.44;z<=.44;z+=.083)box([.016,.062,.006],[2.224,.346,z],trim,shell,.001,'Grille vane');
  // A pair of wipers is a visual detail, not a sensor annotation.
  for(const s of [1,-1])tube([[1.022,.955,s*.09],[.996,.969,s*.29],[.989,.969,s*.54]],.005,black,roof,'Windshield wiper');
  box([2.58,.105,1.36],[-.03,.265,0],black,car,.045,'Cabin floor');
  box([.27,.12,1.37],[.82,.84,0],black,car,.03,'Dashboard');
  box([.04,.26,.44],[.66,.905,0],black,car,.014,'Center touchscreen');
  const screen=box([.002,.223,.404],[.636,.905,0],new T.MeshStandardMaterial({color:0x19292c,emissive:0x253b40,emissiveIntensity:.4}),car,.003,'Touchscreen display');
  for(const s of [1,-1]){
    box([.49,.14,.48],[-.29,.49,s*.34],seatMat,car,.065,'Seat cushion');
    const back=box([.13,.59,.46],[-.55,.85,s*.34],seatMat,car,.06,'Seat back with integrated head support');back.rotation.z=-.13;
    tube([[-.56,1.10,s*.52],[-.35,.61,s*.34],[-.14,.54,s*.13]],.011,black,car,'Seat belt');
    box([.16,.09,.21],[-.42,.37,s*.34],trim,car,.02,'Seat pedestal');
    box([.005,.016,.47],[.659,.851,s*.4],trim,car,.002,'Climate vent');
  }
  box([.26,.047,.26],[.12,1.316,0],black,car,.025,'Overhead console');
  for(const s of [-1,1])box([.10,.005,.049],[.16,1.290,s*.081],white,car,.008,'Dome light');
  box([.034,.008,.034],[.16,1.287,0],red,car,.006,'Stop button');

  const sensorMeshes=new Map();
  for(const sensor of sensors){
    const group=new T.Group();group.name=`${sensor.id} — ${sensor.name}`;group.position.set(...sensor.pos);group.userData={...sensor};hardware.add(group);sensorMeshes.set(sensor.id,group);
    const dir=v(sensor.dir).normalize();group.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),dir);
    if(sensor.type==='camera'){
      const housing=mesh(new T.CylinderGeometry(.036,.040,.024,24),black,group,'Camera housing');housing.rotation.x=Math.PI/2;
      const bezel=mesh(new T.TorusGeometry(.024,.0035,8,32),trim,group,'Lens bezel');bezel.position.z=.015;
      const lens=mesh(new T.CircleGeometry(.021,32),lensMat,group,'Camera lens');lens.position.z=.017;
      const dot=mesh(new T.CircleGeometry(.006,16),new T.MeshBasicMaterial({color:0x4c707c}),group,'Lens reflection');dot.position.set(-.006,.006,.018);
    }else if(sensor.type==='audio'){
      const mic=mesh(new T.CylinderGeometry(.018,.02,.008,20),black,group,'Microphone region');mic.rotation.x=Math.PI/2;
      for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const hole=mesh(new T.CircleGeometry(.0018,6),trim,group,'Microphone aperture illustration');hole.position.set(a*.006,b*.006,.005);}
    }
  }
  const exteriorMaterials=[paint,paintDark,glass];
  function setXray(on){paint.transparent=on;paint.opacity=on?.15:1;paint.depthWrite=!on;paintDark.transparent=on;paintDark.opacity=on?.13:1;paintDark.depthWrite=!on;glass.opacity=on?.075:.94;glass.depthWrite=!on;for(const m of exteriorMaterials)m.needsUpdate=true;}
  function setDoors(t){for(const {hinge,side} of doors){hinge.rotation.set(t*side*.28,0,-t*1.08);hinge.rotation.y=t*side*.25;}}
  return {car,shell,roof,hardware,sensorMeshes,setXray,setDoors,paint};
}
