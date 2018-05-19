const express = require('express')
const bodyParser = require('body-parser');
const app = express()

//create the logger
const winston = require('winston');
const fs = require('fs');
const env = process.env.NODE_ENV || 'development';
const logDir = 'log';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
const tsFormat = () => (new Date()).toLocaleTimeString();
const logger = new (winston.Logger)({
    transports: [
        // colorize the output to the console
        new (winston.transports.Console)({
            timestamp: tsFormat,
            colorize: true,
            level: 'info'
        }),
        new (require('winston-daily-rotate-file'))({
            filename: `${logDir}/results.log`,
            timestamp: tsFormat,
            level: env === 'development' ? 'debug' : 'info'
        })
    ]
});
//create the logger

var MainService = require("./mainService");
var mainService = new MainService(logger);


app.use(bodyParser.urlencoded( {extend: true}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.get('/', (req, res) => res.send('Zebra Printing'))

app.post('/print', function (req, res) {
    logger.debug(req.body);
    res.send(mainService.startPrinting(req.body));
})

app.listen(3000, () => console.log('Zebra Printing App listening on port 3000!'))