export const CONTRACT_FIELD_LABELS: Record<string, string> = {
    title: 'ຊື່ສັນຍາ',
    contractTypeId: 'ລະຫັດປະເພດສັນຍາ',
    contractType: 'ປະເພດສັນຍາ',
    contractNumber: 'ເລກທີສັນຍາ',
    durationText: 'ອາຍຸສັນຍາ',
    durationMonths: 'ຈຳນວນເດືອນອາຍຸສັນຍາ',
    signedDate: 'ມື້ລົງລາຍເຊັນ',
    effectiveDate: 'ມື້ມີຜົນບັງຄັບໃຊ້',
    expirationDate: 'ມື້ສິ້ນສຸດສັນຍາ',
    contractValue: 'ມູນຄ່າສັນຍາ',
    currency: 'ສະກຸນເງິນ',
    equityOrCapitalContribution: 'ສັດສ່ວນຫຸ້ນ ຫຼື ຈຳນວນເງິນ ປະກອບທຶນ',
    sharePercentage: 'ເປີເຊັນຫຸ້ນ (%)',
    implementer: 'ຜູ້ຈັດຕັ້ງປະຕິບັດ',
    additionalDetails: 'ລາຍລະອຽດເພີ່ມເຕີມ',
    status: 'ສະຖານະສັນຍາ',
    notifyDaysBefore: 'ແຈ້ງເຕືອນລ່ວງໜ້າ (ວັນ)',
    isExpiryNotified: 'ສະຖານະການແຈ້ງເຕືອນ',
    deletedAt: 'ວັນທີລົບ',
    fileName: 'ຊື່ໄຟລ໌ແນບ',
    fileSize: 'ຂະໜາດໄຟລ໌',
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
    CREATE_CONTRACT: 'ສ້າງສັນຍາໃໝ່',
    UPDATE_CONTRACT: 'ແກ້ໄຂຂໍ້ມູນສັນຍາ',
    DELETE_CONTRACT: 'ລົບສັນຍາ',
    UPLOAD_ATTACHMENT: 'ອັບໂຫລດໄຟລ໌ແນບ',
    DOWNLOAD_ATTACHMENT: 'ດາວໂຫລດໄຟລ໌ແນບ',
    DELETE_ATTACHMENT: 'ລົບໄຟລ໌ແນບ',
    USER_PERMISSION_CHANGE: 'ແກ້ໄຂສິດຜູ້ໃຊ້',
};

const IGNORED_FIELDS = new Set([
    'updatedAt',
    'updatedById',
    'updatedBy',
    'createdAt',
    'createdById',
    'createdBy',
    'id',
    'contractId',
]);

export interface ContractFieldChange {
    field: string;
    fieldNameLo: string;
    oldValue: any;
    newValue: any;
}

export interface FormattedAuditLog {
    id: string;
    action: string;
    actionLabelLo: string;
    user: {
        id: string;
        fullName: string;
        employeeCode: string;
        department?: string | null;
        role?: string;
    } | null;
    ipAddress?: string | null;
    createdAt: Date;
    changes: ContractFieldChange[];
    oldValues?: any;
    newValues?: any;
}

export function formatContractAuditLog(log: any): FormattedAuditLog {
    const changes: ContractFieldChange[] = [];
    const oldVals = (log.oldValues as Record<string, any>) || {};
    const newVals = (log.newValues as Record<string, any>) || {};

    if (log.action === 'UPDATE_CONTRACT') {
        const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)]);
        for (const key of allKeys) {
            if (IGNORED_FIELDS.has(key)) continue;

            const oldV = oldVals[key];
            const newV = newVals[key];

            // Special comparison for relation object contractType
            if (key === 'contractType') {
                const oldName = oldV ? (oldV.nameLo || oldV.nameEn) : null;
                const newName = newV ? (newV.nameLo || newV.nameEn) : null;
                if (oldName !== newName) {
                    changes.push({
                        field: key,
                        fieldNameLo: CONTRACT_FIELD_LABELS[key] || key,
                        oldValue: oldName,
                        newValue: newName,
                    });
                }
                continue;
            }

            // Normalise date values if string or Date
            const oldSerialized = oldV !== undefined && oldV !== null ? JSON.stringify(oldV) : null;
            const newSerialized = newV !== undefined && newV !== null ? JSON.stringify(newV) : null;

            if (oldSerialized !== newSerialized) {
                changes.push({
                    field: key,
                    fieldNameLo: CONTRACT_FIELD_LABELS[key] || key,
                    oldValue: oldV ?? null,
                    newValue: newV ?? null,
                });
            }
        }
    } else if (log.action === 'UPLOAD_ATTACHMENT') {
        changes.push({
            field: 'fileName',
            fieldNameLo: CONTRACT_FIELD_LABELS.fileName || 'ຊື່ໄຟລ໌ແນບ',
            oldValue: null,
            newValue: newVals.fileName || null,
        });
    } else if (log.action === 'DELETE_ATTACHMENT') {
        changes.push({
            field: 'fileName',
            fieldNameLo: CONTRACT_FIELD_LABELS.fileName || 'ຊື່ໄຟລ໌ແນບ',
            oldValue: oldVals.fileName || null,
            newValue: null,
        });
    }

    return {
        id: log.id,
        action: log.action,
        actionLabelLo: AUDIT_ACTION_LABELS[log.action] || log.action,
        user: log.user
            ? {
                id: log.user.id,
                fullName: log.user.fullName,
                employeeCode: log.user.employeeCode,
                department: log.user.department || null,
                role: log.user.role || null,
            }
            : null,
        ipAddress: log.ipAddress || null,
        createdAt: log.createdAt,
        changes,
        oldValues: log.oldValues,
        newValues: log.newValues,
    };
}
