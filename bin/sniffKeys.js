#!/usr/bin/env node

var hid = require("node-hid");

var kbdevent = {
  l_control: 0,
  l_shift: 0,
  l_alt: 0,
  l_meta: 0,
  r_control: 0,
  r_shift: 0,
  r_alt: 0,
  r_meta: 0,
  key: 0, // Normal keys
  extra: 0, // Advanced Keys or Special Keys
  repeating: 0, // If it is repating a movement
  can_repeat: 1, // If can repeat
  move: 1, // Actually move size
  default_move: 1, // Alter by F1, F2, F3
};

const findPath = (interface) =>
  hid
    .devices()
    .find(
      (item) =>
        item.vendorId === 6551 &&
        item.productId === 9267 &&
        item.interface === interface
    ).path;

console.log("Keyboard HID Address:", findPath(0), " & ", findPath(1));
var keyboard_main = new hid.HID(findPath(0));
var keyboard_extra = new hid.HID(findPath(1));

keyboard_main.on("data", function (data) {
    var recv = data.toJSON().data;
    var bits = recv.shift();
    kbdevent.l_control = (bits & 1) !== 0;
    kbdevent.l_shift = (bits & 2) !== 0;
    kbdevent.l_alt = (bits & 4) !== 0;
    kbdevent.l_meta = (bits & 8) !== 0;
    kbdevent.r_control = (bits & 16) !== 0;
    kbdevent.r_shift = (bits & 32) !== 0;
    kbdevent.r_alt = (bits & 64) !== 0;
    kbdevent.r_meta = (bits & 128) !== 0;
    recv.shift();
    kbdevent.key = recv.shift();
    kbdevent.repeating = 0;
    console.log("******* STANDARD KEY PRESSED *******");
    console.log(kbdevent);
  });

  keyboard_extra.on("data", function (data) {
    var recv = data.toJSON().data;
    recv.shift();
    kbdevent.extra = recv.shift();
    kbdevent.repeating = 0;
    console.log("******* EXTRA KEY PRESSED *******");
    console.log(kbdevent);
  });
