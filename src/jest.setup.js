const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = function () {};
