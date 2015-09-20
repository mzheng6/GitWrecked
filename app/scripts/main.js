var twilio = require('twilio');
var concur = require('concur-platform');
var request = require('request');
var parser = require('xml2js').parseString;
var fs = require('fs');
// var airports = require('airport-codes');
var Handlebars = require('handlebars');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hackmitgitwrecked@gmail.com',
        pass: 'Watermel0n'
    }
});

//make request for concur access token
var options = {
    username:'user3@concurdisrupt.com',
    password:'disrupt',
    consumerKey: 'IMHfBE3AWo1NufQCWzHyk2'
};

request('localhost:3000/', function(req, res) {

	concur.oauth.native(options)
	.then(function(token) {
	    // token will contain the value, instanceUrl, refreshToken, and expiration details
	    console.log(token.value);
	    var accessToken = token.value;
	    //make request 
	    var options = {
	    	oauthToken:accessToken
	    };
	    concur.itinerary.get(options)
	    .then(function(data) {
	    	// console.log(data[0]);
	    	var url = data[0].id;
	    	//set parameters for second concur api call
	    	var options = {
	    		url: url,
	    		headers: {
	    			'Authorization': 'OAuth ' + accessToken,
	    			'User-Agent': 'request',
	    			// 'Accept': 'application/json'
	    		}
	    	};
	    	request(options, function (error, response, body) {
	    		parser(body, function(err, result) {
	    			var startCity = result.Itinerary.Bookings[0].Booking[0].Segments[0].Air[0].StartCityCode;
	    			var endCity = result.Itinerary.Bookings[0].Booking[0].Segments[0].Air[0].EndCityCode;
	    			console.log(startCity[0]);
	    			//make request to google geocoding api to get long name of city	
			    	var options = {
			    		url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + startCity[0],
			    		headers: {
			    			'User-Agent': 'request',
			    		}
		    		};
	    			request(options, function(error, response, body) {
	    				var parsedBody = JSON.parse(body);
	    				// console.log(parsedBody.results[0].address_components[4].long_name);
	    				var myCity = parsedBody.results[0].address_components[4].long_name;
	    				console.log("city: ", myCity);
		    			//make flickr call
						//flickr setup
						var Flickr = require("flickrapi"),
						    flickrOptions = {
								api_key: 'f98ff818cd4fc9bd0ff74f2dac2fbb4a',
								secret: "7a11220ffe66bb33",
						    };
							Flickr.tokenOnly(flickrOptions, function(error, flickr) {
							  // we can now use "flickr" as our API object,
							  // but we can only call public methods and access public data
							 	flickr.photos.search({
									text: myCity
								}, function(err, result) {
									if(err) { 
										// console.log("am i here?");
										console.error(err); 
									}
									// do something with result
									var randPhoto = result.photos.photo[9];
									// console.log("randPhoto: ", randPhoto);
									var photo_id = randPhoto.id;
									// console.log("photo_id:", photo_id);
									flickr.photos.getSizes({
										// api_key: 'f98ff818cd4fc9bd0ff74f2dac2fbb4a',
										photo_id: photo_id
									}, function(err, result) {
										// console.log("json: ", result);	
										var photo_url = result.sizes.size[1].source;
										console.log(photo_url);

										var data = {
										    CONTENT: "Greetings from Peru!",
										    image: photo_url
										};

										var templateFile = fs.readFileSync('EmailBluePrint.html', 'utf8');
										var template = Handlebars.compile( templateFile );
										var html = template(data);	

										var mailOptions = {
										    from: "Gavin Chan <gavinchan44@gmail.com", // sender address
										    to: "gavinwhchan@gmail.com", // list of receivers
										    subject: "Greetings!", // Subject line
										    // text: "gavin", // plaintext body
										    html: html
										};

										// send mail with defined transport object
										transporter.sendMail(mailOptions, function(error, response){
										    if(error){
										        console.log(error);
										    }else{
										        console.log("Message sent: " + response.message);
										    }

										    // if you don't want to use this transport object anymore, uncomment following line
										    //smtpTransport.close(); // shut down the connection pool, no more messages
										});
									});
									// console.log("PHOTOS: ", result);
								});
							});
		    			});
	    			// console.log(airports.findWhere({ iata: startCity[0] }).get('name'));
	    		});
			});
	  	})
	    .fail(function(error) {
	    	//Error will contain the error returned
	    	console.error(error);
	    });
	})
	.fail(function(error) {
	    // error will contain the error message returned
		console.error(error);
	});
});


//listens for post requests to this server from the website
// ('/', function(req, res) {
// });
