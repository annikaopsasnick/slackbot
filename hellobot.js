
module.exports = function(req, res, next) {
    console.log(req.body.type);
    if (req.body.type === 'url_verification') {
        return res.status.json(req.body.challenge);
    }
    if (req.body.type === 'event_callback') {
        var postReq = https.request({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            host: 'hooks.slack.com',
            path: '/services/TKM9JH9V5/BK9V3JT6X/L33qgZyNxtOKLSlCQXbaWG2G'
        });
        if (req.body.event.type === '') {
            postReq.write(JSON.stringify({'test':'My message goes here'}));
            postReq.end();
        }
    }
    console.log(JSON.stringify(req.body));
    return res.status(200).end();
}

/*

const rp = require('request-promise-native');

class Hello {
    static message() {
        return {
            text: "Hello the webhook worked!"
        };
    }

    static options() {
        return {
            method: 'POST',
            uri: 'https://hooks.slack.com/services/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',
            body: this.message(),
            json: true,
            headers: {
                'content-type': 'application/json'
            }
        };
    }

    static postMessage() {
        const options = this.options();
        const onSuccess = (res) => {
            console.log('You posted a message to the channel');
        };
        const onError = (err) => {
            console.error('Uh oh, somethings is wrong...', err);
        }
        rp(options).then(onSuccess).catch(onError);
    }
}

module.exports = Hello;
*/