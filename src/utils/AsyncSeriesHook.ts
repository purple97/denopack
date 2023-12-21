class AsyncSeriesHook {
  static names: string[]; //任务事件名
  constructor(names: string[]) {
    AsyncSeriesHook.names = names;
    names.forEach((name) => {
      this[name] = [];
    });
  }
  /*
   * 在对应事件上挂载callback方法
   * 例如: compiler.hooks.tap("beforeRun", callback:()=>void)
   */
  tap(name: string, callback: () => void) {
    this[name].push(callback);
  }
  // 执行对应事件的callback;
  call(name, compilation) {
    if (AsyncSeriesHook.names.includes(name)) {
      const fns = this[name];
      fns.forEach((fn: any) => {
        fn(compilation, fn);
      });
    }
  }
}

export default AsyncSeriesHook;
