import { Command } from "../deps.ts";
import { Build } from "./build-command.ts";
import { version } from "../version.ts";

export class Denopack extends Command {
  constructor() {
    super();
    this.name("denopack")
      .version(version)
      .description("用Deno实现一个手脚")
      .arguments("[build]")
      .stopEarly()
      .action(() => {
        console.log("denopck <command> <?arguments>");
      })
      .command("build", new Build())
      .reset();
  }
}
