var app = express.Router();


//Der Dienstnutzer nutzt die Capability Turniere und Matches zu organisieren ,wie sie der Dienstgeber anbietet. Im Dienstgeber ist in jedem Match ein Feld "Regelwerk" vorgesehen  ,dass die 
//Spezifika eines Wettkampfes beschreibt. So ist erreicht ,dass der Dienst für unterschiedlichste Wettkampfarten nutzbar ist.

var Regelwerk=
    {
        "Regelwerk":{
            "Beschreibung":"Beim Tichkicker spielen 2 Parteien á  1-2 Personen an einem Kickertisch gegeneinander. Es wird wahlweise bis 10 oder bis 6 Punkte gespielt. Jedes Tor zählt einen Punkt. Tore,die unmittelbar mit der ersten Ballberührung nach Anstoß erzielt werden zählen nicht.", 
            "OffiziellesRegelwerk":"http://www.tischfussball-online.com/tischfussball-regeln.htm",
            "Spielstand":{
                "SpielstandT1":null,
                "SpielstandT2":null
            }
        }
    }


app.get('/addTurnier', function(req, res) {

    res.render('pages/addTurnier');
});

app.get('/alleTurniere', function(req, res) {

    var options = {
        host: "localhost",
        port: 3000,
        path: "/Turnier",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }
    var externalRequest = http.request(options, function(externalResponse){

        externalResponse.on("data", function(chunk){

            var turniere = JSON.parse(chunk);
            res.render('pages/alleturniere',{turniere:turniere});
            res.end();
        });

    });

    externalRequest.end();
});


app.post('/', function(req, res) {

    console.log("Called Turnier_post auf Dienstnutzer");
    
    // Speichert req.body
    var TurnierAnfrage = req.body;

    // HTTP Header setzen
    var headers = {
        'Content-Type': 'application/json',
        'Accepts':'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Turnier',
        method: 'POST',
        headers: headers
    };

    //Poste Turnier 
    var externalRequest = http.request(options, function(externalResponse) {

        //Post hat nicht funktioniert, sende Statuscode 400
        if(externalResponse.statusCode == 400){
            res.status(400).end();
        };

        //Sobald Post Ergebnis zurückkommt 
        externalResponse.on('data', function (chunk) {

            var turnier = JSON.parse(chunk);
            
            var teilnehmerArray=turnier.Teilnehmer;
            
            
            
            
            console.log("Austragungsort des Turniers ist:" + turnier.Austragungsort);

            //Turnier ist erfolgreich gepostet worden 
            //Wenn Austragungsort bekannt ist , 
            //Poste AnzahlTeilnehmer / Teamgröße Matches und baue die Antworten in die TUrnierrep. ein 
            if(turnier.Austragungsort){
                
                console.log("Schleife für MatchPosts im Turnier erreicht ");

                //Für alle im Spielplan vorgesehenen Matches 
                for(var i=0;i<turnier.Spielplan.length;i++){

                    //Extrahiere Link um Matches dem Turnier hinzuzufügen und Poste darauf 
                    var optionsMatches = {
                        host: 'localhost',
                        port: 3000,
                        path: turnier.MatchHinzufuegen,
                        method: 'POST',
                        headers: headers
                    };

                    var matchAnfrage={
                        //Set von Benutzern required
                        'Datum' : "TO BE SPECIFIED",
                        'Uhrzeit': "TO BE SPECIFIED",
                        'Teilnehmer' : "TO BE SPECIFIED",
                        'Regelwerk':Regelwerk,
                        'Austragungsort': turnier.Austragungsort,
                        'Status':"vor_beginn"
                    };
                    
                
                    //Stelle Match Post-Anfragen 
                    var matchRequest = http.request(optionsMatches, function(externalResponse) {
                         //Match anlegen war nicht erfolgreich , der Turnierplan muss aber alle Matches
                        //enthalten ,daher dekrementiere i um einen neuen versuch zu Starten 
                        if(externalResponse.statusCode != 201){
                                 i--;
                        }
                    });
                    
                    matchRequest.write(JSON.stringify(matchAnfrage));
                    matchRequest.end();
                }
            }

            //Schicke fertiges Turnier zurück
            console.log(util.inspect(turnier, false, null));
            res.json(turnier);
            res.end();
        });
    });

    externalRequest.write(JSON.stringify(TurnierAnfrage));

    externalRequest.end();

});

app.get('/:TurnierId', function(req, res) {

    var options1 = {
        host: 'localhost',
        port: 3000,
        path: '/Turnier/'+req.params.TurnierId,
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    };

    var options2 = {
        host: "localhost",
        port: 3000,
        path: "/Benutzer",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }


    var x = http.request(options1, function(externalResponse){

        var y = http.request(options2, function(externalrep){



            externalResponse.on("data", function(chunk){


                var turnier = JSON.parse(chunk);



                externalrep.on("data", function(chunks){

                    var benutzerAll = JSON.parse(chunks);

                    res.render('pages/einturnier', {
                        turnier: turnier ,benutzerAll:benutzerAll                     
                    });
                    res.end();




                });

            });

        });


        y.end();

    });
    x.end();


});

app.put('/:TurnierId/Teilnehmer', function(req, res) {

    // Speichert req.body
    var Teilnehmer = req.body;
    console.log(Teilnehmer);
    var turnierId = req.params.TurnierId;

    // HTTP Header setzen
    var headers = {
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Turnier/'+turnierId+'/Teilnehmer',
        method: 'PUT',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {

        if(externalResponse.statusCode == 409){
            res.status(409).end();
        };

        externalResponse.on('data', function (chunk) {

            var completeTurnierplan = JSON.parse(chunk);

            console.log(util.inspect(completeTurnierplan, false, null));

            res.json(completeTurnierplan);
            res.end();


        });

    });

    externalRequest.write(JSON.stringify(Teilnehmer));

    externalRequest.end();

});

app.put('/:TurnierId', function(req, res) {

    var TurnierDaten = req.body;
    var turnierId = req.params.TurnierId;

    /*

	    BODY:

	 {
	"Austragungszeitraum":"10.11.2015",
	"Status":"aktiv"
}   


	    */

    console.log(util.inspect(TurnierDaten, false, null));

    var responseString = '';

    // HTTP Header setzen
    var headers = {
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Turnier/'+turnierId,
        method: 'PUT',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {


        externalResponse.on('data', function (chunk) {

            var completeTurnierplan = JSON.parse(chunk);

            console.log(util.inspect(completeTurnierplan, false, null));

            res.json(completeTurnierplan);
            res.end();


        });

    });

    externalRequest.write(JSON.stringify(TurnierDaten));

    externalRequest.end();

});

module.exports = app;