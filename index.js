var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;

var config = hexo.config.pandoc;
var filters = [], extra = [], meta = [], math = '--mathjax';
if(config) {
  if(config.filters) {
    config.filters.forEach(function(filter) {
      filters.push('--filter');
      filters.push(filter);
    });
  }

  if(config.extra) {
    for(var e in config.extra) {
      extra.push('--' + e);
      extra.push(config.extra[e]);
    }
  }

  if(config.meta) {
    config.meta.forEach(function(m) {
      meta.push('-M');
      if(m.length) {
        meta.push(m);
      } else {
        for(var m2 in m) {
          meta.push(m2 + '=' + m[m2]);
        }
      }
    });
  }

  if(config.mathEngine) {
    if(typeof config.mathEngine === 'string') {
      math = '--' + config.mathEngine;
    }
  }
};

var pandocRenderer = function(format) {
  return function(data, options, callback){
    var args = [ '-f', format, '-t', 'html', math, '--smart']
      .concat(filters)
      .concat(extra)
      .concat(meta);

    var src = data.text.toString();

    var pandoc = spawn('pandoc', args);

    var result = '';
    var error = '';

    pandoc.stdout.setEncoding('utf8');

    pandoc.stdout.on('data', function (data) {
      result += data.toString();
    });

    pandoc.stderr.on('data', function (data) {
      error += data.toString();
    });

    pandoc.stdin.write(src, 'utf8');

    pandoc.on('close', function (code, signal) {
      var msg = '';
      if (code !== 0)
        msg += 'pandoc exited with code '+code+(error ? ': ' : '.');
      if (error)
        msg += error;
      if (msg)
        return callback(new Error(msg));
      else{
        if (result === '') console.log("The next file error: ");
        callback(null, result);
      }
    });

    pandoc.stdin.end();
  }
}

var pandocRendererSync = function(format) {
  return function(data, options){
    var args = [ '-f', format, '-t', 'html', math, '--smart']
      .concat(filters)
      .concat(extra)
      .concat(meta);

    var src = data.text.toString();

    var pandoc = spawnSync('pandoc', args, { input: src, encoding: 'utf8' });

      var msg = '';
      if (pandoc.status !== 0)
        msg += 'pandoc exited with code '+code+(pandoc.stderr ? ': ' : '.');
      if (pandoc.stderr)
        msg += pandoc.stderr;
      if (msg)
        return msg;
      else{
        if (pandoc.stdout === '') console.log("The next file error: ");
        return pandoc.stdout;
      }

  }

}

hexo.extend.renderer.register('md', 'html', pandocRenderer('markdown'));
hexo.extend.renderer.register('md', 'html', pandocRendererSync('markdown'), true);
hexo.extend.renderer.register('mmd', 'html', pandocRenderer('markdown_mmd'));
hexo.extend.renderer.register('mmd', 'html', pandocRendererSync('markdown_mmd'), true);
hexo.extend.renderer.register('mw', 'html', pandocRenderer('mediawiki'));
hexo.extend.renderer.register('mw', 'html', pandocRendererSync('mediawiki'), true);
