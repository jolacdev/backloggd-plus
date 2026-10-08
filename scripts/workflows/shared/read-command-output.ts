import { execFileSync } from 'node:child_process';

/** Read command output as UTF-8 text; command failures throw. */
export const readCommandOutput = (command: string, args: string[]) => execFileSync(command, args, { encoding: 'utf8' });
