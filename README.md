# Wattsi Server

This app is a build server to allow you to run [Wattsi](https://github.com/whatwg/wattsi) without having to actually install it locally. Which is really useful, since not everyone has a Free Pascal compiler lying around.

Currently it is located on an AWS server. You can use it as follows:

1. Get local files:
  1. `caniuse.json` from https://raw.githubusercontent.com/Fyrd/caniuse/master/data.json
  1. `w3cbugs.csv` from https://www.w3.org/Bugs/Public/buglist.cgi?columnlist=bug_file_loc,short_desc&query_format=advanced&resolution=---&ctype=csv
1. Get the HTML spec source file `source` by checking out [whatwg/html](https://github.com/whatwg/html).
1. Run the following command:

   ```sh
   curl http://ec2-52-88-42-163.us-west-2.compute.amazonaws.com -f -v \
        -F source=@source \
        -F caniuse=@caniuse.json \
        -F w3cbugs=@w3cbugs.csv \
        > output.zip
   ```

The result will be a ZIP file containing the output of Wattsi!

(NOTE: if you get an error, the resulting zip file will actually be a text file containing that error. Does anyone know a better CURL command that would output to stderr or similar in that case?)

## Server Development Info

This server requires the following to run:

- [io.js](https://iojs.org/) 3.2.0 or later
- [7zip](http://www.7-zip.org/) in your path as `7za`
- And, of course, [Wattsi](https://github.com/whatwg/wattsi)

To set up the server remember to do `npm install --production`. Also, copy `config.sample.json` to `config.json` and edit things appropriately.

Then, to start it running, just do `npm start`.
