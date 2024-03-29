# @enterprise-cmcs/mdct-core

[![npm version](https://img.shields.io/npm/v/@enterprise-cmcs/mdct-core/latest.svg)](https://www.npmjs.com/package/@enterprise-cmcs/mdct-core) [![Maintainability](https://api.codeclimate.com/v1/badges/3dd8c47fb161adc36946/maintainability)](https://codeclimate.com/repos/64f79f2cb94c0076558d5147/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/3dd8c47fb161adc36946/test_coverage)](https://codeclimate.com/repos/64f79f2cb94c0076558d5147/test_coverage)

https://www.npmjs.com/package/@enterprise-cmcs/mdct-core


## How to publish this package to npm
The mdct-core npm package uses semantic-release to publish packages to the enterprise-cmcs npm org. To read more about semantic release please visit the following link: https://github.com/semantic-release/semantic-release

The publish workflow will run only when pull requests are merged into the **main branch** and the mechanism for publishing relies on the commit message to trigger a publishing build based on a few key words. 

**the 3 keywords for semantic release are as following:**

* **"fix:"**: this will up the patch version of the release number (note: semantic release calls patch a fix release)

* **"feat:"**: this will update the minor version of the release number (note: semantic release calls this a feature release)

* **"perf:"**: this will update the major version of the release number (note: semantic release calls this a breaking release)

**For example: **

**fix: my commit message of choice**

**note:** the commit message needs to be on the merge commit when merging into main and the keyword must not have any spaces between the colon. see screenshot for example

![Screenshot 2024-03-12 at 2 57 57 PM](https://github.com/Enterprise-CMCS/macpro-mdct-core/assets/52459927/ee3ebb99-c1bf-40b1-a546-903fa722704b)

## Development Worfklow

Please follow the following steps to make changes to the mdct-core npm package and test in another product:

1. **Deploy Your Product**:
    - Deploy your product that will utilize `mdct-core`.

2. **Update Package Configuration**:
    - Modify the `package.json` file of your service to integrate `mdct-core` by executing the command: `yarn add "@enterprise-cmcs/mdct-core"`.

3. **Adjust Application Code**:
    - Make necessary changes within your product's codebase to properly integrate and consume `mdct-core`.

4. **Re-deploy Application**:
    - Re-deploy your application to ensure that the updates from `mdct-core` are correctly reflected.

5. **Make Development Modifications**:
    - Return to the `mdct-core` repository and make any required development modifications.

6. **Link Core Repository Locally**:
    - Within the core repository, navigate to the top level and execute `yarn link`.

7. **Link Core Repository to Product**:
    - Return to your product where `mdct-core` is being utilized and link your local repository by running `yarn link "@enterprise-cmcs/mdct-core"`.

8. **Publish Local Changes**:
    - Go back to the core repository's top level and locally publish your changes by following these steps:
        - Run `yarn install`.
        - Execute `yarn run build`.

9. **Reflect Local Changes in Product**:
    - Return to your product and redeploy the application locally to ensure that the changes published from the core repository are reflected.
  
10. **Finalize Changes for Publishing**:
    - Once development is complete and you are prepared to publish core changes to npm and consume them in your application from npm, proceed as follows:
        - In the `mdct-core` repository, run `yarn unlink` to unlink local changes.
        - Confirm that your product no longer consumes local core changes by redeploying.
     

## Slack Webhooks:
This repository uses two webhooks to publish to two different channels.
- SLACK_WEBHOOK: This pubishes to the `macpro-mdct-core-alerts` channel in CMS Slack. Alerts published there are for build failures of the NPM package as well as new releases to the `@enterprise-cmcs` npm organization.
- INTEGRATIONS_SLACK_WEBHOOK: This is used to publish new pull requests to the `proj-cms-mdct-integrations channel`
    - Webhooks are created by CMS tickets, populated into GitHub Secrets







