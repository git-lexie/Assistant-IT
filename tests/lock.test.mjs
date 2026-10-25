import test from 'node:test';import assert from 'node:assert/strict';
import {hash,newSalt,failDelay} from '../lib/lockcrypto.js';
test('same code+salt gives same hash, different code differs',async()=>{const s=newSalt();assert.equal(await hash('1234abc',s),await hash('1234abc',s));assert.notEqual(await hash('1234abc',s),await hash('1234abd',s))});
test('salt changes hash',async()=>assert.notEqual(await hash('x1y2',newSalt()),await hash('x1y2',newSalt())));
test('hash hides the code',async()=>assert.ok(!(await hash('secret99',newSalt())).includes('secret99')));
test('lockout delay grows then caps',()=>{assert.equal(failDelay(4),0);assert.equal(failDelay(5),30);assert.equal(failDelay(6),60);assert.equal(failDelay(40),900)});
