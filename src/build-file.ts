import { path } from "../deps.ts";
import tpl from "./template/tpl.js";

class BuildFile {
  static root: string = "";
  static entry: string = "";
  static entryPath: string = "";
  static outputPath: string = "";
  static modules: any = {};
  static loaders = [];
  constructor(config: any) {
    BuildFile.root = Deno.cwd();
    BuildFile.entry = config.entry;
    BuildFile.entryPath = path.resolve(BuildFile.root, config.entry);
    BuildFile.outputPath = path.resolve(
      BuildFile.root,
      config.output.path,
      config.output.fileName
    );
  }
  async createModule(entryPath: string, entry: string) {
    const fileText = await Deno.readTextFile(entryPath);
    const fileSource: string = fileText.toString();
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
    // this.runLoader(BuildFile.modules)
    //进一步对代码加工
    Object.keys(BuildFile.modules).forEach((name) => {
      BuildFile.modules[name] = this.wrapCode(BuildFile.modules[name]);
    });
    //准备写入文件
    await this.generateFile(BuildFile.modules);
    return this;
  }

  async runLoader(modules: any[]) {
    const loaders = BuildFile.loaders;
    const modulesKeys = Object.keys(modules);
  }
}

async function build(opstion = {}) {
  const env = Deno.env.toObject();
  const defaultConfig = Object.assign(
    {
      entry: "./index.js",
      output: {
        path: "./dist/",
        fileName: "main.js",
      },
    },
    opstion
  );
  //初始开始
  let compler = new BuildFile(defaultConfig);
  // 开始构建
  compler.start();
}

export default build;
