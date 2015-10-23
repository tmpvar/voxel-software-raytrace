var createRay = require('ray-aabb');
var Suite = require('benchmark').Suite;
var suite = new Suite();
var v3normalize = require('gl-vec3/normalize');
var v3sub = require('gl-vec3/subtract');
var v3mul = require('gl-vec3/multiply');
var v3scale = require('gl-vec3/scale');
var v3add = require('gl-vec3/add');
var v3dist = require('gl-vec3/distance');
var v3distSquared = require('gl-vec3/squaredDistance');
var v3tm4 = require('gl-vec3/transformMat4');
var m4create = require('gl-mat4/create');
var m4perspective = require('gl-mat4/perspective');
var m4invert = require('gl-mat4/invert');
var m4mul = require('gl-mat4/multiply');
var createRay = require('ray-aabb');
var ndarray = require('ndarray');
var fill = require('ndarray-fill');
var findOccupiedCell = require('./find-occupied-cell');



var modelWidth = 8
var modelHalfWidth = modelWidth/2;

var ro = [-10, 4, 4];
v3normalize(ro, ro);
var rd = [1, .1, .1];
var normal = [0, 0, 0];
var tnormal = [0, 0, 0];
var isect = [0, 0, 0];

var ray = createRay(ro, rd);

var modelBounds = [
  [0, 0, 0],
  [modelWidth, modelWidth, modelWidth]
];

var model = ndarray(new Uint8Array(modelWidth*modelWidth*modelWidth), [modelWidth, modelWidth, modelWidth]);
fill(model, function(x, y, z) {
  return 0;
  if (x%2 && y%2 && z%2) {
    return 255;
  }
  return 0;
})

var d = ray.intersects(modelBounds, normal)
v3add(isect, ro, v3scale(isect, rd, d))
var out = [0, 0, 0];

var x = isect[0] - rd[0];
var y = isect[1] - rd[1];
var z = isect[2] - rd[2];

suite.add('find occupied on x axis', function() {
  var cell = findOccupiedCell(modelWidth, modelWidth, modelWidth, isect, rd, model, out);
})

suite.on('cycle', function(event) {
  console.log(String(event.target));
});

suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
});

suite.run();


// for (var i=0; i<100000; i++) {
//   findOccupiedCell(modelBounds, isect, rd, model, out);
// }
