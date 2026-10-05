import fs from 'node:fs';
import path from 'node:path';
import { createInitialBootState } from './boot';

describe('NETIZENS mobile boot contract', () => {
  it('renders shell state synchronously before hydration', () => {
    expect(createInitialBootState()).toEqual({ phase: 'shell', hydrated: false });
  });

  it('does not put Perception on the ordinary boot critical path', () => {
    const source = fs.readFileSync(path.join(__dirname, 'boot.ts'), 'utf8').toLowerCase();
    expect(source).not.toContain('perception');
  });
});
