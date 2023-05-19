// server.js - Server service
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const express = require('express');
const compression = require('compression');

const date = require('./date');

// Exceptions

const E_NOTFOUND = exception(404, 'Not found');

// Constants

const HTML = 'text/html';
const JS = 'text/javascript';

// Local data

var master;
var config;

var app;
var server;

var started = date.now();
var used = date.now();

// Local functions

// Init service
function init(service, section) {
  // I promise to
  return new Promise((resolve, reject) => {
    // Keep master
    master = service;
    config = section;

    // Initialize express
    app = express();

    // Kubernetes health check endpoint
    app.get('/healthz', (req, res) => {
      res.send('Healthy');
    });

    // Request debug?
    if (master.config.output === 'verbose') {
      // Insert wedge
      app.use((req, res, next) => {
        debug('>> server ' + req.method + ' ' + req.path);
        res.on('finish', () => debug('<< server ' + res.statusCode + ' ' + res.statusMessage));

        next();
      });
    }

    // Using compression
    if (config.compress !== undefined)
      app.use(compression());

    // Config request
    app.get('/config.js', (req, res) => getConfig(req, res));

    // Serve public
    const pub = config.public;

    if (pub !== undefined)
      pub.split(',').forEach((root) => app.use(express.static(root)));

    // All other requests
    app.use((req, res) => fail(res, E_NOTFOUND));

    debug('++ server service');
    resolve();
  });
}

// Run service
function run() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Get config
    const host = config.host;
    const port = config.port;

    // Start server
    server = app.listen(port, host, () => {
      debug('<> server on ' + host + ':' + port);
      resolve();
    })
    // Failure
    .on('error', (e) => {
      reject(e);
    });
  });
}

// Term service
function term() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Close server?
    if (server !== undefined) {
      debug('>< server closed');
      server.close();
    }

    resolve();
  });
}

// Exit service
function exit() {
  // I promise to
  return new Promise((resolve, reject) => {
    // Destroy objects
    app = undefined;
    server = undefined;

    debug('-- server service');
    resolve();
  });
}

// Get configuration
function getConfig(req, res) {
  // Get config
  const messages = master.config.messages;
  const profiles = master.config.profiles;

  response(res, 200, 'const config = ' +
    stringify({
      version: master.version(),
      environment: master.environment(),
      profiles: {
        protocol: profiles.protocol || 'http',
        host: profiles.host || 'localhost',
        port: profiles.port || '',
        path: profiles.path || '/profiles'
      },
      broker: {
        protocol: messages.protocol || 'ws',
        host: messages.host || 'localhost',
        port: messages.port || '1881',
        user: messages.user || '',
        pass: messages.pass || '',
        root: messages.root || '',
        subscribe: messages.subscribe || {},
        publish: messages.publish || {}
      },
      started: date.toDateTime(started),
      used: date.toTimeAgo(used),
      status: 'running'
    }) +
  ';', JS);
}

// Send fail response
function fail(res, e) {
  // Must be error
  const status = e.status || 500;
  const internal = (status === 500);

  const message = internal?'Internal error':e.message;

  // Internal error?
  if (internal) {
    error(e.message);
    debug(e.stack);
  }

  // Send error page
  page(res, status, 'Error - CNS Simulator',
    '<nav>' +
      '<h1>CNS Simulator - ' + message + '</h1>' +
    '</nav>' +
    '<section>' +
      '<p>Most likely causes:</p>' +
      '<ul>' +
        '<li>There might be a typing error in the page\'s URL</li>' +
        '<li>The page may have been removed or had its URL changed</li>' +
        '<li>The page may be temporarily offline</li>' +
      '</ul>' +
    '</section>');
}

// Send page response
function page(res, status, title, body, scripts) {
  // Construct page
  response(res, status,
    '<!doctype html>' +
    '<html lang="en">' +
      '<head>' +
        '<meta name="description" content="CNS Simulator">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<link type="text/css" rel="stylesheet" href="/main.css"/>' +
        '<title>' + title + '</title>' +
      '</head>' +
      '<body>' + body + '</body>' +
      (scripts || '') +
    '</html>');
}

// Send response
function response(res, status, body, mime) {
  // Set status and send body
  res.setHeader("Content-Type", mime || HTML);
  res.status(status).send(body);

  used = date.now();
}

// Create exception
function exception(status, message) {
  // Create error with status
  const e = new Error(message);
  e.status = status;

  return e;
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
exports.run = run;
exports.term = term;
exports.exit = exit;
