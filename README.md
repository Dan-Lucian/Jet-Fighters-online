# Jet Fighters Online

### What is this?
* An online real-time multiplayer game featuring 2d aircraft combat.
* To play the game use left and right arrow keys for jet steering and "space" for shooting.

### Features
* You can create a game room with a unique code and share the code with a friend.
* Supports multiple rooms, it is not limited just to one game instance.
* Game customization. You can choose maximum score, map size, jet color and jet type (balanced, speedy, twitchy).
* No need to send the code every game, you can ask for rematches and/or change game customization at the end.

### What I've learned from doing this project
* How to setup a basic node server.
* How to use WebSocket for real-time data exchange, here I used built-in js WebSocket features for the frontend, and [ws](https://www.npmjs.com/package/ws) npm package for the backend.
* How to work with room systems and how to make the game sclable.
* How to work with canvas html element to create animations.
* How to create a basic game logic and game loop.
* How to double validate form data, once on the front and once on the server.
* How to host a front on [netlify](https://www.netlify.com/).
* How to host a bckend on [heroku](https://www.heroku.com/)

### What next?
* Add the possiblity to join a random game, thus miitgating the "create a room, share the code" process for solo players.
* Add more customization: bullet speed, jet size.
* Add more jet types.
* Add more jet colors.
* Migrate everything to just a node project using [express](https://www.npmjs.com/package/express), removing the need to host the front on netlify.
