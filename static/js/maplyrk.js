var map;
var gc_markers = new Array();
var poi_markers = new Array();

function jumpto(lat, lon) {
	$("#autocomplete").hide();
	map.panTo([lat, lon]);
	$.each(gc_markers, function(number, marker) {
		map.removeLayer(marker);
	});
}


function geocode() {
	if($("#searchfield").val().length > 3) {
		$.getJSON("http://open.mapquestapi.com/geocoding/v1/address?callback=?&key=Fmjtd%7Cluur21u7nq%2C7s%3Do5-90txqa", {
			"location": $("#searchfield").val(),
			"outFormat": "json"
		}, function(data) {
			// bestehende marker entfernen
			$.each(gc_markers, function(number, marker) {
				map.removeLayer(marker);
			});

			var current_bounds = map.getBounds();
			var autocomplete_content = "<li>"

			// gefundene positionen markieren
			$.each(data.results[0].locations, function(number, location) {
				var latlng = [location.displayLatLng.lat, location.displayLatLng.lng];
				if(current_bounds.contains(latlng)) {
					newmarker = L.marker(latlng);
					gc_markers.push(newmarker);
					newmarker.addTo(map);
				}

				if(location.adminArea5 != "") autocomplete_content += "<ul onclick='jumpto("+location.displayLatLng.lat+", "+location.displayLatLng.lng+")'>"+location.adminArea5+", "+location.adminArea1+"</ul>";
			});

			$("#autocomplete").html(autocomplete_content+"</li>");
			$("#autocomplete").show();
		});
	} else {
		$("#autocomplete").hide();
	}
}


function element_to_map(data) {
	$.each(poi_markers, function(_, mrk) {
		map.removeLayer(mrk);
	});

	data = all_to_nodes(data);
	$.each(data.elements, function(_, el) {
		if(el.tags != undefined && el.tags.entrance != "yes") {

			if(el.tags.vending != undefined) {
				mrk = L.marker([el.lat, el.lon], {icon: kondom_icon});
				mrk.bindPopup("Kondomautomat");
			} else if(el.tags.amenity == "stripclub") {
				mrk = L.marker([el.lat, el.lon], {icon: strip_icon});
				popup_content = "<strong>" + el.tags.name + " (Stripclub)</strong>";
				mrk.bindPopup(popup_content);
			} else if(el.tags.shop == "erotic" || el.tags.shop == "adult") {
				mrk = L.marker([el.lat, el.lon], {icon: shop_icon});
				popup_content = "<strong>" + el.tags.name + " (Sexshop)</strong>";
				mrk.bindPopup(popup_content);
			} else if(el.tags.amenity == "brothel") {
				mrk = L.marker([el.lat, el.lon], {icon: brothel_icon});
				popup_content = "<strong>" + el.tags.name + " (Bordell)</strong>";
				mrk.bindPopup(popup_content);
			} else if(el.tags.amenity == "register_office" || el.tags.office == "register") {
				mrk = L.marker([el.lat, el.lon], {icon: register_icon});
				popup_content = "<strong>" + el.tags.name + " (Register Office)</strong>";
				mrk.bindPopup(popup_content); 
			} else {
				mrk = L.marker([el.lat, el.lon]);
				mrk.bindPopup(JSON.stringify(el.tags))
			}

			poi_markers.push(mrk);
			mrk.addTo(map);
		}
	});
}


function get_op_elements() {
	if(map.getZoom() < 12) {
		return null;
	}
	bbox = map.getBounds().getSouth() + "," + map.getBounds().getWest() + "," + map.getBounds().getNorth() +  "," + map.getBounds().getEast();

	localStorage.setItem("pos_lat", map.getCenter().lat)
	localStorage.setItem("pos_lon", map.getCenter().lng)

	$.ajax({
		url: "http://overpass-api.de/api/interpreter",
		data: {
			"data": '[out:json][timeout:25];(node["vending"="condoms"]('+bbox+');way["vending"="condoms"]('+bbox+');>;relation["vending"="condoms"]('+bbox+');>;node["amenity"="brothel"]('+bbox+');way["amenity"="brothel"]('+bbox+');>;relation["amenity"="brothel"]('+bbox+');>;node["amenity"="stripclub"]('+bbox+');way["amenity"="stripclub"]('+bbox+');>;relation["amenity"="stripclub"]('+bbox+');>;node["shop"="erotic"]('+bbox+');way["shop"="erotic"]('+bbox+');>;relation["shop"="erotic"]('+bbox+');>;node["shop"="adult"]('+bbox+');way["shop"="adult"]('+bbox+');>;relation["shop"="adult"]('+bbox+');>;node["office"="register"]('+bbox+');way["office"="register"]('+bbox+');>;relation["office"="register"]('+bbox+');>;node["amenity"="register_office"]('+bbox+');way["amenity"="register_office"]('+bbox+');>;relation["amenity"="register_office"]('+bbox+');>;node["shop"="sex"]('+bbox+');way["shop"="sex"]('+bbox+');>;relation["shop"="sex"]('+bbox+');>;);out body;'
		},
		success: element_to_map
	});
}


function go_to_current_pos() {
	navigator.geolocation.getCurrentPosition(function(pos) {
		map.setView([pos.coords.latitude, pos.coords.longitude]);
	});
}


$(function() {
	kondom_icon = L.icon({
		iconUrl: '/static/img/kondom.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	strip_icon = L.icon({
		iconUrl: '/static/img/stripclub2.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	shop_icon = L.icon({
		iconUrl: '/static/img/shop.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	brothel_icon = L.icon({
		iconUrl: '/static/img/brothel.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	register_icon = L.icon({
		iconUrl: '/static/img/register.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	// init map
	map = L.map('bigmap')
	
	saved_lat = localStorage.getItem("pos_lat")
	saved_lon = localStorage.getItem("pos_lon")

	if(saved_lat != undefined) {
		map.setView([saved_lat, saved_lon], 13)
	} else {
		map.setView([51.0474, 13.7384], 13);
	}

	var hash = new L.Hash(map);

	if(L.Browser.retina) var tp = "lr";
	else var tp = "ls";
	L.tileLayer('http://tiles.lyrk.org/'+tp+'/{z}/{x}/{y}?apikey=299723017f344e81866878c8f2fb0678', {
		attribution: 'powered by <a href="https://geodienste.lyrk.de">Lyrk Geodienste</a>, <a href="http://geodienste.lyrk.de/copyright">Lizenzinformationen</a>',
		maxZoom: 18
	}).addTo(map);

	// init search
	$("#searchfield").keyup(function() {
		geocode();
	});

	// poi reload on map move
	map.on('moveend', get_op_elements);

	// initial poi load
	get_op_elements();
});