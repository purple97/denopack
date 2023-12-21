class MyPlugin {
  config: any;
  constructor(options: any) {
    this.config = options;
  }
  apply(compiler: any) {
    var self = this;
    /* 构建初始化前 ，这个时候可以对构建配置修改
    */
    compiler.hooks.tap(
      "beforeRun",
      (compilation: any, callback: (ops: any) => void) => {
        console.log("MyPlugin beforeRun:", compilation, self.config);
      },
    );

    /* 构建初始化后
    */
    compiler.hooks.tap(
      "compilation",
      (compilation: any, callback: (ops: any) => void) => {
        console.log("MyPlugin compilation:", self.config);
      },
    );

    /* 构建完成时， 这个时候可以对构建产物进行处理，例如 拷贝生成的文件到其他目录
    */
    compiler.hooks.tap(
      "emit",
      (compilation: any, callback: (ops: any) => void) => {
        console.log("MyPlugin emit:", self.config);
      },
    );
  }
}

export default MyPlugin;
