var fc = require('fc');
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
var createRay = require('../ray-aabb');
var ndarray = require('ndarray');
var fill = require('ndarray-fill');
var unproject = require('camera-unproject');
var findOccupiedCell = require('./find-occupied-cell');

var createOrbitCamera = require("orbit-camera")

var modelWidth = 8
var modelHalfWidth = modelWidth/2;
var camera = createOrbitCamera([5, 5, -100],
                               [modelHalfWidth, modelHalfWidth, modelHalfWidth],
                               [0, 1, 0])
var projection = m4create();
var view = m4create();
var m4mvp = m4create();
var m4inverted = m4create();
var m4scratch = m4create();
var box = [[0, 0], [0, 0]];
var mouse = [0, 0];
var mouseDown = false;

var rayOrigin = [0, 0, 0];
var rayDirection = [0, 0, 0];
var normal = [0, 0, 0];
var tnormal = [0, 0, 0];
var isect = [0, 0, 0];

var ray = createRay(rayOrigin, rayDirection);

var modelBounds = [
  [0, 0, 0],
  [modelWidth, modelWidth, modelWidth]
];

var model = ndarray(new Uint8Array(modelWidth*modelWidth*modelWidth), [modelWidth, modelWidth, modelWidth]);
fill(model, function(x, y, z) {
  if (x%2 && y%2 && z%2) {
    return 255;
  }
  return 0;
})

function getEye(out, view) {
  m4invert(m4scratch, view);
  out[0] = m4scratch[12];
  out[1] = m4scratch[13];
  out[2] = m4scratch[14]
  return out;
}

window.addEventListener('mousedown', function() {
  mouseDown = true;
});

window.addEventListener('mouseup', function() {
  mouseDown = false;
});

window.addEventListener('mousemove', function(ev) {
  var x = ev.clientX;
  var y = ev.clientY;

  if (mouseDown) {
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    camera.rotate(
      [x/w-0.5, y/h-0.5],
      [mouse[0]/w-0.5, mouse[1]/h-0.5]
    );
    ctx.dirty();
  }
  mouse[0] = x;
  mouse[1] = y;
});

window.addEventListener('mousewheel', function(ev) {
  camera.zoom(ev.wheelDeltaY * -.001);
  ctx.dirty();
  ev.preventDefault();
});

var viewport = [0, 0, 0, 0];
var near = [0, 0, 0];

var ctx = fc(function render() {
  ctx.clear();
  ctx.canvas.width = 400;
  ctx.canvas.height = 400;
  var w = viewport[2] = ctx.canvas.width;
  var h = viewport[3] = ctx.canvas.height;
  var imageData = ctx.createImageData(w, h);
  var buffer = imageData.data;

  var aspect = w/h
  m4perspective(
    projection,
    Math.PI/4.0,
    aspect,
    0.1,
    1000.0
  )

  camera.view(view)

  m4invert(
    m4inverted,
    m4mul(m4mvp, projection, view)
  );

  getEye(rayOrigin, view);

  for (var y=0; y<h; y++) {
    near[1] = y;

    for (var x = 0; x<w; x++) {
      near[0] = x;

      unproject(rayDirection, near, viewport, m4inverted)

      v3normalize(
        rayDirection,
        v3sub(rayDirection, rayDirection, rayOrigin)
      );

      // test outer bounding box
      ray.update(rayOrigin, rayDirection);
      var c = x*4 + y*w*4;

      buffer[c+0] = 0x11;
      buffer[c+1] = 0x11;
      buffer[c+2] = 0x22;
      buffer[c+3] = 0xff;

      var d = ray.intersects(modelBounds, normal)

      if (d) {
        v3add(isect, rayOrigin, v3scale(isect, rayDirection, d))

        cell = findOccupiedCell(modelBounds, isect, rayDirection, model)

        if (cell) {
          var d = ray.intersects([
            [cell[0], cell[1], cell[2]],
            [cell[0]+1, cell[1]+1, cell[2]+1],
          ], normal)
          v3normalize(tnormal, normal)
          buffer[c+0] = 127 + tnormal[0]*255;
          buffer[c+1] = 127 + tnormal[1]*255;
          buffer[c+2] = 127 + tnormal[2]*255;
          buffer[c+3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
})
