# [Jet Fighters Online](https://objective-easley-303f76.netlify.app/) (click to play)
- [Game link](https://objective-easley-303f76.netlify.app/)

## Table of contents

- [What is this?](#what-is-this)
- [Screenshots](#screenshots)
  - [Live game](#live-game)
  - [Game Over menu](#game-over-menu)
- [Features](#features)
- [What I've learned](#what-I've-learned-from-doing-this-project)
- [What next?](#what-next)

## What is this?
* An online real-time multiplayer game featuring 2d aircraft combat.
* To play the game use left and right arrow keys for jet steering and "space" for shooting.

## Screenshots

### Live game
![alt text](https://raw.githubusercontent.com/Dan-Lucian/Jet-Fighters-online/main/design/Game-going.png "Game")

### Game Over menu
![alt text](https://raw.githubusercontent.com/Dan-Lucian/Jet-Fighters-online/main/design/Game-over-menu.png "Game-over")

## Features
* You can create a room with a unique ID, then share it with a friend to play the game.
* Supports multiple rooms, it is not limited to just one game.
* Game customization. You can choose the maximum score, map size, jet color and jet type (balanced, speedy, twitchy).
* No need to send the room ID every game, you can ask for rematches and/or change game customization at the end.

## What I've learned from doing this project
* How to setup a basic node server.
* How to use WebSocket for real-time data exchange, here I used the built-in js WebSocket feature for the frontend, and [ws](https://www.npmjs.com/package/ws) npm package for the backend.
* How to work with room systems and how to make the game scalable.
* How to work with canvas html element to create animations.
* How to create a game logic and a game loop.
* How to double validate form data, once on the front and once on the server.
* How to host a front on [netlify](https://www.netlify.com/).
* How to host a backend on [heroku](https://www.heroku.com/)

## What next?
* Add the possiblity to join a random game, thus mitigating the "create a room, share the code" process for solo players.
* Add more customization: bullet speed, jet size.
* Add more jet types.
* Add more jet colors.
* Add user accounts and authetication.
* Add game statistics.
* Migrate everything to just a node project using [express](https://www.npmjs.com/package/express), removing the need to host the front on netlify.
