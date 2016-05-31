var express = require('express');
var router = express.Router();
var stream;
ip = function(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0]
  || req.connection.remoteAddress;
}
router.get('/tracker/:stream/:session/:evento/:utime/:w/:h/:ref', function(req, res, next) {

  o = {}
  o.stream  = req.params.stream;
  o.session = req.params.session;
  o.time    = Date.now();
  o.utime   = parseInt(req.params.utime)
  evento    = req.params.evento;

  stats = db.collection('stats');
  // stats.ensureIndex({ session: 1, stream: 1 });

  busc = { session: o.session, stream: o.stream };

  stats.findOne(busc, function(err, r) {

    if (r) {

      if(evento=='load') {
        r.load = o.utime;
      } else {
        r.playing.push(o.time);
        if(r.load>100000) r.load = o.utime - r.load;
      }
      stats.update(busc, r, function(){

        res.send(r);
      })

    } else {

      o.ip = ip(req)
      o.referer = req.params.ref;
      o.iframe  = req.headers.referrer || req.headers.referer

      o.load = o.utime;
      o.playing = [];

      var parser = require('ua-parser-js');
      ua = req.headers['user-agent'];
      uap = parser(ua);

      o.type = uap.device.type; // "mobile" / null
      device = /;\s*([^;]+)\s+Build\//g.exec(ua); // "Sony xperia" / ""
      o.device = (device!=null) ? device[1] : ''; // = uap.device; // object

      o.os = uap.os.name+' '+uap.os.version // "Android 4.4.2" / "Windows 7"
      o.engine = uap.engine.name+' '+uap.engine.version // "WebKit 537.36"
      o.browser = uap.browser.name+' '+uap.browser.major // "Chrome 50"

      stats.insert(o, function(){
        res.send(r);
      });
    }
  });
});


module.exports = router;


// function getHits(base, hace){
//   stats = db.collection('stats');
//   return stats.find({ 
//     stream: stream,
//     playing: { $gte: base, $lte: hace }
//   }).count();
// }

// router.get('/:stream/json/:time', function(req, res, next){

//    arr = [];
//    now = Date.now()
//    time = req.params.time;
//    stream = req.params.stream;

//    stats = db.collection('stats');

//    if(time=='todo'){

//      for (var i = 120; i >= 0; i--) { // media hora: cada 10 seg
//        hace = now - i * 10*1000 - 30*1000
//        hits = 0;
//        // hits = getHits(hace-30*1000, hace);
//        arr.push([hace, hits]);
//      }
//    } else {
//      hace = now-30*1000 // hace 30 seg
//      base = hace-30*1000;
//      // hits = getHits(hace-30*1000, hace)

//      stats.find({ 
//        stream: stream,
//        playing: { $gte: base, $lte: hace }

//      }).count(function(err, r) {
//        console.log([hace, r])
//        res.send([hace, r])
//      });
//    }
//   // res.send('ok');

// });
