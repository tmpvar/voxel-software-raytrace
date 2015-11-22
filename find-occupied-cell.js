// TODO: consider replacing with something like: http://www.cse.chalmers.se/edu/year/2010/course/TDA361/grid.pdf
module.exports = findOccupiedCell;

function sign(a) {
  return typeof a === 'number' ? a ? a < 0 ? -1 : 1 : a === a ? 0 : 0 : 0
}

function diff(s, ds) {
  var is = s|0;

  s -= (s < 0) ? -1 + is : is
  return ds > 0 ? (1-s) / ds : s / -ds;
}

function findOccupiedCell(ubx, uby, ubz, isect, rd, pixels, density, out) {
  var rdx = +(rd[0]);
  var rdy = +(rd[1]);
  var rdz = +(rd[2]);

  var sx = sign(rdx);
  var sy = sign(rdy);
  var sz = sign(rdz);

  var x = +(isect[0]);
  var y = +(isect[1]);
  var z = +(isect[2]);

  var mx = diff(x, rdx);
  var my = diff(y, rdy);
  var mz = diff(z, rdz);

  var dx = +(sx/rdx);
  var dy = +(sy/rdy);
  var dz = +(sz/rdz);

  // TODO: handle NaN

  while (
    x >= -rdx && y >= -rdy && z >= -rdz &&
    x <= ubx && y <= uby && z <= ubz
  ) {

    var ix = x|0;
    var iy = y|0;
    var iz = z|0;

    if (pixels.get(ix, iy, iz) > density) {
      return out;
    }

    if(mx < my) {
      if(mx < mz) {
        out[0] = -sx;
        out[1] = out[2] = 0;

        x += sx;
        mx += dx;
      } else {
        out[2] = -sz;
        out[0] = out[1] = 0;

        z += sz;
        mz += dz;
      }
    } else {
      if(my < mz) {
        out[1] = -sy;
        out[0] = out[2] = 0;

        y += sy;
        my += dy;
      } else {
        out[2] = -sz;
        out[0] = out[1] = 0;

        z += sz;
        mz += dz;
      }
    }
  }
  return false;
}
