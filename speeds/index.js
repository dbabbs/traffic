const $ = q => document.querySelector(q);
const $$ = q => document.querySelectorAll(q);

//old: (working) mpZkNWzk
const config = {
  token: "ASCBZnCcvEMa-vbk9JXixN8",
  space: "cAeCCgjt" //'0N3BxcpG'
};

const map = new harp.MapView({
  canvas: $("#map"),
  theme: "../theme/style.json"
});
map.minZoomLevel = 8;
const controls = new harp.MapControls(map);

window.onresize = () => map.resize(window.innerWidth, window.innerHeight);

const options = {
  tilt: 50,
  distance: 280000,
  coordinates: new harp.GeoCoordinates(37.743573, -121.868387),
  azimuth: 30
};

map.lookAt(
  options.coordinates,
  options.distance,
  options.tilt,
  options.azimuth
);
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

const max = 20;
const colors = [
  "#d73027",
  "#f46d43",
  "#fdae61",
  "#fee08b",
  "#ffffbf",
  "#d9ef8b",
  "#a6d96a",
  "#66bd63",
  "#1a9850"
].reverse();
const numBuckets = colors.length;
const buckets = Array(colors.length + 1)
  .fill(0)
  .map((x, i) => (max / numBuckets) * i);
const widths = Array(colors.length + 1)
  .fill(0)
  .map((x, i) => i * 0.5 + 1);
const opacities = Array(colors.length + 1)
  .fill(0)
  .map((x, i) => i * 0.1 + 0.1);
map.addDataSource(traffic).then(() => {
  setStyles(0);
});

document.getElementById("slider").onchange = ({ target }) => {
  const value = Number(target.value);
  setStyles(value);
};

function setStyles(hour) {
  console.log(hour);

  // const styles = [{
  //    when: `$geometryType ^= 'line'`,
  //    renderOrder: 1000,
  //    technique: "solid-line",
  //    attr: {
  //       color: `hsl($properties.speeds[${hour}], 300, 100%)`, //properties.speeds[${hour}]
  //       transparent: true,
  //       opacity: 1,
  //       metricUnit: "Pixel",
  //       lineWidth: {
  //          interpolation: "Linear",
  //          zoomLevels: [10, 14, 15, 18],
  //          values: [1, 2, 5, 8]
  //       }
  //    }
  // }]

   const styles = [
      // {
      //    when: ["==", ["geometry-type"], "LineString"],
      //    technique: "solid-line",
      //    attr: {
      //       color: [
      //          "concat",
      //          "hsl(",
      //          ["floor", ["at", hour, ["get", "speeds"]]],
      //          ", 100%, 43%)"
      //       ],
      //       lineWidth: 20,
      //       metricUnit: "Pixel"
      //    }
      // }
   ];
   traffic.setStyleSet(styles);
   map.update();
}

/*
// const styles = buckets.slice(0, buckets.length - 1).map((bucket, index) => {
   //    const filter = index !== buckets.length - 2 ?
   //       `properties.speeds[${hour}] >= ${bucket} && properties.speeds[${hour}] < ${buckets[index + 1]}` : 
   //       `properties.speeds[${hour}] >= ${bucket}`// && properties.sum < ${buckets[index + 1] + 1}`;
   //    return {
   //       "when": `$geometryType ^= 'line' && ${filter}`,
   //       "renderOrder": 1000 + widths[index],
   //       "technique": "solid-line",
   //       "attr": {
   //          "color": `${colors[index]}`,
   //          "transparent": true,
   //          "opacity": 1,
   //          "metricUnit": "Pixel",
   //          "lineWidth": {
   //             "interpolation": "Linear",
   //             "zoomLevels": [10, 14, 15, 18],
   //             "values": [1, 2, 5, 8]
   //           }
   //          // "lineWidth": widths[index]
   //       }
   //    }
   // });*/

let animating = false;
let animationSelected = false;
$$(".selector-option").forEach(q => (q.onclick = manageTabs));

function manageTabs(evt) {
  if (evt.target.classList.contains("right-selector")) {
    $(".left-selector").classList.remove("left-selector-active");
    $(".right-selector").classList.add("right-selector-active");
    animating = true;
    animationSelected = true;
  } else {
    $(".left-selector").classList.add("left-selector-active");
    $(".right-selector").classList.remove("right-selector-active");
    animating = false;
    animationSelected = false;
    map.lookAt(
      options.coordinates,
      options.distance,
      options.tilt,
      options.azimuth
    );
  }
}

map.addEventListener(
  harp.MapViewEventNames.Render,
  () =>
    animating &&
    map.lookAt(
      options.coordinates,
      options.distance,
      options.tilt,
      (options.azimuth += 0.04)
    )
);
map.beginAnimation();

$(".legend-colors").style.gridTemplateColumns = `repeat(${colors.length}, 1fr)`;
$(
  ".legend-caption"
).style.gridTemplateColumns = `repeat(${colors.length}, 1fr)`;
colors.forEach(color => {
  const div = document.createElement("div");
  div.style.background = color;
  div.classList.add("legend-item");
  $(".legend-colors").appendChild(div);
});

$("#year").innerText = new Date().getFullYear();

map.canvas.onmousedown = e => {
  animating = false;
};

buckets.slice(0, buckets.length - 1).forEach(bucket => {
  const div = document.createElement("div");
  div.classList.add("desc");
  div.innerText = bucket.toFixed(1) + "+";
  $(".legend-caption").appendChild(div);
});

map.canvas.onmouseup = () => {
  options.coordinates = harp.MapViewUtils.rayCastGeoCoordinates(map, 0, 0);
  const { yaw, pitch } = harp.MapViewUtils.extractYawPitchRoll(
    map.camera.quaternion,
    map.projection.type
  );
  options.azimuth = (-yaw * 180) / Math.PI;
  options.tilt = (pitch * 180) / Math.PI;
  if (animationSelected) {
    animating = true;
  }
};

const geocodes = {};
let prevId = "";
map.canvas.onmousemove = async e => {
  const intersections = map.intersectMapObjects(e.clientX, e.clientY);

  if (intersections === undefined) {
    $("#tooltip").style.display = "none";
    return;
  }
  const i = intersections.find(
    x => x.hasOwnProperty("userData") && x.userData.$layer === config.space
  );

  if (i === undefined) {
    $("#tooltip").style.display = "none";
    return;
  }

  $("#tooltip").style.display = "block";
  $("#tooltip").style.left = e.clientX + 5 + "px";
  $("#tooltip").style.top = e.clientY + 5 + "px";

  const currId = i.userData.$id;
  if (currId !== prevId) {
    const label = geocodes[currId];
    if (label === undefined) {
      const coordinates = [
        i.userData["properties.centroid.1"],
        i.userData["properties.centroid.0"]
      ];
      $("#tooltip .city").innerHTML = await geocode(coordinates, currId);
    } else {
      $("#tooltip .city").innerHTML = label;
    }
    $("#tooltip .count").innerHTML =
      numberWithCommas(i.userData["properties.sum"]) +
      '<span class="desc"> trip departures</span>';
  }
  prevId = currId;
};

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function geocode([latitude, longitude], id) {
  const here = {
    id: "Wf3z49YJK9ieJhsun9Wx",
    code: "8T7Stg2Jq1qvkfBn3Za4qw"
  };
  const url = `https://reverse.geocoder.api.here.com/6.2/reversegeocode.json?prox=${latitude},${longitude}&mode=retrieveAreas&app_id=${here.id}&app_code=${here.code}`;

  const response = await fetch(url).then(res => res.json());
  if (response.Response.View[0].Result.length > 0) {
    const address = response.Response.View[0].Result[0].Location.Address;
    if (address.City === undefined) {
      return "";
    }
    geocodes[id] = address.City + ", " + address.State;
    return address.City + ", " + address.State;
  } else {
    return "";
  }
}

map.addEventListener(harp.MapViewEventNames.FrameComplete, () => {
  console.log("after render");
});

setTimeout(() => {
  document.querySelector(".sidebar").classList.add("sidebar-end");

  setTimeout(() => {
    document.querySelector(".sidebar-content").style.opacity = 1;
  }, 1000);
}, 3000);

setInterval(() => {
  console.log("zoom: " + map.zoomLevel);
}, 1000);
