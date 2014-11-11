var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var users = {};
var fs = require('fs');
var https = require('https');
var SenseApp;


var sensehostname = 'win-6mdp3q63fnj'
var certificate = "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\"+sensehostname+"\\client.pem";


mongoose.connect('mongodb://localhost/chat', function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log('successfully connected to mongodb');
	}
});

var chatSchema = mongoose.Schema({
	nick: String,
	appid: String,
	appName: String,
	msg: String,
	created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);



app.get('/', function(req, res){
  res.sendFile('/index.html', { root: 'C:\\Users\\qlik\\Documents\\Extension-work\\AppChat-Node' });
});



io.on('connection', function(socket){
	var appname = ''
	console.log('got a connection');


	socket.on('new appuser', function(data, callback) {
		socket.app = data.appid;
		socket.nickname = data.nick;
		users[socket.nickname]= socket;
		updateNicknames();
		socket.room = data.appid;
		socket.join(socket.room, function(err) {
			console.log('room '+socket.room+': '+data.nick+' joined.')
		});

		var rightnow = new Date();
		var isonow = rightnow.toISOString();

		//io.to(socket.room).emit('chat message', {msg:'some chatty message', created: isonow});

		var appname_options = {
	        rejectUnauthorized: false,
	        hostname: sensehostname,
	        port: 4242,
	        path: '/qrs/app/'+data.appid+'?xrfkey=abcdefghijklmnop',
	        method: 'GET',
	        headers: {
	              'X-Qlik-xrfkey' : 'abcdefghijklmnop',
	              'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
	            },
	       key: fs.readFileSync(certificate),
	       cert: fs.readFileSync(certificate)
	    };



	      https.get(appname_options, function(res) {
	        //console.log(res)
	          res.on("data", function(chunk) {
	            //console.log(chunk)
	            var chunkjson = JSON.parse(chunk);
	             //console.log(chunkjson);
	             appname=chunkjson.name;
	             console.log(appname)

	        });
	      }).on('error', function(e) {
	      console.log("Got error: " + e.message);
	      });    

	      //************ Fetch old messages from Mongo for new app user *************
			Chat.distinct('appid', function(err, apps) {
				if (err) {throw err} else {
					//socket.join(appName)
					console.log('querying apps');
					//console.log(apps)
					for(var i=0; i < apps.length; i++) {
						appid=apps[i]
						//console.log('app name: '+apps[i])
						//socket.emit('chat message', docs[i]);
						var mongodbsort = {
					    	"sort": "created"
						}	
						Chat.find({appid: socket.app}, function(err, docs) {
							if (err) {throw err} else {
								//console.log('sending old messages');
								//console.log(docs)
								for(var i=0; i < docs.length; i++) {
									console.log('trying to emit to room looping: '+appid);
									console.log('docs: '+docs[i])
									io.to(socket.app).emit('chat message', {msg: docs[i].msg, created: docs[i].created, nick: docs[i].nick, id:docs[i].id});

									console.log('id from mongo message: '+docs[i].id)
									//io.to(appid).emit('chat message', docs[i]);
								}
							}
						},mongodbsort);
					}
				}
			});	



	});

	function updateNicknames() {
		io.sockets.emit('usernames', Object.keys(users));
	}



	var appName = ''



	  
  socket.on('chat message', function(data, callback){
  	//console.log(io.sockets)
  	var msg = data.trim();
	var newMsg = new Chat({msg: msg, nick: socket.nickname, appid: socket.app, appName: appname})
	//console.log(newMsg)
	//console.log('appid: '+newMsg.appid)
	//console.log('newnick: '+socket.nickname)
	newMsg.save(function(err) {
		if (err) {throw err} else {
			io.to(socket.app).emit('chat message', {msg: msg, nick: socket.nickname, appid: socket.app, appName: appname});
			console.log('chat msg emitted to '+socket.app)
		}
	})
    //console.log(msg)
  });

	//   // Server Side Rooms
	// socket.on('subscribe', function(roomName) {
	// 	console.log('subscribed to: '+roomName)
	//     socket.join(roomName);
	// });


 

});


http.listen(3000, function(){
  console.log('listening on *:3000');
});