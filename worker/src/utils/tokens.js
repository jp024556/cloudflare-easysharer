import { v4 as uuidv4 } from 'uuid';

export function generateResetToken() {
  return uuidv4().replace(/-/g, '');
}