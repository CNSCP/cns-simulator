// emulate.js - Emulator test
// Copyright 2021 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const emulator = require('./src/emulator');

// Output usage?
if (process.argv.length < 3) {
  console.log('\n  Usage: emulate [flags...] id [units]\n');

  console.log('  --history      Display point history');
  console.log('  --repeat       Repeat every second\n');

  process.exit(1);
}

// Get flag
function flag(name) {
  const index = process.argv.indexOf(name);

  if (index !== -1) {
    process.argv.splice(index, 1);
    return true;
  }
  return false;
}

// Get flags
const history = flag('--history');
const repeat = flag('--repeat');

// Create point
const point = emulator.createPoint(
  process.argv[2],
  process.argv[3]);

// Output point data
function update() {
  // Get point data
  const data = history?
    emulator.getHistory(point).join(', '):
    emulator.getPoint(point);

  // Output results
  console.log(point.name + ' (' + point.units + ')' + ' = ' + data);
}

// Set repeat timer?
if (repeat)
  setInterval(update, emulator.getPeriod('1s'));

// Initial output
update();
