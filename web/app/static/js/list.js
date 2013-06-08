List = (function(){
	function List(client){
		console.log('[list.js] init')
		this.socket = client;
	}

	List.prototype.receive_msg = function(obj){
		// list result into listview
 		//     var struct = this.container.find('li.' + 'message' + ':first');
          // var msg = struct.clone();
          // msg.find('.time').text((new Date()).toString("HH:mm:ss"));
          // var matches;
          // if (matches = obj['message'].match(/^\s*[\/\\]me\s(.*)/)) {
          //   msg.find('.user').text(obj['user'] + ' ' + matches[1]);
          //   msg.find('.user').css('font-weight', 'bold');
          // } else {
          //   msg.find('.user').text(obj['user']);
          //   msg.find('.message').text(': ' + obj['message']);
          // }
          // if (obj['user'] == this.username) msg.find('.user').addClass('self');
          // this.container.find('ul').append(msg.show());
	}

	return List;
})();