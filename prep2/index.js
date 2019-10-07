const GeoJSONWriter = require('../prep/GeoJSONWriter.js');
const fs = require('fs');
const Oboe = require('oboe')
const writer = new GeoJSONWriter('flow_0_0', 'flow', `${__dirname}/test2.json`);

const path = `${__dirname}/berkeley-test.geojson`;
const stream = fs.createReadStream(path);

const maxes = Array(24).fill(0);
console.log(maxes);
const parser = async () => {
   return new Promise(resolve => {
      Oboe(stream).node('!.features.*', row => {
         const modified = row;
         modified.properties.speeds = modified.properties.speeds.map((x,i) => {
            const value = x[0];

            if (value > maxes[i]) {
               maxes[i] = value;
            }
            return value;
         });
         writer.push(modified);
         return Oboe.drop;
      }).node('!',resolve);
   })
}

(async () => {
   await parser();
   console.log(maxes)
   writer.finish();
})();


