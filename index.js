#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');
const log = require('./logger');
const jwt = require('jsonwebtoken');
const get = require('lodash.get');

const generateAccessToken = function(payload, secret, expiration) {
    const token = jwt.sign(payload, secret, {
        expiresIn: expiration
    });

    return token;
};

// Get secret key from the config file and generate an access token
const getUserHome = function() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

module.exports = function(options, callback) {
    options = options || {};
    options.secret = get(options, 'secret', process.env['CNCJS_SECRET']);
    options.baudrate = get(options, 'baudrate', 115200);
    options.socketAddress = get(options, 'socketAddress', 'localhost');
    options.socketPort = get(options, 'socketPort', 8000);
    options.controllerType = get(options, 'controllerType', 'Marlin');
    options.accessTokenLifetime = get(options, 'accessTokenLifetime', '30d');

    if (!options.secret) {
        const cncrc = path.resolve(getUserHome(), '.cncrc');
        try {
            const config = JSON.parse(fs.readFileSync(cncrc, 'utf8'));
            options.secret = config.secret;
            log.info('Secret read from ' + cncrc);
        } catch (err) {
            log.error('Cannot read secret from ' + cncrc + ' (HOME=' + getUserHome() + '): ' + err.message);
            log.error('Pass it with CNCJS_SECRET or make sure ~/.cncrc exists for the current user (with sudo use "sudo -E").');
            process.exit(1);
        }
    } else {
        log.info('Secret provided by option/environment');
    }

    const token = generateAccessToken({ id: '', name: 'cncjs-pendant' }, options.secret, options.accessTokenLifetime);
    const url = 'ws://' + options.socketAddress + ':' + options.socketPort;

    log.info('Connecting to cncjs at ' + url + ' (controller: ' + options.controllerType + ', port: ' + options.port + ', baudrate: ' + options.baudrate + ')');

    socket = io.connect(url, {
        'query': 'token=' + token
    });

    // Log every incoming event (socket.io-client 1.x has no onAny)
    const onevent = socket.onevent;
    socket.onevent = function(packet) {
        const args = (packet && packet.data) || [];
        if (!/^(serialport:(read|write)|(Grbl|Smoothie|TinyG|Marlin):(state|settings)|sender:status)$/.test(args[0])) {
            log.debug('event: ' + JSON.stringify(args).slice(0, 300));
        }
        return onevent.call(this, packet);
    };

    let portOpened = false;

    socket.on('connect', () => {
        log.info('Connected to ' + url);

        // Open port
        log.info('Opening serial port "' + options.port + '"...');
        socket.emit('open', options.port, {
            baudrate: Number(options.baudrate),
            controllerType: options.controllerType
        });

        setTimeout(() => {
            if (!portOpened) {
                log.warn('No answer from cncjs 10s after "open ' + options.port + '". Possible causes: the port is already open in cncjs (close it from the web UI or use the same baudrate/controller), wrong controller type (--controller-type), or the port does not exist.');
            }
        }, 10000);
    });

    socket.on('connect_error', (err) => {
        log.error('Cannot connect to ' + url + ': ' + ((err && err.message) || err) + ' (is cncjs running? is the secret correct?)');
    });

    socket.on('connect_timeout', () => {
        log.error('Connection to ' + url + ' timed out');
    });

    socket.on('reconnect_attempt', (attempt) => {
        log.warn('Reconnecting to ' + url + ' (attempt ' + attempt + ')');
    });

    socket.on('error', (err) => {
        log.error('Socket error: ' + ((err && err.message) || err));
    });

    socket.on('disconnect', (reason) => {
        log.warn('Disconnected from ' + url + (reason ? ' (' + reason + ')' : ''));
    });

    socket.on('serialport:open', function(data) {
        data = data || {};
        portOpened = true;

        log.info('Serial port "' + data.port + '" open (baud rate: ' + data.baudrate + ')');

        callback(null, socket);
    });

    socket.on('serialport:error', function(data) {
        data = data || {};
        callback(new Error('Error opening serial port "' + (data.port || options.port) + '" (check the port name, its permissions, and that no other program uses it)'));
    });

    socket.on('serialport:read', function(data) {
        log.debug('<< ' + (data || '').trim());
    });

    socket.on('serialport:write', function(data) {
        log.debug('>> ' + (data || '').trim());
    });

};
