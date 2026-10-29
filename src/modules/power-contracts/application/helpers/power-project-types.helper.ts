export interface PowerProjectTypeOption {
    id: string;
    nameLo: string;
    nameEn: string;
    description?: string;
}

/**
 * 5 ປະເພດໂຄງການສັນຍາຊື້ໄຟຟ້າ ຕາມຂໍ້ກຳນົດຂອງພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ (EDL)
 */
export const POWER_PURCHASE_PROJECT_TYPES: PowerProjectTypeOption[] = [
    {
        id: 'HYDRO',
        nameLo: 'ໄຟຟ້ານໍ້າຕົກ',
        nameEn: 'Hydropower',
        description: 'ໂຄງການຜະລິດໄຟຟ້າຈາກພະລັງງານນ້ຳຕົກ / ເຂື່ອນໄຟຟ້າ',
    },
    {
        id: 'SOLAR',
        nameLo: 'ພະລັງງານແສງຕາເວັນ',
        nameEn: 'Solar Power',
        description: 'ໂຄງການຜະລິດໄຟຟ້າຈາກພະລັງງານແສງຕາເວັນ (Solar Farm / Floating Solar)',
    },
    {
        id: 'WIND',
        nameLo: 'ພະລັງງານລົມ',
        nameEn: 'Wind Power',
        description: 'ໂຄງການຜະລິດໄຟຟ້າຈາກພະລັງງານລົມ (Wind Farm)',
    },
    {
        id: 'THERMAL',
        nameLo: 'ພະລັງງານຄວາມຮ້ອນ / ຖ່ານຫີນ',
        nameEn: 'Thermal / Coal Power',
        description: 'ໂຄງການຜະລິດໄຟຟ້າຈາກພະລັງງານຄວາມຮ້ອນ ຫຼື ຖ່ານຫີນ',
    },
    {
        id: 'BIOMASS',
        nameLo: 'ພະລັງງານຊີວະມວນ',
        nameEn: 'Biomass Power',
        description: 'ໂຄງການຜະລິດໄຟຟ້າຈາກພະລັງງານຊີວະມວນ ຫຼື ຂີ້ເຫຍື້ອ',
    },
    {
        id: 'OTHER',
        nameLo: 'ອື່ນໆ',
        nameEn: 'Other',
        description: 'ປະເພດໂຄງການອື່ນໆ',
    },
];

