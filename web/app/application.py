import os
import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.httpclient
import tornado.gen
import logging
import urllib
import datetime
from queryformat import *

logger = logging.getLogger('MapMessage:')
logger.setLevel(logging.DEBUG)

def url(query):
    return tornado.escape.url_escape(query)

QUERY_PREFIX='http://tomato.ics.uci.edu:19002/query?query='
def query(aql):
    return QUERY_PREFIX + url(aql)


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
        if (parsed['action']== 'click'):
            self.on_click(parsed)
        elif(parsed['action']=='search'):
            self.on_search(parsed)
        else:
            logger.error('MapHandler: Invalid request:' + message)

    def on_search(self,parsed):
        logger.info("MapHandler: on_search: text: %s , @date: %s" %(parsed['text'], parsed['date']))
        http = tornado.httpclient.HTTPClient()
        logger.info('MapHandler: on_search: query_bysearch_websoc')
        json = {}
        jsoncache = self.asterix_query(http, query_bysearch_websoc %(parsed['text'],parsed['date']))
        if jsoncache is not None:
            json['websoc'] = jsoncache['results']
            logger.info('MapHandler: on_search: request return %d' % len(jsoncache))

        logger.info('MapHandler: on_search: query_bysearch_seminar')
        jsoncache = self.asterix_query(http, query_bysearch_seminar %(parsed['text'], parsed['date']))
        if jsoncache is not None:
            json['seminar'] = jsoncache['results']
            logger.info('MapHandler: on_search: request return %d' % len(jsoncache))
        if len(json) > 0:
            self.write_message(json)

    def asterix_query(self, http, querystr):
        response = http.fetch(query(querystr))
        if(len(response.body)>0):
            try:
                json = tornado.escape.json_decode(response.body)
                return json
            except Exception, e:
                return None
        return None

    def on_click(self, parsed):
        logger.info("MapHandler: on_click: position:(%f,%f) on date:%s" % (parsed['lat'], parsed['lng'], parsed['date']))
        http = tornado.httpclient.HTTPClient()
        json = {}
        logger.info('MapHandler: on_click: query_websoc_join_location_bygps')
        jsoncache = self.asterix_query(http, query_websoc_join_location_bygps 
            %(parsed['lat'],parsed['lng'],
                ['M','Tu','W','Th','F','Sa','Su'][
                    datetime.date(*(int(x) for x in (parsed['date'].split('-')))).weekday()])
            )
        if jsoncache is not None:
            json['websoc'] = jsoncache['results']
            logger.info('MapHandler: on_click: request return %d' % len(jsoncache))

        logger.info('MapHandler: on_click: query_seminar_join_location_bygps')
        jsoncache = self.asterix_query(http, query_seminar_join_location_bygps%(parsed['lat'],parsed['lng'],parsed['date']))
        if jsoncache is not None:
            json['seminar'] = jsoncache['results']
            logger.info('MapHandler: on_click: request return %d' % len(jsoncache))
        if len(json) > 0:
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
