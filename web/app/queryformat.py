
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

query_bysearch = '''

'''