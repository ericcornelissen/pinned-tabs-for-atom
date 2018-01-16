'use babel';

import { createRunner } from 'atom-jasmine2-test-runner';

let options = {
  specHelper: {
    atom: true,
    attachToDom: true,
    ci: true,
    unspy: true
  }
};

export default createRunner(options);
