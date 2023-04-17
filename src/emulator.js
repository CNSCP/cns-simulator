// emulator.js - Point emulator
// Copyright 2021 Padi, Inc. All Rights Reserved.

'use strict';

// Conversion table

const conversions = {
  '&deg;C':   ['Air temperature', 16, 38],
  '&deg;F':   ['Air temperature', 60, 100],
  'kph':      ['Wind speed', 0, 30],
  'lum':      ['Sunlight level', 200, 800],
  'g/m&sup3;':['Moisture level', 20, 80],
  'm':        ['Contact distance', 0, 10],
  'm/s':      ['Ground speed', 0, 10],
  'm&sup2;':  ['Ground area', 0, 10],
  'm&sup3;':  ['Water consumption', 0, 10],
  'W':        ['Electrical power', 1, 15],
  'kWh':      ['Electrical power', 1, 3],
  'A':        ['Electrical current', 0, 10],
  'mA':       ['Electrical current', 100, 500],
  'V':        ['Electrical voltage', 11.5, 12.5],
  'kV':       ['Electrical voltage', 0, 3],
  'mV':       ['Electrical voltage', 200, 800]
};

// Local functions

function createPoint(id, units) {
  // Get point addr
  var io = 'AI';
  var pin = id || 0;

  if (typeof id === 'string') {
    const s = id.toUpperCase().split(/(\d+)/);

    io = s[0] || io;
    pin = s[1] | 0;
  }

  // Get seed
  const seed = hash(io + pin);

  // Has units?
  if (units === undefined) {
    // No, pick random
    const keys = Object.keys(conversions);
    const index = (rand(seed) * keys.length) | 0;

    units = keys[index];
  }

  // Analog default
  var name = 'Analog ' + pin;
  var type = 'decimal';

  var min = 0;
  var max = 1;

  const convert = conversions[units];

  // What pin type?
  switch (io) {
    case 'DI':
    case 'DO':
      // Digital io
      name = 'Digital ' + pin;
      type = 'boolean';

      units = 'Boolean';
      break;
    case 'AI':
    case 'AO':
      // Analog io
      if (convert !== undefined) {
        name = convert[0];

        min = convert[1];
        max = convert[2];

        if (max - min >= 10)
          type = 'integer';
      }
      break;
  }

  // Create point
  return {
    name: name,
    io: io,
    pin: pin,
    type: type,
    min: min,
    max: max,
    units: units,
    grad: noise(seed)
  };
}

// Get point history
function getHistory(point, len = 10) {
  var history = [];

  for (var n = 0; n < len; n++)
    history.push(getPoint(point, (n - len) * 1000));

  return history;
}

// Get point value
function getPoint(point, time = 0, scale = 0.1, dilation = 0.001) {
  const min = point.min;
  const max = point.max;

  const range = max - min;

  const x = ((Date.now() + time + (point.pin * 3600)) * dilation) | 0;
  const y = min + simplex(x, point.grad, scale, range);

  var value = 0;

  switch (point.type) {
    case 'boolean':
      // Boolean
      value = (y > min + (range * 0.5));
      break;
    case 'integer':
      // Integer
      value = y | 0;
      break;
    case 'decimal':
      // Decimal
      value = Math.round(y * 100) / 100;
      break;
  }
  return value;
}

// Get period in ms
function getPeriod(value = 1000) {
  if (typeof value !== 'string') return value;

  const parts = value.toLowerCase().split(/(\D+)/);
  const millis = parts[0] | 0;

  switch (parts[1]) {
    case 'h':
      // Hours
      return millis * 1000 * 60 * 60;
    case 'm':
      // Minutes
      return millis * 1000 * 60;
    case 's':
      // Seconds
      return millis * 1000;
  }
  return millis;
}

// Simplex noise
function simplex(x, grad, scale, amplitude) {
  const s = x * scale;
  const i = Math.floor(s);
  const f = s - i;
  const n = i % (grad.length - 1);

  return lerp(grad[n], grad[n + 1], f * f * (3 - 2 * f)) * amplitude;
}

// Generate noise
function noise(seed, len = 256) {
  var noise = [];

  for (var n = 0; n < len; n++)
  	noise.push(rand(seed++));

  return noise;
}

// Random number generator
function rand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Hash generator
function hash(value) {
  const len = value.length;
  var h = 1779033703 ^ len;

  for (var n = 0; n < len; n++) {
    h = Math.imul(h ^ value.charCodeAt(n), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return h;
}

// Linear interpolator
function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

// Exports

exports.createPoint = createPoint;

exports.getHistory = getHistory;
exports.getPoint = getPoint;

exports.getPeriod = getPeriod;
