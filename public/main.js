// main.js - Simulator application
// Copyright 2023 Padi, Inc. All Rights Reserved.

(function() {

// Constants

const TITLE = 'CNS Simulator';

const HIDE = ['context', 'name', 'profiles'];
const LOCK = ['title', 'comment'];

const TIMEOUT = 10000;

// Local data

var client;

var topics;
var selection;
var forward;

var timer;

// Main entry point
function main() {
  topics = {};

  initialize();
  status();

  connect();
}

// Initialize controls
function initialize() {
  $$('nav a[tab]').forEach((e) => listen(e, 'click', tab));

  $$('button[add]').forEach((e) => listen(e, 'click', add));
  $$('button[name="cancel"]').forEach((e) => listen(e, 'click', cancel));

  $$('section[name="nodes"] ol').forEach((e) => listen(e, 'click', select));
  $$('section[name="nodes"] ul').forEach((e) => listen(e, 'click', select));

  listen('#contexts', 'dblclick', definition);
  listen('#nodes', 'dblclick', definition);
  listen('#profiles', 'dblclick', open);
  listen('#connections', 'dblclick', view);

  listen('dialog[name="context"] button[name="ok"]', 'click', context);
  listen('dialog[name="node"] button[name="ok"]', 'click', node);
  listen('dialog[name="property"] button[name="ok"]', 'click', attach);
  listen('dialog[name="profile"] button[name="ok"]', 'click', profile);
  listen('dialog[name="set"] button[name="ok"]', 'click', set);
  listen('dialog[name="definition"] button[name="ok"]', 'click', republish);

  listen('dialog[name="confirm"] button[name="yes"]', 'click', action);
  listen('dialog[name="confirm"] button[name="no"]', 'click', action);

  $$('dialog').forEach((e) => {if (e.showModal === undefined) hide(e);});
}

// Set status info
function status() {
  text('#version', config.version);
  text('#environment', config.environment);
  text('#started', config.started);
  text('#used', config.used);
  text('#broker', config.host);
  text('#identifier', config.ident);
}

// Connect to broker
function connect() {
  // Construct server uri
  const prot = config.protocol;
  const host = config.host;
  const port = ':' + config.port;

  const uri = prot + '://' + getAuth() + host + port;

  debug('<> messages on ' + host + port);
  debug('<> messages root ' + getTopic());

  debug('connecting...');

  var attempts = 0;

  try {
    // Connect client
    client = mqtt.connect(uri)
    // Connection established
    .on('connect', () => {
      debug('<> messages connect ' + client.options.clientId);

      // First attempt?
      if (attempts++ === 0)
        subscribe('#');

      update();
    })
    // Topic message
    .on('message', (topic, message) => {
      // Get id from topic
      const id = getId(topic);
      debug('>> messages pub ' + id);

      // Remove topic?
      if (message.length === 0)
        delete topics[id];
      else topics[id] = parse(message);

      // Update changes
      update();
    })
    // Server broke connection
    .on('disconnect', () => {
      debug('>< messages disconnect');
    })
    // Server went offline
    .on('offline', () => {
      debug('>< messages offline');
    })
    // Client trying to reconnect
    .on('reconnect', () => {
      debug('<< messages reconnect');
      reconnect();
    })
    // Client closed
    .on('close', () => {
      debug('>< messages close');
    })
    // Client terminated
    .on('end', () => {
      debug('>< messages end');
      client = undefined;
    })
    // Failure
    .on('error', (e) => {
      error('client error: ' + e.message);
    });
  } catch(e) {
    error('connect error: ' + e.message);
  }
}

// Subscribe to topic
function subscribe(id) {
  const topic = getTopic(id);
  debug('<< messages sub ' + id);

  client.subscribe(topic, config.subscribe);
}

// Publish to topic
function publish(id, node) {
  const topic = getTopic(id);
  debug('<< messages pub ' + id);

  const message = (node !== undefined)?stringify(node):'';
  if (message === undefined) return;

  client.publish(topic, message, config.publish);
}

// Reconnecting client
function reconnect() {
  if (timer !== undefined) return;

  timer = setTimeout(() => {
    timer = undefined;

    if (!client.connected) {
      hide('#online');
      show('#offline');
    }
  }, TIMEOUT);
}

// Get server auth
function getAuth() {
  const user = config.user;
  const pass = config.pass;

  if (user === undefined) return '';
  if (pass === undefined) return user + '@';

  return user + ':' + pass + '@';
}

// Get topic from id
function getTopic(id) {
  const path = [];

  const root = config.root || '';
  const ident = config.ident || '';
  const name = id || '';

  if (root !== '') path.push(root);
  if (ident !== '') path.push(ident);
  if (name !== '') path.push(name);

  return path.join('/');
}

// Get id from topic
function getId(topic) {
  const path = topic.split('/');

  const root = config.root || '';
  const ident = config.ident || '';

  if (root !== '') path.shift();
  if (ident !== '') path.shift();

  return path.join('/');
}

// Get context topics
function getContext(context) {
  const match = context + '/';
  const found = [];

  for (const topic in topics) {
    if (topic.startsWith(match))
      found.push(topic);
  }
  return found;
}

// Get node given topic
function getNode(topic) {
  return topics[topic];
}

// Get profile given topic
function getProfile(topic, name, role) {
  const node = getNode(topic);

  if (node !== undefined) {
    for (const profile of node.profiles) {
      if (profile.name === name && profile[role] !== undefined)
        return profile;
    }
  }
}

// Get profile role
function getRole(profile) {
  return (profile.server !== undefined)?'server':'client';
}

// Get opposite role
function getOpposite(role) {
  return (role === 'server')?'client':'server';
}

// Get profile properties
function getProperties(topic, name, role) {
  const profile = getProfile(topic, name, role);
  return (profile === undefined)?{}:(profile.properties || {});
}

// Parse json packet
function parse(packet) {
  try {
    return JSON.parse(packet);
  } catch (e) {
    error('parse error: ' + e.message);
  }
}

// Stringify json packet
function stringify(packet, tabs) {
  try {
    return JSON.stringify(packet, null, tabs);
  } catch (e) {
    error('stringify error: ' + e.message);
  }
}

// Show tab section
function tab(e) {
  const section = attribute(e.target, 'tab');

  // Select new tab
  $$('nav a[tab]').forEach((e) => attribute(e, 'selected', null));
  attribute('nav a[tab="' + section + '"]', 'selected', '');

  // Select new section
  $$('section[name]').forEach((e) => hide(e));
  show('section[name="' + section + '"]');

  // Set page title
  property(document, 'title', text(e.target) + ' - ' + TITLE);
}

// Update nodes view
function update() {
  // Build lists
  const remove = '<button icon>&#x2715;</button>';

  var contexts = '';
  var nodes = '';
  var profiles = '';
  var connections = '';

  const already = [];

  // For each topic
  for (const topic in topics) {
    // Get node
    const data = getNode(topic);

    const context = data.context;
    const name = data.name;
    const scan = data.profiles || [];

    var attr = ' context="' + context + '"';

    // Add context
    if (!already.includes(context)) {
      contexts += '<li' + attr + '>' + context + remove + '</li>';
      already.push(context);
    }

    // Add node
    attr = ' topic="' + topic + '"' + attr + ' node="' + name + '"';
    nodes += '<li' + attr + '>' + name + remove + '</li>';

    // Add profiles
    for (const profile of scan) {
      // Get details
      const name = profile.name;
      const version = profile.version;
      const role = getRole(profile);
      const link = (role === 'server')?profile.server:profile.client;

      const badge = '<span>' + role[0].toUpperCase() + '</span>';

      // Need or use?
      if (link === topic) {
        // Add profile
        const v = (version === undefined)?'':('<i>v' + version + '</i>');
        const a = attr + ' profile="' + name + '" role="' + role + '"';

        profiles += '<li' + a + '>' + badge + name + v + remove + '</li>';
      } else {
        // Add connection
        const data = getNode(link);
        const opposite = getOpposite(role);

        const n = (data === undefined)?('<b>' + link + '</b>'):data.name;
        const a = attr + ' profile="' + name + '" role="' + opposite + '" connection="' + link + '"';

        connections += '<li' + a + '>' + badge + n + '</li>';
      }
    }
  }

  // Set list contents
  html('#contexts', contexts);
  html('#nodes', nodes);
  html('#profiles', profiles);
  html('#connections', connections);

  // Sort lists
  sort('#contexts');
  sort('#nodes');
  sort('#profiles');
  sort('#connections');

  // Filter lists
  filter();

  // Show content
  hide('#offline');
  show('#online');

  // Update export
  text('section[name="export"] textarea', stringify(topics, 2));
}

// Sort list elements
function sort(selector) {
  const list = $(selector);
  var sorting;

  do {
    const items = $$(list, 'li');
    const len = items.length - 1;

    sorting = false;

    for (var n = 0; n < len; n++) {
      const a = items[n];
      const b = items[n + 1];

      if (text(a) > text(b)) {
        list.insertBefore(b, a);
        sorting = true;
        break;
      }
    }
  } while (sorting);
}

// Filter selection
function filter() {
  // Remove current selection
  $$('section[name="nodes"] li[selected]').forEach((e) => attribute(e, 'selected', null));

  // Hide all list items
  $$('#nodes li').forEach((e) => hide(e));
  $$('#profiles li').forEach((e) => hide(e));
  $$('#connections li').forEach((e) => hide(e));

  // Reset properties lists
  text('#heading1', 'Server');
  text('#heading2', 'Client');

  html('#properties', '');
  html('#properties1', '');
  html('#properties2', '');

  // Disable adding
  show('button[add="context"]');
  hide('button[add="node"]');
  hide('button[add="property"]');
  hide('button[add="profile"]');

  // No selection?
  if (selection === undefined) return;

  // Get current selection
  const topic = selection.topic;
  const context = selection.context;
  const node = selection.node;
  const profile = selection.profile;
  const role = selection.role;
  const connection = selection.connection;

  // Select context
  if (context === null) return;

  var addr = '[context="' + context + '"]';
  var items = $$('#contexts li' + addr);

  if (items.length === 0) return;

  items.forEach((e) => attribute(e, 'selected', ''));
  $$('#nodes li' + addr).forEach((e) => show(e));

  // Can add node
  show('button[add="node"]');

  // Select node
  if (topic === null || node === null) return;

  addr = '[topic="' + topic + '"]' + addr + '[node="' + node + '"]';
  items = $$('#nodes li' + addr);

  if (items.length === 0) return;

  items.forEach((e) => attribute(e, 'selected', ''));
  $$('#profiles li' + addr).forEach((e) => show(e));

  // Fill node properties
  var attr = ' topic="' + topic + '" context="' + context + '" node="' + node + '"';
  html('#properties', properties(getNode(topic), attr, HIDE, LOCK));

  // Can add property and profile
  show('button[add="property"]');
  show('button[add="profile"]');

  // Select profile
  if (profile === null || role === null) return;

  addr += '[profile="' + profile + '"][role="' + role + '"]';
  items = $$('#profiles li' + addr);

  if (items.length === 0) return;

  items.forEach((e) => attribute(e, 'selected', ''));
  $$('#connections li' + addr).forEach((e) => show(e));

  // Swap property headers?
  if (role === 'client') {
    text('#heading1', 'Client');
    text('#heading2', 'Server');
  }

  // Fill profile properties
  attr += attr + ' profile="' + profile + '" role="' + role + '"';
  html('#properties1', properties(getProperties(topic, profile, role), attr));

  // Select connection
  if (connection === null) return;

  addr += '[connection="' + connection + '"]';
  items = $$('#connections li' + addr);

  if (items.length === 0) return;

  items.forEach((e) => attribute(e, 'selected', ''));

  // Fill connection properties
  const link = connection.split('/')[1];
  const opposite = getOpposite(role);

  attr = ' topic="' + connection + '" context="' + context + '" node="' + link + '" profile="' + profile + '" role="' + opposite + '"';
  html('#properties2', properties(getProperties(connection, profile, opposite), attr));
}

// List properties
function properties(properties, attr, hide, lock) {
  var list = '';

  for (const name in properties) {
    if (hide === undefined || !hide.includes(name)) {
      const remove = (lock === undefined || lock.includes(name))?'':'<button icon>&#x2715;</button>';
      list += '<li' + (attr || '') + ' property="' + name + '"><h5>' + name + '</h5><p>' + properties[name] + '</p>' + remove + '</li>';
    }
  }
  return list;
}

// Get selection
function getSelection(element) {
  return {
    topic: attribute(element, 'topic'),
    context: attribute(element, 'context'),
    node: attribute(element, 'node'),
    profile: attribute(element, 'profile'),
    role: attribute(element, 'role'),
    connection: attribute(element, 'connection'),
    property: attribute(element, 'property')
  };
}

// Set selection
function setSelection(topic, context, node, profile, role, connection) {
  selection = {
    topic: topic || null,
    context: context || null,
    node: node || null,
    profile: profile || null,
    role: role || null,
    connection: connection || null,
    property: null
  };

  filter();
}

// Called when list item selected
function select(e) {
  // Click what?
  const element = e.target;
  const parent = element.parentElement;

  switch (tag(element)) {
    case 'ul':
    case 'ol':
      // No selection yet?
      if (selection === undefined) break;

      // List click
      switch (element.id) {
        case 'contexts':
          setSelection();
          break;
        case 'nodes':
          setSelection(
            null,
            selection.context);
          break;
        case 'properties':
        case 'profiles':
          setSelection(
            selection.topic,
            selection.context,
            selection.node);
          break;
        case 'properties1':
        case 'connections':
          setSelection(
            selection.topic,
            selection.context,
            selection.node,
            selection.profile,
            selection.role);
          break;
      }
      break;
    case 'li':
      // List item click
      const item = getSelection(element);

      // Modify property?
      if (item.property !== null) {
        modify(item);
        break;
      }

      // Select item
      setSelection(
        item.topic,
        item.context,
        item.node,
        item.profile,
        item.role,
        item.connection);
      break;
    case 'button':
      // Delete button click
      const rem = getSelection(parent);
      const type = typeFor(rem);

      confirm('Remove ' + type, 'Are you sure you want to remove this ' + type + '?')
      // Success
      .then((result) => {
        if (result)
          remove(rem);
      });
      break;
  }
}

// Get type for selection
function typeFor(item) {
  if (item.profile !== null) return 'profile';
  if (item.property !== null) return 'property';
  if (item.node !== null) return 'node';

  return 'context';
}

// Add dialog
function add(e) {
  $$('input[type="text"]').forEach((e) => value(e, ''));
  radio('profile', 'role', 'server');

  dialog(attribute(e.target, 'add'));
}

// Add context
function context() {
  // Get dialog fields
  var comment = input('context', 'comment');
  var title = input('context', 'title');
  var name = input('context', 'name');
  var context = input('context', 'context');

  // Valid fields?
  if (context === null ||
    name === null ||
    title === null ||
    comment === null) return;

  // Adjust fields
  context = context.toLowerCase();
  name = name.toLowerCase();

  // Close dialog
  close('context');

  // Select context
  const item = $('#contexts li[context="' + context + '"]');

  if (item !== null)
    select({target: item});

  // Node exists?
  const topic = context + '/' + name;
  const element = $('#nodes li[topic="' + topic + '"]');

  if (element !== null) {
    // Select node
    select({target: element});
    return;
  }

  // Publish node
  publish(topic, {
    context: context,
    name: name,
    title: title,
    comment: comment
  });

  // Ready selection
  setSelection(
    topic,
    context,
    name);
}

// Add node
function node() {
  // Get dialog fields
  var comment = input('node', 'comment');
  var title = input('node', 'title');
  var name = input('node', 'name');

  // Valid fields?
  if (name === null ||
    title === null ||
    comment === null) return;

  // Adjust fields
  name = name.toLowerCase();

  // Close dialog
  close('node');

  // Node exists?
  const context = selection.context;

  const topic = context + '/' + name;
  const element = $('#nodes li[topic="' + topic + '"]');

  if (element !== null) {
    // Select node
    select({target: element});
    return;
  }

  // Publish node
  publish(topic, {
    context: context,
    name: name,
    title: title,
    comment: comment
  });

  // Ready selection
  setSelection(
    topic,
    context,
    name);
}

// Add propery
function attach() {
  // Get dialog fields
  var value = input('property', 'value');
  var name = input('property', 'name');

  // Valid fields?
  if (name === null ||
    value === null) return;

  // Adjust fields
  name = name.toLowerCase();
  value = fromString(value);

  // Cannot be one of these
  if (HIDE.includes(name)) {
    focus(field('property', 'name'));
    return;
  }

  // Close dialog
  close('property');

  // Add new property
  const context = selection.context;
  const node = selection.node;

  const topic = context + '/' + node;
  const data = getNode(topic);

  data[name] = value;

  // Publish node
  publish(topic, data);
}

// Set value dialog
function modify(item) {
  // Set dialog fields
  const topic = item.topic;
  const profile = item.profile;
  const role = item.role;
  const property = item.property;

  const data = (profile === null)?
    getNode(topic):
    getProperties(topic, profile, role);

  text('dialog[name="set"] h5', property);
  input('set', 'value', toString(data[property]));

  forward = item;

  // Show dialog
  dialog('set');
}

// Set property value
function set(e) {
  // Get dialog fields
  var value = input('set', 'value');

  // Valid fields?
  if (value === null) return;

  // Adjust fields
  value = fromString(value);

  // Close dialog
  close('set');

  // Set new value
  const topic = forward.topic;
  const profile = forward.profile;
  const role = forward.role;
  const property = forward.property;

  const node = getNode(topic);

  const data = (profile === null)?
    node:getProperties(topic, profile, role);

  data[property] = value;

  // Publish node
  publish(topic, node);
}

// Convert data to string
function toString(data) {
  if (data === undefined) return '';
  return (typeof data === 'object')?stringify(data):data.toString();
}

// Convert string to data
function fromString(s) {
  try {
    return JSON.parse(s);
  } catch(e) {}

  return s;
}

// Add profile
function profile() {
  // Get dialog fields
  var role = radio('profile', 'role');
  var version = input('profile', 'version');
  var name = input('profile', 'name');

  // Valid fields?
  if (name === null ||
    version === null ||
    role === null) return;

  // Adjust fields
  name = name.toLowerCase();
  version |= 0;

  // Close dialog
  close('profile');

  // Profile exists?
  const node = selection.node;
  const context = selection.context;

  const topic = context + '/' + node;
  const element = $('#profiles li[topic="' + topic + '"][profile="' + name + '"][role="' + role + '"]');

  if (element !== null) {
    // Select profile
    select({target: element});
    return;
  }

  // Create new profile
  const profile = {
    name: name
  };

  if (version !== 0)
    profile.version = version;

  profile[role] = topic;

  // Add profile to node
  const data = getNode(topic);

  if (data.profiles === undefined)
    data.profiles = [];

  data.profiles.push(profile);

  // Publish node
  publish(topic, data);

  // Ready selection
  setSelection(
    topic,
    context,
    node,
    name,
    role);
}

// Remove node
function remove(item) {
  // Get element fields
  var topic = item.topic;
  var context = item.context;
  var node = item.node;
  var name = item.profile;
  var role = item.role;
  var property = item.property;

  // Get node
  const data = getNode(topic);

  // Remove property?
  if (property !== null) {
    // Remove property from node
    delete data[property];
    publish(topic, data);
  } else if (name !== null) {
    // Remove profile from node
    const profiles = [];

    for (const profile of data.profiles) {
      if (profile.name !== name || profile[role] !== topic)
        profiles.push(profile);
    }

    if (profiles.length === 0)
      delete data.profiles;
    else data.profiles = profiles;

    // Publish node
    publish(topic, data);
  } else {
    // Get context nodes
    const found = getContext(context);

    // Remove context?
    if (node !== null) {
      // Remove node
      publish(topic);

      if (found.length <= 1)
        context = null;
    } else {
      // Publish empty nodes
      for (const topic of found)
        publish(topic);

      context = null;
    }

    topic = null;
    node = null;
  }

  // Ready selection
  setSelection(
    topic,
    context,
    node);
}

// Show node definition
function definition(e) {
  // No selection?
  if (selection === undefined ||
    selection.context === null) return;

  // Set definition text
  var nodes = {};

  if (selection.node === null) {
    for (const topic of getContext(selection.context))
      nodes[topic] = getNode(topic);
  } else nodes = getNode(selection.topic);

  text('dialog[name="definition"] h1', 'Definition for ' + typeFor(selection));
  textarea('definition', 'value', stringify(nodes, 2));

  // Show dialog
  dialog('definition');
}

// Republish definition
function republish() {
  // Get dialog fields
  var text = textarea('definition', 'value');

  // Valid fields?
  if (text === null ||
    text === '') return;

  // Adjust fields
  const node = parse(text);
  if (node === undefined) return;

  // Close dialog
  close('definition');

  // Publish definition
  if (selection.node === null) {
    // Publish context
    for (const topic in node)
      publish(topic, node[topic]);

    // Set selection
    setSelection(
      null,
      selection.context);
    return;
  }

  // Publish node
  const context = node.context;
  const name = node.name;
  const topic = context + '/' + name;

  publish(topic, node);

  // Set selection
  setSelection(
    topic,
    context,
    name);
}

// Open profile item
function open(e) {
  // No selection?
  if (selection === undefined ||
    selection.profile === null) return;

  window.open(config.profiles + '/' + selection.profile);
}

// View connection item
function view(e) {
  // No selection?
  if (selection === undefined ||
    selection.connection === null) return;

  setSelection(
    selection.connection,
    selection.context,
    selection.connection.split('/')[1],
    selection.profile,
    getOpposite(selection.role),
    selection.topic);
}

// Confirmation dialog
function confirm(title, question) {
  return new Promise((resolve, reject) => {
    forward = resolve;

    text('dialog[name="confirm"] h1', title);
    text('dialog[name="confirm"] p', question);

    dialog('confirm');
  });
}

// Confirmation action
function action(e) {
  close('confirm');
  forward(attribute(e.target, 'name') === 'yes');
}

// Show dialog
function dialog(dialog) {
  const element = field(dialog);

  if (element.showModal === undefined) {
    attribute(element, 'active', '');

    show($('div.blocker'));
    show(element);

    const fields = $$(element, 'input[name]');
    if (fields.length > 0) focus(fields[0]);
  } else element.showModal();
}

// Get dialog field
function field(dialog, name) {
  const element = $('dialog[name="' + dialog + '"]');
  return (name !== undefined)?$(element, '[name="' + name + '"]'):element;
}

// Set dialog input
function input(dialog, name, text) {
  const element = field(dialog, name);

  if (text !== undefined || element.checkValidity())
    return value(element, text);

  focus(element);
  return null;
}

// Set dialog textarea
function textarea(dialog, name, text) {
  return value(field(dialog, name), text);
}

// Set dialog radio
function radio(dialog, name, select) {
  const group = $$('dialog[name="' + dialog + '"] [type="radio"][name="' + name + '"]');

  for (const element of group) {
    if (select === undefined) {
      if (property(element, 'checked')) return value(element);
    } else property(element, 'checked', (select === value(element)));
  }
  return null;
}

// Set dialog checkbox
function check(dialog, name, value) {
  return property(field(dialog, name), 'checked', value);
}

// Cancel dialog
function cancel(e) {
  const element = e.target.parentElement.parentElement;
  close(attribute(element, 'name'));
}

// Close dialog
function close(dialog) {
  const element = field(dialog);

  if (element.close === undefined) {
    hide(element);
    hide($('div.blocker'));

    attribute(element, 'active', null);
  } else element.close();
}

// Show element
function show(selector) {
  attribute(selector, 'hidden', null);
}

// Hide element
function hide(selector) {
  attribute(selector, 'hidden', '');
}

// Set element focus
function focus(selector) {
  $(selector).focus();
}

// Create element
function create(tag) {
  return document.createElement(tag);
}

// Append element
function append(parent, element) {
  return $(parent).appendChild(element);
}

// Get element tag
function tag(selector) {
  return property(selector, 'tagName').toLowerCase();
}

// Set element text
function text(selector, value) {
  return property(selector, 'textContent', value);
}

// Set element html
function html(selector, value) {
  return property(selector, 'innerHTML', value);
}

// Set element value
function value(selector, value) {
  return property(selector, 'value', value);
}

// Set element attribute
function attribute(selector, name, value) {
  const element = $(selector);

  if (value !== undefined) {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }
  return element.getAttribute(name);
}

// Set element property
function property(selector, name, value) {
  const element = $(selector);

  if (value !== undefined)
    element[name] = value;

  return element[name];
}

// Attach event handler
function listen(selector, name, handler, options) {
  $(selector).addEventListener(name, handler, options);
}

// Run selector query
function query(parent, selector, all = false) {
  // No parent?
  if (selector === undefined) {
    selector = parent;
    parent = document;
  }

  // Already found?
  if (typeof selector === 'object')
    return selector;

  // Get all?
  return all?
    parent.querySelectorAll(selector):
    parent.querySelector(selector);
}

// Query helper
function $(parent, selector) {
  return query(parent, selector);
}

// Query all helper
function $$(parent, selector) {
  return query(parent, selector, true);
}

// Debug message
function debug(msg) {
  if (config.environment !== 'production')
    console.info(msg);
}

// Error message
function error(msg) {
  console.warn(msg);
}

// Triggered on page load
window.onload = main;

} ());
