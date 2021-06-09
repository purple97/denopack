const React = require("./common/echarts.js");
const sum = require("./common/util.js");

module.exports = function (message) {
  console.log(message, sum(3, 4));
};
