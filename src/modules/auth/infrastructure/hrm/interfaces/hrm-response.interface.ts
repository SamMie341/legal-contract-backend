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
    first_name_eng: string;
    last_name_eng: string;
    email: string;
    phone: string;
    status: string;
    office?: {
        department?: {
            department_name: string;
        };
        division?: {
            division_name: string;
        };
        unit?: {
            unit_name: string;
        }
        position?: {
            pos_name: string;
        };
    };
}

export interface HrmSyncResponse {
    data: {
        total_record: number;
        employees: HrmEmployee[];
    };
    duration: string;
}