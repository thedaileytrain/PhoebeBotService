/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

bot.dialog('/', [
    function (session) {
        builder.Prompts.text(session, "Do you love your pets?");
    },
    function (session, result) {
        console.log(result);
        if(result.response == 'yes'){
            builder.Prompts.text(session, "would you like to see how much it would cost to have piece of mind with your loved one?");
        }else{
            session.endDialog('Appreciate your responses. Thank you for your time');
        }
    },
    function (session, result) {
        if(result.response == 'yes'){
            session.send("We are going to ask a few questions to gather information for your quote.");
            builder.Prompts.text(session, "What is your zip code?");
        }else{
            session.endDialog('If you ever consider changing your mind. Please contact us at Nationwide.com');
        }
    },
    function (session, result) {
        session.userData.zipCode = result.response;
        builder.Prompts.choice(session, "What type of Pet do you have?", ["Dog", "Cat", "Bird or exotic pet"]);
    },
    function (session, result) {
        session.userData.petType = result.response.entity;
        builder.Prompts.text(session, "What is the breed of your pet?");
    },
    function (session, result) {
        session.userData.petBreed = result.response;
        builder.Prompts.text(session, "How old is your pet? (in years)");
    },
    function (session, result) {
        session.userData.petAge = result.response;
        builder.Prompts.text(session, "What is your email address?");
    },
    function (session, result) {
        session.userData.emailAddress = result.response;
        builder.Prompts.text(session, "What is your phone number?");
    },
    function (session, result) {
        session.userData.phoneNumber = result.response;
        session.send("Got it... For your " + session.userData.petType + 
                    " it will cost you $40 a month.");
        builder.Prompts.text(session, "Would you like us to contact you at " +  session.userData.emailAddress + " about this quote?");
    },
    function (session, result) {
        if(result.response){
          session.endDialog('You should be contacted about your quote soon. Thank you for your time');
        }else{
          session.endDialog('If you ever consider changing your mind or would like to revist your quote. Please contact us at Nationwide.com');  
        }
    }
    // ,
    // function (session, results) {
    //     session.userData.coding = results.response;
    //     builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);
    // },
    // function (session, results) {
    //     session.userData.language = results.response.entity;
    //     session.send("Got it... " + session.userData.name + 
    //                 " you've been programming for " + session.userData.coding + 
    //                 " years and use " + session.userData.language + ".");
    // }
]);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
