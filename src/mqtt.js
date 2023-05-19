// mqtt.js - Message service
// Copyright 2021 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const mqtt = require('mqtt');

// Local data

var master;
var config;

var nodes;
var client;

var terminating;

// Local functions

// Init service
function init(service, section) {
  // I promise to
  return new Promise((resolve, reject) => {
    // Keep master
    master = service;
    config = section;

    debug('++ messages service');
    resolve();
  });
}

// Start service
function start() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Get services
    nodes = master.find('nodes');
    resolve();
  });
}

// Run service
function run() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Construct server uri
    const prot = config.protocol || 'ws';
    const host = config.host || 'localhost';
    const port = config.port?(':' + config.port):'';

    const uri = prot + '://' + getAuth() + host + port;

    debug('<> messages on ' + host + port);
    debug('<> messages root ' + getTopic());

    const pub = (config.pub === undefined)?true:config.pub;
    const sub = (config.sub === undefined)?true:config.sub;

    var attempts = 0;

    terminating = false;

    // Connect client
    client = mqtt.connect(uri)
    // Connection established
    .on('connect', () => {
      debug('<> messages connect ' + client.options.clientId);

      // Publish enabled?
      if (pub) publishAll();

      // Subscribe enabled?
      if (sub) {
        // First attempt?
        if (attempts++ === 0)
          subscribe('#');
      } else master.stop();
    })
    // Topic changed
    .on('message', (topic, message, packet) => {
      // Ignore if term
      if (terminating) return;

      // Get id from topic
      const id = getId(topic);
      if (id === null) return;

      // Remove topic?
      if (message.length === 0) {
        debug('>> messages remove ' + topic);
        nodes.setNode(id);
        return;
      }

      // Client publish
      debug('>> messages pub ' + topic);

      // Failed to parse?
      const node = parse(message);
      if (node === null) return;

      // Set node
      nodes.setNode(id, node);
    })
    // Failure
    .on('error', (e) => {
      error('client error: ' + e.message);
    });

    resolve();
  });
}

// Term service
function term() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Stop subscribing
    unsubscribe('#');

    // Now terminating
    terminating = true;

    // Close client
    client.end();

    debug('>< messages closed');
    resolve();
  });
}

// Exit service
function exit() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Destroy objects
    nodes = undefined;
    client = undefined;

    debug('-- messages service');
    resolve();
  });
}

// Get server auth
function getAuth() {
  const user = config.user;
  const pass = config.pass;

  if (user === undefined) return '';
  if (pass === undefined) return user + '@';

  return user + ':' + pass + '@';
}

// Publish all nodes
function publishAll() {
  const items = nodes.getNodes();

  for (const id in items)
    publish(id, items[id]);
}

// Subscribe to node
function subscribe(id) {
  const topic = getTopic(id);
  debug('<< messages sub ' + topic);

  client.subscribe(topic, config.subscribe, (e) => {
    if (e) error('subscribe error: ' + e.message);
  });
}

// Unsubscribe to node
function unsubscribe(id) {
  const topic = getTopic(id);
  debug('<< messages unsub ' + topic);

  client.unsubscribe(topic, (e) => {
    if (e) error('unsubscribe error: ' + e.message);
  });
}

// Publish node
function publish(id, node) {
  const topic = getTopic(id);
  debug('<< messages pub ' + topic);

  const message = (node !== undefined)?stringify(node):'';
  if (message === null) return;

  client.publish(topic, message, config.publish, (e) => {
    if (e) error('publish error: ' + e.message);
  });
}

// Get topic from id
function getTopic(id) {
  const path = [];

  const root = config.root || '';
  const name = id || '';

  if (root !== '') path.push(root);
  if (name !== '') path.push(name);

  return path.join('/');
}

// Get id from topic
function getId(topic) {
  const path = topic.split('/');
  const root = config.root || '';

  // Must be root/context/node
  if ((root !== '' && root !== path.shift()) ||
    path.length !== 2)
    return null;

  return path.join('/');
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

// Stringify json packet
function stringify(packet) {
  try {
    return JSON.stringify(packet);
  } catch (e) {
    error('stringify error: ' + e.message);
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
exports.run = run;
exports.term = term;
exports.exit = exit;

exports.subscribe = subscribe;
exports.publish = publish;
