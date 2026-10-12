export const SOURCES = {
 perception:{label:'Aurora · Perception architecture (Jan 2026)',url:'https://aurora.tech/newsroom/seeing-with-superhuman-clarity-the-physics-and-architecture-behind-the'},
 home:{label:'Aurora · Truck and pod overview',url:'https://aurora.tech/'},
 faq:{label:'Aurora · Sensor suite FAQ (Feb 2025)',url:'https://aurora.tech/newsroom/have-questions-about-aurora-and-avs-get-your-answers-here'},
 cleaning:{label:'Aurora · Sensor cleaning',url:'https://aurora.tech/newsroom/capability-spotlight-stormy-weather'}
};
export const TYPES={
 lidar:{label:'Lidar',color:'#1768aa',output:'Distance and 3D geometry',description:'Lidar contributes a geometric view of the surroundings. Aurora combines different lidar sensing roles with cameras and radar.'},
 camera:{label:'Camera',color:'#a35421',output:'Images and visual context',description:'High-resolution cameras supply visual cues such as road markings, signs, and the appearance of other road users.'},
 radar:{label:'Imaging radar',color:'#28734f',output:'Range and relative motion',description:'Imaging radar adds radio-based sensing to the optical systems, including when visibility is reduced by weather.'},
 support:{label:'Supporting hardware',color:'#705480',output:'Perception support',description:''}
};
const approximate='Representative location and orientation. This model ID is not an Aurora part number; exact placement and count are not published in the supplied references.';
const make=(id,type,name,location,position,dir,extra={})=>({id,type,name,location,position,dir,description:TYPES[type].description,subtype:TYPES[type].label,output:TYPES[type].output,note:approximate,source:type==='support'?'home':'perception',...extra});
export const SENSORS=[
 make('L01','lidar','FirstLight lidar','Center pod · above windshield',[.98,3.83,0],[1,0,0],{subtype:'Long-range FMCW lidar',output:'3D position and radial velocity',description:'FirstLight uses coherent FMCW sensing and Doppler measurements. The January 2026 article describes detection beyond 450 meters; its 1,000-meter reference concerns the next generation.',note:'Technology and center-pod association are public. The aperture, dimensions and transform shown here are approximate. This reconstruction follows the earlier Peterbilt configuration, not a validated Driver 2 installation.',source:'perception'}),
 make('L02','lidar','Left surround lidar','Driver-side pod · upper surface',[.50,3.62,1.49],[0,0,1],{subtype:'Surround sensing · illustrative',note:'A small upper sensor is visible on the reference side pod. Its exact type, optical design and coverage are not identified by the supplied sources.'}),
 make('L03','lidar','Right surround lidar','Passenger-side pod · upper surface',[.50,3.62,-1.49],[0,0,-1],{subtype:'Surround sensing · illustrative',note:'Mirrored representative surround unit. Exact model, count and coverage are unverified.'}),
 make('C01','camera','Center camera · left','Center pod · left aperture',[1.005,3.83,.33],[1,0,.08],{subtype:'Forward visual sensing'}),
 make('C02','camera','Center camera · right','Center pod · right aperture',[1.005,3.83,-.33],[1,0,-.08],{subtype:'Forward visual sensing'}),
 ...[1,-1].flatMap((s,i)=>[
  make(`C0${3+i*3}`,'camera',`${s===1?'Left':'Right'} pod · forward camera`,`${s===1?'Driver':'Passenger'}-side pod · front`,[1.12,3.30,s*1.49],[1,0,s*.12],{subtype:'Forward-oblique view · schematic'}),
  make(`C0${4+i*3}`,'camera',`${s===1?'Left':'Right'} pod · side camera`,`${s===1?'Driver':'Passenger'}-side pod · outer face`,[.51,3.30,s*1.72],[0,-.08,s],{subtype:'Lateral view · schematic'}),
  make(`C0${5+i*3}`,'camera',`${s===1?'Left':'Right'} pod · rear camera`,`${s===1?'Driver':'Passenger'}-side pod · aft face`,[-.12,3.30,s*1.49],[-1,0,s*.12],{subtype:'Rear-oblique view · schematic'})
 ]),
 make('C09','camera','Left close-view camera','Forward body · driver-side corner',[3.13,1.05,.94],[.7,-.30,.7],{subtype:'Near-field view · illustrative'}),
 make('C10','camera','Right close-view camera','Forward body · passenger-side corner',[3.13,1.05,-.94],[.7,-.30,-.7],{subtype:'Near-field view · illustrative'}),
 make('R01','radar','Forward imaging radar','Front fascia · representative mount',[3.55,.94,0],[1,0,0]),
 make('R02','radar','Left pod radar','Driver-side pod · outer panel',[.15,3.29,1.72],[.12,0,1]),
 make('R03','radar','Right pod radar','Passenger-side pod · outer panel',[.15,3.29,-1.72],[.12,0,-1]),
 make('R04','radar','Left flank radar','Driver-side body · behind cab',[-1.58,1.13,1.23],[-.5,0,1]),
 make('R05','radar','Right flank radar','Passenger-side body · behind cab',[-1.58,1.13,-1.23],[-.5,0,-1]),
 make('R06','radar','Aft radar','Rear chassis · representative mount',[-4.20,.99,0],[-1,0,0],{note:'Illustrative rear sensing element. A specific rear-radar mount is not established by the supplied public material; the trailer can occlude this sketch.'}),
 make('S01','support','Left sensor cleaning','Driver-side pod · cleaning outlet',[1.07,3.48,1.63],[1,0,0],{subtype:'Air and washer-fluid cleaning',output:'Clear sensor surfaces',description:'Aurora describes nozzles using high-pressure air and washer fluid to remove contamination from optical surfaces.',source:'cleaning'}),
 make('S02','support','Right sensor cleaning','Passenger-side pod · cleaning outlet',[1.07,3.48,-1.63],[1,0,0],{subtype:'Air and washer-fluid cleaning',output:'Clear sensor surfaces',description:'Cleaning helps maintain camera and lidar inputs during rain and when dirt or debris accumulates.',source:'cleaning'}),
 make('S03','support','Onboard compute','Behind cabin · illustrative enclosure',[-1.99,2.03,0],[-1,0,0],{subtype:'Sensor fusion and redundancy',output:'Scene interpretation and planning',description:'Compute combines sensor observations. The January 2026 article also describes an independent backup computer for fallback operation after a full compute failure.',note:'The onboard computer is identified on Aurora’s website. The enclosure position, dimensions and internals here are illustrative; this is not a service diagram.',source:'perception'})
];
