//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , io = require('Socket.io')
    , easyoauth = require('easy-oauth')
    , port = (process.env.PORT || 8081);
    
    
var crypto = require('crypto');
var keylookups = {};

//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({ secret: "shhhhhhhhh!"}));
    server.use(connect.static(__dirname + '/static'));
    server.use(easyoauth(require('./keys_file')));
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.jade', { locals: { 
                  title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.jade', { locals: { 
                  title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});
server.listen( port);

//Setup Socket.IO
var io = io.listen(server);
io.sockets.on('connection', function(socket){
  console.log('Client Connected');
  socket.on('move_character', function(data){
    if(keylookups.hasOwnProperty(data.requestkey)){
      var movedata = {
        character: keylookups[data.requestkey],
        xv: data.xv,
        yv: data.yv,
        direction: data.direction
      }
      socket.broadcast.emit('server_move_character',movedata);
      socket.emit('server_move_character',movedata);
    } 
  });
  
  socket.on('talk_character', function(data){
    if(keylookups.hasOwnProperty(data.requestkey)){
      //TODO: ADD STRIP TABS
      var message = {
        character: keylookups[data.requestkey],
        message: data.message,
      }
      socket.broadcast.emit('server_talk_character',message);
      socket.emit('server_talk_character',message);
    } 
  });
  
  socket.on('disconnect', function(){
    console.log('Client Disconnected.');
  });
});


// Website functions /////////////////////////////////////
var hashsalt = Math.random() + 'seedin' + Math.random();
var characters = {
  hubot: {
    image: "/images/sprites/protocoldroid2.png",
    location: {
      x: 50,
      y: 50
    }
  }
}

function createHash(tohash, callback){
  crypto.pbkdf2(tohash,hashsalt, 1, 10, function(err, derivedkey){
    keylookups[derivedkey] = tohash;
    callback(derivedkey);
  });
}

function notifyClientsAboutNewCharacter(handle){
  io.sockets.emit('server_add_character', { handle: handle, details: characters[handle] });
}

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req,res){
  res.render('index.jade', {
    locals : { 
              title : 'Rob Righter, Javascript, Node.JS, IOS, Hubot and other such things.'
             ,description: 'Your Page Description'
             ,author: 'Rob Righter'
             ,analyticssiteid: 'XXXXXXX' 
            }
  });
});

server.get('/ajax/characters', function(req,res){
  res.send(characters);
})

server.post('/ajax/initiate-character', function(req,res){
  //todo: CHECK THE AUTH AND MAKE SURE THEY ARE OAUTH WITH THIS TWITTER HANDLE
  characters[req.body.handle] = {
    image: req.body.image,
    location: {
      x: 100,
      y: 100
    }
  };
  console.log('GOT A NEW CHARACTER: ' + req.body.handle);
  console.log(characters[req.body.handle]);
  notifyClientsAboutNewCharacter(req.body.handle);
  createHash(req.body.handle, function(hash){
    res.send({ requestkey: hash });
  });
});

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res){
    throw new NotFound;
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}


console.log('Listening on http://0.0.0.0:' + port );
