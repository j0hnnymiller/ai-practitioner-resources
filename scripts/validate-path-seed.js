const validator = require("./validate-path-artifacts.js");

if (require.main === module) {
  validator.main();
}

module.exports = validator;
