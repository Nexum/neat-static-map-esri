"use strict";

// @IMPORTS
const Application = require("neat-base").Application;
const Module = require("neat-base").Module;
const Tools = require("neat-base").Tools;
const path = require("path");
const Promise = require("bluebird");
const ArcNode = require('arc-node');
const ArcJSON = require('arcgis-json-objects');

module.exports = class StaticMapEsri extends Module {

    static defaultConfig() {
        return {
            dbModuleName: "database"
        }
    }

    /**
     *
     */
    init() {
        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");
            this.service = new ArcNode();
            resolve(this);
        });
    }

    /**
     *
     *
     * @param lat
     * @param lon
     * @param options
     */
    getMap(lat, lon, options) {
        return new Promise((resolve, reject) => {

            if (!lat || !lon) {
                this.log.debug("No LAT or LON given!");
                return resolve();
            }

            if (!options) {
                options = {};
            }

            if (!options.zoom) {
                options.zoom = "500";
            }
            if (!options.type) {
                options.type = "satellite";
            }
            if (!options.size) {
                options.size = "300x300";
            }
            if (!options.format) {
                options.format = "JPG";
            }

            let size = options.size.split("x");
            let xy = this.lngLatToXY(lat, lon);

            let webmap = ArcJSON.exportableWebmap({
                "mapOptions": {
                    "showAttribution": false,
                    "extent": {
                        "xmin": xy[0] - options.zoom,
                        "ymin": xy[1] - options.zoom,
                        "xmax": xy[0] + options.zoom,
                        "ymax": xy[1] + options.zoom
                    }
                }
            });
            webmap.exportOptions.outputSize = size;
            webmap.operationalLayers[0].url = this.getBasemapService(options.type);

            let requestOptions = {
                webmap: webmap
            };

            return this.service.ExportWebMapTask(requestOptions).then((response) => {
                if (response.error) {
                    this.log.error("Error while generating static maps image " + response.error.toString());
                    return resolve();
                } else {
                    return Application.modules.file.importFromUrl(response.results[0].value.url).then(resolve, reject)
                }
            }, reject);
        });
    }

    /**
     *
     * @param lat
     * @param lon
     * @returns {[*,*]}
     */
    lngLatToXY(lat, lon) {
        let t = 0.017453292519943,
            c = 6378137,
            d;
        89.99999 < lat ? lat = 89.99999 : -89.99999 > lat && (lat = -89.99999);
        d = lat * t;
        return [
            lon * t * c,
            c / 2 * Math.log((1 + Math.sin(d)) / (1 - Math.sin(d)))
        ]
    }

    getBasemapService(type) {
        switch (type) {
            case 'satellite':
                return "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
            case 'topo':
                return "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
            case 'light-gray':
                return "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer";
            case 'dark-gray':
                return "http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer";
            case 'streets':
                return "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer";
            case 'hybrid':
                return "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer";
            case 'oceans':
                return "http://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer";
            case 'national-geographic':
                return "http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer";
            case 'osm':
                return "http://a.tile.openstreetmap.org/";
            default:
                return "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
        }
    }
}