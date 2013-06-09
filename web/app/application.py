import os
import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.httpclient
import tornado.gen
import logging
import urllib
import datetime

logger = logging.getLogger('MapMessage:')
logger.setLevel(logging.DEBUG)

def url(query):
    return tornado.escape.url_escape(query)

QUERY_PREFIX='http://tomato.ics.uci.edu:19002/query?query='
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
where spatial-distance($l.gps, create-point(%f,%f)) < 0.001
return $l;
'''

query_websoc_join_location_bygps = '''
use dataverse UCINow;

for $l in dataset('UCILocation')
for $class in dataset('WebSoc')
where spatial-distance($l.gps, create-point(%f,%f)) < 0.001 
    and matches ($class.place, $l.abbr) 
    and matches ($class.weekday, '%s' )
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

set simfunction "jaccard";
set simthreshold "0.3f";

let $p := create-point(%f,%f)

for $class in dataset('UCISeminar')
where $class.date = date('%s')
return  {
'title': $class.title,
'starthour':hour($class.startTime),
'startmin':minute($class.startTime),
'endhour':hour($class.endTime),
'endmin':minute($class.endTime),
'location':$class.location,
'contact':$class.contact,
'description':$class.description,
'lat':33.64337,
'lng':-117.841974
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
        # logger.info("position:(%f,%f) on date:%s" % (parsed['lat'], parsed['lng'], parsed['date']))

        http = tornado.httpclient.HTTPClient()
        
        logger.info('fetch websoc:\n\t' + query(query_websoc_join_location_bygps 
            %(parsed['lat'],parsed['lng'],
                ['M','Tu','W','Th','F','Sa','Su'][
                    datetime.date(*(int(x) for x in (parsed['date'].split('-')))).weekday()]
        )))
        response = http.fetch(query(query_websoc_join_location_bygps 
            %(parsed['lat'],parsed['lng'],
                ['M','Tu','W','Th','F','Sa','Su'][
                    datetime.date(*(int(x) for x in (parsed['date'].split('-')))).weekday()]
        )))

        json = {}
        if (len(response.body) > 0):
            try:
                json['websoc'] = tornado.escape.json_decode(response.body)['results']
                logger.debug(json)
            except Exception,e:
                logger.debug(str(e))
                pass
            
        logger.info('fetch seminar:\n\t'+query(query_seminar_join_location_bygps 
            %(parsed['lat'],parsed['lng'],parsed['date'])))
        response = http.fetch(query(query_seminar_join_location_bygps 
            %(parsed['lat'],parsed['lng'],parsed['date'])))

        logger.debug('seminar body' + response.body)
        if(len(response.body)>0):
            try:
                json['seminar'] = tornado.escape.json_decode(response.body)['results']
                logger.debug(json)
            except Exception, e:
                logger.debug(str(e))
                pass
            

        self.write_message(json)

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
