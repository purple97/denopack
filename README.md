# denopack

练习，deno 实现 webpack 核心功能：打包

## 功能规划

- deno 实现全局命令
- 默认打包参数
  - 获取打包工程目录
  - 入口文件
- 文件操作
- 打包模板

## 使用

- 挂载到全局命令

```sh
$ deno install -qA -n denopack ./index.ts
```

- 使用

```sh
$ cd my-prodction
# 默认 ./index.js入口, 输出 "./dist/main.js"
$ denopack build
```

## 开发

- 安装 vr，可以类似 npm run start 一样运行脚本
- `deno install -qA -n vr https://deno.land/x/velociraptor@1.0.0-beta.18/cli.ts`
- scripts.json

```json
{
  "scripts": {
    "start": "deno run --allow-net server.ts",
    "test": "deno test --allow-net server_test.ts"
  }
}
```

- 命令行

```sh
$ vr run start
```
