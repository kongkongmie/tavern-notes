import assert from 'node:assert/strict';
import { prepareUserInputCapture } from '../core/user-input-model.js';

const message = { is_user: true, mes: '你好，这是开局。' };
const settings = { enabled: true, collapseRepeated: true, ignoreExact: [], ignorePrefixes: [] };
const baseContext = {
    chatId: 'chat-a',
    character: { id: 'character-a', name: '角色 A' },
};

const opening = prepareUserInputCapture(message, {
    ...baseContext,
    messageId: 1,
    isOpeningUserInput: true,
}, settings);
assert.deepEqual(opening.input.tags, ['开局']);

const later = prepareUserInputCapture({ ...message, mes: '后续输入。' }, {
    ...baseContext,
    messageId: 3,
    isOpeningUserInput: false,
}, settings);
assert.equal(later.input.tags, undefined);

const captured = { [opening.key]: opening.content };
assert.equal(prepareUserInputCapture(message, {
    ...baseContext,
    messageId: 1,
    isOpeningUserInput: true,
}, settings, captured), null);

console.log('opening user-input tag: ok');
