/*
 * "What's Missing?" - An Alexa Skill Memory Game
 * Author: Josh Adams
 * Created: 30/07/18
 */
 
const Alexa = require('ask-sdk-core');

/* STRINGS & LISTS */

const WELCOME_MESSAGE = 
'Welcome to What\'s Missing! \
I\'m going to list the items I have here with me, \
then shuffle them up and remove one item. It will be your job to tell me \
which item I have removed. Are you ready?';
const READY_MESSAGE = 'Are you ready to play?';
const STARTNEW_MESSAGES = [
    '<say-as interpret-as="interjection">okey dokey</say-as>, here we go.',
    'Okay then, let\'s begin.',
    'Alright then, off we go.'
];
const PRESHUFFLE_MESSAGES = [
    'Now, I\'m going to remove one. Wait just a moment!',
    'Now, I\'m going to take one away. Bear with me!',
    'Now, I\'m going to get rid of one. Be right back!'
];
const POSTSHUFFLE_MESSAGES = [
    'All done! Now listen carefully while I tell you what I have left.',
    'There we go! Now pay close attention as I tell you what I\'m left with',
    'That should do it! Now listen closely, because now I\'m going to tell you what I have remaining'
];
const ANSWERPROMPT_MESSAGE = 'What\'s Missing?';

const ITEM_LIST = [
    {"noun" : "apple", "article" : "an"},
    {"noun" : "pear", "article" : "a"},
    {"noun" : "banana", "article" : "a"},
    {"noun" : "cake", "article" : "a"},
    {"noun" : "biscuit", "article" : "a"},
    {"noun" : "car", "article" : "a"},
    {"noun" : "train", "article" : "a"},
    {"noun" : "cat", "article" : "a"},
    {"noun" : "dog", "article" : "a"},
    {"noun" : "sheep", "article" : "a"},
];

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
            request.intent.name === 'AMAZON.YesIntent') &&
            attributes.state !== 'playing';
    },
    handle(handlerInput) {
        const responseMessage = playRound(handlerInput);
        return handlerInput.responseBuilder
            .speak(responseMessage)
            .getResponse();
    }
};

// When a user tries to start a new game and one is in progress
const RestartGameHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'StartGameIntent' ||
            request.intent.name === 'AMAZON.StartOverIntent') &&
            attributes.state === 'playing';
    },
    handle(handlerInput) {

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

    }
};

// When a user says no to a new game or chooses to exit
const QuitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'AMAZON.NoIntent' ||
            request.intent.name === 'AMAZON.StopIntent' ||
            request.intent.name === 'AMAZON.CancelIntent') &&
            attributes.state === 'playing';
    },
    handle(handlerInput) {

    }
};

/* Skills builder */
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder.addRequestHandlers(
        LaunchRequestHandler,
        StartGameHandler,
        RestartGameHandler,
        AnswerHandler,
        QuitHandler
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
    var initialList = list.slice;
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
    var tempItemList = ITEM_LIST.slice;
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
    var tempList = itemList.slice;
    // Randomly sort list
    var subList = randomiseList(tempList);
    // Remove last item in the list and save as a session attribute
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.removed = subList[subList.length - 1]; // Initialise the session state attribute
    handlerInput.attributesManager.setSessionAttributes(attributes);
    subList.splice(subList.size - 1, 1);
    return subList;
}

// Returns a list of items in a string to be read by Alexa
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
            returnString += itemList[i] + ' ' + itemList[i].noun + ', ';
        }
    }
    returnString += '.';
    return returnString;
}

// Put together a new game round, and builds the response
function playRound(handlerInput) {
    var response;
    // Set game state
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.state = 'playing';
    handlerInput.attributesManager.setSessionAttributes(attributes);
    // Add start of response
    response += pickRandomListItem(STARTNEW_MESSAGES);
    // Generate new random list of objects
    const itemListStart = generateItemList(3);
    // Add the list to the response
    response += readList(itemListStart);
    // Add part 2 explaination to the response
    response += '<break time="500ms"/>';
    response += pickRandomListItem(PRESHUFFLE_MESSAGES);
    response += '<audio src=\'https://s3.amazonaws.com/ask-soundlibrary/foley/amzn_sfx_swoosh_cartoon_fast_02.mp3\'/>';
    // Generate sublist containing elements in a random order with one removed.
    const itemListEnd = removeOneAndShuffle(itemListStart);
    // Add the sublist to the response
    response += pickRandomListItem(POSTSHUFFLE_MESSAGES);
    response += readList(itemListEnd);
    // Add the prompt for an answer
    response += ANSWERPROMPT_MESSAGE;
    return response;
}