// Crawler file
// to download all tracks form the source
// http://trackdb.planet-generally.de
// to local directory so you can play all the tracks
// without manually downloading.
//
// If you run this script again, it will look into 
// trkcache.list and only download new tracks.
//
// Benjamin Schmidt <schmidi2@directbox.com>
// Date 2018-11-18 20:36
//
// License
//
// Install
//  npm install crawler jquery
//


var startpage = "http://trackdb.planet-generally.de/";
var outdir = "tracks/trackdb.planet-generally.de/";
var trkcache = "tracks/trackdb.planet-generally.de/trkcache.list";

var fs = require('fs');
var crawler = require("crawler");
var $ = require("jquery");



fs.existsSync(outdir) || fs.mkdirSync(outdir);


var queuedAllNavPages = false;
var c = new crawler({
    rateLimit: 4000, // `maxConnections` will be forced to 1
    userAgent: "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:63.0) Gecko/20100101 Firefox/63.0",
    callback: function(err, res, done){
        if(err || res.statusCode != 200){
          console.log("ERROR");
          console.log("Return code: "+ res.statusCode);
          console.log(err);
          done();
        }

        // Parse site
        // Site type:
        // Overview of many tracks
        // Page of track
/*        console.log(err);
        console.log(res);
        console.log(done);*/
        console.log(res.$("title").text());
        console.log(res.$("div#content h1").text());

        var pagetitle = res.$("div#content h1").text();
        if(pagetitle == "Track Gallery") {
          // Link to page with track metadata
          // $("html body div#container div#outer div#inner div#content div.gallery > a")
//          $.each( res.$("div#container div#outer div#inner div#content div.gallery > a").attr("href"), function( key, value ) {
          res.$("div#container div#outer div#inner div#content div.gallery > a").each( function( key, value ) {
            var url = startpage +""+ value.attribs.href;
            //c.queue(url);
            // Compare with list of already downloaded !!!!
            console.log("Add to queue (track metadata) : "+ url);
          });

          // Download link to track file
          // $("html body div#container div#outer div#inner div#content div.gallery p a[rel='nofollow']")
          res.$("div#container div#outer div#inner div#content div.gallery p a[rel='nofollow']").each( function( key, value ) {
            var url = startpage +""+ value.attribs.href;
            //cbin.queue(url);  ---> ACHTUNG REDIRECT
            console.log("Add to queue (track file) : "+ url);
          });

          // Add all pages of navigation to queue (just once)...
          console.log("First page : "+ res.$("a.pages_count").attr("href"));
          if(!queuedAllNavPages) {
            queuedAllNavPages = true;

            //$.each( res.$("a.pages_count").attr("href"), function( key, value ) {
            res.$("a.pages_count").each( function( key, value ) {
              var url = startpage +""+ value.attribs.href;
              //c.queue(url);
              console.log("Add to queue (nav page) : "+ url);
            });
          }
        } else
        if(pagetitle == "Track details") {
            // Parse metadata
            // Title
            var trktitle="":
            // Author
            // Date
            // License
            // OR extract html to pdf
            console.log("New track : "+ trktitle);
        }
        done();
    }
});

c.queue(startpage);


var cbin = new crawler({
    encoding:null,
    jQuery:false,// set false to suppress warning message.
    callback:function(err, res, done){
        if(err){
            console.error(err.stack);
        }else{
            fs.createWriteStream(res.options.filename).write(res.body);
            // if format is zip, unpack it
            // move trk to tracks/<SOURCE>/
            // other to trackinfos/<SOURCE>/
        }
        done();
    }
});


// Queue tracks
/*c.queue({
    uri:"https://nodejs.org/static/images/logos/nodejs-1920x1200.png",
    filename:"nodejs-1920x1200.png"
});*/

// Queue track metadata and create a beautiful pdf
//  with image, text, source etc
// One pdf per track and one master pdf document.


console.log("");
console.log("Download is successfully DONE!");
console.log("You can find your tracks in the directory");
console.log(outdir);
console.log("Copy this folder to C:\\Program Files\\generally\\tracks\\");
console.log("and have fun.");
