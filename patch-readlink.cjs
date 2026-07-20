const fs = require('fs');

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function patchedReadlinkSync(...args) {
  try {
    return origReadlinkSync.apply(this, args);
  } catch (e) {
    if (e.code === 'EISDIR') {
      return args[0];
    }
    throw e;
  }
};

const origReadlink = fs.readlink;
fs.readlink = function patchedReadlink(path, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  origReadlink.call(fs, path, options, function(err, link) {
    if (err && err.code === 'EISDIR') {
      callback(null, path);
    } else {
      callback(err, link);
    }
  });
};

const origReadlinkPromise = fs.promises ? fs.promises.readlink : null;
if (origReadlinkPromise) {
  fs.promises.readlink = async function patchedReadlinkPromise(path, options) {
    try {
      return await origReadlinkPromise.call(fs.promises, path, options);
    } catch (e) {
      if (e.code === 'EISDIR') {
        return path;
      }
      throw e;
    }
  };
}
