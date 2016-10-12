'use strict';

const fs = require('fs');
const queryString = require('query-string');
const url = require('url');

const URL_PATTERN = /devnode.mind.unm.edu\/(.*[^favicon])/;
const RESPONSE_PATTERN = /^parent._jqjsp\((.*)'\)$/m;

fs.readFile(process.argv[2], (error, data) => {
  if (error) {
    console.error(error);
  } else {
    console.log(parseHar(JSON.parse(data.toString())));
  }
});

function parseHar(har) {
  return har.log.entries.reduce((memo, { request, response }) => {
    if (URL_PATTERN.test(request.url) && response.status) {
      const parsedUrl = url.parse(request.url);
      const parsedQuery = queryString.parse(parsedUrl.query);
      let responseData;

      // Parse the request's `json` query param as JSON
      if ('json' in parsedQuery && parsedQuery.json) {
        parsedQuery.json = JSON.parse(parsedQuery.json); 
      }

      // Parse the response's content as JSON
      if ('text' in response.content && response.content.text) {
        responseData = JSON.parse(response.content.text.slice(
          'parent._jqjsp(\\'.length, // trim from start
          response.content.text.length - '\')'.length // trim from end 
        ).replace(/\n/g, '\\n'));
      }

      return memo.concat({
        request: {
          raw: parsedUrl.href,
          method: request.method,
          query: parsedQuery,
        },
        response: {
          data: responseData,
          raw: response.content.text,
          status: response.status,
        },
      });
    }

    return memo;
  }, []);
}

