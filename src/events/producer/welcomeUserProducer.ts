import { inngest, INNGEST_EVENTS } from '../../config/inngest.js';

export const publishWelcomeUserEvent = ({ id, email, status = true }) => {
  return inngest.send({
    name: INNGEST_EVENTS.WELCOME_USER,
    data: {
      id,
      email,
      status,
    },
  });
};
