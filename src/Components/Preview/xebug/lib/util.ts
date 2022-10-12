import uniqId from 'licia/uniqId';
import random from 'licia/random';

import isStr from 'licia/isStr';
import copy from 'licia/copy';
import toArr from 'licia/toArr';
import keys from 'licia/keys';
import xpath from 'licia/xpath';
import each from 'licia/each';
import Emitter from 'licia/Emitter';

import last from 'licia/last';
import Url from 'licia/Url';
import isEmpty from 'licia/isEmpty';
import trim from 'licia/trim';
import now from 'licia/now';
import startWith from 'licia/startWith';
import toNum from 'licia/toNum';

import map from 'licia/map';
import filter from 'licia/filter';
import contain from 'licia/contain';

import toStr from 'licia/toStr';
import isNull from 'licia/isNull';
import isArr from 'licia/isArr';
import isFn from 'licia/isFn';
import isEl from 'licia/isEl';
import isErr from 'licia/isErr';
import isRegExp from 'licia/isRegExp';
import getType from 'licia/type';
import getKeys from 'licia/keys';
import toSrc from 'licia/toSrc';
import allKeys from 'licia/allKeys';
import isNative from 'licia/isNative';
import getProto from 'licia/getProto';
import isSymbol from 'licia/isSymbol';
import has from 'licia/has';

import $ from 'licia/$';
import html from 'licia/html';
import unique from 'licia/unique';
import lowerCase from 'licia/lowerCase';
import concat from 'licia/concat';

import safeGet from 'licia/safeGet';
import isBool from 'licia/isBool';
import defaults from 'licia/defaults';

import once from 'licia/once';
import safeStorage from 'licia/safeStorage';
import jsonClone from 'licia/jsonClone';
import noop from 'licia/noop';

import rmCookie from 'licia/rmCookie';
import decodeUriComponent from 'licia/decodeUriComponent';

import h from 'licia/h';
import isMobile from 'licia/isMobile';
import fetch from 'licia/fetch';

import fnParams from 'licia/fnParams';
import uncaught from 'licia/uncaught';
import stackTrace from 'licia/stackTrace';
import uuid from 'licia/uuid';

const prefix = random(1000, 9999) + '.';

export function createId() {
  return uniqId(prefix);
}

export {
  uniqId,
  random,
  isStr,
  copy,
  toArr,
  keys,
  xpath,
  each,
  Emitter,
  last,
  Url,
  isEmpty,
  trim,
  now,
  startWith,
  toNum,
  map,
  filter,
  contain,
  toStr,
  isNull,
  isArr,
  isFn,
  isEl,
  isErr,
  isRegExp,
  getType,
  getKeys,
  toSrc,
  allKeys,
  isNative,
  getProto,
  isSymbol,
  has,
  $,
  html,
  unique,
  lowerCase,
  concat,
  safeGet,
  isBool,
  defaults,
  once,
  safeStorage,
  jsonClone,
  noop,
  rmCookie,
  decodeUriComponent,
  h,
  isMobile,
  fetch,
  fnParams,
  uncaught,
  stackTrace,
  uuid,
};