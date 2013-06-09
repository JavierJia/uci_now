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

        $('#searchbox').submit(function(){
            var date = $('#datepicker').val();
            var text = $('#searchbox:searchtext').val();
            console.log('[client.js] send search on text:' + text + ' @' + date);
            _this.send({ action: 'search', date: date, text: text});
        });
    }

    Client.prototype.receive = function(evt) {
        console.log("[client.js] receive: ", evt.data);
        var obj = $.parseJSON(evt.data);
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


