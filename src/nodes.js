// nodes.js - Nodes service
// Copyright 2021 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const fs = require('fs');

// Constants

const PERSIST_NONE = 0;
const PERSIST_ONEXIT = 1;
const PERSIST_ONCHANGE = 2;

const DEFAULT_FILE = 'persist.json';

// Local data

var master;
var config;

var messages;
var nodes;

// Local functions

// Init service
function init(service, section) {
  // I promise to
  return new Promise((resolve, reject) => {
    // Keep master
    master = service;
    config = section;

    debug('++ nodes service');
    resolve();
  });
}

// Start service
function start() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Get services
    messages = master.find('messages');

    // Load nodes
    nodes = load();
    resolve();
  });
}

// Stop service
function stop() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Save nodes
    save(PERSIST_ONEXIT);
    resolve();
  });
}

// Exit service
function exit() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Destroy objects
    messages = undefined;
    nodes = undefined;

    debug('-- nodes service');
    resolve();
  });
}

// Get all nodes
function getNodes() {
  return nodes;
}

// Get specific node
function getNode(id) {
  return nodes[id] || null;
}

// Set specific node
function setNode(id, node) {
  // Set or remove?
  if (node === undefined)
    delete nodes[id];
  else nodes[id] = node;

  // Persist changes
  save(PERSIST_ONCHANGE);
}

// Set node property
function setProperty(id, node, names, values, profile) {
  // Single set?
  if (!Array.isArray(names)) names = [names];
  if (!Array.isArray(values)) values = [values];

  // Node or profile?
  var properties = node;

  if (profile !== undefined) {
    // Use profile properties
    if (profile.properties === undefined)
      profile.properties = {};

    properties = profile.properties;
  }

  // Update properties
  var change = false;

  for (var len = names.length, n = 0; n < len; n++) {
    const name = names[n];
    const value = values[n];

    // Property changed?
    if (properties[name] !== value) {
      properties[name] = value;
      change = true;
    }
  }

  // Has changed?
  if (change) {
    // Re-publish node
    messages.publish(id, node);
    save(PERSIST_ONCHANGE);
  }
}

// Load nodes from file
function load() {
  // Use input file
  const file = config.in || DEFAULT_FILE;
  debug('>> nodes read ' + file);

  try {
    return parse(fs.readFileSync(file));
  } catch(e) {
    error('read error: ' + e.message);
  }
  return {};
}

// Save nodes to file
function save(level) {
  // Needs persist?
  const persist = (config.persist === undefined)?PERSIST_ONEXIT:config.persist;
  if (persist < level) return;

  // Use output file
  const file = config.out || DEFAULT_FILE;
  debug('<< nodes write ' + file);

  try {
    fs.writeFileSync(file, format(nodes));
  } catch (e) {
    error('write error: ' + e.message);
  }
}

// Parse json packet
function parse(packet) {
  try {
    return JSON.parse(packet);
  } catch (e) {
    error('parse error: ' + e.message);
  }
  return null;
}

// Pretty print json packet
function format(packet) {
  try {
    return JSON.stringify(packet, null, 2);
  } catch (e) {
    error('format error: ' + e.message);
  }
  return null;
}

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

exports.getNodes = getNodes;

exports.getNode = getNode;
exports.setNode = setNode;

exports.setProperty = setProperty;
