"use strict";

// @IMPORTS
const Application = require("neat-base").Application;
const Module = require("neat-base").Module;
const Tools = require("neat-base").Tools;
const path = require("path");
const Promise = require("bluebird");

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
            resolve(this);
        });
    }
}