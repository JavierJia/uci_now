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

// function loadBuildingList(){ 
//     // var ws = new WebSocket('ws://' + window.location.host + '/client');
//     // ws.onopen = function() {
//     //    ws.send("Hello, world");
//     // };
//     // ws.onmessage = function (evt) {
//     //    alert(evt.data);
//     // };   
//     $.ajax({
//             url: "http://tomato.ics.uci.edu:3000/test",
//             type:"GET",
//             dataType:"json",
//             data:"",
//             complete:function(resp){ 
                                
//                 var txt = resp.responseText;
//                 //json format
//                 var json = $.parseJSON(txt);
                                
//                 //jquery dom model processing
//                 var items = json.results[0];
//                 var $template = $("#template");
//                 for(var i = 1;i<items.length && i < 25;i++){
//                     var $tr = $template.find("tr[id='tempRow']").clone();
//                     $tr.get(0).id="t" + i;
//                     var x = eval('(' + items[i] + ')');
//                     $tr.find(".buildid").html(x.buildid);
//                     $tr.find(".fullname").html(x.fullname);
//                     $tr.find(".abbr").html(x.abbr);
//                     $template.append($tr);
//                 }

//                 $template.show();
//             }
//         })
// }