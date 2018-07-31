/*
 * "What's Missing?" - An Alexa Skill Memory Game
 * Author: Josh Adams
 * Created: 30/07/18
 */
 
const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechOutput = 
            "Welcome to What's Missing!\
            I'm going to list the items I have here with me,\
            then shuffle them up and remove one item. It will be your job to tell me\
            which item I have removed. Are you ready?";
        return handlerInput.responseBuilder.speak(speechOutput).getResponse();
    }
}

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder.addRequestHandlers(
        LaunchRequestHandler
    ).lambda();