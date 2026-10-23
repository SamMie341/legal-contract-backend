import { HrmEmployee, HrmDepartmentItem } from '../../infrastructure/hrm/interfaces/hrm-response.interface.js';

export const HRM_API_SERVICE = Symbol('HRM_API_SERVICE');

export interface IHrmApiService {
    login(username: string, password: string): Promise<string>;
    getEmployeeByCode(token: string, empCode: string): Promise<HrmEmployee>;
    getDepartments(token: string): Promise<HrmDepartmentItem[]>;
}
