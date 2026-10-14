import {healthResponse} from '../../integration/runtime-health.mjs';
export default request=>healthResponse(request.method);
export const config={path:'/healthz'};
