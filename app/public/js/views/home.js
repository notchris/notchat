
$(document).ready(function(){

	var hc = new HomeController();
	var av = new AccountValidator();

	$('#startBroadcast').on('click',function(){
		var broadcastUser = $(this).data('user');
		console.log('Start broadcast: ' + broadcastUser);
		$('#myBroadcast').append('<iframe scrolling="no" frameborder="0" src="http://localhost:8888/?user='+broadcastUser+'"></iframe>');
		$(this).hide();
		$('#stopBroadcast').show();
	});
	$('#stopBroadcast').on('click',function(){
		$('#myBroadcast iframe').remove();
		$(this).hide();
		$('#startBroadcast').show();
	});
	
	$('#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (av.validateForm() == false){
				return false;
			} 	else{
			// push the disabled username field onto the form data array //
				formData.push({name:'user', value:$('#user-tf').val()})
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') hc.onUpdateSuccess();
		},
		error : function(e){
			if (e.responseText == 'email-taken'){
				av.showInvalidEmail();
			}	else if (e.responseText == 'username-taken'){
				av.showInvalidUserName();
			}
		}
	});
	$('#name-tf').focus();

// customize the account settings form //
	
	$('#account-form h2').text('Account Settings');
	$('#account-form #sub1').text('Here are the current settings for your account.');
	$('#user-tf').attr('disabled', 'disabled');
	$('#account-form-btn1').html('Delete');
	$('#account-form-btn1').addClass('btn-danger');
	$('#account-form-btn2').html('Update');

// setup the confirm window that displays when the user chooses to delete their account //

	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
	$('.modal-confirm .modal-header h4').text('Delete Account');
	$('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');
	$('.modal-confirm .cancel').html('Cancel');
	$('.modal-confirm .submit').html('Delete');
	$('.modal-confirm .submit').addClass('btn-danger');

	$('#color').colorpicker({
		'container': $('.compose'),
		'color': '#333333'
	});

	$(function () {
	  $('[data-toggle="tooltip"]').tooltip()
	  $('[data-toggle="popover"]').popover({
	  	html: true,
	  	trigger: 'focus'
	  })
	})

});
