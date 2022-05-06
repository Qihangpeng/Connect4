let express = require('express');
let http = require('http');
let fs = require('fs');
// Create a connect dispatcher
let app = express();
let bodyParser = require('body-parser');
app.set('views', './')
app.set('view engine', 'ejs');
let server = http.createServer(app);
let io = require('socket.io')(server);

let games = []; //ongoing games
let allGames = [];
let gameID = 0;
let randomQueue = [];
let userList = [{name:'1',password:'',stat:'1',win:15,gamePlayed:30,friendList:[],matchHistory:[],requests:[],private:false,matches:[]},
                {name:'2',password:'2',stat:'1',win:5,gamePlayed:5,friendList:[],matchHistory:[],requests:[],private:false,matches:[]},
                {name:'Alex',password:'aaaaaa',stat:'1',win:2,gamePlayed:5,friendList:[],matchHistory:[],requests:[],private:false,matches:[]},
                {name:'Ben',password:'bbbbbb',stat:'1',win:1,gamePlayed:98,friendList:[],matchHistory:[],requests:[],private:false,matches:[]},
                {name:'Claire',password:'cccccc',stat:'1',win:3,gamePlayed:4,friendList:[],matchHistory:[],requests:[],private:true,matches:[]},
                {name:'Daniel',password:'dddddd',stat:'1',win:14,gamePlayed:54,friendList:[],matchHistory:[],requests:[],private:false,matches:[]}];

userList[0].friendList.push(userList[1]);
userList[1].friendList.push(userList[0]);
userList[0].friendList.push(userList[2]);
userList[2].friendList.push(userList[0]);
userList[1].friendList.push(userList[3]);
userList[3].friendList.push(userList[1]);
userList[2].friendList.push(userList[4]);
userList[4].friendList.push(userList[2]);
userList[0].friendList.push(userList[4]);
userList[4].friendList.push(userList[0]);



//The 'state' the server stores
//Note that this could be an array, files, database, etc.

function logger(req, res, next){
    console.log('===========================================');
	console.log("Recieved request: ");
	console.log("Method: " + req.method);
	console.log("URL: " + req.url);
	next();
}

function parser(req, res, next){
    if(req.method === 'GET'){
        next();
    }else if (req.url === '/home'|| req.url.startsWith('/games') || req.url.startsWith('/friends/')){ //parser exceptions
        next();
    }else{
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        })
        req.on('end', () => {
            req.body = JSON.parse(body);
            next();
        })
        
    }
}

function serveScript(req, res, next){
    res.writeHead(200, { 'content-type': 'application/javascript' });
    fs.createReadStream('./Scripts/script.js').pipe(res);
    return;
}

function jqueryScript(req, res, next){
    res.writeHead(200, { 'content-type': 'application/javascript' });
    fs.createReadStream('./Scripts/jquery.js').pipe(res);
    return;
}


function serveLogin(req, res, next){
    res.writeHead(200, {'content-type': 'text/html'});
    fs.createReadStream('./Pages/login.html').pipe(res);
    return;
}

function loadRegister(req, res, next){
    res.writeHead(200, {'content-type': 'text/html'});
    fs.createReadStream('./Pages/register.html').pipe(res);
    return;
}



function userRegister(req, res, next){
    let exists = false;
    userList.forEach(user=>{
        if (user.name === req.body.name){
            res.writeHead(401).end('username exists');
            exists = true;
            return;
        }
    });
    if (!exists){
        let newUser = {name:req.body.name,password:req.body.password,stat:'1',win:0,gamePlayed:0,friendList:[],matchHistory:[],requests:[],private:false,matches:[]};
        userList.push(newUser);
        console.log('new user added to the server');
        console.log(newUser);
        res.set(200).end();
        return;
    }
}

function userLogin(req, res, next){
    try{
        let match = false;
        let inputName = req.body.split("&")[0].split("=")[1];
        let inputPassword = req.body.split("&")[1].split("=")[1];
        console.log('username: ' + inputName);
        console.log('password: ' + inputPassword)
        userList.forEach(user=>{
            if(user.name === inputName && user.password === inputPassword ){
                user.friendList.sort((a, b)=>(
                    b.stat+b.name === a.stat+a.name ? 0 : a.stat+a.name > b.stat+b.name ? 1 : -1
                ));
                app.render('./Pages/home', {user}, function(err, data){
                    if(err){
                        console.log(err);
                        res.set(500).end();
                        return;
                    }
                    else{
                        if(user.stat == '1'){
                            io.emit('refresh');
                            user.stat = '0';
                        }
                        res.set(200).end(data);
                        return;
                    }
                });
                match = true;
            }
        });
        if(!match){
            res.writeHead(401);
            res.end("Invalid username or password.");
            return;
        }
    }catch(err){
        next(err);
    }
}


function logout(req, res, next){
    userList.forEach(user=>{
        if(user.name == req.body){
            user.stat = '1';
            console.log(user.name+' is now offline');
            res.set(200).end();
            return;
        }
    });
}


function changePrivacy(req, res, next){
    userList.forEach(user=>{
        if(user.name == req.body){
            user.private = !(user.private);
            console.log(user.name + "'s private is now set to " + user.private);
            res.set(200).end(user.private.toString());
            return;
        }
    });
}



function search(req, res, next){
    let searchString='';
    if(req.url.split('?')[1] != null){
        searchString = req.url.split('=')[1];
    }else{
        searchString = req.url.slice[1];
    }
    let result = [];
    
    userList.forEach(user=>{
        if(user.name.toLowerCase().indexOf(searchString.toLowerCase())>= 0 && user.private === false){
            result.push(user.name);
        }
    });
    console.log(result);
    app.render('./Pages/search', {result}, function(err, data){
        if(err){
            console.log(err);
            res.set(500).end();
            return;
        }else{
            res.set(200).end(data);
            return;
        }
    });
}


function viewUser(req, res, next){
    let found = false;
    userList.forEach(user=>{
        if(user.name == req.params.name && user.private === false){
            found = true;
            app.render('./Pages/view', {user}, function(err, data){
                if(err){
                    console.log(err);
                    res.set(500).end();
                    return;
                }else{
                    res.set(200).end(data);
                    return;
                }
            });
        }
    });
    if(found === false){
        res.set(200).end(req.params.name+ ' is not found or is set to private');
        return;
    }
}


function sendAdd(req, res, next){
    let exists = false;   //the request already exists in request list
    let noMatch = true;;  //username not exists in server
    let pending = false;  //reciever has already sent a request with same type
    let alreadyFriend = false;  //reciever already in sender's friend list
    let sender = req.body[0];
    let reciever = req.body[1];
    
    
    userList.forEach(user=>{
        if(user.name == sender){
            user.requests.forEach(request=>{  //check if target has sent a same type of request
                if(request[0] == reciever && request[1] === 'add'){
                    pending = true;
                }
            });
            user.friendList.forEach(friend=>{  //check if target is already your friend
                if(friend.name == reciever){
                    alreadyFriend = true;
                }
            });
        }else if(user.name == reciever){
                noMatch = false;
                user.requests.forEach(request=>{ //you are sending the same request twice
                    if(request[0] == sender && request[1] == 'add'){
                        exists = true;
                    }
                });
            }
        });
    
    //if train to prevent write after send.
    if(alreadyFriend === true){
        res.set(200).end(reciever + ' is already in your friend list.');
        return;
    }else if(pending === true){
        res.set(200).end(reciever + ' has already sent you a friend request, please check your requests section.');
        return;
    }else if(noMatch === true){
        res.set(200).end(reciever+ '  does not exist');
        return;
    }else if(exists === true){
        res.set(200).end('Your friend request is pending');
        return;
    }else{
        //add request to requests list
        userList.forEach(user=>{
            if (user.name == reciever){
                user.requests.push([sender,'add','']);
                console.log(reciever + ' recieved a friend request from ' + sender);
                res.set(200).end('Friend request sent');
                return;
            }
        });
    }
}


function viewFriend(req, res, next){

    console.log(req.body);
    userList.forEach(user=>{
        if(user.name == req.params.id){
            app.render('./Pages/viewFriend', {viewer:req.body.split('=')[1] ,user}, function(err, data){
                if(err){
                    console.log(err);
                    res.set(500).end();
                    return;
                }else{
                    res.writeHead(200, {'content-type':'text/html'});
                    res.end(data);
                    console.log('page rendered');
                    return;
                }
            })
        }
    });
}

function handler(req, res, next){
    let resString = req.body.split(',');
    console.log('handler recieved info '+ resString);
    userList.forEach(user=>{
        if(user.name == resString[3]){   //find who's request
            for(i=0; i<user.requests.length;i++){
                if(user.requests[i][0]===resString[0] && user.requests[i][1]===resString[1]){   //find which request
                    if(resString[4]=== 'n'){
                        user.requests.splice(i,1);
                        console.log(user.name + ' denied the request');
                        res.set(200).end('request denied'); //remove the request(what type(add/game) of request does not matter)
                        return;
                    }else if(resString[1] === 'add'){ //request accepted, request type is add
                        io.sockets.in(resString[0]).emit('refresh');
                        user.requests.splice(i,1);
                        userList.forEach(sender=>{ //find who sent the request
                            if(sender.name === resString[0]){
                                user.friendList.push(sender);
                                sender.friendList.push(user);//add each other
                                console.log(sender.name + ' '+ user.name+ ' added each other');
                                res.set(200).end('friend added');
                                return;
                            }
                        });
                    }else{ //accpected game request
                        user.requests.splice(i,1);
                        allGames.push({id:gameID, players:[resString[0], resString[3]], steps:[], result:'', type:resString[2], msgs:[], winner:'', surrender:false});
                        games.push({id: gameID, players:[resString[0], resString[3]], type:resString[2]});
                        userList.forEach(user=>{
                            if(user.name == resString[0] || user.name == resString[3]){
                                user.matches.push({id:gameID, players:[resString[0], resString[3]], steps:[], result:'', type:resString[2]});
                            }
                        });
                        gameID++;
                        io.sockets.in(resString[0]).emit('accepted', user.name)
                        res.set(200).end('challenge accepted');
                        return;
                    }
                }
            }
        }
    });
}


function removeFriend(req, res, next){
    let found = false;
    userList.forEach(user=>{
        if(user.name == req.body[0]){
            for(i=0; i<user.friendList.length; i++){
                if(user.friendList[i].name == req.body[1]){
                    found = true;
                    user.friendList.splice(i,1);
                    
                }
            }
        }
    });
    userList.forEach(user=>{
        if(user.name == req.body[1]){
            for(i=0; i<user.friendList.length; i++){
                if(user.friendList[i].name == req.body[0]){
                    found = true;
                    user.friendList.splice(i,1);
                    
                }
            }
        }
    });
    if(found == true){
        res.set(200).end(' removed from friend list');
        return;
    }else{
        res.set(200).end(' is not in your friend list');
        return;
    }
}



function gameRequest(req, res, next){
    let exists = false;   //the request already exists in request list
    let pending = false;  //reciever has already sent a request with same type
    let alreadyInGame = false;  //reciever already in sender's friend list
    let alreadyInQueue = false;
    let foundRandom = false;
    let sender = req.body[0];
    let reciever = req.body[1];
    let gameType = req.body[2]; //restores what type of game '0' be public, '1' be friend only '2' be private;
    
    
    if(reciever === 'random'){//start looking for random games with same type
        if(randomQueue != []){
            randomQueue.forEach(queue=>{
                if (queue[0] == sender){
                    alreadyInQueue = true;
                }
            });
            if(alreadyInQueue === false){
                for(i=0; i<randomQueue.length; i++){
                    if(randomQueue[i][1] == gameType){
                        reciever = randomQueue[i][0];  //rederict the invitation to first person in queue that matches game type
                        console.log('Random is redericted to ' + reciever);
                        randomQueue.splice(i,1);  //remove this person from queue
                        foundRandom = true;
                        break;
                    }
                }
            }
        }
    }else{ //not looking for random game
        userList.forEach(user=>{
            if(user.name == sender){
                user.requests.forEach(request=>{  //check if reciever has sent a same type of request
                    if(request[0] == reciever && request[1] === 'game'){
                        pending = true;
                    }
                });
                games.forEach(game=>{  //check if you are in current games with same type
                    if((game.players[0] == sender && game.players[1] == reciever && game.type == gameType) || (game.players[1] == sender && game.players[0] == reciever && game.type == gameType)){
                        alreadyInGame = true;
                    }
                });
            }else if(user.name == reciever){
                user.requests.forEach(request=>{
                    if(request[0] == sender && request[1] == 'game'){
                        exists = true;
                    }
                });
            }
        });
    }
    
    
    if(req.body[1] == 'random'){ //user is looking for a random game
        if(alreadyInQueue === true){ //user is already in queue, alert user
            res.set(200).end('You are already in queue, please be patient');
            return;
        }else if(foundRandom === true){ //found a random game,
            userList.forEach(user=>{
                if(user.name == reciever){
                    user.requests.push([sender,'game',gameType]);
                }
            });
            res.set(200).end('found random game');
            io.sockets.in(sender).emit('refresh');
            io.sockets.in(reciever).emit('refresh');


            return;
        }else{
            randomQueue.push([sender,gameType]);
            res.set(200).end('You are put into a queue for a random game');
            console.log(sender + ' is now in random queue')
            return;
        }
    }else if(exists === true){
        res.set(200).end('You have already sent the invitation, waiting for him/her to response.');
        return;
    }else if(pending === true){
        res.set(200).end('He/She has already sent you a game invitation, please check your request section');
        return;
    }else if(alreadyInGame === true){
        res.set(200).end('You are ready in game with him/her, finish up the current one before you start a new one.')
        return;
    }else{
        userList.forEach(user=>{
            if(user.name == reciever){
                user.requests.push([sender,'game',gameType]);
            }
        });
        res.set(200).end('Your invitation is sent');
        io.sockets.in(sender).emit('refresh');
        io.sockets.in(reciever).emit('refresh');

        return;
    }
    console.log('Random queue: ' + randomQueue);
    
}


function loadGame(req, res, next){
    let user = req.body.split('&')[0].split('=')[1];
    let gid = req.body.split('&')[1].split('=')[1];
    let playerA;
    let playerB;
    allGames.forEach(game=>{
        if (game.id == gid){
            playerA = game.players[0];
            playerB = game.players[1];
        }
    })
    app.render('./Pages/game',{user, playerA, playerB, gid}, function(err, data){
        if(err){
            console.log(err);
            res.set(500).end();
            return;
        }else{
            res.writeHead(200, {'content-type': 'text.html'});
            res.end(data);
            return;
        }
        
    });
}


function send404(req, res, next){
    res.set(404).end('not found');
}


function replay(req, res, next){
    let gid = req.params.gid;
    allGames.forEach(game=>{
        if (game.id == gid){
            app.render('./Pages/replay', {game}, function(err, data){
                if(err){
                    console.log(err);
                    res.set(500).end();
                    return;
                }else{
                    res.writeHead(200, {'content-type':'text/html'});
                    res.end(data);
                    return;
                }
            })
        }
    })
}

function gameList(req, res, next){
    let gameList = [];
    let username = req.body.split('=')[1];
    
    allGames.forEach(game=>{//add all publid games to the list
        if (game.gameType == 0){
            gameList.push(game);
        }
    });
    userList.forEach(user=>{
        if(user.name == username){
            user.matches.forEach(match=>{
                if (match.gameType == 1){
                    if(gameList.indexOf(match) >= 0){
                        gameList.push(game);
                    }
                }
            })
        }
    });
    
    app.render('./Pages/allGames', {user:username, list:allGames}, function(err, data){
        if(err){
            console.log(err);
            res.set(500).end();
        }else{
            res.writeHead(200, {'content-type':'text/html'});
            res.end(data);
        }
    })
    
}

io.on('connection', socket=>{
    socket.on('disconnect', () => {
        socket.broadcast.to(socket.room).emit('leaveChat', socket.name);
    });
    
    socket.on('login', user=>{
        socket.name = user;
        socket.join(user);
    });
    
    socket.on('refresh', name=>{
        io.sockets.in(name).emit('refresh');
    });
    socket.on('decline', resString=>{
        io.sockets.in(resString.split('/')[0]).emit('deny', resString.split('/')[1]);
    });
    
    socket.on('joinChat', name=>{
        socket.name = name.split('/')[0];
        socket.room = name.split('/')[1]
        socket.join(socket.room);
        console.log(socket.name+' joined chatroom ' + name.split('/')[1]);
        allGames.forEach(game=>{
            if (game.id == name.split('/')[1]){
                socket.emit('init', JSON.stringify({messages: game.msgs, steps: game.steps}));
            }
        });
        socket.broadcast.to(socket.room).emit('newUser', socket.name);
    });
    
    
    socket.on("newmsg", message => {
        message = socket.name + ": " + message;
        console.log(message);
        allGames.forEach(game=>{
            if(game.id == socket.room){
                game.msgs.push(message);
            }
        });
        socket.broadcast.to(socket.room).emit("newmsg", message);
    })
    
    socket.on('drop', stepString=>{
        let color;
        let name =stepString.split('/')[0];
        let position = stepString.split('/')[1];
        let gid = stepString.split('/')[2]
        let count = 0;
        allGames.forEach(game=>{
            if(game.id == gid){
                game.steps.forEach(step=>{
                    if(step[1] == position){
                        count++;
                    }
                });
                if(game.players[0] != name && game.players[1] != name){ //if sender is not 1 of the players
                    console.log('invalied player');
                    socket.emit('noAccess', 'This is not your game');
                }else if(game.surrender == true){
                    socket.emit('noAccess', 'Game is over! Someone surrendered before you realizing it');
                }else if(game.steps[game.steps.length -1] == null){
                    console.log(name+' drop at '+ position + ' in match ' + gid);
                    if(game.steps.length == 0){
                        io.sockets.in(gid).emit('setBlack', name);
                    }
                    game.steps.push([name,position]);
                    io.sockets.in(socket.room).emit('drop', JSON.stringify([true,position,count]));
                    checkWin(game.id);
                }else if(game.winner != ''){
                    socket.emit('noAccess', 'Game is over');
                }else if(game.steps[game.steps.length -1][0] == stepString.split('/')[0]){  //if sender dropped last chess
                    socket.emit('noAccess',"It's not your turn yet");
                }else if(count == 6){
                    socket.emit('noAccess','this column is full');
                }else{
                    console.log(name+' drop at '+ position + ' in match ' + gid);
                    if(game.steps.length == 0){
                        io.sockets.in(gid).emit('setBlack', name);
                    }
                    game.steps.push([name,position]);
                    if((game.steps.length % 2) == 0){
                        color = false;
                    }else{
                        color = true;
                    }
                    io.sockets.in(socket.room).emit('drop', JSON.stringify([color,position,count]));
                    checkWin(game.id);
                }
            }
        })
    });
    
    socket.on('surrender', surrenderString=>{
        let username = surrenderString.split('/')[0];
        let gid = surrenderString.split('/')[1];
        allGames.forEach(game=>{
            if(game.id == gid){
                if(username != game.players[0] && username != game.players[1]){
                    socket.emit('noAccess','This is not your game');
                    return;
                }
                if(game.winner == ''){
                    game.surrender = true;
                    if(username == game.players[0]){
                        game.winner = game.players[1];
                        
                    }else{
                        game.winner = game.players[0];
                    }
                    io.sockets.in(gid).emit("noAccess", username + ' surrendered!');
                    //remove this game from both players' ongoing games and add it to their matchHistory
                    userList.forEach(user=>{
                        if(user.name == game.winner || user.name == username){
                            io.sockets.in(user.name).emit('refresh');
                            for(i=0;i<user.matches.length;i++){
                                if(user.matches[i].id == gid){
                                    user.matches.splice(i,1);
                                    user.matchHistory.push(game);
                                    user.gamePlayed++;
                                    for(i=0;i<games.length;i++){
                                        if(games[i].id == gid){
                                            games.splice(i,1);
                                        }
                                    }
                                    if(user.name == game.winner){
                                        user.win++;
                                    }
                                }
                            }
                        }
                    })
                    //remove this game from ongoing games;
                    for(i=0;i<games.length;i++){
                        if(games[i].id == gid){
                            games.splice(i,1);
                        }
                    }
                }else{
                    socket.emit('noAccess', 'Game is over');
                }
                
            }
            
        });
    });
});



function checkWin(gid){
    let count;
    let winner = '';
    let full = false;
    let board = [['','','','','',''],
                 ['','','','','',''],
                 ['','','','','',''],
                 ['','','','','',''],
                 ['','','','','',''],
                 ['','','','','',''],
                 ['','','','','','']
                 ];
    allGames.forEach(game=>{ //get the board in 2d to check if anyone won
        if (game.id == gid){
            game.steps.forEach(step=>{
                if(step.length == 42){
                    full == true;
                }
                for(i=0;i<6;i++){
                    if (board[step[1]][i] == ''){
                        board[step[1]][i] = step[0];
                        break;
                    }else{
                        continue;
                    }
                }
            });
        }
    });
    
    console.log(board);
    
    //start checking for win(easy but inefficient way)
    // '--'
    for(i=0;i<=3; i++){
        for(j=0;j<=5;j++){
            if(board[i][j] != ''){
                if(board[i][j] == board[i+1][j] && board[i+2][j] == board[i+3][j]  && board[i+1][j] == board[i+2][j]){
                    winner = board[i][j];
                }
            }
        }
    }
    // '|'
    for(i=0;i<=6; i++){
        for(j=0;j<=2;j++){
            if(board[i][j] != ''){
                if(board[i][j] == board[i][j+1] && board[i][j] == board[i][j+2] && board[i][j] == board[i][j+3]){
                    winner = board[i][j];
                }
            }
        }
    }
    // '/'
    for(i=0;i<=3; i++){
        for(j=0;j<=2;j++){
            if(board[i][j] != ''){
                if(board[i][j] == board[i+1][j+1] && board[i][j] == board[i+2][j+2] && board[i][j] == board[i+3][j+3]){
                    winner = board[i][j];
                    
                }
            }
        }
    }
    // '\'
    for(i=0;i<=3; i++){
        for(j=5;j>=2;j--){
            if(board[i][j] != ''){
                if(board[i][j] == board[i+1][j-1] && board[i][j] == board[i+2][j-2] && board[i][j] == board[i+3][j-3]){
                    winner = board[i][j];
                }
            }
        }
    }
        
    if(winner != ''){ //we have a winner
        allGames.forEach(game=>{
            if(game.id == gid){
                game.winner = winner;
                userList.forEach(user=>{
                    if (user.name == game.players[0] || user.name == game.players[1]){
                        user.matchHistory.push(game);
                        user.gamePlayed++;
                        if(user.name == winner){
                            user.win++;
                            io.sockets.in(gid).emit('winner', winner);

                        }
                        for(i=0;i<user.matches.length; i++){
                            if(user.matches[i].id == game.id){
                                user.matches.splice(i,1);
                                io.sockets.in(user.name).emit('refresh');
                                for(i=0;i<games.length;i++){
                                    if(games[i].id == gid){
                                        games.splice(i,1);
                                        console.log(gid + ' removed from ongoing matches');
                    
                                        console.log('in game '+ gid+'winner is '+winner);
                                        
                                    }
                                }
                            }
                        }
                        console.log('game added to '+ user.name+ "'s history");
                    }
                })
            }
        });
    }else if(full){ //board is full and no one won
        io.sockets.in(socket.room).emit('noAccess', "Draw");
        allGames.forEach(game=>{
            if(game.id == gid){
                game.winner = 'draw';
                userList.forEach(user=>{
                    if (user.name == game.players[0] || user.name == game.players[1]){
                        user.matchHistory.push(game);
                        user.gamePlayed++;
                        for(i=0;i<user.matches.length; i++){
                            if(user.matches[i].id == game.id){
                                user.matches.splice(i,1);
                                io.sockets.in(user.name).emit('refresh');
                                for(i=0;i<games.length;i++){
                                    if(games[i].id == gid){
                                        games.splice(i,1);
                                    }
                                }
                            }
                        }
                    
                    }
                })
            }
        });
    }
}
    

app.use(logger);//log each request
app.use(parser);//parse request body
app.use('/games',bodyParser.text({type: ["application/x-www-form-urlencoded"]})); //parse request body for forms

app.use('/home',bodyParser.text({type: ["application/x-www-form-urlencoded"]})); //parse request body for forms
app.use('/friends/:id',bodyParser.text({type: ["application/x-www-form-urlencoded"]})); //parse request body for forms
app.use('/games/:id',bodyParser.text({type: ["application/x-www-form-urlencoded"]})); //parse request body for forms
app.get('/', serveLogin); //get log in page
app.get('/login.html', serveLogin); //get login page
app.get('/script.js', serveScript); //script for all function
app.get('/jquery.js', jqueryScript); //not used
app.get('/register.html', loadRegister); //get register page
app.post('/register', userRegister); //register a user with recieved info(if valid)
app.post('/home', userLogin); //user's home page
app.post('/logout', logout); //log user out
app.post('/privacy', changePrivacy);  //change user's privacy
app.get('/users/:name', viewUser);  //navigate another user
app.get('/users', search); //search page
app.post('/add', sendAdd); //send a add friend request
app.get('/viewFriend/:name', viewFriend); //navegite a friend on home page
app.post('/handler', handler); //handle pending request(addFriend/game);
app.post('/remove', removeFriend);//remove friends from each other
app.post('/gameRequest', gameRequest);
app.post('/games', gameList);//get ongoing game list
app.post('/games/:gid', loadGame);//get game page with given id
app.get('/history/:gid', replay);
app.post('/friends/:id', viewFriend);

app.use('/', send404);



//Start the server
server.listen(4000);
console.log('server running on http://localhost:4000');
