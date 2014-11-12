/*
* ADB Urban Information System
* Copyright (c) 2014 adb.org
*/

Ext.require([
    'GeoExt.data.FeatureStore',
    'GeoExt.grid.column.Symbolizer',
    'GeoExt.selection.FeatureModel',
    'Ext.grid.GridPanel',
    'Ext.layout.container.Border',
    'Ext.container.Viewport',
    'Ext.window.MessageBox',
    'GeoExt.panel.Map',
    'GeoExt.Action',
	'GeoExt.window.Popup'
]);

Ext.application({
	name: 'UrbanInformationSystem',
    launch: function() {
	
		var popup;
        var map;
		var prec1;
		var osm_wms;
		var city_wfs;
		var jsonURL;
		var ctrl, toolbarItems = [], action, actions = {};
		var template;
		var selTemplate;
		var style; 
		var selStyle;
		var vecLayer;
		var store;
		var gridPanel;
		var center;
		var mappanel;
		var selectCtrl;
		
		jsonURL = "../../../geoserver/adburbaninfo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=adburbaninfo:city&maxFeatures=50&outputFormat=json";
		
		map = new OpenLayers.Map(
			"map-id",
			{displayProjection: new OpenLayers.Projection("EPSG: 4326")}
		);
		
		map.addControl(new OpenLayers.Control.LayerSwitcher());	
		map.addControl(new OpenLayers.Control.ScaleLine());
		//map.addControl(new OpenLayers.Control.LayerSwitcher());
		//map.addControl(new OpenLayers.Control.PanZoomBar());
		map.addControl(new OpenLayers.Control.LayerSwitcher({'ascending':false}));
		//map.addControl(new OpenLayers.Control.Permalink());
		//map.addControl(new OpenLayers.Control.Permalink('permalink'));
		map.addControl(new OpenLayers.Control.MousePosition());
		map.addControl(new OpenLayers.Control.OverviewMap());
		map.addControl(new OpenLayers.Control.KeyboardDefaults());
		
		// local base layer (to be changed) 
		/*
		prec1 = new OpenLayers.Layer.WMS(
			"Prec1",
			"http://localhost:8080/geoserver/adburbaninfo/wms",
			{layers: 'adburbaninfo:prec1'}
		);
		*/
		osm_wms = new OpenLayers.Layer.WMS(
			"OpenStreetMap",
			"http://ows.terrestris.de/osm/service?",
			{layers: 'OSM-WMS'},
			{
				attribution: '&copy; terrestris GmbH & Co. KG <br>' +
				'Data &copy; OpenStreetMap ' +
				'<a href="http://www.openstreetmap.org/copyright/en"' +
				'target="_blank">contributors<a>'
			}
		);

		// WFS Layer
		/*
		city_wfs = new OpenLayers.Layer.Vector(
			"City", {
				strategies: [new OpenLayers.Strategy.Fixed()],
				protocol: new OpenLayers.Protocol.WFS({
					url: "/geoserver/adburbaninfo/ows",
					version: "1.1.0",
					featureType: "city",
					featureNS: "http://www.adburbaninfo.org",
					srsName: "EPSG:4326"
				})
			}
		);
		*/
		context = {
			getColor: function(feature) {
				/*
				if(feature.attributes.folderpath == 'Urban mapping target/SAUW') {
					return 'green';
				}
				if(feature.attributes.folderpath == 'Urban mapping target/UCCRTW') {
					return 'orange';
				}
				return 'red';
				*/
				return 'blue';
			},
			getName: function(feature) {
				return feature.attributes.name;
			}
		};
		
		template = {
			"cursor": "pointer",
			"fillOpacity": 0.5,
            "fillColor": "${getColor}",
            "pointRadius": 5,
            "strokeWidth": 1,
            "strokeOpacity": 1,
            "strokeColor": "${getColor}",
            "graphicName": "triangle",
			"graphicTitle": "${getName}"
        };
		
		selTemplate = {
			"cursor": "pointer",
			"fillOpacity": 1,
            "fillColor": "${getColor}",
            "pointRadius": 5,
            "strokeWidth": 1,
            "strokeOpacity": 1,
            "strokeColor": "${getColor}",
            "graphicName": "triangle",
			"graphicTitle": "${getName}"
		};
		
		style = new OpenLayers.Style(template, {context: context});
		selStyle = new OpenLayers.Style(selTemplate, {context: context});
		
		vecLayer = new OpenLayers.Layer.Vector("city", {
			strategies: [new OpenLayers.Strategy.Fixed()],
			protocol: new OpenLayers.Protocol.HTTP({
				url: jsonURL,
				format: new OpenLayers.Format.GeoJSON()
			}),
			styleMap: new OpenLayers.StyleMap({
				'default': style,
				'select': selStyle
            }),
			projection: new OpenLayers.Projection("EPSG:4326")
		});
		
		// Select city combo box
		Ext.define('City', {
			extend: 'Ext.data.Model',
			fields: [
				{name: "id", type: "int"},
				{name: "name", type: "string"},
				{name: "id_0", type: "int"},
				{name: "id_1", type: "int"},
				{name: "id_2", type: "int"}
			]
		});
		
		dropdownCity = Ext.create('Ext.form.field.ComboBox', {
			xtype: 'combo',
			name: 'City',
			triggerAction: 'all',
			displayField: 'name',
			valueField: 'id',
			width: 180,
			store: Ext.create('Ext.data.Store', {
				model: 'City',
				proxy: {
					type: 'ajax',
					url: jsonURL,
					reader: {
						type: 'json',
						root: 'features',
						record: 'properties'
					}
				},
				autoLoad: true
			}),
			emptyText: 'Select City',
			typeAhead: true,
			listConfig: {
				listeners: {
					select: function(list, record) {
						// alert(record.get('name') + ' clicked');
						window.location.href = 'city.html?id_2=' + record.get('id_2') + '&id_1=' + record.get('id_1') + '&id_0=' + record.get('id_0') + "&name=" + record.get('name').split(' ').join('%20');
					}
				}
			}
		});
		
		toolbarItems.push(dropdownCity);
        toolbarItems.push("-");
		var contactLink = ({
			text: 'Contact',
			url: 'contact.html',
			width: 100,
			baseParams: {
				q: 'html+anchor+tag'
			},
			tooltip: 'Contact Us'
		});
		
		toolbarItems.push(contactLink);
        toolbarItems.push("-");
		
		var links = ({
			text: 'Links',
			url: 'links.html',
			width: 100,
			baseParams: {
				q: 'html+anchor+tag'
			},
			tooltip: 'Links to other resource'
		});
		
		toolbarItems.push(links);
        toolbarItems.push("-");
		
		var aboutLinks = ({
			text: 'About',
			url: 'about.html',
			width: 100,
			baseParams: {
				q: 'html+anchor+tag'
			},
			tooltip: 'About ADB Urban Information System'
		});
		
		toolbarItems.push(aboutLinks);
        toolbarItems.push("-");
		
		// map.addLayers([city_wfs, prec1]);	  
		map.addLayers([vecLayer, osm_wms]);	  
		center = new OpenLayers.LonLat(100, 12);
		map.setCenter(center, 4);
		
        mappanel = Ext.create('GeoExt.panel.Map', {
            title: 'Satellite-based Urban Information Sytem',
            map: map,
			extent: actions['max_extent'],
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                items: toolbarItems
			}]
        });
 
        Ext.create('Ext.container.Viewport', {
            layout: 'fit',
            items: [mappanel]
        });
		
		// create select feature control
		selectCtrl = new OpenLayers.Control.SelectFeature(vecLayer);
		
		// define "createPopup" function
		var cityURL = "city.html";
		
		function createPopup(feature) {
			popup = new GeoExt.Popup( {
				title: 'City Summary',
				location: feature,
				width: 200,
				html: feature.attributes.name + "<br/>City# = " + feature.attributes.id_2 +
					"<br/>Region# = " + feature.attributes.id_1 +
					"<br/>Country# = " + feature.attributes.id_0 +
					"<br/>" +  "<a href=" + cityURL
					+ "?id_2=" + feature.attributes.id_2
					+ "&id_1=" + feature.attributes.id_1
					+ "&id_0=" + feature.attributes.id_0
					+ "&name=" + feature.attributes.name.split(' ').join('%20')
					+ ">Details</a>",
				maximizable: true,
				collapsible: true,
				anchorPosition: 'auto'
			});
			// unselect feature when the pop-up is closed
			// for debugging - 11/6/2014
			// unselect function not working
			popup.on({
				close: function() {
					// if(OpenLayers.Util.indexOf(city_wfs.selectedFeatures,
					// if(OpenLayers.Util.indexOf(vecLayer.selectedFeatures.this.feature) > -1) {
						// selectCtrl.unselect(this.feature);
					// }
				}
			});
			popup.show();
		}
		
		// create pop-up on "featureselected"
		vecLayer.events.on({
				featureselected: function(e) {
				createPopup(e.feature);
			}
		});
		
		// selector
		map.addControl(selectCtrl);
		selectCtrl.activate();
	}
});

