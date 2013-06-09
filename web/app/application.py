import os
import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.httpclient
import tornado.gen
import logging
import urllib

logger = logging.getLogger('MapMessage:')
logger.setLevel(logging.DEBUG)

def url(query):
    return urllib.quote(query)

QUERY_PREFIX='http://tomato.ics.uci.edu:19101/query?query='
def query(aql):
    return QUERY_PREFIX + url(aql)

location_list_query = '''
    use dataverse UCINow;
    for $l in dataset UCILocation
    return {
    "buildid":$l.buildid,
    "fullname":$l.fullname,
    "abbr":$l.abbr
    };
    '''
query_websoc_byclassname = '''
use dataverse UCINow;

for $class in dataset('WebSoc')
where like ( $class.course, "%MULTILMED%")
return {
'dept' :$class.dept,
'weekday':$class.weekday
}
'''

query_location_bygps = '''
use dataverse UCINow;

for $l in dataset('UCILocation')
where spatial-distance($l.gps, create-point(33.64337,-117.841974)) < 0.001
return $l;
'''

query_websoc_join_location_bygps = '''
use dataverse UCINow;

for $l in dataset('UCILocation')
for $class in dataset('WebSoc')
where spatial-distance($l.gps, create-point(33.64337,-117.841974)) < 0.001 and matches ($class.place, $l.abbr) and matches($class.weekday, 'W' )
return  {
"college":$class.college,
"dept": $class.dept,
"name":$class.course,
"instructor":$class.instructor,
"loop":$class.weekday,
"time":$class.timestr,
"location":$class.place,
'lat':get-x($l.gps),
'lng':get-y($l.gps)
}
'''

query_seminar_join_location_bygps = '''
use dataverse UCINow;

for $l in dataset('UCILocation')
for $class in dataset('UCISeminar')
where spatial-distance($l.gps, create-point(33.64337,-117.841974)) < 0.001 and matches ($class.location, $l.abbr) 
return  {
'title': $class.title,
'date':$class.date,
'location':$class.location,
'starttime': $class.startTime,
'contact':$class.contact,
'description':$class.description
}
'''

class MessageUpdatesHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        
    def get(self):
        logger.info ('somebody test me')
        http = tornado.httpclient.HTTPClient()
        response = http.fetch(query(location_list_query))
        self.write(response.body)
        json = tornado.escape.json_decode(response.body)
        logger.info("Fetched " + str(len(json["results"][0])) + " entries "
                   "from the Asterix")
        self.finish()    

class HomeHandle(tornado.web.RequestHandler):
    def get(self):
        logger.info ('somebody entered')
        self.render("index.html")
        # self.write(open('index.html','r').read())

class MapHandler(tornado.websocket.WebSocketHandler):
    def on_message(self, message):
        logger.info("got message %r", message)
        parsed = tornado.escape.json_decode(message)
        logger.info("position:(%f,%f) on date:%s" % (parsed['lat'], parsed['lng'], parsed['date']))
        self.write_message(parsed)
        # click = {
        #     "lat": parsed["lat"],
        #     "lon": parsed["lon"],
        #     "date": parsed["date"],
        #     "raidius": parsed["raidius"],
        # }
        # chat["html"] = tornado.escape.to_basestring(
        #     self.render_string("message.html", message=chat))

class SearchHandler(tornado.web.RequestHandler):
    def get(self):
        logger.info ('somebody entered')
        self.render("index.html")
        

application = tornado.web.Application([
    (r"/", HomeHandle),
    (r"/test", MessageUpdatesHandler),
    (r"/map", MapHandler),
    (r"/search", SearchHandler),
],
template_path=os.path.join(os.path.dirname(__file__), "template"),
static_path=os.path.join(os.path.dirname(__file__), "static"),
)

if __name__ == "__main__":
    application.listen(3000)
    tornado.ioloop.IOLoop.instance().start()
