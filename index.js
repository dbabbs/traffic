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
   tilt: 40, 
   distance: 280000, 
   coordinates: new harp.GeoCoordinates(37.743573, -121.868387),
   azimuth: 0
}

map.lookAt(options.coordinates, options.distance, options.tilt, options.azimuth);
controls.maxPitchAngle = 60;

const omvDataSource = new harp.OmvDataSource({
   name: "basemap",
   baseUrl: "https://xyz.api.here.com/tiles/herebase.02",
   apiFormat: harp.APIFormat.XYZOMV,
   styleSetName: "tilezen",
   authenticationCode: config.token,
   gatherFeatureIds: true
});
map.addDataSource(omvDataSource);

const traffic = new harp.OmvDataSource({
   name: "traffic",
   baseUrl: "https://xyz.api.here.com/hub/spaces/" + config.space + "/tile/web",
   apiFormat: harp.APIFormat.XYZSpace,
   authenticationCode: config.token,
   gatherFeatureIds: true
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
            "userData": `${index}`,
            "defaultHeight": `${heights[index]}`,
            "constantHeight": true, //This is needed to avoid the "steps" between tile borders
            "lineColor": '#CECECE',
            "lineWidth": "1",
            "defaultColor": `${colors[index]}`,
            "color": `${colors[index]}`,
            "roughness": `0.6`,
            "metalness": `0.15`,
            "side": 2, // 2 is double sided and fixes your issue.
            //Still not clear to me why the faces have wrong orientation.
            //Interestinly not all of them have wrong orientation. The roof has correct orientation.

            // To get rid of the z-fighting with the background close to the horizon I disabled the
            // depth test for the flat hexagons. Unfortunately this only works within one tile.
            // You can see the flat hexagon from the neighboring tile through the hexagons of another tile.
            //"depthTest": index === 0 ? false : true

            // Right now I see no way to fix it unless we have a new release that contains this fix:
            // https://github.com/heremaps/harp.gl/pull/658
         },
         "renderOrder": 200
      }
   });
   styles.push({
      "description": "Buildings geometry",
      "when": `$geometryType == 'polygon' && properties.count >= 300000`,
      "technique": "extruded-polygon",
      "attr": {
         "userData": `${colors.length -1}`,
         "defaultHeight": "80000",
         "lineColor": '#CECECE',
         "lineWidth": "1",
         "defaultColor": `${colors[colors.length -1]}`,
         "color": `${colors[colors.length -1]}`,
         "roughness": `0.6`,
         "metalness": `0.15`,
         "side": 2, // same as above
      },
      "renderOrder": 200
   })
   traffic.setStyleSet(styles);
   map.update();
});

let animating = false;
let animationSelected = false;
$$('.selector-option').forEach(q => q.onclick = manageTabs);

function manageTabs(evt) {
   if (evt.target.classList.contains('right-selector')) {
      $('.left-selector').classList.remove('left-selector-active');
      $('.right-selector').classList.add('right-selector-active');
      animating = true;
      animationSelected = true;
   } else {
      $('.left-selector').classList.add('left-selector-active');
      $('.right-selector').classList.remove('right-selector-active');
      animating = false;
      animationSelected = false;
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

map.canvas.onmousedown = e => { 

   animating = false;
   

   const intersections = map.intersectMapObjects(e.clientX, e.clientY);
   intersections.forEach( i => {
      // The user data should give you the id of the feature that was clicked,
      // but it seems your data-source is not providing these ids.
      // Once you have the ids you could go through your data and find the belonging
      // object.
      console.log(i.intersection.object.userData);

      // If you just want to distinguish what kind of event was clicked, you can add some
      // dummy attribute to the technique(I called it userData, but you can call it whatever
      // you want but it should not overlap with any already defined property of the THREE.js
      // standard material).
      console.log(i.intersection.object.material.userData);
   });
}

map.canvas.onmouseup = () => {
   if (animationSelected) {
      options.coordinates = harp.MapViewUtils.rayCastGeoCoordinates(map, 0, 0);   
      const {yaw, pitch} = harp.MapViewUtils.extractYawPitchRoll(map.camera.quaternion);
      options.azimuth = -yaw * 180 / Math.PI;
      options.tilt = pitch * 180 / Math.PI;
      animating = true;
   }
}