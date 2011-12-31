/* Author: YOUR NAME HERE
*/

$(document).ready(function() {   
  var scene = sjs.Scene({w:540, h:380, autoPause: false});
  var sps = {
    lando: scene.Sprite("/images/sprites/lando.png"),
    luke: scene.Sprite("/images/sprites/luke.png")
  }
  
  _.each(_.keys(sps), function(item){
    sp = sps[item];
    sp.size(32, 48);
    sp.offset(0, 0);
    sp.move(100, 100);
    sp.update();
  });
  
  socket = new io.Socket(null, { 
   port: 8081
   ,transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
  });
  socket.connect();

  $('#sender').bind('click', function() {
   socket.emit('message', 'Message Sent on ' + new Date());     
  });

  socket.on('move_character', function(data){
   console.log(data);
   sps[data.character].xv = data.xv;
   sps[data.character].yv = data.yv;
   if(data.direction){
     spriteAnimateDirection(sps[data.character], data.direction);
   }
  });
  
  function updateAllSprites(){
    _.each(_.keys(sps), function(item){
      sp = sps[item];
      sp.applyVelocity();
      sp.update();
    })
  }

  //"/images/sprites/lando.png" 128x192 32x48
  

  // load the images in parallel. When all the images are
  // ready, the callback function is called.
  var image = 'lando.png';
  scene.loadImages(["/images/sprites/"+image], function() {
      
      var input = sjs.Input(scene);
      var ticker = scene.Ticker(function(ticker){
        var character = {xv: 0, yv: 0, direction: null};
        
        var speed = 5;
        if (input.keyboard.left){
          character.xv = speed*-1;
          character.direction = 'left';
        }else if (input.keyboard.right){
          character.xv = speed;
          character.direction = 'right';
        }
        else{
          character.xv = 0;
        }
        
        if (input.keyboard.up){
          character.yv = speed*-1;
          character.direction = 'up';
        }else if (input.keyboard.down){
          character.yv = speed;
          character.direction = 'down';
        }
        else{
          character.yv = 0;
        }
        
        socket.emit('move_character', {character: 'lando', xv: character.xv, yv: character.yv, direction: character.direction });
        updateAllSprites();       
      }, {tickDuration: 130});
      ticker.run();   
  });

});


function spriteAnimateDirection(sprite, direction){
  var width = 32;
  var height = 48;
  var prop = 'rrcustomizedanimation';
  var spritekey = {down: 0*height, left: 1*height, right: 2*height, up: 3*height};
  if(!sprite.hasOwnProperty(prop)){
    sprite[prop] = {
      down: 0,
      left: 0,
      right: 0,
      up: 0
    };
  }
  sprite[prop][direction]++;
  sprite[prop][direction] = sprite[prop][direction]%4;
  sprite.offset(sprite[prop][direction]*width, spritekey[direction]);
}