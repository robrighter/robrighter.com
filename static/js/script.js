/* Author: Rob Righter
*/

$(document).ready(function() {
  //DISABLE ALL THIS FOR INITIAL LAUNCH
  return;

  var scene = sjs.Scene({w:$(window).width(), h:$(window).height(), autoPause: false});
  var sps = {};
  var input = sjs.Input(scene);
  var keyPressed = function(name){
    console.log('KEY PRESSED');
    console.log(name);
  }
  window.inputer = input;
  var inmotion = false;
  var socket;
  var requestkey = '';
  
  var character_images = [
  'chinese_m1.png',
  'chiss1.png',
  'darthvader.png',
  'golbez.png',
  'indianajones.png',
  'japanese_f1.png',
  'lando.png',
  'mandalorian2.png',
  'marionravenwood.png',
  'pirate_m2.png',
  'princessleia.png',
  'rebelpilot.png',
  'steampunk_m1.png',
  'weddingguy02.png'
  ]
  
  //setup the oauth button
  $('#oauthbutt').click(function(){
    openEasyOAuthBox('twitter',function(oauth){
      var username = oauth.user.username;
      $('#controlbox').slideUp('slow', function(){
        $('#controlbox').html(makeSpritePickers());
        $('#controlbox').slideDown('slow');
        $('.sprite-picker').click(function(){
          //var oauth = {user: {username: 'robrighter'} };
          var that = this;
          var spriteimageurl = $(that).css('background-image').replace('url(','').replace(')','');
          $.post("/ajax/initiate-character", { 
            handle: username,
            image: spriteimageurl,
          }, function(data){
            console.log(data);
            requestkey = data.requestkey;
            setupTalkInterface(username);
          });//initiate character
        }); //sprite picker click
      }); //slide up callback
    }); //Oauth box
  }); //Oauth button click
  
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
    sps[handle].talkHistory = [];
  }
  
  function setupSocket(){
    socket = io.connect();
    socket.on('server_move_character', function(data){
     sps[data.character].xv = data.xv;
     sps[data.character].yv = data.yv;
     if(data.direction){
       spriteAnimateDirection(sps[data.character], data.direction);
     }
     $('#talk'+data.character).css('margin-left', sps[data.character].x+'px').css('margin-top', sps[data.character].y+'px');
    });
    
    socket.on('server_talk_character', function(data){
     spriteSpeak(data.character, data.message);
     
    });
    
    socket.on('server_add_character', function(data){
      addCharacter(data.handle, data.details);
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
      $('#controlbox').html("<form id='talkform'><span class='username'>@"+user+": </span>"+"<input type='text' id='talkbox'><button id='saybutt'>say it.</button></form>").slideDown('slow');
      $('#talkform').submit(function(e){
        e.preventDefault();
        sendMessage($('#talkbox').val());
        $('#talkbox').val('')
        
      });
    });
  }
  
  function sendMessage(texttosend){
    socket.emit('talk_character', {requestkey: requestkey, message: texttosend });
  }
  
  function spriteSpeak(sprite, message){
    sps[sprite].talkHistory.push(message);
    var formattedmessages = sps[sprite].talkHistory.join('<br>');
    if($('#talk'+sprite).length === 0 ){
      var html = "<div class='talkbubble' id='talk"+sprite+"'><div class='message'>"+formattedmessages+"</div></div>";
      $('#talks').append(html); 
    }
    else{
      $('#talk'+sprite+' .message').html(formattedmessages);
    }
    
    $('#talk'+sprite).css('margin-left', sps[sprite].x+'px').css('margin-top', sps[sprite].y+'px');
    console.log('CHARACTER: ' + sprite + " says: " + message);
  }
  
  function makeSpritePickers(){
    return "<div class='sprite-picker-box'><h2>Choose your Avatar</h2>" +
     _.map(character_images, makeSpritePicker).join('') + "</div>"
  }
  function makeSpritePicker(image){
    return "<div class='sprite-picker' style='background-image: url(/images/sprites/" + image + ")'></div>";
  }
  
});

