export interface HrmLoginResponse {
    token: string;
    user: {
        id: number;
        username: string;
    };
}

export interface HrmEmployee {
    emp_id: number;
    emp_code: string;
    first_name_la: string;
    last_name_la: string;
    first_name_eng?: string;
    last_name_eng?: string;
    nick_name?: string;
    email?: string;
    phone?: string;
    status?: string;
    gender?: string;
    image?: string;
    office?: {
        department_id?: number;
        division_id?: number;
        unit_id?: number;
        department?: {
            department_id?: number;
            department_code?: string;
            department_name: string;
            department_status?: string;
        };
        division?: {
            division_id?: number;
            division_code?: string;
            division_name: string;
            division_status?: string;
        };
        unit?: {
            unit_id?: number;
            unit_code?: string;
            unit_name: string;
            unit_status?: string;
        };
        position?: {
            pos_id?: number;
            pos_code?: number;
            pos_name: string;
            pos_status?: string;
        };
    };
    positionCode?: {
        pos_code_id?: number;
        pos_code_name?: string;
    };
}

export interface HrmSyncResponse {
    data: {
        total_record: number;
        employees: HrmEmployee[];
    };
    duration: string;
}

export interface HrmDepartmentItem {
    department_id: number;
    department_code: string;
    department_name: string;
    department_phone?: string;
    department_email?: string;
    department_status: string;
    created_by?: number;
    created_at?: string;
    updated_at?: string;
}

export interface HrmDepartmentsResponse {
    message: string;
    statusCode: number;
    data: HrmDepartmentItem[];
}
