
function RoomValidator()
{
// build array maps of the form inputs & control groups //

	this.formFields = [$('#room-name'), $('#room-desc'), $('#room-type')];
	this.controlGroups = [$('#room-name-cg'), $('#room-desc-cg'), $('#room-type-cg')];
	
// bind the form-error modal window to this controller to display any errors //
	
	this.alert = $('.modal-form-errors');
	this.alert.modal({ show : false, keyboard : true, backdrop : true});
	
	this.validateRoomName = function(s)
	{
		return s.length >= 3;
	}
	
	this.showErrors = function(a)
	{
		$('.modal-form-errors .modal-body p').text('Please correct the following problems :');
		var ul = $('.modal-form-errors .modal-body ul');
			ul.empty();
		for (var i=0; i < a.length; i++) ul.append('<li>'+a[i]+'</li>');
		this.alert.modal('show');
	}

}

RoomValidator.prototype.showInvalidRoomName = function()
{
	this.controlGroups[2].addClass('error');
	this.showErrors(['That username is already in use.']);
}

RoomValidator.prototype.validateForm = function()
{
	var e = [];
	for (var i=0; i < this.controlGroups.length; i++) this.controlGroups[i].removeClass('error');
	if (this.validateName(this.formFields[0].val()) == false) {
		this.controlGroups[0].addClass('error'); e.push('Please Enter Your Room Name');
	}
	if (e.length) this.showErrors(e);
	return e.length === 0;
}

	