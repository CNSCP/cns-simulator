// connections.js - Connections service
// Copyright 2021 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const emulator = require('./emulator');

// Local data

var master;
var config;

var nodes;

var monitor;
var timers;

// Local functions

// Init service
function init(service, section) {
  // I promise to
  return new Promise((resolve, reject) => {
    // Keep master
    master = service;
    config = section;

    debug('++ connections service');
    resolve();
  });
}

// Start service
function start() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Get services
    nodes = master.find('nodes');

    monitor = {};
    timers = {};

    resolve();
  });
}

// Stop service
function stop() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Destroy timers
    for (const id in timers)
      clearInterval(timers[id]);

    resolve();
  });
}

// Exit service
function exit() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Destroy objects
    nodes = undefined;

    monitor = undefined;
    timers = undefined;

    debug('-- connections service');
    resolve();
  });
}

// Handle server connection
function server(id, node, server, client) {
  // Server for what?
/*
  switch (server.name) {
    case 'padi.dataset':
      // Dataset
      datasetServer(id, node, server, client);
      break;
    case 'acme.monitor':
      // Monitor
      monitorServer(id, node, server, client);
      break;
    case 'acme.utility':
      // Utility
      utilityServer(id, node, server, client);
      break;
  }*/
}

// Handle client connection
function client(id, node, client, server) {
}

/*
// Handle dataset server
function datasetServer(id, node, server, client) {
  // Get value for each utility
  var values = [];
  var labels = [];

  for (const name in monitor) {
    const utility = monitor[name];

    values.push(utility.value);
    labels.push(capitalize(name) + ' (' + utility.units + ')');
  }

  // Set properties
  nodes.setProperty(id, node,
    ['values', 'labels'],
    [values.join(', '), labels.join(', ')],
    server);
}

// Handle monitor server
function monitorServer(id, node, server, client) {
  // Get value for each utility
  var names = [];
  var values = [];

  for (const name in monitor) {
    const utility = monitor[name];

    names.push(name);
    values.push(utility.value + utility.units);
  }

  // Set properties
  nodes.setProperty(id, node, names, values, server);
}

// Handle utility server
function utilityServer(id, node, server, client) {
  // Already started?
  if (timers[id] !== undefined) return;

  // Check required properties
  const properties = server.properties;

  const point = properties.point;
  const period = properties.period;
  const units = properties.units;

  if (point === undefined) return;

  // Create monitor for utility
  const path = id.split('/');
  const utility = path[path.length - 1];

  monitor[utility] = {
    value: 0,
    units: units
  };

  // Update utility value
  function update() {
    const pt = emulator.createPoint(point, units);
    const value = emulator.getPoint(pt);

    nodes.setProperty(id, node, 'value', value, server);
    monitor[utility].value = value;
  }

  // Set update timer
  const millis = emulator.getPeriod(period);

  if (millis > 0)
    timers[id] = setInterval(update, millis);
  else update();
}
*/

// Caps first letter
/*function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}*/

// Output a message
function print(text) {
  master.print(text);
}

// Output a debug
function debug(text) {
  master.debug(text);
}

// Output an error
function error(text) {
  master.error(text);
}

// Exports

exports.init = init;
exports.start = start;
exports.stop = stop;
exports.exit = exit;

exports.server = server;
exports.client = client;
