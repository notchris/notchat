	var socket = io.connect('http://localhost:3000', {
	    transports: ['websocket'],
	    upgrade: false
	});

	socket.on('connect', function(data){
		socket.emit('init');
		joinRoom(0)
	});

	var connected = [];
	var rooms;

	socket.on('rooms', function(data){
		rooms = data;
	});

	// listener, whenever the server emits 'updatechat', this updates the chat body
	socket.on('chat', function (room, username, data, time, color) {

		data = $("<div/>").html(data).text();

		if (username !== ''){

			$('#room'+room+' ul').append('<li class="list-group-item message"><a style="color:'+color+';" class="author" href="#">'+username+':</a>&nbsp;&nbsp;<span style="color:'+color+';">'+data+'</span><div class="time"><small>'+time+'</small></div></li>');

		} else{

			$('#room'+room+' ul').append('<li class="list-group-item message text-muted"><span><em><small>'+data+'</small></em></span><div class="time"><small>'+time+'</small></div></li>');
		}
		$('#room'+room).scrollTop($('#room'+room)[0].scrollHeight);
	});

	// listener, whenever the server emits 'updaterooms', this updates the room the client is in
	socket.on('updaterooms', function(roomid) {
		   if( $.inArray(roomid, connected) == -1 ){
      			connected.push(roomid);

      			$.each(rooms,function(i){
      				if (rooms[i]._id === roomid){
      					var roomtype;
      					if (rooms[i].type === "Public"){
      						roomtype = "fa-globe"
      					}
      					if (rooms[i].type === "Private"){
      						roomtype = "fa-lock"
      					}

		  				$('.roomlist').append('<li class="nav-item"><a class="nav-link" data-id="'+rooms[i]._id+'" href="#room'+rooms[i]._id+'"><i class="fa '+roomtype+'"></i> '+rooms[i].name+' <span data-id="'+rooms[i]._id+'" class="float-right closeRoom"><i class="fa fa-times"></i></span></a></li>');
		  				$('.roomcontent').append('<div class="tab-pane room" data-id="'+rooms[i]._id+'" id="room'+rooms[i]._id+'" role="tabpanel"><ul class="list-group"><li class="list-group-item list-group-item-info"><span>Welcome to '+rooms[i].name+'.</span><span class="desc">'+rooms[i].desc+'</span></li></ul></div>');
		  				$('.roomlist a[href="#room'+rooms[i]._id+'"]').tab('show');		
      				}
      			})
   			}
	});

	socket.on('updateusers', function(users){
		$('.users table tbody').empty();
		$.each(users,function(i, value) {
			$('.users table tbody').append('<tr><td><a class="userInfo" data-user="'+users[i].user+'" href="#" data-toggle="modal" data-target="#user">'+users[i].user+'</a></td><td><button type="button" data-container="body" data-toggle="popover" data-placement="top" data-content="<ul class=list-group><li class=list-group-item>View Broadcast</li></ul>" class="btn btn-sm btn-link"><i class="fa fa-video-camera"></i></button></td><td><button type="button" class="btn btn-sm btn-link" data-toggle="tooltip" data-placement="top" title="'+users[i].country+'"><i class="fa fa-globe"></i></button></td><td><button type="button" data-container="body" data-toggle="popover" data-placement="top" data-content="<ul class=list-group><li class=list-group-item>Mute User</li><li class=list-group-item><span class=text-danger>Block User</span></li></ul>" class="btn btn-sm btn-link"><i class="fa fa-cog"></i></button></td></tr>');
		});
	});

	// Join Rooms

	$('body').on('click','.join',function(){
		var newroom = $(this).data('room');
		if( $.inArray(newroom, connected) == -1 ){
			joinRoom(newroom);
		} else{
			console.log('Already connected to room: '+newroom);
		}
	});

	$('body').on('click','.roomlist a',function (e){
	  e.preventDefault()
	  $(this).tab('show')
	});

	$('body').on('click','.closeRoom',function (e){
	  e.preventDefault()
	  leaveRoom($(this).data('id'));
	});



	function switchRoom(room){
		socket.emit('switchRoom', room);
	}

	function joinRoom(room){
		$.each(rooms,function(i){
			if (rooms[i]._id === room){
				if (rooms[i].type === "Private"){
					console.log('Attempting to join private room: '+room)
					alert('This room is private bruh.');
				} else{
					console.log('Attempting to join public room: '+room)
					socket.emit('joinRoom', room);
				}
			}
		})
	}

	function leaveRoom(room){
		console.log('Leaving room: '+room)

		$.each(connected,function(i,value){
			if (connected[i] === room){
				console.log('Removing room: '+ connected[i])
				connected = $.grep(connected, function(value) {
				  return value != room;
				});
			}
		})
		$('.roomlist a:first').tab('show')
		console.log(connected)
		$('[data-id="'+room+'"').remove();
		socket.emit('leaveRoom', room);
	}
	
	// on load of page
	$(function(){

		$('body').on('click','.userInfo',function(){
			var user = $(this).data('user');
			$.ajax({
			  type: 'GET',
			  url: '/users/'+user,
			  success: function(user){
			  	$('.profile h5.profileUser').text(user['user']);
			  	$('.profile .modal-body').append('<div class="container-fluid"><div class="row"><div class="col-sm-5"><img class="img-thumbnail img-fluid profilePhoto" src="'+user['photo']+'"/><button class="btn btn-secondary btn-block">Add to Friends</button><button class="btn btn-secondary btn-block">Send Message</button></div><div class="col-sm-7"><ul class="list-group profileInfo"><li class="list-group-item"><span>Name:</span>'+user['name']+'</li><li class="list-group-item"><span>Country:</span>'+user['country']+'</li><li class="list-group-item"><button class="btn btn-sm btn-warning">A</button>&nbsp;<button class="btn btn-sm btn-primary">M</button>&nbsp;<button class="btn btn-sm btn-default">10</button></li></ul></div></div></div>');
			  }
			});
		});

		$('#user').on('hidden.bs.modal', function (e) {
			$('.profile .modal-body').empty();
		})


		// when the client clicks SEND
		$('#send').click( function() {
			console.log('Chat')
			var color = $('#color input').val();
			var message = $('#data').val();
			var rm = $('.room.active').data('id');

			// tell server to execute 'sendchat' and send along one parameter
			if ($('#data').val() !== ''){
				socket.emit('message', rm,message,color);
			}
			$('#data').val('');
			$('#data').focus();
		});

		// when the client hits ENTER on their keyboard
		$('#data').keypress(function(e) {
			if(e.which == 13) {
				$(this).blur();
				$('#send').focus().click();
			}
		});

	});