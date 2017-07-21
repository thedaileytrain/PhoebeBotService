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
        session.send("Nationwide offers pet insurance. Answering a few simple questions can help give you peace of mind when it comes to your pet’s care.");
        session.beginDialog('askPetQuestions');
    }
]);

bot.dialog('askPetQuestions', [
    function (session) {
        session.send("We are going to ask a few questions to gather information for your quote.");
        builder.Prompts.text(session, "What is your pets name?");
    },
    function (session, result) {
        session.userData.petName = result.response;
        builder.Prompts.choice(session, "Is " + session.userData.petName + " a dog or cat?", ["Dog", "Cat"], 'button');
    },
    function (session, result) {
        session.userData.petType = result.response.entity;
        builder.Prompts.text(session, "Is " + session.userData.petName + " a male or female?");
    },
    function (session, result) {
        session.userData.petGender = result.response;
        builder.Prompts.text(session, "When was " + session.userData.petName + " born? (YYYY/MM/DD)");
    },
    function (session, result) {
        session.userData.petBirthDate = result.response;
        builder.Prompts.text(session, "What breed is " + session.userData.petName + "?");
    },
    function (session, result) {
        session.userData.petBreed = result.response;
        builder.Prompts.text(session, "What color is " + session.userData.petName + "?");
    },
    function (session, result) {
        session.userData.petColor = result.response;
        builder.Prompts.text(session, "What is your first name?");
    },
    function (session, result) {
        session.userData.firstName = result.response;
        builder.Prompts.text(session, "What is your last name?");
    },
    function (session, result) {
        session.userData.lastName = result.response;
        builder.Prompts.text(session, "What is your zip code?");
    },
    function (session, result) {
        session.userData.zipCode = result.response;
        builder.Prompts.text(session, "What is your email address?");
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
        session.send("Thanks for the information...  we calculating your quote. This may take up to a minute.");
        var requestBody = {
            "leadFirstName": session.userData.firstName,
            "leadLastName": session.userData.lastName,
            "leadEmail": session.userData.emailAddress,
            "leadZipCode": session.userData.zipCode,
            "originCode": "122355",
            "leadPhone": session.userData.phoneNumber,
            "apiKey": "29900",
            "quotes": [{
                "petQuoteRequest": {
                    "petName": session.userData.petName,
                    "PetSpecies": session.userData.petType,
                    "petBreedId": session.userData.petBreed,
                    "petDateOfBirth": session.userData.petBirthDate,
                    "ProductCode": "POIA25090",
                    "gender": session.userData.petGender,
                    "petColorId": session.userData.petColor
                }
            }]
        };

        try {
        request.post('http://phoebeweb.azurewebsites.net/petQuoteController/quotecarts', requestBody).on('data', function (data) {
            session.send(data);
            session.send("To insure " + session.userData.petName + " it will cost " + data + ".");
            builder.Prompts.confirm(session, "Would you like to continue on to see your coverage and finalize your quote?");
        });
    } catch {e}
        session.send(e);
        console.log(e);
    }
    }, function (session, result) {
        if(result.response){
            session.beginDialog('confirmInsurance');
        }else{
            session.endDialog('Please contact us at Nationwide.com for any further questions, Thank you.');
        }
    }
]);

bot.dialog('confirmInsurance', [
    function (session) {
        session.endDialog('follow the stuff.');
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
