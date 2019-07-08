var http = require('http');
var fs = require('fs');

var server = http.createServer(function(req,res){
    console.log(req.url);
    res.writeHead(200, {'Content-Type':'text/html'});
    var myReadStream = fs.createReadStream(__dirname+'/index.html','utf8');
    myReadStream.pipe(fs);
}); 

server.listen(3000,'127.0.0.1');
console.log('listening to port 3000');