var fc = require('fc');
var v3normalize = require('gl-vec3/normalize');
var v3sub = require('gl-vec3/subtract');
var v3mul = require('gl-vec3/multiply');
var v3scale = require('gl-vec3/scale');
var v3add = require('gl-vec3/add');
var v3dist = require('gl-vec3/distance');
var v3length = require('gl-vec3/length');
var v3distSquared = require('gl-vec3/squaredDistance');
var v3tm4 = require('gl-vec3/transformMat4');
var v3length = require('gl-vec3/length');
var m4create = require('gl-mat4/create');
var m4perspective = require('gl-mat4/perspective');
var m4invert = require('gl-mat4/invert');
var m4mul = require('gl-mat4/multiply');
var createRay = require('ray-aabb');
var ndarray = require('ndarray');
var fill = require('ndarray-fill');
var unproject = require('camera-unproject');
var findOccupiedCell = require('./find-occupied-cell');

var createOrbitCamera = require("orbit-camera")

var modelWidth = 128
var modelHalfWidth = modelWidth/2;
var camera = createOrbitCamera([modelHalfWidth, modelHalfWidth, 600],
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
  normal[0] = x - modelHalfWidth
  normal[1] = y - modelHalfWidth
  normal[2] = z - modelHalfWidth
  var d = v3length(normal);
  // if (d<modelHalfWidth) {
  //if (z === modelHalfWidth || y === modelHalfWidth || x === modelHalfWidth) {
   if (x>900*Math.sin(y/z) && y && z) {
    return 255 - Math.min(Math.round((d - modelWidth)/modelWidth * 255), 255);
  // }

  //   return 127;
  // }maybe 
    return 127
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

var paused = true;
window.addEventListener('keydown', function(ev) {
  if (ev.keyCode === 32) {
    paused = !paused;
    if (paused) {
      ctx.stop();
    } else {
      ctx.start();
    }
  }
})

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
    var w = window.innerWidth;
    var h = window.innerHeight;
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
  camera.zoom(ev.wheelDeltaY * -.1);
  paused && ctx.dirty();
  ev.preventDefault();
});

var viewport = [0, 0, 0, 0];
var near = [0, 0, 0];
var voxel = [0, 0, 0];

// screen traversal storage
var planeXPosition = [0, 0, 0];
var planeYPosition = [0, 0, 0];
var dcol = [0, 0, 0];
var drow = [0, 0, 0];
var rda = [0,0,0];
var rdb = [0,0,0];

// timing
var deficit = 0;
var frames = 0;
setInterval(function() {
  if (!paused) {
    console.clear();
    console.log('average frame deficit: ', deficit.toFixed(2) + 'ms - fps:', frames)
    deficit = 0;
    frames = 0;
  }
}, 1000)

var density = 0;
var densityDir = 1;

var ctx = fc(function render(dt) {
  frames++;
  deficit = (deficit + (dt - 16.7))/2

  ctx.clear();
  ctx.canvas.width = 400;
  ctx.canvas.height = 400;
  var w = viewport[2] = ctx.canvas.width;
  var h = viewport[3] = ctx.canvas.height;
  var imageData = ctx.createImageData(w, h);
  var buffer = imageData.data;

  //!paused && camera.rotate([0, 0], [.01, .01])

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

  unproject(rda, [0,0,0], viewport, m4inverted) // x=0, y=0
  unproject(rdb, [1,0,0], viewport, m4inverted) // x=1, y=0
  unproject(planeYPosition, [0,1,0], viewport, m4inverted) // x=0, y=1

  v3sub(dcol, planeYPosition, rda);
  v3sub(drow, rdb, rda);

  if (!paused) {
    density+=densityDir;
    if (density > 254) {
      densityDir = -1;
    } else if (density === 0) {
      densityDir = 1;
    }
  }

  for (var y=0; y<h; y++) {
    planeYPosition[0] += dcol[0];
    planeYPosition[1] += dcol[1];
    planeYPosition[2] += dcol[2];

    planeXPosition[0] = planeYPosition[0]
    planeXPosition[1] = planeYPosition[1]
    planeXPosition[2] = planeYPosition[2]

    for (var x=0; x<w; x++) {
      planeXPosition[0] += drow[0];
      planeXPosition[1] += drow[1];
      planeXPosition[2] += drow[2];

      v3normalize(
        rayDirection,
        v3sub(rayDirection, planeXPosition, rayOrigin)
      );

      // test outer bounding box
      ray.update(rayOrigin, rayDirection);
      var c = x*4 + y*w*4;

      var d = ray.intersects(modelBounds, normal)
      var found = false;
      if (d) {
        v3add(isect, rayOrigin, v3scale(isect, rayDirection, d))

        cell = findOccupiedCell(
          modelWidth+1,
          modelWidth+1,
          modelWidth+1,
          isect,
          rayDirection,
          model,
          density,
          voxel
        )

        if (cell) {
          found = true;
          buffer[c+0] = cell[0] / modelWidth * 255;
          buffer[c+1] = cell[1] / modelWidth * 255;
          buffer[c+2] = cell[2] / modelWidth * 255;
          buffer[c+3] = 255;
        }
      }

      if (!found) {
        buffer[c+0] = 0x11;
        buffer[c+1] = 0x11;
        buffer[c+2] = 0x22;
        buffer[c+3] = 0xff;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}, !paused)
