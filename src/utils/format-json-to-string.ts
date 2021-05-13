interface IEnv {
  [string]?: stirng | number | null;
}

export function FormatValue(value: string) {
  let newValue = value;
  const valueType = typeof value;
  if (valueType == "string") {
    newValue = `\"${value}\"`;
  } else {
    newValue = value;
  }
  return newValue;
}

export function FormatJsonToString(json: IEnv): string {
  const keys: string[] = Object.keys(json);
  let maxLen = 1;
  keys.forEach((k) => {
    if (k.length > maxLen) maxLen = k.length;
  });
  // console.log(maxLen);
  let strJson = "{\n";
  keys.forEach((key: string) => {
    strJson += `  ${key.padStart(maxLen, " ")}: ${FormatValue(json[key])},\n`;
  });
  strJson += "}";
  return strJson;
}

export default FormatJsonToString;
