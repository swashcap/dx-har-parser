'use strict';

const fs = require('fs');
const queryString = require('query-string');
const url = require('url');

const URL_PATTERN = /devnode\.mind\.unm\.edu\//;

module.exports = {
  readHar,
};

if (require.main === module) {
  readHar(process.argv[2]).then(console.log, console.error);
}

function readHar(filePath) {
  if (!filePath) {
    return Promise.reject(new Error('File path required'));
  }

  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(parseHar(JSON.parse(data.toString())));
      }
    });
  });
}

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
        try {
          responseData = JSON.parse(response.content.text.slice(
            'parent._jqjsp(\''.length, // trim from start
            response.content.text.length - '\')'.length // trim from end 
          ).replace(/\n/g, '\\n'));
        } catch (error) {
          debugger;
          throw error;
        }
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

