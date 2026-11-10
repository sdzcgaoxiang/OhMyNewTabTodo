#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const command = args.shift();
const json = args.includes('--json');
const options = {};
const positional = [];
try {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') continue;
    if (arg.startsWith('--')) {
      if (
        !['--file', '--status', '--board', '--due'].includes(arg) ||
        !args[i + 1] ||
        args[i + 1].startsWith('--')
      )
        throw new Error(`Invalid option: ${arg}`);
      options[arg.slice(2)] = args[++i];
    } else positional.push(arg);
  }
  const configDir = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'omntt');
  if (command === 'configure') {
    const file = options.file || positional[0];
    if (!file) throw new Error('Specify a file path');
    await mkdir(configDir, { recursive: true, mode: 0o700 });
    await writeFile(
      join(configDir, 'config.json'),
      JSON.stringify({ file: resolve(file) }) + '\n',
      { mode: 0o600 },
    );
    console.log(json ? JSON.stringify({ file: resolve(file) }) : `File: ${resolve(file)}`);
  } else {
    let configured;
    try {
      if (!options.file && !process.env.OMNTT_FILE)
        configured = JSON.parse(await readFile(join(configDir, 'config.json'), 'utf8')).file;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const file = options.file || process.env.OMNTT_FILE || configured;
    if (!file) throw new Error('Specify --file or set OMNTT_FILE');
    const snapshot = JSON.parse(await readFile(file, 'utf8'));
    const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
    if (
      snapshot?.format !== 'ohmynewtabtodo.readonly' ||
      snapshot.formatVersion !== 1 ||
      !object(snapshot.data?.boards) ||
      !object(snapshot.data?.cards) ||
      !Array.isArray(snapshot.data?.boardOrder) ||
      !snapshot.data.boardOrder.every(
        (id) => typeof id === 'string' && Object.hasOwn(snapshot.data.boards, id),
      ) ||
      !object(snapshot.source) ||
      typeof snapshot.source.instanceId !== 'string' ||
      !snapshot.source.instanceId ||
      typeof snapshot.source.appVersion !== 'string' ||
      !Number.isSafeInteger(snapshot.source.revision) ||
      snapshot.source.revision < 0 ||
      typeof snapshot.exportedAt !== 'string' ||
      !Number.isFinite(Date.parse(snapshot.exportedAt)) ||
      Object.entries(snapshot.data.boards).some(
        ([id, board]) =>
          !object(board) ||
          board.id !== id ||
          typeof board.title !== 'string' ||
          !Array.isArray(board.cardIds) ||
          !board.cardIds.every((cardId) => typeof cardId === 'string'),
      ) ||
      Object.entries(snapshot.data.cards).some(
        ([id, card]) =>
          !object(card) ||
          card.id !== id ||
          typeof card.title !== 'string' ||
          typeof card.completed !== 'boolean',
      )
    )
      throw new Error('Unsupported or invalid snapshot');
    const { boards, cards, boardOrder } = snapshot.data;
    let result;
    if (command === 'status')
      result = {
        ...snapshot.source,
        exportedAt: snapshot.exportedAt,
        formatVersion: snapshot.formatVersion,
      };
    else if (command === 'boards')
      result = [...boardOrder, ...Object.keys(boards).filter((id) => !boardOrder.includes(id))]
        .map((id) => boards[id])
        .filter(Boolean);
    else if (command === 'task') {
      result = Object.hasOwn(cards, positional[0] ?? '') ? cards[positional[0]] : undefined;
      if (!result) throw new Error('Task not found');
    } else if (command === 'tasks') {
      const status = options.status || 'all';
      if (!['all', 'pending', 'completed'].includes(status)) throw new Error('Invalid status');
      if (options.due && options.due !== 'today') throw new Error('Invalid due filter');
      if (options.board && !Object.hasOwn(boards, options.board))
        throw new Error('Board not found');
      const ids = options.board ? boards[options.board].cardIds : Object.keys(cards);
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      result = ids
        .map((id) => cards[id])
        .filter(Boolean)
        .filter(
          (card) =>
            status === 'all' ||
            (status === 'completed' ? card.completed === true : card.completed !== true),
        )
        .filter((card) => !options.due || card.dueDate === today);
    } else throw new Error('Usage: omntt boards|tasks|task|status|configure');
    console.log(JSON.stringify(result, null, json ? 0 : 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
