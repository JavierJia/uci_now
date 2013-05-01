require 'rubygems'
require 'restclient'
require 'nokogiri'
require 'open-uri'
require 'yajl'

REQUEST_URL= "http://websoc.reg.uci.edu/perl/WebSoc"
LOCAL_DIR = "../data/raw/websoc"

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
        File.open("#{LOCAL_DIR}/soc-#{dept}.html", 'w'){|f| f.write page.body}
    end 
end

def encode(message)
    return Yajl::Encoder.encode(message)
end

def parse_html(file)
    items=[]
    colums= ['code','type','sec','unit','instructor','time','place','final','max','enr']
    page = Nokogiri::HTML(open(file))
    hash={}
    hash['college'] = page.css('tr[class="college-title"]').text
    hash['dept'] = page.css('tr[class="dept-title"]').text
    trs = page.css('div.course-list').css('tr')
    trs.each do |tr|
        if tr['bgcolor']=='#fff0ff' and tr['valign']=='top'
            course = tr.css('td').css('font').css('b').text 
            hash['course'] = course
        end
        if tr['bgcolor']=='#FFFFCC' and tr['valign']=='top'
            for id in 0..colums.length-1
                hash[colums[id]] = tr.css('td')[id].text
            end
            items << encode(hash)
            #puts encode(hash)
        end
    end
    return items
end

def fetch_websoc()
    FileUtils.mkdir_p(LOCAL_DIR) unless File.exists?(LOCAL_DIR)
    page = Nokogiri::HTML(open(REQUEST_URL))
    depts = page.css('select[name="Dept"]').css('option')
    depts.each { |dept| puts dept['value']; reqest_by_dept(dept['value']) }
end

def convert_json()
    Dir.glob(LOCAL_DIR + '/*.html') do |html|
        puts html
        File.open("#{html}.json", 'w'){|f|  
            msgs = parse_html html
            msgs.each {|msg| f.puts msg }
        }
    end
end

convert_json
