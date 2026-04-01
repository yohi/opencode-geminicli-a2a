"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name14 in all)
    __defProp(target, name14, { get: all[name14], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/node-fetch-native/dist/shared/node-fetch-native.DfbY2q-x.mjs
function f(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var t, o, n;
var init_node_fetch_native_DfbY2q_x = __esm({
  "node_modules/node-fetch-native/dist/shared/node-fetch-native.DfbY2q-x.mjs"() {
    t = Object.defineProperty;
    o = (e, l) => t(e, "name", { value: l, configurable: true });
    n = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
    o(f, "getDefaultExportFromCjs");
  }
});

// node_modules/node-fetch-native/dist/chunks/multipart-parser.mjs
var multipart_parser_exports = {};
__export(multipart_parser_exports, {
  toFormData: () => Z
});
function v(u) {
  const a = u.match(/\bfilename=("(.*?)"|([^()<>@,;:\\"/[\]?={}\s\t]+))($|;\s)/i);
  if (!a) return;
  const n4 = a[2] || a[3] || "";
  let r3 = n4.slice(n4.lastIndexOf("\\") + 1);
  return r3 = r3.replace(/%22/g, '"'), r3 = r3.replace(/&#(\d{4});/g, (d, l) => String.fromCharCode(l)), r3;
}
async function Z(u, a) {
  if (!/multipart/i.test(a)) throw new TypeError("Failed to fetch");
  const n4 = a.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!n4) throw new TypeError("no or bad content-type header, no multipart boundary");
  const r3 = new k(n4[1] || n4[2]);
  let d, l, c2, p2, e, i;
  const A = [], H2 = new br(), O2 = E((s) => {
    c2 += f2.decode(s, { stream: true });
  }, "onPartData"), y = E((s) => {
    A.push(s);
  }, "appendToFile"), o3 = E(() => {
    const s = new qn(A, i, { type: e });
    H2.append(p2, s);
  }, "appendFileToFormData"), L = E(() => {
    H2.append(p2, c2);
  }, "appendEntryToFormData"), f2 = new TextDecoder("utf-8");
  f2.decode(), r3.onPartBegin = function() {
    r3.onPartData = O2, r3.onPartEnd = L, d = "", l = "", c2 = "", p2 = "", e = "", i = null, A.length = 0;
  }, r3.onHeaderField = function(s) {
    d += f2.decode(s, { stream: true });
  }, r3.onHeaderValue = function(s) {
    l += f2.decode(s, { stream: true });
  }, r3.onHeaderEnd = function() {
    if (l += f2.decode(), d = d.toLowerCase(), d === "content-disposition") {
      const s = l.match(/\bname=("([^"]*)"|([^()<>@,;:\\"/[\]?={}\s\t]+))/i);
      s && (p2 = s[2] || s[3] || ""), i = v(l), i && (r3.onPartData = y, r3.onPartEnd = o3);
    } else d === "content-type" && (e = l);
    l = "", d = "";
  };
  for await (const s of u) r3.write(s);
  return r3.end(), H2;
}
var B, E, D, t2, w, R, g, N, x, P, C, I, M, $, m, F, k;
var init_multipart_parser = __esm({
  "node_modules/node-fetch-native/dist/chunks/multipart-parser.mjs"() {
    init_node();
    init_node_fetch_native_DfbY2q_x();
    B = Object.defineProperty;
    E = (u, a) => B(u, "name", { value: a, configurable: true });
    D = 0;
    t2 = { START_BOUNDARY: D++, HEADER_FIELD_START: D++, HEADER_FIELD: D++, HEADER_VALUE_START: D++, HEADER_VALUE: D++, HEADER_VALUE_ALMOST_DONE: D++, HEADERS_ALMOST_DONE: D++, PART_DATA_START: D++, PART_DATA: D++, END: D++ };
    w = 1;
    R = { PART_BOUNDARY: w, LAST_BOUNDARY: w *= 2 };
    g = 10;
    N = 13;
    x = 32;
    P = 45;
    C = 58;
    I = 97;
    M = 122;
    $ = E((u) => u | 32, "lower");
    m = E(() => {
    }, "noop");
    F = class F2 {
      constructor(a) {
        this.index = 0, this.flags = 0, this.onHeaderEnd = m, this.onHeaderField = m, this.onHeadersEnd = m, this.onHeaderValue = m, this.onPartBegin = m, this.onPartData = m, this.onPartEnd = m, this.boundaryChars = {}, a = `\r
--` + a;
        const n4 = new Uint8Array(a.length);
        for (let r3 = 0; r3 < a.length; r3++) n4[r3] = a.charCodeAt(r3), this.boundaryChars[n4[r3]] = true;
        this.boundary = n4, this.lookbehind = new Uint8Array(this.boundary.length + 8), this.state = t2.START_BOUNDARY;
      }
      write(a) {
        let n4 = 0;
        const r3 = a.length;
        let d = this.index, { lookbehind: l, boundary: c2, boundaryChars: p2, index: e, state: i, flags: A } = this;
        const H2 = this.boundary.length, O2 = H2 - 1, y = a.length;
        let o3, L;
        const f2 = E((h2) => {
          this[h2 + "Mark"] = n4;
        }, "mark"), s = E((h2) => {
          delete this[h2 + "Mark"];
        }, "clear"), T2 = E((h2, S, _, U) => {
          (S === void 0 || S !== _) && this[h2](U && U.subarray(S, _));
        }, "callback"), b = E((h2, S) => {
          const _ = h2 + "Mark";
          _ in this && (S ? (T2(h2, this[_], n4, a), delete this[_]) : (T2(h2, this[_], a.length, a), this[_] = 0));
        }, "dataCallback");
        for (n4 = 0; n4 < r3; n4++) switch (o3 = a[n4], i) {
          case t2.START_BOUNDARY:
            if (e === c2.length - 2) {
              if (o3 === P) A |= R.LAST_BOUNDARY;
              else if (o3 !== N) return;
              e++;
              break;
            } else if (e - 1 === c2.length - 2) {
              if (A & R.LAST_BOUNDARY && o3 === P) i = t2.END, A = 0;
              else if (!(A & R.LAST_BOUNDARY) && o3 === g) e = 0, T2("onPartBegin"), i = t2.HEADER_FIELD_START;
              else return;
              break;
            }
            o3 !== c2[e + 2] && (e = -2), o3 === c2[e + 2] && e++;
            break;
          case t2.HEADER_FIELD_START:
            i = t2.HEADER_FIELD, f2("onHeaderField"), e = 0;
          case t2.HEADER_FIELD:
            if (o3 === N) {
              s("onHeaderField"), i = t2.HEADERS_ALMOST_DONE;
              break;
            }
            if (e++, o3 === P) break;
            if (o3 === C) {
              if (e === 1) return;
              b("onHeaderField", true), i = t2.HEADER_VALUE_START;
              break;
            }
            if (L = $(o3), L < I || L > M) return;
            break;
          case t2.HEADER_VALUE_START:
            if (o3 === x) break;
            f2("onHeaderValue"), i = t2.HEADER_VALUE;
          case t2.HEADER_VALUE:
            o3 === N && (b("onHeaderValue", true), T2("onHeaderEnd"), i = t2.HEADER_VALUE_ALMOST_DONE);
            break;
          case t2.HEADER_VALUE_ALMOST_DONE:
            if (o3 !== g) return;
            i = t2.HEADER_FIELD_START;
            break;
          case t2.HEADERS_ALMOST_DONE:
            if (o3 !== g) return;
            T2("onHeadersEnd"), i = t2.PART_DATA_START;
            break;
          case t2.PART_DATA_START:
            i = t2.PART_DATA, f2("onPartData");
          case t2.PART_DATA:
            if (d = e, e === 0) {
              for (n4 += O2; n4 < y && !(a[n4] in p2); ) n4 += H2;
              n4 -= O2, o3 = a[n4];
            }
            if (e < c2.length) c2[e] === o3 ? (e === 0 && b("onPartData", true), e++) : e = 0;
            else if (e === c2.length) e++, o3 === N ? A |= R.PART_BOUNDARY : o3 === P ? A |= R.LAST_BOUNDARY : e = 0;
            else if (e - 1 === c2.length) if (A & R.PART_BOUNDARY) {
              if (e = 0, o3 === g) {
                A &= ~R.PART_BOUNDARY, T2("onPartEnd"), T2("onPartBegin"), i = t2.HEADER_FIELD_START;
                break;
              }
            } else A & R.LAST_BOUNDARY && o3 === P ? (T2("onPartEnd"), i = t2.END, A = 0) : e = 0;
            if (e > 0) l[e - 1] = o3;
            else if (d > 0) {
              const h2 = new Uint8Array(l.buffer, l.byteOffset, l.byteLength);
              T2("onPartData", 0, d, h2), d = 0, f2("onPartData"), n4--;
            }
            break;
          case t2.END:
            break;
          default:
            throw new Error(`Unexpected state entered: ${i}`);
        }
        b("onHeaderField"), b("onHeaderValue"), b("onPartData"), this.index = e, this.state = i, this.flags = A;
      }
      end() {
        if (this.state === t2.HEADER_FIELD_START && this.index === 0 || this.state === t2.PART_DATA && this.index === this.boundary.length) this.onPartEnd();
        else if (this.state !== t2.END) throw new Error("MultipartParser.end(): stream ended unexpectedly");
      }
    };
    E(F, "MultipartParser");
    k = F;
    E(v, "_fileName");
    E(Z, "toFormData");
  }
});

// node_modules/node-fetch-native/dist/node.mjs
function Us(i) {
  if (!/^data:/i.test(i)) throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  i = i.replace(/\r?\n/g, "");
  const o3 = i.indexOf(",");
  if (o3 === -1 || o3 <= 4) throw new TypeError("malformed data: URI");
  const a = i.substring(5, o3).split(";");
  let f2 = "", l = false;
  const p2 = a[0] || "text/plain";
  let h2 = p2;
  for (let A = 1; A < a.length; A++) a[A] === "base64" ? l = true : a[A] && (h2 += `;${a[A]}`, a[A].indexOf("charset=") === 0 && (f2 = a[A].substring(8)));
  !a[0] && !f2.length && (h2 += ";charset=US-ASCII", f2 = "US-ASCII");
  const S = l ? "base64" : "ascii", v2 = unescape(i.substring(o3 + 1)), w2 = Buffer.from(v2, S);
  return w2.type = p2, w2.typeFull = h2, w2.charset = f2, w2;
}
function Ns() {
  return bi || (bi = 1, function(i, o3) {
    (function(a, f2) {
      f2(o3);
    })(xs, function(a) {
      function f2() {
      }
      n2(f2, "noop");
      function l(e) {
        return typeof e == "object" && e !== null || typeof e == "function";
      }
      n2(l, "typeIsObject");
      const p2 = f2;
      function h2(e, t3) {
        try {
          Object.defineProperty(e, "name", { value: t3, configurable: true });
        } catch {
        }
      }
      n2(h2, "setFunctionName");
      const S = Promise, v2 = Promise.prototype.then, w2 = Promise.reject.bind(S);
      function A(e) {
        return new S(e);
      }
      n2(A, "newPromise");
      function T2(e) {
        return A((t3) => t3(e));
      }
      n2(T2, "promiseResolvedWith");
      function b(e) {
        return w2(e);
      }
      n2(b, "promiseRejectedWith");
      function q(e, t3, r3) {
        return v2.call(e, t3, r3);
      }
      n2(q, "PerformPromiseThen");
      function g2(e, t3, r3) {
        q(q(e, t3, r3), void 0, p2);
      }
      n2(g2, "uponPromise");
      function V(e, t3) {
        g2(e, t3);
      }
      n2(V, "uponFulfillment");
      function I2(e, t3) {
        g2(e, void 0, t3);
      }
      n2(I2, "uponRejection");
      function F4(e, t3, r3) {
        return q(e, t3, r3);
      }
      n2(F4, "transformPromiseWith");
      function Q(e) {
        q(e, void 0, p2);
      }
      n2(Q, "setPromiseIsHandledToTrue");
      let ge = n2((e) => {
        if (typeof queueMicrotask == "function") ge = queueMicrotask;
        else {
          const t3 = T2(void 0);
          ge = n2((r3) => q(t3, r3), "_queueMicrotask");
        }
        return ge(e);
      }, "_queueMicrotask");
      function z(e, t3, r3) {
        if (typeof e != "function") throw new TypeError("Argument is not a function");
        return Function.prototype.apply.call(e, t3, r3);
      }
      n2(z, "reflectCall");
      function j(e, t3, r3) {
        try {
          return T2(z(e, t3, r3));
        } catch (s) {
          return b(s);
        }
      }
      n2(j, "promiseCall");
      const U = 16384, bn = class bn {
        constructor() {
          this._cursor = 0, this._size = 0, this._front = { _elements: [], _next: void 0 }, this._back = this._front, this._cursor = 0, this._size = 0;
        }
        get length() {
          return this._size;
        }
        push(t3) {
          const r3 = this._back;
          let s = r3;
          r3._elements.length === U - 1 && (s = { _elements: [], _next: void 0 }), r3._elements.push(t3), s !== r3 && (this._back = s, r3._next = s), ++this._size;
        }
        shift() {
          const t3 = this._front;
          let r3 = t3;
          const s = this._cursor;
          let u = s + 1;
          const c2 = t3._elements, d = c2[s];
          return u === U && (r3 = t3._next, u = 0), --this._size, this._cursor = u, t3 !== r3 && (this._front = r3), c2[s] = void 0, d;
        }
        forEach(t3) {
          let r3 = this._cursor, s = this._front, u = s._elements;
          for (; (r3 !== u.length || s._next !== void 0) && !(r3 === u.length && (s = s._next, u = s._elements, r3 = 0, u.length === 0)); ) t3(u[r3]), ++r3;
        }
        peek() {
          const t3 = this._front, r3 = this._cursor;
          return t3._elements[r3];
        }
      };
      n2(bn, "SimpleQueue");
      let D2 = bn;
      const jt = Symbol("[[AbortSteps]]"), Qn = Symbol("[[ErrorSteps]]"), Ar = Symbol("[[CancelSteps]]"), Br = Symbol("[[PullSteps]]"), kr = Symbol("[[ReleaseSteps]]");
      function Yn(e, t3) {
        e._ownerReadableStream = t3, t3._reader = e, t3._state === "readable" ? qr(e) : t3._state === "closed" ? xi(e) : Gn(e, t3._storedError);
      }
      n2(Yn, "ReadableStreamReaderGenericInitialize");
      function Wr(e, t3) {
        const r3 = e._ownerReadableStream;
        return ie(r3, t3);
      }
      n2(Wr, "ReadableStreamReaderGenericCancel");
      function _e(e) {
        const t3 = e._ownerReadableStream;
        t3._state === "readable" ? Or(e, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")) : Ni(e, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")), t3._readableStreamController[kr](), t3._reader = void 0, e._ownerReadableStream = void 0;
      }
      n2(_e, "ReadableStreamReaderGenericRelease");
      function Lt(e) {
        return new TypeError("Cannot " + e + " a stream using a released reader");
      }
      n2(Lt, "readerLockException");
      function qr(e) {
        e._closedPromise = A((t3, r3) => {
          e._closedPromise_resolve = t3, e._closedPromise_reject = r3;
        });
      }
      n2(qr, "defaultReaderClosedPromiseInitialize");
      function Gn(e, t3) {
        qr(e), Or(e, t3);
      }
      n2(Gn, "defaultReaderClosedPromiseInitializeAsRejected");
      function xi(e) {
        qr(e), Zn(e);
      }
      n2(xi, "defaultReaderClosedPromiseInitializeAsResolved");
      function Or(e, t3) {
        e._closedPromise_reject !== void 0 && (Q(e._closedPromise), e._closedPromise_reject(t3), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0);
      }
      n2(Or, "defaultReaderClosedPromiseReject");
      function Ni(e, t3) {
        Gn(e, t3);
      }
      n2(Ni, "defaultReaderClosedPromiseResetToRejected");
      function Zn(e) {
        e._closedPromise_resolve !== void 0 && (e._closedPromise_resolve(void 0), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0);
      }
      n2(Zn, "defaultReaderClosedPromiseResolve");
      const Kn = Number.isFinite || function(e) {
        return typeof e == "number" && isFinite(e);
      }, Hi = Math.trunc || function(e) {
        return e < 0 ? Math.ceil(e) : Math.floor(e);
      };
      function Vi(e) {
        return typeof e == "object" || typeof e == "function";
      }
      n2(Vi, "isDictionary");
      function ue(e, t3) {
        if (e !== void 0 && !Vi(e)) throw new TypeError(`${t3} is not an object.`);
      }
      n2(ue, "assertDictionary");
      function Z2(e, t3) {
        if (typeof e != "function") throw new TypeError(`${t3} is not a function.`);
      }
      n2(Z2, "assertFunction");
      function Qi(e) {
        return typeof e == "object" && e !== null || typeof e == "function";
      }
      n2(Qi, "isObject");
      function Jn(e, t3) {
        if (!Qi(e)) throw new TypeError(`${t3} is not an object.`);
      }
      n2(Jn, "assertObject");
      function Se(e, t3, r3) {
        if (e === void 0) throw new TypeError(`Parameter ${t3} is required in '${r3}'.`);
      }
      n2(Se, "assertRequiredArgument");
      function zr(e, t3, r3) {
        if (e === void 0) throw new TypeError(`${t3} is required in '${r3}'.`);
      }
      n2(zr, "assertRequiredField");
      function Ir(e) {
        return Number(e);
      }
      n2(Ir, "convertUnrestrictedDouble");
      function Xn(e) {
        return e === 0 ? 0 : e;
      }
      n2(Xn, "censorNegativeZero");
      function Yi(e) {
        return Xn(Hi(e));
      }
      n2(Yi, "integerPart");
      function Fr(e, t3) {
        const s = Number.MAX_SAFE_INTEGER;
        let u = Number(e);
        if (u = Xn(u), !Kn(u)) throw new TypeError(`${t3} is not a finite number`);
        if (u = Yi(u), u < 0 || u > s) throw new TypeError(`${t3} is outside the accepted range of 0 to ${s}, inclusive`);
        return !Kn(u) || u === 0 ? 0 : u;
      }
      n2(Fr, "convertUnsignedLongLongWithEnforceRange");
      function jr(e, t3) {
        if (!We(e)) throw new TypeError(`${t3} is not a ReadableStream.`);
      }
      n2(jr, "assertReadableStream");
      function Qe(e) {
        return new fe(e);
      }
      n2(Qe, "AcquireReadableStreamDefaultReader");
      function eo(e, t3) {
        e._reader._readRequests.push(t3);
      }
      n2(eo, "ReadableStreamAddReadRequest");
      function Lr(e, t3, r3) {
        const u = e._reader._readRequests.shift();
        r3 ? u._closeSteps() : u._chunkSteps(t3);
      }
      n2(Lr, "ReadableStreamFulfillReadRequest");
      function $t(e) {
        return e._reader._readRequests.length;
      }
      n2($t, "ReadableStreamGetNumReadRequests");
      function to(e) {
        const t3 = e._reader;
        return !(t3 === void 0 || !Ee(t3));
      }
      n2(to, "ReadableStreamHasDefaultReader");
      const mn = class mn {
        constructor(t3) {
          if (Se(t3, 1, "ReadableStreamDefaultReader"), jr(t3, "First parameter"), qe(t3)) throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          Yn(this, t3), this._readRequests = new D2();
        }
        get closed() {
          return Ee(this) ? this._closedPromise : b(Dt("closed"));
        }
        cancel(t3 = void 0) {
          return Ee(this) ? this._ownerReadableStream === void 0 ? b(Lt("cancel")) : Wr(this, t3) : b(Dt("cancel"));
        }
        read() {
          if (!Ee(this)) return b(Dt("read"));
          if (this._ownerReadableStream === void 0) return b(Lt("read from"));
          let t3, r3;
          const s = A((c2, d) => {
            t3 = c2, r3 = d;
          });
          return _t(this, { _chunkSteps: n2((c2) => t3({ value: c2, done: false }), "_chunkSteps"), _closeSteps: n2(() => t3({ value: void 0, done: true }), "_closeSteps"), _errorSteps: n2((c2) => r3(c2), "_errorSteps") }), s;
        }
        releaseLock() {
          if (!Ee(this)) throw Dt("releaseLock");
          this._ownerReadableStream !== void 0 && Gi(this);
        }
      };
      n2(mn, "ReadableStreamDefaultReader");
      let fe = mn;
      Object.defineProperties(fe.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), h2(fe.prototype.cancel, "cancel"), h2(fe.prototype.read, "read"), h2(fe.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(fe.prototype, Symbol.toStringTag, { value: "ReadableStreamDefaultReader", configurable: true });
      function Ee(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_readRequests") ? false : e instanceof fe;
      }
      n2(Ee, "IsReadableStreamDefaultReader");
      function _t(e, t3) {
        const r3 = e._ownerReadableStream;
        r3._disturbed = true, r3._state === "closed" ? t3._closeSteps() : r3._state === "errored" ? t3._errorSteps(r3._storedError) : r3._readableStreamController[Br](t3);
      }
      n2(_t, "ReadableStreamDefaultReaderRead");
      function Gi(e) {
        _e(e);
        const t3 = new TypeError("Reader was released");
        ro(e, t3);
      }
      n2(Gi, "ReadableStreamDefaultReaderRelease");
      function ro(e, t3) {
        const r3 = e._readRequests;
        e._readRequests = new D2(), r3.forEach((s) => {
          s._errorSteps(t3);
        });
      }
      n2(ro, "ReadableStreamDefaultReaderErrorReadRequests");
      function Dt(e) {
        return new TypeError(`ReadableStreamDefaultReader.prototype.${e} can only be used on a ReadableStreamDefaultReader`);
      }
      n2(Dt, "defaultReaderBrandCheckException");
      const Zi = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
      }).prototype), yn = class yn {
        constructor(t3, r3) {
          this._ongoingPromise = void 0, this._isFinished = false, this._reader = t3, this._preventCancel = r3;
        }
        next() {
          const t3 = n2(() => this._nextSteps(), "nextSteps");
          return this._ongoingPromise = this._ongoingPromise ? F4(this._ongoingPromise, t3, t3) : t3(), this._ongoingPromise;
        }
        return(t3) {
          const r3 = n2(() => this._returnSteps(t3), "returnSteps");
          return this._ongoingPromise ? F4(this._ongoingPromise, r3, r3) : r3();
        }
        _nextSteps() {
          if (this._isFinished) return Promise.resolve({ value: void 0, done: true });
          const t3 = this._reader;
          let r3, s;
          const u = A((d, m2) => {
            r3 = d, s = m2;
          });
          return _t(t3, { _chunkSteps: n2((d) => {
            this._ongoingPromise = void 0, ge(() => r3({ value: d, done: false }));
          }, "_chunkSteps"), _closeSteps: n2(() => {
            this._ongoingPromise = void 0, this._isFinished = true, _e(t3), r3({ value: void 0, done: true });
          }, "_closeSteps"), _errorSteps: n2((d) => {
            this._ongoingPromise = void 0, this._isFinished = true, _e(t3), s(d);
          }, "_errorSteps") }), u;
        }
        _returnSteps(t3) {
          if (this._isFinished) return Promise.resolve({ value: t3, done: true });
          this._isFinished = true;
          const r3 = this._reader;
          if (!this._preventCancel) {
            const s = Wr(r3, t3);
            return _e(r3), F4(s, () => ({ value: t3, done: true }));
          }
          return _e(r3), T2({ value: t3, done: true });
        }
      };
      n2(yn, "ReadableStreamAsyncIteratorImpl");
      let Mt = yn;
      const no = { next() {
        return oo(this) ? this._asyncIteratorImpl.next() : b(io("next"));
      }, return(e) {
        return oo(this) ? this._asyncIteratorImpl.return(e) : b(io("return"));
      } };
      Object.setPrototypeOf(no, Zi);
      function Ki(e, t3) {
        const r3 = Qe(e), s = new Mt(r3, t3), u = Object.create(no);
        return u._asyncIteratorImpl = s, u;
      }
      n2(Ki, "AcquireReadableStreamAsyncIterator");
      function oo(e) {
        if (!l(e) || !Object.prototype.hasOwnProperty.call(e, "_asyncIteratorImpl")) return false;
        try {
          return e._asyncIteratorImpl instanceof Mt;
        } catch {
          return false;
        }
      }
      n2(oo, "IsReadableStreamAsyncIterator");
      function io(e) {
        return new TypeError(`ReadableStreamAsyncIterator.${e} can only be used on a ReadableSteamAsyncIterator`);
      }
      n2(io, "streamAsyncIteratorBrandCheckException");
      const ao = Number.isNaN || function(e) {
        return e !== e;
      };
      var $r, Dr, Mr;
      function St(e) {
        return e.slice();
      }
      n2(St, "CreateArrayFromList");
      function so(e, t3, r3, s, u) {
        new Uint8Array(e).set(new Uint8Array(r3, s, u), t3);
      }
      n2(so, "CopyDataBlockBytes");
      let we = n2((e) => (typeof e.transfer == "function" ? we = n2((t3) => t3.transfer(), "TransferArrayBuffer") : typeof structuredClone == "function" ? we = n2((t3) => structuredClone(t3, { transfer: [t3] }), "TransferArrayBuffer") : we = n2((t3) => t3, "TransferArrayBuffer"), we(e)), "TransferArrayBuffer"), Ae = n2((e) => (typeof e.detached == "boolean" ? Ae = n2((t3) => t3.detached, "IsDetachedBuffer") : Ae = n2((t3) => t3.byteLength === 0, "IsDetachedBuffer"), Ae(e)), "IsDetachedBuffer");
      function lo(e, t3, r3) {
        if (e.slice) return e.slice(t3, r3);
        const s = r3 - t3, u = new ArrayBuffer(s);
        return so(u, 0, e, t3, s), u;
      }
      n2(lo, "ArrayBufferSlice");
      function Ut(e, t3) {
        const r3 = e[t3];
        if (r3 != null) {
          if (typeof r3 != "function") throw new TypeError(`${String(t3)} is not a function`);
          return r3;
        }
      }
      n2(Ut, "GetMethod");
      function Ji(e) {
        const t3 = { [Symbol.iterator]: () => e.iterator }, r3 = async function* () {
          return yield* t3;
        }(), s = r3.next;
        return { iterator: r3, nextMethod: s, done: false };
      }
      n2(Ji, "CreateAsyncFromSyncIterator");
      const Ur = (Mr = ($r = Symbol.asyncIterator) !== null && $r !== void 0 ? $r : (Dr = Symbol.for) === null || Dr === void 0 ? void 0 : Dr.call(Symbol, "Symbol.asyncIterator")) !== null && Mr !== void 0 ? Mr : "@@asyncIterator";
      function uo(e, t3 = "sync", r3) {
        if (r3 === void 0) if (t3 === "async") {
          if (r3 = Ut(e, Ur), r3 === void 0) {
            const c2 = Ut(e, Symbol.iterator), d = uo(e, "sync", c2);
            return Ji(d);
          }
        } else r3 = Ut(e, Symbol.iterator);
        if (r3 === void 0) throw new TypeError("The object is not iterable");
        const s = z(r3, e, []);
        if (!l(s)) throw new TypeError("The iterator method must return an object");
        const u = s.next;
        return { iterator: s, nextMethod: u, done: false };
      }
      n2(uo, "GetIterator");
      function Xi(e) {
        const t3 = z(e.nextMethod, e.iterator, []);
        if (!l(t3)) throw new TypeError("The iterator.next() method must return an object");
        return t3;
      }
      n2(Xi, "IteratorNext");
      function ea(e) {
        return !!e.done;
      }
      n2(ea, "IteratorComplete");
      function ta(e) {
        return e.value;
      }
      n2(ta, "IteratorValue");
      function ra(e) {
        return !(typeof e != "number" || ao(e) || e < 0);
      }
      n2(ra, "IsNonNegativeNumber");
      function fo(e) {
        const t3 = lo(e.buffer, e.byteOffset, e.byteOffset + e.byteLength);
        return new Uint8Array(t3);
      }
      n2(fo, "CloneAsUint8Array");
      function xr(e) {
        const t3 = e._queue.shift();
        return e._queueTotalSize -= t3.size, e._queueTotalSize < 0 && (e._queueTotalSize = 0), t3.value;
      }
      n2(xr, "DequeueValue");
      function Nr(e, t3, r3) {
        if (!ra(r3) || r3 === 1 / 0) throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
        e._queue.push({ value: t3, size: r3 }), e._queueTotalSize += r3;
      }
      n2(Nr, "EnqueueValueWithSize");
      function na(e) {
        return e._queue.peek().value;
      }
      n2(na, "PeekQueueValue");
      function Be(e) {
        e._queue = new D2(), e._queueTotalSize = 0;
      }
      n2(Be, "ResetQueue");
      function co(e) {
        return e === DataView;
      }
      n2(co, "isDataViewConstructor");
      function oa(e) {
        return co(e.constructor);
      }
      n2(oa, "isDataView");
      function ia(e) {
        return co(e) ? 1 : e.BYTES_PER_ELEMENT;
      }
      n2(ia, "arrayBufferViewElementSize");
      const gn = class gn {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get view() {
          if (!Hr(this)) throw Zr("view");
          return this._view;
        }
        respond(t3) {
          if (!Hr(this)) throw Zr("respond");
          if (Se(t3, 1, "respond"), t3 = Fr(t3, "First parameter"), this._associatedReadableByteStreamController === void 0) throw new TypeError("This BYOB request has been invalidated");
          if (Ae(this._view.buffer)) throw new TypeError("The BYOB request's buffer has been detached and so cannot be used as a response");
          Vt(this._associatedReadableByteStreamController, t3);
        }
        respondWithNewView(t3) {
          if (!Hr(this)) throw Zr("respondWithNewView");
          if (Se(t3, 1, "respondWithNewView"), !ArrayBuffer.isView(t3)) throw new TypeError("You can only respond with array buffer views");
          if (this._associatedReadableByteStreamController === void 0) throw new TypeError("This BYOB request has been invalidated");
          if (Ae(t3.buffer)) throw new TypeError("The given view's buffer has been detached and so cannot be used as a response");
          Qt(this._associatedReadableByteStreamController, t3);
        }
      };
      n2(gn, "ReadableStreamBYOBRequest");
      let Re = gn;
      Object.defineProperties(Re.prototype, { respond: { enumerable: true }, respondWithNewView: { enumerable: true }, view: { enumerable: true } }), h2(Re.prototype.respond, "respond"), h2(Re.prototype.respondWithNewView, "respondWithNewView"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Re.prototype, Symbol.toStringTag, { value: "ReadableStreamBYOBRequest", configurable: true });
      const _n = class _n {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get byobRequest() {
          if (!Ie(this)) throw Rt("byobRequest");
          return Gr(this);
        }
        get desiredSize() {
          if (!Ie(this)) throw Rt("desiredSize");
          return Ro(this);
        }
        close() {
          if (!Ie(this)) throw Rt("close");
          if (this._closeRequested) throw new TypeError("The stream has already been closed; do not close it again!");
          const t3 = this._controlledReadableByteStream._state;
          if (t3 !== "readable") throw new TypeError(`The stream (in ${t3} state) is not in the readable state and cannot be closed`);
          wt(this);
        }
        enqueue(t3) {
          if (!Ie(this)) throw Rt("enqueue");
          if (Se(t3, 1, "enqueue"), !ArrayBuffer.isView(t3)) throw new TypeError("chunk must be an array buffer view");
          if (t3.byteLength === 0) throw new TypeError("chunk must have non-zero byteLength");
          if (t3.buffer.byteLength === 0) throw new TypeError("chunk's buffer must have non-zero byteLength");
          if (this._closeRequested) throw new TypeError("stream is closed or draining");
          const r3 = this._controlledReadableByteStream._state;
          if (r3 !== "readable") throw new TypeError(`The stream (in ${r3} state) is not in the readable state and cannot be enqueued to`);
          Ht(this, t3);
        }
        error(t3 = void 0) {
          if (!Ie(this)) throw Rt("error");
          K(this, t3);
        }
        [Ar](t3) {
          ho(this), Be(this);
          const r3 = this._cancelAlgorithm(t3);
          return Nt(this), r3;
        }
        [Br](t3) {
          const r3 = this._controlledReadableByteStream;
          if (this._queueTotalSize > 0) {
            wo(this, t3);
            return;
          }
          const s = this._autoAllocateChunkSize;
          if (s !== void 0) {
            let u;
            try {
              u = new ArrayBuffer(s);
            } catch (d) {
              t3._errorSteps(d);
              return;
            }
            const c2 = { buffer: u, bufferByteLength: s, byteOffset: 0, byteLength: s, bytesFilled: 0, minimumFill: 1, elementSize: 1, viewConstructor: Uint8Array, readerType: "default" };
            this._pendingPullIntos.push(c2);
          }
          eo(r3, t3), Fe(this);
        }
        [kr]() {
          if (this._pendingPullIntos.length > 0) {
            const t3 = this._pendingPullIntos.peek();
            t3.readerType = "none", this._pendingPullIntos = new D2(), this._pendingPullIntos.push(t3);
          }
        }
      };
      n2(_n, "ReadableByteStreamController");
      let te = _n;
      Object.defineProperties(te.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, byobRequest: { enumerable: true }, desiredSize: { enumerable: true } }), h2(te.prototype.close, "close"), h2(te.prototype.enqueue, "enqueue"), h2(te.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(te.prototype, Symbol.toStringTag, { value: "ReadableByteStreamController", configurable: true });
      function Ie(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledReadableByteStream") ? false : e instanceof te;
      }
      n2(Ie, "IsReadableByteStreamController");
      function Hr(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_associatedReadableByteStreamController") ? false : e instanceof Re;
      }
      n2(Hr, "IsReadableStreamBYOBRequest");
      function Fe(e) {
        if (!fa(e)) return;
        if (e._pulling) {
          e._pullAgain = true;
          return;
        }
        e._pulling = true;
        const r3 = e._pullAlgorithm();
        g2(r3, () => (e._pulling = false, e._pullAgain && (e._pullAgain = false, Fe(e)), null), (s) => (K(e, s), null));
      }
      n2(Fe, "ReadableByteStreamControllerCallPullIfNeeded");
      function ho(e) {
        Qr(e), e._pendingPullIntos = new D2();
      }
      n2(ho, "ReadableByteStreamControllerClearPendingPullIntos");
      function Vr(e, t3) {
        let r3 = false;
        e._state === "closed" && (r3 = true);
        const s = po(t3);
        t3.readerType === "default" ? Lr(e, s, r3) : ma(e, s, r3);
      }
      n2(Vr, "ReadableByteStreamControllerCommitPullIntoDescriptor");
      function po(e) {
        const t3 = e.bytesFilled, r3 = e.elementSize;
        return new e.viewConstructor(e.buffer, e.byteOffset, t3 / r3);
      }
      n2(po, "ReadableByteStreamControllerConvertPullIntoDescriptor");
      function xt(e, t3, r3, s) {
        e._queue.push({ buffer: t3, byteOffset: r3, byteLength: s }), e._queueTotalSize += s;
      }
      n2(xt, "ReadableByteStreamControllerEnqueueChunkToQueue");
      function bo(e, t3, r3, s) {
        let u;
        try {
          u = lo(t3, r3, r3 + s);
        } catch (c2) {
          throw K(e, c2), c2;
        }
        xt(e, u, 0, s);
      }
      n2(bo, "ReadableByteStreamControllerEnqueueClonedChunkToQueue");
      function mo(e, t3) {
        t3.bytesFilled > 0 && bo(e, t3.buffer, t3.byteOffset, t3.bytesFilled), Ye(e);
      }
      n2(mo, "ReadableByteStreamControllerEnqueueDetachedPullIntoToQueue");
      function yo(e, t3) {
        const r3 = Math.min(e._queueTotalSize, t3.byteLength - t3.bytesFilled), s = t3.bytesFilled + r3;
        let u = r3, c2 = false;
        const d = s % t3.elementSize, m2 = s - d;
        m2 >= t3.minimumFill && (u = m2 - t3.bytesFilled, c2 = true);
        const R3 = e._queue;
        for (; u > 0; ) {
          const y = R3.peek(), C2 = Math.min(u, y.byteLength), P2 = t3.byteOffset + t3.bytesFilled;
          so(t3.buffer, P2, y.buffer, y.byteOffset, C2), y.byteLength === C2 ? R3.shift() : (y.byteOffset += C2, y.byteLength -= C2), e._queueTotalSize -= C2, go(e, C2, t3), u -= C2;
        }
        return c2;
      }
      n2(yo, "ReadableByteStreamControllerFillPullIntoDescriptorFromQueue");
      function go(e, t3, r3) {
        r3.bytesFilled += t3;
      }
      n2(go, "ReadableByteStreamControllerFillHeadPullIntoDescriptor");
      function _o(e) {
        e._queueTotalSize === 0 && e._closeRequested ? (Nt(e), At(e._controlledReadableByteStream)) : Fe(e);
      }
      n2(_o, "ReadableByteStreamControllerHandleQueueDrain");
      function Qr(e) {
        e._byobRequest !== null && (e._byobRequest._associatedReadableByteStreamController = void 0, e._byobRequest._view = null, e._byobRequest = null);
      }
      n2(Qr, "ReadableByteStreamControllerInvalidateBYOBRequest");
      function Yr(e) {
        for (; e._pendingPullIntos.length > 0; ) {
          if (e._queueTotalSize === 0) return;
          const t3 = e._pendingPullIntos.peek();
          yo(e, t3) && (Ye(e), Vr(e._controlledReadableByteStream, t3));
        }
      }
      n2(Yr, "ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue");
      function aa(e) {
        const t3 = e._controlledReadableByteStream._reader;
        for (; t3._readRequests.length > 0; ) {
          if (e._queueTotalSize === 0) return;
          const r3 = t3._readRequests.shift();
          wo(e, r3);
        }
      }
      n2(aa, "ReadableByteStreamControllerProcessReadRequestsUsingQueue");
      function sa(e, t3, r3, s) {
        const u = e._controlledReadableByteStream, c2 = t3.constructor, d = ia(c2), { byteOffset: m2, byteLength: R3 } = t3, y = r3 * d;
        let C2;
        try {
          C2 = we(t3.buffer);
        } catch (B2) {
          s._errorSteps(B2);
          return;
        }
        const P2 = { buffer: C2, bufferByteLength: C2.byteLength, byteOffset: m2, byteLength: R3, bytesFilled: 0, minimumFill: y, elementSize: d, viewConstructor: c2, readerType: "byob" };
        if (e._pendingPullIntos.length > 0) {
          e._pendingPullIntos.push(P2), Po(u, s);
          return;
        }
        if (u._state === "closed") {
          const B2 = new c2(P2.buffer, P2.byteOffset, 0);
          s._closeSteps(B2);
          return;
        }
        if (e._queueTotalSize > 0) {
          if (yo(e, P2)) {
            const B2 = po(P2);
            _o(e), s._chunkSteps(B2);
            return;
          }
          if (e._closeRequested) {
            const B2 = new TypeError("Insufficient bytes to fill elements in the given buffer");
            K(e, B2), s._errorSteps(B2);
            return;
          }
        }
        e._pendingPullIntos.push(P2), Po(u, s), Fe(e);
      }
      n2(sa, "ReadableByteStreamControllerPullInto");
      function la(e, t3) {
        t3.readerType === "none" && Ye(e);
        const r3 = e._controlledReadableByteStream;
        if (Kr(r3)) for (; vo(r3) > 0; ) {
          const s = Ye(e);
          Vr(r3, s);
        }
      }
      n2(la, "ReadableByteStreamControllerRespondInClosedState");
      function ua(e, t3, r3) {
        if (go(e, t3, r3), r3.readerType === "none") {
          mo(e, r3), Yr(e);
          return;
        }
        if (r3.bytesFilled < r3.minimumFill) return;
        Ye(e);
        const s = r3.bytesFilled % r3.elementSize;
        if (s > 0) {
          const u = r3.byteOffset + r3.bytesFilled;
          bo(e, r3.buffer, u - s, s);
        }
        r3.bytesFilled -= s, Vr(e._controlledReadableByteStream, r3), Yr(e);
      }
      n2(ua, "ReadableByteStreamControllerRespondInReadableState");
      function So(e, t3) {
        const r3 = e._pendingPullIntos.peek();
        Qr(e), e._controlledReadableByteStream._state === "closed" ? la(e, r3) : ua(e, t3, r3), Fe(e);
      }
      n2(So, "ReadableByteStreamControllerRespondInternal");
      function Ye(e) {
        return e._pendingPullIntos.shift();
      }
      n2(Ye, "ReadableByteStreamControllerShiftPendingPullInto");
      function fa(e) {
        const t3 = e._controlledReadableByteStream;
        return t3._state !== "readable" || e._closeRequested || !e._started ? false : !!(to(t3) && $t(t3) > 0 || Kr(t3) && vo(t3) > 0 || Ro(e) > 0);
      }
      n2(fa, "ReadableByteStreamControllerShouldCallPull");
      function Nt(e) {
        e._pullAlgorithm = void 0, e._cancelAlgorithm = void 0;
      }
      n2(Nt, "ReadableByteStreamControllerClearAlgorithms");
      function wt(e) {
        const t3 = e._controlledReadableByteStream;
        if (!(e._closeRequested || t3._state !== "readable")) {
          if (e._queueTotalSize > 0) {
            e._closeRequested = true;
            return;
          }
          if (e._pendingPullIntos.length > 0) {
            const r3 = e._pendingPullIntos.peek();
            if (r3.bytesFilled % r3.elementSize !== 0) {
              const s = new TypeError("Insufficient bytes to fill elements in the given buffer");
              throw K(e, s), s;
            }
          }
          Nt(e), At(t3);
        }
      }
      n2(wt, "ReadableByteStreamControllerClose");
      function Ht(e, t3) {
        const r3 = e._controlledReadableByteStream;
        if (e._closeRequested || r3._state !== "readable") return;
        const { buffer: s, byteOffset: u, byteLength: c2 } = t3;
        if (Ae(s)) throw new TypeError("chunk's buffer is detached and so cannot be enqueued");
        const d = we(s);
        if (e._pendingPullIntos.length > 0) {
          const m2 = e._pendingPullIntos.peek();
          if (Ae(m2.buffer)) throw new TypeError("The BYOB request's buffer has been detached and so cannot be filled with an enqueued chunk");
          Qr(e), m2.buffer = we(m2.buffer), m2.readerType === "none" && mo(e, m2);
        }
        if (to(r3)) if (aa(e), $t(r3) === 0) xt(e, d, u, c2);
        else {
          e._pendingPullIntos.length > 0 && Ye(e);
          const m2 = new Uint8Array(d, u, c2);
          Lr(r3, m2, false);
        }
        else Kr(r3) ? (xt(e, d, u, c2), Yr(e)) : xt(e, d, u, c2);
        Fe(e);
      }
      n2(Ht, "ReadableByteStreamControllerEnqueue");
      function K(e, t3) {
        const r3 = e._controlledReadableByteStream;
        r3._state === "readable" && (ho(e), Be(e), Nt(e), Zo(r3, t3));
      }
      n2(K, "ReadableByteStreamControllerError");
      function wo(e, t3) {
        const r3 = e._queue.shift();
        e._queueTotalSize -= r3.byteLength, _o(e);
        const s = new Uint8Array(r3.buffer, r3.byteOffset, r3.byteLength);
        t3._chunkSteps(s);
      }
      n2(wo, "ReadableByteStreamControllerFillReadRequestFromQueue");
      function Gr(e) {
        if (e._byobRequest === null && e._pendingPullIntos.length > 0) {
          const t3 = e._pendingPullIntos.peek(), r3 = new Uint8Array(t3.buffer, t3.byteOffset + t3.bytesFilled, t3.byteLength - t3.bytesFilled), s = Object.create(Re.prototype);
          da(s, e, r3), e._byobRequest = s;
        }
        return e._byobRequest;
      }
      n2(Gr, "ReadableByteStreamControllerGetBYOBRequest");
      function Ro(e) {
        const t3 = e._controlledReadableByteStream._state;
        return t3 === "errored" ? null : t3 === "closed" ? 0 : e._strategyHWM - e._queueTotalSize;
      }
      n2(Ro, "ReadableByteStreamControllerGetDesiredSize");
      function Vt(e, t3) {
        const r3 = e._pendingPullIntos.peek();
        if (e._controlledReadableByteStream._state === "closed") {
          if (t3 !== 0) throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
        } else {
          if (t3 === 0) throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
          if (r3.bytesFilled + t3 > r3.byteLength) throw new RangeError("bytesWritten out of range");
        }
        r3.buffer = we(r3.buffer), So(e, t3);
      }
      n2(Vt, "ReadableByteStreamControllerRespond");
      function Qt(e, t3) {
        const r3 = e._pendingPullIntos.peek();
        if (e._controlledReadableByteStream._state === "closed") {
          if (t3.byteLength !== 0) throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
        } else if (t3.byteLength === 0) throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
        if (r3.byteOffset + r3.bytesFilled !== t3.byteOffset) throw new RangeError("The region specified by view does not match byobRequest");
        if (r3.bufferByteLength !== t3.buffer.byteLength) throw new RangeError("The buffer of view has different capacity than byobRequest");
        if (r3.bytesFilled + t3.byteLength > r3.byteLength) throw new RangeError("The region specified by view is larger than byobRequest");
        const u = t3.byteLength;
        r3.buffer = we(t3.buffer), So(e, u);
      }
      n2(Qt, "ReadableByteStreamControllerRespondWithNewView");
      function To(e, t3, r3, s, u, c2, d) {
        t3._controlledReadableByteStream = e, t3._pullAgain = false, t3._pulling = false, t3._byobRequest = null, t3._queue = t3._queueTotalSize = void 0, Be(t3), t3._closeRequested = false, t3._started = false, t3._strategyHWM = c2, t3._pullAlgorithm = s, t3._cancelAlgorithm = u, t3._autoAllocateChunkSize = d, t3._pendingPullIntos = new D2(), e._readableStreamController = t3;
        const m2 = r3();
        g2(T2(m2), () => (t3._started = true, Fe(t3), null), (R3) => (K(t3, R3), null));
      }
      n2(To, "SetUpReadableByteStreamController");
      function ca(e, t3, r3) {
        const s = Object.create(te.prototype);
        let u, c2, d;
        t3.start !== void 0 ? u = n2(() => t3.start(s), "startAlgorithm") : u = n2(() => {
        }, "startAlgorithm"), t3.pull !== void 0 ? c2 = n2(() => t3.pull(s), "pullAlgorithm") : c2 = n2(() => T2(void 0), "pullAlgorithm"), t3.cancel !== void 0 ? d = n2((R3) => t3.cancel(R3), "cancelAlgorithm") : d = n2(() => T2(void 0), "cancelAlgorithm");
        const m2 = t3.autoAllocateChunkSize;
        if (m2 === 0) throw new TypeError("autoAllocateChunkSize must be greater than 0");
        To(e, s, u, c2, d, r3, m2);
      }
      n2(ca, "SetUpReadableByteStreamControllerFromUnderlyingSource");
      function da(e, t3, r3) {
        e._associatedReadableByteStreamController = t3, e._view = r3;
      }
      n2(da, "SetUpReadableStreamBYOBRequest");
      function Zr(e) {
        return new TypeError(`ReadableStreamBYOBRequest.prototype.${e} can only be used on a ReadableStreamBYOBRequest`);
      }
      n2(Zr, "byobRequestBrandCheckException");
      function Rt(e) {
        return new TypeError(`ReadableByteStreamController.prototype.${e} can only be used on a ReadableByteStreamController`);
      }
      n2(Rt, "byteStreamControllerBrandCheckException");
      function ha(e, t3) {
        ue(e, t3);
        const r3 = e?.mode;
        return { mode: r3 === void 0 ? void 0 : pa(r3, `${t3} has member 'mode' that`) };
      }
      n2(ha, "convertReaderOptions");
      function pa(e, t3) {
        if (e = `${e}`, e !== "byob") throw new TypeError(`${t3} '${e}' is not a valid enumeration value for ReadableStreamReaderMode`);
        return e;
      }
      n2(pa, "convertReadableStreamReaderMode");
      function ba(e, t3) {
        var r3;
        ue(e, t3);
        const s = (r3 = e?.min) !== null && r3 !== void 0 ? r3 : 1;
        return { min: Fr(s, `${t3} has member 'min' that`) };
      }
      n2(ba, "convertByobReadOptions");
      function Co(e) {
        return new ce(e);
      }
      n2(Co, "AcquireReadableStreamBYOBReader");
      function Po(e, t3) {
        e._reader._readIntoRequests.push(t3);
      }
      n2(Po, "ReadableStreamAddReadIntoRequest");
      function ma(e, t3, r3) {
        const u = e._reader._readIntoRequests.shift();
        r3 ? u._closeSteps(t3) : u._chunkSteps(t3);
      }
      n2(ma, "ReadableStreamFulfillReadIntoRequest");
      function vo(e) {
        return e._reader._readIntoRequests.length;
      }
      n2(vo, "ReadableStreamGetNumReadIntoRequests");
      function Kr(e) {
        const t3 = e._reader;
        return !(t3 === void 0 || !je(t3));
      }
      n2(Kr, "ReadableStreamHasBYOBReader");
      const Sn = class Sn {
        constructor(t3) {
          if (Se(t3, 1, "ReadableStreamBYOBReader"), jr(t3, "First parameter"), qe(t3)) throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          if (!Ie(t3._readableStreamController)) throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
          Yn(this, t3), this._readIntoRequests = new D2();
        }
        get closed() {
          return je(this) ? this._closedPromise : b(Yt("closed"));
        }
        cancel(t3 = void 0) {
          return je(this) ? this._ownerReadableStream === void 0 ? b(Lt("cancel")) : Wr(this, t3) : b(Yt("cancel"));
        }
        read(t3, r3 = {}) {
          if (!je(this)) return b(Yt("read"));
          if (!ArrayBuffer.isView(t3)) return b(new TypeError("view must be an array buffer view"));
          if (t3.byteLength === 0) return b(new TypeError("view must have non-zero byteLength"));
          if (t3.buffer.byteLength === 0) return b(new TypeError("view's buffer must have non-zero byteLength"));
          if (Ae(t3.buffer)) return b(new TypeError("view's buffer has been detached"));
          let s;
          try {
            s = ba(r3, "options");
          } catch (y) {
            return b(y);
          }
          const u = s.min;
          if (u === 0) return b(new TypeError("options.min must be greater than 0"));
          if (oa(t3)) {
            if (u > t3.byteLength) return b(new RangeError("options.min must be less than or equal to view's byteLength"));
          } else if (u > t3.length) return b(new RangeError("options.min must be less than or equal to view's length"));
          if (this._ownerReadableStream === void 0) return b(Lt("read from"));
          let c2, d;
          const m2 = A((y, C2) => {
            c2 = y, d = C2;
          });
          return Eo(this, t3, u, { _chunkSteps: n2((y) => c2({ value: y, done: false }), "_chunkSteps"), _closeSteps: n2((y) => c2({ value: y, done: true }), "_closeSteps"), _errorSteps: n2((y) => d(y), "_errorSteps") }), m2;
        }
        releaseLock() {
          if (!je(this)) throw Yt("releaseLock");
          this._ownerReadableStream !== void 0 && ya(this);
        }
      };
      n2(Sn, "ReadableStreamBYOBReader");
      let ce = Sn;
      Object.defineProperties(ce.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), h2(ce.prototype.cancel, "cancel"), h2(ce.prototype.read, "read"), h2(ce.prototype.releaseLock, "releaseLock"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ce.prototype, Symbol.toStringTag, { value: "ReadableStreamBYOBReader", configurable: true });
      function je(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_readIntoRequests") ? false : e instanceof ce;
      }
      n2(je, "IsReadableStreamBYOBReader");
      function Eo(e, t3, r3, s) {
        const u = e._ownerReadableStream;
        u._disturbed = true, u._state === "errored" ? s._errorSteps(u._storedError) : sa(u._readableStreamController, t3, r3, s);
      }
      n2(Eo, "ReadableStreamBYOBReaderRead");
      function ya(e) {
        _e(e);
        const t3 = new TypeError("Reader was released");
        Ao(e, t3);
      }
      n2(ya, "ReadableStreamBYOBReaderRelease");
      function Ao(e, t3) {
        const r3 = e._readIntoRequests;
        e._readIntoRequests = new D2(), r3.forEach((s) => {
          s._errorSteps(t3);
        });
      }
      n2(Ao, "ReadableStreamBYOBReaderErrorReadIntoRequests");
      function Yt(e) {
        return new TypeError(`ReadableStreamBYOBReader.prototype.${e} can only be used on a ReadableStreamBYOBReader`);
      }
      n2(Yt, "byobReaderBrandCheckException");
      function Tt(e, t3) {
        const { highWaterMark: r3 } = e;
        if (r3 === void 0) return t3;
        if (ao(r3) || r3 < 0) throw new RangeError("Invalid highWaterMark");
        return r3;
      }
      n2(Tt, "ExtractHighWaterMark");
      function Gt(e) {
        const { size: t3 } = e;
        return t3 || (() => 1);
      }
      n2(Gt, "ExtractSizeAlgorithm");
      function Zt(e, t3) {
        ue(e, t3);
        const r3 = e?.highWaterMark, s = e?.size;
        return { highWaterMark: r3 === void 0 ? void 0 : Ir(r3), size: s === void 0 ? void 0 : ga(s, `${t3} has member 'size' that`) };
      }
      n2(Zt, "convertQueuingStrategy");
      function ga(e, t3) {
        return Z2(e, t3), (r3) => Ir(e(r3));
      }
      n2(ga, "convertQueuingStrategySize");
      function _a15(e, t3) {
        ue(e, t3);
        const r3 = e?.abort, s = e?.close, u = e?.start, c2 = e?.type, d = e?.write;
        return { abort: r3 === void 0 ? void 0 : Sa(r3, e, `${t3} has member 'abort' that`), close: s === void 0 ? void 0 : wa(s, e, `${t3} has member 'close' that`), start: u === void 0 ? void 0 : Ra(u, e, `${t3} has member 'start' that`), write: d === void 0 ? void 0 : Ta(d, e, `${t3} has member 'write' that`), type: c2 };
      }
      n2(_a15, "convertUnderlyingSink");
      function Sa(e, t3, r3) {
        return Z2(e, r3), (s) => j(e, t3, [s]);
      }
      n2(Sa, "convertUnderlyingSinkAbortCallback");
      function wa(e, t3, r3) {
        return Z2(e, r3), () => j(e, t3, []);
      }
      n2(wa, "convertUnderlyingSinkCloseCallback");
      function Ra(e, t3, r3) {
        return Z2(e, r3), (s) => z(e, t3, [s]);
      }
      n2(Ra, "convertUnderlyingSinkStartCallback");
      function Ta(e, t3, r3) {
        return Z2(e, r3), (s, u) => j(e, t3, [s, u]);
      }
      n2(Ta, "convertUnderlyingSinkWriteCallback");
      function Bo(e, t3) {
        if (!Ge(e)) throw new TypeError(`${t3} is not a WritableStream.`);
      }
      n2(Bo, "assertWritableStream");
      function Ca(e) {
        if (typeof e != "object" || e === null) return false;
        try {
          return typeof e.aborted == "boolean";
        } catch {
          return false;
        }
      }
      n2(Ca, "isAbortSignal");
      const Pa = typeof AbortController == "function";
      function va() {
        if (Pa) return new AbortController();
      }
      n2(va, "createAbortController");
      const wn = class wn {
        constructor(t3 = {}, r3 = {}) {
          t3 === void 0 ? t3 = null : Jn(t3, "First parameter");
          const s = Zt(r3, "Second parameter"), u = _a15(t3, "First parameter");
          if (Wo(this), u.type !== void 0) throw new RangeError("Invalid type is specified");
          const d = Gt(s), m2 = Tt(s, 1);
          Da(this, u, m2, d);
        }
        get locked() {
          if (!Ge(this)) throw tr("locked");
          return Ze(this);
        }
        abort(t3 = void 0) {
          return Ge(this) ? Ze(this) ? b(new TypeError("Cannot abort a stream that already has a writer")) : Kt(this, t3) : b(tr("abort"));
        }
        close() {
          return Ge(this) ? Ze(this) ? b(new TypeError("Cannot close a stream that already has a writer")) : he(this) ? b(new TypeError("Cannot close an already-closing stream")) : qo(this) : b(tr("close"));
        }
        getWriter() {
          if (!Ge(this)) throw tr("getWriter");
          return ko(this);
        }
      };
      n2(wn, "WritableStream");
      let de = wn;
      Object.defineProperties(de.prototype, { abort: { enumerable: true }, close: { enumerable: true }, getWriter: { enumerable: true }, locked: { enumerable: true } }), h2(de.prototype.abort, "abort"), h2(de.prototype.close, "close"), h2(de.prototype.getWriter, "getWriter"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(de.prototype, Symbol.toStringTag, { value: "WritableStream", configurable: true });
      function ko(e) {
        return new re(e);
      }
      n2(ko, "AcquireWritableStreamDefaultWriter");
      function Ea(e, t3, r3, s, u = 1, c2 = () => 1) {
        const d = Object.create(de.prototype);
        Wo(d);
        const m2 = Object.create(ke.prototype);
        return Lo(d, m2, e, t3, r3, s, u, c2), d;
      }
      n2(Ea, "CreateWritableStream");
      function Wo(e) {
        e._state = "writable", e._storedError = void 0, e._writer = void 0, e._writableStreamController = void 0, e._writeRequests = new D2(), e._inFlightWriteRequest = void 0, e._closeRequest = void 0, e._inFlightCloseRequest = void 0, e._pendingAbortRequest = void 0, e._backpressure = false;
      }
      n2(Wo, "InitializeWritableStream");
      function Ge(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_writableStreamController") ? false : e instanceof de;
      }
      n2(Ge, "IsWritableStream");
      function Ze(e) {
        return e._writer !== void 0;
      }
      n2(Ze, "IsWritableStreamLocked");
      function Kt(e, t3) {
        var r3;
        if (e._state === "closed" || e._state === "errored") return T2(void 0);
        e._writableStreamController._abortReason = t3, (r3 = e._writableStreamController._abortController) === null || r3 === void 0 || r3.abort(t3);
        const s = e._state;
        if (s === "closed" || s === "errored") return T2(void 0);
        if (e._pendingAbortRequest !== void 0) return e._pendingAbortRequest._promise;
        let u = false;
        s === "erroring" && (u = true, t3 = void 0);
        const c2 = A((d, m2) => {
          e._pendingAbortRequest = { _promise: void 0, _resolve: d, _reject: m2, _reason: t3, _wasAlreadyErroring: u };
        });
        return e._pendingAbortRequest._promise = c2, u || Xr(e, t3), c2;
      }
      n2(Kt, "WritableStreamAbort");
      function qo(e) {
        const t3 = e._state;
        if (t3 === "closed" || t3 === "errored") return b(new TypeError(`The stream (in ${t3} state) is not in the writable state and cannot be closed`));
        const r3 = A((u, c2) => {
          const d = { _resolve: u, _reject: c2 };
          e._closeRequest = d;
        }), s = e._writer;
        return s !== void 0 && e._backpressure && t3 === "writable" && ln(s), Ma(e._writableStreamController), r3;
      }
      n2(qo, "WritableStreamClose");
      function Aa(e) {
        return A((r3, s) => {
          const u = { _resolve: r3, _reject: s };
          e._writeRequests.push(u);
        });
      }
      n2(Aa, "WritableStreamAddWriteRequest");
      function Jr(e, t3) {
        if (e._state === "writable") {
          Xr(e, t3);
          return;
        }
        en(e);
      }
      n2(Jr, "WritableStreamDealWithRejection");
      function Xr(e, t3) {
        const r3 = e._writableStreamController;
        e._state = "erroring", e._storedError = t3;
        const s = e._writer;
        s !== void 0 && zo(s, t3), !Oa(e) && r3._started && en(e);
      }
      n2(Xr, "WritableStreamStartErroring");
      function en(e) {
        e._state = "errored", e._writableStreamController[Qn]();
        const t3 = e._storedError;
        if (e._writeRequests.forEach((u) => {
          u._reject(t3);
        }), e._writeRequests = new D2(), e._pendingAbortRequest === void 0) {
          Jt(e);
          return;
        }
        const r3 = e._pendingAbortRequest;
        if (e._pendingAbortRequest = void 0, r3._wasAlreadyErroring) {
          r3._reject(t3), Jt(e);
          return;
        }
        const s = e._writableStreamController[jt](r3._reason);
        g2(s, () => (r3._resolve(), Jt(e), null), (u) => (r3._reject(u), Jt(e), null));
      }
      n2(en, "WritableStreamFinishErroring");
      function Ba(e) {
        e._inFlightWriteRequest._resolve(void 0), e._inFlightWriteRequest = void 0;
      }
      n2(Ba, "WritableStreamFinishInFlightWrite");
      function ka(e, t3) {
        e._inFlightWriteRequest._reject(t3), e._inFlightWriteRequest = void 0, Jr(e, t3);
      }
      n2(ka, "WritableStreamFinishInFlightWriteWithError");
      function Wa(e) {
        e._inFlightCloseRequest._resolve(void 0), e._inFlightCloseRequest = void 0, e._state === "erroring" && (e._storedError = void 0, e._pendingAbortRequest !== void 0 && (e._pendingAbortRequest._resolve(), e._pendingAbortRequest = void 0)), e._state = "closed";
        const r3 = e._writer;
        r3 !== void 0 && Uo(r3);
      }
      n2(Wa, "WritableStreamFinishInFlightClose");
      function qa(e, t3) {
        e._inFlightCloseRequest._reject(t3), e._inFlightCloseRequest = void 0, e._pendingAbortRequest !== void 0 && (e._pendingAbortRequest._reject(t3), e._pendingAbortRequest = void 0), Jr(e, t3);
      }
      n2(qa, "WritableStreamFinishInFlightCloseWithError");
      function he(e) {
        return !(e._closeRequest === void 0 && e._inFlightCloseRequest === void 0);
      }
      n2(he, "WritableStreamCloseQueuedOrInFlight");
      function Oa(e) {
        return !(e._inFlightWriteRequest === void 0 && e._inFlightCloseRequest === void 0);
      }
      n2(Oa, "WritableStreamHasOperationMarkedInFlight");
      function za(e) {
        e._inFlightCloseRequest = e._closeRequest, e._closeRequest = void 0;
      }
      n2(za, "WritableStreamMarkCloseRequestInFlight");
      function Ia(e) {
        e._inFlightWriteRequest = e._writeRequests.shift();
      }
      n2(Ia, "WritableStreamMarkFirstWriteRequestInFlight");
      function Jt(e) {
        e._closeRequest !== void 0 && (e._closeRequest._reject(e._storedError), e._closeRequest = void 0);
        const t3 = e._writer;
        t3 !== void 0 && an(t3, e._storedError);
      }
      n2(Jt, "WritableStreamRejectCloseAndClosedPromiseIfNeeded");
      function tn(e, t3) {
        const r3 = e._writer;
        r3 !== void 0 && t3 !== e._backpressure && (t3 ? Ya(r3) : ln(r3)), e._backpressure = t3;
      }
      n2(tn, "WritableStreamUpdateBackpressure");
      const Rn = class Rn {
        constructor(t3) {
          if (Se(t3, 1, "WritableStreamDefaultWriter"), Bo(t3, "First parameter"), Ze(t3)) throw new TypeError("This stream has already been locked for exclusive writing by another writer");
          this._ownerWritableStream = t3, t3._writer = this;
          const r3 = t3._state;
          if (r3 === "writable") !he(t3) && t3._backpressure ? nr(this) : xo(this), rr(this);
          else if (r3 === "erroring") sn(this, t3._storedError), rr(this);
          else if (r3 === "closed") xo(this), Va(this);
          else {
            const s = t3._storedError;
            sn(this, s), Mo(this, s);
          }
        }
        get closed() {
          return Le(this) ? this._closedPromise : b($e("closed"));
        }
        get desiredSize() {
          if (!Le(this)) throw $e("desiredSize");
          if (this._ownerWritableStream === void 0) throw Pt("desiredSize");
          return $a(this);
        }
        get ready() {
          return Le(this) ? this._readyPromise : b($e("ready"));
        }
        abort(t3 = void 0) {
          return Le(this) ? this._ownerWritableStream === void 0 ? b(Pt("abort")) : Fa(this, t3) : b($e("abort"));
        }
        close() {
          if (!Le(this)) return b($e("close"));
          const t3 = this._ownerWritableStream;
          return t3 === void 0 ? b(Pt("close")) : he(t3) ? b(new TypeError("Cannot close an already-closing stream")) : Oo(this);
        }
        releaseLock() {
          if (!Le(this)) throw $e("releaseLock");
          this._ownerWritableStream !== void 0 && Io(this);
        }
        write(t3 = void 0) {
          return Le(this) ? this._ownerWritableStream === void 0 ? b(Pt("write to")) : Fo(this, t3) : b($e("write"));
        }
      };
      n2(Rn, "WritableStreamDefaultWriter");
      let re = Rn;
      Object.defineProperties(re.prototype, { abort: { enumerable: true }, close: { enumerable: true }, releaseLock: { enumerable: true }, write: { enumerable: true }, closed: { enumerable: true }, desiredSize: { enumerable: true }, ready: { enumerable: true } }), h2(re.prototype.abort, "abort"), h2(re.prototype.close, "close"), h2(re.prototype.releaseLock, "releaseLock"), h2(re.prototype.write, "write"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(re.prototype, Symbol.toStringTag, { value: "WritableStreamDefaultWriter", configurable: true });
      function Le(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_ownerWritableStream") ? false : e instanceof re;
      }
      n2(Le, "IsWritableStreamDefaultWriter");
      function Fa(e, t3) {
        const r3 = e._ownerWritableStream;
        return Kt(r3, t3);
      }
      n2(Fa, "WritableStreamDefaultWriterAbort");
      function Oo(e) {
        const t3 = e._ownerWritableStream;
        return qo(t3);
      }
      n2(Oo, "WritableStreamDefaultWriterClose");
      function ja(e) {
        const t3 = e._ownerWritableStream, r3 = t3._state;
        return he(t3) || r3 === "closed" ? T2(void 0) : r3 === "errored" ? b(t3._storedError) : Oo(e);
      }
      n2(ja, "WritableStreamDefaultWriterCloseWithErrorPropagation");
      function La(e, t3) {
        e._closedPromiseState === "pending" ? an(e, t3) : Qa(e, t3);
      }
      n2(La, "WritableStreamDefaultWriterEnsureClosedPromiseRejected");
      function zo(e, t3) {
        e._readyPromiseState === "pending" ? No(e, t3) : Ga(e, t3);
      }
      n2(zo, "WritableStreamDefaultWriterEnsureReadyPromiseRejected");
      function $a(e) {
        const t3 = e._ownerWritableStream, r3 = t3._state;
        return r3 === "errored" || r3 === "erroring" ? null : r3 === "closed" ? 0 : $o(t3._writableStreamController);
      }
      n2($a, "WritableStreamDefaultWriterGetDesiredSize");
      function Io(e) {
        const t3 = e._ownerWritableStream, r3 = new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
        zo(e, r3), La(e, r3), t3._writer = void 0, e._ownerWritableStream = void 0;
      }
      n2(Io, "WritableStreamDefaultWriterRelease");
      function Fo(e, t3) {
        const r3 = e._ownerWritableStream, s = r3._writableStreamController, u = Ua(s, t3);
        if (r3 !== e._ownerWritableStream) return b(Pt("write to"));
        const c2 = r3._state;
        if (c2 === "errored") return b(r3._storedError);
        if (he(r3) || c2 === "closed") return b(new TypeError("The stream is closing or closed and cannot be written to"));
        if (c2 === "erroring") return b(r3._storedError);
        const d = Aa(r3);
        return xa(s, t3, u), d;
      }
      n2(Fo, "WritableStreamDefaultWriterWrite");
      const jo = {}, Tn = class Tn {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get abortReason() {
          if (!rn(this)) throw on("abortReason");
          return this._abortReason;
        }
        get signal() {
          if (!rn(this)) throw on("signal");
          if (this._abortController === void 0) throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
          return this._abortController.signal;
        }
        error(t3 = void 0) {
          if (!rn(this)) throw on("error");
          this._controlledWritableStream._state === "writable" && Do(this, t3);
        }
        [jt](t3) {
          const r3 = this._abortAlgorithm(t3);
          return Xt(this), r3;
        }
        [Qn]() {
          Be(this);
        }
      };
      n2(Tn, "WritableStreamDefaultController");
      let ke = Tn;
      Object.defineProperties(ke.prototype, { abortReason: { enumerable: true }, signal: { enumerable: true }, error: { enumerable: true } }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ke.prototype, Symbol.toStringTag, { value: "WritableStreamDefaultController", configurable: true });
      function rn(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledWritableStream") ? false : e instanceof ke;
      }
      n2(rn, "IsWritableStreamDefaultController");
      function Lo(e, t3, r3, s, u, c2, d, m2) {
        t3._controlledWritableStream = e, e._writableStreamController = t3, t3._queue = void 0, t3._queueTotalSize = void 0, Be(t3), t3._abortReason = void 0, t3._abortController = va(), t3._started = false, t3._strategySizeAlgorithm = m2, t3._strategyHWM = d, t3._writeAlgorithm = s, t3._closeAlgorithm = u, t3._abortAlgorithm = c2;
        const R3 = nn(t3);
        tn(e, R3);
        const y = r3(), C2 = T2(y);
        g2(C2, () => (t3._started = true, er(t3), null), (P2) => (t3._started = true, Jr(e, P2), null));
      }
      n2(Lo, "SetUpWritableStreamDefaultController");
      function Da(e, t3, r3, s) {
        const u = Object.create(ke.prototype);
        let c2, d, m2, R3;
        t3.start !== void 0 ? c2 = n2(() => t3.start(u), "startAlgorithm") : c2 = n2(() => {
        }, "startAlgorithm"), t3.write !== void 0 ? d = n2((y) => t3.write(y, u), "writeAlgorithm") : d = n2(() => T2(void 0), "writeAlgorithm"), t3.close !== void 0 ? m2 = n2(() => t3.close(), "closeAlgorithm") : m2 = n2(() => T2(void 0), "closeAlgorithm"), t3.abort !== void 0 ? R3 = n2((y) => t3.abort(y), "abortAlgorithm") : R3 = n2(() => T2(void 0), "abortAlgorithm"), Lo(e, u, c2, d, m2, R3, r3, s);
      }
      n2(Da, "SetUpWritableStreamDefaultControllerFromUnderlyingSink");
      function Xt(e) {
        e._writeAlgorithm = void 0, e._closeAlgorithm = void 0, e._abortAlgorithm = void 0, e._strategySizeAlgorithm = void 0;
      }
      n2(Xt, "WritableStreamDefaultControllerClearAlgorithms");
      function Ma(e) {
        Nr(e, jo, 0), er(e);
      }
      n2(Ma, "WritableStreamDefaultControllerClose");
      function Ua(e, t3) {
        try {
          return e._strategySizeAlgorithm(t3);
        } catch (r3) {
          return Ct(e, r3), 1;
        }
      }
      n2(Ua, "WritableStreamDefaultControllerGetChunkSize");
      function $o(e) {
        return e._strategyHWM - e._queueTotalSize;
      }
      n2($o, "WritableStreamDefaultControllerGetDesiredSize");
      function xa(e, t3, r3) {
        try {
          Nr(e, t3, r3);
        } catch (u) {
          Ct(e, u);
          return;
        }
        const s = e._controlledWritableStream;
        if (!he(s) && s._state === "writable") {
          const u = nn(e);
          tn(s, u);
        }
        er(e);
      }
      n2(xa, "WritableStreamDefaultControllerWrite");
      function er(e) {
        const t3 = e._controlledWritableStream;
        if (!e._started || t3._inFlightWriteRequest !== void 0) return;
        if (t3._state === "erroring") {
          en(t3);
          return;
        }
        if (e._queue.length === 0) return;
        const s = na(e);
        s === jo ? Na(e) : Ha(e, s);
      }
      n2(er, "WritableStreamDefaultControllerAdvanceQueueIfNeeded");
      function Ct(e, t3) {
        e._controlledWritableStream._state === "writable" && Do(e, t3);
      }
      n2(Ct, "WritableStreamDefaultControllerErrorIfNeeded");
      function Na(e) {
        const t3 = e._controlledWritableStream;
        za(t3), xr(e);
        const r3 = e._closeAlgorithm();
        Xt(e), g2(r3, () => (Wa(t3), null), (s) => (qa(t3, s), null));
      }
      n2(Na, "WritableStreamDefaultControllerProcessClose");
      function Ha(e, t3) {
        const r3 = e._controlledWritableStream;
        Ia(r3);
        const s = e._writeAlgorithm(t3);
        g2(s, () => {
          Ba(r3);
          const u = r3._state;
          if (xr(e), !he(r3) && u === "writable") {
            const c2 = nn(e);
            tn(r3, c2);
          }
          return er(e), null;
        }, (u) => (r3._state === "writable" && Xt(e), ka(r3, u), null));
      }
      n2(Ha, "WritableStreamDefaultControllerProcessWrite");
      function nn(e) {
        return $o(e) <= 0;
      }
      n2(nn, "WritableStreamDefaultControllerGetBackpressure");
      function Do(e, t3) {
        const r3 = e._controlledWritableStream;
        Xt(e), Xr(r3, t3);
      }
      n2(Do, "WritableStreamDefaultControllerError");
      function tr(e) {
        return new TypeError(`WritableStream.prototype.${e} can only be used on a WritableStream`);
      }
      n2(tr, "streamBrandCheckException$2");
      function on(e) {
        return new TypeError(`WritableStreamDefaultController.prototype.${e} can only be used on a WritableStreamDefaultController`);
      }
      n2(on, "defaultControllerBrandCheckException$2");
      function $e(e) {
        return new TypeError(`WritableStreamDefaultWriter.prototype.${e} can only be used on a WritableStreamDefaultWriter`);
      }
      n2($e, "defaultWriterBrandCheckException");
      function Pt(e) {
        return new TypeError("Cannot " + e + " a stream using a released writer");
      }
      n2(Pt, "defaultWriterLockException");
      function rr(e) {
        e._closedPromise = A((t3, r3) => {
          e._closedPromise_resolve = t3, e._closedPromise_reject = r3, e._closedPromiseState = "pending";
        });
      }
      n2(rr, "defaultWriterClosedPromiseInitialize");
      function Mo(e, t3) {
        rr(e), an(e, t3);
      }
      n2(Mo, "defaultWriterClosedPromiseInitializeAsRejected");
      function Va(e) {
        rr(e), Uo(e);
      }
      n2(Va, "defaultWriterClosedPromiseInitializeAsResolved");
      function an(e, t3) {
        e._closedPromise_reject !== void 0 && (Q(e._closedPromise), e._closedPromise_reject(t3), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0, e._closedPromiseState = "rejected");
      }
      n2(an, "defaultWriterClosedPromiseReject");
      function Qa(e, t3) {
        Mo(e, t3);
      }
      n2(Qa, "defaultWriterClosedPromiseResetToRejected");
      function Uo(e) {
        e._closedPromise_resolve !== void 0 && (e._closedPromise_resolve(void 0), e._closedPromise_resolve = void 0, e._closedPromise_reject = void 0, e._closedPromiseState = "resolved");
      }
      n2(Uo, "defaultWriterClosedPromiseResolve");
      function nr(e) {
        e._readyPromise = A((t3, r3) => {
          e._readyPromise_resolve = t3, e._readyPromise_reject = r3;
        }), e._readyPromiseState = "pending";
      }
      n2(nr, "defaultWriterReadyPromiseInitialize");
      function sn(e, t3) {
        nr(e), No(e, t3);
      }
      n2(sn, "defaultWriterReadyPromiseInitializeAsRejected");
      function xo(e) {
        nr(e), ln(e);
      }
      n2(xo, "defaultWriterReadyPromiseInitializeAsResolved");
      function No(e, t3) {
        e._readyPromise_reject !== void 0 && (Q(e._readyPromise), e._readyPromise_reject(t3), e._readyPromise_resolve = void 0, e._readyPromise_reject = void 0, e._readyPromiseState = "rejected");
      }
      n2(No, "defaultWriterReadyPromiseReject");
      function Ya(e) {
        nr(e);
      }
      n2(Ya, "defaultWriterReadyPromiseReset");
      function Ga(e, t3) {
        sn(e, t3);
      }
      n2(Ga, "defaultWriterReadyPromiseResetToRejected");
      function ln(e) {
        e._readyPromise_resolve !== void 0 && (e._readyPromise_resolve(void 0), e._readyPromise_resolve = void 0, e._readyPromise_reject = void 0, e._readyPromiseState = "fulfilled");
      }
      n2(ln, "defaultWriterReadyPromiseResolve");
      function Za() {
        if (typeof globalThis < "u") return globalThis;
        if (typeof self < "u") return self;
        if (typeof n < "u") return n;
      }
      n2(Za, "getGlobals");
      const un = Za();
      function Ka(e) {
        if (!(typeof e == "function" || typeof e == "object") || e.name !== "DOMException") return false;
        try {
          return new e(), true;
        } catch {
          return false;
        }
      }
      n2(Ka, "isDOMExceptionConstructor");
      function Ja() {
        const e = un?.DOMException;
        return Ka(e) ? e : void 0;
      }
      n2(Ja, "getFromGlobal");
      function Xa() {
        const e = n2(function(r3, s) {
          this.message = r3 || "", this.name = s || "Error", Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
        }, "DOMException");
        return h2(e, "DOMException"), e.prototype = Object.create(Error.prototype), Object.defineProperty(e.prototype, "constructor", { value: e, writable: true, configurable: true }), e;
      }
      n2(Xa, "createPolyfill");
      const es = Ja() || Xa();
      function Ho(e, t3, r3, s, u, c2) {
        const d = Qe(e), m2 = ko(t3);
        e._disturbed = true;
        let R3 = false, y = T2(void 0);
        return A((C2, P2) => {
          let B2;
          if (c2 !== void 0) {
            if (B2 = n2(() => {
              const _ = c2.reason !== void 0 ? c2.reason : new es("Aborted", "AbortError"), E2 = [];
              s || E2.push(() => t3._state === "writable" ? Kt(t3, _) : T2(void 0)), u || E2.push(() => e._state === "readable" ? ie(e, _) : T2(void 0)), N2(() => Promise.all(E2.map((k2) => k2())), true, _);
            }, "abortAlgorithm"), c2.aborted) {
              B2();
              return;
            }
            c2.addEventListener("abort", B2);
          }
          function ae() {
            return A((_, E2) => {
              function k2(Y) {
                Y ? _() : q(nt(), k2, E2);
              }
              n2(k2, "next"), k2(false);
            });
          }
          n2(ae, "pipeLoop");
          function nt() {
            return R3 ? T2(true) : q(m2._readyPromise, () => A((_, E2) => {
              _t(d, { _chunkSteps: n2((k2) => {
                y = q(Fo(m2, k2), void 0, f2), _(false);
              }, "_chunkSteps"), _closeSteps: n2(() => _(true), "_closeSteps"), _errorSteps: E2 });
            }));
          }
          if (n2(nt, "pipeStep"), Te(e, d._closedPromise, (_) => (s ? J(true, _) : N2(() => Kt(t3, _), true, _), null)), Te(t3, m2._closedPromise, (_) => (u ? J(true, _) : N2(() => ie(e, _), true, _), null)), x2(e, d._closedPromise, () => (r3 ? J() : N2(() => ja(m2)), null)), he(t3) || t3._state === "closed") {
            const _ = new TypeError("the destination writable stream closed before all data could be piped to it");
            u ? J(true, _) : N2(() => ie(e, _), true, _);
          }
          Q(ae());
          function Oe() {
            const _ = y;
            return q(y, () => _ !== y ? Oe() : void 0);
          }
          n2(Oe, "waitForWritesToFinish");
          function Te(_, E2, k2) {
            _._state === "errored" ? k2(_._storedError) : I2(E2, k2);
          }
          n2(Te, "isOrBecomesErrored");
          function x2(_, E2, k2) {
            _._state === "closed" ? k2() : V(E2, k2);
          }
          n2(x2, "isOrBecomesClosed");
          function N2(_, E2, k2) {
            if (R3) return;
            R3 = true, t3._state === "writable" && !he(t3) ? V(Oe(), Y) : Y();
            function Y() {
              return g2(_(), () => Ce(E2, k2), (ot) => Ce(true, ot)), null;
            }
            n2(Y, "doTheRest");
          }
          n2(N2, "shutdownWithAction");
          function J(_, E2) {
            R3 || (R3 = true, t3._state === "writable" && !he(t3) ? V(Oe(), () => Ce(_, E2)) : Ce(_, E2));
          }
          n2(J, "shutdown");
          function Ce(_, E2) {
            return Io(m2), _e(d), c2 !== void 0 && c2.removeEventListener("abort", B2), _ ? P2(E2) : C2(void 0), null;
          }
          n2(Ce, "finalize");
        });
      }
      n2(Ho, "ReadableStreamPipeTo");
      const Cn = class Cn {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get desiredSize() {
          if (!or(this)) throw ar("desiredSize");
          return fn(this);
        }
        close() {
          if (!or(this)) throw ar("close");
          if (!Je(this)) throw new TypeError("The stream is not in a state that permits close");
          De(this);
        }
        enqueue(t3 = void 0) {
          if (!or(this)) throw ar("enqueue");
          if (!Je(this)) throw new TypeError("The stream is not in a state that permits enqueue");
          return Ke(this, t3);
        }
        error(t3 = void 0) {
          if (!or(this)) throw ar("error");
          oe(this, t3);
        }
        [Ar](t3) {
          Be(this);
          const r3 = this._cancelAlgorithm(t3);
          return ir(this), r3;
        }
        [Br](t3) {
          const r3 = this._controlledReadableStream;
          if (this._queue.length > 0) {
            const s = xr(this);
            this._closeRequested && this._queue.length === 0 ? (ir(this), At(r3)) : vt(this), t3._chunkSteps(s);
          } else eo(r3, t3), vt(this);
        }
        [kr]() {
        }
      };
      n2(Cn, "ReadableStreamDefaultController");
      let ne = Cn;
      Object.defineProperties(ne.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, desiredSize: { enumerable: true } }), h2(ne.prototype.close, "close"), h2(ne.prototype.enqueue, "enqueue"), h2(ne.prototype.error, "error"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(ne.prototype, Symbol.toStringTag, { value: "ReadableStreamDefaultController", configurable: true });
      function or(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledReadableStream") ? false : e instanceof ne;
      }
      n2(or, "IsReadableStreamDefaultController");
      function vt(e) {
        if (!Vo(e)) return;
        if (e._pulling) {
          e._pullAgain = true;
          return;
        }
        e._pulling = true;
        const r3 = e._pullAlgorithm();
        g2(r3, () => (e._pulling = false, e._pullAgain && (e._pullAgain = false, vt(e)), null), (s) => (oe(e, s), null));
      }
      n2(vt, "ReadableStreamDefaultControllerCallPullIfNeeded");
      function Vo(e) {
        const t3 = e._controlledReadableStream;
        return !Je(e) || !e._started ? false : !!(qe(t3) && $t(t3) > 0 || fn(e) > 0);
      }
      n2(Vo, "ReadableStreamDefaultControllerShouldCallPull");
      function ir(e) {
        e._pullAlgorithm = void 0, e._cancelAlgorithm = void 0, e._strategySizeAlgorithm = void 0;
      }
      n2(ir, "ReadableStreamDefaultControllerClearAlgorithms");
      function De(e) {
        if (!Je(e)) return;
        const t3 = e._controlledReadableStream;
        e._closeRequested = true, e._queue.length === 0 && (ir(e), At(t3));
      }
      n2(De, "ReadableStreamDefaultControllerClose");
      function Ke(e, t3) {
        if (!Je(e)) return;
        const r3 = e._controlledReadableStream;
        if (qe(r3) && $t(r3) > 0) Lr(r3, t3, false);
        else {
          let s;
          try {
            s = e._strategySizeAlgorithm(t3);
          } catch (u) {
            throw oe(e, u), u;
          }
          try {
            Nr(e, t3, s);
          } catch (u) {
            throw oe(e, u), u;
          }
        }
        vt(e);
      }
      n2(Ke, "ReadableStreamDefaultControllerEnqueue");
      function oe(e, t3) {
        const r3 = e._controlledReadableStream;
        r3._state === "readable" && (Be(e), ir(e), Zo(r3, t3));
      }
      n2(oe, "ReadableStreamDefaultControllerError");
      function fn(e) {
        const t3 = e._controlledReadableStream._state;
        return t3 === "errored" ? null : t3 === "closed" ? 0 : e._strategyHWM - e._queueTotalSize;
      }
      n2(fn, "ReadableStreamDefaultControllerGetDesiredSize");
      function ts(e) {
        return !Vo(e);
      }
      n2(ts, "ReadableStreamDefaultControllerHasBackpressure");
      function Je(e) {
        const t3 = e._controlledReadableStream._state;
        return !e._closeRequested && t3 === "readable";
      }
      n2(Je, "ReadableStreamDefaultControllerCanCloseOrEnqueue");
      function Qo(e, t3, r3, s, u, c2, d) {
        t3._controlledReadableStream = e, t3._queue = void 0, t3._queueTotalSize = void 0, Be(t3), t3._started = false, t3._closeRequested = false, t3._pullAgain = false, t3._pulling = false, t3._strategySizeAlgorithm = d, t3._strategyHWM = c2, t3._pullAlgorithm = s, t3._cancelAlgorithm = u, e._readableStreamController = t3;
        const m2 = r3();
        g2(T2(m2), () => (t3._started = true, vt(t3), null), (R3) => (oe(t3, R3), null));
      }
      n2(Qo, "SetUpReadableStreamDefaultController");
      function rs(e, t3, r3, s) {
        const u = Object.create(ne.prototype);
        let c2, d, m2;
        t3.start !== void 0 ? c2 = n2(() => t3.start(u), "startAlgorithm") : c2 = n2(() => {
        }, "startAlgorithm"), t3.pull !== void 0 ? d = n2(() => t3.pull(u), "pullAlgorithm") : d = n2(() => T2(void 0), "pullAlgorithm"), t3.cancel !== void 0 ? m2 = n2((R3) => t3.cancel(R3), "cancelAlgorithm") : m2 = n2(() => T2(void 0), "cancelAlgorithm"), Qo(e, u, c2, d, m2, r3, s);
      }
      n2(rs, "SetUpReadableStreamDefaultControllerFromUnderlyingSource");
      function ar(e) {
        return new TypeError(`ReadableStreamDefaultController.prototype.${e} can only be used on a ReadableStreamDefaultController`);
      }
      n2(ar, "defaultControllerBrandCheckException$1");
      function ns(e, t3) {
        return Ie(e._readableStreamController) ? is(e) : os(e);
      }
      n2(ns, "ReadableStreamTee");
      function os(e, t3) {
        const r3 = Qe(e);
        let s = false, u = false, c2 = false, d = false, m2, R3, y, C2, P2;
        const B2 = A((x2) => {
          P2 = x2;
        });
        function ae() {
          return s ? (u = true, T2(void 0)) : (s = true, _t(r3, { _chunkSteps: n2((N2) => {
            ge(() => {
              u = false;
              const J = N2, Ce = N2;
              c2 || Ke(y._readableStreamController, J), d || Ke(C2._readableStreamController, Ce), s = false, u && ae();
            });
          }, "_chunkSteps"), _closeSteps: n2(() => {
            s = false, c2 || De(y._readableStreamController), d || De(C2._readableStreamController), (!c2 || !d) && P2(void 0);
          }, "_closeSteps"), _errorSteps: n2(() => {
            s = false;
          }, "_errorSteps") }), T2(void 0));
        }
        n2(ae, "pullAlgorithm");
        function nt(x2) {
          if (c2 = true, m2 = x2, d) {
            const N2 = St([m2, R3]), J = ie(e, N2);
            P2(J);
          }
          return B2;
        }
        n2(nt, "cancel1Algorithm");
        function Oe(x2) {
          if (d = true, R3 = x2, c2) {
            const N2 = St([m2, R3]), J = ie(e, N2);
            P2(J);
          }
          return B2;
        }
        n2(Oe, "cancel2Algorithm");
        function Te() {
        }
        return n2(Te, "startAlgorithm"), y = Et(Te, ae, nt), C2 = Et(Te, ae, Oe), I2(r3._closedPromise, (x2) => (oe(y._readableStreamController, x2), oe(C2._readableStreamController, x2), (!c2 || !d) && P2(void 0), null)), [y, C2];
      }
      n2(os, "ReadableStreamDefaultTee");
      function is(e) {
        let t3 = Qe(e), r3 = false, s = false, u = false, c2 = false, d = false, m2, R3, y, C2, P2;
        const B2 = A((_) => {
          P2 = _;
        });
        function ae(_) {
          I2(_._closedPromise, (E2) => (_ !== t3 || (K(y._readableStreamController, E2), K(C2._readableStreamController, E2), (!c2 || !d) && P2(void 0)), null));
        }
        n2(ae, "forwardReaderError");
        function nt() {
          je(t3) && (_e(t3), t3 = Qe(e), ae(t3)), _t(t3, { _chunkSteps: n2((E2) => {
            ge(() => {
              s = false, u = false;
              const k2 = E2;
              let Y = E2;
              if (!c2 && !d) try {
                Y = fo(E2);
              } catch (ot) {
                K(y._readableStreamController, ot), K(C2._readableStreamController, ot), P2(ie(e, ot));
                return;
              }
              c2 || Ht(y._readableStreamController, k2), d || Ht(C2._readableStreamController, Y), r3 = false, s ? Te() : u && x2();
            });
          }, "_chunkSteps"), _closeSteps: n2(() => {
            r3 = false, c2 || wt(y._readableStreamController), d || wt(C2._readableStreamController), y._readableStreamController._pendingPullIntos.length > 0 && Vt(y._readableStreamController, 0), C2._readableStreamController._pendingPullIntos.length > 0 && Vt(C2._readableStreamController, 0), (!c2 || !d) && P2(void 0);
          }, "_closeSteps"), _errorSteps: n2(() => {
            r3 = false;
          }, "_errorSteps") });
        }
        n2(nt, "pullWithDefaultReader");
        function Oe(_, E2) {
          Ee(t3) && (_e(t3), t3 = Co(e), ae(t3));
          const k2 = E2 ? C2 : y, Y = E2 ? y : C2;
          Eo(t3, _, 1, { _chunkSteps: n2((it) => {
            ge(() => {
              s = false, u = false;
              const at = E2 ? d : c2;
              if (E2 ? c2 : d) at || Qt(k2._readableStreamController, it);
              else {
                let ui;
                try {
                  ui = fo(it);
                } catch (kn) {
                  K(k2._readableStreamController, kn), K(Y._readableStreamController, kn), P2(ie(e, kn));
                  return;
                }
                at || Qt(k2._readableStreamController, it), Ht(Y._readableStreamController, ui);
              }
              r3 = false, s ? Te() : u && x2();
            });
          }, "_chunkSteps"), _closeSteps: n2((it) => {
            r3 = false;
            const at = E2 ? d : c2, cr = E2 ? c2 : d;
            at || wt(k2._readableStreamController), cr || wt(Y._readableStreamController), it !== void 0 && (at || Qt(k2._readableStreamController, it), !cr && Y._readableStreamController._pendingPullIntos.length > 0 && Vt(Y._readableStreamController, 0)), (!at || !cr) && P2(void 0);
          }, "_closeSteps"), _errorSteps: n2(() => {
            r3 = false;
          }, "_errorSteps") });
        }
        n2(Oe, "pullWithBYOBReader");
        function Te() {
          if (r3) return s = true, T2(void 0);
          r3 = true;
          const _ = Gr(y._readableStreamController);
          return _ === null ? nt() : Oe(_._view, false), T2(void 0);
        }
        n2(Te, "pull1Algorithm");
        function x2() {
          if (r3) return u = true, T2(void 0);
          r3 = true;
          const _ = Gr(C2._readableStreamController);
          return _ === null ? nt() : Oe(_._view, true), T2(void 0);
        }
        n2(x2, "pull2Algorithm");
        function N2(_) {
          if (c2 = true, m2 = _, d) {
            const E2 = St([m2, R3]), k2 = ie(e, E2);
            P2(k2);
          }
          return B2;
        }
        n2(N2, "cancel1Algorithm");
        function J(_) {
          if (d = true, R3 = _, c2) {
            const E2 = St([m2, R3]), k2 = ie(e, E2);
            P2(k2);
          }
          return B2;
        }
        n2(J, "cancel2Algorithm");
        function Ce() {
        }
        return n2(Ce, "startAlgorithm"), y = Go(Ce, Te, N2), C2 = Go(Ce, x2, J), ae(t3), [y, C2];
      }
      n2(is, "ReadableByteStreamTee");
      function as(e) {
        return l(e) && typeof e.getReader < "u";
      }
      n2(as, "isReadableStreamLike");
      function ss(e) {
        return as(e) ? us(e.getReader()) : ls(e);
      }
      n2(ss, "ReadableStreamFrom");
      function ls(e) {
        let t3;
        const r3 = uo(e, "async"), s = f2;
        function u() {
          let d;
          try {
            d = Xi(r3);
          } catch (R3) {
            return b(R3);
          }
          const m2 = T2(d);
          return F4(m2, (R3) => {
            if (!l(R3)) throw new TypeError("The promise returned by the iterator.next() method must fulfill with an object");
            if (ea(R3)) De(t3._readableStreamController);
            else {
              const C2 = ta(R3);
              Ke(t3._readableStreamController, C2);
            }
          });
        }
        n2(u, "pullAlgorithm");
        function c2(d) {
          const m2 = r3.iterator;
          let R3;
          try {
            R3 = Ut(m2, "return");
          } catch (P2) {
            return b(P2);
          }
          if (R3 === void 0) return T2(void 0);
          let y;
          try {
            y = z(R3, m2, [d]);
          } catch (P2) {
            return b(P2);
          }
          const C2 = T2(y);
          return F4(C2, (P2) => {
            if (!l(P2)) throw new TypeError("The promise returned by the iterator.return() method must fulfill with an object");
          });
        }
        return n2(c2, "cancelAlgorithm"), t3 = Et(s, u, c2, 0), t3;
      }
      n2(ls, "ReadableStreamFromIterable");
      function us(e) {
        let t3;
        const r3 = f2;
        function s() {
          let c2;
          try {
            c2 = e.read();
          } catch (d) {
            return b(d);
          }
          return F4(c2, (d) => {
            if (!l(d)) throw new TypeError("The promise returned by the reader.read() method must fulfill with an object");
            if (d.done) De(t3._readableStreamController);
            else {
              const m2 = d.value;
              Ke(t3._readableStreamController, m2);
            }
          });
        }
        n2(s, "pullAlgorithm");
        function u(c2) {
          try {
            return T2(e.cancel(c2));
          } catch (d) {
            return b(d);
          }
        }
        return n2(u, "cancelAlgorithm"), t3 = Et(r3, s, u, 0), t3;
      }
      n2(us, "ReadableStreamFromDefaultReader");
      function fs3(e, t3) {
        ue(e, t3);
        const r3 = e, s = r3?.autoAllocateChunkSize, u = r3?.cancel, c2 = r3?.pull, d = r3?.start, m2 = r3?.type;
        return { autoAllocateChunkSize: s === void 0 ? void 0 : Fr(s, `${t3} has member 'autoAllocateChunkSize' that`), cancel: u === void 0 ? void 0 : cs(u, r3, `${t3} has member 'cancel' that`), pull: c2 === void 0 ? void 0 : ds(c2, r3, `${t3} has member 'pull' that`), start: d === void 0 ? void 0 : hs(d, r3, `${t3} has member 'start' that`), type: m2 === void 0 ? void 0 : ps(m2, `${t3} has member 'type' that`) };
      }
      n2(fs3, "convertUnderlyingDefaultOrByteSource");
      function cs(e, t3, r3) {
        return Z2(e, r3), (s) => j(e, t3, [s]);
      }
      n2(cs, "convertUnderlyingSourceCancelCallback");
      function ds(e, t3, r3) {
        return Z2(e, r3), (s) => j(e, t3, [s]);
      }
      n2(ds, "convertUnderlyingSourcePullCallback");
      function hs(e, t3, r3) {
        return Z2(e, r3), (s) => z(e, t3, [s]);
      }
      n2(hs, "convertUnderlyingSourceStartCallback");
      function ps(e, t3) {
        if (e = `${e}`, e !== "bytes") throw new TypeError(`${t3} '${e}' is not a valid enumeration value for ReadableStreamType`);
        return e;
      }
      n2(ps, "convertReadableStreamType");
      function bs(e, t3) {
        return ue(e, t3), { preventCancel: !!e?.preventCancel };
      }
      n2(bs, "convertIteratorOptions");
      function Yo(e, t3) {
        ue(e, t3);
        const r3 = e?.preventAbort, s = e?.preventCancel, u = e?.preventClose, c2 = e?.signal;
        return c2 !== void 0 && ms(c2, `${t3} has member 'signal' that`), { preventAbort: !!r3, preventCancel: !!s, preventClose: !!u, signal: c2 };
      }
      n2(Yo, "convertPipeOptions");
      function ms(e, t3) {
        if (!Ca(e)) throw new TypeError(`${t3} is not an AbortSignal.`);
      }
      n2(ms, "assertAbortSignal");
      function ys(e, t3) {
        ue(e, t3);
        const r3 = e?.readable;
        zr(r3, "readable", "ReadableWritablePair"), jr(r3, `${t3} has member 'readable' that`);
        const s = e?.writable;
        return zr(s, "writable", "ReadableWritablePair"), Bo(s, `${t3} has member 'writable' that`), { readable: r3, writable: s };
      }
      n2(ys, "convertReadableWritablePair");
      const Pn = class Pn {
        constructor(t3 = {}, r3 = {}) {
          t3 === void 0 ? t3 = null : Jn(t3, "First parameter");
          const s = Zt(r3, "Second parameter"), u = fs3(t3, "First parameter");
          if (cn(this), u.type === "bytes") {
            if (s.size !== void 0) throw new RangeError("The strategy for a byte stream cannot have a size function");
            const c2 = Tt(s, 0);
            ca(this, u, c2);
          } else {
            const c2 = Gt(s), d = Tt(s, 1);
            rs(this, u, d, c2);
          }
        }
        get locked() {
          if (!We(this)) throw Me("locked");
          return qe(this);
        }
        cancel(t3 = void 0) {
          return We(this) ? qe(this) ? b(new TypeError("Cannot cancel a stream that already has a reader")) : ie(this, t3) : b(Me("cancel"));
        }
        getReader(t3 = void 0) {
          if (!We(this)) throw Me("getReader");
          return ha(t3, "First parameter").mode === void 0 ? Qe(this) : Co(this);
        }
        pipeThrough(t3, r3 = {}) {
          if (!We(this)) throw Me("pipeThrough");
          Se(t3, 1, "pipeThrough");
          const s = ys(t3, "First parameter"), u = Yo(r3, "Second parameter");
          if (qe(this)) throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
          if (Ze(s.writable)) throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
          const c2 = Ho(this, s.writable, u.preventClose, u.preventAbort, u.preventCancel, u.signal);
          return Q(c2), s.readable;
        }
        pipeTo(t3, r3 = {}) {
          if (!We(this)) return b(Me("pipeTo"));
          if (t3 === void 0) return b("Parameter 1 is required in 'pipeTo'.");
          if (!Ge(t3)) return b(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
          let s;
          try {
            s = Yo(r3, "Second parameter");
          } catch (u) {
            return b(u);
          }
          return qe(this) ? b(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream")) : Ze(t3) ? b(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream")) : Ho(this, t3, s.preventClose, s.preventAbort, s.preventCancel, s.signal);
        }
        tee() {
          if (!We(this)) throw Me("tee");
          const t3 = ns(this);
          return St(t3);
        }
        values(t3 = void 0) {
          if (!We(this)) throw Me("values");
          const r3 = bs(t3, "First parameter");
          return Ki(this, r3.preventCancel);
        }
        [Ur](t3) {
          return this.values(t3);
        }
        static from(t3) {
          return ss(t3);
        }
      };
      n2(Pn, "ReadableStream");
      let L = Pn;
      Object.defineProperties(L, { from: { enumerable: true } }), Object.defineProperties(L.prototype, { cancel: { enumerable: true }, getReader: { enumerable: true }, pipeThrough: { enumerable: true }, pipeTo: { enumerable: true }, tee: { enumerable: true }, values: { enumerable: true }, locked: { enumerable: true } }), h2(L.from, "from"), h2(L.prototype.cancel, "cancel"), h2(L.prototype.getReader, "getReader"), h2(L.prototype.pipeThrough, "pipeThrough"), h2(L.prototype.pipeTo, "pipeTo"), h2(L.prototype.tee, "tee"), h2(L.prototype.values, "values"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(L.prototype, Symbol.toStringTag, { value: "ReadableStream", configurable: true }), Object.defineProperty(L.prototype, Ur, { value: L.prototype.values, writable: true, configurable: true });
      function Et(e, t3, r3, s = 1, u = () => 1) {
        const c2 = Object.create(L.prototype);
        cn(c2);
        const d = Object.create(ne.prototype);
        return Qo(c2, d, e, t3, r3, s, u), c2;
      }
      n2(Et, "CreateReadableStream");
      function Go(e, t3, r3) {
        const s = Object.create(L.prototype);
        cn(s);
        const u = Object.create(te.prototype);
        return To(s, u, e, t3, r3, 0, void 0), s;
      }
      n2(Go, "CreateReadableByteStream");
      function cn(e) {
        e._state = "readable", e._reader = void 0, e._storedError = void 0, e._disturbed = false;
      }
      n2(cn, "InitializeReadableStream");
      function We(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_readableStreamController") ? false : e instanceof L;
      }
      n2(We, "IsReadableStream");
      function qe(e) {
        return e._reader !== void 0;
      }
      n2(qe, "IsReadableStreamLocked");
      function ie(e, t3) {
        if (e._disturbed = true, e._state === "closed") return T2(void 0);
        if (e._state === "errored") return b(e._storedError);
        At(e);
        const r3 = e._reader;
        if (r3 !== void 0 && je(r3)) {
          const u = r3._readIntoRequests;
          r3._readIntoRequests = new D2(), u.forEach((c2) => {
            c2._closeSteps(void 0);
          });
        }
        const s = e._readableStreamController[Ar](t3);
        return F4(s, f2);
      }
      n2(ie, "ReadableStreamCancel");
      function At(e) {
        e._state = "closed";
        const t3 = e._reader;
        if (t3 !== void 0 && (Zn(t3), Ee(t3))) {
          const r3 = t3._readRequests;
          t3._readRequests = new D2(), r3.forEach((s) => {
            s._closeSteps();
          });
        }
      }
      n2(At, "ReadableStreamClose");
      function Zo(e, t3) {
        e._state = "errored", e._storedError = t3;
        const r3 = e._reader;
        r3 !== void 0 && (Or(r3, t3), Ee(r3) ? ro(r3, t3) : Ao(r3, t3));
      }
      n2(Zo, "ReadableStreamError");
      function Me(e) {
        return new TypeError(`ReadableStream.prototype.${e} can only be used on a ReadableStream`);
      }
      n2(Me, "streamBrandCheckException$1");
      function Ko(e, t3) {
        ue(e, t3);
        const r3 = e?.highWaterMark;
        return zr(r3, "highWaterMark", "QueuingStrategyInit"), { highWaterMark: Ir(r3) };
      }
      n2(Ko, "convertQueuingStrategyInit");
      const Jo = n2((e) => e.byteLength, "byteLengthSizeFunction");
      h2(Jo, "size");
      const vn = class vn {
        constructor(t3) {
          Se(t3, 1, "ByteLengthQueuingStrategy"), t3 = Ko(t3, "First parameter"), this._byteLengthQueuingStrategyHighWaterMark = t3.highWaterMark;
        }
        get highWaterMark() {
          if (!ei(this)) throw Xo("highWaterMark");
          return this._byteLengthQueuingStrategyHighWaterMark;
        }
        get size() {
          if (!ei(this)) throw Xo("size");
          return Jo;
        }
      };
      n2(vn, "ByteLengthQueuingStrategy");
      let Xe = vn;
      Object.defineProperties(Xe.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Xe.prototype, Symbol.toStringTag, { value: "ByteLengthQueuingStrategy", configurable: true });
      function Xo(e) {
        return new TypeError(`ByteLengthQueuingStrategy.prototype.${e} can only be used on a ByteLengthQueuingStrategy`);
      }
      n2(Xo, "byteLengthBrandCheckException");
      function ei(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_byteLengthQueuingStrategyHighWaterMark") ? false : e instanceof Xe;
      }
      n2(ei, "IsByteLengthQueuingStrategy");
      const ti = n2(() => 1, "countSizeFunction");
      h2(ti, "size");
      const En = class En {
        constructor(t3) {
          Se(t3, 1, "CountQueuingStrategy"), t3 = Ko(t3, "First parameter"), this._countQueuingStrategyHighWaterMark = t3.highWaterMark;
        }
        get highWaterMark() {
          if (!ni(this)) throw ri("highWaterMark");
          return this._countQueuingStrategyHighWaterMark;
        }
        get size() {
          if (!ni(this)) throw ri("size");
          return ti;
        }
      };
      n2(En, "CountQueuingStrategy");
      let et = En;
      Object.defineProperties(et.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(et.prototype, Symbol.toStringTag, { value: "CountQueuingStrategy", configurable: true });
      function ri(e) {
        return new TypeError(`CountQueuingStrategy.prototype.${e} can only be used on a CountQueuingStrategy`);
      }
      n2(ri, "countBrandCheckException");
      function ni(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_countQueuingStrategyHighWaterMark") ? false : e instanceof et;
      }
      n2(ni, "IsCountQueuingStrategy");
      function gs(e, t3) {
        ue(e, t3);
        const r3 = e?.cancel, s = e?.flush, u = e?.readableType, c2 = e?.start, d = e?.transform, m2 = e?.writableType;
        return { cancel: r3 === void 0 ? void 0 : Rs(r3, e, `${t3} has member 'cancel' that`), flush: s === void 0 ? void 0 : _s(s, e, `${t3} has member 'flush' that`), readableType: u, start: c2 === void 0 ? void 0 : Ss(c2, e, `${t3} has member 'start' that`), transform: d === void 0 ? void 0 : ws(d, e, `${t3} has member 'transform' that`), writableType: m2 };
      }
      n2(gs, "convertTransformer");
      function _s(e, t3, r3) {
        return Z2(e, r3), (s) => j(e, t3, [s]);
      }
      n2(_s, "convertTransformerFlushCallback");
      function Ss(e, t3, r3) {
        return Z2(e, r3), (s) => z(e, t3, [s]);
      }
      n2(Ss, "convertTransformerStartCallback");
      function ws(e, t3, r3) {
        return Z2(e, r3), (s, u) => j(e, t3, [s, u]);
      }
      n2(ws, "convertTransformerTransformCallback");
      function Rs(e, t3, r3) {
        return Z2(e, r3), (s) => j(e, t3, [s]);
      }
      n2(Rs, "convertTransformerCancelCallback");
      const An = class An {
        constructor(t3 = {}, r3 = {}, s = {}) {
          t3 === void 0 && (t3 = null);
          const u = Zt(r3, "Second parameter"), c2 = Zt(s, "Third parameter"), d = gs(t3, "First parameter");
          if (d.readableType !== void 0) throw new RangeError("Invalid readableType specified");
          if (d.writableType !== void 0) throw new RangeError("Invalid writableType specified");
          const m2 = Tt(c2, 0), R3 = Gt(c2), y = Tt(u, 1), C2 = Gt(u);
          let P2;
          const B2 = A((ae) => {
            P2 = ae;
          });
          Ts(this, B2, y, C2, m2, R3), Ps(this, d), d.start !== void 0 ? P2(d.start(this._transformStreamController)) : P2(void 0);
        }
        get readable() {
          if (!oi(this)) throw li("readable");
          return this._readable;
        }
        get writable() {
          if (!oi(this)) throw li("writable");
          return this._writable;
        }
      };
      n2(An, "TransformStream");
      let tt = An;
      Object.defineProperties(tt.prototype, { readable: { enumerable: true }, writable: { enumerable: true } }), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(tt.prototype, Symbol.toStringTag, { value: "TransformStream", configurable: true });
      function Ts(e, t3, r3, s, u, c2) {
        function d() {
          return t3;
        }
        n2(d, "startAlgorithm");
        function m2(B2) {
          return As(e, B2);
        }
        n2(m2, "writeAlgorithm");
        function R3(B2) {
          return Bs(e, B2);
        }
        n2(R3, "abortAlgorithm");
        function y() {
          return ks(e);
        }
        n2(y, "closeAlgorithm"), e._writable = Ea(d, m2, y, R3, r3, s);
        function C2() {
          return Ws(e);
        }
        n2(C2, "pullAlgorithm");
        function P2(B2) {
          return qs(e, B2);
        }
        n2(P2, "cancelAlgorithm"), e._readable = Et(d, C2, P2, u, c2), e._backpressure = void 0, e._backpressureChangePromise = void 0, e._backpressureChangePromise_resolve = void 0, sr(e, true), e._transformStreamController = void 0;
      }
      n2(Ts, "InitializeTransformStream");
      function oi(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_transformStreamController") ? false : e instanceof tt;
      }
      n2(oi, "IsTransformStream");
      function ii(e, t3) {
        oe(e._readable._readableStreamController, t3), dn(e, t3);
      }
      n2(ii, "TransformStreamError");
      function dn(e, t3) {
        ur(e._transformStreamController), Ct(e._writable._writableStreamController, t3), hn(e);
      }
      n2(dn, "TransformStreamErrorWritableAndUnblockWrite");
      function hn(e) {
        e._backpressure && sr(e, false);
      }
      n2(hn, "TransformStreamUnblockWrite");
      function sr(e, t3) {
        e._backpressureChangePromise !== void 0 && e._backpressureChangePromise_resolve(), e._backpressureChangePromise = A((r3) => {
          e._backpressureChangePromise_resolve = r3;
        }), e._backpressure = t3;
      }
      n2(sr, "TransformStreamSetBackpressure");
      const Bn = class Bn {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        get desiredSize() {
          if (!lr(this)) throw fr("desiredSize");
          const t3 = this._controlledTransformStream._readable._readableStreamController;
          return fn(t3);
        }
        enqueue(t3 = void 0) {
          if (!lr(this)) throw fr("enqueue");
          ai(this, t3);
        }
        error(t3 = void 0) {
          if (!lr(this)) throw fr("error");
          vs(this, t3);
        }
        terminate() {
          if (!lr(this)) throw fr("terminate");
          Es(this);
        }
      };
      n2(Bn, "TransformStreamDefaultController");
      let pe = Bn;
      Object.defineProperties(pe.prototype, { enqueue: { enumerable: true }, error: { enumerable: true }, terminate: { enumerable: true }, desiredSize: { enumerable: true } }), h2(pe.prototype.enqueue, "enqueue"), h2(pe.prototype.error, "error"), h2(pe.prototype.terminate, "terminate"), typeof Symbol.toStringTag == "symbol" && Object.defineProperty(pe.prototype, Symbol.toStringTag, { value: "TransformStreamDefaultController", configurable: true });
      function lr(e) {
        return !l(e) || !Object.prototype.hasOwnProperty.call(e, "_controlledTransformStream") ? false : e instanceof pe;
      }
      n2(lr, "IsTransformStreamDefaultController");
      function Cs(e, t3, r3, s, u) {
        t3._controlledTransformStream = e, e._transformStreamController = t3, t3._transformAlgorithm = r3, t3._flushAlgorithm = s, t3._cancelAlgorithm = u, t3._finishPromise = void 0, t3._finishPromise_resolve = void 0, t3._finishPromise_reject = void 0;
      }
      n2(Cs, "SetUpTransformStreamDefaultController");
      function Ps(e, t3) {
        const r3 = Object.create(pe.prototype);
        let s, u, c2;
        t3.transform !== void 0 ? s = n2((d) => t3.transform(d, r3), "transformAlgorithm") : s = n2((d) => {
          try {
            return ai(r3, d), T2(void 0);
          } catch (m2) {
            return b(m2);
          }
        }, "transformAlgorithm"), t3.flush !== void 0 ? u = n2(() => t3.flush(r3), "flushAlgorithm") : u = n2(() => T2(void 0), "flushAlgorithm"), t3.cancel !== void 0 ? c2 = n2((d) => t3.cancel(d), "cancelAlgorithm") : c2 = n2(() => T2(void 0), "cancelAlgorithm"), Cs(e, r3, s, u, c2);
      }
      n2(Ps, "SetUpTransformStreamDefaultControllerFromTransformer");
      function ur(e) {
        e._transformAlgorithm = void 0, e._flushAlgorithm = void 0, e._cancelAlgorithm = void 0;
      }
      n2(ur, "TransformStreamDefaultControllerClearAlgorithms");
      function ai(e, t3) {
        const r3 = e._controlledTransformStream, s = r3._readable._readableStreamController;
        if (!Je(s)) throw new TypeError("Readable side is not in a state that permits enqueue");
        try {
          Ke(s, t3);
        } catch (c2) {
          throw dn(r3, c2), r3._readable._storedError;
        }
        ts(s) !== r3._backpressure && sr(r3, true);
      }
      n2(ai, "TransformStreamDefaultControllerEnqueue");
      function vs(e, t3) {
        ii(e._controlledTransformStream, t3);
      }
      n2(vs, "TransformStreamDefaultControllerError");
      function si(e, t3) {
        const r3 = e._transformAlgorithm(t3);
        return F4(r3, void 0, (s) => {
          throw ii(e._controlledTransformStream, s), s;
        });
      }
      n2(si, "TransformStreamDefaultControllerPerformTransform");
      function Es(e) {
        const t3 = e._controlledTransformStream, r3 = t3._readable._readableStreamController;
        De(r3);
        const s = new TypeError("TransformStream terminated");
        dn(t3, s);
      }
      n2(Es, "TransformStreamDefaultControllerTerminate");
      function As(e, t3) {
        const r3 = e._transformStreamController;
        if (e._backpressure) {
          const s = e._backpressureChangePromise;
          return F4(s, () => {
            const u = e._writable;
            if (u._state === "erroring") throw u._storedError;
            return si(r3, t3);
          });
        }
        return si(r3, t3);
      }
      n2(As, "TransformStreamDefaultSinkWriteAlgorithm");
      function Bs(e, t3) {
        const r3 = e._transformStreamController;
        if (r3._finishPromise !== void 0) return r3._finishPromise;
        const s = e._readable;
        r3._finishPromise = A((c2, d) => {
          r3._finishPromise_resolve = c2, r3._finishPromise_reject = d;
        });
        const u = r3._cancelAlgorithm(t3);
        return ur(r3), g2(u, () => (s._state === "errored" ? rt(r3, s._storedError) : (oe(s._readableStreamController, t3), pn(r3)), null), (c2) => (oe(s._readableStreamController, c2), rt(r3, c2), null)), r3._finishPromise;
      }
      n2(Bs, "TransformStreamDefaultSinkAbortAlgorithm");
      function ks(e) {
        const t3 = e._transformStreamController;
        if (t3._finishPromise !== void 0) return t3._finishPromise;
        const r3 = e._readable;
        t3._finishPromise = A((u, c2) => {
          t3._finishPromise_resolve = u, t3._finishPromise_reject = c2;
        });
        const s = t3._flushAlgorithm();
        return ur(t3), g2(s, () => (r3._state === "errored" ? rt(t3, r3._storedError) : (De(r3._readableStreamController), pn(t3)), null), (u) => (oe(r3._readableStreamController, u), rt(t3, u), null)), t3._finishPromise;
      }
      n2(ks, "TransformStreamDefaultSinkCloseAlgorithm");
      function Ws(e) {
        return sr(e, false), e._backpressureChangePromise;
      }
      n2(Ws, "TransformStreamDefaultSourcePullAlgorithm");
      function qs(e, t3) {
        const r3 = e._transformStreamController;
        if (r3._finishPromise !== void 0) return r3._finishPromise;
        const s = e._writable;
        r3._finishPromise = A((c2, d) => {
          r3._finishPromise_resolve = c2, r3._finishPromise_reject = d;
        });
        const u = r3._cancelAlgorithm(t3);
        return ur(r3), g2(u, () => (s._state === "errored" ? rt(r3, s._storedError) : (Ct(s._writableStreamController, t3), hn(e), pn(r3)), null), (c2) => (Ct(s._writableStreamController, c2), hn(e), rt(r3, c2), null)), r3._finishPromise;
      }
      n2(qs, "TransformStreamDefaultSourceCancelAlgorithm");
      function fr(e) {
        return new TypeError(`TransformStreamDefaultController.prototype.${e} can only be used on a TransformStreamDefaultController`);
      }
      n2(fr, "defaultControllerBrandCheckException");
      function pn(e) {
        e._finishPromise_resolve !== void 0 && (e._finishPromise_resolve(), e._finishPromise_resolve = void 0, e._finishPromise_reject = void 0);
      }
      n2(pn, "defaultControllerFinishPromiseResolve");
      function rt(e, t3) {
        e._finishPromise_reject !== void 0 && (Q(e._finishPromise), e._finishPromise_reject(t3), e._finishPromise_resolve = void 0, e._finishPromise_reject = void 0);
      }
      n2(rt, "defaultControllerFinishPromiseReject");
      function li(e) {
        return new TypeError(`TransformStream.prototype.${e} can only be used on a TransformStream`);
      }
      n2(li, "streamBrandCheckException"), a.ByteLengthQueuingStrategy = Xe, a.CountQueuingStrategy = et, a.ReadableByteStreamController = te, a.ReadableStream = L, a.ReadableStreamBYOBReader = ce, a.ReadableStreamBYOBRequest = Re, a.ReadableStreamDefaultController = ne, a.ReadableStreamDefaultReader = fe, a.TransformStream = tt, a.TransformStreamDefaultController = pe, a.WritableStream = de, a.WritableStreamDefaultController = ke, a.WritableStreamDefaultWriter = re;
    });
  }(kt, kt.exports)), kt.exports;
}
function Hs() {
  if (mi) return pi;
  mi = 1;
  const i = 65536;
  if (!globalThis.ReadableStream) try {
    const o3 = require("node:process"), { emitWarning: a } = o3;
    try {
      o3.emitWarning = () => {
      }, Object.assign(globalThis, require("node:stream/web")), o3.emitWarning = a;
    } catch (f2) {
      throw o3.emitWarning = a, f2;
    }
  } catch {
    Object.assign(globalThis, Ns());
  }
  try {
    const { Blob: o3 } = require("buffer");
    o3 && !o3.prototype.stream && (o3.prototype.stream = n2(function(f2) {
      let l = 0;
      const p2 = this;
      return new ReadableStream({ type: "bytes", async pull(h2) {
        const v2 = await p2.slice(l, Math.min(p2.size, l + i)).arrayBuffer();
        l += v2.byteLength, h2.enqueue(new Uint8Array(v2)), l === p2.size && h2.close();
      } });
    }, "name"));
  } catch {
  }
  return pi;
}
async function* Wn(i, o3 = true) {
  for (const a of i) if ("stream" in a) yield* a.stream();
  else if (ArrayBuffer.isView(a)) if (o3) {
    let f2 = a.byteOffset;
    const l = a.byteOffset + a.byteLength;
    for (; f2 !== l; ) {
      const p2 = Math.min(l - f2, yi), h2 = a.buffer.slice(f2, f2 + p2);
      f2 += h2.byteLength, yield new Uint8Array(h2);
    }
  } else yield a;
  else {
    let f2 = 0, l = a;
    for (; f2 !== l.size; ) {
      const h2 = await l.slice(f2, Math.min(l.size, f2 + yi)).arrayBuffer();
      f2 += h2.byteLength, yield new Uint8Array(h2);
    }
  }
}
function Zs(i, o3 = ut) {
  var a = `${_i()}${_i()}`.replace(/\./g, "").slice(-28).padStart(32, "-"), f2 = [], l = `--${a}\r
Content-Disposition: form-data; name="`;
  return i.forEach((p2, h2) => typeof p2 == "string" ? f2.push(l + On(h2) + `"\r
\r
${p2.replace(/\r(?!\n)|(?<!\r)\n/g, `\r
`)}\r
`) : f2.push(l + On(h2) + `"; filename="${On(p2.name, 1)}"\r
Content-Type: ${p2.type || "application/octet-stream"}\r
\r
`, p2, `\r
`)), f2.push(`--${a}--`), new o3(f2, { type: "multipart/form-data; boundary=" + a });
}
async function zn(i) {
  if (i[H].disturbed) throw new TypeError(`body used already for: ${i.url}`);
  if (i[H].disturbed = true, i[H].error) throw i[H].error;
  const { body: o3 } = i;
  if (o3 === null) return import_node_buffer.Buffer.alloc(0);
  if (!(o3 instanceof import_node_stream.default)) return import_node_buffer.Buffer.alloc(0);
  const a = [];
  let f2 = 0;
  try {
    for await (const l of o3) {
      if (i.size > 0 && f2 + l.length > i.size) {
        const p2 = new G(`content size at ${i.url} over limit: ${i.size}`, "max-size");
        throw o3.destroy(p2), p2;
      }
      f2 += l.length, a.push(l);
    }
  } catch (l) {
    throw l instanceof ft ? l : new G(`Invalid response body while trying to fetch ${i.url}: ${l.message}`, "system", l);
  }
  if (o3.readableEnded === true || o3._readableState.ended === true) try {
    return a.every((l) => typeof l == "string") ? import_node_buffer.Buffer.from(a.join("")) : import_node_buffer.Buffer.concat(a, f2);
  } catch (l) {
    throw new G(`Could not create Buffer from response body for ${i.url}: ${l.message}`, "system", l);
  }
  else throw new G(`Premature close of server response while trying to fetch ${i.url}`);
}
function ol(i = []) {
  return new ye(i.reduce((o3, a, f2, l) => (f2 % 2 === 0 && o3.push(l.slice(f2, f2 + 2)), o3), []).filter(([o3, a]) => {
    try {
      return gr(o3), Fn(o3, String(a)), true;
    } catch {
      return false;
    }
  }));
}
function Ti(i, o3 = false) {
  return i == null || (i = new URL(i), /^(about|blob|data):$/.test(i.protocol)) ? "no-referrer" : (i.username = "", i.password = "", i.hash = "", o3 && (i.pathname = "", i.search = ""), i);
}
function ll(i) {
  if (!Ci.has(i)) throw new TypeError(`Invalid referrerPolicy: ${i}`);
  return i;
}
function ul(i) {
  if (/^(http|ws)s:$/.test(i.protocol)) return true;
  const o3 = i.host.replace(/(^\[)|(]$)/g, ""), a = (0, import_node_net.isIP)(o3);
  return a === 4 && /^127\./.test(o3) || a === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(o3) ? true : i.host === "localhost" || i.host.endsWith(".localhost") ? false : i.protocol === "file:";
}
function ct(i) {
  return /^about:(blank|srcdoc)$/.test(i) || i.protocol === "data:" || /^(blob|filesystem):$/.test(i.protocol) ? true : ul(i);
}
function fl(i, { referrerURLCallback: o3, referrerOriginCallback: a } = {}) {
  if (i.referrer === "no-referrer" || i.referrerPolicy === "") return null;
  const f2 = i.referrerPolicy;
  if (i.referrer === "about:client") return "no-referrer";
  const l = i.referrer;
  let p2 = Ti(l), h2 = Ti(l, true);
  p2.toString().length > 4096 && (p2 = h2), o3 && (p2 = o3(p2)), a && (h2 = a(h2));
  const S = new URL(i.url);
  switch (f2) {
    case "no-referrer":
      return "no-referrer";
    case "origin":
      return h2;
    case "unsafe-url":
      return p2;
    case "strict-origin":
      return ct(p2) && !ct(S) ? "no-referrer" : h2.toString();
    case "strict-origin-when-cross-origin":
      return p2.origin === S.origin ? p2 : ct(p2) && !ct(S) ? "no-referrer" : h2;
    case "same-origin":
      return p2.origin === S.origin ? p2 : "no-referrer";
    case "origin-when-cross-origin":
      return p2.origin === S.origin ? p2 : h2;
    case "no-referrer-when-downgrade":
      return ct(p2) && !ct(S) ? "no-referrer" : p2;
    default:
      throw new TypeError(`Invalid referrerPolicy: ${f2}`);
  }
}
function cl(i) {
  const o3 = (i.get("referrer-policy") || "").split(/[,\s]+/);
  let a = "";
  for (const f2 of o3) f2 && Ci.has(f2) && (a = f2);
  return a;
}
function pl() {
  if (Pi) return Ln;
  if (Pi = 1, !globalThis.DOMException) try {
    const { MessageChannel: i } = require("worker_threads"), o3 = new i().port1, a = new ArrayBuffer();
    o3.postMessage(a, [a, a]);
  } catch (i) {
    i.constructor.name === "DOMException" && (globalThis.DOMException = i.constructor);
  }
  return Ln = globalThis.DOMException, Ln;
}
async function Ai(i, o3) {
  return new Promise((a, f2) => {
    const l = new dt(i, o3), { parsedURL: p2, options: h2 } = hl(l);
    if (!wl.has(p2.protocol)) throw new TypeError(`node-fetch cannot load ${i}. URL scheme "${p2.protocol.replace(/:$/, "")}" is not supported.`);
    if (p2.protocol === "data:") {
      const g2 = Us(l.url), V = new le(g2, { headers: { "Content-Type": g2.typeFull } });
      a(V);
      return;
    }
    const S = (p2.protocol === "https:" ? import_node_https.default : import_node_http.default).request, { signal: v2 } = l;
    let w2 = null;
    const A = n2(() => {
      const g2 = new _r("The operation was aborted.");
      f2(g2), l.body && l.body instanceof import_node_stream.default.Readable && l.body.destroy(g2), !(!w2 || !w2.body) && w2.body.emit("error", g2);
    }, "abort");
    if (v2 && v2.aborted) {
      A();
      return;
    }
    const T2 = n2(() => {
      A(), q();
    }, "abortAndFinalize"), b = S(p2.toString(), h2);
    v2 && v2.addEventListener("abort", T2);
    const q = n2(() => {
      b.abort(), v2 && v2.removeEventListener("abort", T2);
    }, "finalize");
    b.on("error", (g2) => {
      f2(new G(`request to ${l.url} failed, reason: ${g2.message}`, "system", g2)), q();
    }), Rl(b, (g2) => {
      w2 && w2.body && w2.body.destroy(g2);
    }), process.version < "v14" && b.on("socket", (g2) => {
      let V;
      g2.prependListener("end", () => {
        V = g2._eventsCount;
      }), g2.prependListener("close", (I2) => {
        if (w2 && V < g2._eventsCount && !I2) {
          const F4 = new Error("Premature close");
          F4.code = "ERR_STREAM_PREMATURE_CLOSE", w2.body.emit("error", F4);
        }
      });
    }), b.on("response", (g2) => {
      b.setTimeout(0);
      const V = ol(g2.rawHeaders);
      if (jn(g2.statusCode)) {
        const z = V.get("Location");
        let j = null;
        try {
          j = z === null ? null : new URL(z, l.url);
        } catch {
          if (l.redirect !== "manual") {
            f2(new G(`uri requested responds with an invalid redirect URL: ${z}`, "invalid-redirect")), q();
            return;
          }
        }
        switch (l.redirect) {
          case "error":
            f2(new G(`uri requested responds with a redirect, redirect mode is set to error: ${l.url}`, "no-redirect")), q();
            return;
          case "manual":
            break;
          case "follow": {
            if (j === null) break;
            if (l.counter >= l.follow) {
              f2(new G(`maximum redirect reached at: ${l.url}`, "max-redirect")), q();
              return;
            }
            const U = { headers: new ye(l.headers), follow: l.follow, counter: l.counter + 1, agent: l.agent, compress: l.compress, method: l.method, body: In(l), signal: l.signal, size: l.size, referrer: l.referrer, referrerPolicy: l.referrerPolicy };
            if (!Js(l.url, j) || !Xs(l.url, j)) for (const jt of ["authorization", "www-authenticate", "cookie", "cookie2"]) U.headers.delete(jt);
            if (g2.statusCode !== 303 && l.body && o3.body instanceof import_node_stream.default.Readable) {
              f2(new G("Cannot follow redirect with body being a readable stream", "unsupported-redirect")), q();
              return;
            }
            (g2.statusCode === 303 || (g2.statusCode === 301 || g2.statusCode === 302) && l.method === "POST") && (U.method = "GET", U.body = void 0, U.headers.delete("content-length"));
            const D2 = cl(V);
            D2 && (U.referrerPolicy = D2), a(Ai(new dt(j, U))), q();
            return;
          }
          default:
            return f2(new TypeError(`Redirect option '${l.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      v2 && g2.once("end", () => {
        v2.removeEventListener("abort", T2);
      });
      let I2 = (0, import_node_stream.pipeline)(g2, new import_node_stream.PassThrough(), (z) => {
        z && f2(z);
      });
      process.version < "v12.10" && g2.on("aborted", T2);
      const F4 = { url: l.url, status: g2.statusCode, statusText: g2.statusMessage, headers: V, size: l.size, counter: l.counter, highWaterMark: l.highWaterMark }, Q = V.get("Content-Encoding");
      if (!l.compress || l.method === "HEAD" || Q === null || g2.statusCode === 204 || g2.statusCode === 304) {
        w2 = new le(I2, F4), a(w2);
        return;
      }
      const ge = { flush: import_node_zlib.default.Z_SYNC_FLUSH, finishFlush: import_node_zlib.default.Z_SYNC_FLUSH };
      if (Q === "gzip" || Q === "x-gzip") {
        I2 = (0, import_node_stream.pipeline)(I2, import_node_zlib.default.createGunzip(ge), (z) => {
          z && f2(z);
        }), w2 = new le(I2, F4), a(w2);
        return;
      }
      if (Q === "deflate" || Q === "x-deflate") {
        const z = (0, import_node_stream.pipeline)(g2, new import_node_stream.PassThrough(), (j) => {
          j && f2(j);
        });
        z.once("data", (j) => {
          (j[0] & 15) === 8 ? I2 = (0, import_node_stream.pipeline)(I2, import_node_zlib.default.createInflate(), (U) => {
            U && f2(U);
          }) : I2 = (0, import_node_stream.pipeline)(I2, import_node_zlib.default.createInflateRaw(), (U) => {
            U && f2(U);
          }), w2 = new le(I2, F4), a(w2);
        }), z.once("end", () => {
          w2 || (w2 = new le(I2, F4), a(w2));
        });
        return;
      }
      if (Q === "br") {
        I2 = (0, import_node_stream.pipeline)(I2, import_node_zlib.default.createBrotliDecompress(), (z) => {
          z && f2(z);
        }), w2 = new le(I2, F4), a(w2);
        return;
      }
      w2 = new le(I2, F4), a(w2);
    }), nl(b, l).catch(f2);
  });
}
function Rl(i, o3) {
  const a = import_node_buffer.Buffer.from(`0\r
\r
`);
  let f2 = false, l = false, p2;
  i.on("response", (h2) => {
    const { headers: S } = h2;
    f2 = S["transfer-encoding"] === "chunked" && !S["content-length"];
  }), i.on("socket", (h2) => {
    const S = n2(() => {
      if (f2 && !l) {
        const w2 = new Error("Premature close");
        w2.code = "ERR_STREAM_PREMATURE_CLOSE", o3(w2);
      }
    }, "onSocketClose"), v2 = n2((w2) => {
      l = import_node_buffer.Buffer.compare(w2.slice(-5), a) === 0, !l && p2 && (l = import_node_buffer.Buffer.compare(p2.slice(-3), a.slice(0, 3)) === 0 && import_node_buffer.Buffer.compare(w2.slice(-2), a.slice(3)) === 0), p2 = w2;
    }, "onData");
    h2.prependListener("close", S), h2.on("data", v2), i.on("close", () => {
      h2.removeListener("close", S), h2.removeListener("data", v2);
    });
  });
}
function W(i) {
  const o3 = Bi.get(i);
  return console.assert(o3 != null, "'this' is expected an Event object, but got", i), o3;
}
function ki(i) {
  if (i.passiveListener != null) {
    typeof console < "u" && typeof console.error == "function" && console.error("Unable to preventDefault inside passive event listener invocation.", i.passiveListener);
    return;
  }
  i.event.cancelable && (i.canceled = true, typeof i.event.preventDefault == "function" && i.event.preventDefault());
}
function ht(i, o3) {
  Bi.set(this, { eventTarget: i, event: o3, eventPhase: 2, currentTarget: i, canceled: false, stopped: false, immediateStopped: false, passiveListener: null, timeStamp: o3.timeStamp || Date.now() }), Object.defineProperty(this, "isTrusted", { value: false, enumerable: true });
  const a = Object.keys(o3);
  for (let f2 = 0; f2 < a.length; ++f2) {
    const l = a[f2];
    l in this || Object.defineProperty(this, l, Wi(l));
  }
}
function Wi(i) {
  return { get() {
    return W(this).event[i];
  }, set(o3) {
    W(this).event[i] = o3;
  }, configurable: true, enumerable: true };
}
function Tl(i) {
  return { value() {
    const o3 = W(this).event;
    return o3[i].apply(o3, arguments);
  }, configurable: true, enumerable: true };
}
function Cl(i, o3) {
  const a = Object.keys(o3);
  if (a.length === 0) return i;
  function f2(l, p2) {
    i.call(this, l, p2);
  }
  n2(f2, "CustomEvent"), f2.prototype = Object.create(i.prototype, { constructor: { value: f2, configurable: true, writable: true } });
  for (let l = 0; l < a.length; ++l) {
    const p2 = a[l];
    if (!(p2 in i.prototype)) {
      const S = typeof Object.getOwnPropertyDescriptor(o3, p2).value == "function";
      Object.defineProperty(f2.prototype, p2, S ? Tl(p2) : Wi(p2));
    }
  }
  return f2;
}
function qi(i) {
  if (i == null || i === Object.prototype) return ht;
  let o3 = Dn.get(i);
  return o3 == null && (o3 = Cl(qi(Object.getPrototypeOf(i)), i), Dn.set(i, o3)), o3;
}
function Pl(i, o3) {
  const a = qi(Object.getPrototypeOf(o3));
  return new a(i, o3);
}
function vl(i) {
  return W(i).immediateStopped;
}
function El(i, o3) {
  W(i).eventPhase = o3;
}
function Al(i, o3) {
  W(i).currentTarget = o3;
}
function Oi(i, o3) {
  W(i).passiveListener = o3;
}
function Rr(i) {
  return i !== null && typeof i == "object";
}
function Ot(i) {
  const o3 = zi.get(i);
  if (o3 == null) throw new TypeError("'this' is expected an EventTarget object, but got another value.");
  return o3;
}
function Bl(i) {
  return { get() {
    let a = Ot(this).get(i);
    for (; a != null; ) {
      if (a.listenerType === wr) return a.listener;
      a = a.next;
    }
    return null;
  }, set(o3) {
    typeof o3 != "function" && !Rr(o3) && (o3 = null);
    const a = Ot(this);
    let f2 = null, l = a.get(i);
    for (; l != null; ) l.listenerType === wr ? f2 !== null ? f2.next = l.next : l.next !== null ? a.set(i, l.next) : a.delete(i) : f2 = l, l = l.next;
    if (o3 !== null) {
      const p2 = { listener: o3, listenerType: wr, passive: false, once: false, next: null };
      f2 === null ? a.set(i, p2) : f2.next = p2;
    }
  }, configurable: true, enumerable: true };
}
function ji(i, o3) {
  Object.defineProperty(i, `on${o3}`, Bl(o3));
}
function Li(i) {
  function o3() {
    Pe.call(this);
  }
  n2(o3, "CustomEventTarget"), o3.prototype = Object.create(Pe.prototype, { constructor: { value: o3, configurable: true, writable: true } });
  for (let a = 0; a < i.length; ++a) ji(o3.prototype, i[a]);
  return o3;
}
function Pe() {
  if (this instanceof Pe) {
    zi.set(this, /* @__PURE__ */ new Map());
    return;
  }
  if (arguments.length === 1 && Array.isArray(arguments[0])) return Li(arguments[0]);
  if (arguments.length > 0) {
    const i = new Array(arguments.length);
    for (let o3 = 0; o3 < arguments.length; ++o3) i[o3] = arguments[o3];
    return Li(i);
  }
  throw new TypeError("Cannot call a class as a function");
}
function kl() {
  const i = Object.create(pt.prototype);
  return Pe.call(i), Tr.set(i, false), i;
}
function Wl(i) {
  Tr.get(i) === false && (Tr.set(i, true), i.dispatchEvent({ type: "abort" }));
}
function Di(i) {
  const o3 = $i.get(i);
  if (o3 == null) throw new TypeError(`Expected 'this' to be an 'AbortController' object, but got ${i === null ? "null" : typeof i}`);
  return o3;
}
function Ui() {
  !globalThis.process?.versions?.node && !globalThis.process?.env?.DISABLE_NODE_FETCH_NATIVE_WARN && console.warn("[node-fetch-native] Node.js compatible build of `node-fetch-native` is being used in a non-Node.js environment. Please make sure you are using proper export conditions or report this issue to https://github.com/unjs/node-fetch-native. You can set `process.env.DISABLE_NODE_FETCH_NATIVE_WARN` to disable this warning.");
}
var import_node_http, import_node_https, import_node_zlib, import_node_stream, import_node_buffer, import_node_util, import_node_url, import_node_net, import_node_fs3, import_node_path2, Os, fi, n2, ci, O, be, X, ve, zt, bt, Cr, ze, It, Ft, mt, ee, yt, He, Ve, gt, pi, kt, xs, bi, mi, yi, gi, ut, Vs, qn, Wt, Qs, Ys, _i, Gs, Si, On, Ue, br, Un, ft, xn, G, mr, wi, yr, Ks, Js, Xs, el, H, Nn, xe, In, tl, Ri, rl, nl, gr, Fn, Pr, ye, il, jn, se, Ne, le, al, Ci, sl, $2, qt, dl, vr, dt, hl, Hn, _r, Ln, Pi, bl, ml, $n, yl, gl, _l, Sl, vi, Ei, Er, Sr, wl, Bi, Dn, zi, Ii, Fi, wr, Vn, pt, Tr, Mn, $i, ql, Ol, Mi;
var init_node = __esm({
  "node_modules/node-fetch-native/dist/node.mjs"() {
    import_node_http = __toESM(require("node:http"), 1);
    import_node_https = __toESM(require("node:https"), 1);
    import_node_zlib = __toESM(require("node:zlib"), 1);
    import_node_stream = __toESM(require("node:stream"), 1);
    import_node_buffer = require("node:buffer");
    import_node_util = require("node:util");
    init_node_fetch_native_DfbY2q_x();
    import_node_url = require("node:url");
    import_node_net = require("node:net");
    import_node_fs3 = require("node:fs");
    import_node_path2 = require("node:path");
    Os = Object.defineProperty;
    fi = (i) => {
      throw TypeError(i);
    };
    n2 = (i, o3) => Os(i, "name", { value: o3, configurable: true });
    ci = (i, o3, a) => o3.has(i) || fi("Cannot " + a);
    O = (i, o3, a) => (ci(i, o3, "read from private field"), a ? a.call(i) : o3.get(i));
    be = (i, o3, a) => o3.has(i) ? fi("Cannot add the same private member more than once") : o3 instanceof WeakSet ? o3.add(i) : o3.set(i, a);
    X = (i, o3, a, f2) => (ci(i, o3, "write to private field"), f2 ? f2.call(i, a) : o3.set(i, a), a);
    n2(Us, "dataUriToBuffer");
    pi = {};
    kt = { exports: {} };
    xs = kt.exports;
    n2(Ns, "requirePonyfill_es2018");
    n2(Hs, "requireStreams"), Hs();
    yi = 65536;
    n2(Wn, "toIterator");
    gi = (ze = class {
      constructor(o3 = [], a = {}) {
        be(this, ve, []);
        be(this, zt, "");
        be(this, bt, 0);
        be(this, Cr, "transparent");
        if (typeof o3 != "object" || o3 === null) throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        if (typeof o3[Symbol.iterator] != "function") throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        if (typeof a != "object" && typeof a != "function") throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        a === null && (a = {});
        const f2 = new TextEncoder();
        for (const p2 of o3) {
          let h2;
          ArrayBuffer.isView(p2) ? h2 = new Uint8Array(p2.buffer.slice(p2.byteOffset, p2.byteOffset + p2.byteLength)) : p2 instanceof ArrayBuffer ? h2 = new Uint8Array(p2.slice(0)) : p2 instanceof ze ? h2 = p2 : h2 = f2.encode(`${p2}`), X(this, bt, O(this, bt) + (ArrayBuffer.isView(h2) ? h2.byteLength : h2.size)), O(this, ve).push(h2);
        }
        X(this, Cr, `${a.endings === void 0 ? "transparent" : a.endings}`);
        const l = a.type === void 0 ? "" : String(a.type);
        X(this, zt, /^[\x20-\x7E]*$/.test(l) ? l : "");
      }
      get size() {
        return O(this, bt);
      }
      get type() {
        return O(this, zt);
      }
      async text() {
        const o3 = new TextDecoder();
        let a = "";
        for await (const f2 of Wn(O(this, ve), false)) a += o3.decode(f2, { stream: true });
        return a += o3.decode(), a;
      }
      async arrayBuffer() {
        const o3 = new Uint8Array(this.size);
        let a = 0;
        for await (const f2 of Wn(O(this, ve), false)) o3.set(f2, a), a += f2.length;
        return o3.buffer;
      }
      stream() {
        const o3 = Wn(O(this, ve), true);
        return new globalThis.ReadableStream({ type: "bytes", async pull(a) {
          const f2 = await o3.next();
          f2.done ? a.close() : a.enqueue(f2.value);
        }, async cancel() {
          await o3.return();
        } });
      }
      slice(o3 = 0, a = this.size, f2 = "") {
        const { size: l } = this;
        let p2 = o3 < 0 ? Math.max(l + o3, 0) : Math.min(o3, l), h2 = a < 0 ? Math.max(l + a, 0) : Math.min(a, l);
        const S = Math.max(h2 - p2, 0), v2 = O(this, ve), w2 = [];
        let A = 0;
        for (const b of v2) {
          if (A >= S) break;
          const q = ArrayBuffer.isView(b) ? b.byteLength : b.size;
          if (p2 && q <= p2) p2 -= q, h2 -= q;
          else {
            let g2;
            ArrayBuffer.isView(b) ? (g2 = b.subarray(p2, Math.min(q, h2)), A += g2.byteLength) : (g2 = b.slice(p2, Math.min(q, h2)), A += g2.size), h2 -= q, w2.push(g2), p2 = 0;
          }
        }
        const T2 = new ze([], { type: String(f2).toLowerCase() });
        return X(T2, bt, S), X(T2, ve, w2), T2;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](o3) {
        return o3 && typeof o3 == "object" && typeof o3.constructor == "function" && (typeof o3.stream == "function" || typeof o3.arrayBuffer == "function") && /^(Blob|File)$/.test(o3[Symbol.toStringTag]);
      }
    }, ve = /* @__PURE__ */ new WeakMap(), zt = /* @__PURE__ */ new WeakMap(), bt = /* @__PURE__ */ new WeakMap(), Cr = /* @__PURE__ */ new WeakMap(), n2(ze, "Blob"), ze);
    Object.defineProperties(gi.prototype, { size: { enumerable: true }, type: { enumerable: true }, slice: { enumerable: true } });
    ut = gi;
    Vs = (mt = class extends ut {
      constructor(a, f2, l = {}) {
        if (arguments.length < 2) throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
        super(a, l);
        be(this, It, 0);
        be(this, Ft, "");
        l === null && (l = {});
        const p2 = l.lastModified === void 0 ? Date.now() : Number(l.lastModified);
        Number.isNaN(p2) || X(this, It, p2), X(this, Ft, String(f2));
      }
      get name() {
        return O(this, Ft);
      }
      get lastModified() {
        return O(this, It);
      }
      get [Symbol.toStringTag]() {
        return "File";
      }
      static [Symbol.hasInstance](a) {
        return !!a && a instanceof ut && /^(File)$/.test(a[Symbol.toStringTag]);
      }
    }, It = /* @__PURE__ */ new WeakMap(), Ft = /* @__PURE__ */ new WeakMap(), n2(mt, "File"), mt);
    qn = Vs;
    ({ toStringTag: Wt, iterator: Qs, hasInstance: Ys } = Symbol);
    _i = Math.random;
    Gs = "append,set,get,getAll,delete,keys,values,entries,forEach,constructor".split(",");
    Si = n2((i, o3, a) => (i += "", /^(Blob|File)$/.test(o3 && o3[Wt]) ? [(a = a !== void 0 ? a + "" : o3[Wt] == "File" ? o3.name : "blob", i), o3.name !== a || o3[Wt] == "blob" ? new qn([o3], a, o3) : o3] : [i, o3 + ""]), "f");
    On = n2((i, o3) => (o3 ? i : i.replace(/\r?\n|\r/g, `\r
`)).replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22"), "e$1");
    Ue = n2((i, o3, a) => {
      if (o3.length < a) throw new TypeError(`Failed to execute '${i}' on 'FormData': ${a} arguments required, but only ${o3.length} present.`);
    }, "x");
    br = (yt = class {
      constructor(...o3) {
        be(this, ee, []);
        if (o3.length) throw new TypeError("Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.");
      }
      get [Wt]() {
        return "FormData";
      }
      [Qs]() {
        return this.entries();
      }
      static [Ys](o3) {
        return o3 && typeof o3 == "object" && o3[Wt] === "FormData" && !Gs.some((a) => typeof o3[a] != "function");
      }
      append(...o3) {
        Ue("append", arguments, 2), O(this, ee).push(Si(...o3));
      }
      delete(o3) {
        Ue("delete", arguments, 1), o3 += "", X(this, ee, O(this, ee).filter(([a]) => a !== o3));
      }
      get(o3) {
        Ue("get", arguments, 1), o3 += "";
        for (var a = O(this, ee), f2 = a.length, l = 0; l < f2; l++) if (a[l][0] === o3) return a[l][1];
        return null;
      }
      getAll(o3, a) {
        return Ue("getAll", arguments, 1), a = [], o3 += "", O(this, ee).forEach((f2) => f2[0] === o3 && a.push(f2[1])), a;
      }
      has(o3) {
        return Ue("has", arguments, 1), o3 += "", O(this, ee).some((a) => a[0] === o3);
      }
      forEach(o3, a) {
        Ue("forEach", arguments, 1);
        for (var [f2, l] of this) o3.call(a, l, f2, this);
      }
      set(...o3) {
        Ue("set", arguments, 2);
        var a = [], f2 = true;
        o3 = Si(...o3), O(this, ee).forEach((l) => {
          l[0] === o3[0] ? f2 && (f2 = !a.push(o3)) : a.push(l);
        }), f2 && a.push(o3), X(this, ee, a);
      }
      *entries() {
        yield* O(this, ee);
      }
      *keys() {
        for (var [o3] of this) yield o3;
      }
      *values() {
        for (var [, o3] of this) yield o3;
      }
    }, ee = /* @__PURE__ */ new WeakMap(), n2(yt, "FormData"), yt);
    n2(Zs, "formDataToBlob");
    Un = class Un2 extends Error {
      constructor(o3, a) {
        super(o3), Error.captureStackTrace(this, this.constructor), this.type = a;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    n2(Un, "FetchBaseError");
    ft = Un;
    xn = class xn2 extends ft {
      constructor(o3, a, f2) {
        super(o3, a), f2 && (this.code = this.errno = f2.code, this.erroredSysCall = f2.syscall);
      }
    };
    n2(xn, "FetchError");
    G = xn;
    mr = Symbol.toStringTag;
    wi = n2((i) => typeof i == "object" && typeof i.append == "function" && typeof i.delete == "function" && typeof i.get == "function" && typeof i.getAll == "function" && typeof i.has == "function" && typeof i.set == "function" && typeof i.sort == "function" && i[mr] === "URLSearchParams", "isURLSearchParameters");
    yr = n2((i) => i && typeof i == "object" && typeof i.arrayBuffer == "function" && typeof i.type == "string" && typeof i.stream == "function" && typeof i.constructor == "function" && /^(Blob|File)$/.test(i[mr]), "isBlob");
    Ks = n2((i) => typeof i == "object" && (i[mr] === "AbortSignal" || i[mr] === "EventTarget"), "isAbortSignal");
    Js = n2((i, o3) => {
      const a = new URL(o3).hostname, f2 = new URL(i).hostname;
      return a === f2 || a.endsWith(`.${f2}`);
    }, "isDomainOrSubdomain");
    Xs = n2((i, o3) => {
      const a = new URL(o3).protocol, f2 = new URL(i).protocol;
      return a === f2;
    }, "isSameProtocol");
    el = (0, import_node_util.promisify)(import_node_stream.default.pipeline);
    H = Symbol("Body internals");
    Nn = class Nn2 {
      constructor(o3, { size: a = 0 } = {}) {
        let f2 = null;
        o3 === null ? o3 = null : wi(o3) ? o3 = import_node_buffer.Buffer.from(o3.toString()) : yr(o3) || import_node_buffer.Buffer.isBuffer(o3) || (import_node_util.types.isAnyArrayBuffer(o3) ? o3 = import_node_buffer.Buffer.from(o3) : ArrayBuffer.isView(o3) ? o3 = import_node_buffer.Buffer.from(o3.buffer, o3.byteOffset, o3.byteLength) : o3 instanceof import_node_stream.default || (o3 instanceof br ? (o3 = Zs(o3), f2 = o3.type.split("=")[1]) : o3 = import_node_buffer.Buffer.from(String(o3))));
        let l = o3;
        import_node_buffer.Buffer.isBuffer(o3) ? l = import_node_stream.default.Readable.from(o3) : yr(o3) && (l = import_node_stream.default.Readable.from(o3.stream())), this[H] = { body: o3, stream: l, boundary: f2, disturbed: false, error: null }, this.size = a, o3 instanceof import_node_stream.default && o3.on("error", (p2) => {
          const h2 = p2 instanceof ft ? p2 : new G(`Invalid response body while trying to fetch ${this.url}: ${p2.message}`, "system", p2);
          this[H].error = h2;
        });
      }
      get body() {
        return this[H].stream;
      }
      get bodyUsed() {
        return this[H].disturbed;
      }
      async arrayBuffer() {
        const { buffer: o3, byteOffset: a, byteLength: f2 } = await zn(this);
        return o3.slice(a, a + f2);
      }
      async formData() {
        const o3 = this.headers.get("content-type");
        if (o3.startsWith("application/x-www-form-urlencoded")) {
          const f2 = new br(), l = new URLSearchParams(await this.text());
          for (const [p2, h2] of l) f2.append(p2, h2);
          return f2;
        }
        const { toFormData: a } = await Promise.resolve().then(() => (init_multipart_parser(), multipart_parser_exports));
        return a(this.body, o3);
      }
      async blob() {
        const o3 = this.headers && this.headers.get("content-type") || this[H].body && this[H].body.type || "", a = await this.arrayBuffer();
        return new ut([a], { type: o3 });
      }
      async json() {
        const o3 = await this.text();
        return JSON.parse(o3);
      }
      async text() {
        const o3 = await zn(this);
        return new TextDecoder().decode(o3);
      }
      buffer() {
        return zn(this);
      }
    };
    n2(Nn, "Body");
    xe = Nn;
    xe.prototype.buffer = (0, import_node_util.deprecate)(xe.prototype.buffer, "Please use 'response.arrayBuffer()' instead of 'response.buffer()'", "node-fetch#buffer"), Object.defineProperties(xe.prototype, { body: { enumerable: true }, bodyUsed: { enumerable: true }, arrayBuffer: { enumerable: true }, blob: { enumerable: true }, json: { enumerable: true }, text: { enumerable: true }, data: { get: (0, import_node_util.deprecate)(() => {
    }, "data doesn't exist, use json(), text(), arrayBuffer(), or body instead", "https://github.com/node-fetch/node-fetch/issues/1000 (response)") } });
    n2(zn, "consumeBody");
    In = n2((i, o3) => {
      let a, f2, { body: l } = i[H];
      if (i.bodyUsed) throw new Error("cannot clone body after it is used");
      return l instanceof import_node_stream.default && typeof l.getBoundary != "function" && (a = new import_node_stream.PassThrough({ highWaterMark: o3 }), f2 = new import_node_stream.PassThrough({ highWaterMark: o3 }), l.pipe(a), l.pipe(f2), i[H].stream = a, l = f2), l;
    }, "clone");
    tl = (0, import_node_util.deprecate)((i) => i.getBoundary(), "form-data doesn't follow the spec and requires special treatment. Use alternative package", "https://github.com/node-fetch/node-fetch/issues/1167");
    Ri = n2((i, o3) => i === null ? null : typeof i == "string" ? "text/plain;charset=UTF-8" : wi(i) ? "application/x-www-form-urlencoded;charset=UTF-8" : yr(i) ? i.type || null : import_node_buffer.Buffer.isBuffer(i) || import_node_util.types.isAnyArrayBuffer(i) || ArrayBuffer.isView(i) ? null : i instanceof br ? `multipart/form-data; boundary=${o3[H].boundary}` : i && typeof i.getBoundary == "function" ? `multipart/form-data;boundary=${tl(i)}` : i instanceof import_node_stream.default ? null : "text/plain;charset=UTF-8", "extractContentType");
    rl = n2((i) => {
      const { body: o3 } = i[H];
      return o3 === null ? 0 : yr(o3) ? o3.size : import_node_buffer.Buffer.isBuffer(o3) ? o3.length : o3 && typeof o3.getLengthSync == "function" && o3.hasKnownLength && o3.hasKnownLength() ? o3.getLengthSync() : null;
    }, "getTotalBytes");
    nl = n2(async (i, { body: o3 }) => {
      o3 === null ? i.end() : await el(o3, i);
    }, "writeToStream");
    gr = typeof import_node_http.default.validateHeaderName == "function" ? import_node_http.default.validateHeaderName : (i) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(i)) {
        const o3 = new TypeError(`Header name must be a valid HTTP token [${i}]`);
        throw Object.defineProperty(o3, "code", { value: "ERR_INVALID_HTTP_TOKEN" }), o3;
      }
    };
    Fn = typeof import_node_http.default.validateHeaderValue == "function" ? import_node_http.default.validateHeaderValue : (i, o3) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(o3)) {
        const a = new TypeError(`Invalid character in header content ["${i}"]`);
        throw Object.defineProperty(a, "code", { value: "ERR_INVALID_CHAR" }), a;
      }
    };
    Pr = class Pr2 extends URLSearchParams {
      constructor(o3) {
        let a = [];
        if (o3 instanceof Pr2) {
          const f2 = o3.raw();
          for (const [l, p2] of Object.entries(f2)) a.push(...p2.map((h2) => [l, h2]));
        } else if (o3 != null) if (typeof o3 == "object" && !import_node_util.types.isBoxedPrimitive(o3)) {
          const f2 = o3[Symbol.iterator];
          if (f2 == null) a.push(...Object.entries(o3));
          else {
            if (typeof f2 != "function") throw new TypeError("Header pairs must be iterable");
            a = [...o3].map((l) => {
              if (typeof l != "object" || import_node_util.types.isBoxedPrimitive(l)) throw new TypeError("Each header pair must be an iterable object");
              return [...l];
            }).map((l) => {
              if (l.length !== 2) throw new TypeError("Each header pair must be a name/value tuple");
              return [...l];
            });
          }
        } else throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        return a = a.length > 0 ? a.map(([f2, l]) => (gr(f2), Fn(f2, String(l)), [String(f2).toLowerCase(), String(l)])) : void 0, super(a), new Proxy(this, { get(f2, l, p2) {
          switch (l) {
            case "append":
            case "set":
              return (h2, S) => (gr(h2), Fn(h2, String(S)), URLSearchParams.prototype[l].call(f2, String(h2).toLowerCase(), String(S)));
            case "delete":
            case "has":
            case "getAll":
              return (h2) => (gr(h2), URLSearchParams.prototype[l].call(f2, String(h2).toLowerCase()));
            case "keys":
              return () => (f2.sort(), new Set(URLSearchParams.prototype.keys.call(f2)).keys());
            default:
              return Reflect.get(f2, l, p2);
          }
        } });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(o3) {
        const a = this.getAll(o3);
        if (a.length === 0) return null;
        let f2 = a.join(", ");
        return /^content-encoding$/i.test(o3) && (f2 = f2.toLowerCase()), f2;
      }
      forEach(o3, a = void 0) {
        for (const f2 of this.keys()) Reflect.apply(o3, a, [this.get(f2), f2, this]);
      }
      *values() {
        for (const o3 of this.keys()) yield this.get(o3);
      }
      *entries() {
        for (const o3 of this.keys()) yield [o3, this.get(o3)];
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((o3, a) => (o3[a] = this.getAll(a), o3), {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((o3, a) => {
          const f2 = this.getAll(a);
          return a === "host" ? o3[a] = f2[0] : o3[a] = f2.length > 1 ? f2 : f2[0], o3;
        }, {});
      }
    };
    n2(Pr, "Headers");
    ye = Pr;
    Object.defineProperties(ye.prototype, ["get", "entries", "forEach", "values"].reduce((i, o3) => (i[o3] = { enumerable: true }, i), {}));
    n2(ol, "fromRawHeaders");
    il = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
    jn = n2((i) => il.has(i), "isRedirect");
    se = Symbol("Response internals");
    Ne = class Ne2 extends xe {
      constructor(o3 = null, a = {}) {
        super(o3, a);
        const f2 = a.status != null ? a.status : 200, l = new ye(a.headers);
        if (o3 !== null && !l.has("Content-Type")) {
          const p2 = Ri(o3, this);
          p2 && l.append("Content-Type", p2);
        }
        this[se] = { type: "default", url: a.url, status: f2, statusText: a.statusText || "", headers: l, counter: a.counter, highWaterMark: a.highWaterMark };
      }
      get type() {
        return this[se].type;
      }
      get url() {
        return this[se].url || "";
      }
      get status() {
        return this[se].status;
      }
      get ok() {
        return this[se].status >= 200 && this[se].status < 300;
      }
      get redirected() {
        return this[se].counter > 0;
      }
      get statusText() {
        return this[se].statusText;
      }
      get headers() {
        return this[se].headers;
      }
      get highWaterMark() {
        return this[se].highWaterMark;
      }
      clone() {
        return new Ne2(In(this, this.highWaterMark), { type: this.type, url: this.url, status: this.status, statusText: this.statusText, headers: this.headers, ok: this.ok, redirected: this.redirected, size: this.size, highWaterMark: this.highWaterMark });
      }
      static redirect(o3, a = 302) {
        if (!jn(a)) throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        return new Ne2(null, { headers: { location: new URL(o3).toString() }, status: a });
      }
      static error() {
        const o3 = new Ne2(null, { status: 0, statusText: "" });
        return o3[se].type = "error", o3;
      }
      static json(o3 = void 0, a = {}) {
        const f2 = JSON.stringify(o3);
        if (f2 === void 0) throw new TypeError("data is not JSON serializable");
        const l = new ye(a && a.headers);
        return l.has("content-type") || l.set("content-type", "application/json"), new Ne2(f2, { ...a, headers: l });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    n2(Ne, "Response");
    le = Ne;
    Object.defineProperties(le.prototype, { type: { enumerable: true }, url: { enumerable: true }, status: { enumerable: true }, ok: { enumerable: true }, redirected: { enumerable: true }, statusText: { enumerable: true }, headers: { enumerable: true }, clone: { enumerable: true } });
    al = n2((i) => {
      if (i.search) return i.search;
      const o3 = i.href.length - 1, a = i.hash || (i.href[o3] === "#" ? "#" : "");
      return i.href[o3 - a.length] === "?" ? "?" : "";
    }, "getSearch");
    n2(Ti, "stripURLForUseAsAReferrer");
    Ci = /* @__PURE__ */ new Set(["", "no-referrer", "no-referrer-when-downgrade", "same-origin", "origin", "strict-origin", "origin-when-cross-origin", "strict-origin-when-cross-origin", "unsafe-url"]);
    sl = "strict-origin-when-cross-origin";
    n2(ll, "validateReferrerPolicy");
    n2(ul, "isOriginPotentiallyTrustworthy");
    n2(ct, "isUrlPotentiallyTrustworthy");
    n2(fl, "determineRequestsReferrer");
    n2(cl, "parseReferrerPolicyFromHeader");
    $2 = Symbol("Request internals");
    qt = n2((i) => typeof i == "object" && typeof i[$2] == "object", "isRequest");
    dl = (0, import_node_util.deprecate)(() => {
    }, ".data is not a valid RequestInit property, use .body instead", "https://github.com/node-fetch/node-fetch/issues/1000 (request)");
    vr = class vr2 extends xe {
      constructor(o3, a = {}) {
        let f2;
        if (qt(o3) ? f2 = new URL(o3.url) : (f2 = new URL(o3), o3 = {}), f2.username !== "" || f2.password !== "") throw new TypeError(`${f2} is an url with embedded credentials.`);
        let l = a.method || o3.method || "GET";
        if (/^(delete|get|head|options|post|put)$/i.test(l) && (l = l.toUpperCase()), !qt(a) && "data" in a && dl(), (a.body != null || qt(o3) && o3.body !== null) && (l === "GET" || l === "HEAD")) throw new TypeError("Request with GET/HEAD method cannot have body");
        const p2 = a.body ? a.body : qt(o3) && o3.body !== null ? In(o3) : null;
        super(p2, { size: a.size || o3.size || 0 });
        const h2 = new ye(a.headers || o3.headers || {});
        if (p2 !== null && !h2.has("Content-Type")) {
          const w2 = Ri(p2, this);
          w2 && h2.set("Content-Type", w2);
        }
        let S = qt(o3) ? o3.signal : null;
        if ("signal" in a && (S = a.signal), S != null && !Ks(S)) throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
        let v2 = a.referrer == null ? o3.referrer : a.referrer;
        if (v2 === "") v2 = "no-referrer";
        else if (v2) {
          const w2 = new URL(v2);
          v2 = /^about:(\/\/)?client$/.test(w2) ? "client" : w2;
        } else v2 = void 0;
        this[$2] = { method: l, redirect: a.redirect || o3.redirect || "follow", headers: h2, parsedURL: f2, signal: S, referrer: v2 }, this.follow = a.follow === void 0 ? o3.follow === void 0 ? 20 : o3.follow : a.follow, this.compress = a.compress === void 0 ? o3.compress === void 0 ? true : o3.compress : a.compress, this.counter = a.counter || o3.counter || 0, this.agent = a.agent || o3.agent, this.highWaterMark = a.highWaterMark || o3.highWaterMark || 16384, this.insecureHTTPParser = a.insecureHTTPParser || o3.insecureHTTPParser || false, this.referrerPolicy = a.referrerPolicy || o3.referrerPolicy || "";
      }
      get method() {
        return this[$2].method;
      }
      get url() {
        return (0, import_node_url.format)(this[$2].parsedURL);
      }
      get headers() {
        return this[$2].headers;
      }
      get redirect() {
        return this[$2].redirect;
      }
      get signal() {
        return this[$2].signal;
      }
      get referrer() {
        if (this[$2].referrer === "no-referrer") return "";
        if (this[$2].referrer === "client") return "about:client";
        if (this[$2].referrer) return this[$2].referrer.toString();
      }
      get referrerPolicy() {
        return this[$2].referrerPolicy;
      }
      set referrerPolicy(o3) {
        this[$2].referrerPolicy = ll(o3);
      }
      clone() {
        return new vr2(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    n2(vr, "Request");
    dt = vr;
    Object.defineProperties(dt.prototype, { method: { enumerable: true }, url: { enumerable: true }, headers: { enumerable: true }, redirect: { enumerable: true }, clone: { enumerable: true }, signal: { enumerable: true }, referrer: { enumerable: true }, referrerPolicy: { enumerable: true } });
    hl = n2((i) => {
      const { parsedURL: o3 } = i[$2], a = new ye(i[$2].headers);
      a.has("Accept") || a.set("Accept", "*/*");
      let f2 = null;
      if (i.body === null && /^(post|put)$/i.test(i.method) && (f2 = "0"), i.body !== null) {
        const S = rl(i);
        typeof S == "number" && !Number.isNaN(S) && (f2 = String(S));
      }
      f2 && a.set("Content-Length", f2), i.referrerPolicy === "" && (i.referrerPolicy = sl), i.referrer && i.referrer !== "no-referrer" ? i[$2].referrer = fl(i) : i[$2].referrer = "no-referrer", i[$2].referrer instanceof URL && a.set("Referer", i.referrer), a.has("User-Agent") || a.set("User-Agent", "node-fetch"), i.compress && !a.has("Accept-Encoding") && a.set("Accept-Encoding", "gzip, deflate, br");
      let { agent: l } = i;
      typeof l == "function" && (l = l(o3));
      const p2 = al(o3), h2 = { path: o3.pathname + p2, method: i.method, headers: a[Symbol.for("nodejs.util.inspect.custom")](), insecureHTTPParser: i.insecureHTTPParser, agent: l };
      return { parsedURL: o3, options: h2 };
    }, "getNodeRequestOptions");
    Hn = class Hn2 extends ft {
      constructor(o3, a = "aborted") {
        super(o3, a);
      }
    };
    n2(Hn, "AbortError");
    _r = Hn;
    n2(pl, "requireNodeDomexception");
    bl = pl();
    ml = f(bl);
    ({ stat: $n } = import_node_fs3.promises);
    yl = n2((i, o3) => vi((0, import_node_fs3.statSync)(i), i, o3), "blobFromSync");
    gl = n2((i, o3) => $n(i).then((a) => vi(a, i, o3)), "blobFrom");
    _l = n2((i, o3) => $n(i).then((a) => Ei(a, i, o3)), "fileFrom");
    Sl = n2((i, o3) => Ei((0, import_node_fs3.statSync)(i), i, o3), "fileFromSync");
    vi = n2((i, o3, a = "") => new ut([new Sr({ path: o3, size: i.size, lastModified: i.mtimeMs, start: 0 })], { type: a }), "fromBlob");
    Ei = n2((i, o3, a = "") => new qn([new Sr({ path: o3, size: i.size, lastModified: i.mtimeMs, start: 0 })], (0, import_node_path2.basename)(o3), { type: a, lastModified: i.mtimeMs }), "fromFile");
    Er = class Er2 {
      constructor(o3) {
        be(this, He);
        be(this, Ve);
        X(this, He, o3.path), X(this, Ve, o3.start), this.size = o3.size, this.lastModified = o3.lastModified;
      }
      slice(o3, a) {
        return new Er2({ path: O(this, He), lastModified: this.lastModified, size: a - o3, start: O(this, Ve) + o3 });
      }
      async *stream() {
        const { mtimeMs: o3 } = await $n(O(this, He));
        if (o3 > this.lastModified) throw new ml("The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.", "NotReadableError");
        yield* (0, import_node_fs3.createReadStream)(O(this, He), { start: O(this, Ve), end: O(this, Ve) + this.size - 1 });
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
    };
    He = /* @__PURE__ */ new WeakMap(), Ve = /* @__PURE__ */ new WeakMap(), n2(Er, "BlobDataItem");
    Sr = Er;
    wl = /* @__PURE__ */ new Set(["data:", "http:", "https:"]);
    n2(Ai, "fetch$1");
    n2(Rl, "fixResponseChunkedTransferBadEnding");
    Bi = /* @__PURE__ */ new WeakMap();
    Dn = /* @__PURE__ */ new WeakMap();
    n2(W, "pd");
    n2(ki, "setCancelFlag");
    n2(ht, "Event"), ht.prototype = { get type() {
      return W(this).event.type;
    }, get target() {
      return W(this).eventTarget;
    }, get currentTarget() {
      return W(this).currentTarget;
    }, composedPath() {
      const i = W(this).currentTarget;
      return i == null ? [] : [i];
    }, get NONE() {
      return 0;
    }, get CAPTURING_PHASE() {
      return 1;
    }, get AT_TARGET() {
      return 2;
    }, get BUBBLING_PHASE() {
      return 3;
    }, get eventPhase() {
      return W(this).eventPhase;
    }, stopPropagation() {
      const i = W(this);
      i.stopped = true, typeof i.event.stopPropagation == "function" && i.event.stopPropagation();
    }, stopImmediatePropagation() {
      const i = W(this);
      i.stopped = true, i.immediateStopped = true, typeof i.event.stopImmediatePropagation == "function" && i.event.stopImmediatePropagation();
    }, get bubbles() {
      return !!W(this).event.bubbles;
    }, get cancelable() {
      return !!W(this).event.cancelable;
    }, preventDefault() {
      ki(W(this));
    }, get defaultPrevented() {
      return W(this).canceled;
    }, get composed() {
      return !!W(this).event.composed;
    }, get timeStamp() {
      return W(this).timeStamp;
    }, get srcElement() {
      return W(this).eventTarget;
    }, get cancelBubble() {
      return W(this).stopped;
    }, set cancelBubble(i) {
      if (!i) return;
      const o3 = W(this);
      o3.stopped = true, typeof o3.event.cancelBubble == "boolean" && (o3.event.cancelBubble = true);
    }, get returnValue() {
      return !W(this).canceled;
    }, set returnValue(i) {
      i || ki(W(this));
    }, initEvent() {
    } }, Object.defineProperty(ht.prototype, "constructor", { value: ht, configurable: true, writable: true }), typeof window < "u" && typeof window.Event < "u" && (Object.setPrototypeOf(ht.prototype, window.Event.prototype), Dn.set(window.Event.prototype, ht));
    n2(Wi, "defineRedirectDescriptor");
    n2(Tl, "defineCallDescriptor");
    n2(Cl, "defineWrapper");
    n2(qi, "getWrapper");
    n2(Pl, "wrapEvent");
    n2(vl, "isStopped");
    n2(El, "setEventPhase");
    n2(Al, "setCurrentTarget");
    n2(Oi, "setPassiveListener");
    zi = /* @__PURE__ */ new WeakMap();
    Ii = 1;
    Fi = 2;
    wr = 3;
    n2(Rr, "isObject");
    n2(Ot, "getListeners");
    n2(Bl, "defineEventAttributeDescriptor");
    n2(ji, "defineEventAttribute");
    n2(Li, "defineCustomEventTarget");
    n2(Pe, "EventTarget"), Pe.prototype = { addEventListener(i, o3, a) {
      if (o3 == null) return;
      if (typeof o3 != "function" && !Rr(o3)) throw new TypeError("'listener' should be a function or an object.");
      const f2 = Ot(this), l = Rr(a), h2 = (l ? !!a.capture : !!a) ? Ii : Fi, S = { listener: o3, listenerType: h2, passive: l && !!a.passive, once: l && !!a.once, next: null };
      let v2 = f2.get(i);
      if (v2 === void 0) {
        f2.set(i, S);
        return;
      }
      let w2 = null;
      for (; v2 != null; ) {
        if (v2.listener === o3 && v2.listenerType === h2) return;
        w2 = v2, v2 = v2.next;
      }
      w2.next = S;
    }, removeEventListener(i, o3, a) {
      if (o3 == null) return;
      const f2 = Ot(this), p2 = (Rr(a) ? !!a.capture : !!a) ? Ii : Fi;
      let h2 = null, S = f2.get(i);
      for (; S != null; ) {
        if (S.listener === o3 && S.listenerType === p2) {
          h2 !== null ? h2.next = S.next : S.next !== null ? f2.set(i, S.next) : f2.delete(i);
          return;
        }
        h2 = S, S = S.next;
      }
    }, dispatchEvent(i) {
      if (i == null || typeof i.type != "string") throw new TypeError('"event.type" should be a string.');
      const o3 = Ot(this), a = i.type;
      let f2 = o3.get(a);
      if (f2 == null) return true;
      const l = Pl(this, i);
      let p2 = null;
      for (; f2 != null; ) {
        if (f2.once ? p2 !== null ? p2.next = f2.next : f2.next !== null ? o3.set(a, f2.next) : o3.delete(a) : p2 = f2, Oi(l, f2.passive ? f2.listener : null), typeof f2.listener == "function") try {
          f2.listener.call(this, l);
        } catch (h2) {
          typeof console < "u" && typeof console.error == "function" && console.error(h2);
        }
        else f2.listenerType !== wr && typeof f2.listener.handleEvent == "function" && f2.listener.handleEvent(l);
        if (vl(l)) break;
        f2 = f2.next;
      }
      return Oi(l, null), El(l, 0), Al(l, null), !l.defaultPrevented;
    } }, Object.defineProperty(Pe.prototype, "constructor", { value: Pe, configurable: true, writable: true }), typeof window < "u" && typeof window.EventTarget < "u" && Object.setPrototypeOf(Pe.prototype, window.EventTarget.prototype);
    Vn = class Vn2 extends Pe {
      constructor() {
        throw super(), new TypeError("AbortSignal cannot be constructed directly");
      }
      get aborted() {
        const o3 = Tr.get(this);
        if (typeof o3 != "boolean") throw new TypeError(`Expected 'this' to be an 'AbortSignal' object, but got ${this === null ? "null" : typeof this}`);
        return o3;
      }
    };
    n2(Vn, "AbortSignal");
    pt = Vn;
    ji(pt.prototype, "abort");
    n2(kl, "createAbortSignal");
    n2(Wl, "abortSignal");
    Tr = /* @__PURE__ */ new WeakMap();
    Object.defineProperties(pt.prototype, { aborted: { enumerable: true } }), typeof Symbol == "function" && typeof Symbol.toStringTag == "symbol" && Object.defineProperty(pt.prototype, Symbol.toStringTag, { configurable: true, value: "AbortSignal" });
    Mn = (gt = class {
      constructor() {
        $i.set(this, kl());
      }
      get signal() {
        return Di(this);
      }
      abort() {
        Wl(Di(this));
      }
    }, n2(gt, "AbortController"), gt);
    $i = /* @__PURE__ */ new WeakMap();
    n2(Di, "getSignal"), Object.defineProperties(Mn.prototype, { signal: { enumerable: true }, abort: { enumerable: true } }), typeof Symbol == "function" && typeof Symbol.toStringTag == "symbol" && Object.defineProperty(Mn.prototype, Symbol.toStringTag, { configurable: true, value: "AbortController" });
    ql = Object.defineProperty;
    Ol = n2((i, o3) => ql(i, "name", { value: o3, configurable: true }), "e");
    Mi = Ai;
    Ui();
    n2(Ui, "s"), Ol(Ui, "checkNodeEnvironment");
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  OpenCodeGeminiA2AProvider: () => OpenCodeGeminiA2AProvider,
  ServerManager: () => ServerManager,
  StaticModelRegistry: () => StaticModelRegistry,
  createGeminiA2AProvider: () => createGeminiA2AProvider,
  createProvider: () => createProvider,
  default: () => index_default,
  opencodeGeminicliA2a: () => opencodeGeminicliA2a,
  provider: () => provider,
  sharedSessionStore: () => sharedSessionStore
});
module.exports = __toCommonJS(index_exports);

// src/provider.ts
var import_node_crypto3 = __toESM(require("node:crypto"), 1);

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k2) => typeof obj[obj[k2]] !== "number");
    const filtered = {};
    for (const k2 of validKeys) {
      filtered[k2] = obj[k2];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t3 = typeof data;
  switch (t3) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el2 = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el2] = curr[el2] || { _errors: [] };
            } else {
              curr[el2] = curr[el2] || { _errors: [] };
              curr[el2]._errors.push(mapper(issue));
            }
            curr = curr[el2];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path3, errorMaps, issueData } = params;
  const fullPath = [...path3, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m2) => !!m2).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x2) => !!x2)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x2) => x2.status === "aborted";
var isDirty = (x2) => x2.status === "dirty";
var isValid = (x2) => x2.status === "valid";
var isAsync = (x2) => typeof Promise !== "undefined" && x2 instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path3, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path3;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x2) => !!x2);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x2) => !!x2),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x2) => !!x2),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me2 = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me2._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me2._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me2 = this;
      return OK(function(...args) {
        const parsedArgs = me2._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me2._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p2 = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p22 = typeof p2 === "string" ? { message: p2 } : p2;
  return p22;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r3 = check(data);
      if (r3 instanceof Promise) {
        return r3.then((r4) => {
          if (!r4) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r3) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;

// src/schemas.ts
var ConfigSchema = external_exports.object({
  host: external_exports.string().default("127.0.0.1"),
  port: external_exports.number().int().min(1).max(65535).default(41242),
  token: external_exports.string().optional(),
  protocol: external_exports.enum(["http", "https"]).default("http")
});
var LiteLLMProxyConfigSchema = external_exports.object({
  url: external_exports.string().url(),
  apiKey: external_exports.string().optional()
});
var GenerationConfigSchema = external_exports.object({
  temperature: external_exports.number().optional(),
  topP: external_exports.number().optional(),
  topK: external_exports.number().optional(),
  maxOutputTokens: external_exports.number().optional(),
  stopSequences: external_exports.array(external_exports.string()).optional(),
  presencePenalty: external_exports.number().optional(),
  frequencyPenalty: external_exports.number().optional(),
  seed: external_exports.number().optional(),
  responseFormat: external_exports.any().optional()
});
var ModelConfigSchema = external_exports.object({
  options: external_exports.object({
    generationConfig: GenerationConfigSchema.optional()
  }).passthrough().optional()
}).passthrough();
var AgentEndpointSchema = ConfigSchema.extend({
  key: external_exports.string().min(1),
  // models: string array (backwards compat) or Record<string, ModelConfig | boolean>
  models: external_exports.union([
    external_exports.array(external_exports.string()),
    external_exports.record(external_exports.union([external_exports.boolean(), ModelConfigSchema]))
  ]).default([])
});
var ToolSchema = external_exports.object({}).passthrough();
var A2AJsonRpcRequestSchema = external_exports.object({
  jsonrpc: external_exports.literal("2.0"),
  id: external_exports.union([external_exports.string(), external_exports.number(), external_exports.null()]),
  method: external_exports.literal("message/stream"),
  params: external_exports.object({
    message: external_exports.object({
      messageId: external_exports.string(),
      role: external_exports.enum(["user", "assistant"]),
      parts: external_exports.array(external_exports.discriminatedUnion("kind", [
        external_exports.object({
          kind: external_exports.literal("text"),
          text: external_exports.string()
        }),
        external_exports.object({
          kind: external_exports.literal("file"),
          file: external_exports.object({
            name: external_exports.string().optional(),
            mimeType: external_exports.string().optional(),
            fileWithBytes: external_exports.string().optional(),
            uri: external_exports.string().optional()
          }).passthrough().refine(
            (obj) => Boolean(obj.fileWithBytes) || Boolean(obj.uri),
            { message: "file must contain at least one of fileWithBytes, or uri" }
          )
        }),
        external_exports.object({
          kind: external_exports.literal("image"),
          image: external_exports.object({
            mimeType: external_exports.string().optional(),
            bytes: external_exports.string().optional(),
            uri: external_exports.string().optional()
          }).passthrough().refine(
            (obj) => Boolean(obj.bytes) || Boolean(obj.uri),
            { message: "image must contain at least one of bytes, or uri" }
          )
        })
      ]))
    }),
    configuration: external_exports.object({
      blocking: external_exports.boolean().default(false),
      tools: external_exports.array(ToolSchema).optional()
    }).optional(),
    // generationConfig: モデルの挙動を微調整する設定（温度感など）
    generationConfig: GenerationConfigSchema.optional(),
    // dynamic model: リクエスト単位でモデルIDを指定（サーバー起動時のデフォルトを上書き）
    model: external_exports.string().optional(),
    // multi-turn: コンテキスト継続時に使用
    contextId: external_exports.string().optional(),
    // multi-turn: 既存タスクの継続時に使用
    taskId: external_exports.string().optional()
  })
});
var STATUS_STATES = ["submitted", "queued", "working", "stop", "error", "input-required", "completed", "failed", "tool_calls", "cancelled", "timeout", "aborted", "length", "max_tokens", "content_filter", "blocked"];
var metadataSchema = external_exports.object({
  coderAgent: external_exports.object({
    kind: external_exports.string()
  }).optional()
}).passthrough().optional();
var A2AResponseResultSchema = external_exports.union([
  external_exports.object({
    kind: external_exports.literal("task"),
    id: external_exports.string(),
    contextId: external_exports.string(),
    status: external_exports.object({ state: external_exports.union([external_exports.enum(STATUS_STATES), external_exports.string()]) }),
    history: external_exports.array(external_exports.any()).optional(),
    metadata: metadataSchema,
    artifacts: external_exports.array(external_exports.any()).optional()
  }),
  external_exports.object({
    kind: external_exports.literal("status-update"),
    taskId: external_exports.string(),
    contextId: external_exports.string().optional(),
    status: external_exports.object({
      state: external_exports.union([external_exports.enum(STATUS_STATES), external_exports.string()]),
      message: external_exports.object({
        parts: external_exports.array(external_exports.object({
          kind: external_exports.string(),
          text: external_exports.string().optional(),
          data: external_exports.unknown().optional(),
          // マルチモーダル対応: A2A レスポンス内の画像パーツ
          image: external_exports.object({
            mimeType: external_exports.string().optional(),
            bytes: external_exports.string().optional(),
            uri: external_exports.string().optional()
          }).optional(),
          // マルチモーダル対応: A2A レスポンス内のファイルパーツ
          file: external_exports.object({
            name: external_exports.string().optional(),
            mimeType: external_exports.string().optional(),
            fileWithBytes: external_exports.string().optional(),
            uri: external_exports.string().optional()
          }).optional()
        }))
      }).optional(),
      timestamp: external_exports.string().optional()
    }),
    final: external_exports.boolean().optional(),
    inputRequired: external_exports.boolean().optional(),
    metadata: metadataSchema,
    usage: external_exports.object({
      promptTokens: external_exports.number().optional(),
      completionTokens: external_exports.number().optional()
    }).optional()
  }).passthrough(),
  external_exports.object({
    kind: external_exports.literal("artifact-update"),
    taskId: external_exports.string(),
    contextId: external_exports.string().optional(),
    artifact: external_exports.any().optional()
  })
]);
var ResultResponseSchema = external_exports.object({
  jsonrpc: external_exports.literal("2.0"),
  id: external_exports.union([external_exports.string(), external_exports.number(), external_exports.null()]),
  result: A2AResponseResultSchema,
  error: external_exports.undefined().optional()
}).passthrough();
var ErrorResponseSchema = external_exports.object({
  jsonrpc: external_exports.literal("2.0"),
  id: external_exports.union([external_exports.string(), external_exports.number(), external_exports.null()]),
  error: external_exports.object({
    code: external_exports.number(),
    message: external_exports.string(),
    data: external_exports.unknown().optional()
  }),
  result: external_exports.undefined().optional()
}).passthrough();
var RpcResponseSchema = external_exports.union([ResultResponseSchema, ErrorResponseSchema]);
var A2AJsonRpcResponseSchema = RpcResponseSchema;
var ToolMappingSchema = external_exports.record(external_exports.string());
var A2AStatusUpdateSchema = external_exports.object({
  kind: external_exports.literal("status-update"),
  taskId: external_exports.string().optional(),
  contextId: external_exports.string().optional(),
  status: external_exports.object({
    state: external_exports.string(),
    message: external_exports.any().optional()
  }).passthrough(),
  final: external_exports.boolean().optional(),
  inputRequired: external_exports.boolean().optional(),
  metadata: external_exports.any().optional()
}).passthrough();

// src/config.ts
var import_node_fs2 = require("node:fs");
var import_node_path = __toESM(require("node:path"), 1);

// src/utils/logger.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var Logger = class {
  static prefix = "[opencode-geminicli-a2a]";
  static logFile = "opencode.log";
  static get isDebug() {
    return !!process.env["DEBUG_OPENCODE"];
  }
  /**
   * ログをファイルに追記します。
   */
  static writeToFile(level, message, ...args) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const argStr = args.length > 0 ? " " + args.map((a) => {
      try {
        return typeof a === "object" ? JSON.stringify(a) : String(a);
      } catch (e) {
        return "[Circular or Non-Serializable]";
      }
    }).join(" ") : "";
    const line = `${timestamp} ${this.prefix} ${level}: ${message}${argStr}
`;
    try {
      import_node_fs.default.appendFileSync(this.logFile, line);
    } catch (e) {
    }
  }
  /**
   * デバッグ情報を出力します (DEBUG_OPENCODE=1 の場合のみ)
   */
  static debug(message, ...args) {
    if (this.isDebug) {
      this.writeToFile("DEBUG", message, ...args);
    }
  }
  /**
   * 一般的な情報を出力します (常にファイルへ出力)
   */
  static info(message, ...args) {
    this.writeToFile("INFO", message, ...args);
  }
  /**
   * 警告を出力します (常にファイルへ出力)
   */
  static warn(message, ...args) {
    this.writeToFile("WARN", message, ...args);
  }
  /**
   * エラーを出力します (常にファイルへ出力)
   */
  static error(message, ...args) {
    this.writeToFile("ERROR", message, ...args);
  }
};

// src/config.ts
var ExternalConfigSchema = external_exports.object({
  host: external_exports.string().optional(),
  port: external_exports.number().optional(),
  token: external_exports.string().optional(),
  protocol: external_exports.enum(["http", "https"]).optional(),
  agents: external_exports.array(AgentEndpointSchema).optional(),
  toolMapping: external_exports.record(external_exports.string()).optional(),
  internalTools: external_exports.array(external_exports.string()).optional(),
  litellmProxy: LiteLLMProxyConfigSchema.optional()
}).passthrough();
var ConfigManager = class _ConfigManager {
  static instance;
  externalConfig = {};
  configPath = import_node_path.default.resolve(process.cwd(), "a2a-config.json");
  watchers = /* @__PURE__ */ new Set();
  isWatching = false;
  configWatcher = null;
  _changeTimer = null;
  constructor() {
    this.load();
  }
  static getInstance() {
    if (!_ConfigManager.instance) {
      _ConfigManager.instance = new _ConfigManager();
    }
    return _ConfigManager.instance;
  }
  setConfigPath(p2) {
    const newPath = import_node_path.default.resolve(p2);
    if (this.configPath !== newPath) {
      this.stopWatch();
      this.configPath = newPath;
      this.load();
    }
  }
  getExternalConfig() {
    return this.externalConfig;
  }
  load() {
    if (!(0, import_node_fs2.existsSync)(this.configPath)) {
      return;
    }
    try {
      const content = (0, import_node_fs2.readFileSync)(this.configPath, "utf8");
      const parsed = JSON.parse(content);
      const validated = ExternalConfigSchema.parse(parsed);
      this.externalConfig = validated;
      Logger.info(`[ConfigManager] Loaded external config from ${this.configPath}`);
    } catch (err) {
      Logger.error(`[ConfigManager] Failed to load config from ${this.configPath} (previous config preserved):`, err);
    }
  }
  watch(enable) {
    if (!enable || this.isWatching || !(0, import_node_fs2.existsSync)(this.configPath)) return;
    this.isWatching = true;
    try {
      this.configWatcher = (0, import_node_fs2.watch)(this.configPath, (event) => {
        if (event === "change" || event === "rename") {
          if (this._changeTimer) clearTimeout(this._changeTimer);
          this._changeTimer = setTimeout(() => {
            Logger.info(`[ConfigManager] Config file ${event}, reloading...`);
            this.load();
            if (event === "rename" && (0, import_node_fs2.existsSync)(this.configPath)) {
              this.stopWatch();
              this.watch(true);
            }
            for (const cb of this.watchers) cb();
          }, 300);
        }
      });
    } catch (err) {
      Logger.error(`[ConfigManager] Failed to watch config file:`, err);
      this.isWatching = false;
    }
  }
  stopWatch() {
    if (this._changeTimer) {
      clearTimeout(this._changeTimer);
      this._changeTimer = null;
    }
    if (this.configWatcher) {
      this.configWatcher.close();
      this.configWatcher = null;
    }
    this.isWatching = false;
  }
  dispose() {
    this.stopWatch();
    this.watchers.clear();
    if (_ConfigManager.instance === this) {
      _ConfigManager.instance = void 0;
    }
  }
  /** テスト用: インスタンスをリセットする */
  static _reset() {
    _ConfigManager.instance?.dispose();
    _ConfigManager.instance = void 0;
  }
  onChange(cb) {
    this.watchers.add(cb);
    return () => this.watchers.delete(cb);
  }
};
function getNormalizedValue(val) {
  if (typeof val !== "string") return val === null ? void 0 : val;
  const trimmed = val.trim();
  if (trimmed === "" || trimmed === "undefined" || trimmed === "null") return void 0;
  return trimmed;
}
var parseSchema = external_exports.object({
  host: external_exports.string().optional(),
  port: external_exports.coerce.number().int().refine((n4) => Number.isFinite(n4) && n4 > 0 && n4 <= 65535, "invalid port").optional(),
  token: external_exports.string().optional(),
  protocol: external_exports.enum(["http", "https"]).optional(),
  showReasoning: external_exports.boolean().default(true),
  generationConfig: external_exports.object({
    temperature: external_exports.coerce.number().optional(),
    topP: external_exports.coerce.number().optional(),
    topK: external_exports.coerce.number().optional(),
    maxOutputTokens: external_exports.coerce.number().int().optional(),
    stopSequences: external_exports.array(external_exports.string()).optional(),
    presencePenalty: external_exports.coerce.number().optional(),
    frequencyPenalty: external_exports.coerce.number().optional(),
    seed: external_exports.coerce.number().int().optional(),
    responseFormat: external_exports.any().optional()
  }).optional(),
  litellmProxy: LiteLLMProxyConfigSchema.optional()
});
var DEFAULT_TOOL_MAPPING = {
  "read_file": "read",
  "write_file": "write",
  "run_shell_command": "bash",
  "bash": "bash",
  "list_directory": "glob",
  "read_multiple_files": "read_multiple_files",
  "create_directory": "create_directory",
  "search_files": "grep",
  "edit_file": "edit",
  "get_file_info": "get_file_info",
  "directory_tree": "glob",
  "move_file": "move_file"
};
function resolveConfig(options) {
  const manager = ConfigManager.getInstance();
  if (options?.configPath) manager.setConfigPath(options.configPath);
  if (options?.hotReload) manager.watch(true);
  const external = manager.getExternalConfig();
  const envHost = getNormalizedValue(process.env["GEMINI_A2A_HOST"]);
  const envPort = getNormalizedValue(process.env["GEMINI_A2A_PORT"]);
  const envToken = getNormalizedValue(process.env["GEMINI_A2A_TOKEN"]);
  const envProtocol = getNormalizedValue(process.env["GEMINI_A2A_PROTOCOL"]);
  const envLiteLLMUrl = getNormalizedValue(process.env["LITELLM_PROXY_URL"]);
  const envLiteLLMKey = getNormalizedValue(process.env["LITELLM_PROXY_API_KEY"]);
  const mergedConfig = {
    host: getNormalizedValue(options?.host) ?? external.host ?? envHost,
    port: getNormalizedValue(options?.port) ?? external.port ?? envPort,
    token: getNormalizedValue(options?.token) ?? external.token ?? envToken,
    protocol: getNormalizedValue(options?.protocol) ?? external.protocol ?? envProtocol,
    showReasoning: options?.showReasoning ?? true,
    generationConfig: options?.generationConfig,
    litellmProxy: options?.litellmProxy ?? external.litellmProxy ?? (envLiteLLMUrl ? { url: envLiteLLMUrl, apiKey: envLiteLLMKey } : void 0)
  };
  try {
    const parsedData = parseSchema.parse(mergedConfig);
    const baseConfig = ConfigSchema.parse(parsedData);
    return {
      ...baseConfig,
      generationConfig: parsedData.generationConfig,
      toolMapping: {
        ...DEFAULT_TOOL_MAPPING,
        ...external.toolMapping,
        ...options?.toolMapping
      },
      internalTools: options?.internalTools ?? external.internalTools,
      agents: options?.agents ?? external.agents,
      litellmProxy: parsedData.litellmProxy,
      showReasoning: parsedData.showReasoning
    };
  } catch (err) {
    if (err instanceof external_exports.ZodError) {
      const issues = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      const errorMsg = `Configuration validation failed: ${issues}. Current config: ${JSON.stringify(mergedConfig)}`;
      Logger.error(errorMsg);
      throw new Error(`[GeminiA2A] Invalid configuration: ${issues}`);
    }
    throw err;
  }
}

// node_modules/ofetch/dist/node.mjs
var import_node_http2 = __toESM(require("node:http"), 1);
var import_node_https2 = __toESM(require("node:https"), 1);

// node_modules/node-fetch-native/dist/index.mjs
init_node();
init_node();
init_node_fetch_native_DfbY2q_x();
var o2 = !!globalThis.process?.env?.FORCE_NODE_FETCH;
var r = !o2 && globalThis.fetch || Mi;
var p = !o2 && globalThis.Blob || ut;
var F3 = !o2 && globalThis.File || qn;
var h = !o2 && globalThis.FormData || br;
var n3 = !o2 && globalThis.Headers || ye;
var c = !o2 && globalThis.Request || dt;
var R2 = !o2 && globalThis.Response || le;
var T = !o2 && globalThis.AbortController || Mn;

// node_modules/destr/dist/index.mjs
var suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
var suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
var JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

// node_modules/ufo/dist/index.mjs
var r2 = String.fromCharCode;
var HASH_RE = /#/g;
var AMPERSAND_RE = /&/g;
var SLASH_RE = /\//g;
var EQUAL_RE = /=/g;
var PLUS_RE = /\+/g;
var ENC_CARET_RE = /%5e/gi;
var ENC_BACKTICK_RE = /%60/gi;
var ENC_PIPE_RE = /%7c/gi;
var ENC_SPACE_RE = /%20/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k2) => query[k2] !== void 0).map((k2) => encodeQueryItem(k2, query[k2])).filter(Boolean).join("&");
}
var PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
var PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
var PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
var TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
var JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path3 = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path3 = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
  }
  const [s0, ...s] = path3.split("?");
  const cleanPath = s0.endsWith("/") ? s0.slice(0, -1) : s0;
  return (cleanPath || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path3 = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path3 = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
    if (!path3) {
      return fragment;
    }
  }
  const [s0, ...s] = path3.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    const nextChar = input[_base.length];
    if (!nextChar || nextChar === "/" || nextChar === "?") {
      return input;
    }
  }
  return joinURL(_base, input);
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
var protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return defaultProto ? parseURL(defaultProto + input) : parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path3 = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path3 = path3.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path3);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

// node_modules/ofetch/dist/shared/ofetch.CWycOUEr.mjs
var FetchError = class extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
};
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}
var payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t3 = typeof value;
  if (t3 === "string" || t3 === "number" || t3 === "boolean" || t3 === null) {
    return true;
  }
  if (t3 !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
var textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
var JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (contentType === "text/event-stream") {
    return "stream";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers2) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers2
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers2) {
  if (!defaults) {
    return new Headers2(input);
  }
  const headers = new Headers2(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers2(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}
var retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
var nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch: fetch2 = globalThis.fetch,
    Headers: Headers2 = globalThis.Headers,
    AbortController: AbortController3 = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers2
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
      if (!(context.options.headers instanceof Headers2)) {
        context.options.headers = new Headers2(
          context.options.headers || {}
          /* compat */
        );
      }
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");
        if (typeof context.options.body !== "string") {
          context.options.body = contentType === "application/x-www-form-urlencoded" ? new URLSearchParams(
            context.options.body
          ).toString() : JSON.stringify(context.options.body);
        }
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController3();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch2(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r3 = await $fetchRaw(request, options);
    return r3._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch2(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

// node_modules/ofetch/dist/node.mjs
function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return r;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new import_node_http2.default.Agent(agentOptions);
  const httpsAgent = new import_node_https2.default.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return r(input, { ...nodeFetchOptions, ...init });
  };
}
var fetch = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
var Headers = globalThis.Headers || n3;
var AbortController2 = globalThis.AbortController || T;
var ofetch = createFetch({ fetch, Headers, AbortController: AbortController2 });

// node_modules/@ai-sdk/provider/dist/index.mjs
var marker = "vercel.ai.error";
var symbol = Symbol.for(marker);
var _a;
var _b;
var AISDKError = class _AISDKError extends (_b = Error, _a = symbol, _b) {
  /**
   * Creates an AI SDK Error.
   *
   * @param {Object} params - The parameters for creating the error.
   * @param {string} params.name - The name of the error.
   * @param {string} params.message - The error message.
   * @param {unknown} [params.cause] - The underlying cause of the error.
   */
  constructor({
    name: name14,
    message,
    cause
  }) {
    super(message);
    this[_a] = true;
    this.name = name14;
    this.cause = cause;
  }
  /**
   * Checks if the given error is an AI SDK Error.
   * @param {unknown} error - The error to check.
   * @returns {boolean} True if the error is an AI SDK Error, false otherwise.
   */
  static isInstance(error) {
    return _AISDKError.hasMarker(error, marker);
  }
  static hasMarker(error, marker15) {
    const markerSymbol = Symbol.for(marker15);
    return error != null && typeof error === "object" && markerSymbol in error && typeof error[markerSymbol] === "boolean" && error[markerSymbol] === true;
  }
};
var name = "AI_APICallError";
var marker2 = `vercel.ai.error.${name}`;
var symbol2 = Symbol.for(marker2);
var _a2;
var _b2;
var APICallError = class extends (_b2 = AISDKError, _a2 = symbol2, _b2) {
  constructor({
    message,
    url,
    requestBodyValues,
    statusCode,
    responseHeaders,
    responseBody,
    cause,
    isRetryable = statusCode != null && (statusCode === 408 || // request timeout
    statusCode === 409 || // conflict
    statusCode === 429 || // too many requests
    statusCode >= 500),
    // server error
    data
  }) {
    super({ name, message, cause });
    this[_a2] = true;
    this.url = url;
    this.requestBodyValues = requestBodyValues;
    this.statusCode = statusCode;
    this.responseHeaders = responseHeaders;
    this.responseBody = responseBody;
    this.isRetryable = isRetryable;
    this.data = data;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker2);
  }
};
var name2 = "AI_EmptyResponseBodyError";
var marker3 = `vercel.ai.error.${name2}`;
var symbol3 = Symbol.for(marker3);
var _a3;
var _b3;
var EmptyResponseBodyError = class extends (_b3 = AISDKError, _a3 = symbol3, _b3) {
  // used in isInstance
  constructor({ message = "Empty response body" } = {}) {
    super({ name: name2, message });
    this[_a3] = true;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker3);
  }
};
function getErrorMessage(error) {
  if (error == null) {
    return "unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}
var name3 = "AI_InvalidArgumentError";
var marker4 = `vercel.ai.error.${name3}`;
var symbol4 = Symbol.for(marker4);
var _a4;
var _b4;
var InvalidArgumentError = class extends (_b4 = AISDKError, _a4 = symbol4, _b4) {
  constructor({
    message,
    cause,
    argument
  }) {
    super({ name: name3, message, cause });
    this[_a4] = true;
    this.argument = argument;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker4);
  }
};
var name4 = "AI_InvalidPromptError";
var marker5 = `vercel.ai.error.${name4}`;
var symbol5 = Symbol.for(marker5);
var _a5;
var _b5;
var InvalidPromptError = class extends (_b5 = AISDKError, _a5 = symbol5, _b5) {
  constructor({
    prompt,
    message,
    cause
  }) {
    super({ name: name4, message: `Invalid prompt: ${message}`, cause });
    this[_a5] = true;
    this.prompt = prompt;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker5);
  }
};
var name5 = "AI_InvalidResponseDataError";
var marker6 = `vercel.ai.error.${name5}`;
var symbol6 = Symbol.for(marker6);
var _a6;
var _b6;
var InvalidResponseDataError = class extends (_b6 = AISDKError, _a6 = symbol6, _b6) {
  constructor({
    data,
    message = `Invalid response data: ${JSON.stringify(data)}.`
  }) {
    super({ name: name5, message });
    this[_a6] = true;
    this.data = data;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker6);
  }
};
var name6 = "AI_JSONParseError";
var marker7 = `vercel.ai.error.${name6}`;
var symbol7 = Symbol.for(marker7);
var _a7;
var _b7;
var JSONParseError = class extends (_b7 = AISDKError, _a7 = symbol7, _b7) {
  constructor({ text, cause }) {
    super({
      name: name6,
      message: `JSON parsing failed: Text: ${text}.
Error message: ${getErrorMessage(cause)}`,
      cause
    });
    this[_a7] = true;
    this.text = text;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker7);
  }
};
var name7 = "AI_LoadAPIKeyError";
var marker8 = `vercel.ai.error.${name7}`;
var symbol8 = Symbol.for(marker8);
var _a8;
var _b8;
var LoadAPIKeyError = class extends (_b8 = AISDKError, _a8 = symbol8, _b8) {
  // used in isInstance
  constructor({ message }) {
    super({ name: name7, message });
    this[_a8] = true;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker8);
  }
};
var name8 = "AI_LoadSettingError";
var marker9 = `vercel.ai.error.${name8}`;
var symbol9 = Symbol.for(marker9);
var _a9;
var _b9;
var LoadSettingError = class extends (_b9 = AISDKError, _a9 = symbol9, _b9) {
  // used in isInstance
  constructor({ message }) {
    super({ name: name8, message });
    this[_a9] = true;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker9);
  }
};
var name9 = "AI_NoContentGeneratedError";
var marker10 = `vercel.ai.error.${name9}`;
var symbol10 = Symbol.for(marker10);
var _a10;
var _b10;
var NoContentGeneratedError = class extends (_b10 = AISDKError, _a10 = symbol10, _b10) {
  // used in isInstance
  constructor({
    message = "No content generated."
  } = {}) {
    super({ name: name9, message });
    this[_a10] = true;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker10);
  }
};
var name10 = "AI_NoSuchModelError";
var marker11 = `vercel.ai.error.${name10}`;
var symbol11 = Symbol.for(marker11);
var _a11;
var _b11;
var NoSuchModelError = class extends (_b11 = AISDKError, _a11 = symbol11, _b11) {
  constructor({
    errorName = name10,
    modelId,
    modelType,
    message = `No such ${modelType}: ${modelId}`
  }) {
    super({ name: errorName, message });
    this[_a11] = true;
    this.modelId = modelId;
    this.modelType = modelType;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker11);
  }
};
var name11 = "AI_TooManyEmbeddingValuesForCallError";
var marker12 = `vercel.ai.error.${name11}`;
var symbol12 = Symbol.for(marker12);
var _a12;
var _b12;
var TooManyEmbeddingValuesForCallError = class extends (_b12 = AISDKError, _a12 = symbol12, _b12) {
  constructor(options) {
    super({
      name: name11,
      message: `Too many values for a single embedding call. The ${options.provider} model "${options.modelId}" can only embed up to ${options.maxEmbeddingsPerCall} values per call, but ${options.values.length} values were provided.`
    });
    this[_a12] = true;
    this.provider = options.provider;
    this.modelId = options.modelId;
    this.maxEmbeddingsPerCall = options.maxEmbeddingsPerCall;
    this.values = options.values;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker12);
  }
};
var name12 = "AI_TypeValidationError";
var marker13 = `vercel.ai.error.${name12}`;
var symbol13 = Symbol.for(marker13);
var _a13;
var _b13;
var TypeValidationError = class _TypeValidationError extends (_b13 = AISDKError, _a13 = symbol13, _b13) {
  constructor({
    value,
    cause,
    context
  }) {
    let contextPrefix = "Type validation failed";
    if (context == null ? void 0 : context.field) {
      contextPrefix += ` for ${context.field}`;
    }
    if ((context == null ? void 0 : context.entityName) || (context == null ? void 0 : context.entityId)) {
      contextPrefix += " (";
      const parts = [];
      if (context.entityName) {
        parts.push(context.entityName);
      }
      if (context.entityId) {
        parts.push(`id: "${context.entityId}"`);
      }
      contextPrefix += parts.join(", ");
      contextPrefix += ")";
    }
    super({
      name: name12,
      message: `${contextPrefix}: Value: ${JSON.stringify(value)}.
Error message: ${getErrorMessage(cause)}`,
      cause
    });
    this[_a13] = true;
    this.value = value;
    this.context = context;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker13);
  }
  /**
   * Wraps an error into a TypeValidationError.
   * If the cause is already a TypeValidationError with the same value and context, it returns the cause.
   * Otherwise, it creates a new TypeValidationError.
   *
   * @param {Object} params - The parameters for wrapping the error.
   * @param {unknown} params.value - The value that failed validation.
   * @param {unknown} params.cause - The original error or cause of the validation failure.
   * @param {TypeValidationContext} params.context - Optional context about what is being validated.
   * @returns {TypeValidationError} A TypeValidationError instance.
   */
  static wrap({
    value,
    cause,
    context
  }) {
    var _a15, _b15, _c;
    if (_TypeValidationError.isInstance(cause) && cause.value === value && ((_a15 = cause.context) == null ? void 0 : _a15.field) === (context == null ? void 0 : context.field) && ((_b15 = cause.context) == null ? void 0 : _b15.entityName) === (context == null ? void 0 : context.entityName) && ((_c = cause.context) == null ? void 0 : _c.entityId) === (context == null ? void 0 : context.entityId)) {
      return cause;
    }
    return new _TypeValidationError({ value, cause, context });
  }
};
var name13 = "AI_UnsupportedFunctionalityError";
var marker14 = `vercel.ai.error.${name13}`;
var symbol14 = Symbol.for(marker14);
var _a14;
var _b14;
var UnsupportedFunctionalityError = class extends (_b14 = AISDKError, _a14 = symbol14, _b14) {
  constructor({
    functionality,
    message = `'${functionality}' functionality not supported.`
  }) {
    super({ name: name13, message });
    this[_a14] = true;
    this.functionality = functionality;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker14);
  }
};

// src/a2a-client.ts
var import_node_crypto = __toESM(require("node:crypto"), 1);
var RETRY_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 504];
var A2AClient = class {
  config;
  endpoint;
  constructor(config) {
    this.config = config;
    this.endpoint = config.litellmProxy?.url ? config.litellmProxy.url.endsWith("/") ? config.litellmProxy.url : `${config.litellmProxy.url}/` : `${config.protocol ?? "http"}://${config.host}:${config.port}/`;
  }
  /**
   * サーバーの情報を取得する（バージョン確認用等）
   */
  async getServerInfo(abortSignal) {
    const headers = {
      "Accept": "application/json"
    };
    if (this.config.token && !this.config.litellmProxy) {
      headers["Authorization"] = `Bearer ${this.config.token}`;
    }
    try {
      const info = await ofetch(this.endpoint, {
        method: "GET",
        headers,
        signal: abortSignal,
        timeout: 5e3
      });
      return info;
    } catch (error) {
      Logger.debug(`Failed to fetch server info from ${this.endpoint}:`, error);
      return null;
    }
  }
  /**
   * チャットリクエストを送信し、ストリームとレスポンスメタデータを返す
   */
  async chatStream({ request, idempotencyKey, abortSignal, traceId }) {
    const finalTraceId = traceId || import_node_crypto.default.randomUUID();
    const headers = {
      "Content-Type": "application/json",
      "x-a2a-trace-id": finalTraceId
    };
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    if (this.config.litellmProxy?.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.litellmProxy.apiKey}`;
    }
    if (this.config.token && !this.config.litellmProxy) {
      const isSecure = this.endpoint.startsWith("https://");
      const normalizedHost = (this.config.host || "").replace(/^\[|\]$/g, "");
      const isLocalhost = normalizedHost === "127.0.0.1" || normalizedHost === "localhost" || normalizedHost === "::1";
      if (isSecure || isLocalhost) {
        headers["Authorization"] = `Bearer ${this.config.token}`;
      } else {
        throw new APICallError({
          message: "A2AClient: Token cannot be sent over an insecure non-localhost connection.",
          url: this.endpoint,
          requestBodyValues: request,
          isRetryable: false
        });
      }
    }
    const retryCount = idempotencyKey ? 3 : 0;
    const bodyStr = JSON.stringify(request);
    Logger.info(`[A2AClient] Sending request to ${this.endpoint} (Size: ${bodyStr.length} bytes)`);
    if (process.env.DEBUG_OPENCODE) {
      Logger.debug(`Request body:`, JSON.stringify(request, null, 2));
    }
    try {
      const response = await ofetch.raw(this.endpoint, {
        method: "POST",
        headers,
        body: request,
        retry: retryCount,
        retryDelay: 1e3,
        retryStatusCodes: RETRY_STATUS_CODES,
        signal: abortSignal,
        ignoreResponseError: true,
        responseType: "stream"
      });
      Logger.debug(`Response status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        throw new APICallError({
          message: `HTTP error ${response.status}: ${response.statusText}`,
          url: this.endpoint,
          requestBodyValues: request,
          statusCode: response.status,
          isRetryable: RETRY_STATUS_CODES.includes(response.status)
        });
      }
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      return {
        stream: response._data,
        status: response.status,
        headers: responseHeaders
      };
    } catch (error) {
      if (error instanceof APICallError) {
        throw error;
      }
      let statusCode;
      let responseBody;
      if (error instanceof FetchError) {
        statusCode = error.response?.status;
        try {
          responseBody = await error.response?.text();
        } catch (e) {
          Logger.error(`Failed to read response body for ${error.response?.url ?? this.endpoint} (status: ${statusCode}):`, e);
          responseBody = void 0;
        }
      }
      const isRetryableStatus = statusCode ? RETRY_STATUS_CODES.includes(statusCode) : true;
      throw new APICallError({
        message: error instanceof Error ? error.message : String(error),
        url: this.endpoint,
        requestBodyValues: request,
        statusCode,
        responseBody,
        cause: error,
        isRetryable: isRetryableStatus
      });
    }
  }
};

// src/utils/mapper.ts
var import_node_crypto2 = __toESM(require("node:crypto"), 1);
var DEFAULT_INTERNAL_TOOLS = [
  "activate_skill",
  "load_skill",
  "search_skills",
  "search_skills_by_id",
  "search_skills_by_name",
  "sequentialthinking",
  "save_memory",
  "cli_help",
  "codebase_investigator",
  "generalist",
  "brainstorming",
  "writing-plans"
];
function isToolRequest(data) {
  if (!data || typeof data !== "object") return false;
  const req = data.request;
  return !!req && typeof req === "object" && typeof req.name === "string";
}
function isThoughtData(data) {
  return typeof data === "object" && data !== null && ("subject" in data || "description" in data);
}
function percentPayloadToBytes(payload) {
  const bytes = [];
  for (let i = 0; i < payload.length; i++) {
    if (payload[i] === "%" && i + 2 < payload.length) {
      const hex = payload.substring(i + 1, i + 3);
      if (/^[0-9a-fA-F]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(payload.charCodeAt(i) & 255);
  }
  return new Uint8Array(bytes);
}
function mapPromptToA2AJsonRpcRequest(prompt, optionsOrTools) {
  const options = Array.isArray(optionsOrTools) ? { tools: optionsOrTools } : optionsOrTools ?? {};
  const { tools, contextId, taskId, modelId, generationConfig, toolMapping } = options;
  if (prompt.length === 0) {
    return buildRequest("(empty prompt)", options);
  }
  let newMessages = prompt;
  if (contextId) {
    const startIdx = options.processedMessagesCount ?? 0;
    newMessages = prompt.slice(startIdx);
    if (newMessages.length > 0 && newMessages[0].role === "assistant") {
      newMessages = newMessages.slice(1);
    }
  }
  let parts = [];
  if (!contextId) {
    parts.push({
      kind: "text",
      text: `[SYSTEM]
CRITICAL: You are Gemini CLI. Strictly follow the user's language policy (Japanese).

SPECIAL SHORTCUT FOR GREETINGS: If the user message is just a simple greeting like 'hello', 'hi', '\u3053\u3093\u306B\u3061\u306F', '\u3069\u3046\u3082', or similar, YOU MUST NOT use any skills, tools, or complex workflows. JUST respond with a friendly greeting in Japanese and ask how you can help. DO NOT call 'activate_skill' until a real task is provided. This is mandatory to prevent unnecessary initialization loops.

TOOL USAGE: When calling tools, you MUST use their exact full names. If a tool is listed with a prefix (e.g., 'docker-mcp-gateway_read_file'), you MUST include it.
`
    });
  }
  for (const msg of newMessages) {
    if (msg.role === "system") {
      parts.push({ kind: "text", text: `[SYSTEM]
${msg.content}
` });
    } else if (msg.role === "user") {
      parts.push({ kind: "text", text: `[USER]
` });
      parts.push(...extractUserParts(msg));
    } else if (msg.role === "assistant") {
      let text = "";
      if (typeof msg.content === "string") text = msg.content;
      else if (Array.isArray(msg.content)) {
        text = msg.content.filter((p2) => p2.type === "text").map((p2) => p2.text).join("\n");
      }
      parts.push({ kind: "text", text: `[ASSISTANT]
${text}
` });
    } else if (msg.role === "tool") {
      parts.push({ kind: "text", text: `[TOOL RESULT]
${formatToolResults(msg.content, toolMapping)}
` });
    }
  }
  const MAX_PROMPT_CHARS = 2e4;
  let currentTotal = 0;
  const reversedParts = [...parts].reverse();
  const keptParts = [];
  for (const p2 of reversedParts) {
    const len = p2.kind === "text" ? p2.text.length : 1e3;
    if (currentTotal + len > MAX_PROMPT_CHARS) {
      keptParts.push({ kind: "text", text: "... (truncated due to A2A size limits) ..." });
      break;
    }
    keptParts.push(p2);
    currentTotal += len;
  }
  parts = keptParts.reverse();
  if (parts.length === 0) {
    parts = [{ kind: "text", text: "(empty prompt)" }];
  }
  return buildRequest(parts, options);
}
function buildConfirmationRequest(taskId, modelId, confirmation = true, contextId) {
  const ts = Date.now();
  return {
    jsonrpc: "2.0",
    id: `confirm_${ts}`,
    method: "message/stream",
    params: {
      message: {
        messageId: `confirm_${ts}`,
        role: "user",
        parts: [{ kind: "text", text: confirmation ? "Proceed" : "Cancel" }]
      },
      configuration: {
        blocking: false
      },
      taskId,
      // contextId を渡すことで A2A サーバーが同一会話コンテキストとして処理し、
      // エージェントが会話履歴なしの新しいセッションで再起動するのを防ぐ
      ...contextId ? { contextId } : {},
      ...modelId ? { model: modelId } : {}
    }
  };
}
function extractBinaryOrUri(data) {
  const isBuffer = typeof Buffer !== "undefined" && Buffer.isBuffer(data);
  const isUint8Array = data instanceof Uint8Array;
  const isArrayBuffer = data instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && data instanceof SharedArrayBuffer;
  const isUrlObj = data instanceof URL;
  const isString = typeof data === "string";
  let bytes = void 0;
  let uri = void 0;
  let extractedMimeType = void 0;
  if (isBuffer || isUint8Array) {
    if (typeof Buffer !== "undefined") {
      bytes = Buffer.from(data).toString("base64");
    } else {
      const arr = data;
      bytes = btoa(Array.from(arr, (b) => String.fromCharCode(b)).join(""));
    }
  } else if (isArrayBuffer) {
    if (typeof Buffer !== "undefined") {
      bytes = Buffer.from(new Uint8Array(data)).toString("base64");
    } else {
      const arr = new Uint8Array(data);
      bytes = btoa(Array.from(arr, (b) => String.fromCharCode(b)).join(""));
    }
  } else if (isUrlObj) {
    uri = data.href;
  } else if (isString) {
    const str = data;
    if (str.startsWith("data:")) {
      const matchBase64 = str.match(/^data:(.*?);base64,(.*)$/);
      if (matchBase64) {
        extractedMimeType = matchBase64[1];
        bytes = matchBase64[2];
      } else {
        const matchPlain = str.match(/^data:(.*?),(.*)$/);
        if (matchPlain) {
          extractedMimeType = matchPlain[1];
          const u8 = percentPayloadToBytes(matchPlain[2]);
          if (typeof Buffer !== "undefined") {
            bytes = Buffer.from(u8).toString("base64");
          } else {
            bytes = btoa(Array.from(u8, (b) => String.fromCharCode(b)).join(""));
          }
        } else {
          Logger.warn("Malformed data URI format.");
        }
      }
    } else if (str.startsWith("http://") || str.startsWith("https://")) {
      uri = str;
    } else {
      const isBase64 = str.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(str);
      const isBase64Url = str.length > 0 && /^[A-Za-z0-9\-_]+={0,2}$/.test(str);
      const isValidLength = str.length % 4 === 0 || !str.endsWith("=") && str.length % 4 !== 1;
      if ((isBase64 || isBase64Url) && isValidLength) {
        bytes = str;
      } else {
        Logger.warn("Invalid base64 string provided for binary data. Part will be dropped.");
      }
    }
  }
  return { bytes, uri, extractedMimeType };
}
function extractUserParts(message) {
  if (message.role !== "user") return [];
  const content = typeof message.content === "string" ? [{ type: "text", text: message.content }] : message.content;
  return content.map((part) => {
    if (part.type === "text") {
      return { kind: "text", text: part.text };
    } else if (part.type === "image") {
      const extracted = extractBinaryOrUri(part.image);
      if (extracted.bytes === void 0 && !extracted.uri) {
        Logger.warn("Unsupported image format: could not extract bytes or uri from image part. Part will be dropped.");
        return null;
      }
      const finalMimeType = part.mimeType || extracted.extractedMimeType;
      return {
        kind: "image",
        image: {
          ...finalMimeType ? { mimeType: finalMimeType } : {},
          ...extracted.bytes !== void 0 ? { bytes: extracted.bytes } : {},
          ...extracted.uri ? { uri: extracted.uri } : {}
        }
      };
    } else if (part.type === "file") {
      const extracted = extractBinaryOrUri(part.data);
      if (extracted.bytes === void 0 && !extracted.uri) {
        Logger.warn("Unsupported file format: could not extract bytes or uri from file part. Part will be dropped.");
        return null;
      }
      const finalMimeType = part.mimeType || extracted.extractedMimeType;
      return {
        kind: "file",
        file: {
          name: part.filename || "file",
          ...finalMimeType ? { mimeType: finalMimeType } : {},
          ...extracted.bytes !== void 0 ? { fileWithBytes: extracted.bytes } : {},
          ...extracted.uri ? { uri: extracted.uri } : {}
        }
      };
    }
    return null;
  }).filter((p2) => p2 !== null);
}
function formatToolResults(content, toolMapping) {
  return content.map((part) => {
    const resultVal = part.result !== void 0 ? part.result : part.content;
    const resultStr = typeof resultVal === "string" ? resultVal : JSON.stringify(resultVal);
    const prefix = part.isError ? "[Tool Error" : "[Tool Result";
    const mappedToolName = toolMapping?.[part.toolName] || part.toolName;
    return `${prefix}: ${mappedToolName} (${part.toolCallId})]
${resultStr}`;
  }).join("\n\n");
}
function buildRequest(content, options) {
  const { tools, contextId, taskId, modelId, generationConfig, toolMapping, toolChoice } = options;
  let mappedTools = tools?.map((tool) => {
    const toolObj = tool;
    const isWrapped = toolObj.type === "function" && typeof toolObj.function === "object";
    const flatTool = isWrapped ? {
      name: toolObj.function.name,
      description: toolObj.function.description,
      parameters: toolObj.function.parameters
    } : { ...toolObj };
    if (flatTool.name && toolMapping?.[flatTool.name]) {
      return { ...flatTool, name: toolMapping[flatTool.name] };
    }
    return flatTool;
  });
  if (mappedTools && mappedTools.length > 10) {
    Logger.info(`[Mapper] Truncating tools from ${mappedTools.length} to 10 to stay within payload limits.`);
    mappedTools = mappedTools.slice(0, 10);
  }
  const parts = typeof content === "string" ? [{ kind: "text", text: content }] : content;
  return {
    jsonrpc: "2.0",
    id: import_node_crypto2.default.randomUUID(),
    method: "message/stream",
    params: {
      message: {
        messageId: import_node_crypto2.default.randomUUID(),
        role: "user",
        parts
      },
      configuration: {
        blocking: false,
        // Only send tools if it's the first turn (no contextId) 
        // or if we are forced to (optional optimization)
        ...!contextId && mappedTools && mappedTools.length > 0 ? { tools: mappedTools } : {},
        ...toolChoice ? {
          toolChoice: typeof toolChoice === "string" && toolMapping?.[toolChoice] ? toolMapping[toolChoice] : toolChoice
        } : {},
        // Some A2A servers expect model inside configuration or coderAgent
        ...modelId ? { model: modelId, coderAgent: { model: modelId } } : {}
      },
      ...generationConfig ? { generationConfig } : {},
      // Default A2A location for dynamic model selection
      ...modelId ? { model: modelId } : {},
      ...contextId ? { contextId } : {},
      ...taskId ? { taskId } : {}
    }
  };
}
var A2AStreamMapper = class {
  toolMapping;
  reverseToolMapping;
  internalTools;
  /** 出力済みテキストの累計インデックス別マップ。スナップショット重複排除に使用 */
  bufferedTools = /* @__PURE__ */ new Map();
  /** レスポンスから抽出した contextId */
  _contextId;
  /** レスポンスから抽出した taskId */
  _taskId;
  /** 発行済みのツール呼び出しID (taskId ごとにリセット) */
  emittedToolCallIds = /* @__PURE__ */ new Set();
  /** 現在のターン番号 (Turn boundary でインクリメント) */
  _turnSequence = 0;
  /** req.callId が無い場合のフォールバックID管理。ツール名_インデックス -> ユニークID */
  fallbackToolCallIds = /* @__PURE__ */ new Map();
  /** 出力済みテキストの累計インデックス別マップ。スナップショット重複排除に使用 (taskId ごとにリセット) */
  emittedTextByIndex = /* @__PURE__ */ new Map();
  /** 現在のインデックスが思考プロセス中かどうかを保持するマップ */
  indexIsReasoning = /* @__PURE__ */ new Map();
  /** 最後に送信した思考のハッシュ値（重複排除用） */
  lastThoughtHash;
  /** 現在のチャンクの coderAgentKind */
  _currentCoderAgentKind;
  /** 最後の finishReason */
  _lastFinishReason;
  _shouldInterruptLoop = false;
  _lastInternalToolNames = [];
  /** ツール呼び出しの引数文字列ごとのカウント */
  toolCallFrequency = /* @__PURE__ */ new Map();
  /** 同一引数での呼び出し許容上限（これを超えると抑制する） */
  maxToolCallFrequency;
  /** OpenCode によって要求されたツールの Set (指定がある場合、これに含まれないツールはすべて internal 扱いになる) */
  clientTools;
  constructor(options) {
    this.toolMapping = options?.toolMapping ?? {};
    this.maxToolCallFrequency = options?.maxToolCallFrequency ?? 10;
    this.internalTools = new Set(options?.internalTools ?? DEFAULT_INTERNAL_TOOLS);
    if (options?.clientTools) {
      this.clientTools = new Set(options.clientTools);
    }
    if (options?.initialToolCallFrequency) {
      for (const [k2, v2] of Object.entries(options.initialToolCallFrequency)) {
        this.toolCallFrequency.set(k2, v2);
      }
    }
    this.reverseToolMapping = {};
    for (const [openCodeName, serverName] of Object.entries(this.toolMapping)) {
      const currentMapped = this.reverseToolMapping[serverName];
      const isBetterMatch = !currentMapped || this.clientTools?.has(openCodeName) && !this.clientTools?.has(currentMapped);
      if (isBetterMatch) {
        this.reverseToolMapping[serverName] = openCodeName;
      }
    }
  }
  get currentToolCallFrequency() {
    return Object.fromEntries(this.toolCallFrequency.entries());
  }
  /** レスポンスから抽出した contextId を取得 */
  get contextId() {
    return this._contextId;
  }
  /** レスポンスから抽出した taskId を取得 */
  get taskId() {
    return this._taskId;
  }
  /** 最後の finishReason を取得 */
  get lastFinishReason() {
    return this._lastFinishReason;
  }
  /** ターン開始時のリセット処理 */
  startNewTurn() {
    this._turnSequence++;
    this.emittedTextByIndex.clear();
    this.indexIsReasoning.clear();
    this.emittedToolCallIds.clear();
    this.fallbackToolCallIds.clear();
    this.bufferedTools.clear();
    this._shouldInterruptLoop = false;
    this._lastInternalToolNames = [];
  }
  /**
   * A2A のレスポンス（各チャンク）を AI SDK のストリームパーツに変換する。
   */
  mapResult(result) {
    const parts = [];
    if (result.kind === "task") {
      this._contextId = result.contextId;
      if (this._taskId !== result.id) {
        this._taskId = result.id;
        this.emittedTextByIndex.clear();
        this.emittedToolCallIds.clear();
        this.fallbackToolCallIds.clear();
        this.bufferedTools.clear();
        this._shouldInterruptLoop = false;
        this._lastInternalToolNames = [];
        this._lastFinishReason = void 0;
      }
      return parts;
    }
    if (result.kind === "status-update") {
      if (result.contextId) this._contextId = result.contextId;
      if (this._taskId !== result.taskId) {
        this._taskId = result.taskId;
        this.emittedTextByIndex.clear();
        this.emittedToolCallIds.clear();
        this.fallbackToolCallIds.clear();
        this.bufferedTools.clear();
        this._shouldInterruptLoop = false;
        this._lastInternalToolNames = [];
        this._lastFinishReason = void 0;
      }
      const msg = result.status.message;
      const metadata = result.metadata;
      const coderAgentKind = metadata?.coderAgent?.kind;
      this._currentCoderAgentKind = coderAgentKind;
      const shouldProcessParts = result.status.state === "working" || result.status.state === "input-required" || result.status.state === "tool_calls" || result.status.state === "stop" || result.status.state === "completed";
      if (shouldProcessParts && msg && msg.parts) {
        for (const [index, p2] of msg.parts.entries()) {
          if (p2.kind === "text" && p2.text) {
            const delta = this.extractTextDelta(index, p2.text);
            if (delta) {
              let isReasoning = this.indexIsReasoning.get(index);
              if (isReasoning === void 0 || isReasoning === true) {
                const startsWithThinking = p2.text.startsWith("[Thinking]");
                const isThoughtKind = this._currentCoderAgentKind === "thought";
                if (isThoughtKind) {
                  isReasoning = true;
                } else if (this._currentCoderAgentKind !== void 0) {
                  isReasoning = false;
                } else {
                  isReasoning = startsWithThinking;
                }
                this.indexIsReasoning.set(index, isReasoning);
              }
              if (isReasoning) {
                parts.push({
                  type: "reasoning-delta",
                  reasoningDelta: delta,
                  // Compatibility
                  delta: delta || ""
                });
              } else {
                parts.push({
                  type: "text-delta",
                  textDelta: delta,
                  // Extreme compatibility: OpenCode schema expects 'delta' to be a string
                  delta: delta || ""
                });
              }
            }
          } else if (p2.kind === "data" && isToolRequest(p2.data)) {
            const req = p2.data.request;
            let toolName = req.name;
            const originalToolName = toolName;
            let toolCallId = req.callId;
            if (!toolCallId) {
              const fallbackKey = `${toolName}_${index}`;
              if (!this.fallbackToolCallIds.has(fallbackKey)) {
                const turnSeed = `${this._turnSequence}_${fallbackKey}`;
                const hash = import_node_crypto2.default.createHash("md5").update(turnSeed).digest("hex");
                this.fallbackToolCallIds.set(fallbackKey, `call_${hash}`);
              }
              toolCallId = this.fallbackToolCallIds.get(fallbackKey);
            }
            Logger.info(`[Sandbox-Debug] Received tool call from A2A stream. Initial name: '${toolName}', callId: '${toolCallId}', raw request:`, JSON.stringify(req));
            if (toolName === "invalid") {
              Logger.info(`[Sandbox] Intercepted A2A native 'invalid' tool call. Converting to bash echo to prevent doom_loop.`);
              this.bufferedTools.set(toolCallId, {
                originalToolName: "bash",
                toolInfo: {
                  toolName: "bash",
                  args: { command: 'echo "SYSTEM WARNING: I attempted to use an invalid tool. I must check my available tools and use the EXACT names as they appear there (including prefixes if they exist)."' }
                }
              });
              continue;
            }
            let args = req.args;
            if (typeof args === "string") {
              try {
                args = JSON.parse(args);
              } catch (e) {
              }
            }
            if (args && typeof args === "object") {
              if (args.file_path && !args.filePath) args.filePath = args.file_path;
              if (args.path && !args.filePath) args.filePath = args.path;
              if (args.cmd && !args.command) args.command = args.cmd;
              if ((toolName === "bash" || toolName === "run_shell_command") && typeof args.command === "string") {
                if (/^\s*task\s*\(/i.test(args.command)) {
                  args.command = `echo '[opencode-geminicli-a2a] Error: You cannot execute task() pseudocode inside a bash shell. You MUST use the dedicated "task" tool.'`;
                }
              }
              req.args = args;
            }
            const commonHallucinations = {
              "read_file": "read",
              "readFile": "read",
              "list_directory": "glob",
              "listDirectory": "glob",
              "directory_tree": "glob",
              "search_files": "grep",
              "searchFiles": "grep",
              "grep_search": "grep",
              "edit_file": "edit",
              "editFile": "edit",
              "run_shell_command": "bash",
              "runShellCommand": "bash",
              "run_command": "bash",
              "exec_command": "bash",
              "shell": "bash",
              "sequentialthinking": "sequential-thinking_sequentialthinking"
            };
            const baseName = toolName.startsWith("docker-mcp-gateway_") ? toolName.replace("docker-mcp-gateway_", "") : toolName;
            if (commonHallucinations[baseName] && !this.clientTools?.has(toolName)) {
              const targetServerName = commonHallucinations[baseName];
              Logger.info(`[Workaround] Normalizing hallucinated tool call '${toolName}' to server-side name '${targetServerName}'`);
              toolName = targetServerName;
              if (toolName === "glob" && req.args && typeof req.args === "object") {
                const a = req.args;
                if (a.pattern === void 0) {
                  const p3 = a.dir_path || a.path || ".";
                  a.pattern = `${p3}/**/*`;
                }
              } else if (toolName === "grep" && req.args && typeof req.args === "object") {
                const a = req.args;
                if (a.pattern === void 0) {
                  a.pattern = a.query || a.text || "";
                }
              }
            }
            this.bufferedTools.set(toolCallId, { originalToolName, toolInfo: { toolName, args: req.args } });
          } else if (coderAgentKind === "thought" && p2.kind === "data" && isThoughtData(p2.data)) {
            let textDelta = "";
            if (p2.data.subject && p2.data.description) {
              textDelta = `[${p2.data.subject}] ${p2.data.description}
`;
            } else if (p2.data.subject) {
              textDelta = `[${p2.data.subject}]
`;
            } else if (p2.data.description) {
              textDelta = `${p2.data.description}
`;
            }
            if (textDelta) {
              const thoughtHash = import_node_crypto2.default.createHash("md5").update(textDelta).digest("hex");
              if (thoughtHash !== this.lastThoughtHash) {
                parts.push({
                  type: "reasoning-delta",
                  reasoningDelta: textDelta,
                  delta: textDelta
                  // Compatibility for strict OpenCode consumers
                });
                this.lastThoughtHash = thoughtHash;
              }
            }
            continue;
          } else if (p2.kind === "image") {
            const imageData = p2.image;
            if (imageData && (imageData.bytes || imageData.uri)) {
              const mimeType = imageData.mimeType || "image/png";
              const data = imageData.bytes || imageData.uri;
              parts.push({
                type: "file",
                mimeType,
                mediaType: mimeType,
                data
              });
            } else {
              Logger.warn("Received image part without bytes or uri. Skipping.");
            }
          } else if (p2.kind === "file") {
            const fileData = p2.file;
            if (fileData && (fileData.fileWithBytes || fileData.uri)) {
              const mimeType = fileData.mimeType || "application/octet-stream";
              const data = fileData.fileWithBytes || fileData.uri;
              parts.push({
                type: "file",
                mimeType,
                mediaType: mimeType,
                data
              });
            } else {
              Logger.warn("Received file part without fileWithBytes or uri. Skipping.");
            }
          }
        }
      }
      const isFinal = result.final === true || result.status.state === "input-required" || result.status.state === "tool_calls";
      if (isFinal) {
        const isInternalToolConfirmation = result.status.state === "input-required" && coderAgentKind === "tool-call-confirmation";
        let hasExposedTools = false;
        let hasInternalTools = false;
        for (const [toolCallId, { originalToolName: bufferedOriginalToolName, toolInfo }] of this.bufferedTools.entries()) {
          let originalToolName = this.reverseToolMapping[toolInfo.toolName] || bufferedOriginalToolName || toolInfo.toolName;
          let argsForKey = toolInfo.args;
          if (typeof argsForKey === "string") {
            try {
              const parsed = JSON.parse(argsForKey);
              if (parsed && typeof parsed === "object") {
                argsForKey = { ...parsed };
              }
            } catch {
            }
          } else if (argsForKey && typeof argsForKey === "object") {
            argsForKey = { ...argsForKey };
          }
          if (argsForKey && typeof argsForKey === "object") {
            delete argsForKey.description;
          }
          const argsKey = `${toolInfo.toolName}::${JSON.stringify(argsForKey)}`;
          const freq = this.toolCallFrequency.get(argsKey) ?? 0;
          const isInvalidToolName = toolInfo.toolName === "invalid";
          const isInternalToolBase = this.internalTools.has(toolInfo.toolName) || this.internalTools.has(originalToolName);
          let isInternalTool = isInternalToolBase;
          const isUnknownToClient = this.clientTools ? !this.clientTools.has(originalToolName) && !isInternalToolBase : false;
          const currentFreq = freq + 1;
          this.toolCallFrequency.set(argsKey, currentFreq);
          const sanitizeForShell = (s) => s.replace(/'/g, "'\\''");
          if (currentFreq > this.maxToolCallFrequency) {
            Logger.warn(`[DuplicateDetect] Tool '${originalToolName}' loop detected (${currentFreq} times).`);
            if (isInternalToolConfirmation || isInternalToolBase) {
              this._shouldInterruptLoop = true;
            } else {
              const originalToolNameForMessage = toolInfo.toolName;
              const escapedToolName = sanitizeForShell(originalToolNameForMessage);
              originalToolName = "bash";
              toolInfo.toolName = "bash";
              toolInfo.args = {
                command: `echo '[opencode-geminicli-a2a] SYSTEM: You have already called "${escapedToolName}" with exactly the same arguments ${currentFreq} times. Please DO NOT repeat this exact call and proceed with a DIFFERENT action or respond to the user.'`,
                description: `Duplicate tool call suppressed`
              };
            }
          } else if (isInvalidToolName || isUnknownToClient) {
            Logger.info(`[Workaround] Intercepted hallucinated/invalid tool call '${toolInfo.toolName}' (mapped to '${originalToolName}'). Rewriting to a safe 'bash' call.`);
            const badName = originalToolName;
            const escapedBadName = sanitizeForShell(badName);
            originalToolName = "bash";
            toolInfo.toolName = "bash";
            toolInfo.args = {
              command: `echo '[opencode-geminicli-a2a] Warning: Model called unknown tool: ${escapedBadName}'`,
              description: `Fallback for hallucinated tool ${badName}`
            };
          }
          if (typeof toolInfo.args === "string") {
            try {
              const parsed = JSON.parse(toolInfo.args);
              if (parsed && typeof parsed === "object" && !("description" in parsed)) {
                parsed.description = `Execute ${originalToolName} via A2A (${toolCallId})`;
                toolInfo.args = parsed;
              }
            } catch (e) {
            }
          } else if (toolInfo.args && typeof toolInfo.args === "object" && !("description" in toolInfo.args)) {
            toolInfo.args.description = `Execute ${originalToolName} via A2A (${toolCallId})`;
          }
          const treatAsInternal = isInternalTool || isInternalToolConfirmation && (!this.clientTools || !this.clientTools.has(originalToolName));
          if (treatAsInternal) {
            hasInternalTools = true;
            this._lastInternalToolNames.push(toolInfo.toolName);
          } else {
            hasExposedTools = true;
            if (!this.emittedToolCallIds.has(toolCallId)) {
              let argsStr = typeof toolInfo.args === "string" ? toolInfo.args : JSON.stringify(toolInfo.args ?? {});
              if (!argsStr || argsStr === '""') argsStr = "{}";
              Logger.info(`Emitting tool call: ${originalToolName} (from: ${toolInfo.toolName}) (${toolCallId}) with args: ${argsStr}`);
              parts.push({
                type: "tool-call",
                toolCallId,
                toolName: originalToolName,
                args: argsStr
              });
              this.emittedToolCallIds.add(toolCallId);
            }
          }
        }
        let finishReason = "stop";
        const hasTools = this.bufferedTools.size > 0;
        switch (result.status.state) {
          case "error":
          case "failed":
            finishReason = "error";
            break;
          case "input-required":
            finishReason = hasExposedTools && hasTools ? "tool-calls" : "stop";
            break;
          case "cancelled":
          case "timeout":
          case "aborted":
            finishReason = "other";
            break;
          case "length":
          case "max_tokens":
            finishReason = "length";
            break;
          case "content_filter":
          case "blocked":
            finishReason = "content-filter";
            break;
          case "tool_calls":
            finishReason = hasExposedTools ? "tool-calls" : "stop";
            break;
          case "stop":
          case "completed":
            finishReason = hasExposedTools ? "tool-calls" : "stop";
            break;
          default:
            finishReason = hasExposedTools ? "tool-calls" : "stop";
            if (!hasExposedTools && hasInternalTools) {
              finishReason = "stop";
            }
            if (!hasTools) {
              Logger.warn(`Unexpected final status state: '${result.status.state}' for taskId: '${result.taskId}'. Treating as 'stop'.`);
            }
            break;
        }
        this._lastFinishReason = finishReason;
        const usage = {
          promptTokens: result.usage?.promptTokens ?? 0,
          completionTokens: result.usage?.completionTokens ?? 0
        };
        let coderAgentKindValue = void 0;
        if (hasInternalTools && !isInternalToolConfirmation) {
          coderAgentKindValue = "internal-tool-call";
        } else if (this._currentCoderAgentKind) {
          coderAgentKindValue = this._currentCoderAgentKind;
        } else if (isInternalToolConfirmation) {
          coderAgentKindValue = "tool-call-confirmation";
        }
        const needsInput = result.status.state === "input-required" && (hasInternalTools || hasExposedTools || coderAgentKindValue !== "tool-call-confirmation");
        const part = {
          type: "finish",
          finishReason,
          usage,
          hasExposedTools,
          shouldInterruptLoop: this._shouldInterruptLoop,
          internalToolNames: this._lastInternalToolNames,
          taskId: result.taskId,
          ...needsInput ? {
            inputRequired: true,
            rawState: result.status.state,
            ...coderAgentKindValue !== void 0 ? { coderAgentKind: coderAgentKindValue } : {}
          } : {}
        };
        parts.push(part);
        this.bufferedTools.clear();
      }
    } else if (result.kind === "artifact-update") {
    } else {
      Logger.warn(`Skipping unexpected A2A result kind: '${result.kind}'`);
    }
    return parts;
  }
  /**
   * スナップショット形式のテキストから差分を抽出する。
   * 新しいテキストが前回出力済みテキストで始まっている場合、差分のみを返す。
   * それ以外の場合（別メッセージ等）は全テキストを返し、累計をリセットする。
   */
  extractTextDelta(index, newText) {
    const emittedText = this.emittedTextByIndex.get(index) || "";
    if (newText.startsWith(emittedText)) {
      const delta = newText.slice(emittedText.length);
      this.emittedTextByIndex.set(index, newText);
      return delta;
    } else {
      this.emittedTextByIndex.set(index, newText);
      return newText;
    }
  }
};

// src/utils/stream.ts
function parseChunkLine(chunkDataSync) {
  if (!chunkDataSync) return null;
  if (chunkDataSync.startsWith("data: ")) {
    chunkDataSync = chunkDataSync.slice(6).trim();
  } else if (chunkDataSync.startsWith("data:")) {
    chunkDataSync = chunkDataSync.slice(5).trim();
  } else if (chunkDataSync.startsWith("{")) {
  } else {
    return null;
  }
  if (chunkDataSync === "[DONE]") {
    return null;
  }
  if (!chunkDataSync.startsWith("{")) {
    return null;
  }
  let parsedJson;
  try {
    parsedJson = JSON.parse(chunkDataSync);
  } catch (e) {
    throw new InvalidResponseDataError({
      data: chunkDataSync,
      message: `Failed to parse JSON chunk: ${e instanceof Error ? e.message : String(e)}`
    });
  }
  const validation = A2AJsonRpcResponseSchema.safeParse(parsedJson);
  if (!validation.success) {
    const parsed = parsedJson;
    const knownKinds = ["task", "status-update", "artifact-update"];
    const resultKind = parsed?.result?.kind;
    if (resultKind && !knownKinds.includes(resultKind)) {
      Logger.warn(`Skipping A2A chunk with unknown result kind: '${resultKind}'`);
      return null;
    }
    throw new InvalidResponseDataError({
      data: parsedJson,
      message: `Chunk validation failed: ${validation.error.message}`
    });
  }
  return validation.data;
}
async function* parseA2AStream(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          const parsed = parseChunkLine(trimmed);
          if (parsed) yield parsed;
        }
      }
    }
    if (buffer.trim()) {
      const parsed = parseChunkLine(buffer.trim());
      if (parsed) yield parsed;
    }
  } finally {
    reader.releaseLock();
  }
}

// src/session.ts
var InMemorySessionStore = class {
  sessions = /* @__PURE__ */ new Map();
  ttlMs;
  maxEntries;
  constructor(options) {
    const defaultTtlMs = 1e3 * 60 * 60;
    const defaultMaxEntries = 1e3;
    if (options?.ttlMs !== void 0) {
      if (typeof options.ttlMs !== "number" || !Number.isFinite(options.ttlMs) || options.ttlMs <= 0) {
        throw new RangeError(`ttlMs must be a finite positive number, but got: ${options.ttlMs}`);
      }
      this.ttlMs = options.ttlMs;
    } else {
      this.ttlMs = defaultTtlMs;
    }
    if (options?.maxEntries !== void 0) {
      if (typeof options.maxEntries !== "number" || !Number.isFinite(options.maxEntries) || options.maxEntries <= 0 || !Number.isInteger(options.maxEntries)) {
        throw new RangeError(`maxEntries must be a finite positive integer, but got: ${options.maxEntries}`);
      }
      this.maxEntries = options.maxEntries;
    } else {
      this.maxEntries = defaultMaxEntries;
    }
  }
  isExpired(entry) {
    if (this.ttlMs === void 0) return false;
    return Date.now() - entry.lastAccessedAt > this.ttlMs;
  }
  evictIfNeeded() {
    if (this.maxEntries !== void 0 && this.sessions.size > this.maxEntries) {
      const oldestKey = this.sessions.keys().next().value;
      if (oldestKey !== void 0) {
        this.sessions.delete(oldestKey);
      }
    }
  }
  async get(sessionId) {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      if (this.isExpired(entry)) {
        this.sessions.delete(sessionId);
        return void 0;
      }
      entry.lastAccessedAt = Date.now();
      this.sessions.delete(sessionId);
      this.sessions.set(sessionId, entry);
      return { ...entry.session };
    }
    return void 0;
  }
  async update(sessionId, patch) {
    let entry = this.sessions.get(sessionId);
    if (entry && this.isExpired(entry)) {
      this.sessions.delete(sessionId);
      entry = void 0;
    }
    if (entry) {
      entry.session = { ...entry.session, ...patch };
      entry.lastAccessedAt = Date.now();
      this.sessions.delete(sessionId);
      this.sessions.set(sessionId, entry);
    } else {
      this.sessions.set(sessionId, {
        session: { ...patch },
        lastAccessedAt: Date.now()
      });
      this.evictIfNeeded();
    }
  }
  async delete(sessionId) {
    this.sessions.delete(sessionId);
  }
  async resetSession(sessionId) {
    const maskedId = sessionId.length > 8 ? `${sessionId.substring(0, 4)}...${sessionId.substring(sessionId.length - 4)}` : "***";
    Logger.info(`Resetting session context: ${maskedId}`);
    this.sessions.delete(sessionId);
  }
  async clear() {
    this.sessions.clear();
  }
  async prune() {
    if (this.ttlMs === void 0) return;
    const now = Date.now();
    for (const [key, entry] of this.sessions.entries()) {
      if (now - entry.lastAccessedAt > this.ttlMs) {
        this.sessions.delete(key);
      }
    }
  }
};

// src/fallback.ts
var DEFAULT_QUOTA_PATTERNS = [
  "exhausted your capacity",
  "rate limit exceeded",
  "quota exceeded",
  "resource exhausted",
  "too many requests"
];
var ALLOWED_VENDOR_QUOTA_CODES = /* @__PURE__ */ new Set([
  // ベンダー固有のエラーコードが必要な場合はここに追加
]);
function isQuotaError(error, config) {
  let statusCode;
  let message;
  let code;
  let responseBody;
  if (error instanceof APICallError) {
    statusCode = error.statusCode;
    message = error.message;
    if (typeof error.responseBody === "string") {
      responseBody = error.responseBody;
    }
  } else if (error instanceof Error) {
    message = error.message;
    if ("code" in error && typeof error.code === "number") {
      code = error.code;
    }
  } else if (error && typeof error === "object") {
    const record = error;
    if (typeof record.message === "string") message = record.message;
    if (typeof record.code === "number") code = record.code;
    if (record.isQuotaError === true) return true;
  } else if (typeof error === "string") {
    message = error;
  }
  if (statusCode === 429) return true;
  if (responseBody && isQuotaErrorMessage(responseBody, config)) return true;
  if (message && isQuotaErrorMessage(message, config)) return true;
  if (code !== void 0 && ALLOWED_VENDOR_QUOTA_CODES.has(code)) return true;
  return false;
}
function isQuotaErrorMessage(message, config) {
  const lowerMessage = message.toLowerCase();
  const patterns = [...DEFAULT_QUOTA_PATTERNS];
  if (config?.quotaErrorPatterns) {
    const validPatterns = config.quotaErrorPatterns.map((p2) => p2.trim()).filter((p2) => p2.length > 0);
    patterns.push(...validPatterns);
  }
  return patterns.some((pattern) => lowerMessage.includes(pattern.toLowerCase()));
}
function getNextFallbackModel(currentModelId, config, registry) {
  const chain = config.fallbackChain;
  if (chain.length === 0) return void 0;
  const currentIndex = chain.indexOf(currentModelId);
  let searchIndex = currentIndex === -1 ? 0 : currentIndex + 1;
  const maxIterations = chain.length;
  let iterations = 0;
  while (searchIndex < chain.length && iterations < maxIterations) {
    iterations++;
    const nextModelId = chain[searchIndex];
    if (nextModelId === currentModelId) {
      searchIndex++;
      continue;
    }
    if (registry) {
      const model = registry.getModel(nextModelId);
      if (!model) {
        Logger.info(`Fallback model '${nextModelId}' not found in registry. Trying next.`);
        searchIndex++;
        continue;
      }
    }
    return nextModelId;
  }
  return void 0;
}
function resolveFallbackConfig(config) {
  if (!config || !config.enabled) return void 0;
  return {
    enabled: true,
    // 重複エントリを除外する
    fallbackChain: config.fallbackChain ? Array.from(new Set(config.fallbackChain)) : [],
    quotaErrorPatterns: config.quotaErrorPatterns,
    maxRetries: config.maxRetries ?? 2
  };
}

// src/router.ts
var DefaultMultiAgentRouter = class {
  endpoints;
  constructor(endpoints) {
    const keys = /* @__PURE__ */ new Set();
    const modelToEndpoints = /* @__PURE__ */ new Map();
    for (const endpoint of endpoints) {
      if (endpoint.key) {
        if (keys.has(endpoint.key)) {
          throw new Error(`Duplicate agent key '${endpoint.key}' found`);
        }
        keys.add(endpoint.key);
      }
      const modelIds = this.getModelIds(endpoint);
      for (const modelId of modelIds) {
        if (!modelToEndpoints.has(modelId)) {
          modelToEndpoints.set(modelId, []);
        }
        modelToEndpoints.get(modelId).push(endpoint);
      }
    }
    for (const [modelId, matchingEndpoints] of modelToEndpoints.entries()) {
      if (matchingEndpoints.length > 1) {
        for (const endpoint of matchingEndpoints) {
          if (!endpoint.key) {
            throw new Error(`Model ID '${modelId}' is duplicated across multiple endpoints, but at least one endpoint lacks a unique 'key'. Ambiguous endpoints must have unique keys to be resolvable.`);
          }
        }
      }
    }
    this.endpoints = [...endpoints];
  }
  getModelIds(endpoint) {
    if (Array.isArray(endpoint.models)) {
      return endpoint.models;
    }
    return Object.entries(endpoint.models).filter(([_, value]) => value !== false).map(([key]) => key);
  }
  resolve(modelId) {
    const colonIndex = modelId.indexOf(":");
    if (colonIndex !== -1) {
      const agentKey = modelId.substring(0, colonIndex);
      const realModelId = modelId.substring(colonIndex + 1);
      const endpoint = this.endpoints.find((e) => e.key === agentKey);
      if (!endpoint) {
        throw new Error(`Agent key '${agentKey}' not found`);
      }
      const modelIds = this.getModelIds(endpoint);
      if (!modelIds.includes(realModelId)) {
        throw new Error(`Model '${realModelId}' not found on agent '${agentKey}'`);
      }
      if (Array.isArray(endpoint.models)) {
        return { endpoint, actualModelId: realModelId };
      } else {
        const modelEntry = endpoint.models[realModelId];
        if (typeof modelEntry === "object") {
          return { endpoint, config: modelEntry, actualModelId: realModelId };
        }
        return { endpoint, actualModelId: realModelId };
      }
    }
    const matches = [];
    for (const endpoint of this.endpoints) {
      if (Array.isArray(endpoint.models)) {
        if (endpoint.models.includes(modelId)) {
          matches.push({ endpoint });
        }
      } else {
        const modelEntry = endpoint.models[modelId];
        if (modelEntry !== void 0) {
          if (typeof modelEntry === "boolean") {
            if (modelEntry === true) {
              matches.push({ endpoint });
            }
          } else {
            matches.push({ endpoint, config: modelEntry });
          }
        }
      }
    }
    if (matches.length > 1) {
      const identities = matches.map((m2) => m2.endpoint.key || "anonymous").join(", ");
      throw new Error(`Ambiguous model ID '${modelId}' found in multiple endpoints: ${identities}. Please use 'agentKey:modelId' syntax.`);
    }
    if (matches.length === 1) {
      return { ...matches[0], actualModelId: modelId };
    }
    return void 0;
  }
  getEndpoints() {
    return [...this.endpoints];
  }
};

// src/utils/constants.ts
var META_TOOLS = [
  "activate_skill",
  "load_skill",
  "search_skills",
  "search_skills_by_id",
  "search_skills_by_name",
  "brainstorming",
  "writing-plans"
];

// src/provider.ts
var DEFAULT_CHUNK_TIMEOUT_MS = 10 * 60 * 1e3;
var MAX_CONTEXT_CACHE = 100;
var BACKGROUND_TOOLS = ["codebase_investigator", "generalist"];
function isAutoConfirmTarget(part, textPartCounter = 0, reasoningPartCounter = 0, autoConfirmCount = 0, maxAutoConfirm = 5) {
  if (!part) return false;
  if (autoConfirmCount >= maxAutoConfirm) return false;
  const internalToolNames = part.internalToolNames || [];
  const isBackgroundTool = internalToolNames.some((name14) => BACKGROUND_TOOLS.includes(name14));
  const isMetaTool = internalToolNames.some((name14) => META_TOOLS.includes(name14));
  if (isMetaTool) {
    return part.inputRequired === true && part.hasExposedTools !== true;
  }
  const hasSpoken = textPartCounter > 0 || reasoningPartCounter > 0;
  if (part.coderAgentKind === "tool-call-confirmation") {
    return part.inputRequired === true && part.hasExposedTools !== true;
  }
  if (isBackgroundTool) {
    return part.inputRequired === true && part.hasExposedTools !== true;
  }
  const isInternalRecall = part.coderAgentKind === "internal-tool-call";
  if (isInternalRecall) {
    return part.inputRequired === true && part.hasExposedTools !== true;
  }
  if (part.coderAgentKind === "state-change") {
    return part.inputRequired === true && part.hasExposedTools !== true;
  }
  return false;
}
async function* withChunkTimeout(iterable, timeoutMs) {
  const iterator = iterable[Symbol.asyncIterator]();
  try {
    while (true) {
      let timeoutHandle;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`Chunk timeout after ${timeoutMs}ms. The upstream agent may be stuck.`));
        }, timeoutMs);
      });
      try {
        const nextPromise = iterator.next();
        const result = await Promise.race([nextPromise, timeoutPromise]);
        if (result.done) break;
        yield result.value;
      } finally {
        clearTimeout(timeoutHandle);
      }
    }
  } finally {
    if (typeof iterator.return === "function") {
      try {
        await iterator.return();
      } catch (e) {
      }
    }
  }
}
var OpenCodeGeminiA2AProvider = class _OpenCodeGeminiA2AProvider {
  options;
  client;
  serverVersionChecked = false;
  sessionStore;
  contextToolFrequency = /* @__PURE__ */ new Map();
  modelId;
  modelID;
  specificationVersion = "v2";
  provider = "opencode-geminicli-a2a";
  providerId = "opencode-geminicli-a2a";
  providerID = "opencode-geminicli-a2a";
  id = "opencode-geminicli-a2a";
  name = "Gemini CLI (A2A)";
  supportedUrls = {};
  unregisterConfigWatcher;
  constructor(modelId, options = {}) {
    this.modelId = modelId;
    this.modelID = modelId;
    this.options = options;
    this.sessionStore = options.sessionStore || new InMemorySessionStore();
    if (options.hotReload) {
      this.unregisterConfigWatcher = ConfigManager.getInstance().onChange(() => {
        Logger.info(`[Provider] Hot-reloading configuration for model ${this.modelId}`);
        this.client = void 0;
      });
    }
  }
  dispose() {
    if (this.unregisterConfigWatcher) {
      this.unregisterConfigWatcher();
    }
  }
  async ensureClient() {
    if (this.client) {
      await this.checkServerVersion();
      return;
    }
    const config = resolveConfig(this.options);
    const agents = config.agents;
    if (agents && agents.length > 0) {
      const router = new DefaultMultiAgentRouter(agents);
      const resolved = router.resolve(this.modelId);
      if (resolved) {
        const agentConfig = {
          ...config,
          host: resolved.endpoint.host,
          port: resolved.endpoint.port,
          protocol: resolved.endpoint.protocol || config.protocol,
          token: resolved.endpoint.token || config.token
        };
        this.client = new A2AClient(agentConfig);
        await this.checkServerVersion();
        return;
      }
    }
    this.client = new A2AClient(config);
    await this.checkServerVersion();
  }
  /**
   * A2Aサーバーのバージョンを確認し、必要条件(>=0.35.0)を満たさない場合は警告またはエラーを出す。
   */
  async checkServerVersion() {
    if (!this.client || this.serverVersionChecked || process.env.NODE_ENV === "test") return;
    try {
      const info = await this.client.getServerInfo();
      if (!info || !info.version) {
        Logger.warn("[Provider] Could not verify A2A server version. Some features might not work as expected.");
        this.serverVersionChecked = true;
        return;
      }
      const version = info.version;
      const [major, minor, patch] = version.split(".").map(Number);
      if (major === 0 && minor < 35) {
        const errorMsg = `[Provider] A2A server version ${version} is outdated. Version 0.35.0 or higher is required for dynamic model selection and improved tool handling. Please update with 'npm install -g @google/gemini-cli-a2a-server@latest'.`;
        Logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      Logger.info(`[Provider] Connected to A2A server v${version}`);
      this.serverVersionChecked = true;
    } catch (err) {
      if (err instanceof Error && err.message.includes("outdated")) {
        throw err;
      }
      Logger.debug("[Provider] Version check failed, continuing anyway:", err);
      this.serverVersionChecked = true;
    }
  }
  get resolvedOptions() {
    return resolveConfig(this.options);
  }
  async doStream(options) {
    const serverReady = this._serverReady;
    if (serverReady instanceof Promise) {
      try {
        await serverReady;
      } catch (err) {
        Logger.error("[Provider] Aborting stream because server failed to start:", err);
        throw err;
      }
    }
    await this.ensureClient();
    const sessionId = options.headers?.["x-opencode-session-id"] || options.headers?.["x-session-id"] || options.providerMetadata?.opencode?.sessionId;
    let session = sessionId ? await this.sessionStore.get(sessionId) : void 0;
    const resetContext = options.providerMetadata?.opencode?.resetContext || options.providerOptions?.opencode?.resetContext;
    if (session && resetContext) {
      session.contextId = void 0;
      session.taskId = void 0;
      if (sessionId && sessionId !== "undefined") {
        await this.sessionStore.update(sessionId, session);
      }
    }
    if (!session) {
      session = {
        contextId: void 0,
        taskId: void 0,
        processedMessagesCount: 0,
        toolCallFrequency: {},
        fallbackCounters: {}
      };
      if (sessionId && sessionId !== "undefined") {
        await this.sessionStore.update(sessionId, session);
      }
    }
    const idempotencyKey = options.headers?.["idempotency-key"] || options.headers?.["x-opencode-idempotency-key"] || options.providerMetadata?.opencode?.idempotencyKey || import_node_crypto3.default.randomUUID();
    const baseConfig = this.resolvedOptions;
    let agentOptions = void 0;
    let actualModelId = this.modelId;
    if (baseConfig.agents && this.modelId === "auto") {
      const router = new DefaultMultiAgentRouter(baseConfig.agents);
      const resolved = router.resolve(this.modelId);
      if (resolved) {
        actualModelId = resolved.actualModelId;
        if (resolved.config && resolved.config.options) {
          agentOptions = resolved.config.options;
        }
      }
    }
    const resolvedBaseConfig = {
      ...baseConfig,
      ...agentOptions || {}
    };
    const generationConfig = {
      ...baseConfig.generationConfig || {},
      ...agentOptions?.generationConfig || {},
      ...options.generationConfig || {}
    };
    const setNum = (key, val) => {
      if (typeof val === "number") generationConfig[key] = val;
    };
    setNum("temperature", options.temperature);
    setNum("topP", options.topP);
    setNum("topK", options.topK);
    if (typeof options.maxTokens === "number") generationConfig.maxOutputTokens = options.maxTokens;
    if (Array.isArray(options.stopSequences)) generationConfig.stopSequences = options.stopSequences;
    const mapOptions = {
      tools: options.mode?.type === "regular" ? options.mode.tools : options.tools || void 0,
      toolMapping: resolvedBaseConfig.toolMapping,
      internalTools: resolvedBaseConfig.internalTools,
      contextId: session.contextId,
      taskId: session.taskId,
      processedMessagesCount: session.processedMessagesCount,
      modelId: actualModelId,
      generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : void 0,
      toolChoice: options.toolChoice
    };
    const initialRequestData = mapPromptToA2AJsonRpcRequest(options.prompt, mapOptions);
    const serializedRequestForTest = JSON.stringify(initialRequestData);
    const toolsArr = options.mode?.type === "regular" ? options.mode.tools : options.tools || [];
    const clientTools = toolsArr ? toolsArr.map((t3) => t3.function?.name || t3.name || t3.type).filter((n4) => !!n4) : [];
    const isNewUserTurn = options.prompt.slice(session.processedMessagesCount || 0).some((m2) => m2.role === "user");
    const startTime = Date.now();
    const isTestEnv = process.env.NODE_ENV === "test";
    const TIMEOUT_MS = isTestEnv ? 3e3 : 6e5;
    const timeoutAbortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      timeoutAbortController.abort("EXECUTION_TIMEOUT");
    }, TIMEOUT_MS);
    const combinedAbortController = new AbortController();
    if (options.abortSignal) {
      options.abortSignal.addEventListener("abort", () => combinedAbortController.abort(options.abortSignal?.reason), { once: true });
    }
    timeoutAbortController.signal.addEventListener("abort", () => combinedAbortController.abort(timeoutAbortController.signal.reason), { once: true });
    let responseStream;
    let headers;
    let lastFinishPart = void 0;
    try {
      const firstChatResponse = await this.client.chatStream({
        request: initialRequestData,
        abortSignal: combinedAbortController.signal,
        idempotencyKey
      });
      responseStream = firstChatResponse.stream;
      headers = firstChatResponse.headers;
    } catch (error) {
      const currentFallbackConfig = resolveFallbackConfig(this.options.fallback);
      if (isQuotaError(error, currentFallbackConfig) && currentFallbackConfig) {
        const counters = session.fallbackCounters || {};
        const totalRetries = Object.values(counters).reduce((sum, val) => sum + val, 0);
        if (totalRetries < (currentFallbackConfig.maxRetries ?? 3)) {
          const nextModel = getNextFallbackModel(this.modelId, currentFallbackConfig);
          if (nextModel) {
            Logger.warn(`Quota exceeded for ${this.modelId}. Falling back to ${nextModel}. Total retries: ${totalRetries + 1}`);
            counters[this.modelId] = (counters[this.modelId] || 0) + 1;
            session.fallbackCounters = counters;
            if (sessionId && sessionId !== "undefined") await this.sessionStore.update(sessionId, { fallbackCounters: counters });
            const provider2 = new _OpenCodeGeminiA2AProvider(nextModel, {
              ...this.options,
              sessionStore: this.sessionStore
            });
            clearTimeout(timeoutHandle);
            return provider2.doStream({
              ...options,
              headers: {
                ...options.headers,
                "idempotency-key": idempotencyKey
              }
            });
          }
        } else {
          Logger.error(`Max fallback retries reached (${totalRetries}). Giving up.`);
        }
      }
      clearTimeout(timeoutHandle);
      throw error;
    }
    const frequencyContextId = session.contextId;
    if (isNewUserTurn && sessionId) {
      session.toolCallFrequency = {};
      if (frequencyContextId) {
        this.contextToolFrequency.delete(frequencyContextId);
      }
    }
    const instanceFreq = frequencyContextId ? this.contextToolFrequency.get(frequencyContextId) : void 0;
    const mapper = new A2AStreamMapper({
      toolMapping: resolvedBaseConfig.toolMapping,
      internalTools: resolvedBaseConfig.internalTools,
      clientTools,
      initialToolCallFrequency: instanceFreq ?? session.toolCallFrequency,
      maxToolCallFrequency: resolvedBaseConfig.maxToolCallFrequency ?? this.options?.maxToolCallFrequency
    });
    const stream = new ReadableStream({
      start: (controller) => {
        let textPartCounter = 0;
        let reasoningPartCounter = 0;
        let activeTextId;
        let activeReasoningId;
        let isControllerClosed = false;
        const safeEnqueue = (part) => {
          if (!isControllerClosed) {
            try {
              const isDeltaPart = part.type === "text-delta" || part.type === "reasoning-delta";
              const content = part.textDelta || part.reasoningDelta || "";
              const compatibilityPart = isDeltaPart ? {
                ...part,
                // Satisfy 'expected string, received object' -> must be string
                // Satisfy 'evaluating chunk.delta.length' -> must not be undefined
                delta: typeof content === "string" ? content : "",
                // Some consumers might look for top-level content
                content: typeof content === "string" ? content : ""
              } : part;
              controller.enqueue(compatibilityPart);
            } catch (e) {
              if (process.env.DEBUG_OPENCODE) {
                Logger.debug("[Provider] controller closed while enqueuing part");
              }
              isControllerClosed = true;
            }
          }
        };
        const safeError = (err) => {
          if (!isControllerClosed) {
            controller.error(err);
            isControllerClosed = true;
          }
        };
        const safeClose = () => {
          if (!isControllerClosed) {
            controller.close();
            isControllerClosed = true;
          }
        };
        const closeText = () => {
          if (activeTextId !== void 0) {
            safeEnqueue({ type: "text-end", id: activeTextId });
            activeTextId = void 0;
          }
        };
        const closeReasoning = () => {
          if (activeReasoningId !== void 0) {
            safeEnqueue({ type: "reasoning-end", id: activeReasoningId });
            activeReasoningId = void 0;
          }
        };
        const enqueueText = (delta) => {
          if (typeof delta !== "string" || delta.length === 0) return;
          if (activeTextId === void 0) {
            activeTextId = `text-${textPartCounter++}`;
            safeEnqueue({ type: "text-start", id: activeTextId });
          }
          safeEnqueue({
            type: "text-delta",
            id: activeTextId,
            textDelta: delta,
            // Compatibility for older/strict OpenCode consumers
            delta
          });
        };
        const enqueueReasoning = (delta) => {
          if (typeof delta !== "string" || delta.length === 0) return;
          if (resolvedBaseConfig.showReasoning === false) return;
          closeText();
          if (activeReasoningId === void 0) {
            activeReasoningId = `reasoning-${reasoningPartCounter++}`;
            safeEnqueue({ type: "reasoning-start", id: activeReasoningId });
          }
          safeEnqueue({
            type: "reasoning-delta",
            id: activeReasoningId,
            reasoningDelta: delta,
            delta
          });
        };
        (async () => {
          try {
            let currentRequest = initialRequestData;
            let autoConfirmCount = 0;
            let toolCallConfirmCount = 0;
            const MAX_AUTO_CONFIRM = this.options.maxAutoConfirm || 100;
            const MAX_TOOL_CONFIRM = 1;
            let firstResponse = { stream: responseStream, headers: headers || {} };
            let consecutiveNoProgressTurns = 0;
            const loop = async () => {
              while (true) {
                if (Date.now() - startTime > TIMEOUT_MS) {
                  throw new Error("EXECUTION_TIMEOUT");
                }
                let hasFinishedInThisTurn = false;
                let turnProducedText = false;
                let turnProducedReasoning = false;
                let turnProducedToolCall = false;
                const response = firstResponse || await this.client.chatStream({
                  request: currentRequest,
                  abortSignal: combinedAbortController.signal,
                  idempotencyKey
                });
                firstResponse = void 0;
                mapper.startNewTurn();
                const chunkTimeoutMs = resolvedBaseConfig.chunkTimeoutMs ?? this.options?.chunkTimeoutMs ?? DEFAULT_CHUNK_TIMEOUT_MS;
                const chunkGenerator = withChunkTimeout(parseA2AStream(response.stream), chunkTimeoutMs);
                try {
                  for await (const chunk of chunkGenerator) {
                    if (combinedAbortController.signal.aborted) {
                      throw combinedAbortController.signal.reason || new Error("Aborted");
                    }
                    if ("error" in chunk && chunk.error) {
                      throw new Error(`A2A Server Error: ${chunk.error.code} - ${chunk.error.message}`);
                    }
                    if ("result" in chunk && chunk.result) {
                      const parts = mapper.mapResult(chunk.result);
                      for (const part of parts) {
                        if (part.type === "text-delta") {
                          const text = part.textDelta || "";
                          const isMetaTalk = /non-interactive|confirmation|allow-tool-execution|environment|制限|確認|非対話|承認|許可|フラグ|環境変数|headless|proceeding|initializing/i.test(text);
                          if (!isMetaTalk && text.trim().length > 0) {
                            turnProducedText = true;
                          }
                          enqueueText(text);
                        }
                        if (part.type === "reasoning-delta") {
                          const reason = part.reasoningDelta || "";
                          const isMetaReasoning = /confirmation|failed|error|blocked|requires|supported|initializing|preparing|checking/i.test(reason);
                          if (!isMetaReasoning && reason.trim().length > 0) {
                            turnProducedReasoning = true;
                          }
                          enqueueReasoning(reason);
                        }
                        if (part.type === "tool-call") {
                          turnProducedToolCall = true;
                        }
                        switch (part.type) {
                          case "text-delta": {
                            break;
                          }
                          case "reasoning-delta": {
                            break;
                          }
                          // ... (rest of the switch)
                          case "tool-call": {
                            closeText();
                            closeReasoning();
                            let toolName = part.toolName;
                            const args = typeof part.args === "string" ? part.args : JSON.stringify(part.args);
                            if (toolName === "list_directory" || toolName === "list") {
                              toolName = "glob";
                            } else if (toolName === "run_shell_command" || toolName === "execute_command") {
                              toolName = "bash";
                            } else if (toolName === "read_file" || toolName === "read_multiple_files") {
                              toolName = "read";
                            }
                            safeEnqueue({
                              type: "tool-call",
                              toolCallId: part.toolCallId,
                              toolName,
                              args
                            });
                            break;
                          }
                          case "finish": {
                            hasFinishedInThisTurn = true;
                            lastFinishPart = part;
                            if (!isAutoConfirmTarget(lastFinishPart, textPartCounter, reasoningPartCounter, autoConfirmCount, MAX_AUTO_CONFIRM)) {
                              if (autoConfirmCount >= MAX_AUTO_CONFIRM) {
                                closeReasoning();
                                enqueueText(`

[opencode-geminicli-a2a] \u26A0\uFE0F \u5185\u90E8\u30C4\u30FC\u30EB\u306E\u81EA\u52D5\u5B9F\u884C\u304C\u4E0A\u9650\uFF08${MAX_AUTO_CONFIRM}\u56DE\uFF09\u306B\u9054\u3057\u307E\u3057\u305F\u3002\u51E6\u7406\u3092\u4E2D\u65AD\u3057\u307E\u3059\u3002
`);
                              }
                              closeText();
                              closeReasoning();
                              const unifiedFinishReason = lastFinishPart.finishReason === "unknown" ? "stop" : lastFinishPart.finishReason;
                              safeEnqueue({
                                type: "finish",
                                finishReason: unifiedFinishReason,
                                usage: {
                                  promptTokens: lastFinishPart.usage.promptTokens,
                                  completionTokens: lastFinishPart.usage.completionTokens
                                }
                              });
                            }
                            break;
                          }
                          default:
                            safeEnqueue(part);
                            break;
                        }
                      }
                    } else if ("error" in chunk && chunk.error) {
                      throw new Error(`A2A JSON-RPC Error: [${chunk.error.code}] ${chunk.error.message}`);
                    }
                  }
                } catch (e) {
                  if (e.message === "CHUNK_TIMEOUT") {
                    Logger.warn(`[Provider] Chunk timeout reached (${chunkTimeoutMs}ms).`);
                  }
                  throw e;
                }
                if (!hasFinishedInThisTurn || !lastFinishPart) {
                  throw new Error("A2A stream disconnected before sending final status-update.");
                }
                if (lastFinishPart.shouldInterruptLoop) {
                  Logger.warn(`[auto-confirm] Loop detected. Force terminating.`);
                  closeReasoning();
                  enqueueText(`

[opencode-geminicli-a2a] \u26A0\uFE0F \u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u304C\u540C\u4E00\u306E\u5185\u90E8\u30C4\u30FC\u30EB\u3092\u4F55\u5EA6\u3082\u547C\u3073\u51FA\u3057\u305F\u305F\u3081\u3001\u30EB\u30FC\u30D7\u3092\u5F37\u5236\u4E2D\u65AD\u3057\u307E\u3057\u305F\u3002
`);
                  closeText();
                  safeEnqueue({
                    type: "finish",
                    finishReason: "stop",
                    usage: {
                      promptTokens: lastFinishPart.usage.promptTokens || 0,
                      completionTokens: lastFinishPart.usage.completionTokens || 0
                    }
                  });
                  if (lastFinishPart.taskId) {
                    const cancelParam = buildConfirmationRequest(lastFinishPart.taskId, actualModelId, false, mapper.contextId);
                    this.client.chatStream({ request: cancelParam, abortSignal: timeoutAbortController.signal }).catch((err) => {
                      Logger.error(`[Provider] Failed to send loop-interrupt Cancel to A2A server:`, err);
                    });
                  }
                  break;
                }
                const canAutoConfirm = isAutoConfirmTarget(
                  lastFinishPart,
                  textPartCounter,
                  reasoningPartCounter,
                  autoConfirmCount,
                  MAX_AUTO_CONFIRM
                );
                if (canAutoConfirm) {
                  if (!turnProducedText && !turnProducedToolCall && !turnProducedReasoning) {
                    consecutiveNoProgressTurns++;
                  } else {
                    consecutiveNoProgressTurns = 0;
                  }
                  if (consecutiveNoProgressTurns >= 3) {
                    Logger.warn(`[Provider] Detected possible reasoning/confirmation loop (3 turns without progress). Breaking to unlock UI.`);
                    closeText();
                    closeReasoning();
                    safeEnqueue({
                      type: "finish",
                      finishReason: "stop",
                      usage: { promptTokens: 0, completionTokens: 0 }
                    });
                    if (lastFinishPart.taskId) {
                      const cancelParam = buildConfirmationRequest(lastFinishPart.taskId, actualModelId, false, mapper.contextId);
                      this.client.chatStream({ request: cancelParam, abortSignal: timeoutAbortController.signal }).catch(() => {
                      });
                    }
                    break;
                  }
                  autoConfirmCount++;
                  const internalToolInfo = lastFinishPart.internalToolNames?.length ? ` (\u5185\u90E8\u30C4\u30FC\u30EB: ${lastFinishPart.internalToolNames.join(", ")})` : "";
                  if (autoConfirmCount === 1) {
                    enqueueReasoning(`[opencode-geminicli-a2a] \u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u306E\u521D\u671F\u5316\u3092\u81EA\u52D5\u627F\u8A8D\u3057\u3066\u3044\u307E\u3059${internalToolInfo}...
`);
                  } else {
                    enqueueReasoning(`[opencode-geminicli-a2a] \u5185\u90E8\u7684\u306A\u5BFE\u8A71\u3092\u7D99\u7D9A\u3057\u3066\u3044\u307E\u3059 (${autoConfirmCount}\u56DE\u76EE)...
`);
                  }
                  Logger.warn(`[Debug-Loop] canAutoConfirm: true, autoConfirmCount: ${autoConfirmCount}, lastFinishPart.coderAgentKind: ${lastFinishPart.coderAgentKind}`);
                  if (lastFinishPart.taskId) {
                    currentRequest = buildConfirmationRequest(
                      lastFinishPart.taskId,
                      actualModelId,
                      true,
                      mapper.contextId
                    );
                    mapper.startNewTurn();
                    continue;
                  }
                }
                const isToolCallConfirm = lastFinishPart.coderAgentKind === "tool-call-confirmation" && lastFinishPart.hasExposedTools === true;
                if (isToolCallConfirm && lastFinishPart.taskId) {
                  if (toolCallConfirmCount < MAX_TOOL_CONFIRM) {
                    toolCallConfirmCount++;
                    currentRequest = buildConfirmationRequest(
                      lastFinishPart.taskId,
                      actualModelId,
                      true,
                      mapper.contextId
                    );
                    mapper.startNewTurn();
                    continue;
                  } else {
                    Logger.warn(`[auto-confirm] MAX_TOOL_CONFIRM reached. Forcing stop.`);
                    closeReasoning();
                    closeText();
                    safeEnqueue({
                      type: "finish",
                      finishReason: "stop",
                      usage: { promptTokens: 0, completionTokens: 0 }
                    });
                    if (lastFinishPart.taskId) {
                      const cancelParam = buildConfirmationRequest(lastFinishPart.taskId, actualModelId, false, mapper.contextId);
                      this.client.chatStream({ request: cancelParam, abortSignal: timeoutAbortController.signal }).catch(() => {
                      });
                    }
                    break;
                  }
                }
                if (lastFinishPart.taskId && !canAutoConfirm && lastFinishPart.inputRequired) {
                  const cancelParam = buildConfirmationRequest(lastFinishPart.taskId, actualModelId, false, mapper.contextId);
                  this.client.chatStream({ request: cancelParam, abortSignal: timeoutAbortController.signal }).catch(() => {
                  });
                }
                break;
              }
            };
            await loop();
          } catch (err) {
            const isTimeout = err.message === "EXECUTION_TIMEOUT" || err.name === "AbortError" || err.name === "AbortError";
            if (isTimeout) {
              closeReasoning();
              Logger.warn(`[Provider] doStream reached timeout or abort.`);
              enqueueText(`

[opencode-geminicli-a2a] \u26A0\uFE0F \u51E6\u7406\u304C\u30BF\u30A4\u30E0\u30A2\u30A6\u30C8\u3057\u305F\u304B\u3001\u4E2D\u65AD\u3055\u308C\u307E\u3057\u305F\u3002
`);
              closeText();
              safeEnqueue({
                type: "finish",
                finishReason: "stop",
                usage: {
                  promptTokens: 0,
                  completionTokens: 0
                }
              });
            } else {
              const message = err instanceof Error ? err.message : String(err);
              Logger.error(`[Provider] Fatal stream error:`, err);
              closeReasoning();
              enqueueText(`

[opencode-geminicli-a2a] \u274C \u81F4\u547D\u7684\u306A\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F: ${message}
`);
              closeText();
              safeEnqueue({
                type: "finish",
                finishReason: "error",
                usage: { promptTokens: 0, completionTokens: 0 }
              });
            }
          } finally {
            clearTimeout(timeoutHandle);
            if (sessionId && sessionId !== "undefined" && session) {
              const updatedFreq = mapper.currentToolCallFrequency;
              const updatedContextId = mapper.contextId || session.contextId;
              if (updatedContextId) {
                if (!this.contextToolFrequency.has(updatedContextId) && this.contextToolFrequency.size >= MAX_CONTEXT_CACHE) {
                  const oldestKey = this.contextToolFrequency.keys().next().value;
                  if (oldestKey !== void 0) this.contextToolFrequency.delete(oldestKey);
                }
                this.contextToolFrequency.set(updatedContextId, updatedFreq);
              }
              await this.sessionStore.update(sessionId, {
                contextId: mapper.contextId || session.contextId,
                taskId: mapper.taskId || session.taskId,
                processedMessagesCount: options.prompt.length,
                toolCallFrequency: updatedFreq,
                inputRequired: lastFinishPart?.inputRequired,
                rawState: lastFinishPart?.inputRequired ? "input-required" : void 0
              });
            }
            safeClose();
          }
        })();
      }
    });
    return {
      stream,
      request: { body: serializedRequestForTest },
      response: { headers }
    };
  }
  async doGenerate(options) {
    const { stream: sdkStream, request, response } = await this.doStream(options);
    const reader = sdkStream.getReader();
    let reasoning = "";
    const toolCalls = [];
    const content = [];
    let finishReason = "other";
    const usage = { promptTokens: 0, completionTokens: 0 };
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        switch (value.type) {
          case "text-delta": {
            const delta = value.textDelta || value.delta;
            if (delta) {
              if (content.length > 0 && content[content.length - 1].type === "text") {
                content[content.length - 1].text += delta;
              } else {
                content.push({ type: "text", text: delta });
              }
            }
            break;
          }
          case "reasoning-delta": {
            const delta = value.reasoningDelta || value.delta;
            if (delta) {
              reasoning += delta;
            }
            break;
          }
          case "tool-call":
            toolCalls.push({
              toolCallId: value.toolCallId,
              toolName: value.toolName,
              args: value.args
            });
            content.push({
              type: "tool-call",
              toolCallId: value.toolCallId,
              toolName: value.toolName,
              args: value.args
            });
            break;
          case "finish":
            finishReason = value.finishReason;
            if (value.usage) {
              usage.promptTokens = value.usage.promptTokens ?? 0;
              usage.completionTokens = value.usage.completionTokens ?? 0;
            }
            break;
        }
      }
    } finally {
      reader.releaseLock();
    }
    return {
      text: content.filter((p2) => p2.type === "text").map((p2) => p2.text).join(""),
      toolCalls: toolCalls.length > 0 ? toolCalls : void 0,
      content,
      finishReason,
      usage,
      response,
      request,
      warnings: [],
      reasoning: reasoning.length > 0 ? reasoning : void 0
    };
  }
};

// src/model-registry.ts
var import_node_fs4 = __toESM(require("node:fs"), 1);
var DEFAULT_MODELS = [
  Object.freeze({ id: "auto", name: "Auto (Dynamic Model Selection)" }),
  Object.freeze({ id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview (A2A)" }),
  Object.freeze({ id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview (A2A)" }),
  Object.freeze({ id: "gemini-3.1-pro-preview-customtools", name: "Gemini 3.1 Pro Preview Custom Tools (A2A)" }),
  Object.freeze({ id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview (A2A)" }),
  Object.freeze({ id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (A2A)" }),
  Object.freeze({ id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (A2A)" }),
  Object.freeze({ id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite (A2A)" })
];
function parseModelsConfig(raw) {
  if (!raw || typeof raw !== "object") return void 0;
  const models = [];
  for (const [key, value] of Object.entries(raw)) {
    if (value && typeof value === "object" && "id" in value && "name" in value) {
      const rawId = value.id;
      const rawName = value.name;
      if ((typeof rawId === "string" || typeof rawId === "number") && (typeof rawName === "string" || typeof rawName === "number")) {
        const strId = String(rawId);
        const strName = String(rawName);
        if (strId && strName) {
          const endpointKey = value.endpointKey;
          models.push({
            id: strId,
            name: strName,
            ...typeof endpointKey === "string" && endpointKey ? { endpointKey } : {}
          });
        }
      }
    } else if (typeof value === "string" && value && key) {
      models.push({ id: key, name: value });
    }
  }
  return models.length > 0 ? models : void 0;
}
function loadModelsFromConfig() {
  try {
    let modelsConfig;
    if (process.env["OPENCODE_A2A_MODELS"]) {
      modelsConfig = JSON.parse(process.env["OPENCODE_A2A_MODELS"]);
    } else if (process.env["OPENCODE_A2A_MODELS_PATH"]) {
      if (import_node_fs4.default.existsSync(process.env["OPENCODE_A2A_MODELS_PATH"])) {
        modelsConfig = JSON.parse(import_node_fs4.default.readFileSync(process.env["OPENCODE_A2A_MODELS_PATH"], "utf8"));
      }
    }
    return parseModelsConfig(modelsConfig);
  } catch (err) {
    Logger.error("Failed to load custom models configuration; using default models.", err);
    return void 0;
  }
}
var StaticModelRegistry = class {
  models = /* @__PURE__ */ new Map();
  initialModels;
  constructor(initialModels) {
    this.initialModels = initialModels ? initialModels.map((model) => Object.freeze({ ...model })) : void 0;
    this.resolveModels();
  }
  resolveModels() {
    const source = this.initialModels ?? loadModelsFromConfig() ?? DEFAULT_MODELS;
    this.models.clear();
    for (const model of source) {
      this.models.set(model.id, Object.freeze({ ...model }));
    }
  }
  listModels() {
    return Array.from(this.models.values());
  }
  getModel(modelId) {
    return this.models.get(modelId);
  }
  refresh() {
    this.resolveModels();
  }
  toRecord() {
    const record = {};
    for (const [id, info] of this.models) {
      record[id] = info;
    }
    return record;
  }
};

// src/server-manager.ts
var import_node_child_process = require("node:child_process");
var import_node_net2 = require("node:net");
var import_node_fs5 = require("node:fs");
var import_node_util2 = require("node:util");
var import_node_path3 = __toESM(require("node:path"), 1);
var execAsync = (0, import_node_util2.promisify)(import_node_child_process.exec);
function probePort(port, host) {
  return new Promise((resolve) => {
    const sock = (0, import_node_net2.createConnection)({ port, host });
    sock.once("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.once("error", () => resolve(false));
    sock.setTimeout(300, () => {
      sock.destroy();
      resolve(false);
    });
  });
}
function waitForPort(port, host, timeoutMs, pollMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const poll = async () => {
      if (await probePort(port, host)) {
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error(`[ServerManager] A2A server did not become ready on ${host}:${port} within ${timeoutMs}ms`));
        return;
      }
      setTimeout(poll, pollMs);
    };
    poll();
  });
}
var ServerManager = class _ServerManager {
  static instance;
  servers = /* @__PURE__ */ new Map();
  // keyed by host:port
  startingUp = /* @__PURE__ */ new Map();
  // keyed by host:port
  cleanupRegistered = false;
  cachedNpmRoot = null;
  constructor() {
  }
  static getInstance() {
    if (!_ServerManager.instance) {
      _ServerManager.instance = new _ServerManager();
    }
    return _ServerManager.instance;
  }
  /**
   * 指定ポートで A2A サーバーを起動する。
   * すでにそのポートでサーバーが動作している場合（外部プロセス含む）は起動をスキップする。
   * 返却値はプロセスをリリースするための関数。
   */
  async ensureRunning(port, host, modelId, config, debug) {
    const key = `${host}:${port}`;
    const existing = this.servers.get(key);
    if (existing) {
      if (existing.shutdownPromise) {
        Logger.debug(`[ServerManager] Waiting for existing server on ${key} to finish shutdown...`);
        await existing.shutdownPromise;
        return this.ensureRunning(port, host, modelId, config, debug);
      }
      existing.refCount++;
      Logger.info(`[ServerManager] Reusing managed server on ${key} (refCount=${existing.refCount})`);
      return this.makeReleaseFn(key, debug, existing);
    }
    const inflight = this.startingUp.get(key);
    if (inflight) {
      Logger.debug(`[ServerManager] Waiting for inflight startup on ${key}...`);
      inflight.waiterCount++;
      try {
        await inflight.promise;
        const existingInflight = this.servers.get(key);
        if (existingInflight) {
          Logger.info(`[ServerManager] Reusing managed server on ${key} after inflight (refCount=${existingInflight.refCount})`);
          return this.makeReleaseFn(key, debug, existingInflight);
        }
        Logger.warn(`[ServerManager] Inflight startup on ${key} finished but server not found in map. Retrying ensureRunning.`);
        return this.ensureRunning(port, host, modelId, config, debug);
      } finally {
      }
    }
    let resolveInflight;
    let rejectInflight;
    const inflightPromise = new Promise((res, rej) => {
      resolveInflight = res;
      rejectInflight = rej;
    });
    inflightPromise.catch(() => {
    });
    const slot = {
      promise: inflightPromise,
      resolve: resolveInflight,
      reject: rejectInflight,
      waiterCount: 0
    };
    this.startingUp.set(key, slot);
    try {
      const isListening = await probePort(port, host);
      if (this.startingUp.get(key) !== slot) {
        const err = new Error("Startup aborted: slot replaced during probePort");
        slot.reject(err);
        throw err;
      }
      if (isListening) {
        Logger.info(`Port ${key} already listening. Skipping auto-start.`);
        this.startingUp.delete(key);
        slot.resolve(null);
        return async () => {
        };
      }
      const startupPromise = (async () => {
        let proc = void 0;
        try {
          const serverPath = await this.resolveServerPath(config.serverPath);
          if (this.startingUp.get(key) !== slot) {
            throw new Error("Startup aborted: slot replaced or cleared");
          }
          const env = {
            ...process.env,
            CODER_AGENT_PORT: String(port),
            CODER_AGENT_HOST: host,
            A2A_GEMINI_MODEL: modelId,
            GEMINI_AUTO_APPROVE: "false",
            // 非対話型環境（stdin なし）でも ADC 認証で起動できるようにする
            // 参照: https://goo.gle/geminicli-updates
            GEMINI_CLI_USE_COMPUTE_ADC: "true",
            ...config.env
          };
          Logger.info(`Starting A2A server: node ${serverPath} (port=${port}, host=${host})`);
          proc = (0, import_node_child_process.spawn)("node", [serverPath], {
            env,
            stdio: ["ignore", "pipe", "pipe"],
            detached: false
          });
          slot.proc = proc;
          this.registerCleanup(debug);
          if (debug && proc.stdout) {
            proc.stdout.on("data", (d) => Logger.debug(`[A2A-${port}-stdout] ${d}`));
          }
          if (debug && proc.stderr) {
            proc.stderr.on("data", (d) => Logger.debug(`[A2A-${port}-stderr] ${d}`));
          }
          const pollMs = config.pollIntervalMs ?? 200;
          const timeoutMs = config.startupTimeoutMs ?? 6e4;
          let stdoutBuffer = "";
          let stderrBuffer = "";
          if (proc.stdout) proc.stdout.on("data", (d) => stdoutBuffer += d.toString());
          if (proc.stderr) proc.stderr.on("data", (d) => stderrBuffer += d.toString());
          try {
            await Promise.race([
              waitForPort(port, host, timeoutMs, pollMs),
              new Promise((_, reject) => {
                if (!proc) return;
                proc.once("error", (err) => reject(new Error(`A2A server spawn error: ${err.message}`)));
                proc.once("exit", (code) => {
                  const context = stderrBuffer ? `
Server Error Log:
${stderrBuffer}` : "";
                  reject(new Error(`A2A server exited early with code ${code ?? "unknown"}${context}`));
                });
              })
            ]);
          } catch (waitErr) {
            const logContext = stderrBuffer || stdoutBuffer;
            if (logContext) {
              Logger.error(`[ServerManager] Startup failure context:
${logContext}`);
            }
            throw waitErr;
          }
          if (this.startingUp.get(key) !== slot) {
            proc.kill();
            throw new Error("Startup aborted after successful spawn: slot cleared");
          }
          const entry = { proc, port, host, refCount: 1 + slot.waiterCount };
          this.servers.set(key, entry);
          proc.once("exit", (code) => {
            Logger.info(`A2A server on ${key} exited (code=${code})`);
            if (this.servers.get(key)?.proc === proc) {
              this.servers.delete(key);
            }
          });
          Logger.info(`A2A server on ${key} is ready. refCount=${entry.refCount}`);
          return this.makeReleaseFn(key, debug, entry);
        } catch (err) {
          if (proc) {
            try {
              proc.kill();
            } catch {
            }
          }
          throw err;
        } finally {
          if (this.startingUp.get(key) === slot) {
            this.startingUp.delete(key);
          }
        }
      })();
      startupPromise.then((res) => slot.resolve(res)).catch((err) => slot.reject(err));
      return startupPromise;
    } catch (err) {
      if (this.startingUp.get(key) === slot) {
        this.startingUp.delete(key);
      }
      slot.reject(err);
      throw err;
    }
  }
  /** @google/gemini-cli-a2a-server の .mjs ファイルを自動検出する */
  async resolveServerPath(overridePath) {
    if (overridePath) {
      if (!(0, import_node_fs5.existsSync)(overridePath)) {
        throw new Error(`[ServerManager] Specified serverPath does not exist: ${overridePath}`);
      }
      return overridePath;
    }
    const localPath = import_node_path3.default.join(process.cwd(), "node_modules", "@google", "gemini-cli-a2a-server", "dist", "a2a-server.mjs");
    if ((0, import_node_fs5.existsSync)(localPath)) {
      Logger.info(`[ServerManager] Using local patched A2A server: ${localPath}`);
      return localPath;
    }
    try {
      if (!this.cachedNpmRoot) {
        const { stdout } = await execAsync("npm root -g", { timeout: 5e3 });
        this.cachedNpmRoot = stdout.trim() || null;
      }
      if (this.cachedNpmRoot) {
        const globalPath = import_node_path3.default.join(this.cachedNpmRoot, "@google", "gemini-cli-a2a-server", "dist", "a2a-server.mjs");
        if ((0, import_node_fs5.existsSync)(globalPath)) {
          return globalPath;
        }
      }
    } catch (err) {
      Logger.debug(`npm root -g failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    const altPaths = [
      "/home/linuxbrew/.linuxbrew/lib/node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs",
      "/opt/homebrew/lib/node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs",
      "/usr/local/lib/node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs",
      "/usr/lib/node_modules/@google/gemini-cli-a2a-server/dist/a2a-server.mjs"
    ];
    for (const p2 of altPaths) {
      if ((0, import_node_fs5.existsSync)(p2)) return p2;
    }
    throw new Error(
      "[ServerManager] Could not locate @google/gemini-cli-a2a-server. Install it with `npm install -g @google/gemini-cli-a2a-server` or specify `autoStart.serverPath`."
    );
  }
  makeReleaseFn(key, debug, captured) {
    let released = false;
    return async () => {
      if (released) return;
      released = true;
      const current = this.servers.get(key);
      if (current !== captured) {
        Logger.debug(`[ServerManager] Release ignored for ${key}: instance mismatch (possibly restarted)`);
        return;
      }
      captured.refCount--;
      Logger.debug(`Released server on ${key} (refCount=${captured.refCount})`);
      if (captured.refCount <= 0) {
        const exitPromise = new Promise((resolve) => {
          captured.proc.once("exit", () => resolve());
          captured.proc.once("error", () => resolve());
        });
        captured.shutdownPromise = exitPromise;
        captured.proc.kill();
        await Promise.race([
          exitPromise,
          new Promise((resolve) => setTimeout(resolve, 2e3))
          // 最大2秒待機
        ]);
        if (this.servers.get(key) === captured) {
          this.servers.delete(key);
        }
      }
    };
  }
  cleanupHandlers = [];
  registerCleanup(debug) {
    if (this.cleanupRegistered) return;
    this.cleanupRegistered = true;
    const exitHandler = () => {
      try {
        this.dispose();
      } catch (err) {
        Logger.error("[ServerManager] Error during dispose in exit handler:", err);
      }
    };
    const termHandler = () => this.cleanupAndExit("SIGTERM");
    const intHandler = () => this.cleanupAndExit("SIGINT");
    const uncaughtHandler = async (err) => {
      Logger.error("[ServerManager] Uncaught exception:", err);
      this.cleanupAndExit("SIGERROR");
      await this.disposeAndWait();
      process.exit(1);
    };
    const unhandledHandler = async (reason) => {
      Logger.error("[ServerManager] Unhandled rejection:", reason);
      this.cleanupAndExit("SIGERROR");
      await this.disposeAndWait();
      process.exit(1);
    };
    process.once("exit", exitHandler);
    process.once("SIGTERM", termHandler);
    process.once("SIGINT", intHandler);
    process.on("uncaughtException", uncaughtHandler);
    process.on("unhandledRejection", unhandledHandler);
    this.cleanupHandlers.push(
      { event: "exit", handler: exitHandler },
      { event: "SIGTERM", handler: termHandler },
      { event: "SIGINT", handler: intHandler },
      { event: "uncaughtException", handler: uncaughtHandler },
      { event: "unhandledRejection", handler: unhandledHandler }
    );
  }
  /**
   * すべてのサーバーを停止し、プロセスが終了するのを待機する。
   */
  async disposeAndWait(timeoutMs = 5e3) {
    const servers = Array.from(this.servers.values());
    this.dispose();
    const waitPromises = servers.map((server) => {
      if (!server.proc || server.proc.killed) return Promise.resolve();
      return new Promise((resolve) => {
        server.proc.once("exit", () => resolve());
        server.proc.once("error", () => resolve());
      });
    });
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        Logger.warn(`[ServerManager] disposeAndWait timed out after ${timeoutMs}ms`);
        resolve();
      }, timeoutMs);
    });
    await Promise.race([Promise.all(waitPromises), timeoutPromise]);
  }
  cleanupAndExit(signal) {
    Logger.info(`[ServerManager] Received ${signal || "exit"}, cleaning up...`);
    if (signal !== "SIGERROR") {
      try {
        this.dispose();
      } catch (err) {
        Logger.error("[ServerManager] Error during dispose in signal handler:", err);
      }
    }
    if (signal && signal !== "SIGERROR") {
      const h2 = this.cleanupHandlers.find((ch) => ch.event === signal);
      if (h2) process.off(signal, h2.handler);
      process.kill(process.pid, signal);
    }
  }
  dispose() {
    for (const [key, entry] of this.servers) {
      try {
        entry.proc.kill();
      } catch {
      }
    }
    this.servers.clear();
    for (const [key, inflight] of this.startingUp) {
      try {
        if (inflight.proc) {
          inflight.proc.kill();
        }
      } catch {
      }
    }
    this.startingUp.clear();
    this.cleanupRegistered = false;
    for (const { event, handler } of this.cleanupHandlers) {
      process.removeListener(event, handler);
    }
    this.cleanupHandlers = [];
    try {
      ConfigManager.getInstance().dispose();
    } catch (err) {
    }
  }
  /** テスト用: インスタンスをリセットする */
  static _reset() {
    if (_ServerManager.instance) {
      _ServerManager.instance.dispose();
      _ServerManager.instance.cachedNpmRoot = null;
    }
    _ServerManager.instance = void 0;
  }
};

// src/index.ts
var sharedSessionStore = new InMemorySessionStore();
if (process.env["NODE_ENV"] !== "production") {
  Logger.debug("PLUGIN SCRIPT LOADED");
}
function isGeminiA2AProvider(obj) {
  return obj !== null && typeof obj === "function" && typeof obj.languageModel === "function" && typeof obj.providerId === "string";
}
function createGeminiA2AProvider(options) {
  try {
    const logPayload = {};
    if (options) {
      for (const [key, value] of Object.entries(options)) {
        if (key === "token") {
          logPayload[key] = "***REDACTED***";
        } else if (key === "sessionStore" || key === "modelRegistry") {
          logPayload[key] = `<${key}>`;
        } else if (["string", "number", "boolean"].includes(typeof value) || value === null) {
          logPayload[key] = value;
        }
      }
    }
    Logger.info(`Provider factory called with options: ${JSON.stringify(logPayload)}`);
    const sessionStore = options?.sessionStore ?? sharedSessionStore;
    const modelRegistry = options?.modelRegistry ?? new StaticModelRegistry();
    const createModel = (modelId, settings) => {
      const { sessionStore: modelSessionStore, ...restSettings } = settings ?? {};
      if (modelSessionStore && modelSessionStore !== sessionStore) {
        throw new Error("Conflicting session stores detected: Per-model sessionStore overrides are not permitted. Please configure the sessionStore at the provider level.");
      }
      const sanitizedSettings = Object.fromEntries(
        Object.entries(restSettings).filter(([_, v2]) => v2 !== void 0)
      );
      const providerInstance = new OpenCodeGeminiA2AProvider(modelId, { ...options, sessionStore, ...sanitizedSettings });
      const shouldAutoStart = options?.autoStart !== false;
      if (shouldAutoStart) {
        const manager = ServerManager.getInstance();
        const debug = !!process.env["DEBUG_OPENCODE"];
        const providerOpts = providerInstance;
        const resolvedHost = providerOpts.options?.host ?? options?.host ?? "127.0.0.1";
        const resolvedPort = providerOpts.options?.port ?? options?.port ?? 41242;
        const autoStartConfig = typeof options?.autoStart === "object" ? { ...options.autoStart } : {};
        autoStartConfig.env = {
          USE_CCPA: "true",
          ...autoStartConfig.env,
          ...options?.token ? { GEMINI_API_KEY: options.token } : {}
        };
        Logger.debug(`AutoStart configured for model '${modelId}' on ${resolvedHost}:${resolvedPort}`);
        providerInstance._serverReady = manager.ensureRunning(
          resolvedPort,
          resolvedHost,
          modelId,
          autoStartConfig,
          debug
        ).catch((err) => {
          Logger.error(`Failed to auto-start server for model '${modelId}' on ${resolvedHost}:${resolvedPort}`, err);
          throw err;
        });
      }
      return providerInstance;
    };
    const models = modelRegistry.toRecord();
    const providerProperties = {
      provider: "opencode-geminicli-a2a",
      providerId: "opencode-geminicli-a2a",
      providerID: "opencode-geminicli-a2a",
      id: "opencode-geminicli-a2a",
      specificationVersion: "v2",
      models,
      languageModel: createModel,
      textEmbeddingModel: (modelId) => {
        throw new Error(`Embedding model '${modelId}' is not supported by Gemini CLI (A2A).`);
      },
      resetSession: async (sessionId) => {
        await sessionStore.resetSession(sessionId);
      }
    };
    for (const [key, value] of Object.entries(providerProperties)) {
      Object.defineProperty(createModel, key, {
        value,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    Object.defineProperty(createModel, "name", {
      value: "Gemini CLI (A2A)",
      writable: false,
      configurable: true,
      enumerable: true
    });
    Logger.info("Provider instance created successfully");
    if (!isGeminiA2AProvider(createModel)) {
      const missing = [];
      if (typeof createModel !== "function") missing.push("type is not function");
      if (typeof createModel.languageModel !== "function") missing.push("languageModel is not function");
      if (typeof createModel.providerId !== "string") missing.push("providerId is not string");
      throw new Error(`Runtime type check failed: createModel does not satisfy GeminiA2AProvider (${missing.join(", ")})`);
    }
    return createModel;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : void 0;
    Logger.error("CRITICAL ERROR IN FACTORY:", err);
    const initError = new Error(`ProviderInitError: ${message}`);
    initError.name = "ProviderInitError";
    initError.originalError = err;
    initError.stack = stack;
    throw initError;
  }
}
var createProvider = createGeminiA2AProvider;
var provider = createGeminiA2AProvider;
var opencodeGeminicliA2a = createGeminiA2AProvider;
var index_default = createGeminiA2AProvider;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OpenCodeGeminiA2AProvider,
  ServerManager,
  StaticModelRegistry,
  createGeminiA2AProvider,
  createProvider,
  opencodeGeminicliA2a,
  provider,
  sharedSessionStore
});
/*! Bundled license information:

node-fetch-native/dist/node.mjs:
  (**
  * @license
  * web-streams-polyfill v3.3.3
  * Copyright 2024 Mattias Buelens, Diwank Singh Tomer and other contributors.
  * This code is released under the MIT license.
  * SPDX-License-Identifier: MIT
  *)
  (*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)
  (*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)
  (*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)
*/
if (typeof module !== 'undefined' && module.exports) { const original = module.exports; const factory = original.default || original.createGeminiA2AProvider || original; if (typeof factory === 'function') { var _copy = function(src) { for (var _i = 0, _e = Object.entries(src); _i < _e.length; _i++) { var k = _e[_i][0], v = _e[_i][1]; if (k !== 'default') { try { Object.defineProperty(factory, k, { value: v, writable: true, configurable: true, enumerable: true }); } catch(_){} } } }; _copy(original); if (original.provider) { _copy(original.provider); } module.exports = factory; } }
