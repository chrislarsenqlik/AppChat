require.config({
        paths: {
            socketio: 'http://localhost:3000/socket.io/socket.io.js'
        }
});

define(["jquery","socketio","text!./css/style.css", "qlik"], function($, io,cssContent, qlik) {
	$("<style>").html(cssContent).appendTo("head");
	    return {
	    	initialProperties: {
                version: 1,
                user: {
                    qStringExpression: "=purgechar('UserId=',subfield(OSUser(), ';', 2))"
                }
            },
	    	resize: function() {
        	},
        	paint: function ($element,layout) {
        		console.log(layout.user)
        		var _this=this;
        		var ThisApp = qlik.currApp();
        		var ThisAppId = ThisApp.id;
        		var loadedchats = [];
        		//var testinguser = layout.user;
        		var ThisUser='qlik';
        		//console.log(testinguser);

    //     		qlik.currApp().variable.getContent('CurrentUser',function ( reply ) {
				// 		ThisUser=reply.qContent.qString
				// 		//console.log('thisuser: '+ThisUser)
				// 		//return reply.qContent.qString
				// });      
        		
				var socket = io.connect('http://localhost:33333');
				

				socket.on( 'connect', function(err) {
					if (err) {
						console.log(err);
					} else {
						//socket.emit("subscribe", ThisAppId);
						//socket.in(ThisAppId).emit('test message');
						console.log('new user part: '+ThisUser)
						socket.emit('new appuser', {'nick' : ThisUser, 'appid': ThisAppId});
						console.log('app id: '+ThisAppId)
						//socket.join(ThisAppId);
					}
				});

				var html="<div class='extdiv'><table><tr><td ><p id='welcome'><h1>Welcome to AppChat!</h2></p></td></tr></table><form action=''><input id='m' autocomplete='off'>  <button>Send</button></form><ul id='messages'></ul></div>"
				
				$element.html(html);
				
				$('#welcome').fadeIn('2000');
				$('#welcome').delay('5000').fadeOut();

				// $('#m').on("keypress", function(event) {
    //                     if (event.keyCode == 13) {
                            
    //                     }

    //             });

				$('form').submit(function(){
			        socket.emit('chat message', $('#m').val());
			        $('#m').val('')
			        return false;
			    });

				var msgid = 0
				var prevmsgid = 0
			    socket.on('chat message', function(msg){
			      	prevmsgid=msgid
			      	msgid+=1
			      	console.log(msg)
			      	if (msg.created)  {
			      		var msgdatetimeISO = new Date(Date.parse(msg.created))
			      		console.log('using mongo msg date: '+msg.created)
			      		console.log('defined create date!: '+msgdatetimeISO)
			      	} else {
			      		
			      		var rightnow = new Date();
			      		console.log('using right now: '+rightnow)
			      		var msgdatetimeISO = rightnow;
			      	}
			      	var curr_date = msgdatetimeISO.getDate();
					var curr_month = msgdatetimeISO.getMonth();
					var curr_year = msgdatetimeISO.getFullYear();
					var curr_hour = msgdatetimeISO.getHours();
					mins_tmp = msgdatetimeISO.getMinutes().toString();
					if (mins_tmp.length===1) { var curr_mins = '0'+mins_tmp } else {var curr_mins = mins_tmp};
			      	var msgdatetime = curr_month + "-" + curr_date + "-" +  curr_year+" "+curr_hour+':'+curr_mins;
			      	var msgid = msg.id
			      	console.log('msg id: '+msg.id)
			      	if (loadedchats.indexOf(msg.id) > -1) { //don't load messages being emitted that have already been loaded
			      		console.log(msg.id+' already loaded')
			      		console.log(loadedchats)
			      	} else if (!msgid) {                    //if coming from new chat message
			      		$('<li>').html('<table><td><b>'+msg.nick+'</b>: '+msg.msg+'</td><td align=right><font size=1>'+msgdatetime+'</font></td></table>').prependTo($('#messages')).fadeIn('slow');
			      		console.log(loadedchats)
			      		console.log('did not add null msgid to loadedchats')
			      	} else {                                 //if the messages are coming from loading from mongo upon new connection
			      		$('<li>').html('<table><td><b>'+msg.nick+'</b>: '+msg.msg+'</td><td align=right><font size=1>'+msgdatetime+'</font></td></table>').prependTo($('#messages')).fadeIn('slow');
			      		loadedchats.push(msg.id);
			      		console.log(loadedchats)
			      		console.log('added '+msg.id+' to loadedchats')
			      	}

			      	//loadedchats.push(msg.id);
			      	//console.log(loadedchats)
			    });

		      	socket.on('room name', function(msg){
		       		$('#messages').append($('<li>').text(msg.msg));
		      	});
        }
    };

});
