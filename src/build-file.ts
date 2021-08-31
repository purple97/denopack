import { path } from "../deps.ts";
import tpl from "./template/tpl.js";

class BuildFile {
  static root: string = "";
  static entry: string = "";
  static entryPath: string = "";
  static outputPath: string = "";
  static modules: any = {};
  static loaders = [];

  //
  public plugins: any[] = [];
  public hooks: { [str: string]: any } = {};
  constructor(config: any) {
    BuildFile.root = Deno.cwd();
    BuildFile.entry = config.entry;
    BuildFile.entryPath = path.resolve(BuildFile.root, config.entry);
    BuildFile.outputPath = path.resolve(
      BuildFile.root,
      config.output.path,
      config.output.fileName
    );
    BuildFile.loaders = config.modules.rules;
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
        item
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
      }
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
    this.runRules();
    // this.runPlugin("compilation");
    //进一步对代码加工
    Object.keys(BuildFile.modules).forEach((name) => {
      BuildFile.modules[name] = this.wrapCode(BuildFile.modules[name]);
    });
    //准备写入文件
    await this.generateFile(BuildFile.modules);
    // this.runPlugin("emit");
    return this;
  }

  async runRules() {
    const loaders = BuildFile.loaders;
    const modules = BuildFile.modules;
    Object.keys(modules).forEach((name) => {
      this.runLoader(name, modules[name], loaders);
    });
  }

  /*  */
  async runLoader(name: string, fileSource: string, loaders: any[]) {
    let _fileSource = fileSource;
    loaders.forEach((loaderItem) => {
      if (loaderItem.test.test(name)) {
        console.log(`run loader : ${loaderItem.use}!!!${name}`);
      }
    });
    return {
      name,
      source: _fileSource,
    };
  }

  /* 运行插件 */
  async runPlugin(name: string) {
    console.log("event status:", name);
    if (this.hooks[name]) {
      this.hooks[name].forEach((hook: string) => {
        if (this.hooks[name].run) {
          this.hooks[name].run(BuildFile);
        }
      });
    }
  }
}

async function build(options = {}) {
  const env = Deno.env.toObject();
  const defaultConfig = Object.assign(
    {
      entry: "./index.js",
      output: {
        path: "./dist/",
        fileName: "main.js",
      },
      modules: {
        rules: [{ test: /\.js$/, use: "my-loader" }],
      },
    },
    options
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

  // complier.runPlugin("beforeRun");

  // 开始构建
  await complier.start();
  console.timeEnd("[DenoPack]Build Time");
}

export default build;
