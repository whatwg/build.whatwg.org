# Wattsi Server

This app is a build server to allow you to run [Wattsi](https://github.com/whatwg/wattsi) without having to actually install it locally. Which is really useful, since not everyone has a Free Pascal compiler lying around.

Currently it is hosted on build.whatwg.org. You can use it as follows:

1. Get a local copy of `caniuse.json` from <https://raw.githubusercontent.com/Fyrd/caniuse/master/data.json>.
1. Get a local copy of `html.json` from <https://raw.githubusercontent.com/w3c/mdn-spec-links/master/html.json>.
1. Get the HTML spec source file `source` by checking out [whatwg/html](https://github.com/whatwg/html).
1. Run the following command:

   ```sh
   curl https://build.whatwg.org/wattsi --verbose \
        --form build=default \
        --form sha=d3adb33f \
        --form source=@source \
        --form caniuse=@caniuse.json \
        --form mdn=@html.json \
        --output output.zip
   ```

The result will be a ZIP file containing the output of Wattsi! It will also contain an `output.txt` file containing the stdout output of Wattsi, which might contain warnings or similar things you want to check out.

(NOTE: if you get a non-200 response, the resulting zip file will actually be a text file containing some error text. To account for this, you may want to use [a more complicated incantation](https://github.com/whatwg/html-build/blob/18bdae0a716c47e326abb6312357fcc8d696a7f2/build.sh#L655-L677).)

## Other Features

You can send the query string parameter `quiet` to pass the `--quiet` option to Wattsi.

You can send the query string paramter `single-page-only` to pass the `--single-page-only` option to Wattsi.

The response will have a header, `Wattsi-Exit-Code`, which gives the exit code of Wattsi. This will always be `0` for a 200 OK response, but a 400 Bad Request could give a variety of different values, depending on how Wattsi failed.

You can hit the `/ping` endpoint with a GET to check to see if the server is working. It should return the `text/plain` response `All good here`.

## Server Development Info

This server requires the following to run:

- [Node.js](https://nodejs.org/) 11.4.0 or later
- [7zip](http://www.7-zip.org/) in your path as `7za`
- And, of course, [Wattsi](https://github.com/whatwg/wattsi)

To set up the server remember to do `npm install --production`. Also, copy `config.sample.json` to `config.json` and edit things appropriately.

Then, to start it running, just do `npm start`.
