import { describe, expect, it } from 'vitest';
import scriptData from '../src/scraper/lib/utils/scriptData.js';

describe('script data parser', () => {
  it('parses service request object literals without dynamic code generation', () => {
    const html = "; var AF_dataServiceRequests = {'ds:0' : {id:'abc',request:[[null,1]],enabled:true},'ds:1':{id:'xyz',request:[]}}; var AF_initDataChunkQueue";

    expect(scriptData.parseServiceRequests(html)).toEqual({
      'ds:0': { id: 'abc', request: [[null, 1]], enabled: true },
      'ds:1': { id: 'xyz', request: [] }
    });
  });
});
