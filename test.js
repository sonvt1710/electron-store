import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import electron from 'electron';
import test from 'ava';
import {execa} from 'execa';

// See https://github.com/sindresorhus/conf for more extensive tests

const run = async file => {
	const {stdout} = await execa(electron, [file], {
		env: {
			ELECTRON_ENABLE_LOGGING: true,
			ELECTRON_ENABLE_STACK_DUMPING: true,
			ELECTRON_NO_ATTACH_CONSOLE: true,
		},
	});

	return stdout.trim();
};

test('main', async t => {
	const storagePath = await run('fixture.js');
	t.deepEqual(JSON.parse(fs.readFileSync(storagePath, 'utf8')), {ava: '🚀'});
	fs.unlinkSync(storagePath);
});

test('fails with a helpful error outside Electron', async t => {
	const {failed, stderr} = await execa(process.execPath, ['fixture-non-electron.js'], {reject: false});
	t.true(failed);
	t.true(stderr.includes('You can only use this module from the Electron main process or the renderer process, unless you pass an absolute `cwd`.'));
});

test('cwd option', async t => {
	const result = await run('fixture-cwd.js');
	const [defaultPath, storagePath, storagePath2] = result.split('\n', 3);
	t.is(storagePath, path.join(defaultPath, 'foo/config.json'));
	t.is(storagePath2, path.join(import.meta.dirname, 'bar/config.json'));
	fs.unlinkSync(storagePath);
	fs.unlinkSync(storagePath2);
});
