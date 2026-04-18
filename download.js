const fs = require('fs');
const https = require('https');

const urls = {
  "home.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2YwYzkyZDI5MGVjNjQ3ODI5YTkxYjQ0MWRlMGJjMjBlEgsSBxDL66e52BIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTg0OTc0OTI5NjE2Nzg0MDA3Mw&filename=&opi=89354086",
  "lobby.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgwYmQ2ZGU2ZGZhZjRlZDFiNGE2MzQ3MTgwY2M3ZTI5EgsSBxDL66e52BIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTg0OTc0OTI5NjE2Nzg0MDA3Mw&filename=&opi=89354086",
  "raid.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzlmMDA4ZjAzOGM0ODRiZThiZGQ2ZThlNmI5ZTEyY2E3EgsSBxDL66e52BIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTg0OTc0OTI5NjE2Nzg0MDA3Mw&filename=&opi=89354086",
  "revive.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzA5OWNkYzU4MjA1MjQzMjlhODU4NGUwYjNhNGFhNzhkEgsSBxDL66e52BIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTg0OTc0OTI5NjE2Nzg0MDA3Mw&filename=&opi=89354086"
};

for (const [filename, url] of Object.entries(urls)) {
  const file = fs.createWriteStream(filename);
  https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) {
    fs.unlink(filename, () => {});
    console.error('Error downloading ' + filename + ': ', err.message);
  });
}
