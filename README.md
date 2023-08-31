# build.whatwg.org

This app is a build server to allow you to run [html-build](https://github.com/whatwg/html-build) and [Wattsi](https://github.com/whatwg/wattsi) without having to actually install many dependencies locally.

Currently it is hosted on build.whatwg.org.

## Endpoints

### `/wattsi`

The `/wattsi` endpoint accepts POSTs with the following request body fields:

- `source`, a file, which you can get from [whatwg/html](https://github.com/whatwg/html)
- `mdn`, a file, which you can get from <https://raw.githubusercontent.com/w3c/mdn-spec-links/master/html.json>
- `sha`, a string, the Git commit hash of the whatwg/html repository
- `build`, a string, either `"default"` or `"review"`

You can also send the following query string parameters, which correspond to the same-named Wattsi options:

- `quiet`
- `single-page-only`

If the resulting status code is 200, the result will be a ZIP file containing the output, as well as an `output.txt` containing the stdout/stderr output. If the resulting status code is 400, the body text will be the error message.

The response will have a header, `Exit-Code`, which gives the exit code of Wattsi. This will always be `0` for a 200 OK response, but a 400 Bad Request could give a variety of different values, depending on how Wattsi failed.

### `/html-build`

The `/html-build` endpoint accepts POSTs with the following request body fields:

- `html`, a ZIP file, containing your local checkout of [whatwg/html](https://github.com/whatwg/html). We recommend excluding the unneeded `.git/` and `review-drafts/` directories; there are other unneeded files, but those are the large ones.

   ```sh
   zip -r html.zip . --exclude .\* review-drafts/\*
   ```

- `sha`, a string, the Git commit hash of the whatwg/html repository

You can send the following query string parameters, which correspond to the same-named html-build options:

- `no-update`
- `no-lint`
- `no-highlight`
- `single-page`
- `fast`
- `quiet`
- `verbose`

If the resulting status code is 200, the result will be a ZIP file containing the output, as well as an `output.txt` containing the stdout/stderr output. If the resulting status code is 400, the body text will be the error message.

The response will have a header, `Exit-Code`, which gives the exit code of html-build. This will always be `0` for a 200 OK response, but a 400 Bad Request could give a variety of different values, depending on how html-build failed.

### `/version`

This endpoint responds to GET requests so you can check to see if the server is working. It returns a `text/plain` response of the latest-deployed Git commit SHA.

## Server Development Info

This server requires the following to run:

- [Node.js](https://nodejs.org/) 18.17.1 or later
- [7zip](http://www.7-zip.org/) in your path as `7za`
- [Wattsi](https://github.com/whatwg/wattsi), in your `$PATH` as `wattsi`
- Several files from [html-build](https://github.com/whatwg/html-build) in your `$PATH`:
  - `build.sh`
  - `lint.sh`
  - `entities/`
  - `html-build`, the executable built from the Rust preprocessor portions

It will expose itself on the port given by the `$PORT` environment variable.

To set up the server remember to do `npm install --omit=dev`. Then, to start it running, just do `npm start`.

Alternately, you can use Docker:

```bash
docker build --tag build.whatwg.org .
docker run -p 3000:3000 --interactive --tty build.whatwg.org
```
