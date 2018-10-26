const { Rectangle, Color, Text } = require("scenegraph");
const $ = sel => document.querySelector(sel);

function createDialog(id = "dialog") {
  const sel = `#${id}`;
  let dialog = document.querySelector(sel);
  if (dialog) {
    console.log("Reusing old dialog");
    return dialog;
  }

  document.body.innerHTML = `
<style>
    ${sel} form {
        width: 300px;
    }
</style>
<dialog id="${id}">
    <form method="dialog">
        <h1>Paste a URL</h1>
        <p>This plugin may take a moment to run, it will extract all the colors from a website and paste in your artboard</p>
        <div>
            <label for="name">Website</span>
            <input uxp-quiet="true" type="text" id="site" name="site" placeholder="https://www.example.com"/>
        </div>
        <footer>
            <button id="cancel">Cancel</button>
            <button type="submit" id="ok" uxp-variant="cta">OK</button>
        </footer>
    </form>
</dialog>
`;

  dialog = document.querySelector(sel);

  const [form, cancel, ok] = [`${sel} form`, "#cancel", "#ok"].map(s => $(s));

  const submit = evt => {
    const site = document.querySelector("#site");
    dialog.close(site.value);
  };

  cancel.addEventListener("click", () => {
    console.log("cancel called");
    dialog.close();
  });

  ok.addEventListener("click", e => {
    console.log("ok called");
    const site = document.querySelector("#site");
    dialog.close(site.value);
    e.preventDefault();
  });
  form.onsubmit = submit;

  return dialog;
}

/**
 * Render color values as both a
 * @param {*} colors
 * @param {*} selection
 */
async function renderColorToSelection(selection, colors) {
  colors.map(({ _rgb: [r, g, b, a] }, idx) => {
    const rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
    console.log("adding color", rgba);

    const newElement = new Rectangle();
    newElement.width = 100;
    newElement.height = 50;
    newElement.fill = new Color(rgba);

    const newTextNode = new Text();
    newTextNode.text = rgba;
    newTextNode.fill = new Color("black");

    // add our nodes
    selection.insertionParent.addChild(newElement);
    selection.insertionParent.addChild(newTextNode);

    // position our elements
    const x = 32;
    const y = 32 + (newElement.height + 16) * idx;

    const xText = x + newElement.width + 16;
    const yText = y + 32;
    newElement.moveInParentCoordinates(x, y);
    newTextNode.moveInParentCoordinates(xText, yText);
  });
}

/**
 * Converts a website to a pallette
 * @param {*} selection
 */
async function siteToPalette(selection, toConvertUrl) {
    if (!toConvertUrl) {
        throw new Error('site required');
    }

  const encodedRequestURI = encodeURIComponent(toConvertUrl);
  const url = `https://localhost:3000/image?url=${encodedRequestURI}`;

  return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }

      throw new Error("unable to read");
    })
    .then(colors => {
      renderColorToSelection(selection, colors);
    })
    .catch(error => {
      console.log("error", error.message);
    });
}

async function menuCommand(selection) {
  const dialog = createDialog();
  return dialog
    .showModal()
    .then(value => {
      if (!value) {
        throw new Error("did not get a modal value" + value);
      }
      return siteToPalette(selection, value);
    })
    .catch(err => {
      console.log("dismissed dialog", err);
    });
}

module.exports = {
  commands: {
    siteToPalette: menuCommand
  }
};
