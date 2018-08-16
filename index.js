/*
 * "What's Missing?" - An Alexa Skill Memory Game
 * Main File
 * 
 * Author: Josh Adams
 * Created: 30/07/18
 */
 
const Alexa = require('ask-sdk-core');

/* STRINGS & LISTS */

const WELCOME_MESSAGE = 
'Welcome to What\'s Missing! \
If this is your first time playing, say <say-as interpret-as="interjection">help</say-as>, \
and I\'ll go through the instructions with you. Otherwise, tell me when you\'re ready, and I\'ll begin.';
const INSTRUCTIONS_MESSAGE = 
'In this game, I will list off some items I have here with me. \
Remember what I say, because I\'m going to shuffle them up and remove one item. \
When I\'m done, it will be your job to tell me which item I have removed. \
Remember, answers such as, <prosody rate="slow" pitch="high"><say-as interpret-as="interjection">an</say-as></prosody> apple, are better than just, apple. So, ';
const READY_MESSAGE = 'Are you ready to play?';
const RESTART_MESSAGE = 'Alright, let\'s start again. ';
const STARTNEW_MESSAGES = [
    'Right, here we go. ',
    'Okay then, let\'s begin. ',
    'Alright then, off we go. '
];
const PRESHUFFLE_MESSAGES = [
    'Now, I\'m going to remove one. Wait just a moment! ',
    'Now, I\'m going to take one away. Bear with me! ',
    'Now, I\'m going to get rid of one. Be right back! '
];
const SHUFFLE_SOUND = "<audio src='https://s3.amazonaws.com/ask-soundlibrary/foley/amzn_sfx_swoosh_cartoon_fast_02.mp3'/>";
const POSTSHUFFLE_MESSAGES = [
    'All done! Now, listen carefully. ', // while I tell you what I have left. ',
    'There we go! Now, pay close attention. ', // as I tell you what I\'m left with. ',
    'That should do it! Now, listen closely. ' // because now I\'m going to tell you what I have remaining. '
];
const ANSWERPROMPT_MESSAGE = 'What\'s Missing?';
const CORRECTANSWER_SOUND = "<audio src='https://s3.amazonaws.com/ask-soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_02.mp3'/>";
const CORRECTANSWER_MESSAGES = [
    '<say-as interpret-as="interjection">Well done</say-as>! That\'s the right answer! ',
    '<say-as interpret-as="interjection">Yes</say-as>! That\'s  correct, well done! ',
    'That\'s absolutely right! Well done! ',
    '<say-as interpret-as="interjection">Hooray</say-as>! You got it right! Well done! '
];
const INAROW_PREPRESSAGE = 'That\'s ';
const INAROW_POSTMESSAGE = ' in a row! ';
const INCREASEDIFFICULTY_MESSAGES = [
    'I\'ll have to make the next one a bit harder for you. ',
    'Don\'t worry, I\'ll make the next one a little trickier. ',
    ' I\'ll make the next round a little more difficult. '
];
const INCORRECTANSWER_SOUND = "<audio src='https://s3.amazonaws.com/ask-soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_02.mp3'/>";
const INCORRECTANSWER_MESSAGES = [
    'Oh sorry, that isn\'t what I was looking for. ',
    '<say-as interpret-as="interjection">Oh my</say-as>, I\'m afraid that\'s not right. ',
    'Sorry, that\'s not it. ',
    'I\'m afraid not. '
];
const GIVECORRECT_MESSAGE = 'The correct answer was ';
const ASKNEWGAME_MESSAGE = 'Would you like to play another round? ';
const GOODBYE_MESSAGES = [
    'See you later! ',
    'Goodbye! ',
    'See you again soon! '
];
const FALLBACK_MESSAGE = 'I\'m sorry, I\'m not sure what you are trying to do. \
You can always say help to hear instructions, or say restart to start a new game. ';

const STARTING_DIFFICULTY = 3; // Number of items in first round

/* HANDLERS */

// Launch Request
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.state = 'start'; // Initialise the session state attribute
        handlerInput.attributesManager.setSessionAttributes(attributes);
        return handlerInput.responseBuilder
            .speak(WELCOME_MESSAGE)
            .reprompt(READY_MESSAGE)
            .getResponse();
    }
};

// When a user tries to start a new game at the start or end
const StartGameHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'StartGameIntent' ||
            request.intent.name === 'AMAZON.StartOverIntent' ||
            (request.intent.name === 'AMAZON.YesIntent' &&
            (attributes.state === 'start' || attributes.state === 'gameover')));
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        if (attributes.difficulty === null) { // How many items to put in the list? Goes up by 1 every win
            attributes.difficulty = STARTING_DIFFICULTY;
        }
        if (attributes.difficulty < STARTING_DIFFICULTY) {
            attributes.difficulty = STARTING_DIFFICULTY;
        }
        handlerInput.attributesManager.setSessionAttributes(attributes);
        var responseMessage = '';
        if (request.intent.name === 'AMAZON.StartOverIntent' || 
            (attributes.state === 'playing' && request.intent.name === 'StartGameIntent')) {
            responseMessage += RESTART_MESSAGE;
        } else {
            responseMessage += pickRandomListItem(STARTNEW_MESSAGES);
        }
        responseMessage += playRound(handlerInput, attributes.difficulty);
        return handlerInput.responseBuilder
            .speak(responseMessage)
            .reprompt(ANSWERPROMPT_MESSAGE)
            .getResponse();
    }
};

// When a user provides an answer
const AnswerHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' &&
            request.intent.name === 'AnswerIntent' &&
            attributes.state === 'playing';
    },
    handle(handlerInput) {
        const responseMessage = resolveAnswer(handlerInput);
        return handlerInput.responseBuilder
            .speak(responseMessage)
            .reprompt(ASKNEWGAME_MESSAGE)
            .getResponse();
    }
};

// When a user says no to a new game or chooses to exit
const QuitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'AMAZON.StopIntent' ||
            request.intent.name === 'AMAZON.CancelIntent' ||
                (request.intent.name === 'AMAZON.NoIntent' &&
                (attributes.state === 'start' || attributes.state === 'gameover'))
            );
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(pickRandomListItem(GOODBYE_MESSAGES))
            .getResponse();
    }
};

// When a user asks for help or instructions
const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        var response = INSTRUCTIONS_MESSAGE;
        var endResponse = '';
        if (attributes.state !== 'playing') {
            endResponse += READY_MESSAGE;
        } else {
            endResponse += ANSWERPROMPT_MESSAGE;
        }
        response += endResponse;
        return handlerInput.responseBuilder
            .speak(response)
            .reprompt(endResponse)
            .getResponse();
    }
};

// When a user says something unexpected
const FallbackHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.intent.name === 'AMAZON.FallbackIntent' || 
                ((request.intent.name === 'AMAZON.YesIntent' || request.intent.name === 'AMAZON.NoIntent') && // Yes or No in the middle of a game or as an invocation
                (attributes.state !== 'start' || attributes.state !== 'gameover')) || 
                (request.intent.name === 'AnswerIntent' && attributes.state !== 'playing'); // Answer given when not in a game
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        var reprompt = '';
        if (attributes.state === 'playing') {
            reprompt += ANSWERPROMPT_MESSAGE;
        } else { 
            attributes.state === 'playing';
            handlerInput.attributesManager.setSessionAttributes(attributes);
            reprompt += READY_MESSAGE;
        }
        return handlerInput.responseBuilder
            .speak(FALLBACK_MESSAGE + reprompt)
            .reprompt(reprompt)
            .getResponse();
    }
};

/* Skills builder */
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder.addRequestHandlers(
        LaunchRequestHandler,
        StartGameHandler,
        AnswerHandler,
        QuitHandler,
        HelpHandler,
        FallbackHandler
    ).lambda();


/* HELPER FUNCTIONS */

// Returns a random integer between mix and max. The maximum is exclusive and the minimum is inclusive
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

// Return a random item from a list
// @param list The list to pick from
function pickRandomListItem(list) {
    const max = list.length;
    const randPos = getRandomInt(0, max);
    return list[randPos];
}

// Randomises the elements in a list and returns it
// @param list The list to randomise
function randomiseList(list) {
    var initialList = list.slice();
    var returnList = [];
    while (initialList.length != 0)
    {
        const max = initialList.length;
        const randPos = getRandomInt(0, max);
        returnList.push(initialList[randPos]);
        initialList.splice(randPos, 1);
    }
    return returnList;
}

// Returns a list containing random objects
// @param amount The number of objects in the list
function generateItemList(amount) {
    // Don't break if we run out of stuff
    if (amount > ITEM_LIST.length) {
        amount = ITEM_LIST.length;
    }
    // Build a new list and fill it with random things from ITEM_LIST
    var tempItemList = ITEM_LIST.slice();
    var returnList = [];
    for (var i = 0; i < amount; i++) {
        const max = tempItemList.length;
        const randPos = getRandomInt(0, max);
        returnList.push(tempItemList[randPos]);
        tempItemList.splice(randPos, 1);
    }
    return returnList;
}

// Returns a randomly ordered item list missing one item
// @param itemList The list to randomise and remove from
function removeOneAndShuffle(itemList, handlerInput) {
    var tempList = itemList.slice();
    // Randomly sort list
    var subList = randomiseList(tempList);
    // Remove last item in the list and save as a session attribute
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.removedItem = subList[subList.length - 1]; // Keep the removed item, as this is what the players are guessing
    handlerInput.attributesManager.setSessionAttributes(attributes);
    subList.splice(-1, 1);
    return subList;
}

// Returns a list of items in a string to be read by Alexa
// @param itemList The list of items to read out
function readList(itemList) {
    var returnString = 'I have ';
    const len = itemList.length;
    if (len == 1) { // Only item in list
        returnString = itemList[0].article + ' ' + itemList[0].noun;
    } else {
        for (var i = 0; i < len; i++) {
            if (i == len - 1) { // Last element in list
                returnString += 'and ';
            }
            returnString += itemList[i].article + ' ' + itemList[i].noun + ', ';
        }
    }
    returnString = returnString.substring(0, returnString.length - 2);
    returnString += '. ';
    return returnString;
}

// Checks the expected answer against the response given by the player
// @param expected The correct answer object
// @param actual The answer string provided by the player
function checkAnswer(expected, actual) {
    const expectedName = expected.noun;
    const expectedSynonyms = expected.synonyms;
    // Direct match when the name of the item matches the response
    if (expectedName == actual) {
        return true;
    }
    // Close match when one of the items synonyms matches the response
    if (expectedSynonyms != null && expectedSynonyms.length > 0) {
        for (var x in expectedSynonyms) {
            if (expectedSynonyms[x] == actual) {
                return true;
            }
        }
    }
    return false;
}

// Put together a new game round, and builds the response
function playRound(handlerInput, difficulty) {
    var response = '';
    // Set game state
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.state = 'playing';
    handlerInput.attributesManager.setSessionAttributes(attributes);
    // Generate new random list of objects
    const itemListStart = generateItemList(difficulty);
    // Add the list to the response
    response += readList(itemListStart);
    // Add part 2 explaination to the response
    response += '<break time="500ms"/>';
    response += pickRandomListItem(PRESHUFFLE_MESSAGES);
    response += SHUFFLE_SOUND;
    // Generate sublist containing elements in a random order with one removed.
    const itemListEnd = removeOneAndShuffle(itemListStart, handlerInput);
    // Add the sublist to the response
    response += pickRandomListItem(POSTSHUFFLE_MESSAGES);
    response += readList(itemListEnd);
    // Add the prompt for an answer
    response += ANSWERPROMPT_MESSAGE;
    return response;
}

// Check the answer provided by the player, and handle end game stuff
function resolveAnswer(handlerInput) {
    //Set game state
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.state = 'gameover';
    if (attributes.combo == null || attributes.combo < 1) {
        attributes.combo = 1;
    } else {
        attributes.combo++;
    }
    // Check answer and return appropriate response
    var response = '';
    const correctAnswer = attributes.removedItem;
    const playerAnswer = handlerInput.requestEnvelope.request.intent.slots.answer.value;
    const isPlayerCorrect = checkAnswer(correctAnswer, playerAnswer);
    if (isPlayerCorrect) {
        response += CORRECTANSWER_SOUND + pickRandomListItem(CORRECTANSWER_MESSAGES);
        if (attributes.combo > 1) {
            response += INAROW_PREPRESSAGE + attributes.combo + INAROW_POSTMESSAGE;
        }
        response += pickRandomListItem(INCREASEDIFFICULTY_MESSAGES);
        attributes.difficulty = attributes.difficulty + 1;
    } else {
        response += INCORRECTANSWER_SOUND + pickRandomListItem(INCORRECTANSWER_MESSAGES) + 
                    GIVECORRECT_MESSAGE + correctAnswer.article + ' ' + correctAnswer.noun + '. ';
        attributes.combo = 0;
    }
    handlerInput.attributesManager.setSessionAttributes(attributes);
    // Prompt for a new game
    response += ASKNEWGAME_MESSAGE;
    return response;
}

/* The Item List */
const ITEM_LIST = [
    // Animals
    {"noun":"cat","article":"a","synonyms":["kitten","kitty","pussy","pussy cat","push cat"]},
    {"noun":"dog","article":"a","synonyms":["puppy","pup","doggo","doggy"]},
    {"noun":"fish","article":"a","synonyms":["fishy"]},
    {"noun":"cow","article":"a"},
    {"noun":"sheep","article":"a"},
    {"noun":"rabbit","article":"a"},
    {"noun":"duck","article":"a"},
    {"noun":"horse","article":"a"},
    {"noun":"pig","article":"a"},
    {"noun":"chicken","article":"a"},
    {"noun":"goat","article":"a"},
    {"noun":"donkey","article":"a"},
    {"noun":"llama","article":"a"},
    {"noun":"mouse","article":"a"},
    {"noun":"hedgehog","article":"a","synonyms":["porcupine"]},
    {"noun":"bear","article":"a"},
    {"noun":"snake","article":"a"},
    {"noun":"lion","article":"a"},
    {"noun":"tiger","article":"a"},
    {"noun":"bird","article":"a"},
    {"noun":"turtle","article":"a"},
    {"noun":"frog","article":"a"},
    {"noun":"octopus","article":"a"},
    {"noun":"crab","article":"a"},
    {"noun":"elephant","article":"an"},
    {"noun":"zebra","article":"a"},
    // Food
    {"noun":"apple","article":"an"},
    {"noun":"banana","article":"a"},
    {"noun":"melon","article":"a","synonyms":["watermelon"]},
    {"noun":"strawberry","article":"a"},
    {"noun":"raspberry","article":"a"},
    {"noun":"cake","article":"a","synonyms":["birthday cake","gateau"]},
    {"noun":"burger","article":"a"},
    {"noun":"pizza","article":"a"},
    {"noun":"potato","article":"a"},
    {"noun":"carrot","article":"a"},
    {"noun":"cauliflower","article":"a"},
    {"noun":"smoothie","article":"a"},
    {"noun":"milkshake","article":"a"},
    {"noun":"onion","article":"an"},
    {"noun":"pepper","article":"a"},
    {"noun":"peanut","article":"a"},
    {"noun":"steak","article":"a"},
    {"noun":"egg","article":"an"},
    {"noun":"aubergine","article":"an","synonyms":["eggplant"]},
    {"noun":"avocado","article":"an","synonyms":["avo"]},
    {"noun":"sandwich","article":"a"},
    // Vehicle
    {"noun":"car","article":"a","synonyms":["auto","motor car"]},
    {"noun":"train","article":"a","synonyms":["metro"]},
    {"noun":"aeroplane","article":"an","synonyms":["airplane","plane"]},
    {"noun":"skateboard","article":"a","synonyms":["board"]},
    {"noun":"boat","article":"a","synonyms":["ship","yacht","cruise boat","sail boat"]},
    {"noun":"submarine","article":"a","synonyms":["sub","submersible"]},
    {"noun":"bicycle","article":"a","synonyms":["bike","cycle","pedal bike","push bike"]},
    {"noun":"spaceship","article":"a","synonyms":["spacecraft","rocket ship"]},
    // Furniture
    {"noun":"chair","article":"a"},
    {"noun":"table","article":"a"},
    {"noun":"cupboard","article":"a","synonyms":["cabinet","closet","wardrobe"]},
    {"noun":"oven","article":"an","synonyms":["range"]},
    {"noun":"microwave","article":"a","synonyms":["microwave oven"]},
    {"noun":"bed","article":"a","synonyms":["bunk","cot","crib"]},
    {"noun":"sink","article":"a","synonyms":["basin","wash basin"]},
    {"noun":"sofa","article":"a","synonyms":["couch","settee","divan"]},
    // Clothing
    {"noun":"shirt","article":"a","synonyms":["t-shirt","T shirt"]},
    {"noun":"skirt","article":"a","synonyms":["dress"]},
    {"noun":"necklace","article":"a","synonyms":["pendant","locket"]},
    {"noun":"sock","article":"a"},
    {"noun":"shoe","article":"a","synonyms":["boot","sneaker"]},
    {"noun":"coat","article":"a","synonyms":["cloak","jacket"]},
    {"noun":"hat","article":"a","synonyms":["cap"]},
    {"noun":"tie","article":"a","synonyms":["bow tie"]},
    // Misc
    {"noun":"drumstick","article":"a"},
    {"noun":"kite","article":"a"},
    {"noun":"stapler","article":"a"},
    {"noun":"pen","article":"a","synonyms":["pencil"]},
    {"noun":"book","article":"a","synonyms":["textbook","novel","workbook"]},
    {"noun":"magazine","article":"a","synonyms":["comic"]},
    {"noun":"disco ball","article":"a"},
    {"noun":"painting","article":"a","synonyms":["artwork","poster","canvas"]},
    {"noun":"photograph","article":"a","synonyms":["photo","picture"]},
    {"noun":"ball","article":"a"},
    {"noun":"cup","article":"a","synonyms":["bottle","glass","mug"]},
    {"noun":"tissue","article":"a","synonyms":["handkerchief","tissue paper","toilet tissue","paper towel","facial tissue"]},
    {"noun":"fan","article":"a"},
    {"noun":"magnet","article":"a"},
    {"noun":"alien","article":"an","synonyms":["little green man","green man","UFO","martian","extraterrestrial","ET"]},
    {"noun":"computer","article":"a","synonyms":["PC","laptop"]},
    {"noun":"watch","article":"a","synonyms":["wristwatch","wrist watch"]},
    {"noun":"phone","article":"a","synonyms":["cell phone","mobile","mobile phone"]},
    {"noun":"vase","article":"a"},
    {"noun":"brick","article":"a"},
    {"noun":"pillow","article":"a","synonyms":["cushion"]},
    {"noun":"towel","article":"a"},
    {"noun":"boomerang","article":"a"},
    {"noun":"flag","article":"a"},
    {"noun":"lightbulb","article":"a","synonyms":["light bulb"]},
    {"noun":"nail","article":"a"},
    {"noun":"sponge","article":"a"},
    {"noun":"thimble","article":"a"},
    {"noun":"map","article":"a"}
];