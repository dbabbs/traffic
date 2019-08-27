const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

//old: (working) mpZkNWzk
const config = {
   token: 'ASCBZnCcvEMa-vbk9JXixN8',
   space: 'pd6lpVsy', //'0N3BxcpG'
}

fetch('https://xyz.api.here.com/hub/spaces/pd6lpVsy/search?clientId=cli&access_token=AFCeWUYTFLKwbATv8IkVKKM')
.then(res => res.json())
.then(data => {
   console.log(data)
})


const map = new harp.MapView({
   canvas: $("#map"),
   theme: "theme/style.json",
});
map.minZoomLevel = 8;
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

const max = 40062;
// const colors = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84'];
// const colors = ['#feebe2','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177']
const colors = ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177','#49006a']
const numBuckets = colors.length;

const buckets = Array(colors.length + 1).fill(0).map((x,i) =>  (max / numBuckets) * i);
console.log(buckets);
// const heights = [100, 4000, 8000, 12000, 16000, 20000, 24000];
const heights = Array(colors.length + 1).fill(0).map((x,i) => i * 4000);
console.log(heights);
map.addDataSource(traffic).then(() => {

   const styles = buckets.slice(0, buckets.length - 1).map((bucket, index) => {
      const filter = index !== buckets.length - 2 ?
         `properties.sum >= ${bucket} && properties.sum < ${buckets[index + 1]}` : 
         `properties.sum >= ${bucket}`// && properties.sum < ${buckets[index + 1] + 1}`;
      return {
         "description": "Buildings geometry",
         "when": `$geometryType == 'polygon' && ${filter}`,
         "technique": "extruded-polygon",
         "attr": {
            "userData": `${index}`,
            "defaultHeight": `${heights[index]}`,
            "constantHeight": true, //This is needed to avoid the "steps" between tile borders
            "lineColor": '#CECECE',
            "lineWidth": index === 0 ? "0.1" : "0",
            "defaultColor": `${colors[index]}`,
            "color": `${colors[index]}`,
            "roughness": `0.6`,
            "metalness": `0.15`,
            "side": 2
         },
         "renderOrder": 200
      }
   });
   // console.log(styles);
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
}

buckets.slice(0, buckets.length -1).forEach(bucket => {
   const div = document.createElement('div');
   div.classList.add('desc');
   div.innerText = (bucket / 1000).toFixed(0) + 'K+';
   $('.legend-caption').appendChild(div);
})

map.canvas.onmouseup = () => {
   if (animationSelected) {
      options.coordinates = harp.MapViewUtils.rayCastGeoCoordinates(map, 0, 0);   
      const { yaw, pitch } = harp.MapViewUtils.extractYawPitchRoll(map.camera.quaternion, map.projection.type);
      options.azimuth = -yaw * 180 / Math.PI;
      options.tilt = pitch * 180 / Math.PI;
      animating = true;
   }
}

map.canvas.onmousemove = e => {
   const intersections = map.intersectMapObjects(e.clientX, e.clientY);

   if (intersections === undefined) {
      $('#tooltip').style.display = 'none';
      return;
   }
   const i = intersections.find(x => {
      return x.hasOwnProperty('userData') && x.userData.$layer === config.space
   });

   if (i === undefined) {
      $('#tooltip').style.display = 'none';
      return;
   }

   $('#tooltip').style.display = 'block';
   $('#tooltip').style.left = e.clientX + 'px';
   $('#tooltip').style.top = e.clientY + 'px';
   $('#tooltip').innerHTML = numberWithCommas(i.userData['properties.sum']) + '<span class="desc"> trip departures from this location</span>';
}

function numberWithCommas(x) {
   return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}