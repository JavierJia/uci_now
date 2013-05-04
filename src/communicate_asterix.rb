require 'open-uri'
require 'yajl'
require 'restclient'
require './logger.rb'

ASTERIX_SERVER = "http://127.0.0.1:19101"
DDL_POINT = ASTERIX_SERVER + "/ddl?ddl="
UPDATE_POINT = ASTERIX_SERVER + "/update?statements="
QUERY_POINT = ASTERIX_SERVER + "/query?query="

CREATE_AQL = '../aql/creat_database.aql'
ADM_DIR = '../data/adm/'

Logger = Logger.new

def load_script_format (database, filename)
    leadstr = 'use dataverse UCINow;'
    leadstr += "load dataset #{database} using localfs (('path'='127.0.0.1://#{filename}'),('format'='adm'));"
end

def form_param(str)
    return URI.encode(str)
end

def parse_response(response)
    message = Yajl::Parser.parse(response)
    if message != nil and message['error-code'] != nil
        Logger.warning message['error-code']
        raise 'AsterixError '
    end
end

def request_to_database(entrypoint, params)
    RestClient.get(entrypoint + params){ |response, request, result, &block|
        case response.code
        when 200
            Logger.info "Recieved Response"
            parse_response response
        else 
            Logger.info response
            raise 'NetWorkStuff'
        end
    }
end

def creat_ddl ()
    Logger.info 'create ddl'
    request_to_database(DDL_POINT, form_param(File.open(CREATE_AQL).read)) 
end

def load_ddl_websoc ()
    Dir.glob( ADM_DIR + 'websoc/*.adm') do |adm|
        Logger.info 'load ' + adm
        request_to_database(UPDATE_POINT, form_param(load_script_format('WebSoc', File.absolute_path(adm)))) \
            if File.size(adm) > 0
    end
end

creat_ddl
load_ddl_websoc
