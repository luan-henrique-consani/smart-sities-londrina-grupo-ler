import {pathToFileURL} from 'node:url';
const root="C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies";
const m=await import(pathToFileURL(root+'/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
console.log(JSON.stringify({exports:Object.keys(m).filter(x=>/Presentation|FileBlob|Font/.test(x))}));

