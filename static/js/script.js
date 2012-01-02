/* Author: Rob Righter
*/

$(document).ready(function() {
  //////////////////////////////////////
  var authcallback = function(data){
      $('.details').html('<p>You are all signed in as <strong>'
            +data.user.username+
            '</strong><br>...and here are some details:'
            +JSON.stringify(data.user)+
            '</p><a href="/logout">logout</a>').fadeIn('slow');
    }

    $('#oauthbutt').click(function(){
      openEasyOAuthBox('twitter',authcallback);
    });
      
  /////////////////////////////////////////   
  var scene = sjs.Scene({w:$(window).width(), h:$(window).height(), autoPause: false});
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

  var socket = io.connect();

  socket.on('server_move_character', function(data){
   sps[data.character].xv = data.xv;
   sps[data.character].yv = data.yv;
   if(data.direction){
     spriteAnimateDirection(sps[data.character], data.direction);
   }
  });

  //"/images/sprites/lando.png" 128x192 32x48
  

  var image = 'lando.png';
  var inmotion = false;
  var input = sjs.Input(scene);
  var ticker = scene.Ticker(gameTick, {tickDuration: 130});
  ticker.run();
  
  function updateAllSprites(){
    _.each(_.keys(sps), function(item){
      sp = sps[item];
      sp.applyVelocity();
      sp.update();
    })
  }
  
  function gameTick(ticker){
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

    if(character.direction){
      inmotion = true;
      socket.emit('move_character', {character: 'lando', xv: character.xv, yv: character.yv, direction: character.direction });
    }
    else if(inmotion){
      inmotion=false;
      socket.emit('move_character', {character: 'lando', xv: 0, yv: 0, direction: null });
    }
    updateAllSprites();          
  }

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
});

