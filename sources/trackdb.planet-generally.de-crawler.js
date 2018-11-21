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


var base = "http://trackdb.planet-generally.de/"
var startpage = "http://trackdb.planet-generally.de/";
var outdir = "tracks/planet/";
var trkcache = outdir + "trkcache.list";

var fs = require('fs');
var fstream = require('fstream');
var crawler = require("crawler");
var unzip = require("unzip");
var $ = require("jquery");

var maxNavPages = 1;
var maxTracks = 1;
var iNavPage = 0;
var iTrack = 0;

fs.existsSync(outdir) || fs.mkdirSync(outdir);


var queuedAllNavPages = false;
var c = new crawler({
    rateLimit: 4000, // `maxConnections` will be forced to 1
    userAgent: "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:63.0) Gecko/20100101 Firefox/63.0",
    callback: function(err, res, done){
        if(err || res.statusCode != 200){
          console.error("ERROR");
          console.error("Return code: "+ res.statusCode);
          console.error(err.stack);
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
            var url = base +""+ value.attribs.href;
            // Compare with list of already downloaded !!!!
            if(iTrack < maxTracks) {
              c.queue(url);
              console.log("Add to queue (track page) : "+ url);
              iTrack++;
            }
          });

/*
          // Download link to track file
          // $("html body div#container div#outer div#inner div#content div.gallery p a[rel='nofollow']")
          res.$("div#container div#outer div#inner div#content div.gallery p a[rel='nofollow']").each( function( key, value ) {
            var url = base +""+ value.attribs.href;
            //cbin.queue(url);  ---> ACHTUNG REDIRECT
            console.log("Add to queue (track file) : "+ url);
          });
*/

          // Add all pages of navigation to queue (just once)...
          if(!queuedAllNavPages) {
            queuedAllNavPages = true;

            //$.each( res.$("a.pages_count").attr("href"), function( key, value ) {
            res.$("a.pages_count").each( function( key, value ) {
              var url = base +""+ value.attribs.href;
              if(iNavPage < maxNavPages) {
                c.queue(url);
                console.log("Add to queue (nav page) : "+ url);
                iNavPage++;
              }
            });
          }
        } else
        if(pagetitle == "Track details") {
            // Parse metadata
            // Title
            var trkID = res.request.uri.href.replace(/.*id=/,'');;
            var trkTitle = res.$("table.trk_info h2").text().split(']')[1].trim();
            var trkCat = res.$("table.trk_info h2").text().split('[')[1].split(']')[0].trim();
            var trkDate = res.$("table.trk_info tr:first-child td:nth-child(2) p:nth-child(2)").text().match(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/);
            var trkAuthor = res.$("table.trk_info tr:first-child td:nth-child(2) p:nth-child(2) a").text().trim();
            var trkVersion = res.$("table.trk_info tr:first-child td:nth-child(2) p:nth-child(2) a").text().match(/v.*$/)
            var trkLicense = ""; //...
            res.$("table.trk_info tbody tr td p a.tip span").each( function( key, value ) {  trkLicense += value[key].text() +"\n";  });
            var trkWorldsize = res.$("table.trk_info tr td:first-child p:nth-child(2)").text().split('|')[0].split(':')[1].trim();
            var trkLength = res.$("table.trk_info tr td:first-child p:nth-child(2)").text().split('|')[1].split(':')[1].trim();
            var trkPhoto = base +""+ res.$("table.trk_info a[rel='lightbox']").attr("href").trim();
            //var trkDownload = base +" "+ res.$("table.trk_info a[rel='nofollow']").attr("href").trim();  // Redirect to http://trackdb.planet-generally.de/include/getfile_track.php?id=761
            var trkDownload = base +"include/getfile_track.php?id="+ trkID;
            var trkText = res.$("table.trk_info tr:first-child td:nth-child(2) p:nth-child(4)").text().trim();
            var trkAll = res.$("table.trk_info").text().trim(); // remove spaces / extract with html
            // OR extract html to pdf
            console.log("NEW TRACK...");
            console.log("trkTitle : "+ trkTitle);
            console.log("trkCat : "+ trkCat);
            console.log("trkDate : "+ trkDate);
            console.log("trkAuthor : "+ trkAuthor);
            console.log("trkVersion : "+ trkVersion);
            console.log("trkLicense : "+ trkLicense);
            console.log("trkWorldsize : "+ trkWorldsize);
            console.log("trkLength : "+ trkLength);
            console.log("trkPhoto : "+ trkPhoto);
            console.log("trkDownload : "+ trkDownload);
            console.log("trkText : "+ trkText);
            console.log("trkAll : "+ trkAll);
            console.log("****************");

            // Write metadata to humanreadable JSON file
            // meta/planet/<CAT>/<TRK>-meta.json
            // If the track is stored in a zip file, extract this data
            // and rename the files to meta/planet/<CAT>/<TRK>-<ORIGINALFILENAME>
            //  except for the <TRK>.txt


            // Download track...
            var trkDir = outdir +""+ trkCat +"/";
            fs.existsSync(trkDir) || fs.mkdirSync(trkDir);
            var trkFilename = trkDir +""+ trkTitle +".trk";
            cbin.queue({uri:trkDownload,filename:trkFilename});
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

          console.log("res.options.filename: "+res.options.filename);

          var attachment = res.headers['content-disposition'].replace(/.*filename=/,'');
          var dirname = res.options.filename.replace(/[^\/]*$/,'');
          attachment =  dirname +""+ attachment;

          console.log("attachment: "+attachment);

          if(attachment == "") attachment = res.options.filename;

          fs.createWriteStream(attachment).write(res.body);
            // if format is zip, unpack it
            // move trk to tracks/<SOURCE>/
            // other to trackinfos/<SOURCE>/
          if(attachment.endsWith(".zip")) {
            var readStream = fs.createReadStream(attachment);
            var writeStream = fstream.Writer(dirname);
            readStream
            .pipe(unzip.Parse())
            .pipe(writeStream)
          }

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



function endText() {
  console.log("");
  console.log("Download is successfully DONE!");
  console.log("You can find your tracks in the directory");
  console.log(outdir);
  console.log("Copy this folder to C:\\Program Files\\generally\\tracks\\");
  console.log("and have fun.");
}
