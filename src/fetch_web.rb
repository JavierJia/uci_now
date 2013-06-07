require 'rubygems'
require 'restclient'
require 'nokogiri'
require 'open-uri'
require 'yajl'

REQUEST_URL= "http://websoc.reg.uci.edu/perl/WebSoc"
HTML_DIR = "../data/html/websoc"
ADM_DIR = "../data/adm/websoc"

GPS_PATH = "../data/gps.txt"

time_mark = ['timestart','timestop']

def reqest_by_dept(dept)
    if page = RestClient.post(REQUEST_URL, { 
        'YearTerm'=>'2013-14', 
        'ShowFinals' => 'on',
        'Breadth' => 'ANY',
        'Dept' => dept,
            'Division' => 'ANY',
            'ClassType' => 'ALL',
            'FullCourses' => 'ANY',
        'FontSize' => 100,
        'CancelledCourses' => 'Exclude',
        'Submit'=>'Display+Web+Results'})

        dept = dept.gsub('/','-')
        File.open("#{HTML_DIR}/soc-#{dept}.html", 'w'){|f| f.write page.body}
    end 
end

def encode(hash)
    #return Yajl::Encoder.encode(message)
    message = '{ '
    hash.each do |key, value|
        message += '"' + key + '":' 
        if key == 'max' or key == 'code' or key == 'buildid'
            message += value
        elsif key == 'gps'
            message += 'point("' + value.strip()[1..-2] + '")'
        elsif key == 'timestart' or key == 'timestop' or key == 'startTime' or key == 'endTime'
            message += 'time("' + value + '")'
        elsif key == 'date'
            message += 'date("' + value + '")'
        else
            message += '"' + value.gsub('"','&quot') + '"'
        end
        message += ','
    end
    message[-1] = ' }'
    return message
end

def format_time(hash, weektime)
    hash['weekday'] = weektime[0].strip
    timestr = ''
    weektime[1..-1].each {|part| timestr +=part.strip if part =~ /\d/}
    hash['timestr'] = timestr.strip
    if timestr.split('-').length == 2
        afternoon = timestr.end_with? 'p'
        hash['timestop'], timestophour = format_asterix_time( timestr.split('-')[1].strip, afternoon, 24)
        hash['timestart'], timestarthour = format_asterix_time(timestr.split('-')[0].strip ,afternoon, timestophour)
    end
    return 
end

def format_asterix_time(str, afternoon, limit_hour)
    hour = str.split(':')[0].to_i
    if afternoon
        hour += 12 if hour < 12 and hour + 12 <= limit_hour
        if str.end_with? 'p'
            return "%02d:%s:00" % [hour,str[-3..-2]],hour
        end
    end
    return "%02d:%s:00" % [hour,str[-2..-1]],hour
end

def parse_html(file)
    colums= ['code','ctype','sec','unit','instructor','time','place','final','max','enr']
    items=[]
    page = Nokogiri::HTML(open(file))
    trs = page.css('div.course-list').css('tr')

    college = page.css('tr[class="college-title"]').text.strip
    dept    = page.css('tr[class="dept-title"]').text.strip
    course = 'null'
    trs.each do |tr|
        if tr['bgcolor']=='#fff0ff' and tr['valign']=='top'
            course = tr.css('td').css('font').css('b').text 
        end
        if tr['bgcolor']=='#FFFFCC' and tr['valign']=='top'
            hash={ 'college' => college, 'dept' => dept , 'course' => course}
            for id in 0..colums.length-1
                if colums[id] == 'time'
                    format_time( hash , tr.css('td')[id].text.strip.split)
                else
                    hash[colums[id]] = tr.css('td')[id].text.strip
                end
            end
            items << encode(hash)
            #puts encode(hash)
        end
    end
    return items
end

def fetch_websoc()
    FileUtils.mkdir_p(HTML_DIR) unless File.exists?(HTML_DIR)
    page = Nokogiri::HTML(open(REQUEST_URL))
    depts = page.css('select[name="Dept"]').css('option')
    depts.each { |dept| puts dept['value']; reqest_by_dept(dept['value']) }
end

def convert_adm()
    Dir.glob(HTML_DIR + '/*.html') do |html|
        puts html
        File.open("#{ADM_DIR + '/' + File.basename(html).gsub('&','_') + '.adm'}", 'w'){|f|  
            msgs = parse_html html
            msgs.each {|msg| f.puts msg }
        }
    end
end

def fetch_roomfinder(url)
    gpshash = Hash[File.read(GPS_PATH).split("\n").map{|i| i.split("\t")}]
    keys=["buildid","fullname","abbr","ucimap"]
    page = Nokogiri::HTML(open(url))
    trs = page.css('table.data').css('tr.odd')
    trs += page.css('table.data').css('tr.even')
    trs.each do |tr|
        hash={}
        for id in 0..3
            hash[keys[id]]= tr.css('td')[id].text.strip;
        end
        hash['gps'] = gpshash[hash['fullname']] if gpshash[hash['fullname']] != nil
        puts encode(hash)
    end
end

def convert_ics_calendar(*files)
    files.each do |file|
        doc = Nokogiri::XML(open(file))
        keys=['title','date','startTime','endTime','contact','location','description']
        events = doc.xpath('//event')
        events.each do |e| 
            hash={}
            keys.each { |k| hash[k]= e.xpath(k).text }
            puts encode(hash)
        end
    end
end

#convert_adm
#fetch_roomfinder 'https://eee.uci.edu/toolbox/roomfinder/index.php'
convert_ics_calendar '../data/xml/icscalendar/Jun.xml','../data/xml/icscalendar/May.xml'

