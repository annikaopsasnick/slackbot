const SlackBot = require('slackbots'); //interacts with slack
const axios = require('axios'); //receive and send requests to external APIs 

// Import express, request, body parser modules
var express = require('express');
var request = require('request');

// information given by the slack app api
var clientId = '667324587991.665168338788';
var clientSecret = '2131d15a439b002f424b78f9dc75be3e';

// Instantiates Express and assigns our app variable to it
var app = express();

//instantiating the bot 
const bot = new SlackBot({
  token: 'xoxb-667324587991-654228133330-ClmGZL7reAk4jH3CPoGwvnud',
  name: 'jokebot'
});

// stuff for the button, necessary to view the payload sent by slack
const bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.json());

// We define the port we want to listen to. Logically this has to be the same port than we specified on ngrok.
const PORT = 4390 || process.env.PORT;

// Lets start our server
app.listen(PORT, function () {
  //Callback triggered when server is successfully listening. Hurray!
  console.log("Example app listening on port " + PORT);
});

// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function (req, res) {
  res.status(200).send('Ngrok is working! Path Hit: ' + req.url);
});

//This route handles POST requests to our root ngrok address when a slack event occurs and responds with a button and text
app.post('/slack/event', function (req, res) {
  const reaction = req.body.event.reaction;
  if (req.body.event.type === 'reaction_added') {
    const params = { 
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `I see you have responded with the ${reaction} reaction`
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Click Me"
            },
            "value": "click_me_123",
            "action_id": "button"
          }
        },
        {
          "type": "actions",
          "block_id": "actionblock789",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Link Button"
              },
              "url": "https://api.slack.com/block-kit"
            }
          ]
        }
      ],
      icon_emoji: ':cat:'
     };
    bot.postMessageToChannel("general", "this should be the message",params);
    res.end();
  }

  //verify event url 
  if (req.body.type === 'url_verification') {
    console.log('connection to events');
    console.log(res.json({
      foo: req.body,
    }));
  }
});

//This route handles POST requests to our root ngrok address when a slack action occurs and responds with a joke
app.post('/actions', function (req, res) {
  const payload = JSON.parse(req.body.payload); //payload comes in as a string, parse to turn it into a javascript object
  if (payload.type === 'interactive_message') { //respond to button action 
    const value = payload.actions[0].value;
    switch (value) {
      case 'yomamma':
        yoMammaJoke();
        break;
      case 'chucknorris':
        chuckJoke();
        break;
      case 'dad':
        dadJoke();
        break;
      default:
        randomJoke();
    }
    res.end();
  }
});
 
// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get('/oauth', function (req, res) {
  // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
  if (!req.query.code) {
    res.status(500);
    res.send({ "Error": "Looks like we're not getting code." });
    console.log("Looks like we're not getting code.");
  } else {
    // If it's there...
    // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
    request({
      url: 'https://slack.com/api/oauth.access', //URL to hit
      qs: { code: req.query.code, client_id: clientId, client_secret: clientSecret }, //Query string data
      method: 'GET', //Specify the method

    }, function (error, res, body) {
      if (error) {
        console.log(error);
      } else {
        res.json(body);

      }
    })
  }
});

// Route the endpoint that our slash command will point to and send back a simple response to indicate that ngrok is working
app.post('/command', function (req, res) {
  res.send('Your ngrok tunnel is up and running!');
});

//json data for a button
let jsonData = require('./test_data.json');

//punchine of the dad joke 
let punchline = '';
let currDadJoke = '';

//start handler when the robot is turned on
bot.on('start', () => {
  const params = {
    icon_emoji: ':smiley:'
  }
  bot.postMessageToChannel('general', 'Get Ready to Laugh at JokeBot', params);
});

//error Handler
bot.on('error', (err) => console.log(err));

//message handler (user types @jokebot in slack)
bot.on('message', (data) => {
  if (data.type !== 'message') {
    // console.log(data.type);
    return;
  } else {
    handleMessage(data.text);
  }
});

//respond to text
function handleMessage(message) {
  if (punchline && !message.includes(currDadJoke)) { //dad hasn't said the punchline yet and user makes a guess
    dadPunchline();
    punchline = ''; //reset punchline to null
  } else if (message.includes(' chucknorris')) {
    chuckJoke();
  } else if (message.includes(' yomamma')) {
    yoMammaJoke();
  } else if (message.includes(' random')) {
    randomJoke();
  } else if (message.includes(' help')) {
    runHelp();
  } else if (message.includes(' dad')) {
    dadJoke();
  } else if (message.includes(' button')) {
    showButton();
  }
}

//tell a chuck joke
function chuckJoke() {
  axios.get('http://api.icndb.com/jokes/random/')
    .then(response => {
      const joke = response.data.value.joke;
      const params = {
        icon_emoji: ':laughing:'
      };
      bot.postMessageToChannel(
        'general',
        `Chuck Norris: ${joke}`,
        params);

    });
}

//tell a yo mamma joke
function yoMammaJoke() {
  axios.get('https://api.yomomma.info/')
    .then(response => {
      const joke = response.data.joke;
      const params = {
        icon_emoji: ':laughing:'
      };
      bot.postMessageToChannel(
        'general',
        `Yo Mamma: ${joke}`,
        params);

    });
}

//tell a dad joke
function dadJoke() {
  axios.get('https://official-joke-api.appspot.com/random_joke/')
    .then(response => {
      const joke = response.data.setup;
      currDadJoke = joke;
      punchline = response.data.punchline;
      const params = {
        icon_emoji: ':man:'
      };
      bot.postMessageToChannel(
        'general',
        `Dad Joke: ${joke}`,
        params);

    });
}

function dadPunchline() {
  const params = {
    icon_emoji: ':man:'
  };
  bot.postMessageToChannel('general', `Dad joke: ${punchline}`, params);
}

//tell a random joke
function randomJoke() {
  const rand = Math.floor(Math.random() * 3) + 1;
  if (rand === 1) {
    chuckJoke();
  } else if (rand === 2) {
    yoMammaJoke();
  } else if (rand === 3) {
    dadJoke();
  }
}

// Show Help Text
function runHelp() {
  const params = {
    icon_emoji: ':question:'
  };
  bot.postMessageToChannel(
    'general',
    `Type @jokebot with either 'chucknorris', 'yomamma', 'dad', or 'random' to get a joke`,
    params
  );
}

//Show button
function showButton() {
  /*
    using a different file to store the json 
    const params = jsonData;
    bot.postMessageToChannel('general', 'some text', {blocks: [params]});
  */

  bot.postMessageToChannel('general',
    `Lets see what happens`,
    {
        text: "Would you like to hear a joke?",
        attachments: [
            {
                "text": "Choose a type of joke",
                "fallback": "You are unable to choose a joke",
                "callback_id": "wopr_game",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "joke",
                        "text": "YoMamma",
                        "type": "button",
                        "value": "yomamma"
                    },
                    {
                        "name": "joke",
                        "text": "Chuck Norris",
                        "type": "button",
                        "value": "chucknorris"
                    },
                    {
                        "name": "game",
                        "text": "Dad Joke",
                        "style": "danger",
                        "type": "button",
                        "value": "dad",
                        "confirm": {
                            "title": "Are you sure?",
                            "text": "Wouldn't you prefer a good game of chess?",
                            "ok_text": "Yes",
                            "dismiss_text": "No"
                        }
                    }
                ]
            }
        ]
    }
    )
}

/*
const StartText = require(' ./hello');

//verify the request url
module.exports = function(req, res, next) {
    if (req.body.type === 'url_verification') {
        return res.status.json(req.body.challenge);
    }
    console.log(JSON.stringify(req.body));
    return res.status(200).end();
}
*/


// const { WebClient } = require('@slack/web-api');
// const web = new WebClient(token);

// var signingSecret = '378ba7f8c6e26395e7c9b47e3be10791';
// const token = 'xoxb-667324587991-654228133330-ClmGZL7reAk4jH3CPoGwvnud';
// const channelId = 'CKMJ3BDK8';

// const urlencodedParser = bodyParser.urlencoded({ extended: false });

/*
//handle event- delete
function process(request, response) {
  if (request.body.data.challenge) {
    response.setStatus(200);
    response.setContentType('text/plain');
    response.getStreamWriter().writeString(request.body.data.challenge);
  } else {
    getSelection.info()
  }
}
*/

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(400).send(err.message);
// });


/*
// First we need to import the HTTP module. This module contains all the logic for dealing with HTTP requests.
var http = require('http');

// We create a function which handles any requests and sends a simple response
function handleRequest(request, response){
  response.end('Ngrok is working! -  Path Hit: ' + request.url);
}

// We create the web server object calling the createServer function. Passing our request function onto createServer guarantees the function is called once for every HTTP request that's made against the server
var server = http.createServer(handleRequest);

// Finally we start the server
server.listen(PORT, function(){
  // Callback triggered when server is successfully listening. Hurray!
  console.log("Server listening on: http://localhost:%s", PORT);
});
*/