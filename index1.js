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
    cc: 'facility@suntechnologies.com',
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
//   console.log("Success Google API call",data);
  

    var parsedData= JSON.parse(data); 

     parsedData.results.forEach(element => {
      
      var place={
         "lat": element.geometry.location.lat,
       "long": element.geometry.location.lng,
        "targetname": element.name,
        "opennow" : element.opening_hours.open_now
       }
//         console.log(place);
      targets.push(place);
    });

    console.log(targets);
     var textresponse="";
     var status;
     for(var i=0;i<targets.length;i++){
       if(targets[i].opennow === true){
         status= "open"
       }else{
         status="closed"
       }
       textresponse = textresponse+targets[i].targetname +"-" + status+"\n";
       if(i==4){
       break;
       }
     }
         var searchplace =options.qs.type; 
        var MapUrl= textresponse+"\n\n"+"https://www.google.co.in/maps/search/searchplace+near+me";
        console.log(MapUrl);
        var formatedResponse = responseFormator(MapUrl);
        response.send(formatedResponse);
//       })
   
   }
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
      type: 'atm'+ ',' + 'restaurant',
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


