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
//  npm install crawler jquery unzip
//


var base = "http://trackdb.planet-generally.de/"
var startpage = "http://trackdb.planet-generally.de/";
var trkDir = "tracks/[TRACK DB]]/";
var trkDirByCat = "tracks/";
var trkDirByAuthor = "tracks/";
var photoDir = "photos/[TRACK DB]]/";
var zipDir = "zips/[TRACK DB]]/";
//var metaDir = "trackinfos/[TRACK DB]]/";
var trkcache = trkDir + "trkcache.list";

var fs = require('fs');
var path = require('path');
var fstream = require('fstream');
var crawler = require("crawler");
var unzip = require("unzip");
var $ = require("jquery");

var maxNavPages = 1;
var maxTracks = 1;
var iNavPage = 0;
var iTrack = 0;

fs.existsSync(trkDir) || fs.mkdirSync(trkDir);
fs.existsSync(photoDir) || fs.mkdirSync(photoDir);
fs.existsSync(zipDir) || fs.mkdirSync(zipDir);

String.prototype.startsWithI = function(s){
    this.match(new RegExp('^'+s, 'i'));
}

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
            var trk = {};
            trk.ID = res.request.uri.href.replace(/.*id=/,'');;
            trk.Title = res.$("table.trk_info h2").text().split(']')[1].trim();
            trk.Cat = res.$("table.trk_info h2").text().split('[')[1].split(']')[0].trim();
            trk.Date = res.$("table.trk_info tr:first-child td:nth-child(2) p:nth-child(2)").text().match(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/);
            trk.Author = res.$("table.trk_info tr:first-child td:nth-child(2) p:nth-child(2) a").text().trim();
            trk.Version = res.$("table.trk_info tr:first-child td:nth-child(2) p:nth-child(2) a").text().match(/v.*$/)
            trk.License = ""; //...
               res.$("table.trk_info tbody tr td p a.tip span").each( function( key, value ) {  trk.trkLicense +=""+ value[key].text() +"\n";  });
            trk.Worldsize = res.$("table.trk_info tr td:first-child p:nth-child(2)").text().split('|')[0].split(':')[1].trim();
            trk.Length = res.$("table.trk_info tr td:first-child p:nth-child(2)").text().split('|')[1].split(':')[1].trim();
            trk.Photo = base +""+ res.$("table.trk_info a[rel='lightbox']").attr("href").trim();
            //trk.Download = base +" "+ res.$("table.trk_info a[rel='nofollow']").attr("href").trim();  // Redirect to http://trackdb.planet-generally.de/include/getfile_track.php?id=761
            trk.Download = base +"include/getfile_track.php?id="+ trk.ID;
            trk.Text = res.$("table.trk_info tr:first-child td:nth-child(2) p:nth-child(4)").text().trim();
            trk.All = res.$("table.trk_info").text().trim(); // remove spaces / extract with html
            // OR extract html to pdf
            console.log("NEW TRACK...");
            console.log("trk.ID : "+ trk.ID);
            console.log("trk.Title : "+ trk.Title);
            console.log("trk.Cat : "+ trk.Cat);
            console.log("trk.Date : "+ trk.Date);
            console.log("trk.Author : "+ trk.Author);
            console.log("trk.Version : "+ trk.Version);
            console.log("trk.License : "+ trk.License);
            console.log("trk.Worldsize : "+ trk.Worldsize);
            console.log("trk.Length : "+ trk.Length);
            console.log("trk.Photo : "+ trk.Photo);
            console.log("trk.Download : "+ trk.Download);
            console.log("trk.Text : "+ trk.Text);
            console.log("trk.All : "+ trk.All);
            console.log("****************");

            // Write metadata to humanreadable JSON file
            // meta/planet/<CAT>/<TRK>-meta.json
            // If the track is stored in a zip file, extract this data
            // and rename the files to meta/planet/<CAT>/<TRK>-<ORIGINALFILENAME>
            //  except for the <TRK>.txt


            // Download track...
            var downloadFile = trkDir +""+ trk.Title +".TRK";
            console.log("Add to b-queue (track file) : "+ trk.Download);
            cbin.queue({uri:trk.Download,filename:downloadFile,trk});

            // Download Screenshot
            console.log("Add to b-queue (screenshot file) : "+ trk.Photo);
            cbin.queue({uri:trk.Photo,filename:photoDir+trk.Title+".jpg",trk});
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

          console.log(res.headers);
          var downloadFile = ""
          if(res.headers['content-disposition']) downloadFile = res.headers['content-disposition'].replace(/.*filename=/,'');
          var dirname = res.options.filename.replace(/[^\/]*$/,'') +"/";
          downloadFile =  dirname +""+ downloadFile;
          if(downloadFile == "") downloadFile = res.options.filename;


          if(downloadFile.endsWith(".trk")) {
            downloadFile = trkDir + path.basename(downloadFile);
            fs.createWriteStream(downloadFile).write(res.body); // Save download
            // var trkDirByCat = "tracks/";
            // var trkDirByAuthor = "tracks/";
            console.log("downloadFile: "+downloadFile);
            console.log("trkDirByCat: "+trkDirByCat +res.options.trk.Cat+ path.basename(downloadFile));
            console.log("trkDirByAuthor: "+trkDirByAuthor +res.options.trk.Author+ path.basename(downloadFile));
            fs.existsSync(trkDirByCat +res.options.trk.Cat) || fs.mkdirSync(trkDirByCat +res.options.trk.Cat);
            fs.existsSync(trkDirByAuthor +res.options.trk.Author) || fs.mkdirSync(trkDirByAuthor +res.options.trk.Author);
            fs.copyFile(downloadFile, trkDirByCat +res.options.trk.Cat+ path.basename(downloadFile), (err) => { if (err) throw err; });
            fs.copyFile(downloadFile, trkDirByAuthor +res.options.trk.Author+ path.basename(downloadFile), (err) => { if (err) throw err; });
          } else
          if(downloadFile.endsWith(".zip")) {
            downloadFile = zipDir + path.basename(downloadFile);
            fs.createWriteStream(downloadFile).write(res.body); // Save download
//            fs.rename(downloadFile, downloadFile2, function (err) {            })              if(err) throw err              console.log(downloadFile +' =>'+ downloadFile2);
            var readStream = fs.createReadStream(downloadFile).pipe(unzip.Parse())
                  .on('entry', function (entry) {
                    var fileName = entry.path;
                    if(fileName.endsWith(".trk")) {
                      downloadFile = dirname + fileName;
                      entry.pipe(fs.createWriteStream(downloadFile));
                      console.log("downloadFile: "+downloadFile);
                      console.log("trkDirByCat: "+trkDirByCat +res.options.trk.Cat+ path.basename(downloadFile));
                      console.log("trkDirByAuthor: "+trkDirByAuthor +res.options.trk.Author+ path.basename(downloadFile));
                      fs.existsSync(trkDirByCat +res.options.trk.Cat) || fs.mkdirSync(trkDirByCat +res.options.trk.Cat);
                      fs.existsSync(trkDirByAuthor +res.options.trk.Author) || fs.mkdirSync(trkDirByAuthor +res.options.trk.Author);
                      fs.copyFile(downloadFile, trkDirByCat +res.options.trk.Cat+ path.basename(downloadFile), (err) => { if (err) throw err; });
                      fs.copyFile(downloadFile, trkDirByAuthor +res.options.trk.Author+ path.basename(downloadFile), (err) => { if (err) throw err; });
                    }
                  });
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
  console.log(trkDir);
  console.log("Copy this folder to C:\\Program Files\\generally\\tracks\\");
  console.log("and have fun.");
}
