const { createRunner } = require('atom-jasmine2-test-runner');

let options = {
  specHelper: {
    atom: true,
    attachToDom: true,
    ci: true,
    unspy: true
  }
};

module.exports = createRunner(options);
