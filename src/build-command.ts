import { Command, path } from "../deps.ts";
import buildFile from "./build-file.ts";

export class Build extends Command {
  constructor() {
    super();
    this.description("denopack!").useRawArgs().action(buildFile);
  }
}
