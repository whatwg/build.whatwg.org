"use strict";
const koa = require("koa");
const path = require("path");
const multipart = require("co-multipart");
const rimraf = require("rimraf-then");
const mkdirp = require("mkdirp-then");
const exec = require("child-process-promise").exec;
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

app.use(function* () {
  const parts = yield* multipart(this);

  if (!parts.file.source) {
    this.throw("Expected a source file", 400);
  }
  const sourceFilePath = parts.file.source.path;
  const sourceDirPath = path.dirname(parts.file.source.path);

  const quiet = parts.field.quiet !== undefined ? "--quiet" : "";
  const verbose = parts.field.verbose !== undefined ? "--verbose" : "";

  const outDirectory = randomDirectoryName();
  yield mkdirp(outDirectory);

  const tempDirectory = outDirectory + "/.temp";

  try {
    try {
      if (".zip" === path.extname(sourceFilePath)) {
        yield execFile("7za", ["e", sourceFilePath, "-o" + sourceDirPath]);
      }

      const args = ["--output", outDirectory, "--log", outDirectory,
        "--cache", outDirectory + "/.cache", "--temp", outDirectory + "/.temp",
        "--skip-install", quiet, verbose, sourceDirPath + "/source"]

      const result = yield execFile(config.buildScriptPath, args);

    } catch (e) {
      if (e.stdout) {
        e.message = `${e.stdout}\n\n${e.stderr}`;
      }
      this.throw(e, 400);
    }

    const wattsiOutput = tempDirectory + "/wattsi-output";

    yield execFile("mv", [outDirectory + "/build.log", wattsiOutput]);
    yield execFile("mv", [outDirectory + "/entities.json", wattsiOutput]);

    const zipFilePath = `${wattsiOutput}.zip`;
    yield execFile("7za", ["a", "-tzip", "-r", zipFilePath, `./${wattsiOutput}/\*`]);

    this.type = "application/zip";
    this.body = fs.createReadStream(zipFilePath);

    finished(this, function () {
      rimraf(zipFilePath);
    });
  } finally {
    yield rimraf(outDirectory);
    parts.dispose();
  }
});

app.listen(config.port);

function randomDirectoryName() {
  return Math.random().toString(36).slice(2);
}
