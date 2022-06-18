"use strict";
/* Copyright (c) 2011-2022 Richard Rodger and other contributors, MIT License. */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate_id = void 0;
const nid_1 = __importDefault(require("nid"));
// function arrayify() {
//   return Array.prototype.slice.call(arguments[0], arguments[1])
// }
// cache nid funcs up to length 64
var nids = [];
function generate_id(msg, reply) {
    var actnid = null == msg ? (0, nid_1.default)({}) : null;
    if (null == actnid) {
        var length = 'object' === typeof msg
            ? parseInt(msg.length, 10) || 6
            : parseInt(msg, 10);
        if (length < 65) {
            actnid = nids[length] || (nids[length] = (0, nid_1.default)({ length: length }));
        }
        else {
            actnid = (0, nid_1.default)({ length: length });
        }
    }
    return reply ? reply(actnid()) : actnid();
}
exports.generate_id = generate_id;
//# sourceMappingURL=common.js.map