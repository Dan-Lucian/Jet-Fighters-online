# [Jet Fighters Online](https://objective-easley-303f76.netlify.app/) (click to play)
- This is an outdated website, please visit [jet-fighters-online-2.0](https://github.com/Dan-Lucian/jet-fighters-online-2.0) repository.
- [Game link](https://objective-easley-303f76.netlify.app/)

## Table of contents

- [What is this?](#what-is-this)
- [How to play](#how-to-play)
- [Screenshots](#screenshots)
  - [Live game](#live-game)
  - [Game Over menu](#game-over-menu)
- [Features](#features)
- [What I've learned](#what-ive-learned-from-doing-this-project)
- [Technologies used](#technologies-used)
- [What next?](#what-next)

## What is this?
* An online real-time multiplayer game featuring 2d aircraft combat.
* To play the game use left and right arrow keys for jet steering and "space" for shooting.

## How to play
1. Customize your game by redacting max score, map sizes, jet color and jet type (balanced, speedy, twitchy).
2. Create a game room by pressing "create a new game" blue button.
3. You will receive a room ID which you will share with your friend.
4. Your friend can customize his jet color and jet type but the max score and map sizes will be ignored.
5. Your friend should put this ID inside "Write room ID here" reactangle bellow "Join game" blue button and press the button.
6. Now you should be connected and a timer will mark the game start.
7. Upon game over you can ask to play again or exit the game room.
8. The player who asks to play again sets the game customization.
9. The player who accepts the rematch can choose only the jet characteristics.
10. You can play in the same room as long as both players are connected and nobody left the room.
11. You are now ready! Have Fun!

## Screenshots

### Game menu
![alt text](https://raw.githubusercontent.com/Dan-Lucian/Jet-Fighters-online/main/design/Game-menu.png "Game menu")

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

## Technologies used
* html
* sass
* vanilla javascript
* node.js

## What next?
* Add the possiblity to join a random game, thus mitigating the "create a room, share the code" process for solo players.
* Add more customization: bullet speed, jet size.
* Add more jet types.
* Add more jet colors.
* Add user accounts and authetication.
* Add game statistics.
* Migrate everything to just a node project using [express](https://www.npmjs.com/package/express), removing the need to host the front on netlify.
