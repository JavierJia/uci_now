
$(function() {
    $("#datepicker").datepicker();
  });

Client = (function(){
    function Client(){
        console.log("[client.js] init");
        var url = 'ws://' + window.location.host;
        var socketClass = 'MozWebSocket' in window ? MozWebSocket : WebSocket;
        this.connection = new socketClass(url + '/map');

        this.map = new Map(this); 
        this.list   = new List(this);
        
        var _this = this;         
        $(window).on('beforeunload', function() { _this.close() });    
        this.connection.onmessage = function(evt) { _this.receive(evt) }
    }

    Client.prototype.receive = function(evt) {
        console.log("[client.js] receive: ", evt.data);
        var obj = $.evalJSON(evt.data);
        if (typeof(obj) != 'object') 
            { return }
        this.map.receive_msg(obj);
        this.list.receive_msg(obj);
    }

    Client.prototype.send = function(json) {
        var string = JSON.stringify(json);
        console.log("[client.js] send: ", string);
        this.connection.send(string);
    }

    Client.prototype.close = function() {
        this.connection.close();
    }
    return Client;
}
)();


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

