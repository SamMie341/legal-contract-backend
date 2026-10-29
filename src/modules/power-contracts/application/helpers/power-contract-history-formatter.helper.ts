export const POWER_CONTRACT_FIELD_LABELS: Record<string, string> = {
    contractType: 'ປະເພດສັນຍາ (ຊື້/ຂາຍ)',
    projectName: 'ຊື່ໂຄງການ',
    projectTypeOrCustomer: 'ປະເພດໂຄງການ / ລູກຄ້າ',
    contractNumber: 'ເລກທີສັນຍາ',
    durationText: 'ອາຍຸສັນຍາ',
    durationMonths: 'ຈຳນວນເດືອນອາຍຸສັນຍາ',
    signedDate: 'ມື້ລົງລາຍເຊັນ',
    effectiveDate: 'ມື້ມີຜົນບັງຄັບໃຊ້',
    expirationDate: 'ມື້ສິ້ນສຸດສັນຍາ',
    installedCapacity: 'ກຳລັງການຕິດຕັ້ງ',
    capacityValue: 'ຄ່າກຳລັງການຕິດຕັ້ງ (MW)',
    capacityUnit: 'ຫົວໜ່ວຍກຳລັງການຕິດຕັ້ງ',
    projectLocation: 'ທີ່ຕັ້ງໂຄງການ',
    tariff: 'ລາຄາໄຟຟ້າ',
    tariffValue: 'ຄ່າລາຄາໄຟຟ້າ',
    tariffCurrency: 'ສະກຸນເງິນລາຄາໄຟ',
    additionalDetails: 'ລາຍລະອຽດເພີ່ມເຕີມ',
    status: 'ສະຖານະສັນຍາ',
    notifyDaysBefore: 'ແຈ້ງເຕືອນລ່ວງໜ້າ (ວັນ)',
    isExpiryNotified: 'ສະຖານະການແຈ້ງເຕືອນ',
    deletedAt: 'ວັນທີລົບ',
    fileName: 'ຊື່ໄຟລ໌ແນບ',
    fileSize: 'ຂະໜາດໄຟລ໌',
};

export const POWER_AUDIT_ACTION_LABELS: Record<string, string> = {
    CREATE_POWER_CONTRACT: 'ສ້າງສັນຍາຊື້-ຂາຍໄຟໃໝ່',
    UPDATE_POWER_CONTRACT: 'ແກ້ໄຂຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟ',
    DELETE_POWER_CONTRACT: 'ລົບສັນຍາຊື້-ຂາຍໄຟ',
    UPLOAD_POWER_ATTACHMENT: 'ອັບໂຫລດໄຟລ໌ແນບສັນຍາໄຟຟ້າ',
    DOWNLOAD_POWER_ATTACHMENT: 'ດາວໂຫລດໄຟລ໌ແນບສັນຍາໄຟຟ້າ',
    DELETE_POWER_ATTACHMENT: 'ລົບໄຟລ໌ແນບສັນຍາໄຟຟ້າ',
};

const IGNORED_FIELDS = new Set([
    'updatedAt',
    'updatedById',
    'updatedBy',
    'createdAt',
    'createdById',
    'createdBy',
    'id',
    'powerContractId',
]);

export interface PowerContractFieldChange {
    field: string;
    fieldNameLo: string;
    oldValue: any;
    newValue: any;
}

export interface FormattedPowerAuditLog {
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
    changes: PowerContractFieldChange[];
    oldValues?: any;
    newValues?: any;
}

export function formatPowerContractAuditLog(log: any): FormattedPowerAuditLog {
    const changes: PowerContractFieldChange[] = [];
    const oldVals = (log.oldValues as Record<string, any>) || {};
    const newVals = (log.newValues as Record<string, any>) || {};

    if (log.action === 'UPDATE_POWER_CONTRACT') {
        const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)]);
        for (const key of allKeys) {
            if (IGNORED_FIELDS.has(key)) continue;

            const oldV = oldVals[key];
            const newV = newVals[key];

            // Normalise date values if string or Date
            const oldSerialized = oldV !== undefined && oldV !== null ? JSON.stringify(oldV) : null;
            const newSerialized = newV !== undefined && newV !== null ? JSON.stringify(newV) : null;

            if (oldSerialized !== newSerialized) {
                changes.push({
                    field: key,
                    fieldNameLo: POWER_CONTRACT_FIELD_LABELS[key] || key,
                    oldValue: oldV ?? null,
                    newValue: newV ?? null,
                });
            }
        }
    } else if (log.action === 'CREATE_POWER_CONTRACT') {
        const createFields = [
            'projectName',
            'contractType',
            'projectTypeOrCustomer',
            'contractNumber',
            'installedCapacity',
            'tariff',
            'durationText',
            'effectiveDate',
            'expirationDate',
        ];
        for (const key of createFields) {
            if (newVals[key] !== undefined && newVals[key] !== null && newVals[key] !== '') {
                changes.push({
                    field: key,
                    fieldNameLo: POWER_CONTRACT_FIELD_LABELS[key] || key,
                    oldValue: null,
                    newValue: newVals[key],
                });
            }
        }
    } else if (log.action === 'UPLOAD_POWER_ATTACHMENT') {
        changes.push({
            field: 'fileName',
            fieldNameLo: POWER_CONTRACT_FIELD_LABELS.fileName || 'ຊື່ໄຟລ໌ແນບ',
            oldValue: null,
            newValue: newVals.fileName || null,
        });
        if (newVals.fileSize) {
            changes.push({
                field: 'fileSize',
                fieldNameLo: POWER_CONTRACT_FIELD_LABELS.fileSize || 'ຂະໜາດໄຟລ໌',
                oldValue: null,
                newValue: `${(Number(newVals.fileSize) / 1024).toFixed(1)} KB`,
            });
        }
    } else if (log.action === 'DELETE_POWER_ATTACHMENT') {
        changes.push({
            field: 'fileName',
            fieldNameLo: POWER_CONTRACT_FIELD_LABELS.fileName || 'ຊື່ໄຟລ໌ແນບ',
            oldValue: oldVals.fileName || null,
            newValue: null,
        });
    }

    return {
        id: log.id,
        action: log.action,
        actionLabelLo: POWER_AUDIT_ACTION_LABELS[log.action] || log.action,
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

