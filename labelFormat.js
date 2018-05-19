//NPM Dependencies
var moment = require("moment");

var LabelFormat = function () {
  this.cmdData = ''; // Data that will be sent to the printer
  var price = '';
  this.setPrice = function (price) {
    price = parseFloat(price);
    this.price = parseFloat(Math.round(price * 100) / 100).toFixed(2);
  }
  this.printPrice = true;
  this.labelSize = {
    width: 1.5,
    height: 1
  };
  this.charWidth = {
    Item: 21
  }
  this.dpi = '';
  this.company = 'salvage';
  this.footer = 'barcode';
  this.scanCode = '';
  this.scanType = '';
  this.description = {
    main: '',
    parts: []
  };
  this.size = '';
  this.conditionLabel = '';
  this.printCondition = false;
  this.msrp = '';
  this.date = '';
  this.setDate = function(){
    if(!this.date || this.date === ''){
      this.date = moment().format('l');
    }
  }
  this.getLabel = function () {
    switch (this.scanType) {
      case 'item':
        this.setItem();
        break;
      default:
        console.log("Invalid Selection");
    }
  }

  this.setItemData = function () {
    //TODO error checking must have a description and a scanCode
   
    var paramCompany = "^FS^FO16,190^AB,10,2^FD";
    var paramPrice = "^FS^FO5,30^AD,30,10^FD";
    //get the length of the price to determine length of first description 21 (max chars) - length + 2 for space and $ sign
    var firstDescLength = 21 - (this.price.toString().length + 2);
    var paramDesc = "^FS^FO" + (110 - (this.price.toString().length - 3) * 10).toString() + ",40^AA,14,10^FD"; //Print after the price
    var paramDescFull = "^FS^FO5,64^AA,14,10^FD"; //Fill the entire line with text
    var paramFooter = "^FS^FO155,195,^AA,10,10^FD";
    var paramSize = "^FS^FO10,78^AA,14,10^FD";
    //Format ^B3o,e,h,f,g  o=oriantation, e=Mod-43 check digit, h=bar code height, f=print interpretation, g=print interpretation line above code
    var paramBarcode = "^FS^FO15,85^BY2,2,1^B3N,N,80,N,N^FD";
    //This is a shorter barcode that does not include the interpretation line
    var paramShortBarcode = "^FS^FO15,85^BY2,2,1^B3N,N,80,N,N^FD";
    var paramBarcodeSubText = "^FS^FO" + ((244 - (this.scanCode.toString().length) * 18)/2).toString() + ",170^AB,32,18^FD";

    // var descLength = this.description.main.length;
    var numChar = 0;

    //Make description all caps
    var mainDesc = this.description.main.toUpperCase();
    //break up the description to fit on lable
    for (let i = 0; i < mainDesc.length; i += numChar) {
      // descLength -= this.charWidth.Item;
      //if we are printing a price and we are on the first line and it is not a clearance tag then make the first description line 13 characters long
      if (this.printPrice && i === 0 && !this.printCondition) {
        this.description.parts.push(mainDesc.substring(i, firstDescLength));
        numChar = firstDescLength;
      } else {
        this.description.parts.push(mainDesc.substring(i, i + this.charWidth.Item));
        numChar = this.charWidth.Item;
      }
    }
    //if the scanCode is longer then 8 digits then we will not have room for the company initials
    if(this.scanCode.toString().length > 8){this.company = '';}

    //Start Zebra Label Format     //Set Print Speed
    this.cmdData = "^XA^PR5";
    if (this.printPrice) {
      this.cmdData += paramPrice + "$" + this.price;
    } else {
      //If we are not printing the price then we want the first description to fill the row
      paramDesc = "^FS^FO10,35^AA,14,10^FD";
    }
    if (this.printCondition) {
      //If a condition isn't set then use default
      if(this.conditionLabel === '' || !this.conditionLabel){this.conditionLabel = "AS-IS";}
      this.cmdData +=  "^FS^FO120,35^AD,20,11^FD" + "*" + this.conditionLabel.toUpperCase() + "*";
      this.cmdData += paramDescFull + this.description.parts[0];
    } else {
      this.cmdData += paramDesc + this.description.parts[0];
      //check if string was long enough for a second line
      if (this.description.parts[1]) { this.cmdData += paramDescFull + this.description.parts[1]; }
    }
    this.cmdData += paramBarcode + this.scanCode;
    this.cmdData += paramBarcodeSubText + this.scanCode;
    this.cmdData += paramCompany + this.company;
    this.cmdData += "^XZ";
    //Finished Zebra Format
  }

  this.setLoadData = function (manifest) {
    var loadAlign = 210 - (this.description.main.length * 18);
    if(loadAlign < 1 ){loadAlign = 5}
    var barcodeAlign = 210 - (this.scanCode * 30);
    if(barcodeAlign < 1){barcodeAlign = 5}

    this.cmdData = "^XA^PR5";
    this.cmdData += "^FS^FO" + loadAlign + ",30^AA,36,16^FD" + this.description.main;
    this.cmdData += "^FS^FO" + barcodeAlign + ",70^BY2,2,1^B3N,N,70,N,N^FD" + this.scanCode;
    this.setDate();
    this.cmdData += "^FS^FO85,150^AA,24,10^FD" + this.date;
    if (manifest) {
      var manifestAlign = 210 - (manifest.length * 14);
      console.log(manifestAlign);
      this.cmdData += "^FS^FO" + manifestAlign + ",175^AA,32,10^FD" + manifest;
    }
    this.cmdData += "^XZ";
  }

  this.setUnitData = function (department) {
    var unitNumAlign = 210 - (this.scanCode.toString().length * 16);
    this.cmdData = "^XA^PR5";
    this.cmdData += "^FS^FO5,30^AA,14,10^FD" + this.description.main.toUpperCase();
    this.cmdData += "^FS^FO10,70^BY2,2,1^B3N,N,70,N,N^FD" + this.scanCode;
    this.cmdData += "^FS^FO" + unitNumAlign + ",145^AA,28,16^FD" + this.scanCode;
    if(department){this.cmdData += "^FS^FO10,175^AA,24,10^FD DEPT: " + department}
    this.setDate();
    this.cmdData += "^FS^FO180,175^AA,24,10^FD" + this.date;

    this.cmdData += "^XZ";
  }

  this.resetSettings = function () {

    this.cmdData = '';
    this.printCondition = false;
    this.price = '';
    this.printPrice = true;
    this.labelSize = {
      width: 1.5,
      height: 1
    };
    this.charWidth = {
      Item: 21
    }
    this.dpi = '';
    this.company = '';
    this.footer = '';
    this.scanCode = '';
    this.scanType = '';
    this.description = {
      main: '',
      parts: []
    };
    this.size = '';
    this.conditionLabel = '';
    this.msrp = '';
    this.size = '';
  }
}

module.exports = LabelFormat;
