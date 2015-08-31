"use strict";
const koa = require("koa");
const multipart = require("co-multipart");
const rimraf = require("rimraf-then");
const mkdirp = require("mkdirp-then");
const exec = require("child-process-promise").exec;
const execFile = require("child-process-promise").execFile;
const error = require("koa-error");
const fs = require("fs");

const config = require("../config.json");

const app = koa();

app.use(error());

app.use(function* () {
  const parts = yield* multipart(this);

  if (!parts.file.source) {
    this.throw("Expected a source file", 400);
  }
  const sourceFilePath = parts.file.source.path;

  // TODO: get these from local or remote copies if not supplied.

  if (!parts.file.caniuse) {
    this.throw("Expected caniuse file", 400);
  }
  const caniuseFilePath = parts.file.caniuse.path;

  if (!parts.file.w3cbugs) {
    this.throw("Expected w3cbugs file", 400);
  }
  const w3cbugsFilePath = parts.file.w3cbugs.path;

  const outDirectory = randomDirectoryName();
  yield mkdirp(outDirectory);

  try {
    yield execFile(config.wattsiPath, [sourceFilePath, outDirectory, caniuseFilePath, w3cbugsFilePath]);

    const zipFilePath = `${outDirectory}.zip`;
    yield execFile("7za", ["a", "-tzip", "-r", zipFilePath, `./${outDirectory}/*`]);

    this.body = fs.createReadStream(zipFilePath);
  } catch (e) {
    if (e.stdout) {
      console.log(e.stdout);
      console.log(e.stderr);
    }
    throw e;
  } finally {
    yield rimraf(outDirectory);
  }
});

app.listen(config.port);

function randomDirectoryName() {
  return Math.random().toString(36).slice(2);
}
