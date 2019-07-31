const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

const token = 'ASCBZnCcvEMa-vbk9JXixN8'
const map = new harp.MapView({
   canvas: document.getElementById("map"),
   theme: "theme/style.json",
});
const controls = new harp.MapControls(map);

window.onresize = () => map.resize(window.innerWidth, window.innerHeight);

const sf = new harp.GeoCoordinates(37.743573, -121.868387)
map.setCameraGeolocationAndZoom(sf, 9);
controls.maxPitchAngle = 60;
const omvDataSource = new harp.OmvDataSource({
   baseUrl: "https://xyz.api.here.com/tiles/herebase.02",
   apiFormat: harp.APIFormat.XYZOMV,
   styleSetName: "tilezen",
   authenticationCode: token,
});
map.addDataSource(omvDataSource);

const space = `mpZkNWzk`
const traffic = new harp.OmvDataSource({
   baseUrl: "https://xyz.api.here.com/hub/spaces/" + space + "/tile/web",
   apiFormat: harp.APIFormat.XYZSpace,
   authenticationCode: token, //Use this token!
});


// const colors = ['#feebe2','#fcc5c0','#fa9fb5','#f768a1','#c51b8a','#7a0177'];
const colors = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#2c7fb8','#253494']

map.addDataSource(traffic).then((evt) => {

   const buckets = [
      0,
      25000,
      50000,
      75000,
      100000,
      125000,
      150000,
      175000
   ]

   const heights = [
      100,
      4000,
      7000,
      10000,
      1300,
      16000
   ]
   const styles = buckets.slice(0, buckets.length - 1).map((bucket, index) => {
      const filter = `properties.count >= ${bucket} && properties.count < ${buckets[index + 1]}`;
      return {
         "description": "Buildings geometry",
         "when": `$geometryType == 'polygon' && ${filter}`,
         "technique": "extruded-polygon",
         "attr": {
            "defaultHeight": `${heights[index]}`,
            "lineColor": '#CECECE',
            'lineWidth': `1`,
            "defaultColor": `${colors[index]}`,
            "color": `${colors[index]}`,
            // "vertexColor": `${colors[index]}`,
            "roughness": `0.6`,
            "metalness": `0.15`,
            // "vertexColors": true,
            // "footprint": true,
            "side": 3,

         },
         "renderOrder": 200
      }
   });
   
   traffic.setStyleSet(styles);
   map.update();
   console.log('done')
});

let animating = false;


$$('.selector-option').forEach(q => q.onclick = manageTabs);

function manageTabs(evt) {
   if (evt.target.classList.contains('right-selector')) {
      $('.left-selector').classList.remove('left-selector-active');
      $('.right-selector').classList.add('right-selector-active');
      animating = true;
   } else {
      $('.left-selector').classList.add('left-selector-active');
      $('.right-selector').classList.remove('right-selector-active');
      animating = false;

      map.lookAt(options.coordinates, options.distance, 0, 0)
   }
}


const options = { 
   tilt: 45, 
   distance: 280000, 
   coordinates: sf,
   azimuth: 0
}

map.addEventListener(
   harp.MapViewEventNames.Render, 
   () => animating && map.lookAt(options.coordinates, options.distance, options.tilt, (options.azimuth += 0.07))
);
map.beginAnimation();


const legendColors = $('.legend-colors');
legendColors.style.gridTemplateColumns = `repeat(${colors.length}, 1fr)`;

colors.forEach(color => {
   const div = document.createElement('div');
   div.style.background = color;
   div.classList.add('legend-item');
   legendColors.appendChild(div);
});