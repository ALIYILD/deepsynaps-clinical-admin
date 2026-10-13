import {createClinicalAdminGateway} from '../../integration/clinical-admin-gateway.mjs';
// No trusted staging adapter has been supplied. Never infer identity from headers.
const gateway=createClinicalAdminGateway();
export default request=>gateway(request);
export const config={path:'/api/clinical-admin/*'};
