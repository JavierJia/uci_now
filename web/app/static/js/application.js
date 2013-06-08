
function loadExternalJS(file) {
    console.log("[application.js] loading " + file);
    // Use of document.writeln and not DOM function to enforce order of execution
    document.writeln("<script type='text/javascript' src='/static/js"+file+"'></script>");
}

var components = 
[
'/map.js',
'/list.js',
'/client.js',
];

console.log("[application.js] Init Client ");
components.forEach(loadExternalJS);

document.addEventListener('DOMContentLoaded',function(){
	client = new Client();
});
