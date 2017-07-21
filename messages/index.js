/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');
var request = require('request');

var useEmulator = (process.env.NODE_ENV == 'development');
// useEmulator = true;
if (useEmulator) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

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
        session.send("Nationwide offers pet insurance. Answering a few simple questions can help give you peace of mind when it comes to your pet’s care.");
        session.beginDialog('askPetQuestions');
    }
]);

bot.dialog('askPetQuestions', [
    function (session) {
        session.send("We are going to ask a few questions to gather information for your quote.");
        session.send("Let's start with your pet.");
        builder.Prompts.text(session, "What is your pets name?");
    },
    function (session, result) {
        session.userData.petName = result.response;
        builder.Prompts.choice(session, "Is " + session.userData.petName + " a dog or cat?", ["Dog", "Cat"]);
    },
    function (session, result) {
        session.userData.petType = result.response.entity;
        builder.Prompts.text(session, "When was " + session.userData.petName + " born? (YYYY-MM-DD)");
    },
    function (session, result) {
        session.userData.petBirthDate = result.response;
        builder.Prompts.text(session, "What breed is " + session.userData.petName + "?");
    },
    function (session, result) {
        session.userData.petBreed = result.response;
        session.send("Thanks for the information on " + session.userData.petName + ". Now we have a couple questions about you.");
        builder.Prompts.text(session, "What is your first name?");
    },
    function (session, result) {
        session.userData.firstName = result.response;
        builder.Prompts.text(session, "Thanks, " + session.userData.firstName + ", what is your last name?");
    },
    function (session, result) {
        session.userData.lastName = result.response;
        builder.Prompts.text(session, "What is your zip code?");
    },
    function (session, result) {
        session.userData.zipCode = result.response;
        builder.Prompts.text(session, "Please provide your email address?");
    },
    function (session, result) {
        session.userData.emailAddress = result.response;
        builder.Prompts.text(session, "What is your phone number?");
    },
    function (session, result) {
        session.userData.phoneNumber = result.response;
        session.beginDialog('discussQuote');
    }
]);

bot.dialog('discussQuote', [
    function (session) {
        session.send("Thanks for the information...  we're calculating your quote. This may take up to a minute.");
        var requestBody = {
            "leadFirstName": session.userData.firstName,
            "leadLastName": session.userData.lastName,
            "leadEmail": session.userData.emailAddress,
            "leadZipcode": session.userData.zipCode,
            "originCode": "122355",
            "leadPhone": session.userData.phoneNumber,
            "apiKey": "29900",
            "quotes": [{
                "petQuoteRequest": {
                    "petName": session.userData.petName,
                    "petSpecies": session.userData.petType,
                    "petBreedId": session.userData.petBreed,
                    "petDateOfBirth": session.userData.petBirthDate,
                    "productCode": "POIA25090",
                    "gender": "Male",
                    "petColorId": "tan"
                }
            }]
        };

        var requestOptions = {
            url: useEmulator ? 'https://localhost:8443/petQuote/quotecarts' : 'http://phoebeweb.azurewebsites.net/petQuote/quotecarts',
            method: 'POST',
            json: requestBody,
            headers: {
                'Accept': 'application/json'
              }
        };
        request.post(requestOptions, function (err, response, body) {
            console.log(body.data);
            console.log(body.data.quotes);
            session.send("To insure " + session.userData.petName + " it would cost " + body.data.quotes[0].monthlyAmount + " a month.");
            session.userData.bindURL = body.data.bindURL;
            builder.Prompts.confirm(session, "Would you like to continue on to see your coverage and finalize your quote?");
        });
    }, function (session, result) {
        if(result.response){
            session.beginDialog('confirmInsurance');
        }else{
            session.endDialog('Please contact us at Nationwide.com for any further questions, thank you.');
        }
    }
]);

bot.dialog('confirmInsurance', [
    function (session) {
        session.endDialog('Continue to http://google.com to bind coverage.');
    }
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
