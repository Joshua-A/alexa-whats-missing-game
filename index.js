/*
 * "What's Missing?" - An Alexa Skill Memory Game
 * Author: Josh Adams
 * Created: 30/07/18
 */
 
const Alexa = require('ask-sdk-core');

/* LABELS */

const msgWelcome = "Welcome to What's Missing!\
                    I'm going to list the items I have here with me,\
                    then shuffle them up and remove one item. It will be your job to tell me\
                    which item I have removed. Are you ready?";


/* HANDLERS */

// Launch Request
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder.speak(msgWelcome).getResponse();
    }
}

// When a user tries to start a new game at the start or end
const StartGameHandler = {
    canHandle(handlerInput) {

    },
    handle(handlerInput) {

    }
}

// When a user tries to start a new game and one is in progress
const RestartGameHandler = {
    canHandle(handlerInput) {

    },
    handle(handlerInput) {

    }
}

// When a userprovides an answer
const AnswerHandler = {
    canHandle(handlerInput) {

    },
    handle(handlerInput) {

    }
}

/* Skills builder */
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder.addRequestHandlers(
        LaunchRequestHandler
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