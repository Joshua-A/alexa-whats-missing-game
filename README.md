# alexa-whats-missing-game
A simple Alexa memory game built on the ASK SDK v2 for Node.js

Built to test out the ASK SDK, as well as running code on AWS Lambda and the Alexa App development process.

## How it works
After the app opens and introduces the game, users can ask for *help* which will give the user a spiel, or can start a *new game*. The game runs as follows:
1. Alexa reads out 3 randomly selected items
2. Alexa removes one item and shuffles the others
3. Alex reads out the new smaller list
4. Alexa prompts the user to identify the missing item ('Answer' slot directive)
5. The user tells Alexa which item has been removed

If the user is correct, they get verbally patted on the back, and offered another game, which will have one more item in the starting list. Otherwise, the user will be told how many rounds in a row they got right, and are given the option to start a new game.

## Intents
* StartGameIntent
  * Intent Slot: Answer
  * Runs a new round, see above.
* AMAZON.HelpIntent
Tells the user how to play
* AMAZON.YesIntent
Typically in response to being offered to start a new game
* AMAZON.NoIntent
Typically in response to being offered to start a new game
* AMAZON.CancelIntent
Quit the game
* AMAZON.StopIntent
Quit the game
* AMAZON.FallbackIntent
Handles unexpected utterances

## Slot Types
* Item
Trained with about 100 objects (Animals, Food, Clothes, Furniture, Misc) plus synonyms
Also picks up help utterances, to allow users to get the help spiel mid-game without coming out of the round. Alexa then reprompts once the help has been read out.

## To Do
* Move from hardcoded item list to database solution
* More training data on the Item slot type
* UK Alexa pronounces Donkey weirdly?
