/* Author: Rob Righter
*/

$(document).ready(function() {
  
  var scene = sjs.Scene({w:$(window).width(), h:$(window).height(), autoPause: false});
  var sps = {};
  var input = sjs.Input(scene);
  var inmotion = false;
  var socket;
  var requestkey = '';
  
  //setup the oauth button
  $('#oauthbutt').click(function(){
    openEasyOAuthBox('twitter',function(oauth){
      $.post("/ajax/initiate-character", { 
        handle: oauth.user.username,
        image: '/images/sprites/weddingguy02.png'
      }, function(data){
        requestkey = data.requestkey;
      });
      setupTalkInterface(oauth.user.username);
      
    });
  });
  
  //load up the characters
  $.get('/ajax/characters', function(data) {
    _.each(_.keys(data), function(key){
      addCharacter(key, data[key]);
    });
    //now go ahead and setup the socket
    setupSocket();
    //now setup the ticker
    setupTicker();
  });
  
  function addCharacter(handle, chardict){
    sps[handle] = scene.Sprite(chardict.image);
    sps[handle].size(32,48);
    sps[handle].offset(0,0);
    sps[handle].move(chardict.location.x,chardict.location.y);
    sps[handle].update();
  }
  
  function setupSocket(){
    socket = io.connect();
    socket.on('server_move_character', function(data){
     console.log(data);
     console.log(sps);
     sps[data.character].xv = data.xv;
     sps[data.character].yv = data.yv;
     if(data.direction){
       spriteAnimateDirection(sps[data.character], data.direction);
     }
    });
    
    socket.on('server_add_character', function(data){
      console.log('GOT AN ADD CHARACTER!!!!!!!');
      console.log(data);
      addCharacter(data.character, data.details);
    });
  }

  function setupTicker(){
    var ticker = scene.Ticker(gameTick, {tickDuration: 130});
    ticker.run(); 
  }
  
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
      socket.emit('move_character', {requestkey: requestkey, xv: character.xv, yv: character.yv, direction: character.direction });
    }
    else if(inmotion){
      inmotion=false;
      socket.emit('move_character', {requestkey: requestkey, xv: 0, yv: 0, direction: null });
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
  
  function setupTalkInterface(user){
    $('#controlbox').slideUp('slow', function(){
      $('#controlbox').html("<div class='username'>@"+user+"</div>"+"<input type='text' id='talkbox'><button id='#saybutt'>say it.</button>").slideDown('slow');
    });
  }
});

