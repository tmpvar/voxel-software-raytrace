// TODO: consider replacing with something like: http://www.cse.chalmers.se/edu/year/2010/course/TDA361/grid.pdf
module.exports = findOccupiedCell;

function sign(a) {
  return a > 0 ? 1.0 : -1.0;//typeof a === 'number' ? a ? a < 0 ? -1 : 1 : a === a ? 0 : 0 : 0
}

function diff(s, ds) {
  var is = s|0;

  s -= (s < 0) ? -1 + is : is
  return ds > 0 ? (1-s) / ds : s / -ds;
}

function clamp(v, l, u) {
  return Math.min(u, Math.max(l, v));
}

function mod(value, modulus) {
  return (value % modulus + modulus) % modulus;
}

function intbound(s, ds) {
  // Find the smallest positive t such that s+t*ds is an integer.
  if (ds < 0) {
    return intbound(-s, -ds);
  } else {
    s = mod(s, 1);
    // problem is now s+t*ds = 1
    return (1-s)/ds;
  }
}

function findOccupiedCell(ubx, uby, ubz, isect, rd, pixels, density, out) {
  var rdx = +(rd[0]);
  var rdy = +(rd[1]);
  var rdz = +(rd[2]);

  var sx = sign(rdx);
  var sy = sign(rdy);
  var sz = sign(rdz);

  var x = isect[0] + rd[0];//clamp(isect[0], 0, ubx-1));
  var y = isect[1] + rd[1];//clamp(isect[1], 0, uby-1));
  var z = isect[2] + rd[2];//clamp(isect[2], 0, ubz-1));

  // var ax = isect[0]


  var mx = intbound(x, rdx);
  var my = intbound(y, rdy);
  var mz = intbound(z, rdz);

  var dx = +(sx/rdx);
  var dy = +(sy/rdy);
  var dz = +(sz/rdz);

  // TODO: handle NaN

  while (
    x >= 0 && y >= 0 && z >= 0 &&
    x < ubx-1 && y < uby-1 && z < ubz-1
  ) {

    var ix = Math.floor(x);
    var iy = Math.floor(y);
    var iz = Math.floor(z);

    if (pixels.get(ix, iy, iz) > density) {
      out[0] = ix;
      out[1] = iy;
      out[2] = iz;
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
