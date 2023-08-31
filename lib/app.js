"use strict";
const path = require("path");
const os = require("os");
const childProcess = require("child_process");
const { promisify } = require("util");
const execFile = promisify(childProcess.execFile);
const { createReadStream } = require("fs");
const { mkdir, rm, writeFile } = require("fs").promises;
const Koa = require("koa");
const KoaRouter = require("koa-router");
const { koaBody } = require("koa-body");
const finished = require("finished");

const app = new Koa();
const router = new KoaRouter();

router.get("/version", ctx => {
  if (process.env.VERSION) {
    ctx.response.body = process.env.VERSION;
  }
  // Will be treated as a 404 by default.
});

const bodyParser = koaBody({
  multipart: true,
  urlencoded: false,
  json: false,
  text: false,
  multiples: false
});

router.post("/wattsi", bodyParser, async ctx => {
  const booleanArgs = booleanArgsFromQuery(ctx.request.query, ["quiet", "single-page-only"]);

  const sha = ctx.request.body.sha || "(sha not provided)";
  const buildType = ctx.request.body.build || "default";

  const sourceFilePath = ctx.request.files.source?.filepath ?? ctx.throw(400, "Expected a source file");
  const mdnFilePath = ctx.request.files.mdn?.filepath ?? ctx.throw(400, "Expected a mdn file");

  const outDirectory = newTempDirectoryName();
  await mkdir(outDirectory, { recursive: true });

  const args = [sourceFilePath, sha, outDirectory, buildType, mdnFilePath, ...booleanArgs];

  try {
    try {
      console.log(`Running wattsi ${args.join(" ")}`);
      const result = await promisedSpawnWhileCapturingOutput("wattsi", args);

      const outputFile = path.join(outDirectory, "output.txt");
      await writeFile(outputFile, result, { encoding: "utf-8" });
      console.log(`  wattsi succeeded`);
    } catch (e) {
      const errorBody = e.output ?? e.stack;
      console.log(`  html-build or file-writing failed:`);
      console.log(errorBody);
      const headers = typeof e.code === "number" ? { "Exit-Code": e.code } : {};
      ctx.throw(400, errorBody, { headers });
    }

    ctx.response.set("Exit-Code", "0");
    const zipFilePath = `${outDirectory}.zip`;
    console.log(`  zipping result`);
    await execFile("7za", ["a", "-tzip", "-r", zipFilePath, `${outDirectory}/*`]);
    console.log(`  zipping succeeded`);

    ctx.response.type = "application/zip";
    ctx.response.body = createReadStream(zipFilePath);

    finished(ctx, () => rm(zipFilePath));
  } finally {
    await cleanupLoggingRejections([
      ...requestFinalRemovalPromises(ctx.request),
      rm(outDirectory, { recursive: true })
    ]);
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(process.env.PORT);

function newTempDirectoryName() {
  return path.resolve(os.tmpdir(), Math.random().toString(36).slice(2));
}

function requestFinalRemovalPromises(request) {
  const filePaths = Object.values(request.files).map(file => file.filepath);
  return filePaths.map(filePath => rm(filePath));
}

function booleanArgsFromQuery(query, possibleArgs) {
  return possibleArgs.filter(arg => arg in query).map(arg => `--${arg}`);
}

function promisedSpawnWhileCapturingOutput(...args) {
  return new Promise((resolve, reject) => {
    const subprocess = childProcess.spawn(...args);

    let output = "";
    subprocess.stdout.on("data", data => {
      output += data;
    });
    subprocess.stderr.on("data", data => {
      output += data;
    });

    subprocess.on("close", code => {
      if (code !== 0) {
        const error = new Error("Process returned nonzero exit code");
        error.code = code;
        error.output = output;
        reject(error);
      } else {
        resolve(output);
      }
    });

    subprocess.on("error", () => {
      reject(new Error("Process failed with error event"));
    });
  });
}

async function cleanupLoggingRejections(promises) {
  const results = await Promise.allSettled(promises);
  const rejections = results.filter(result => result.status === "rejected");

  if (rejections.length > 0) {
    const plural = rejections.length === 1 ? "" : "s";
    console.log(`  Cleanup error${plural}:`);
    for (const result of rejections) {
      console.log(`  ${result.reason.stack}`);
    }
  }
}
