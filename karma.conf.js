module.exports = function(config) {
  config.set({
    browsers: ['PhantomJS2'],
    files: [
      { pattern: 'examples/*.js', included: false },
      { pattern: 'uoe_core.js' },
      { pattern: 'tests/*.test.js' }
    ],
    frameworks: ['jasmine']
  });
};
