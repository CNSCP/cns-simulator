// identity.js - Identity service
// Copyright 2021 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const {v4: uuid} = require('uuid');
const fs = require('fs');

// Local data

var master;
var config;

var identifier;

// Local functions

// Start service
function init(service, section) {
  // I promise to
  return new Promise((resolve, reject) => {
    // Keep master
    master = service;
    config = section;

    debug('++ identity service');
    resolve();
  });
}

// Start service
function start() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Literal in config?
    const id = config.identifier;

    if (id !== undefined) {
      setIdentifier(id);
      resolve();
      return;
    }

    // Persistant in file?
    const file = config.persist;

    ((file !== undefined)?load(file):generate())
    // Success
    .then((result) => {
      setIdentifier(result);
      resolve();
    })
    // Failure
    .catch((e) => {
      reject(e);
    });
  });
}

// Exit service
function exit() {
  // I promise to
  return new Promise((resolve, reject) => {
    debug('-- identity service');
    resolve();
  });
}

// Load identity
function load(file) {
  // I promise to
  return new Promise((resolve, reject) => {
    // Read connection file
    fs.readFile(file, (e, data) => {
      // Read error?
      if (e) {
        // File not found?
        if (e.code === 'ENOENT') {
          // Generate new identifier
          generate()
          // Success
          .then((result) => {
            // Save it
            return save(file, result);
          })
          // Success
          .then((result) => {
            resolve(result);
          })
          // Failure
          .catch((e) => {
            reject(e);
          });
        } else reject(e);
      } else {
        // Parse data
        const result = JSON.parse(data);
        resolve(result.identifier);
      }
    });
  });
}

// Save identity
function save(file, id) {
  // I promise to
  return new Promise((resolve, reject) => {
    // Write identity file
    const data = JSON.stringify({
      identifier: id
    }, null, 2);

    fs.writeFile(file, data, (e) => {
      // File written ok?
      if (e) reject(e);
      else resolve(id);
    });
  });
}

// Generate identifier
function generate() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Get handler
    const handler = master.handlers.identifier;

    switch(typeof handler) {
      case 'string':
        // Literal string
        resolve(handler);
        break;
      case 'function':
        // Call handler
        handler()
        // Success
        .then((result) => {
          resolve(result);
        })
        // Failure
        .catch((e) => {
          reject(e);
        });
        break;
      default:
        // Use uuid
        resolve(uuid());
        break;
    }
  });
}

// Set identifier
function setIdentifier(id) {
  debug('>> identity ' + id);
  identifier = id;
}

// Get identifier
function getIdentifier() {
  return identifier;
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
exports.exit = exit;

exports.setIdentifier = setIdentifier;
exports.getIdentifier = getIdentifier;
