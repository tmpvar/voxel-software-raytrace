// TODO: consider replacing with something like: http://www.cse.chalmers.se/edu/year/2010/course/TDA361/grid.pdf
module.exports = findOccupiedCell;

function sign(a) {
  return typeof a === 'number' ? a ? a < 0 ? -1 : 1 : a === a ? 0 : 0 : 0
}

function diff(s, ds) {
  s = typeof s === 'number' ? s : 0;
  var is = s|0;

  s -= (s < 0) ? -1 + is : is
  return ds > 0 ? (1-s) / ds : s/-ds;
}

function findOccupiedCell(ubx, uby, ubz, isect, rd, pixels, out) {
  var rdx = +(rd[0]);
  var rdy = +(rd[1]);
  var rdz = +(rd[2]);

  var sx = sign(rdx);
  var sy = sign(rdy);
  var sz = sign(rdz);

  var x = +(isect[0]) - +(rd[0]);
  var y = +(isect[1]) - +(rd[1]);
  var z = +(isect[2]) - +(rd[2]);

  var mx = diff(x, rdx);
  var my = diff(y, rdy);
  var mz = diff(z, rdz);

  var dx = +(sx/rdx);
  var dy = +(sy/rdy);
  var dz = +(sz/rdz);

  // TODO: handle NaN

  while (
    x >= -1 && y >= -1 && z >= -1 &&
    x <= ubx && y <= uby && z <= ubz
  ) {

    var ix = x|0;
    var iy = y|0;
    var iz = z|0;

    if (pixels.get(ix, iy, iz)) {
      out[0] = ix;
      out[1] = iy;
      out[2] = iz;
      return out;
    }

    if(mx < my) {
      if(mx < mz) {
        x += sx;
        mx += dx;
      } else {
        z += sz;
        mz += dz;
      }
    } else {
      if(my < mz) {
        y += sy;
        my += dy;
      } else {
        z += sz;
        mz += dz;
      }
    }
  }
  return false;
}
