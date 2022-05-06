let socket = null;

//load socket on home page to reviece requests syc ly
function loadSocket(user){
    if (socket ==null){
        socket = io();
        socket.on('refresh', refresh);
        socket.on('deny', alertDeny);
        socket.emit('login', user);
    }
}

//refresh page when socket get command to refresh
function refresh(){
    location.reload();
}



//submit user input to register a new account
function submitClicked(){
    let username = document.getElementById("username").value;
    let pswd1 = document.getElementById("password1").value;
    let pswd2 = document.getElementById("password2").value;
    if (username === ""){
        alert("Username cannot be empty");
        document.getElementById('username').focus();
    }else if(username.length<6){
        alert('Username must be at least 6 charactors');
        document.getElementById('username').focus();
    }else if(username.length>18){
        alert('Username cannot have more than 18 charactors');
        document.getElementById('username').value = '';
        document.getElementById('username').focus();
    }
    else{
        if (pswd1.length<6){
            alert("Password must have at least 6 charactors");
        }
        else{
            if (pswd1 != pswd2){
                alert("Your passwords don't match please check your input");
                document.getElementById('password1').value = '';
                document.getElementById('password2').value = '';

            }else{
                //everything is fine
                let user = {name:username, password:pswd1};
                
                //send data to server to verify
                req = new XMLHttpRequest();
                req.onreadystatechange = function(){
                    if(this.readyState === 4 && this.status === 401){
                        alert(this.responseText);
                    }
                    else if(this.readyState === 4 && this.status === 200){
                        
                        alert('Registeration successful, proceeding to login');
                        location.href = '/';
                    }
                }
                req.open('POST', 'register');
                req.send(JSON.stringify(user));

            }
        }
    }
}
    


//logout user
function logout(name){
    req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        if(this.readyState === 4 && this.status === 200){
        }
    }
    req.open('POST', 'logout');
    req.send(JSON.stringify(name));
    socket.emit('refresh');
    window.location.href = '/';
    
}
//change user privacy
function privacy(name){
    req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        if(this.readyState === 4 && this.status === 200){
            console.log('privacy changed');
        }
    }
    req.open('POST', 'privacy');
    req.send(JSON.stringify(name));
    location.reload();
}

//search user
function search(replace){
    let name = document.getElementById('searchString').value;
    if (replace === true){
        window.location.replace('/users?search='+ name);
    }else{
        window.location.href = '/users?search='+ name;
    }
}

//send a add friend request
function addFriend(user){
    let name = prompt("Who are you adding this time?");
    if(name === ''){
        alert('Username cannot be empty');
        return;
    }else if(name === null){
        return;
    }else if(user == name){
        alert("you cannot add yourself as friend, that's weird");
        return;
    }else{
        let userSet = [];
        userSet.push(user);
        userSet.push(name);
        req = new XMLHttpRequest();
        req.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 200){
                alert(this.responseText);
                socket.emit('refresh',name);
            }
        }
        req.open('POST', 'add');
        req.send(JSON.stringify(userSet));
    }
}

//go back to previus page
function back(){
    window.history.back(function(){
        location.reload;
    });
}


//remove a friend from friend list
function removeFriend(user){
    let name = prompt("Who are you removing this time?");
    if(name === ''){
        alert('Username cannot be empty.');
        return;
    }else if(name === null){
        return;
    }else if(user == name){
        alert('you cannot remove yourself since you are not in your friend list(Dont try, you will not be able to add yourself to your friend list).');
        return;
    }else{
        let userSet = [];
        userSet.push(user);
        userSet.push(name);
        req = new XMLHttpRequest();
        req.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 200){
                alert(name + this.responseText);
                socket.emit('refresh', name);
            }
        }
        req.open('POST', 'remove');
        req.send(JSON.stringify(userSet));
        location.reload();
    }
}



//when you click accept/decline buttons in requests section
//request = the request user is handling
//response = user's response to the request
function handler(request, user, response){
    let
    responseString = request + ',' + user + ',' + response;
    let opponent = request.split(',')[0];
    if(response === 'n'){
        socket.emit('decline', opponent+'/'+user);
    }
    console.log(responseString);
    req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        if(this.readyState === 4 && this.status === 200){
            alert(this.responseText);
            if(this.responseText == 'challenge accepted'){
                socket.emit('refresh', opponent);
            }
        }
    }
    req.open('POST', 'handler');
    req.send(JSON.stringify(responseString));
    location.reload();
}

//choose a friend/random to send a game request
function startGame(user){
    let opponent = document.getElementById('opponent').value;
    let gameType;
    let priv = prompt('Please select if you want other to see your game\n0:Public(everyone can sees)\n1:Friend only(only your firends and your opponent friends can see)\n2:private(no one can see except the players)',0);
    
    let gameString = [];
    let goToGame = false;
    gameString.push(user);
    gameString.push(opponent);
    if(priv == null){
        return;
    }else if (priv != 0 && priv != 1 && priv !=2){
        alert('Please select one from the given options\n0:Public(everyone can sees)\n1:Friend only(only your firends and your opponent friends can see)\n2:private(no one can see except the players)');
        return;
    }else{
        if(priv == 0){
            gameType = 'public';
        }else if(priv == 1){
            gameType = 'friends only';
        }else if(priv == 2){
            gameType = 'private';
        }
        gameString.push(gameType);
        req = new XMLHttpRequest();
        req.onreadystatechange = function(){
            if(this.readyState === 4 && this.status === 200){
                alert(this.responseText);
                if(this.responseText.startsWith('found random game, waiting for the other user to response.')){
                    let gameID = this.responseText.split('/')[1];
                }else if(this.responseText === 'Your invitation is sent'){
                    
                }
            }
        }
        req.open('POST', 'gameRequest');
        req.send(JSON.stringify(gameString));
    }
}


//init game page
function initGame(user, gid){
    let canvas=document.getElementById("board");
    let lines=canvas.getContext("2d");
    for(i=0;i<=6;i++){
        lines.moveTo(0,70*i);
        lines.lineTo(490,70*i);
        lines.stroke();
    }
    for(i=0;i<=7;i++){
        lines.moveTo(70*i,0);
        lines.lineTo(70*i,420);
        lines.stroke();
    }
    
    if (socket == null){
        socket = io();
        socket.on('refresh', refresh);
        socket.on('newUser', notifyNew);
        socket.on("init", initMessages);
        socket.on("newmsg", newMessage);
        socket.on('leaveChat', leaveChat);
        socket.on('noAccess', alertUser); //this function is used to alert anything not restricted to no access
        socket.on('drop', dropChess);
        socket.on('winner', alertWin);
        socket.on('setBlack', colorCode);
        socket.emit('joinChat', (user+'/'+gid));
    }
}

//alert user with given info(called by socket);
function alertUser(string){
    alert(string);
}
//
function colorCode(name){
    document.getElementById('colorCode').innerHTML += name;
}

//log out someone left room
function leaveChat(name){
    let newLI = document.createElement("li");
    if(name != '{}'){
        let text = document.createTextNode(name + " left the chat.");
        newLI.appendChild(text);
        document.getElementById("chatroom").appendChild(newLI);
        newLI.scrollIntoView();
        let index = document.getElementById('inroom').innerHTML.indexOf(name);
    }
}

//log out someone joined room
function notifyNew(name){
    let newLI = document.createElement("li");
    if(name != '{}'){
        let text = document.createTextNode(name + " joined the chat.");
        newLI.appendChild(text);
        document.getElementById("chatroom").appendChild(newLI);
        newLI.scrollIntoView();
    }
}

//load chat history and canvas for users joined midway
function initMessages(data){
    let msg = JSON.parse(data).messages;
    msg.forEach(elem => {
        newMessage(elem);
    });
    let canvas = document.getElementById("board");
    let chess= canvas.getContext("2d");
    let height = [5,5,5,5,5,5,5];
    let black = true;
    let steps = JSON.parse(data).steps;
    steps.forEach(step=>{
        console.log(step);
        chess.beginPath();
        chess.arc(35+step[1]*70, 35+ height[step[1]]*70, 30, 0, 2*Math.PI);
        height[step[1]]--;
        if(black == true){
            chess.fillStyle='black';
            chess.fill();
            black = false;
        }else{
            black = true;
        }
        chess.stroke();
    });
    if(steps != []){
        document.getElementById('colorCode').innerHTML += steps[0][0];
        if(black==false){
            document.getElementById('yourTurn').innerHTML = "It's white's turn";
        }else{
            document.getElementById('yourTurn').innerHTML = "It's black's turn";
        }
    }
}


//display new message in chatroom
function newMessage(message){
    console.log("New message: " + message);
    let newLI = document.createElement("li");
    let text = document.createTextNode(message);
    newLI.appendChild(text);
    document.getElementById("chatroom").appendChild(newLI);
    newLI.scrollIntoView();

}


//send message to the room
function send(gid, name){
    let msg = document.getElementById("message").value;
    if(msg != ''){
        console.log('sending: ' + msg);
        if(msg.length > 0){
            socket.emit("newmsg", msg);
        }
        let newLI = document.createElement("li");
        let text = document.createTextNode(name+': '+msg);
        newLI.appendChild(text);
        document.getElementById("chatroom").appendChild(newLI);
        document.getElementById('message').value = '';
        newLI.scrollIntoView();
    }
}

//drop a piece
function drop(name, pid, gid){
    socket.emit('drop', name+'/'+pid+'/'+gid);
}

//alert user when someone declined their request
function alertDeny(name){
    console.log(name);
    alert(name +' has declined your request');
}

//draw chess on canvas
function dropChess(string){
    let coord = JSON.parse(string);
    let x = 6 - parseInt(coord[1]);
    let y = 5 - coord[2];
    let black = coord[0];
    let canvas = document.getElementById("board");
    let chess=canvas.getContext("2d");
    
    chess.beginPath();
    chess.arc(35 + (6-x)*70 , 35+ 70*y,30,0,2*Math.PI);
    if(black){
        chess.fillStyle='black';
        chess.fill();
        document.getElementById('yourTurn').innerHTML = "It's white's turn.";

    }else{
        document.getElementById('yourTurn').innerHTML = "It's black's turn.";
    }
    chess.stroke();
    
   
}

//alert users in room someone won the game
function alertWin(winner){
    document.getElementById('winmsg').innerHTML+= "**" + winner + ' WON!**';
    alert('winner is ' + winner + '!');
}


// it seems / messes up the formatting in Xcode when I want to use '/' as divide.
function divide(a, b){
    return a/b;
}


//rewatch history game
function replay(data, playerA,playerB, winner, surrender){
    let count = 0;
    let height = [5,5,5,5,5,5,5]
    let steps = [];
    let seqence = data.split(',');
    for(i=1;i<seqence.length;i+=2){
        steps.push(seqence[i]);
    }
    let black = true;
    let canvas=document.getElementById("replay");
    let c=canvas.getContext("2d");
    for(i=0;i<=6;i++){
        c.moveTo(0,70*i);
        c.lineTo(490,70*i);
        c.stroke();
    }
    for(i=0;i<=7;i++){
        c.moveTo(70*i,0);
        c.lineTo(70*i,420);
        c.stroke();
    }
    if(steps[0] == null){
        if(playerA == winner){
            document.getElementById('color').innerHTML += playerB + " surrendered before " + playerA + ' realizing the match started!'
        }else{
            document.getElementById('color').innerHTML += playerA + " surrendered before " + playerB + ' realizing the match started!'
        }
    }else{
        if(seqence[0]==playerA){
            document.getElementById('color').innerHTML += playerA+': Black <br>'+ playerB +': White<br>' + 'Winner: '+winner;
        }else{
            document.getElementById('color').innerHTML += playerB+': Black <br>'+ playerA +': White<br>' + 'Winner: '+winner + '<br>';
        }
        if(surrender == true){
            document.getElementById('color').innerHTML += "His/Her opponent surrendered!"
        }
    }
    
    
    
    let next = document.getElementById('nextStep');
    let prev = document.getElementById('prevStep');
    
    next.onclick = function(){
        if (count == steps.length){
            alert('This is the last step, '+ winner +' is the winner!');
        }else{
            x = 35 + steps[count] * 70;
            y = 35 + height[steps[count]] * 70;
            c.beginPath();
            c.arc(x, y, 30, 0, 2*Math.PI);
            if(black == true){
                c.fillStyle = 'black';
                c.fill();
                black = false;
            }else{
                black = true;
            }
            c.stroke();
            console.log(count, height);
            height[steps[count]]--;
            count++;
        }
    }
    
    prev.onclick = function(){
        if(count == 0){
            alert('There is nothing on the board!');
        }else{
            count--;
            height[steps[count]]++;
            
            x = 1 + steps[count] * 70;
            y = 1 + height[steps[count]] * 70;
            c.clearRect(x,y,68,68);
            black = !black;
        }
    }
}

//surrender
function surrender(user, gid){
    socket.emit('surrender', user + '/' + gid);
}


function viewFriend(){
    document.getElementById('friends').submit();
}
