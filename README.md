# Wattsi Server

This app is a build server to allow you to run [Wattsi](https://github.com/whatwg/wattsi) without having to actually install it locally. Which is really useful, since not everyone has a Free Pascal compiler lying around.

Currently it is located on an AWS server. You can use it as follows:

1. Get local files:
  1. `caniuse.json` from https://raw.githubusercontent.com/Fyrd/caniuse/master/data.json
  1. `w3cbugs.csv` from https://www.w3.org/Bugs/Public/buglist.cgi?columnlist=bug_file_loc,short_desc&query_format=advanced&resolution=---&ctype=csv
1. Get the HTML spec source file `source` by checking out [whatwg/html](https://github.com/whatwg/html).
1. Run the following command:

   ```sh
   curl https://build.whatwg.org.com/wattsi --verbose \
        --form source=@source \
        --form caniuse=@caniuse.json \
        --form w3cbugs=@w3cbugs.csv \
        --output output.zip
   ```

The result will be a ZIP file containing the output of Wattsi! It will also contain an `output.txt` file containing the stdout output of Wattsi, which might contain warnings or similar things you want to check out.

(NOTE: if you get a non-200 response, the resulting zip file will actually be a text file containing some error text. To account for this, you may want to use [a more complicated incantation](https://github.com/whatwg/html-build/blob/0cfe5e055b6f3291bfc4222b20efc4346b456b95/build.sh#L176-L188).)

### Options

You can also send the query string `?quiet` to pass the `--quiet` option to Wattsi.

## Server Development Info

This server requires the following to run:

- [Node.js](https://nodejs.org/) 5.3.0 or later
- [7zip](http://www.7-zip.org/) in your path as `7za`
- And, of course, [Wattsi](https://github.com/whatwg/wattsi)

To set up the server remember to do `npm install --production`. Also, copy `config.sample.json` to `config.json` and edit things appropriately.

Then, to start it running, just do `npm start`.
