"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/manufacturers', async (req, res) => {
    try {
        const manufacturers = await prisma.manufacturer.findMany({
            where: { isActive: true },
            orderBy: { popularity: 'desc' },
            take: 20,
        });
        res.json(manufacturers);
    }
    catch (error) {
        console.error('Error fetching manufacturers:', error);
        res.status(500).json({ error: 'Failed to fetch manufacturers' });
    }
});
router.get('/weapon-types', async (req, res) => {
    try {
        const weaponTypes = [
            { value: 'ASSAULT_RIFLE', label: 'Assault Rifle' },
            { value: 'SMG', label: 'SMG' },
            { value: 'SNIPER_RIFLE', label: 'Sniper Rifle' },
            { value: 'PISTOL', label: 'Pistol' },
            { value: 'LMG', label: 'LMG' },
            { value: 'SHOTGUN', label: 'Shotgun' },
            { value: 'DMR', label: 'DMR' },
            { value: 'CARBINE', label: 'Carbine' },
        ];
        res.json(weaponTypes);
    }
    catch (error) {
        console.error('Error fetching weapon types:', error);
        res.status(500).json({ error: 'Failed to fetch weapon types' });
    }
});
router.get('/weapon-models', async (req, res) => {
    try {
        const { manufacturerId, weaponType } = req.query;
        const weaponModels = await prisma.weaponModel.findMany({
            where: {
                ...(manufacturerId && { manufacturerId: manufacturerId }),
                ...(weaponType && { weaponType: weaponType }),
                isActive: true,
            },
            include: {
                manufacturer: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(weaponModels);
    }
    catch (error) {
        console.error('Error fetching weapon models:', error);
        res.status(500).json({ error: 'Failed to fetch weapon models' });
    }
});
router.get('/check', async (req, res) => {
    try {
        const { manufacturerName, weaponType } = req.query;
        if (!manufacturerName || !weaponType) {
            return res.status(400).json({
                error: 'Both manufacturerName and weaponType are required'
            });
        }
        const manufacturer = await prisma.manufacturer.findFirst({
            where: {
                name: manufacturerName,
                isActive: true,
            },
        });
        if (!manufacturer) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }
        const weaponModels = await prisma.weaponModel.findMany({
            where: {
                manufacturerId: manufacturer.id,
                weaponType: weaponType,
                isActive: true,
            },
            include: {
                compatibleParts: {
                    include: {
                        part: true,
                    },
                    orderBy: {
                        compatibilityScore: 'desc',
                    },
                },
            },
        });
        if (weaponModels.length === 0) {
            const allParts = await prisma.part.findMany({
                where: { isActive: true },
                take: 20,
            });
            return res.json({
                manufacturer: manufacturer.name,
                weaponType,
                hasSpecificModel: false,
                compatibility: {
                    'Magazines': allParts.filter(p => p.partType === 'MAGAZINE').slice(0, 5).map(p => ({
                        name: p.name,
                        manufacturer: p.manufacturer,
                        compatibility: '85%',
                        price: p.price ? `$${p.price}` : 'N/A',
                        partId: p.id,
                    })),
                    'Barrels': allParts.filter(p => p.partType === 'BARREL').slice(0, 5).map(p => ({
                        name: p.name,
                        manufacturer: p.manufacturer,
                        compatibility: '90%',
                        price: p.price ? `$${p.price}` : 'N/A',
                        partId: p.id,
                    })),
                    'Hop-up Units': allParts.filter(p => p.partType === 'HOP_UP').slice(0, 5).map(p => ({
                        name: p.name,
                        manufacturer: p.manufacturer,
                        compatibility: '85%',
                        price: p.price ? `$${p.price}` : 'N/A',
                        partId: p.id,
                    })),
                },
            });
        }
        const weaponModel = weaponModels[0];
        const compatibilityByCategory = {};
        for (const compat of weaponModel.compatibleParts) {
            const categoryName = formatPartType(compat.part.partType);
            if (!compatibilityByCategory[categoryName]) {
                compatibilityByCategory[categoryName] = [];
            }
            compatibilityByCategory[categoryName].push({
                name: compat.part.name,
                manufacturer: compat.part.manufacturer,
                compatibility: `${compat.compatibilityScore}%`,
                price: compat.part.price ? `$${compat.part.price}` : 'N/A',
                partId: compat.part.id,
                requiresModification: compat.requiresModification,
                notes: compat.notes,
            });
        }
        return res.json({
            manufacturer: manufacturer.name,
            weaponType,
            weaponModel: weaponModel.name,
            hasSpecificModel: true,
            compatibility: compatibilityByCategory,
        });
    }
    catch (error) {
        console.error('Error checking compatibility:', error);
        res.status(500).json({ error: 'Failed to check compatibility' });
    }
});
function formatPartType(partType) {
    const typeMap = {
        'MAGAZINE': 'Magazines',
        'BARREL': 'Barrels',
        'HOP_UP': 'Hop-up Units',
        'GEARBOX': 'Gearboxes',
        'MOTOR': 'Motors',
        'BATTERY': 'Batteries',
        'OPTIC': 'Optics',
        'STOCK': 'Stocks',
        'GRIP': 'Grips',
        'SUPPRESSOR': 'Suppressors',
        'RAIL_SYSTEM': 'Rail Systems',
    };
    return typeMap[partType] || partType;
}
exports.default = router;
//# sourceMappingURL=compatibility.js.map