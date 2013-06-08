import tornado.ioloop
import tornado.web
import tornado.httpclient
import tornado.gen
import logging
import urllib

logger = logging.getLogger('MessageUpdatesHandler:')
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

class MessageUpdatesHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        
    def get(self):
        logger.info ('somebody call me')
        http = tornado.httpclient.HTTPClient()
        # response = http.fetch('http://tomato.ics.uci.edu:19101/query?query=use%20dataverse%20UCINow;%0Afor%20$l%20in%20dataset(%22UCILocation%22)%20return%20$l.fullname;')
        response = http.fetch(query(location_list_query))
        self.write(response.body)
        json = tornado.escape.json_decode(response.body)
        logger.info("Fetched " + str(len(json["results"][0])) + " entries "
                   "from the Asterix")
        self.finish()    

application = tornado.web.Application([
    (r"/", MessageUpdatesHandler),
])

if __name__ == "__main__":
    application.listen(3000)
    tornado.ioloop.IOLoop.instance().start()
