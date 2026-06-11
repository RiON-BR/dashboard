const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'node_modules', '@mui', 'material', 'internal', 'Transition.mjs');

// This string contains a clean ES module default export that returns its children directly, executing them if it's a function
const cleanStubCode = `import * as React from 'react';
export default function Transition(props) {
  if (typeof props.children === 'function') {
    return props.children('entered', {});
  }
  return props.children || null;
}
`;

try {
  fs.writeFileSync(targetPath, cleanStubCode, 'utf8');
  console.log('Successfully injected a clean, zero-animation placeholder!');
} catch (err) {
  console.error('Error writing file:', err.message);
}