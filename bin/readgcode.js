var fs = require("fs");
const mustache = require("mustache");

var view = {
    margin: 20,
    plateThickness: 5,
    offset: -8,
  };

  executeGCode("../gcode/findedge.gcode", view);

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