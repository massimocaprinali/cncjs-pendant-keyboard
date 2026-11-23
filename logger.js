let verbose = false;

const prefix = (level) => `${new Date().toISOString()} [${level}]`;

module.exports = {
  setVerbose: function (value) {
    verbose = !!value;
  },
  info: function (...args) {
    console.log(prefix("INFO "), ...args);
  },
  warn: function (...args) {
    console.warn(prefix("WARN "), ...args);
  },
  error: function (...args) {
    console.error(prefix("ERROR"), ...args);
  },
  debug: function (...args) {
    if (verbose) {
      console.log(prefix("DEBUG"), ...args);
    }
  },
};
