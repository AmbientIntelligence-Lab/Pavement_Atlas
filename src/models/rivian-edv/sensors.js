// The IDs below belong to this educational model, not Rivian service part numbers.
// +X front, +Y up, +Z vehicle left. Metres. Transforms are NOT calibration data.
export const SOURCES = {
 edv:{title:'Rivian · EDV component map (2023), pp. 2–4',url:'https://rts.i-car.com/images/pdf/oem-info/rivian/position-statements/71350.pdf'},
 rivian:{title:'Rivian · Amazon deliveries, powered by Rivian',url:'https://rivian.com/stories/amazon-electric-delivery-vehicle'},
 amazon:{title:'Amazon · Electric delivery van overview',url:'https://www.aboutamazon.com/news/transportation/everything-you-need-to-know-about-amazons-electric-delivery-vans-from-rivian'},
 wiki:{title:'Wikipedia · EDV proportions and background',url:'https://en.wikipedia.org/wiki/Rivian_EDV'},
 gps:{title:'Rivian · 2022 Impact Report, vehicle safety',url:'https://downloads.rivian.com/2md5qhoeajym/1B94cwRuIpsdG3zQuiUREG/8c925a8ea8f19bc34ce14af57659ccee/Rivian_2022_Impact_Report.pdf'},
 edge:{title:'AWS · Fleet Edge and electric delivery vans',url:'https://aws.amazon.com/solutions/amazon/one-amazon-lane/road-delivery/'},
 vapr:{title:'Amazon · Vision-Assisted Package Retrieval',url:'https://www.aboutamazon.com/news/transportation/amazon-vapr-delivery-van-packages'}
};
export const TYPES = {
 camera:{label:'Cameras',singular:'Camera',color:'#187aab',output:'Images / visual context'},
 radar:{label:'Radar',singular:'Radar',color:'#a56019',output:'Range / relative velocity'},
 ultrasonic:{label:'Ultrasonic',singular:'Ultrasonic sensor',color:'#2c7a59',output:'Nearby obstacle distance'},
 support:{label:'Localization',singular:'Localization',color:'#71629b',output:'Satellite positioning'},
 fleet:{label:'Fleet additions',singular:'Fleet-dependent system',color:'#91556b',output:'Delivery workflow data'}
};
const mapNote='Component and general region follow Rivian’s EDV diagram. Housing, coordinates and viewing direction are reconstructed.';
const spec=(id,name,short,type,pos,dir,location,role,description,extra={})=>({id,name,short,type,pos,dir,location,role,description,source:'edv',evidence:'EDV component map',note:mapNote,...extra});
export const SENSOR_DATA = [
 spec('C01','Front driver-assistance camera','Front ADAS','camera',[3.074,1.65,0],[1,.05,0],'Windshield · lower center','Forward visual perception','Reads the scene ahead: road markings, objects and visual context for driver assistance.'),
 spec('C02','Front long-range camera','Long-range','camera',[3.065,1.66,.73],[1,.025,0],'Windshield · driver side','Forward visual perception','A separate forward camera identified as long-range in the EDV documentation. No public focal length or range is assumed.'),
 spec('C03','Stereo camera · left','Stereo L','camera',[2.45,2.73,.17],[1,-.12,0],'Front roof cap · left','Paired visual perception','One member of the front stereo pair. Separated viewpoints can provide geometric depth cues.'),
 spec('C04','Stereo camera · right','Stereo R','camera',[2.45,2.73,-.17],[1,-.12,0],'Front roof cap · right','Paired visual perception','The other member of the front stereo pair. The modeled lens spacing is illustrative.'),
 spec('C05','Front surround-view camera','Front view','camera',[3.548,1.045,0],[1,-.32,0],'Front fascia · center','Low-speed visual awareness','A low-mounted image source for viewing the area immediately in front of the van.'),
 spec('C06','Left surround-view camera','Surround L','camera',[-.52,2.724,1.102],[0,-.55,1],'Cargo side · upper left','Side visual awareness','Looks down the vehicle’s left side, providing context beside the tall cargo body.'),
 spec('C07','Right surround-view camera','Surround R','camera',[-.52,2.724,-1.102],[0,-.55,-1],'Cargo side · upper right','Side visual awareness','Looks down the curb side, helping the driver inspect the space beside the van.'),
 spec('C08','Left lane-change camera','Lane L','camera',[2.435,1.64,1.30],[-.7,-.04,.7],'Driver-side mirror','Adjacent-lane visual context','A rearward-looking mirror camera covers the adjacent side of the vehicle.'),
 spec('C09','Right lane-change camera','Lane R','camera',[2.435,1.64,-1.30],[-.7,-.04,-.7],'Curbside mirror','Adjacent-lane visual context','A rearward-looking mirror camera supplies the opposite side view.'),
 spec('C10','Rear camera · left','Rear L','camera',[-3.48,2.735,.16],[-1,-.18,0],'Above rear roll-up door · left','Rearward visual awareness','One of the two rear camera positions in the EDV map. Rear viewing and maneuvering roles are shown at assembly level; the lens-to-mode assignment is not verified.'),
 spec('C11','Rear camera · right','Rear R','camera',[-3.48,2.735,-.16],[-1,-.50,0],'Above rear roll-up door · right','Rearward visual awareness','The second position in the rear camera bracket. This model does not assign a calibrated field of view or a verified display mode to this lens.'),
 spec('C12','Driver-monitoring camera','Driver monitor','camera',[2.69,1.73,.49],[-.75,0,.25],'Inside cabin · representative mount','Driver observation','A cabin-facing camera observes the driver area. Rivian’s EDV bulletin mentions this camera but does not map its mount.',{interior:true,evidence:'EDV type documented · mount unverified',note:'Camera type is documented; the dashboard placement and housing here are illustrative. No supplier or fleet recording policy is inferred.'}),
 spec('R01','Front-center radar','Front radar','radar',[3.48,1.16,.16],[1,0,0],'Behind front fascia · center','Forward distance and motion','Radio sensing provides distance and relative-motion measurements. The front module complements forward vision.'),
 spec('R02','Front-left corner radar','Radar FL','radar',[3.36,.72,.99],[.65,0,.76],'Front fascia · left corner','Front-corner sensing','A concealed radar observes the region around the front-left corner.'),
 spec('R03','Front-right corner radar','Radar FR','radar',[3.36,.72,-.99],[.65,0,-.76],'Front fascia · right corner','Front-corner sensing','A concealed radar observes the region around the front-right corner.'),
 spec('R04','Rear-left corner radar','Radar RL','radar',[-3.36,1.13,1.04],[-.5,0,.87],'Rear quarter · left','Rear-side distance and motion','Radio sensing around the rear quarter provides moving-object information alongside the cameras.'),
 spec('R05','Rear-right corner radar','Radar RR','radar',[-3.36,1.13,-1.04],[-.5,0,-.87],'Rear quarter · right','Rear-side distance and motion','The opposite rear-quarter radar observes the right rear side.'),
 ...[-.78,-.27,.27,.78].map((z,i)=>spec(`U${String(i+1).padStart(2,'0')}`,`Front ultrasonic · ${i+1}`,`Front ${i+1}`,'ultrasonic',[3.49,.57,z],[1,0,z*.25],'Front bumper','Near-field proximity','Acoustic pulses measure short distances to nearby surfaces for low-speed obstacle awareness.')),
 ...[-.78,-.27,.27,.78].map((z,i)=>spec(`U${String(i+5).padStart(2,'0')}`,`Rear ultrasonic · ${i+1}`,`Rear ${i+1}`,'ultrasonic',[-3.535,.49,z],[-1,0,z*.25],'Rear bumper','Near-field proximity','An acoustic proximity sensor covers nearby surfaces behind the van.')),
 ...[1,-1].flatMap((side,j)=>[3.17,1.0,.55,-3.16].map((x,i)=>spec(`U${String(9+j*4+i).padStart(2,'0')}`,`${side===1?'Left':'Right'} ultrasonic · ${i+1}`,`${side===1?'Left':'Right'} ${i+1}`,'ultrasonic',[x,.53,side*1.105],[0,0,side],`${side===1?'Driver':'Curb'} side · lower body`,'Near-field proximity','A side-facing acoustic sensor observes the space close to the long vehicle body.'))),
 spec('S01','GNSS / GPS antenna','GNSS','support',[1.15,2.94,0],[0,1,0],'Roof · representative mount','Vehicle localization','Satellite navigation provides a location reference for route guidance and vehicle systems.',{source:'gps',evidence:'Fleet system documented · mount unverified',note:'Rivian identifies high-precision GPS in its consumer and fleet safety architecture. The rooftop antenna position, shape and count here are illustrative.'}),
 spec('F01','Fleet Edge · camera + GPS','Fleet Edge','fleet',[2.66,2.14,-.28],[1,0,0],'Cabin / windshield · representative assembly','Road-map updates','Amazon describes a street-view camera, GPS receiver and in-vehicle computer that detect changes in the road environment.',{source:'edge',optional:true,interior:true,evidence:'Amazon fleet addition · fitment varies',note:'A system marker, not one verified sensor or a universal EDV installation. Camera, GPS and computer are represented by a single illustrative assembly.'}),
 spec('F02','VAPR · cargo vision','VAPR','fleet',[-.35,2.53,0],[0,-1,0],'Cargo ceiling · representative assembly','Package identification','Vision-Assisted Package Retrieval reads parcel labels and works with projectors to highlight the packages for a delivery stop.',{source:'vapr',optional:true,interior:true,evidence:'Amazon fleet addition · fitment varies',note:'A system marker showing a representative camera/projector housing. Actual camera count and installation layout are not established here; VAPR is not assumed on every van.'})
];
