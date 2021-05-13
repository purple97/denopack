export default `!(function (modules) {
  var installedModules = {};
  function __denopack_require__(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    var module = (installedModules[moduleId] = {
      exports: {},
    });
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __denopack_require__
    );
    return module.exports;
  }
  // 入口
  return __denopack_require__("__denopack_entry__");
})({__modules__code__});
`;
