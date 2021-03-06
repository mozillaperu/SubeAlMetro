// Obtener posicion
function miPosicion(callback) {
			
	if (!navigator.geolocation){		
		return false;
	}
 
	function success(position) {
		var latitude  = position.coords.latitude;
		var longitude = position.coords.longitude;
		callback(latitude,longitude);			
	}
 
	function error() {
		
	}	

	navigator.geolocation.getCurrentPosition(success, error);			
}

function distaciaMenor(miLatitud, miLongitud, estacionLatitud, estacionLongitud, estacion){
	var R = 6371; // km
	var dLat = (estacionLatitud-miLatitud).toRad();
	var dLon = (estacionLongitud-miLongitud).toRad();
	var lat1 = miLatitud.toRad();
	var lat2 = estacionLatitud.toRad();

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;

	return [d,estacion];
}

function marcarEstacion(result){	
	var notification = navigator.mozNotification.createNotification(
            "La estación mas cercana es: ",
            "Estación "+result+""
        );
    notification.show();	
	$("li [data-view-name='estacion']").each(function( index ) {
		if(result == $(this).data("estacion")){				
			$(this).addClass('estacionActiva');
		}
	});
}

function btnEvents(btnName){
	$('#btn-' + btnName).click(function (){
		$("#btn-estacion").removeClass('selectedTab');
		$("#btn-mapa").removeClass('selectedTab');
		$("#btn-twitter").removeClass('selectedTab');
		$("#btn-info").removeClass('selectedTab');
		$(this).addClass('selectedTab');		
		$('#settings-view').removeClass('bajar');
		$('.active').removeClass('active');
		//Cambiar Titulo
		$('#titulo').html("&nbsp;"+$('#'+btnName).attr('alt'));				
	});
}

function mostrarUrl(tweet) {
	var url_regexp = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
  	return tweet.replace(url_regexp,"<a href='$1' class='tweetURL' target='_blank'>$1</a>");
}

function mostrarHora(hora){
	return hora.substring(0, 2) + ":" + hora.substring(2, 4);
 }

function obtenerHora(){	
	var hora = new Date();    
    horaActual = hora.getHours()+':'+(hora.getMinutes()<10?'0':'') + hora.getMinutes();
    return horaActual;
    console.log(horaActual)
    setTimeout("obtenerHora()",1000)
}

function mostrarSiguienteHora(horaActual,hora){
	var miFecha = new Date("1990-01-01" + hora);
	var hora = hora.getHours()+':'+(hora.getMinutes()<10?'0':'') + hora.getMinutes();	
}

function pintarHorasPunta(hora){
	
	var horasPico = 
	[
    "06:30","06:36","06:42","06:48","06:54","07:00","07:06","07:12","07:18",
    "07:24","07:30","07:36","07:42","07:48","07:54","08:00","08:06","08:12",
    "08:18","08:24","08:30","08:36","08:42","08:48","08:54","09:00","09:06",
    "09:12","09:18","09:24","09:30","09:36","09:42","09:48","09:54","10:00",
    "17:00","17:06","17:12","17:18","17:24","17:30","17:36","17:42","17:48",
    "17:54","18:00","18:06","18:12","18:18","18:24","18:30","18:36","18:42",
    "18:48","18:54","19:00","19:06","19:12","19:18","19:24","19:30","19:36",
    "19:42","19:48","19:54","20:00","20:06"
    ]

	for(var i = 0; i < horasPico.length; i++){  		
  		if(hora == horasPico[i]){  			
  			return '<span class="horaPico">'+hora+'</span>';
  		} 
  	}

	return hora;
}

$(function() {
	
	// Acceso a internet
	var xhr = new XMLHttpRequest({
	    mozSystem: true
	});

	$('.active').addClass('active');
	$("#btn-estacion").addClass('selectedTab');

  	var buttons = ['estacion', 'mapa', 'twitter', 'info'];
	$.map(buttons, function(button){
		btnEvents(button);
	});

	$('.rTweets').hide();
	$('.rMap').hide();

	// Horarios
	Horario = Backbone.Model.extend({});

	HorarioCollection = Backbone.Collection.extend({		
		model: Horario,
		parse: function(response) {
			return response;		
		}
	});

	var HorarioView = Backbone.View.extend({		
		events: {
	        "click #settings-btn": "cerrarHorario"
	    },
		cerrarHorario: function(){		
			$('#settings-view').removeClass('subir');
			$('#settings-view').addClass('bajar');
		},
		initialize: function(attrs){
			this.estacionNombre = attrs;
			this.listenTo(this.collection, 'change', this.render);				
			this.template = _.template( $("#HorarioView").html() );			
		},
		render: function () {			
			this.$el.html(this.template({ horarios: _.where(this.collection.toJSON(), {nombre: this.estacionNombre.attrs }) }));  
			return this;	    
		}
	});
	
	// Estaciones
	Estacion = Backbone.Model.extend({});

	EstacionCollection = Backbone.Collection.extend({		
		model: Estacion,
		url: 'js/estaciones.json',		
		parse: function(response) {
			return response;
		}
	});	

	EstacionView = Backbone.View.extend({
		events: {
	        'click [data-view-name="estacion"]': 'obtenerHorario'
	    },
	    obtenerHorario: function(ev){

	    	function feriados(nombreDeLaFecha){
	    		var horarioCollection = new HorarioCollection();

		    	horarioCollection.fetch({url: 'js/horarios_domingo_y_feriados.json', reset: true});  

		    	var horarioView = new HorarioView({collection: horarioCollection, attrs: estacion});

		    	horarioCollection.bind('reset', function () {						
					$("#horarios-page").html(horarioView.render().$el);
					horarioView.$("#settings-view").removeClass("bajar");		
					horarioView.$("#settings-view").addClass("subir");
					horarioView.$("#tituloNombreEstacion").html(" Estación " + estacion);
					horarioView.$("#horariosDiaSemana").html(""+nombreDeLaFecha+"");
				});
	    	}

	    	// Dias feriados, 0 - 11 Meses del año segun Javascript
	    	var ene1 = new Date(2014,0,1);
	    	var abr17 = new Date(2014,3,17);
	    	var abr18 = new Date(2014,3,18);
	    	var may1 = new Date(2014,4,1);
	    	var jun29 = new Date(2014,5,29);
	    	var jul28 = new Date(2014,6,28);
	    	var jul29 = new Date(2014,6,29);
	    	var agos30 = new Date(2014,7,30);
	    	var oct8 = new Date(2014,9,8);
	    	var nov1 = new Date(2014,10,1);
	    	var dic8 = new Date(2014,11,8);
	    	var dic25 = new Date(2014,11,25);

	    	function getFullDay(date){
	    		return date.getFullYear() + '-' +  date.getMonth() + '-' + date.getDate();
	    	}

	    	var estacion = $(ev.currentTarget).text().replace("Estación ","").trim();	    	

	    	var dia = new Date();
	    	dia.setHours(0,0,0,0);
	    	var fullDay = dia.getFullYear() + '-' +  dia.getMonth() + '-' + dia.getDate();

			var n = dia.getDay();

			if(fullDay == getFullDay(ene1)){
				var fechaEspecial = "Primer día del año";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(abr17)){
				var fechaEspecial = "¡Feliz Semana Santa!";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(abr18)){
				var fechaEspecial = "¡Feliz Semana Santa!";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(may1)){
				var fechaEspecial = "Día del trabajador";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(jun29)){
				var fechaEspecial = "Día de San Pedro y San Pablo";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(jul28)){
				var fechaEspecial = "Día de la Independencia del Perú";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(jul29)){
				var fechaEspecial = "¡Felices Fiestas Patrias!";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(agos30)){
				var fechaEspecial = "Santa Rosa de Lima";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(oct8)){
				var fechaEspecial = "Combate de Angamos";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(nov1)){
				var fechaEspecial = "Día de todos los Santos";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(dic8)){
				var fechaEspecial = "Día de la Inmaculada Concepción";
				feriados(fechaEspecial)				
			} else if(fullDay == getFullDay(dic25)){
				var fechaEspecial = "¡Feliz Navidad!";
				feriados(fechaEspecial)				
			} else if(n == 0){
				var horarioCollection = new HorarioCollection();

		    	horarioCollection.fetch({url: 'js/horarios_domingo_y_feriados.json', reset: true});  

		    	var horarioView = new HorarioView({collection: horarioCollection, attrs: estacion});

		    	horarioCollection.bind('reset', function () {						
					$("#horarios-page").html(horarioView.render().$el);
					horarioView.$("#settings-view").removeClass("bajar");		
					horarioView.$("#settings-view").addClass("subir");
					horarioView.$("#tituloNombreEstacion").html(" Estación " + estacion);
					horarioView.$("#horariosDiaSemana").html("Domingos");
				});	    		
			} else if(n == 1 || n == 2 || n == 3 || n == 4 || n == 5 || n == 6){				
				var horarioCollection = new HorarioCollection();

		    	horarioCollection.fetch({url: 'js/horarios.json', reset: true});  

		    	var horarioView = new HorarioView({collection: horarioCollection, attrs: estacion});

		    	horarioCollection.bind('reset', function () {						
					$("#horarios-page").html(horarioView.render().$el);
					horarioView.$("#settings-view").removeClass("bajar");		
					horarioView.$("#settings-view").addClass("subir");
					horarioView.$("#tituloNombreEstacion").html(" Estación " + estacion);
					horarioView.$("#horariosDiaSemana").html("Lunes - Viernes");
				});				
			} /*else if(n == 6){
	    		var horarioCollection = new HorarioCollection();

		    	horarioCollection.fetch({url: 'js/horarios_sabados.json', reset: true});  

		    	var horarioView = new HorarioView({collection: horarioCollection, attrs: estacion});

		    	horarioCollection.bind('reset', function () {						
					$("#horarios-page").html(horarioView.render().$el);
					horarioView.$("#settings-view").removeClass("bajar");		
					horarioView.$("#settings-view").addClass("subir");
					horarioView.$("#tituloNombreEstacion").html(" Estación " + estacion);
					horarioView.$("#horariosDiaSemana").html("Sabados");
				});	    		
	    	}*/

	    },
		initialize: function(){		 		
			this.template = _.template( $("#EstacionView").html() );						
		},
		render: function () {
			this.$el.html(this.template({estacionMetro: this.collection.toJSON()}));			
	        this.afterRender();
			return this;
		},
		afterRender: function() {
			var miLatitud;
			var miLongitud;
			var collection = this.collection;		
			miPosicion(function(latitude,longitude){	
				miLatitud = latitude;
				miLongitud = longitude;
				var resultados = [];		
				collection.each(function(model) {
					var lat = model.get("latitud")
					var lon = model.get("longitud")
					var est = model.get("estacion")
					resultados.push(distaciaMenor(miLatitud, miLongitud, lat, lon, est));
				});
				var distaciaMinimo = Math.min.apply(Math, resultados.map(function(i) {
				    return i[0];
				}));
				estacionCercana = $.grep(resultados, function(v,i) {
				    return v[0] === distaciaMinimo;
				});
				var resultado = estacionCercana[0][1]				
				marcarEstacion(resultado)
			});								
		}
	});

	var estacionCollection = new EstacionCollection();

	var estacionView = new EstacionView({collection: estacionCollection});

	estacionCollection.fetch({reset: true});

	estacionCollection.bind('reset', function () {	
		$("#estacion-page").append(estacionView.render().$el);
	});	

	// Mapa de ubicaciones de las estaciones
	MapView = Backbone.View.extend({		
	    initialize: function(){      	
	        this.render();
	    },
	    render: function(){
	    	var template;
	    	if (navigator.onLine) { 
	      		template = _.template( $("#MapView").html(), {} );
	      	} else {
	      		template = _.template( $("#MapOfflineView").html(), {} );
	      	}	      
	      	this.$el.html( template );
	      	this.afterRender();	      		
	      	return this;      	
	    },
	    afterRender: function(){	    	
	    }
  	});

  	var mapView = new MapView({ el: $("#mapa-page") });  	
  	
  	// Twitter
  	Tweet = Backbone.Model.extend({});

	TweetCollection = Backbone.Collection.extend({		
		model: Tweet,		
		url: 'http://glacial-gorge-2029.herokuapp.com/lineaunope',
		parse: function(response) {
			return response;
		}
	});

	TweetView = Backbone.View.extend({
		initialize: function(){	
			this.template = _.template( $("#TweetView").html() );			
		},
		render: function () {
			this.$el.html(this.template({tweet: this.model.toJSON()}));	
			return this;
		}
	});

	var tweetCollection = new TweetCollection();	

	var tweetView = new TweetView({model: tweetCollection});

	tweetCollection.bind('reset', function () {						
		$("#tweet-page").append(tweetView.render().$el);
	});

	tweetCollection.fetch({reset: true});

	if(!navigator.onLine) {
  		$("#tweet-page").html("<br/><br/><br/><h1 class='mensajeConexionT'>Necesita conexión a internet<h1>");
  	}

	// Info
  	InfoView = Backbone.View.extend({
	    initialize: function(){
	        this.render();
	    },
	    render: function(){
	      var template = _.template( $("#InfoView").html(), {} );
	      this.$el.html( template );
	    }
  	});
  	
  	var infoView = new InfoView({ el: $("#info-page") });

});