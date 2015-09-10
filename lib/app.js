"use strict";
const koa = require("koa");
const multipart = require("co-multipart");
const rimraf = require("rimraf-then");
const mkdirp = require("mkdirp-then");
const exec = require("child-process-promise").exec;
const execFile = require("child-process-promise").execFile;
const fs = require("fs");
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
    try {
      yield execFile(config.wattsiPath, [sourceFilePath, outDirectory, caniuseFilePath, w3cbugsFilePath]);
    } catch (e) {
      if (e.stdout) {
        e.message = `${e.stdout}\n\n${e.stderr}`;
      }
      this.throw(e, 500);
    }

    const zipFilePath = `${outDirectory}.zip`;
    yield execFile("7za", ["a", "-tzip", "-r", zipFilePath, `./${outDirectory}/*`]);

    this.type = "application/zip";
    this.body = fs.createReadStream(zipFilePath);

    finished(this, function () {
      rimraf(zipFilePath);
    });
  } finally {
    yield rimraf(outDirectory);
  }
});

app.listen(config.port);

function randomDirectoryName() {
  return Math.random().toString(36).slice(2);
}
