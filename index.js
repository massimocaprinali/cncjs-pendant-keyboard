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

    socket.on('connect', () => {
        log.info('Connected to ' + url);

        // Open port
        log.info('Opening serial port "' + options.port + '"...');
        socket.emit('open', options.port, {
            baudrate: Number(options.baudrate),
            controllerType: options.controllerType
        });
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
