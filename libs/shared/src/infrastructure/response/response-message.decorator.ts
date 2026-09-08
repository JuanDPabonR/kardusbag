import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'custom_response_message';
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

export const BYPASS_RESPONSE_TRANSFORM_KEY = 'bypass_response_transform';
export const BypassResponseTransform = () =>
  SetMetadata(BYPASS_RESPONSE_TRANSFORM_KEY, true);
