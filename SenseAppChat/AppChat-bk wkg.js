require.config({
        paths: {
            socketio: 'http://localhost:3000/socket.io/socket.io.js'
        }
});

define(["jquery","socketio","text!./css/style.css"], function($, io,cssContent) {
	$("<style>").html(cssContent).appendTo("head");
	    return {
	    	resize: function() {

        	},
        	paint: function ($element) {
				var socket = io.connect('http://localhost:3000');
				console.log(socket)
				console.log('connected?: '+socket.connected)
				console.log('disconnected?: '+socket.disconnected)
				socket.on( 'connect', function(err) {
					if (err) {
						console.log(err);
					} else {
						console.log()
					}
					socket.emit('chat message', 'some message');
					console.log('socket connected ok supposedly in socket.onconnect');
				});
				// console.log(socket)
				// console.log('socket connected');

				var html="<div class='extdiv'><ul id='messages'></ul><form action=''><input id='m' autocomplete='off' /><button>Send</button></form></div>"
				$element.html(html);
				    $('form').submit(function(){
			        socket.emit('chat message', $('#m').val());
			        console.log('submitted form')
			        //io.sockets.in("room name").emit("your message"); //send to everyone incl. me
			        //socket.broadcast.to("room name").emit("your message"); //send to everyone except me
			        //$('#m').val('');
			        return false;
			      });
			      socket.on('chat message', function(msg){
			        $('#messages').append($('<li>').text(msg));
			      });

			      socket.on('room name', function(msg){
			        $('#messages').append($('<li>').text(msg));
			      });

				//$element.html(html);
        }
    };

});
