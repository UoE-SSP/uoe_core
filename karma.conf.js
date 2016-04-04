module.exports = function(config) {
  config.set({
    browsers: ['PhantomJS2'],
    frameworks: ['jasmine'],
    files: [
      { pattern: 'examples/*.*', included: false },
      { pattern: 'uoe_core.js' },
      { pattern: 'tests/*.test.js' }
    ],
    preprocessors: {
      'uoe_core.js': ['coverage']
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type: 'html',
      dir: 'coverage/'
    }
  });
};
