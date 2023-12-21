
/* pack loader */
export default function myLoader(content:string, mate:any) {
  return `\/* my-loader running *\/
    ${content}`;
}
