Student Name: Qihang Peng (no partner)
ID: 101013564
Project: Connect4
floating IP:134.117.131.36
This is my open stack intance for COMP3000(I am not able to log into the one for COMP2406), I installed node and npm. It works when I was testing.


Server is in Connect4 folder, 'cd Connect4'
Everything required should be installed, 'node server.js' should run the server.
Please note when creating ssh tunnel, use port 8888, it says 9999 already in use when I tied 9999;

Ssh student@134.117.131.36
Password: 721018pqH!

Creating ssh tunnel
ssh -L 8888:localhost:3000 student@134.117.131.36

Then open 'localhost:8888'


Just in case
Install:
	run 'npm install' to install all required dependencies(ejs, socket.io, express)


Testing: username: Alex
	password: aaaaaa
	
	username: Ben
	password: bbbbbb
	
	username: Claire
	password: cccccc

	username: Daniel
	password: dddddd

Please do not use the pre-registered users '1' and '2'(these are for fast login when debugging, it will break socket connections)


Content:

All scripts are in a single js file ---- Script.js

Server.js 

Package.json

Login page:
Login page allows user to log in with username and password. Login is done by submitting a form.
Username and password are case sensitive.


Register page:
Register page allows user to register new account. User name must be longer than 5, shorter than 18, password must be longer than 5.


Home page:
Once logged in, user will be connected by socket. Benefit of using socket is that, when someone send a request to user, or user's friend login to the game, user can be notified immediately(else user will have to manually refresh page). This is done by emitting a signal to the server then server decides who should receive this signal and emit a signal to the clients that should receive. 

There are 4 display fields. Top left one is for game history, users can click on 'watch' to see the game replay step by step. Click on players name will go to view page of the user(if it's public). Middle left is for ongoing matches. Clicking on go will open game page in a new window. Bottom left one is for requests(add friend request/game invitations). The one on the right is friend list. Once a friend login, current user will receive a signal through socket and the page will auto refresh(update friends' state and sort friend list). Friend list is sorted by state(online ones are alway on the top) then name(alphabetically). Users can click on friends' name to view friends. This is done by submitting a form(the link is actual faked by a button). It shows additional info compares to search result(you can see friend's ongoing matches if it's not private). 





Search page:
Users can search other users by name, doing so will direct user to the search page with the string user searched. It will only show the users that are set to public. User can click on the result to see the details of the target(including name, game played, win rate, and game history of the games that are public). Watch button will direct user to the History page where can watch game history step by step. 

Searching is not case sensitive.

"Localhost:3000/users" will also direct to search page. This will show all existing public users, this is same as searching empty string.

'Localhost:3000/users/:name' will show given name's page





allGames page:
This page shows all ongoing matches that are viewable(public or one of the players is your friend). Click on watch will open game page in a new window. 



Replay page:
This page can display game history step by step. 




View page(view other users' profile and history):
There are 2 versions of view page. One is from search and game history, this is done through GET request, this only show targets' public info. The other one is from click users in friend list. This is done through POST request, this will also show friend only info. 




Game page:
This is where players actually play their game. People are connect to socket once enter. Almost all things are done through socket. Namespace is set to game.id so that messages only can be sent and received in this room. Board and chess pieces are draw on canvas. 7 'drop' buttons indicate which row players are dropping their chess. Only two players are allowed to click on drop(other users will be notified that they don't have access)
Below game board is chatroom(the same one as in lecture). Right side of the board shows who's black(decided by who drops first) and whose turn it currently is. Once one of the players wins the game or surrenders, everyone in the room will be alert who the winner is(People can still stay in the room to chat), and the game will be add to both players history, and removed from ongoing matches. 

The drop list to the left of the "start" button indicates who the user want to play the game with. The users in the drop list are from the friend list. Choosing random will first check if the random queue has anyone wait for a game(with matching type: public/friend only/private). If no game is found user will be put into the random queue. And the queue is first in first out.   



Note:
I tried uuid to generate unique id for games but it keeps give me errors, I google and it said that uuid doesn't work with my node version, and I did't want to change node midway.



Missing pieces: 
Game page doesn't show who is currently in the room.
Data are stored in RAM, restarting server will lose all data. 




Improvement: 
Some of the designs are not efficient, for example, then function that check if the match is over and someone won(could be check the position last time dropped instead of going over the whole board).

Data transfers are not formatted(sometimes JSON object and sometimes just strings added together). 

Socket are not well implemented. Could've been putting people in a certain room instead of the room with game.id, so that people can rematch after they finish one game instead of having to go back to home page and resend invitation again.

Username may conflict with game id if user id is plain number. 

Data are not stored using database and some of the data are duplicates(games and ongoing games for example, they contain same informations, could be just games with a status indicate if the game is over). 

Some thing can be done on client side but is done on server side(for example, when someone login, could be updating innerHTML instead of refreshing the page (requires server to render the page again).


Pros:
The page structure is not fancy but overall clean and easily readable.








