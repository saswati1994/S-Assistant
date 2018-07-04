var express = require('express')
const sgMail = require('@sendgrid/mail');
var bodyParser = require('body-parser');
var datapoints = require('./config')
var request = require("request");
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(bodyParser.json());

app.get('/', function(request, response) {
  response.send('Hello World!')
})

app.post('/webhook',function(request,response){
  
  
  console.log("printing message",request.body);
   
  if(request.body.queryResult.intent.displayName=="Cab Request"){
      
    cabrequesthandler(request,response);
      
   }  
  if(request.body.queryResult.intent.displayName=="Capture Location"){
    locationhandler(request,response);
  }
  //var jsondata=JSON.parse(request.body.contexts.parameters.Pizza-types);
  //console.log(request.body); 
  //console.log(JSON.stringify(request.body));
  console.log("WEBHOOK TRIGRED")

})

app.listen(app.get('port'), function() {
console.log("Node app is running at localhost:" + app.get('port'))
})



function cabrequesthandler(request,response){

  //printing accumulated data
  console.log("Accumulated data: ", request.body.queryResult.parameters);
  
  //storing formated facebook response to send to the user
  var formatedResponse = responseFormator(`i have droped a mail to ${request.body.queryResult.parameters.managername} and a cab request is raised for ${request.body.queryResult.parameters.time}`);
  
  //sending the response to user
  response.send(formatedResponse);

  //storing manger name
  var mangerName= request.body.queryResult.parameters.managername
  var managerMail;
  
  //itterating the config.js file datapoints to get manager's mail id
  datapoints.mailids.forEach(element => {
    if(element.name === mangerName){

      managerMail=element.mail

    }
  });
  var s= request.body.queryResult.parameters.mailid;
  var sp= s.split("@")[0];
  var output = sp.substring(0,sp.length-1);
  
  //sending mail
  sgMail.setApiKey(process.env.key);
  const msg = {
    to: managerMail,
    from: request.body.queryResult.parameters.mailid,
    subject: 'Cab request',
    text: `Request details: \n Time: ${request.body.queryResult.parameters.time} \n Place: ${request.body.queryResult.parameters.place} \n\n Regards`
  }
  
  sgMail.send(msg);
  
}

function locationhandler(request,response){

  console.log(JSON.stringify(request.body));
  console.log(request.body.originalDetectIntentRequest.payload.data);
  var lat = request.body.originalDetectIntentRequest.payload.data.postback.data.lat;
  var long = request.body.originalDetectIntentRequest.payload.data.postback.data.long;
  
  console.log(lat);
  console.log(long);
  var targets=[];
   NearbyPalceSearch(lat,long,(err,data)=>{

     if(err){
      console.log("Error in Google maps API call",err)
     }else{
  console.log("Success Google API call",data);
  }

    var parsedData= JSON.parse(data);

     parsedData.results.forEach(element => {
      
      var place={
         "lat": element.geometry.location.lat,
       "long": element.geometry.location.lng,
        "targetname": element.name,
        "opennow" : element.opening_hours.open_now
       }
        console.log(place);
      targets.push(place);
    });

    console.log(targets);
     var textresponse;
     for(i=0;i<=4:i++){
       textresponse = targets[0].targetname +"-" + targets[0]
     }
     //var MapUrl = "https://www.google.com/maps/search/?api=1&query="+targets[0].lat+","+targets[0].long;
     //console.log(MapUrl);
     //var formatedResponse = responseFormator(MapUrl);
     //response.send(formatedResponse);
Reversegeocode(lat,long,(err,data)=>{
        console.log(data.results[4].address_components[0].long_name+"+"+data.results[4].address_components[1].long_name);
        console.log(request.body.queryResult.outputContexts[1]);
        var MapUrl = "https://www.google.com/maps/search/?api=1&query="+request.body.queryResult.outputContexts[1].parameters.poi+"+"+data.results[1].address_components[1].long_name+"+"+data.results[2].address_components[1].long_name;
        console.log(MapUrl);
        var formatedResponse = responseFormator(MapUrl);
        response.send(formatedResponse);
      })
   })
  
    
}


  //function to generate facebook response format 
function responseFormator(ResponseText){
  return {

    "fulfillmentText": ResponseText,  
    "source": "myserver"
  }
}


function NearbyPalceSearch(lat,long,callback){

   var options = { 
     method: 'GET',
     url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
     qs: 
     { location: lat+","+long,
       radius: '1000',
      type: 'atm',
       key: 'AIzaSyAvsCXxI6RRtBWzQB9nmdnNbxsksAwLjEA' },
     headers: 
     { 'Cache-Control': 'no-cache' } 
   };

   request(options, function (error, response, body) {
     if (error){
       // console.log(error);
       callback(error,null);
    }else{
      // console.log(body);
       callback(null,body);
     }

    
 });

 }

function Reversegeocode(lat,long,callback){

  var options = { 
        method: 'GET',
        url: "https://maps.googleapis.com/maps/api/geocode/json?" ,
        qs: 
        { latlng: lat+","+long,
          key: 'AIzaSyAPEp-nSzbgXSRGF1Hj0hzkPKevn3vf4z8' },
        headers: 
        { 'Cache-Control': 'no-cache' } 
      };


      request(options, function (error, response, body) {
            if (error){
              // console.log(error);
              callback(error,null);
            }else{
              // console.log(body);
              callback(null,JSON.parse(body));
            }    
        });
      }












