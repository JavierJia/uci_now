List = (function(){
	function List(client){
		console.log('[list.js] init')
		this.socket = client;
	}

	List.prototype.receive_msg = function(obj){
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