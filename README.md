# @enterprise-cmcs/mdct-core

[![npm version](https://img.shields.io/npm/v/@enterprise-cmcs/mdct-core/latest.svg)](https://www.npmjs.com/package/@enterprise-cmcs/mdct-core) [![Maintainability](https://api.codeclimate.com/v1/badges/3dd8c47fb161adc36946/maintainability)](https://codeclimate.com/repos/64f79f2cb94c0076558d5147/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/3dd8c47fb161adc36946/test_coverage)](https://codeclimate.com/repos/64f79f2cb94c0076558d5147/test_coverage)


### How to publish this package to npm
The mdct-core npm package uses semantic-release to publish packages to the enterprise-cmcs npm org. To read more about semantic release please visit the following link: https://github.com/semantic-release/semantic-release

The publish workflow will run only when pull requests are merged into the **main branch** and the mechanism for publishing relies on the commit message to trigger a publishing build based on a few key words. 

**the 3 keywords for semantic release are as following:**

* **"fix"**: this will up the patch version of the release number (note: semantic release calls patch a fix release)

* **"feat"**: this will update the minor version of the release number (note: semantic release calls this a feature release)

* **"perf"**: this will update the major version of the release number (note: semantic release calls this a breaking release)

For example: 

**fix(publishing from CI): my commit message of choice**

**note:** the commit message needs to be on the merge commit when merging into main
