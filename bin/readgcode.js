const fs = require("fs");
const path = require('path');
const mustache = require("mustache");

const gcodePath = path.join(__dirname, '../gcode');
console.log(gcodePath);  
var view = {
    margin: 20,
    plateThickness: 5,
    offset: -8,
  };

  executeGCode(path.join(gcodePath, "findedge.gcode"), view);

function executeGCode(file, view) {
    fs.readFile(file, 'utf8', (error, template) => {
      if (error) {
        console.error(error);
        return;
      }
      console.log(template)
      var rendered = mustache.render(template, view);
      console.log(rendered);
      var commands = rendered.split("\n");
      commands.forEach((cmd) =>
        socket.emit("write", options.port, cmd + "\n")
      );
    });
  }
