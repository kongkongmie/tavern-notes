import { buildUserInputNoteInput, createCaptureDedupeKey, shouldCaptureUserInput } from './capture-model.js';

export function prepareUserInputCapture(message, context, settings, captured = {}) {
    if (!shouldCaptureUserInput(message, settings)) return null;
    const key = createCaptureDedupeKey(context.chatId, context.messageId);
    const content = String(message.mes || '').trim();
    if (captured[key] === content) return null;
    const input = buildUserInputNoteInput({
        message,
        character: context.character,
        chat: context.chatId,
        messageId: context.messageId,
        collapseRepeated: settings.collapseRepeated,
    });
    if (context.isOpeningUserInput) input.tags = ['开局'];
    return {
        key,
        content,
        input,
    };
}
