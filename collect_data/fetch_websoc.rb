require 'rubygems'
require 'restclient'
require 'nokogiri'
require 'open-uri'

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

        File.open("#{LOCAL_DIR}/soc-#{dept}.table", 'w'){|f|  
            npage = Nokogiri::HTML(page)
            rows = npage.css('table tr')
            puts "#{rows.length} rows"
            rows.each do |row|
                string = row.css('td').map{|td| td.text}.join(', ')
                f.puts string
            end
        }
    end 
end

FileUtils.mkdir_p(LOCAL_DIR) unless File.exists?(LOCAL_DIR)
page = Nokogiri::HTML(open(REQUEST_URL))
depts = page.css('select[name="Dept"]').css('option')
depts.each { |dept| puts dept['value']; reqest_by_dept(dept['value']) }

