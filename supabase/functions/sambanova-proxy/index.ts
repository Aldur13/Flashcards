import { handleSambaNovaProxy } from './proxy.mjs';

Deno.serve(request => handleSambaNovaProxy(request));
