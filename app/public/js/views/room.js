
$(document).ready(function(){
	
	var rv = new RoomValidator();
	var rc = new RoomController();
	
	$('#room-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			return rv.validateForm();
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') $('.modal-alert').modal('show');
		},
		error : function(e){
			if (e.responseText == 'name-taken'){
			    rv.showInvalidRoomName();
			}
		}
	});
	$('#room-name').focus();
	
// customize the account signup form //
	
	$('#room-form h2').text('Create Room');
	$('#room-form #sub2').text('Choose a room name');
	$('#room-form-btn1').html('Cancel');
	$('#room-form-btn2').html('Submit');
	$('#room-form-btn2').addClass('btn-primary');
	
// setup the alert that displays when an account is successfully created //

	$('.modal-alert').modal({ show:false, keyboard : false, backdrop : 'static' });
	$('.modal-alert .modal-header h4').text('Room Created!');
	$('.modal-alert .modal-body p').html('Your room has been created.</br>Click OK to manage your room settings.');

});