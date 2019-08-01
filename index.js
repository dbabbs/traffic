const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

const config = {
   token: 'ASCBZnCcvEMa-vbk9JXixN8',
   space: 'mpZkNWzk'
}

const map = new harp.MapView({
   canvas: $("#map"),
   theme: "theme/style.json",
});
const controls = new harp.MapControls(map);

window.onresize = () => map.resize(window.innerWidth, window.innerHeight);

const options = { 
   tilt: 45, 
   distance: 280000, 
   coordinates: new harp.GeoCoordinates(37.743573, -121.868387),
   azimuth: 0
}

map.lookAt(options.coordinates, options.distance, options.tilt, options.azimuth);
controls.maxPitchAngle = 60;

const omvDataSource = new harp.OmvDataSource({
   baseUrl: "https://xyz.api.here.com/tiles/herebase.02",
   apiFormat: harp.APIFormat.XYZOMV,
   styleSetName: "tilezen",
   authenticationCode: config.token,
});
map.addDataSource(omvDataSource);

const traffic = new harp.OmvDataSource({
   baseUrl: "https://xyz.api.here.com/hub/spaces/" + config.space + "/tile/web",
   apiFormat: harp.APIFormat.XYZSpace,
   authenticationCode: config.token,
});

const colors = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84'];
const buckets = [0, 25000, 50000, 75000, 100000, 125000, 150000, 175000];
const heights = [100, 3000, 6000, 9000, 12000, 15000, 19000];
const bucketsSliced = buckets.slice(0, buckets.length - 1);

map.addDataSource(traffic).then(() => {

   const styles = bucketsSliced.map((bucket, index) => {
      const filter = index !== bucketsSliced.length - 1  ?
         `properties.count >= ${bucket} && properties.count < ${buckets[index + 1]}` :
         `properties.count >= ${bucket} && properties.count < 300000`;

      return {
         "description": "Buildings geometry",
         "when": `$geometryType == 'polygon' && ${filter}`,
         "technique": "extruded-polygon",
         "attr": {
            "defaultHeight": `${heights[index]}`,
            "lineColor": '#CECECE',
            "lineWidth": "1",
            "defaultColor": `${colors[index]}`,
            "color": `${colors[index]}`,
            "roughness": `0.6`,
            "metalness": `0.15`,
            "side": 3,
         },
         "renderOrder": 200
      }
   });
   styles.push({
      "description": "Buildings geometry",
      "when": `$geometryType == 'polygon' && properties.count >= 300000`,
      "technique": "extruded-polygon",
      "attr": {
         "defaultHeight": "80000",
         "lineColor": '#CECECE',
         "lineWidth": "1",
         "defaultColor": `${colors[colors.length -1]}`,
         "color": `${colors[colors.length -1]}`,
         "roughness": `0.6`,
         "metalness": `0.15`,
         "side": 3,
      },
      "renderOrder": 200
   })
   traffic.setStyleSet(styles);
   map.update();
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
      map.lookAt(options.coordinates, options.distance, options.tilt, options.azimuth)
   }
}

map.addEventListener(
   harp.MapViewEventNames.Render, 
   () => animating && map.lookAt(options.coordinates, options.distance, options.tilt, (options.azimuth += 0.04))
);
map.beginAnimation();

$('.legend-colors').style.gridTemplateColumns = `repeat(${colors.length}, 1fr)`;
$('.legend-caption').style.gridTemplateColumns = `repeat(${colors.length}, 1fr)`;
colors.forEach(color => {
   const div = document.createElement('div');
   div.style.background = color;
   div.classList.add('legend-item');
   $('.legend-colors').appendChild(div);
});

$('#year').innerText = new Date().getFullYear();

map.canvas.onmousedown = () => {
   console.log('mouse down')

   
   //Nino, What I'm trying to do here:
   //When the map is rotating and the user drags it around, I would like the map to move
   //See comment below for continuation...
   animating = false;
}

map.canvas.onmouseup = () => {
   console.log('focus up')

   //However when the user stops dragging the map, I would like the rotation animation
   //to continue where they left off. So that's why I'm resetting the coordinates.
   //However, since map.lookAt() calculates a different pitch/angle view coordinates,
   //i am unable to access the correct view center
   //Do you know of a way to get the current map's map.lookAt() configuration information?
   // options.coordinates = map.geoCenter;
   animating = true;
}