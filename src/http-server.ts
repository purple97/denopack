import { serve } from "https://deno.land/std/http/server.ts";
import FormatJsonToString from "./utils/format-json-to-string.ts";

interface IEnv {
  [string]?: stirng | number | null;
}

const env: IEnv = Deno.env.toObject();
const Server = serve({ port: 8000 });
// const fileText = await Deno.readTextFile("./README.md");

console.log("http://localhost:8000/");
const bodyString = FormatJsonToString(env);
for await (const req of Server) {
  req.respond({ body: bodyString });
}
