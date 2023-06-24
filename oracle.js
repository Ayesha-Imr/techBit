const oracledb = require('oracledb');

let clientOpts = {};
if (process.platform === 'win32') {
  // Windows
  // If you use backslashes in the libDir string, you will
  // need to double them.
  clientOpts = { libDir: 'C:\\oraclexe\\app\\oracle\\instantclient_19_19' };
} else if (process.platform === 'darwin' && process.arch === 'x64') {
  // macOS Intel
  clientOpts = { libDir: process.env.HOME + '/Downloads/instantclient_19_19' };
}
// else on other platforms like Linux the system library search path MUST always be
// set before Node.js is started, for example with ldconfig or LD_LIBRARY_PATH.

// enable node-oracledb Thick mode
oracledb.initOracleClient(clientOpts);
