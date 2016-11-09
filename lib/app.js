"use strict";
const koa = require("koa");
const route = require("koa-route");
const path = require("path");
const multipart = require("co-multipart");
const rimraf = require("rimraf-then");
const mkdirp = require("mkdirp-then");
const execFile = require("child-process-promise").execFile;
const fs = require("then-fs");
const finished = require("finished");

const config = require("../config.json");

const app = koa();

app.use(function* (next) {
  try {
    yield next;
  } catch (e) {
    this.status = e.status || 500;
    this.type = "text/plain";
    this.body = e.message;
  }
});

app.use(route.get("/ping", function* () {
  this.body = "All good here";
}));

app.use(route.post("/wattsi", function* () {
  const parts = yield* multipart(this);

  const sourceFilePath = getFilePath(parts, "source", this);
  const caniuseFilePath = getFilePath(parts, "caniuse", this);
  const w3cbugsFilePath = getFilePath(parts, "w3cbugs", this);

  const outDirectory = randomDirectoryName();
  yield mkdirp(outDirectory);

  const args = [sourceFilePath, outDirectory, caniuseFilePath, w3cbugsFilePath];
  if ("quiet" in this.query) {
    args.unshift("--quiet");
  }

  try {
    try {
      const result = yield execFile(config.wattsiPath, args);

      const outputFile = path.join(outDirectory, "output.txt");
      yield fs.writeFile(outputFile, `${result.stdout}\n\n${result.stderr}`, { encoding: "utf-8" });
    } catch (e) {
      if (e.stdout) {
        e.message = `${e.stdout}\n\n${e.stderr}`;
      }
      this.set("Wattsi-Exit-Code", e.code);
      this.throw(e, 400);
    }

    this.set("Wattsi-Exit-Code", "0");
    const zipFilePath = `${outDirectory}.zip`;
    yield execFile("7za", ["a", "-tzip", "-r", zipFilePath, `./${outDirectory}/*`]);

    this.type = "application/zip";
    this.body = fs.createReadStream(zipFilePath);

    finished(this, () => rimraf(zipFilePath));
  } finally {
    parts.dispose();
    yield rimraf(outDirectory);
  }
}));

app.listen(config.port);

function randomDirectoryName() {
  return Math.random().toString(36).slice(2);
}

function getFilePath(parts, fieldname, context) {
  for (const file of parts.files) {
    if (file.fieldname === fieldname) {
      return file.path;
    }
  }
  context.throw(`Expected a ${fieldname} file`, 400);
}
