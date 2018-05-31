var fs = require('fs')
var moment = require('moment');
var csv = require("fast-csv");


function Spacecraft() {
    this.state = {
        
    };

    this.csv_path ="/Users/sevakm/Desktop/MCT/opn-mct/dump.csv";

    this.last_read_time = moment.unix(moment().format('x'));
    this.lines_read =0;
    this.listeners = [];

    this.initialCSVlinenum =0;
    this.history = {};

    this.self = this;

    this.initCSVreading(this.self);
    
    setInterval(function () {
        this.updateState(this.self);
        this.generateTelemetry();
    }.bind(this), 100);

           

};


//get count of intial csv file row 
//&& initialize state with csv headers
Spacecraft.prototype.initCSVreading = function (self){

    var stream = fs.createReadStream(self.csv_path);

 
 var csvStream = csv
    .parse(/*[headers=false]*/)
    .on("data", function(data){
        if(self.initialCSVlinenum ==0){//get headers
            // console.log("headers: " + data);
            headers = data.toString().split(" ");

            var i;

            for (i = 0; i < headers.length; i++) { 
                key = headers[i].toString();
                console.log("putting key: " + key);
                self.state[key]= 0;
                self.history[key] = [];
            }

            console.log("read CSV hearders....");
            
            
        }
        self.initialCSVlinenum+=1;
         // console.log(data);
    })
    .on("end", function(){
         console.log("csv line count init done...");
         console.log("csv initally has " + self.initialCSVlinenum + " rows");
         // console.log(fs.statSync("/Users/sevakm/Desktop/MCT/opn-mct/dump.csv").size);
    }).
    on("error", function(err){
        console.log("ERROR initializing CSV read..." + err);
    });
 
stream.pipe(csvStream);
}



Spacecraft.prototype.updateState = function (self){

    var stream = ""

    //if csv has more than 1000 lines, read only last 5% 
    //to take unnecessary load off cpu and provice cuncurrency reading from csv
    if(self.initialCSVlinenum <=1000){
        stream = fs.createReadStream(self.csv_path);
    }
    else{
        var file_size = fs.statSync(self.csv_path).size;
        stream = fs.createReadStream(self.csv_path, { start: parseInt(file_size * 0.99)});
    }



    var csvStream = csv
        .parse()
        .on("data", function(line){
 
            // console.log("check: " + line_num);
            values = line.toString().split(" ");
            current_time = moment.unix(values[0] *1000);

            if(moment(current_time).isAfter(self.last_read_time)){  
                self.last_read_time =current_time;
        
                // key = line_arr[3];
                // value = line_arr[2].toString();

                Object.keys(self.state).forEach(function (id, index) {
                    // if(key in self.state){
                        // console.log("index: " + index);
                        //console.log("old val: " + self.state[id]);
                       self.state[id] = values[index]; 
                      // console.log("new val: " + self.state[id]);
                    // } 
             
        });
            }
        })
        .on("end", function(){
             //console.log("waiting for new data...");    
        })
        .on("error", function(){
            console.log("Error reading CSV...");
        });
    stream.pipe(csvStream);
  }


Spacecraft.prototype.generateTelemetry = function () {
    var timestamp = Date.now(), sent = 0;
    Object.keys(this.state).forEach(function (id) {
        var state = { timestamp: timestamp, value: this.state[id], id: id};
        this.notify(state);
        this.history[id].push(state);
    }, this);
};

Spacecraft.prototype.notify = function (point) {
    this.listeners.forEach(function (l) {
        l(point);
    });
};

Spacecraft.prototype.listen = function (listener) {
    this.listeners.push(listener);
    return function () {
        this.listeners = this.listeners.filter(function (l) {
            return l !== listener;
        });
    }.bind(this);
};

module.exports = function () {
    return new Spacecraft()
};