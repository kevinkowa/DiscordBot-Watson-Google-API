var Discord = require('discord.js');
var auth = require('./auth.json');
var watson = require('./watson_func');
const Translate = require('@google-cloud/translate');

//initialize local mysql.
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "mydb"
});

con.connect(function(err) {
    if (err) throw err
});
// Instantiates a client
const translate = new Translate({
  keyFilename: './translate.json'
});

// Initialize Discord Bot
const token = auth.token;

var bot = new Discord.Client();
bot.on("ready", () => {
    console.log("I'm ready");
});

//set watson ready to act.
tone_analyzer = watson.getToneAnalyzer();
language_translator = watson.getLanguageTranslator();


bot.on('message', message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.author.bot) return;
    if (message.content.length > 1) {
        console.log(message.content);
        user = message.author["username"];

        //commands available, make sure you add a help command, or other commands that you want
        if (message.content.substring(0, 2) == 'k!') {
            var args = message.content.substring(2).split(' ');
            var cmd = args[0];

            if(cmd == "toxic" && args.length == 1){
                getToxicNumber(user, message);    
            }
            else if(cmd == "toxic" && args.length == 2){
                getToxicNumber(args[1], message);
            }
            else if(cmd == "top5"){
                getTop5Toxic(message);
            }
            return;
        }
        var userData = null;
        //find and add user to the database if it doesn't exist.
        con.query("SELECT * FROM user WHERE name = '"+user+"'", function (err, result) {
            if (err) throw err;
            if (result == null || result.length == 0)
            {
                var sql = "INSERT INTO user (name, toxic) VALUES ('"+user+"', 0)";
                con.query(sql, function (err, result) {
                    if (err) throw err;
                    console.log("1 record inserted");
                });
            }
            else
                userData = result;
        });
        /*
            options for google translate api.
            translate the message of discord from spanish to english.
            You might not need this if you are only going to handle english msgs.
        */
        var options = {
          from: 'es',
          to: 'en'
        };
        // translate text
        translate.translate(message.content, options, function(err, translation) {
            console.log(err);
            if (!err) {
                console.log(translation);
                var sentence = translation;

                //parameters for watson tone analyzer
                var tone_params = {
                    'tone_input': sentence,
                    'content_type': 'text/plain',
                    'content_language': 'en',
                    'accept_language' : 'es',
                    'sentences': false
                };
                //perform tone analyzer
                tone_analyzer.tone(tone_params, function(error, response) {
                    if (error)
                        console.log('error:', error);
                    else{
                        //get list of tones.
                        tones = response["document_tone"]["tones"];
                        //var ans ="Tonos del mensaje de "+ message.author+": \n";

                        //look of the angry tone and increase toxic value for the current user.
                        tones.forEach(function(value){
                            if(value["tone_name"] == "Ira")
                            {
                                var toxic_num = 0;
                                if (userData != null)
                                    toxic_num = userData[0]["toxic"];
                                var sql = "UPDATE user SET toxic = "+(toxic_num+1)+" WHERE name = '"+user+"'";
                                con.query(sql, function (err, result) {
                                if (err) throw err;
                                    console.log(result.affectedRows + " record(s) updated for toxic");
                                });
                                console.log(userData[0]["name"]);
                            }
                            //ans+=value["tone_name"] + " por: "+ (value["score"] * 100)+"%\n";
                        });
                        //if(tones.length > 0)
                            //message.channel.send(ans);
                        console.log(JSON.stringify(response, null, 2));
                    }
                });
            }

        });
     }
});

//connect discord bot.
bot.login(token);


//get the toxic value of user.
function getToxicNumber(user, message){

    con.query("SELECT * FROM user WHERE lower(name) = '"+(user).toLowerCase()+"'", function (err, result) {
        if (err) throw err;
        if (result == null || result.length == 0)
        {
            console.log("null in getToxicNumber");
            userInfo = null;
        }
        else
            userInfo = result;

        if(userInfo == null)
            message.channel.send(0);
        else
            message.channel.send(userInfo[0]["toxic"]);
    });
}
//get the top 5 toxic users.
function getTop5Toxic(message){
    //SELECT amount FROM mytable ORDER BY amount DESC LIMIT 5
    con.query("SELECT * FROM user ORDER BY toxic DESC LIMIT 5", function (err, result) {
        if (err) throw err;
        if (result == null || result.length == 0)
        {
            console.log("null in getTop5Toxic");
            userInfo = null;
        }
        else
            userInfo = result;

        if(userInfo == null)
            message.channel.send("No results");
        else{
            var ans = "Top 5 Toxic Users:\n";
            for(var i=0; i<userInfo.length;i++){
                ans+="#"+(i+1)+" - "+userInfo[i]["name"]+" Toxic: "+userInfo[i]["toxic"]+"\n";
            }
            message.channel.send(ans);
        }
    });
}