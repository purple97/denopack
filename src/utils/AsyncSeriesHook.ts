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

/*
生成：
{
  "beforeRun": [
    [Function: callback]
  ],
  "compilation": [
    [Function: callback]
  ],
  "emit": [
    [Function: callback]
  ]
}
通过tap方法，将callback方法挂载到对应的事件上，
然后通过call方法，执行对应事件的callback方法。
call方便被runPlugin方法调用，runPlugin方法是在build-file.ts中调用的。
*/
