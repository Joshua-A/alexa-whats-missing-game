/*
 * "What's Missing?" - An Alexa Skill Memory Game
 * Author: Josh Adams
 * Created: 30/07/18
 */
 
const Alexa = require('ask-sdk-core');

/* LABELS */

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



/* HANDLERS */

// Launch Request
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.stage = 'start'; // Initialise the session stage var
        handlerInput.attributesManager.setSessionAttributes(attributes);
        return handlerInput.responseBuilder
            .speak(WELCOME_MESSAGE)
            .reprompt(READY_MESSAGE)
            .getResponse();
    }
}

// When a user tries to start a new game at the start or end
const StartGameHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' &&
            (request.intent.name === "StartGameIntent" ||
            request.intent.name === "AMAZON.StartOverIntent" ||
            request.intent.name === "AMAZON.YesIntent") &&
            attributes.stage !== 'playing';
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.stage = 'playing';
        handlerInput.attributesManager.setSessionAttributes(attributes);
        return handlerInput.responseBuilder
            .speak(pickRandomLabel(STARTNEW_MESSAGES))
            .getResponse();
    }
}

// When a user tries to start a new game and one is in progress
const RestartGameHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'StartGameIntent' ||
            request.intent.name === 'AMAZON.StartOverIntent') &&
            attributes.stage === 'playing';
    },
    handle(handlerInput) {

    }
}

// When a user provides an answer
const AnswerHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' &&
            request.intent.name === 'AnswerIntent' &&
            attributes.stage === 'playing';
    },
    handle(handlerInput) {

    }
}

// When a user says no to a new game or chooses to exit
const QuitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'AMAZON.NoIntent' ||
            request.intent.name === 'AMAZON.StopIntent' ||
            request.intent.name === 'AMAZON.CancelIntent') &&
            attributes.stage === 'playing';
    },
    handle(handlerInput) {

    }
}

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

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function pickRandomLabel(labelList) {
    var max = labelList.length;
    var randPos = getRandomInt(0, max);
    return labelList[randPos];
}