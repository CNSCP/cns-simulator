// index.js - Simulator instance
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const service = require('./src/service.js');
const config = require('./config.json');

// Start services

service.start(config, {
  // Command line flags
  flags: [
    ['--host', 'addr', 'Set messages host'],
    ['--port', 'number', 'Set messages port'],
    ['--in', 'file', 'Set node input file'],
    ['--out', 'file', 'Set node output file'],
    ['--persist', 'level', 'Set persist level'],
    ['--nopersist', null, 'Set non-persistant mode'],
    ['--pub', null, 'Set publish only mode'],
    ['--sub', null, 'Set subscribe only mode'],
    ['--localhost', null, 'Set to localhost']
  ],
  // Process flag
  flag: (flag, value) => {
    // What flag?
    switch(flag) {
      case '--host':
        // Set messages host
        service.set('messages', 'host', value);
        break;
      case '--port':
        // Set messages port
        service.set('messages', 'port', value);
        break;
      case '--in':
        // Set node input file
        service.set('nodes', 'in', value);
        break;
      case '--out':
        // Set node output file
        service.set('nodes', 'out', value);
        break;
      case '--persist':
        // Set persist level
        service.set('nodes', 'persist', value);
        break;
      case '--nopersist':
        // Set non-persistant mode
        service.set('nodes', 'persist', 0);
        break;
      case '--pub':
        // Set publish only mode
        service.set('messages', 'sub', false);
        break;
      case '--sub':
        // Set subscribe only mode
        service.set('messages', 'pub', false);
        break;
      case '--localhost':
        // Set to localhost
        service.set('messages', 'protocol', 'ws');
        service.set('messages', 'host', 'localhost');
        service.set('messages', 'port', '1881');

        service.set('server', 'host', 'localhost');
        service.set('server', 'port', '8080');
        break;
    }
  }
});
