const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', '@mui', 'material', 'internal', 'Transition.mjs');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Replaces the strict path with the direct file path Webpack is looking for
  if (content.includes("react-transition-group/TransitionGroupContext")) {
    content = content.replace(
      "react-transition-group/TransitionGroupContext",
      "react-transition-group/TransitionGroupContext.js"
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched MUI Transition module!');
  } else {
    console.log('MUI Transition module already patched or modified.');
  }
} else {
  console.error('Could not find the Transition.mjs file. Make sure you are in the Admin folder.');
}