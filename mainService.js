var SerialPort = require("serialport");
var LabelFormat = require("./labelFormat");

var MainService = function(logger){

    var AVAILABLE_PORTS;
    SerialPort.list(function (err, ports){}).then(function(result){
        //console.log(result);
        AVAILABLE_PORTS = result;
    });

    this.startPrinting = function(pdpBuilderLabel){
        var label = generateLabel(pdpBuilderLabel);
        var portInfo = generatePortInfo(label);
        return serialPrint(portInfo);
    }

    function serialPrint(portInfo){

        var serialPort = new SerialPort(portInfo.port,
            function(err){
                if(err) logger.error(err);
            }
        );

        serialPort.write(portInfo.cmdData,function(err){
            if(err) logger.error(err);
            logger.info("print success");

            serialPort.close(function(reason){
                logger.info("closing port");
            })

        });
        return "Label sent to printing machine"

    }
    function generateLabel(pdpBuilderLabel){
        var label = new LabelFormat;
        label.printCondition = pdpBuilderLabel.printCondition;
        label.conditionLabel = pdpBuilderLabel.conditionLabel;
        label.printPrice = pdpBuilderLabel.printPrice;
        label.scanCode = pdpBuilderLabel.scanCode;
        label.description.main = pdpBuilderLabel.description.main;
        label.condition = pdpBuilderLabel.condition;
        label.setPrice(pdpBuilderLabel.price);
        label.setItemData();
        return label;
    }

    function generatePortInfo(label){
        var comPort = AVAILABLE_PORTS[0].comName;
        return portInfo = {
            port: comPort,
            portType: "Serial",
            cmdData: label.cmdData
        }
    }

}
module.exports = MainService;