/*
* Copyright (c) 2014
*
* File: map.js
* Description: Java script that zooms to City extent and show statistical information.
*/

Ext.require([
    'Ext.container.Viewport',
    'Ext.window.MessageBox',
    'GeoExt.panel.Map',
    'GeoExt.container.WmsLegend',
    'GeoExt.container.UrlLegend',
    'GeoExt.container.VectorLegend',
    'GeoExt.panel.Legend'
]);
 
Ext.application({
    name: 'UrbanInformationSystem',
    launch: function(){
		var map;
		var mappanel;
		var google_var;
		var google_hybrid;
		var google_physical;
		var google_streets;
		var google_satellite;
		var google_terrain;
		var osm;
		var context;
		var template;
		var selTemplate;
		var style;
		var selStyle;
		var jsonURL;
		var vecLayer;
		var code0;
		var code1;
		var code2;
		var cityname;
		var city_ext_wfs;
		var layname;
		var r2010;
		var r2005;
		var r2000;
		var vecpol;
		var rpop2010;
		var rpop2015;
		var r2000;
		var records = [];
		var store;
		var cnt90=0, cnt100=0, cnt105=0, cnt110=0;
		var area90=0, area100=0, area105=0, area110=0;
		var ChartArea, ChartGrowth, ChartCluster;
		var viewport;
		var chartWidth = 250, chartHeight=140;
		var opa = 0.75;
	
		//Get paramater values
		code0 = getParameterByName('id_0');
		code1 = getParameterByName('id_1');
		code2 = getParameterByName('id_2');
		cityname = getParameterByName('name');
		
		//Get City Extent
		city_ext_wfs = new OpenLayers.Layer.Vector(
			"City Extent",
			{
				strategies: [new OpenLayers.Strategy.Fixed()],
				protocol: new OpenLayers.Protocol.WFS({
					url: "/geoserver/adburbaninfo/ows",
					version: "1.1.0",
					featureType: "gadm2",
					featureNS: "http://www.adburbaninfo.org",
					srsName: "EPSG:4326"
				}),
				filter: new OpenLayers.Filter.Logical({
					type: OpenLayers.Filter.Logical.AND,
                    filters: [
						new OpenLayers.Filter.Comparison({
							type: OpenLayers.Filter.Comparison.EQUAL_TO,
							property: "id_2", //city
							value: code2
						}),
						new OpenLayers.Filter.Comparison({
							type: OpenLayers.Filter.Comparison.EQUAL_TO,
							property: "id_1", //province or region
							value: code1
						}),
						new OpenLayers.Filter.Comparison({
							type: OpenLayers.Filter.Comparison.EQUAL_TO,
							property: "id_0", //country
							value: code0
						}),						
					]
				}),
				eventListeners: {           
					'loadend': function (evt) {
						map.zoomToExtent(city_ext_wfs.getDataExtent().transform(
							new OpenLayers.Projection("EPSG:4326"), 
							new OpenLayers.Projection("EPSG:900913") 
						  ));
					}
				}
			}
        );
		map = new OpenLayers.Map(
			"map-id", 
			{projection: new OpenLayers.Projection("EPSG:900913"),
			displayProjection: new OpenLayers.Projection("EPSG: 4326"),
			units: 'degrees'}
		);
		
		map.addControl(new OpenLayers.Control.LayerSwitcher());	
		map.addControl(new OpenLayers.Control.ScaleLine());
		map.addControl(new OpenLayers.Control.MousePosition());
		
		//GoogleMap Base Layers
		google_var = new OpenLayers.Layer.Google(
			"Google LayerName",
			{type: google.maps.MapTypeId.BaseLayer}
		);
		google_hybrid = new OpenLayers.Layer.Google(
			"Google Hybrid",
			{type: google.maps.MapTypeId.HYBRID}
		);
		 
		google_physical = new OpenLayers.Layer.Google(
			"Google Physical",
			{type: google.maps.MapTypeId.PHYSICAL}
		);
		 
		google_satellite = new OpenLayers.Layer.Google(
			"Google Satellite",
			{type: google.maps.MapTypeId.SATELLITE}
		);
		 
		google_streets = new OpenLayers.Layer.Google(
			"Google Streets",
			{type: google.maps.MapTypeId.STREETS}
		);
		 
		google_terrain = new OpenLayers.Layer.Google(
			"Google Terrain",
			{type: google.maps.MapTypeId.TERRAIN}
		);
		 
		 //needs projection(wgs84:4326 to mercator:3857), offset by > 11km vs wgs84
	    osm = new OpenLayers.Layer.OSM();		
		context = {
			getColor: function(feature) {
				return 'blue';
			},
			getName: function(feature) {
				return feature.attributes.name;
			}
		};
		
		template = {
		    "title": "City",
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
		jsonURL = "../../../geoserver/adburbaninfo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=adburbaninfo:city&maxFeatures=50&outputFormat=json";
		
		cityVec = new OpenLayers.Layer.Vector("City", {
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
		//Overlays Layer
		//Landsat Layers
		layname = 'adburbaninfo:' + 'r_' + code0 
						+ '_' + code1
						+ '_' + code2 + '_2010';
		r2010 = new OpenLayers.Layer.WMS(
              "Landsat 2010",
              "http://localhost:8080/geoserver/adburbaninfo/wms",
                  {layers: layname, transparent: "true", format: "image/png"},
				  {opacity: opa, isBaseLayer: false}
        );
		layname = 'adburbaninfo:' + 'r_' + code0 
						+ '_' + code1
						+ '_' + code2 + '_2005';
		r2005 = new OpenLayers.Layer.WMS(
              "Landsat 2005",
              "http://localhost:8080/geoserver/adburbaninfo/wms",
                  {layers: layname, transparent: "true", format: "image/png"},
				  {opacity: opa, isBaseLayer: false}
        );
		layname = 'adburbaninfo:' + 'r_' + code0 
						+ '_pop10';
		rpop2010 = new OpenLayers.Layer.WMS(
              "Population 2010",
              "http://localhost:8080/geoserver/adburbaninfo/wms",
                  {layers: layname, transparent: "true", format: "image/png"},
				  {opacity: opa, isBaseLayer: false}
        );
		layname = 'adburbaninfo:' + 'r_' + code0 
						+ '_pop15';
		rpop2015 = new OpenLayers.Layer.WMS(
              "Population 2015",
              "http://localhost:8080/geoserver/adburbaninfo/wms",
                  {layers: layname, transparent: "true", format: "image/png"},
				  {opacity: opa, isBaseLayer: false}
        );
		layname = 'adburbaninfo:' + 'r_' + code0 
						+ '_pop20';
		rpop2020 = new OpenLayers.Layer.WMS(
              "Population 2020",
              "http://localhost:8080/geoserver/adburbaninfo/wms",
                  {layers: layname, transparent: "true", format: "image/png"},
				  {opacity: opa, isBaseLayer: false}
        );
		layname = 'adburbaninfo:' + 'r_' + code0 
						+ '_' + code1
						+ '_' + code2 + '_2000';
		r2000 = new OpenLayers.Layer.WMS(
              "Landsat 2000",
              "http://localhost:8080/geoserver/adburbaninfo/wms",
                  {layers: layname, transparent: "true", format: "image/png"},
				  {opacity: opa, isBaseLayer: false}
        );

		layname = 'adburbaninfo:' + 'r_' + code0 
						+ '_' + code1
						+ '_' + code2;
		 			
		vecpol = new OpenLayers.Layer.WMS(
              "Classification",
              "http://localhost:8080/geoserver/adburbaninfo/wms",
                  //{layers: layname, style: "adburbaninfo:polygon_year_color3", transparent: "true", format: "image/png"},
				  {layers: layname, transparent: "true", format: "image/png"},
				  {opacity: opa, isBaseLayer: false}
        );
		
		r2000.setVisibility(false);
		r2005.setVisibility(false);	
		r2010.setVisibility(false);	 
		rpop2015.setVisibility(false);	
        rpop2010.setVisibility(false);
		rpop2020.setVisibility(false);	
        map.addLayers([r2000, r2005, r2010, rpop2010, rpop2015, rpop2020, vecpol, cityVec, city_ext_wfs, osm, google_hybrid, google_physical, google_satellite, google_streets, google_terrain]);
		
		//URL for Ajax request
		layname = 'adburbaninfo:' + 'v_' + code0 
				+ '_' + code1
				+ '_' + code2;
		jsonURL = "../../../geoserver/adburbaninfo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName="+layname+"&outputFormat=json";		
		
		//create extjs store with empty data		
		store = Ext.create('Ext.data.Store',{
			fields : ['name','data1', 'data2', 'data3'],
			data: records,
			paging : false
		});

		Ext.Ajax.request({
			loadMask: true,
			url: jsonURL,
			params: {id: "1"},
			success: function(response, callOptions) {
			    var obj, i, gridcode, area;
				obj = Ext.decode(response.responseText);
				//console.dir(obj);
				//console.log(obj);
				//console.log("Polygon Count = " +obj.features.length);
				for(i=0;i < obj.features.length; i++)
				{
					gridcode = obj.features[i].properties.gridcode;
					area = obj.features[i].properties.AREA;
					switch (gridcode) {
						case 90:
							cnt90++;
							area90+=area;
							break;
						case 100:
							cnt100++;
							area100+=area;
							break;
						case 105:
							cnt105++;
							area105+=area;
							break;
						case 110:
							cnt110++;
							area110+=area;
							break;
					} 
				}
				//Convert the AREA unit from sqm to sqkm
				area90/=1000000;
				area100/=1000000;
				area105/=1000000;
				area110/=1000000;
				//console.log("1990, clusters = "+cnt90+", area = " +area90+", growth = 0");
				//console.log("2000, clusters = "+cnt100+", area = " +area100+", growth = " +area100/(area90+area100)*100);
				//console.log("2005, clusters = "+cnt105+", area = " +area105+", growth = " +area105/(area90+area100+area105)*100);
				//console.log("2010, clusters = "+cnt110+", area = " +area110+", growth = " +area110/(area90+area100+area105+area110)*100);
				records.push({
					name: '1990',
					data1: area90,
					data2: 0,
					data3: cnt90
				});
				records.push({
					name: '2000',
					data1: area90+area100,
					data2: area100/(area90+area100)*100,
					data3: cnt90+cnt100
				});
				records.push({
					name: '2005',
					data1: area90+area100+area105,
					data2: area105/(area90+area100+area105)*100,
					data3: cnt90+cnt100+cnt105
				});
				records.push({
					name: '2010',
					data1: area90+area100+area105+area110,
					data2: area110/(area90+area100+area105+area110)*100,
					data3: cnt90+cnt100+cnt105+cnt110
				});
				store.loadData(records);
			},
			failure: function(response, callOptions) {
			   console.log('server-side failure with status code ' + response.status);
			}
		});		  
		
        mappanel = Ext.create('GeoExt.panel.Map', {
            title: 'Urban Information Sytem',
            map: map
        });
		ChartArea = Ext.create('Ext.chart.Chart', {
			renderTo: Ext.getBody(),
			width: chartWidth,
			height: chartHeight,
			animate: true,
			store: store,
			axes: [
				{
					type: 'Numeric',
					position: 'left',
					fields: 'data1',
					label: {
						renderer: Ext.util.Format.numberRenderer('0,0')
					},
					title: 'Area',
					grid: true
					//minimum: 0
				},
				{
					type: 'Category',
					position: 'bottom',
					fields: ['name'],
					title: 'Year'
				}
			],
			series: [
				{
					type: 'line',
					highlight: {
						size: 7,
						radius: 7
					},
					axis: 'left',
					fill: true,
					xField: 'name',
					yField: 'data1',
					markerConfig: {
						type: 'circle',
						size: 4,
						radius: 4,
						'stroke-width': 0
					}
				}
			]
		});
		
		ChartGrowth = Ext.create('Ext.chart.Chart', {
			renderTo: Ext.getBody(),
			width: chartWidth,
			height: chartHeight,
			animate: true,
			store: store,
			axes: [
				{
					type: 'Numeric',
					position: 'left',
					fields: 'data2',
					label: {
						renderer: Ext.util.Format.numberRenderer('0,0')
					},
					title: 'Growth',
					grid: true,
					minimum: 0
				},
				{
					type: 'Category',
					position: 'bottom',
					fields: ['name'],
					title: 'Year'
				}
			],
			series: [
				{
					type: 'line',
					highlight: {
						size: 7,
						radius: 7
					},
					axis: 'left',
					fill: true,
					xField: 'name',
					yField: 'data2',
					markerConfig: {
						type: 'circle',
						size: 4,
						radius: 4,
						'stroke-width': 0
					}
				}
			]
		});
		ChartCluster = Ext.create('Ext.chart.Chart', {
			renderTo: Ext.getBody(),
			width: chartWidth,
			height: chartHeight,
			animate: true,
			store: store,
			axes: [
				{
					type: 'Numeric',
					position: 'left',
					fields: 'data3',
					label: {
						renderer: Ext.util.Format.numberRenderer('0,0')
					},
					title: 'Cluster',
					grid: true
					//minimum: 0
				},
				{
					type: 'Category',
					position: 'bottom',
					fields: ['name'],
					title: 'Year'
				}
			],
			series: [
				{
					type: 'line',
					highlight: {
						size: 7,
						radius: 7
					},
					axis: 'left',
					fill: true,
					xField: 'name',
					yField: 'data3',
					markerConfig: {
						type: 'circle',
						size: 4,
						radius: 4,
						'stroke-width': 0
					}
				}
			]
		});	

		//Container that holds collapsable panels
        viewport = Ext.create('Ext.container.Viewport', {
            layout: 'border',
            items: [
					{
						region: "center",
						id: "mappanel",            
						xtype: "gx_mappanel",
						map: map,
						stateful: true,
						stateId: 'mappanel',
					}, 
					{
						region: 'north',
						//xtype: "container",
						//height: 20,
						title: 'Urban Information System: ' + cityname,
						//html: '<h1 class="x-panel-header">Bangalore, India</h1>',
						autoHeight: true,
						border: true,
						margins: '0 0 3 0',
						//height:30,
						//width:200,
						//items: [{xtype: 'combobox', width: 180, border: true,}]
						
					},
					{
						region: 'east',
						title: 'Statistical Information',
						collapsible: true,
						//collapsed: true,
						//split: true,
						width: 300,
						autoScroll: true,
						padding: 5,
						items: [ChartArea, ChartGrowth, ChartCluster]
					},
					{
					    xtype: "gx_legendpanel",
						region: "west",
						title: 'Legend',
						width: 200,
						autoScroll: true,
						padding: 5,
						collapsible: true,
					}]
        });
		
		//Function that parse id_0, id_1 and id_2 values
		function getParameterByName(name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
			return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		}
    }
});

