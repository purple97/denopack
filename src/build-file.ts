// import { stat } from "deno";
import { path } from "../deps.ts";
import tpl from "./template/tpl.js";
import AsyncSeriesHook from "./utils/AsyncSeriesHook.ts";
import MyPlugin from "./plugins/my-plugin.ts";

class BuildFile {
  static root: string = "";
  static entry: string = "";
  static entryPath: string = "";
  static outputPath: string = "";
  static modules: any = {};
  static loaderPathBase: string = "";
  static loaders = [];

  //
  public plugins: any[] = [];
  public hooks: { [str: string]: any } = {};

  constructor(config: any) {
    /* 初始化 */
    BuildFile.root = Deno.cwd();
    BuildFile.entry = config.entry;
    BuildFile.entryPath = path.resolve(BuildFile.root, config.entry);
    BuildFile.outputPath = path.resolve(
      BuildFile.root,
      config.output.path,
      config.output.fileName,
    );
    BuildFile.loaderPathBase = path.join(
      Deno.mainModule.replace("file:\/\/", ""),
      "../src/loaders",
    );
    BuildFile.loaders = config.modules.rules.map(
      (rule: { test: RegExp; use: any }) => {
        rule.use = this.requireLoader(rule.use);
        return rule;
      },
    );

    this.plugins = config.plugins;
    this.hooks = new AsyncSeriesHook(["beforeRun", "compilation", "emit"]);
  }

  async createModule(entryPath: string, entry: string) {
    console.log(entryPath);
    const fileText = await Deno.readTextFile(entryPath);
    let fileSource: string = fileText.toString();
    const { code, deps } = this.resourceParse(fileSource, path.dirname(entry));
    //读取的内容加入到modules对象中
    BuildFile.modules[entry] = code;

    for (let i in deps) {
      const item = deps[i];
      await this.createModule(
        path.resolve(path.dirname(entryPath), item),
        item,
      );
    }
  }

  resourceParse(resource: string, filedir: string): any {
    let deps: string[] = [];
    const rx = /require\(['"](.*)['"]\)/g;
    let newResource = resource.replace(
      rx,
      function (match: string, filename: string) {
        deps.push(filename);
        return `__denopack_require__("${filename}")`;
      },
    );
    return { code: newResource, deps };
  }

  wrapCode(code: string) {
    return `function(module, exports, __denopack_require__){
      ${code}
    }`;
  }

  async generateFile(modules: string[]) {
    let fileContent = tpl;
    let modulesCodeString = "";
    Object.keys(modules).forEach((name: any) => {
      modulesCodeString += `"${name}":${modules[name]},`;
    });
    let template = fileContent
      .replace("__denopack_entry__", BuildFile.entry)
      .replace("__modules__code__", modulesCodeString.replace(/,$/, ""));
    //文件打包完成
    //写入文件
    await Deno.mkdir(path.dirname(BuildFile.outputPath), { recursive: true });
    await Deno.writeTextFile(BuildFile.outputPath, template);
  }

  async start() {
    //读取各模块以及依赖
    await this.createModule(BuildFile.entryPath, BuildFile.entry);
    await this.runRules();
    this.runPlugin("compilation");
    //进一步对代码加工
    Object.keys(BuildFile.modules).forEach((name) => {
      BuildFile.modules[name] = this.wrapCode(BuildFile.modules[name]);
    });
    //准备写入文件
    await this.generateFile(BuildFile.modules);
    this.runPlugin("emit");
    return this;
  }

  async runRules() {
    const loaders = BuildFile.loaders;
    const modules = BuildFile.modules;
    for await (const name of Object.keys(modules)) {
      const res = await this.runLoader(name, modules[name], loaders);
      modules[name] = res.code;
    }
  }

  async requireLoader(name: string) {
    const filePath = path.resolve(BuildFile.loaderPathBase, `${name}.ts`);
    if (Deno.stat(filePath)) {
      return await import(filePath);
    }
    return null;
  }

  /*  */
  async runLoader(name: string, fileSource: string, loaders: any[]) {
    let _fileSource = fileSource;
    for await (const loaderItem of loaders) {
      if (loaderItem.test.test(name)) {
        if (loaderItem.use) {
          const res = await loaderItem.use;
          const loader = res.default;
          _fileSource = loader(_fileSource);
        }
      }
    }
    return {
      name,
      code: _fileSource,
    };
  }

  /* 运行插件
  * name<string>:事件名
  */
  async runPlugin(name: string) {
    // console.log("event status:", name);
    this.hooks.call(name, BuildFile);
  }
}

/* ------------------------------------------------------------------------------ */
/*
 * run build
 */
async function build(options = {}) {
  const env = Deno.env.toObject();
  const defaultConfig = Object.assign(
    {
      env: env.DENOPACK_ENV || "local",
      entry: "./index.js",
      output: {
        path: "./dist/",
        fileName: "main.js",
      },
      modules: {
        rules: [{ test: /\.js$/, use: "my-loader" }],
      },
      plugins: [
        new MyPlugin({
          name: "kk",
        }),
      ],
    },
    options,
  );
  // console.log(defaultConfig);
  console.time("[DenoPack]Build Time");
  //初始化开始
  let complier = new BuildFile(defaultConfig);

  //注册插件
  complier.plugins.forEach((plugin) => {
    if (plugin.apply && typeof plugin.apply === "function") {
      plugin.apply(complier);
    }
  });

  complier.runPlugin("beforeRun");

  // 开始构建
  await complier.start();
  console.timeEnd("[DenoPack]Build Time");
}

export default build;
