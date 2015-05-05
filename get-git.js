var fs = require('fs');
var childProcess = require('child_process');
var CronJob = require('cron').CronJob;
var config = require('./config.js');
var obj = {};
var dir = __dirname +'/jsonData';
var nodeDir = require('node-dir');
var oauth;
var mongoose = require('mongoose');
var mongoURI = process.env.CUSTOMCONNSTR_MONGOLAB_URI || 'mongodb://localhost/meangit2';


//The oauth.js file is git ignored, this is to keep the Oauth secret
//To generate one for development see 
// https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization
try {
  stats = fs.lstatSync('./oauth.js');

  if(stats.isFile()){
    var auth = require('./oauth.js');
    oauth = auth;
   } 

} catch (e) {
    oauth = process.env.OAUTH;
}

/* Set cronjob to run at 12am */
 try {
  var job = new CronJob('0 0 23 * * *', function(){ 
    cleanUp();
  }, null, true, "America/Los_Angeles");

 } catch(ex) {
     console.log('cron pattern not valid');
 } finally {
   cleanUp();
 }

/*Cleans out the jsonData dir and database*/
function cleanUp() {
  /*Delete the database*/
  var conn = mongoose.createConnection(mongoURI, function(err){
    conn.db.dropDatabase(function(err){
        conn.close();
    })
  });

  /*Clean out the jsonData dir*/
  nodeDir.files(dir, function(err, files) {
    if (err) throw err;
    for(var x = 0; x < files.length; x++){
      fs.unlinkSync(files[x]);
    }
    /*Repopulate the jsonData dir and database*/
    getRepos();
  });
}

/* Get the top 200 most forked JS repos */
function getRepos() {
  childProcess.exec('curl ' + oauth + ' "https://api.github.com/search/repositories?page=1&per_page=100&q=+language:Javascript&sort=forks&order=desc" > topfirst100ForkedJSRepos.txt && curl ' + oauth + ' "https://api.github.com/search/repositories?page=2&per_page=100&q=+language:Javascript&sort=forks&order=desc" > topsecond100ForkedJSRepos.txt', function(error, stdout, stderr){
    if(error != null){
      console.log('exec error: ', error);
    }
    else{
      console.log('Saved 100 to top200ForkedJSRepos.txt\n');
      readObjects();
    }
  });
}

/* Read output from files and parse and store in JSON objext */
function readObjects(){
  obj = JSON.parse(fs.readFileSync('topfirst100ForkedJSRepos.txt', 'utf8'));
  var obj2 = JSON.parse(fs.readFileSync('topsecond100ForkedJSRepos.txt', 'utf8'));
  for(var i = 0; i < obj2.items.length; i++){
    obj.items.push(obj2.items[i]);
  }
  parseData(obj.items.length);
}

/* Read in 200 js files and perform get request to package.json and bower.json contents */
function parseData(len){
  var counter = 0;
  for(var i = 0; i < len; i++){
    childProcess.exec('curl ' + oauth + ' "https://raw.githubusercontent.com/' + obj.items[i].full_name + '/master/package.json" > ' + dir + '/'+ obj.items[i].name + '.package.json.txt' + '&& curl ' + oauth + ' "https://raw.githubusercontent.com/' + obj.items[i].full_name + '/master/bower.json" > ' + dir + '/'+ obj.items[i].name + '.bower.json.txt', function(error, stdout, stderr){
      if(error != null){
        console.log('exec error: ', error);
        counter++;
        readFileReady(counter, len);
      }
      else{
        counter++;
        console.log('\nSaved contents file ', counter);
        readFileReady(counter, len);
      }
    });
  }
}

/*Check to see if all the Repos have been processed*/
function readFileReady(counter, length){
  if(counter === length){
    config.readJsonFiles();
  }
}
