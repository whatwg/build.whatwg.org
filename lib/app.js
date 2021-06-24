"use strict";
const Koa = require("koa");
const KoaRouter = require("koa-router");
const koaBody = require("koa-body");
const path = require("path");
const { promisify } = require("util");
const execFile = promisify(require("child_process").execFile);
const { createReadStream } = require("fs");
const { mkdir, rmdir, unlink, writeFile } = require("fs").promises;
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
  const quiet = "quiet" in ctx.request.query;
  const singlePageOnly = "single-page-only" in ctx.request.query;

  const sha = ctx.request.body.sha || "(sha not provided)";
  const buildType = ctx.request.body.build || "default";

  const sourceFilePath = (ctx.request.files.source && ctx.request.files.source.path) ||
                         ctx.throw(400, "Expected a source file");
  const mdnFilePath = (ctx.request.files.mdn && ctx.request.files.mdn.path) ||
                      ctx.throw(400, "Expected a mdn file");

  const outDirectory = randomDirectoryName();
  await mkdir(outDirectory, { recursive: true });

  const args = [sourceFilePath, sha, outDirectory, buildType, mdnFilePath];
  if (singlePageOnly) {
    args.unshift("--single-page-only");
  }
  if (quiet) {
    args.unshift("--quiet");
  }

  try {
    try {
      console.log(`Running wattsi ${args.join(" ")}`);
      const result = await execFile("wattsi", args);

      const outputFile = path.join(outDirectory, "output.txt");
      await writeFile(outputFile, `${result.stdout}\n\n${result.stderr}`, { encoding: "utf-8" });
      console.log(`  wattsi succeeded`);
    } catch (e) {
      if (e.stdout) {
        e.message = `${e.stdout}\n\n${e.stderr}`;
      }
      ctx.response.set("Wattsi-Exit-Code", e.code);
      console.log(`  wattsi failed: ${e.code}`);
      ctx.throw(400, e.message);
    }

    ctx.response.set("Wattsi-Exit-Code", "0");
    const zipFilePath = `${outDirectory}.zip`;
    console.log(`  zipping result`);
    await execFile("7za", ["a", "-tzip", "-r", zipFilePath, `./${outDirectory}/*`]);
    console.log(`  zipping succeeded`);

    ctx.response.type = "application/zip";
    ctx.response.body = createReadStream(zipFilePath);

    finished(ctx, () => unlink(zipFilePath));
  } finally {
    await removeAllFiles(ctx);
    await rmdir(outDirectory, { recursive: true });
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(process.env.PORT);

function randomDirectoryName() {
  return Math.random().toString(36).slice(2);
}

function removeAllFiles(ctx) {
  const filePaths = Object.values(ctx.request.files).map(file => file.path);
  return Promise.all(filePaths.map(filePath => unlink(filePath)));
}
